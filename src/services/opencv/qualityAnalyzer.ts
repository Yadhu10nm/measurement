import { LANDMARK_INDEX, type Landmark, type QualityAnalysisResult } from '../../types/landmark'
import type { ImageQualityMetrics } from './imageProcessor'
import { euclideanDistance2D } from '../measurement/geometry'

export interface PostureCheckParams {
  landmarks: Landmark[] | null
  imageQuality: ImageQualityMetrics
  detectedPersonCount: number
  frameWidth: number
  frameHeight: number
}

export function evaluateBodyPostureAndQuality(params: PostureCheckParams): QualityAnalysisResult {
  const { landmarks, imageQuality, detectedPersonCount } = params
  const instructions: string[] = []

  if (!landmarks || landmarks.length < 33) {
    return {
      isFullBodyVisible: false,
      isShoulderAligned: false,
      isHipAligned: false,
      isArmSeparated: false,
      distanceStatus: 'too_far',
      lightingStatus: imageQuality.brightnessStatus,
      brightnessValue: imageQuality.brightness,
      contrastValue: imageQuality.contrast,
      overallConfidence: 0,
      instructions: ['Step into camera view so your full body is visible'],
      isReadyForCapture: false,
      personCount: detectedPersonCount,
    }
  }

  // 1. Person Count Check
  if (detectedPersonCount > 1) {
    instructions.push('Only one person should be visible')
  }

  // 2. Full Body Visibility Check (Landmark confidence & boundary presence)
  const nose = landmarks[LANDMARK_INDEX.NOSE]
  const leftShoulder = landmarks[LANDMARK_INDEX.LEFT_SHOULDER]
  const rightShoulder = landmarks[LANDMARK_INDEX.RIGHT_SHOULDER]
  const leftHip = landmarks[LANDMARK_INDEX.LEFT_HIP]
  const rightHip = landmarks[LANDMARK_INDEX.RIGHT_HIP]
  const leftKnee = landmarks[LANDMARK_INDEX.LEFT_KNEE]
  const rightKnee = landmarks[LANDMARK_INDEX.RIGHT_KNEE]
  const leftAnkle = landmarks[LANDMARK_INDEX.LEFT_ANKLE]
  const rightAnkle = landmarks[LANDMARK_INDEX.RIGHT_ANKLE]
  const leftWrist = landmarks[LANDMARK_INDEX.LEFT_WRIST]
  const rightWrist = landmarks[LANDMARK_INDEX.RIGHT_WRIST]

  const visThreshold = 0.55
  const isHeadVisible = (nose.visibility ?? 1) > visThreshold && nose.y > 0.02
  const isTorsoVisible = (leftShoulder.visibility ?? 1) > visThreshold && (rightShoulder.visibility ?? 1) > visThreshold
  const areLegsVisible = (leftKnee.visibility ?? 1) > visThreshold || (rightKnee.visibility ?? 1) > visThreshold
  const areFeetVisible = ((leftAnkle.visibility ?? 1) > visThreshold || (rightAnkle.visibility ?? 1) > visThreshold) &&
    (leftAnkle.y < 0.98 || rightAnkle.y < 0.98)

  const isFullBodyVisible = isHeadVisible && isTorsoVisible && areLegsVisible && areFeetVisible

  if (!areFeetVisible) {
    instructions.push('Your feet are not visible - tilt camera down or step back')
  }
  if (!isHeadVisible) {
    instructions.push('Head is cut off at the top - step slightly backward')
  }

  // 3. Distance Analysis (Ratio of body height to frame height)
  // Vertex to lowest ankle/heel
  const topY = Math.max(0, nose.y - 0.08)
  const bottomY = Math.max(leftAnkle.y, rightAnkle.y)
  const bodyHeightRatio = bottomY - topY

  let distanceStatus: 'too_close' | 'too_far' | 'optimal' = 'optimal'
  if (bodyHeightRatio < 0.60) {
    distanceStatus = 'too_far'
    instructions.push('Move closer to the camera')
  } else if (bodyHeightRatio > 0.94 || topY <= 0.02 || bottomY >= 0.98) {
    distanceStatus = 'too_close'
    instructions.push('Move slightly backward')
  }

  // 4. Shoulder & Hip Alignment (Tilt angle)
  const shoulderDy = Math.abs(leftShoulder.y - rightShoulder.y)
  const shoulderDx = Math.abs(leftShoulder.x - rightShoulder.x)
  const shoulderAngleRad = Math.atan2(shoulderDy, shoulderDx || 0.001)
  const shoulderAngleDeg = (shoulderAngleRad * 180) / Math.PI
  const isShoulderAligned = shoulderAngleDeg < 8.0

  if (!isShoulderAligned) {
    instructions.push('Stand straight, level your shoulders')
  }

  const hipDy = Math.abs(leftHip.y - rightHip.y)
  const hipDx = Math.abs(leftHip.x - rightHip.x)
  const hipAngleRad = Math.atan2(hipDy, hipDx || 0.001)
  const hipAngleDeg = (hipAngleRad * 180) / Math.PI
  const isHipAligned = hipAngleDeg < 8.5

  // 5. Arm Separation (arms slightly away from torso so contours are distinct)
  const leftArmDist = euclideanDistance2D(leftWrist, leftHip)
  const rightArmDist = euclideanDistance2D(rightWrist, rightHip)
  const isArmSeparated = leftArmDist > 0.09 && rightArmDist > 0.09

  if (!isArmSeparated) {
    instructions.push('Keep your arms slightly away from your body (A-pose)')
  }

  // 6. Lighting Evaluation
  let lightingStatus: 'too_dark' | 'too_bright' | 'optimal' = imageQuality.brightnessStatus
  if (imageQuality.brightnessStatus === 'too_dark') {
    instructions.push('Lighting is too dark - turn on a light')
  } else if (imageQuality.brightnessStatus === 'too_bright') {
    instructions.push('Lighting is overexposed - reduce harsh backlight')
  }

  // Calculate Overall Quality Confidence Score (0-100)
  let score = 30
  if (isFullBodyVisible) score += 25
  if (distanceStatus === 'optimal') score += 20
  if (isShoulderAligned) score += 10
  if (isHipAligned) score += 5
  if (isArmSeparated) score += 10
  if (lightingStatus === 'optimal') score += 10
  if (detectedPersonCount === 1) score += 5
  else score -= 30

  const overallConfidence = Math.max(0, Math.min(100, score))

  // Ready for capture when minimum positioning requirements are satisfied
  const isReadyForCapture =
    isFullBodyVisible &&
    distanceStatus === 'optimal' &&
    isShoulderAligned &&
    isArmSeparated &&
    detectedPersonCount === 1 &&
    lightingStatus !== 'too_dark'

  if (instructions.length === 0 && isReadyForCapture) {
    instructions.push('Perfect position! Hold steady for capture')
  }

  return {
    isFullBodyVisible,
    isShoulderAligned,
    isHipAligned,
    isArmSeparated,
    distanceStatus,
    lightingStatus,
    brightnessValue: imageQuality.brightness,
    contrastValue: imageQuality.contrast,
    overallConfidence,
    instructions,
    isReadyForCapture,
    personCount: detectedPersonCount,
  }
}
