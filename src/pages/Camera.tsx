import React, { useState, useEffect, useCallback } from 'react'
import { useCamera } from '../hooks/useCamera'
import { usePoseDetection } from '../hooks/usePoseDetection'
import { SkeletonCanvas } from '../components/camera/SkeletonCanvas'
import { SilhouetteOverlay } from '../components/camera/SilhouetteOverlay'
import { QualityIndicator } from '../components/camera/QualityIndicator'
import { CameraControls } from '../components/camera/CameraControls'
import { CountdownOverlay } from '../components/camera/CountdownOverlay'
import { computeBodyMeasurements } from '../services/measurement/measurementEngine'
import { generateAllGarmentRecommendations } from '../services/sizing/sizeMatcher'
import type { UserProfile } from '../types/profile'
import type { Landmark } from '../types/landmark'
import type { MeasurementRecord } from '../types/sizing'
import { AlertCircle, CameraOff, CheckCircle2, Zap } from 'lucide-react'

interface CameraPageProps {
  activeProfile: UserProfile | null
  onMeasurementCompleted: (record: MeasurementRecord) => void
  onOpenProfile: () => void
}

export const CameraPage: React.FC<CameraPageProps> = ({
  activeProfile,
  onMeasurementCompleted,
  onOpenProfile,
}) => {
  const [modelType, setModelType] = useState<'full' | 'lite'>('full')
  const [currentView, setCurrentView] = useState<'front' | 'side'>('front')
  
  // Storage for multi-frame captured data
  const [frontFrames, setFrontFrames] = useState<Landmark[][]>([])
  const [sideFrames, setSideFrames] = useState<Landmark[][]>([])
  const [frontThumbnail, setFrontThumbnail] = useState<string | undefined>()
  const [sideThumbnail, setSideThumbnail] = useState<string | undefined>()
  const [viewSwitchBanner, setViewSwitchBanner] = useState<string | null>(null)

  const {
    videoRef,
    cameras,
    selectedDeviceId,
    facingMode,
    isLoading: isCameraLoading,
    error: cameraError,
    dimensions,
    startStream,
    stopStream,
    switchFacingMode,
    selectCamera,
  } = useCamera()

  // Handle capture completion callback from pose hook
  const handleCaptureComplete = useCallback(
    (frames: Landmark[][], thumbnailDataUrl: string) => {
      if (currentView === 'front') {
        setFrontFrames(frames)
        setFrontThumbnail(thumbnailDataUrl)
        setViewSwitchBanner('Front view locked! Now turn 90° for side view auto-capture, or tap "Analyze Sizes" anytime.')
        // Automatically suggest switching to side view
        setCurrentView('side')
      } else {
        setSideFrames(frames)
        setSideThumbnail(thumbnailDataUrl)
        setViewSwitchBanner('Side view locked! Both planes are captured for maximum 3D accuracy.')
      }
    },
    [currentView]
  )

  const {
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
  } = usePoseDetection({
    videoRef,
    enabled: true,
    modelType,
    autoCaptureInitial: true,
    onCaptureComplete: handleCaptureComplete,
  })

  // Start stream when mounting
  useEffect(() => {
    startStream()
    return () => {
      stopStream()
    }
  }, [startStream, stopStream])

  // Finalize measurements and navigate to Results
  const handleFinishAndProcess = () => {
    if (frontFrames.length === 0) return

    const userHeight = activeProfile?.heightCm || 175
    const profileId = activeProfile?.id || 'guest_profile'
    const profileName = activeProfile?.name || 'Guest User'

    const videoW = dimensions.width || 1280
    const videoH = dimensions.height || 720

    const measurements = computeBodyMeasurements({
      profileId,
      userHeightCm: userHeight,
      frontFrames,
      sideFrames,
      imageWidth: videoW,
      imageHeight: videoH,
      lightingScore: qualityResult?.brightnessValue ? Math.min(100, qualityResult.brightnessValue / 2) : 80,
      distanceScore: qualityResult?.distanceStatus === 'optimal' ? 90 : 70,
    })

    const recommendations = generateAllGarmentRecommendations(measurements)

    const record: MeasurementRecord = {
      id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      profileId,
      profileName,
      heightCm: userHeight,
      weightKg: activeProfile?.weightKg,
      capturedAt: new Date().toISOString(),
      measurements,
      recommendations,
      frontThumbnail,
      sideThumbnail,
      manuallyEditedCount: 0,
    }

    onMeasurementCompleted(record)
  }

  // If no profile set, show prompt
  if (!activeProfile) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Height Calibration Required</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          The camera scale calculation relies on your exact physical height (in cm). Please establish your calibration profile before starting live pose capture.
        </p>
        <button
          onClick={onOpenProfile}
          className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
        >
          Setup Profile (Height)
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 space-y-4">
      {/* Top Banner with Active Profile Info & Auto-Capture Mode */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2 glass-panel rounded-2xl text-xs gap-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300 font-medium">
            Subject: <strong className="text-white">{activeProfile.name}</strong> ({activeProfile.heightCm} cm)
          </span>
          {autoCaptureEnabled && (
            <span className="flex items-center gap-1 text-[11px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
              <Zap className="w-3 h-3 text-emerald-400 fill-emerald-400" />
              Auto-Capture Active
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {frontFrames.length > 0 && (
            <span className="flex items-center gap-1 text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full font-mono text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Front View Locked ({frontFrames.length} frames)
            </span>
          )}
          {sideFrames.length > 0 && (
            <span className="flex items-center gap-1 text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full font-mono text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Side View Locked ({sideFrames.length} frames)
            </span>
          )}
        </div>
      </div>

      {/* Dynamic View Notification Toast */}
      {viewSwitchBanner && (
        <div className="px-4 py-2.5 rounded-2xl bg-indigo-600/25 border border-indigo-500/40 text-indigo-200 text-xs font-semibold flex items-center justify-between animate-fade-in shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{viewSwitchBanner}</span>
          </div>
          <button
            onClick={() => setViewSwitchBanner(null)}
            className="text-[10px] text-slate-400 hover:text-white underline ml-2 shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Video Viewport Container */}
      <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] max-h-[72vh] rounded-3xl overflow-hidden glass-panel border border-slate-800 bg-black flex items-center justify-center shadow-2xl">
        {/* Live Video Element */}
        <video
          ref={videoRef}
          playsInline
          muted
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            facingMode === 'user' ? 'scale-x-[-1]' : ''
          }`}
        />

        {/* Skeletal Pose Connection & Landmark Layer */}
        <SkeletonCanvas
          landmarks={landmarks}
          allPoses={allDetectedPoses}
          width={dimensions.width || 1280}
          height={dimensions.height || 720}
        />

        {/* Anatomical Silhouette Overlay Guide */}
        <SilhouetteOverlay
          isAligned={qualityResult?.isReadyForCapture || false}
          viewMode={currentView}
        />

        {/* Large 3-2-1 Auto-Capture Countdown Ring */}
        <CountdownOverlay
          seconds={countdownSeconds}
          currentView={currentView}
        />

        {/* Camera loading / permission error state */}
        {(cameraError || modelError) && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-30">
            <CameraOff className="w-12 h-12 text-rose-400 mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">Camera / Model Error</h3>
            <p className="text-xs text-slate-300 max-w-sm mb-4">{cameraError || modelError}</p>
            <button
              onClick={() => startStream()}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* MediaPipe Model Init Loading State */}
        {(!isModelReady || isCameraLoading) && !cameraError && !modelError && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-30">
            <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
            <h3 className="text-base font-bold text-white">Loading Neural Vision WASM Engine...</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Initializing MediaPipe Pose Landmarker ({modelType.toUpperCase()} float16 model) locally in your browser.
            </p>
          </div>
        )}

        {/* Floating Real-time Quality Guidance (Top Center) */}
        <div className="absolute top-4 left-4 right-4 z-20 pointer-events-none">
          <QualityIndicator
            quality={qualityResult}
            fps={fps}
            isModelReady={isModelReady}
          />
        </div>
      </div>

      {/* Bottom Controls Bar */}
      <CameraControls
        cameras={cameras}
        selectedDeviceId={selectedDeviceId}
        facingMode={facingMode}
        modelType={modelType}
        isReadyForCapture={qualityResult?.isReadyForCapture || false}
        isCapturing={isCapturing}
        captureProgress={captureProgress}
        currentView={currentView}
        frontCaptured={frontFrames.length > 0}
        sideCaptured={sideFrames.length > 0}
        autoCaptureEnabled={autoCaptureEnabled}
        countdownSeconds={countdownSeconds}
        onSelectCamera={selectCamera}
        onSwitchFacingMode={switchFacingMode}
        onToggleModelType={() => setModelType(m => m === 'full' ? 'lite' : 'full')}
        onToggleAutoCapture={() => setAutoCaptureEnabled(prev => !prev)}
        onTriggerCapture={triggerCapture}
        onSwitchView={setCurrentView}
        onFinishAndProcess={handleFinishAndProcess}
      />
    </div>
  )
}
