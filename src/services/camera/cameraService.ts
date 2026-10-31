export interface CameraDeviceInfo {
  deviceId: string
  label: string
  facingMode?: 'user' | 'environment'
}

export class CameraService {
  private currentStream: MediaStream | null = null

  public async getAvailableCameras(): Promise<CameraDeviceInfo[]> {
    if (!navigator.mediaDevices?.enumerateDevices) {
      return []
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(d => d.kind === 'videoinput')
      return videoDevices.map((d, index) => ({
        deviceId: d.deviceId,
        label: d.label || `Camera ${index + 1}`,
      }))
    } catch (err) {
      console.warn('Error enumerating cameras:', err)
      return []
    }
  }

  public async startCamera(options: {
    deviceId?: string
    facingMode?: 'user' | 'environment'
    idealWidth?: number
    idealHeight?: number
  } = {}): Promise<MediaStream> {
    this.stopCamera()

    const constraints: MediaStreamConstraints = {
      audio: false,
      video: {
        width: { ideal: options.idealWidth || 1280 },
        height: { ideal: options.idealHeight || 720 },
        ...(options.deviceId ? { deviceId: { exact: options.deviceId } } : {}),
        ...(!options.deviceId && options.facingMode ? { facingMode: options.facingMode } : { facingMode: 'user' }),
      },
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      this.currentStream = stream
      return stream
    } catch (err: any) {
      let friendlyError = 'Failed to access camera'
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        friendlyError = 'Camera permission was denied. Please allow camera access in your browser settings.'
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        friendlyError = 'No camera device found on this system.'
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        friendlyError = 'Camera is currently in use by another application.'
      } else if (err.name === 'OverconstrainedError') {
        // Fallback with minimal constraints
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        this.currentStream = fallbackStream
        return fallbackStream
      }
      throw new Error(friendlyError)
    }
  }

  public stopCamera(): void {
    if (this.currentStream) {
      this.currentStream.getTracks().forEach(track => {
        track.stop()
      })
      this.currentStream = null
    }
  }

  public isActive(): boolean {
    return !!this.currentStream && this.currentStream.active
  }
}

export const cameraService = new CameraService()
