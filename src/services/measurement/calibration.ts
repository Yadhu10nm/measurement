import { LANDMARK_INDEX, type Landmark } from '../../types/landmark'
import { euclideanDistance2D, midpoint, type Point2D } from './geometry'

export interface CalibrationResult {
  pixelsPerCm: number
  topOfHeadPx: Point2D
  bottomOfFeetPx: Point2D
  detectedHeightPx: number
  userHeightCm: number
  isValid: boolean
  warning?: string
}

/**
 * Calibrates scale factor (pixels per centimeter) using user's reported physical height.
 * Applies anthropometric correction for cranial vertex (top of skull above nose)
 * and bottom of soles.
 */
export function calculateCalibration(
  landmarks: Landmark[],
  imageWidth: number,
  imageHeight: number,
  userHeightCm: number
): CalibrationResult {
  if (!landmarks || landmarks.length < 33 || userHeightCm <= 0) {
    return {
      pixelsPerCm: 1,
      topOfHeadPx: { x: 0, y: 0 },
      bottomOfFeetPx: { x: 0, y: 0 },
      detectedHeightPx: 0,
      userHeightCm,
      isValid: false,
      warning: 'Insufficient landmarks for calibration',
    }
  }

  // Convert landmarks to pixel space
  const nose = { x: landmarks[LANDMARK_INDEX.NOSE].x * imageWidth, y: landmarks[LANDMARK_INDEX.NOSE].y * imageHeight }
  const leftEar = { x: landmarks[LANDMARK_INDEX.LEFT_EAR].x * imageWidth, y: landmarks[LANDMARK_INDEX.LEFT_EAR].y * imageHeight }
  const rightEar = { x: landmarks[LANDMARK_INDEX.RIGHT_EAR].x * imageWidth, y: landmarks[LANDMARK_INDEX.RIGHT_EAR].y * imageHeight }
  const leftShoulder = { x: landmarks[LANDMARK_INDEX.LEFT_SHOULDER].x * imageWidth, y: landmarks[LANDMARK_INDEX.LEFT_SHOULDER].y * imageHeight }
  const rightShoulder = { x: landmarks[LANDMARK_INDEX.RIGHT_SHOULDER].x * imageWidth, y: landmarks[LANDMARK_INDEX.RIGHT_SHOULDER].y * imageHeight }

  // Feet landmarks
  const leftAnkle = { x: landmarks[LANDMARK_INDEX.LEFT_ANKLE].x * imageWidth, y: landmarks[LANDMARK_INDEX.LEFT_ANKLE].y * imageHeight }
  const rightAnkle = { x: landmarks[LANDMARK_INDEX.RIGHT_ANKLE].x * imageWidth, y: landmarks[LANDMARK_INDEX.RIGHT_ANKLE].y * imageHeight }
  const leftHeel = { x: landmarks[LANDMARK_INDEX.LEFT_HEEL].x * imageWidth, y: landmarks[LANDMARK_INDEX.LEFT_HEEL].y * imageHeight }
  const rightHeel = { x: landmarks[LANDMARK_INDEX.RIGHT_HEEL].x * imageWidth, y: landmarks[LANDMARK_INDEX.RIGHT_HEEL].y * imageHeight }
  const leftToe = { x: landmarks[LANDMARK_INDEX.LEFT_FOOT_INDEX].x * imageWidth, y: landmarks[LANDMARK_INDEX.LEFT_FOOT_INDEX].y * imageHeight }
  const rightToe = { x: landmarks[LANDMARK_INDEX.RIGHT_FOOT_INDEX].x * imageWidth, y: landmarks[LANDMARK_INDEX.RIGHT_FOOT_INDEX].y * imageHeight }

  // Ear midpoint represents the transverse cranial line
  const earMid = midpoint(leftEar, rightEar)
  const shoulderMid = midpoint(leftShoulder, rightShoulder)

  // Distance from shoulder midpoint to ear/nose gives upper cervical scale
  const neckToEarDist = euclideanDistance2D(shoulderMid, earMid)
  
  // Anthropometric cranial offset:
  // Stature anthropometry establishes that vertex is approx 1.15 to 1.35x distance between nose and ear-midpoint above the nose
  const noseToEar = Math.max(12, Math.abs(nose.y - earMid.y))
  const cranialOffset = Math.max(neckToEarDist * 0.45, noseToEar * 1.25)

  const topOfHeadPx: Point2D = {
    x: nose.x,
    y: Math.max(0, nose.y - cranialOffset),
  }

  // Sole of foot is the lowest visible point among ankles, heels, and toes
  const footYCandidates = [
    leftAnkle.y, rightAnkle.y,
    leftHeel.y, rightHeel.y,
    leftToe.y, rightToe.y,
  ].filter(y => !isNaN(y) && y > 0)

  const bottomY = footYCandidates.length > 0 ? Math.max(...footYCandidates) : imageHeight * 0.95
  const bottomX = (leftAnkle.x + rightAnkle.x) / 2

  const bottomOfFeetPx: Point2D = {
    x: bottomX,
    y: bottomY,
  }

  const detectedHeightPx = Math.abs(bottomOfFeetPx.y - topOfHeadPx.y)

  if (detectedHeightPx < imageHeight * 0.4) {
    return {
      pixelsPerCm: detectedHeightPx / userHeightCm,
      topOfHeadPx,
      bottomOfFeetPx,
      detectedHeightPx,
      userHeightCm,
      isValid: false,
      warning: 'Person height in frame is too small for accurate calibration. Please stand closer.',
    }
  }

  const pixelsPerCm = detectedHeightPx / userHeightCm

  return {
    pixelsPerCm,
    topOfHeadPx,
    bottomOfFeetPx,
    detectedHeightPx,
    userHeightCm,
    isValid: true,
  }
}
