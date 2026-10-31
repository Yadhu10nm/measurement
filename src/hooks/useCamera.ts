import { useState, useEffect, useRef, useCallback } from 'react'
import { cameraService, type CameraDeviceInfo } from '../services/camera/cameraService'

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [cameras, setCameras] = useState<CameraDeviceInfo[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('')
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 })

  const loadCameras = useCallback(async () => {
    try {
      const list = await cameraService.getAvailableCameras()
      setCameras(list)
      if (list.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(list[0].deviceId)
      }
    } catch (e) {
      console.warn('Could not list cameras:', e)
    }
  }, [selectedDeviceId])

  const startStream = useCallback(async (devId?: string, mode?: 'user' | 'environment') => {
    setIsLoading(true)
    setError(null)

    try {
      const activeStream = await cameraService.startCamera({
        deviceId: devId || selectedDeviceId || undefined,
        facingMode: mode || facingMode,
        idealWidth: 1280,
        idealHeight: 720,
      })

      setStream(activeStream)

      if (videoRef.current) {
        videoRef.current.srcObject = activeStream
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play().catch(console.warn)
            setDimensions({
              width: videoRef.current.videoWidth || 1280,
              height: videoRef.current.videoHeight || 720,
            })
          }
        }
      }

      await loadCameras()
    } catch (err: any) {
      setError(err?.message || 'Unable to access camera')
    } finally {
      setIsLoading(false)
    }
  }, [facingMode, selectedDeviceId, loadCameras])

  const stopStream = useCallback(() => {
    cameraService.stopCamera()
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setStream(null)
  }, [])

  const switchFacingMode = useCallback(() => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user'
    setFacingMode(nextMode)
    startStream(undefined, nextMode)
  }, [facingMode, startStream])

  const selectCamera = useCallback((deviceId: string) => {
    setSelectedDeviceId(deviceId)
    startStream(deviceId)
  }, [startStream])

  // Cleanup when unmounting
  useEffect(() => {
    return () => {
      cameraService.stopCamera()
    }
  }, [])

  return {
    videoRef,
    stream,
    cameras,
    selectedDeviceId,
    facingMode,
    isLoading,
    error,
    dimensions,
    startStream,
    stopStream,
    switchFacingMode,
    selectCamera,
  }
}
