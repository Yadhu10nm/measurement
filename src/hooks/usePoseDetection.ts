import { useState, useEffect, useRef, useCallback } from 'react'
import { poseLandmarkerService } from '../services/mediapipe/poseDetector'
import { analyzeFrameQuality } from '../services/opencv/imageProcessor'
import { evaluateBodyPostureAndQuality } from '../services/opencv/qualityAnalyzer'
import { playCountdownBeep, playCaptureSuccessChime } from '../utils/soundEffects'
import type { Landmark, QualityAnalysisResult } from '../types/landmark'

export interface UsePoseDetectionOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>
  enabled: boolean
  modelType?: 'full' | 'lite'
  autoCaptureInitial?: boolean
  onCaptureComplete?: (frames: Landmark[][], thumbnailDataUrl: string) => void
}

export function usePoseDetection({
  videoRef,
  enabled,
  modelType = 'full',
  autoCaptureInitial = true,
  onCaptureComplete,
}: UsePoseDetectionOptions) {
  const [isModelReady, setIsModelReady] = useState(false)
  const [modelError, setModelError] = useState<string | null>(null)
  const [fps, setFps] = useState(0)
  const [landmarks, setLandmarks] = useState<Landmark[] | null>(null)
  const [allDetectedPoses, setAllDetectedPoses] = useState<Landmark[][]>([])
  const [qualityResult, setQualityResult] = useState<QualityAnalysisResult | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [captureProgress, setCaptureProgress] = useState(0) // 0 to 100%
  const [autoCaptureEnabled, setAutoCaptureEnabled] = useState(autoCaptureInitial)
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null)

  const animationFrameId = useRef<number | null>(null)
  const lastVideoTime = useRef<number>(-1)
  const frameCount = useRef<number>(0)
  const lastFpsUpdate = useRef<number>(performance.now())

  // Multi-frame capture buffer
  const capturedFramesBuffer = useRef<Landmark[][]>([])
  const targetCaptureFrames = 8 // Collect 8 valid frames

  // Auto-capture steady timer tracking
  const steadyStartTime = useRef<number | null>(null)
  const countdownIntervalRef = useRef<number | null>(null)
  const isCountingDownRef = useRef<boolean>(false)
  const lastBeepSecond = useRef<number | null>(null)

  // Initialize model
  useEffect(() => {
    let isCancelled = false

    async function initModel() {
      try {
        setIsModelReady(false)
        setModelError(null)
        await poseLandmarkerService.initialize({ modelType })
        if (!isCancelled) {
          setIsModelReady(true)
        }
      } catch (err: any) {
        if (!isCancelled) {
          setModelError(err?.message || 'Failed to initialize Pose Landmarker')
        }
      }
    }

    initModel()

    return () => {
      isCancelled = true
    }
  }, [modelType])

  const startAutoCaptureCountdown = useCallback(() => {
    if (isCountingDownRef.current || isCapturing) return
    isCountingDownRef.current = true
    let remaining = 3
    setCountdownSeconds(remaining)
    playCountdownBeep(580)
    lastBeepSecond.current = remaining

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
    }

    countdownIntervalRef.current = window.setInterval(() => {
      remaining -= 1
      if (remaining > 0) {
        setCountdownSeconds(remaining)
        playCountdownBeep(580 + (3 - remaining) * 100)
      } else {
        // Countdown reached 0 -> Start capture!
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current)
          countdownIntervalRef.current = null
        }
        isCountingDownRef.current = false
        setCountdownSeconds(null)
        playCaptureSuccessChime()
        // Trigger capture buffer
        capturedFramesBuffer.current = []
        setCaptureProgress(0)
        setIsCapturing(true)
      }
    }, 1000)
  }, [isCapturing])

  const cancelAutoCaptureCountdown = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }
    isCountingDownRef.current = false
    setCountdownSeconds(null)
    steadyStartTime.current = null
    lastBeepSecond.current = null
  }, [])

  // Continuous frame processing loop
  useEffect(() => {
    if (!enabled || !isModelReady) {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current)
      }
      cancelAutoCaptureCountdown()
      return
    }

    let isRunning = true

    // Offscreen canvas for OpenCV quality sampling
    const offscreenCanvas = document.createElement('canvas')
    offscreenCanvas.width = 160
    offscreenCanvas.height = 120
    const offscreenCtx = offscreenCanvas.getContext('2d', { willReadFrequently: true })

    let qualityCheckThrottleCounter = 0

    const renderLoop = (now: number) => {
      if (!isRunning) return

      const video = videoRef.current
      if (video && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && !video.paused) {
        // Measure FPS
        frameCount.current++
        if (now - lastFpsUpdate.current >= 1000) {
          setFps(Math.round((frameCount.current * 1000) / (now - lastFpsUpdate.current)))
          frameCount.current = 0
          lastFpsUpdate.current = now
        }

        if (video.currentTime !== lastVideoTime.current) {
          lastVideoTime.current = video.currentTime

          // Run MediaPipe pose detection
          const detection = poseLandmarkerService.detectVideoFrame(video, now)
          const primaryPose = detection.smoothedPrimaryPose
          
          setLandmarks(primaryPose)
          setAllDetectedPoses(detection.allPoses)

          // Throttle OpenCV image quality analysis (every 4 frames) to prevent CPU hogging
          qualityCheckThrottleCounter++
          if (qualityCheckThrottleCounter % 4 === 0 && offscreenCtx) {
            offscreenCtx.drawImage(video, 0, 0, 160, 120)
            const imgQuality = analyzeFrameQuality(offscreenCanvas)
            const quality = evaluateBodyPostureAndQuality({
              landmarks: primaryPose,
              imageQuality: imgQuality,
              detectedPersonCount: detection.personCount,
              frameWidth: video.videoWidth || 640,
              frameHeight: video.videoHeight || 480,
            })
            setQualityResult(quality)

            // Auto-Capture Handling:
            // When user is in optimal alignment (isReadyForCapture) and auto-capture is enabled
            if (autoCaptureEnabled && !isCapturing) {
              if (quality.isReadyForCapture) {
                if (!steadyStartTime.current) {
                  steadyStartTime.current = now
                } else if (now - steadyStartTime.current >= 600 && !isCountingDownRef.current) {
                  // After holding steady for 600ms, start the 3-2-1 auto-capture countdown!
                  startAutoCaptureCountdown()
                }
              } else {
                // Posture broke -> reset countdown immediately
                if (isCountingDownRef.current || steadyStartTime.current) {
                  cancelAutoCaptureCountdown()
                }
              }
            }

            // If user initiated capture or auto-capture fired, buffer valid frames
            if (isCapturing && primaryPose && quality.isReadyForCapture) {
              capturedFramesBuffer.current.push([...primaryPose])
              const count = capturedFramesBuffer.current.length
              setCaptureProgress(Math.min(100, Math.round((count / targetCaptureFrames) * 100)))

              if (count >= targetCaptureFrames) {
                // Done capturing
                setIsCapturing(false)
                setCaptureProgress(100)
                cancelAutoCaptureCountdown()

                // Capture snapshot thumbnail
                const snapshotCanvas = document.createElement('canvas')
                snapshotCanvas.width = video.videoWidth || 640
                snapshotCanvas.height = video.videoHeight || 480
                const snapCtx = snapshotCanvas.getContext('2d')
                if (snapCtx) {
                  snapCtx.drawImage(video, 0, 0, snapshotCanvas.width, snapshotCanvas.height)
                }
                const thumbDataUrl = snapshotCanvas.toDataURL('image/jpeg', 0.8)

                if (onCaptureComplete) {
                  onCaptureComplete(capturedFramesBuffer.current, thumbDataUrl)
                }
              }
            }
          }
        }
      }

      animationFrameId.current = requestAnimationFrame(renderLoop)
    }

    animationFrameId.current = requestAnimationFrame(renderLoop)

    return () => {
      isRunning = false
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current)
      }
      cancelAutoCaptureCountdown()
    }
  }, [
    enabled, 
    isModelReady, 
    isCapturing, 
    autoCaptureEnabled, 
    videoRef, 
    onCaptureComplete, 
    startAutoCaptureCountdown, 
    cancelAutoCaptureCountdown
  ])

  const triggerCapture = useCallback(() => {
    cancelAutoCaptureCountdown()
    playCaptureSuccessChime()
    capturedFramesBuffer.current = []
    setCaptureProgress(0)
    setIsCapturing(true)
  }, [cancelAutoCaptureCountdown])

  const cancelCapture = useCallback(() => {
    cancelAutoCaptureCountdown()
    setIsCapturing(false)
    setCaptureProgress(0)
    capturedFramesBuffer.current = []
  }, [cancelAutoCaptureCountdown])

  return {
    isModelReady,
    modelError,
    fps,
    landmarks,
    allDetectedPoses,
    qualityResult,
    isCapturing,
    captureProgress,
    autoCaptureEnabled,
    setAutoCaptureEnabled,
    countdownSeconds,
    triggerCapture,
    cancelCapture,
  }
}
