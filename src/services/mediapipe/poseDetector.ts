import { FilesetResolver, PoseLandmarker, type PoseLandmarkerResult } from '@mediapipe/tasks-vision'
import type { Landmark } from '../../types/landmark'

export interface PoseDetectorConfig {
  modelType: 'full' | 'lite'
  numPoses?: number
  minDetectionConfidence?: number
  minTrackingConfidence?: number
  enableSegmentation?: boolean
}

export class PoseLandmarkerService {
  private static instance: PoseLandmarkerService | null = null
  private landmarker: PoseLandmarker | null = null
  private isInitializing = false
  private initError: string | null = null
  
  // Smoothing history
  private previousLandmarks: Landmark[] | null = null
  private smoothingAlpha = 0.65 // Exponential moving average factor (higher = more responsive, lower = smoother)

  private constructor() {}

  public static getInstance(): PoseLandmarkerService {
    if (!PoseLandmarkerService.instance) {
      PoseLandmarkerService.instance = new PoseLandmarkerService()
    }
    return PoseLandmarkerService.instance
  }

  public async initialize(config: PoseDetectorConfig = { modelType: 'full' }): Promise<void> {
    if (this.landmarker) return
    if (this.isInitializing) return

    this.isInitializing = true
    this.initError = null

    try {
      // 1. Resolve WASM assets locally from /wasm
      const vision = await FilesetResolver.forVisionTasks('/wasm')

      const modelPath = config.modelType === 'lite' 
        ? '/models/pose_landmarker_lite.task' 
        : '/models/pose_landmarker_full.task'

      // Attempt GPU delegate first, fallback to CPU gracefully
      try {
        this.landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: modelPath,
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numPoses: config.numPoses ?? 2,
          outputSegmentationMasks: config.enableSegmentation ?? true,
          minPoseDetectionConfidence: config.minDetectionConfidence ?? 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: config.minTrackingConfidence ?? 0.5,
        })
      } catch (gpuError) {
        console.warn('GPU delegate initialization failed, falling back to CPU delegate:', gpuError)
        this.landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: modelPath,
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numPoses: config.numPoses ?? 2,
          outputSegmentationMasks: config.enableSegmentation ?? true,
          minPoseDetectionConfidence: config.minDetectionConfidence ?? 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: config.minTrackingConfidence ?? 0.5,
        })
      }

      this.isInitializing = false
    } catch (err: any) {
      this.isInitializing = false
      this.initError = err?.message || 'Failed to initialize MediaPipe Pose Landmarker'
      throw new Error(this.initError!)
    }
  }

  public isReady(): boolean {
    return !!this.landmarker
  }

  public getError(): string | null {
    return this.initError
  }

  /**
   * Performs real-time inference on a video element frame
   */
  public detectVideoFrame(video: HTMLVideoElement, timestampMs: number): {
    allPoses: Landmark[][]
    smoothedPrimaryPose: Landmark[] | null
    personCount: number
    segmentationMask?: any
  } {
    if (!this.landmarker) {
      return { allPoses: [], smoothedPrimaryPose: null, personCount: 0 }
    }

    try {
      const result: PoseLandmarkerResult = this.landmarker.detectForVideo(video, timestampMs)
      const poses = result.landmarks || []
      const personCount = poses.length

      if (personCount === 0) {
        this.previousLandmarks = null
        return { allPoses: [], smoothedPrimaryPose: null, personCount: 0 }
      }

      const rawPrimary = poses[0] as Landmark[]
      const smoothed = this.smoothLandmarks(rawPrimary)

      let mask: any = undefined
      if (result.segmentationMasks && result.segmentationMasks.length > 0) {
        mask = result.segmentationMasks[0]
      }

      return {
        allPoses: poses as Landmark[][],
        smoothedPrimaryPose: smoothed,
        personCount,
        segmentationMask: mask,
      }
    } catch (err) {
      console.warn('Pose detection frame error:', err)
      return { allPoses: [], smoothedPrimaryPose: null, personCount: 0 }
    }
  }

  /**
   * Applies exponential moving average smoothing across landmark coordinates
   * to eliminate frame-to-frame jitter while tracking fast movements.
   */
  private smoothLandmarks(rawLandmarks: Landmark[]): Landmark[] {
    if (!this.previousLandmarks || this.previousLandmarks.length !== rawLandmarks.length) {
      this.previousLandmarks = rawLandmarks
      return rawLandmarks
    }

    const smoothed: Landmark[] = rawLandmarks.map((curr, i) => {
      const prev = this.previousLandmarks![i]
      const alpha = this.smoothingAlpha

      // If landmark was lost or low visibility, maintain previous position briefly
      if ((curr.visibility ?? 1) < 0.25 && (prev.visibility ?? 1) > 0.5) {
        return {
          ...prev,
          visibility: (prev.visibility ?? 1) * 0.85,
        }
      }

      return {
        x: alpha * curr.x + (1 - alpha) * prev.x,
        y: alpha * curr.y + (1 - alpha) * prev.y,
        z: alpha * (curr.z || 0) + (1 - alpha) * (prev.z || 0),
        visibility: alpha * (curr.visibility ?? 1) + (1 - alpha) * (prev.visibility ?? 1),
      }
    })

    this.previousLandmarks = smoothed
    return smoothed
  }

  public resetSmoothing(): void {
    this.previousLandmarks = null
  }

  public dispose(): void {
    if (this.landmarker) {
      try {
        this.landmarker.close()
      } catch (e) {
        console.warn('Error closing pose landmarker:', e)
      }
      this.landmarker = null
    }
    this.previousLandmarks = null
  }
}

export const poseLandmarkerService = PoseLandmarkerService.getInstance()
