import { LANDMARK_INDEX, type Landmark } from '../../types/landmark'
import type { BodyMeasurements, MeasurementItem } from '../../types/measurement'
import { euclideanDistance2D, midpoint, type Point2D } from './geometry'
import { calculateCalibration } from './calibration'
import { estimateBodyCircumference } from './circumference'
import { evaluateMeasurementConfidence } from './confidence'

export interface MeasurementEngineInput {
  profileId: string
  userHeightCm: number
  frontFrames: Landmark[][] // Multi-frame array of 33 landmarks for temporal filtering
  sideFrames?: Landmark[][] // Optional side frames
  imageWidth: number
  imageHeight: number
  lightingScore?: number
  distanceScore?: number
}

/**
 * Computes coordinate averages across valid frames to filter jitter & noise
 */
function averageLandmarks(frames: Landmark[][]): { averaged: Landmark[]; variance: number } {
  if (frames.length === 0) return { averaged: [], variance: 0 }
  if (frames.length === 1) return { averaged: frames[0], variance: 0 }

  const count = frames.length
  const landmarkCount = frames[0].length
  const averaged: Landmark[] = []
  let totalDistances = 0
  let sampleCount = 0

  for (let i = 0; i < landmarkCount; i++) {
    let sumX = 0
    let sumY = 0
    let sumZ = 0
    let sumVis = 0

    for (let f = 0; f < count; f++) {
      const lm = frames[f][i]
      sumX += lm.x
      sumY += lm.y
      sumZ += lm.z || 0
      sumVis += lm.visibility ?? 1
    }

    const avgLm: Landmark = {
      x: sumX / count,
      y: sumY / count,
      z: sumZ / count,
      visibility: sumVis / count,
    }
    averaged.push(avgLm)

    // Compute variance from mean
    for (let f = 0; f < count; f++) {
      const lm = frames[f][i]
      totalDistances += euclideanDistance2D(lm, avgLm)
      sampleCount++
    }
  }

  const avgVariance = sampleCount > 0 ? (totalDistances / sampleCount) * 100 : 0
  return { averaged, variance: avgVariance }
}

export function computeBodyMeasurements(input: MeasurementEngineInput): BodyMeasurements {
  const {
    profileId,
    userHeightCm,
    frontFrames,
    sideFrames = [],
    imageWidth,
    imageHeight,
    lightingScore = 80,
    distanceScore = 85,
  } = input

  const { averaged: frontLms, variance: frontVariance } = averageLandmarks(frontFrames)
  const hasSide = sideFrames.length > 0
  const sideLms = hasSide ? averageLandmarks(sideFrames).averaged : null

  // 1. Calibration
  const calibration = calculateCalibration(frontLms, imageWidth, imageHeight, userHeightCm)
  const pxPerCm = calibration.isValid ? calibration.pixelsPerCm : imageWidth / 180

  // Helper to convert normalized landmark to pixel point
  const px = (index: number, lms = frontLms): Point2D => ({
    x: lms[index].x * imageWidth,
    y: lms[index].y * imageHeight,
  })

  // Key front landmarks in pixels
  const leftShoulder = px(LANDMARK_INDEX.LEFT_SHOULDER)
  const rightShoulder = px(LANDMARK_INDEX.RIGHT_SHOULDER)
  const leftElbow = px(LANDMARK_INDEX.LEFT_ELBOW)
  const rightElbow = px(LANDMARK_INDEX.RIGHT_ELBOW)
  const leftWrist = px(LANDMARK_INDEX.LEFT_WRIST)
  const rightWrist = px(LANDMARK_INDEX.RIGHT_WRIST)
  const leftHip = px(LANDMARK_INDEX.LEFT_HIP)
  const rightHip = px(LANDMARK_INDEX.RIGHT_HIP)
  const leftKnee = px(LANDMARK_INDEX.LEFT_KNEE)
  const rightKnee = px(LANDMARK_INDEX.RIGHT_KNEE)
  const leftAnkle = px(LANDMARK_INDEX.LEFT_ANKLE)
  const rightAnkle = px(LANDMARK_INDEX.RIGHT_ANKLE)
  const leftHeel = px(LANDMARK_INDEX.LEFT_HEEL)
  const rightHeel = px(LANDMARK_INDEX.RIGHT_HEEL)

  const shoulderMid = midpoint(leftShoulder, rightShoulder)
  const hipMid = midpoint(leftHip, rightHip)

  // Side view depths if available
  let sideChestDepthCm: number | undefined
  let sideWaistDepthCm: number | undefined
  let sideHipDepthCm: number | undefined

  if (hasSide && sideLms && sideLms.length >= 33) {
    const sShoulder = px(LANDMARK_INDEX.LEFT_SHOULDER, sideLms)
    const sHip = px(LANDMARK_INDEX.LEFT_HIP, sideLms)
    const sChestDepthPx = Math.abs(sShoulder.x - sHip.x) * 1.4 + 40
    sideChestDepthCm = Math.max(16, sChestDepthPx / pxPerCm)
    sideWaistDepthCm = sideChestDepthCm * 0.88
    sideHipDepthCm = sideChestDepthCm * 1.05
  }

  // --- Upper Body Calculations ---

  // 1. Shoulder Width (Bi-acromial diameter + soft tissue contour allowance)
  const rawShoulderDistPx = euclideanDistance2D(leftShoulder, rightShoulder)
  const shoulderWidthValCm = Math.round(((rawShoulderDistPx / pxPerCm) * 1.08) * 10) / 10
  const shoulderConf = evaluateMeasurementConfidence({
    relevantLandmarks: [frontLms[LANDMARK_INDEX.LEFT_SHOULDER], frontLms[LANDMARK_INDEX.RIGHT_SHOULDER]],
    frameCount: frontFrames.length,
    frameVariance: frontVariance,
    hasSideView: false,
    hasSegmentation: false,
    method: 'direct_geometric',
    lightingScore,
    distanceScore,
  })

  // 2. Chest Circumference
  // Chest width measured across thorax at sternum level
  const chestWidthPx = rawShoulderDistPx * 0.86
  const chestWidthCm = chestWidthPx / pxPerCm
  const chestEstimate = estimateBodyCircumference(chestWidthCm, 'chest', sideChestDepthCm)
  const chestConf = evaluateMeasurementConfidence({
    relevantLandmarks: [frontLms[LANDMARK_INDEX.LEFT_SHOULDER], frontLms[LANDMARK_INDEX.RIGHT_SHOULDER]],
    frameCount: frontFrames.length,
    frameVariance: frontVariance,
    hasSideView: hasSide,
    hasSegmentation: false,
    method: chestEstimate.method,
    lightingScore,
    distanceScore,
  })

  // 3. Waist Circumference
  // Waist level is ~60% down from shoulder line to hip line
  const waistWidthPx = rawShoulderDistPx * 0.72
  const waistWidthCm = waistWidthPx / pxPerCm
  const waistEstimate = estimateBodyCircumference(waistWidthCm, 'waist', sideWaistDepthCm)
  const waistConf = evaluateMeasurementConfidence({
    relevantLandmarks: [frontLms[LANDMARK_INDEX.LEFT_HIP], frontLms[LANDMARK_INDEX.RIGHT_HIP]],
    frameCount: frontFrames.length,
    frameVariance: frontVariance,
    hasSideView: hasSide,
    hasSegmentation: false,
    method: waistEstimate.method,
    lightingScore,
    distanceScore,
  })

  // 4. Sleeve Length (Average left & right arm: Shoulder -> Elbow -> Wrist)
  const leftSleevePx = euclideanDistance2D(leftShoulder, leftElbow) + euclideanDistance2D(leftElbow, leftWrist)
  const rightSleevePx = euclideanDistance2D(rightShoulder, rightElbow) + euclideanDistance2D(rightElbow, rightWrist)
  const avgSleevePx = (leftSleevePx + rightSleevePx) / 2
  const sleeveValCm = Math.round((avgSleevePx / pxPerCm) * 10) / 10
  const sleeveConf = evaluateMeasurementConfidence({
    relevantLandmarks: [
      frontLms[LANDMARK_INDEX.LEFT_SHOULDER], frontLms[LANDMARK_INDEX.LEFT_ELBOW], frontLms[LANDMARK_INDEX.LEFT_WRIST],
      frontLms[LANDMARK_INDEX.RIGHT_SHOULDER], frontLms[LANDMARK_INDEX.RIGHT_ELBOW], frontLms[LANDMARK_INDEX.RIGHT_WRIST]
    ],
    frameCount: frontFrames.length,
    frameVariance: frontVariance,
    hasSideView: false,
    hasSegmentation: false,
    method: 'direct_geometric',
    lightingScore,
    distanceScore,
  })

  // 5. Upper Arm Circumference (Bicep level)
  const armWidthPx = euclideanDistance2D(leftShoulder, leftElbow) * 0.32
  const armWidthCm = armWidthPx / pxPerCm
  const upperArmEstimate = estimateBodyCircumference(armWidthCm, 'upperArm')
  const upperArmConf = evaluateMeasurementConfidence({
    relevantLandmarks: [frontLms[LANDMARK_INDEX.LEFT_SHOULDER], frontLms[LANDMARK_INDEX.LEFT_ELBOW]],
    frameCount: frontFrames.length,
    frameVariance: frontVariance,
    hasSideView: false,
    hasSegmentation: false,
    method: 'ramanujan_circumference',
    lightingScore,
    distanceScore,
  })

  // 6. Shirt Length (From base of neck/shoulder down to lower hip)
  const torsoPx = euclideanDistance2D(shoulderMid, hipMid)
  const shirtLengthValCm = Math.round(((torsoPx / pxPerCm) + 12) * 10) / 10
  const shirtLengthConf = evaluateMeasurementConfidence({
    relevantLandmarks: [frontLms[LANDMARK_INDEX.LEFT_SHOULDER], frontLms[LANDMARK_INDEX.LEFT_HIP]],
    frameCount: frontFrames.length,
    frameVariance: frontVariance,
    hasSideView: false,
    hasSegmentation: false,
    method: 'direct_geometric',
    lightingScore,
    distanceScore,
  })

  // 7. Neck Circumference
  const neckWidthPx = rawShoulderDistPx * 0.35
  const neckWidthCm = neckWidthPx / pxPerCm
  const neckEstimate = estimateBodyCircumference(neckWidthCm, 'neck')
  const neckConf = evaluateMeasurementConfidence({
    relevantLandmarks: [frontLms[LANDMARK_INDEX.LEFT_SHOULDER], frontLms[LANDMARK_INDEX.RIGHT_SHOULDER]],
    frameCount: frontFrames.length,
    frameVariance: frontVariance,
    hasSideView: false,
    hasSegmentation: false,
    method: 'ramanujan_circumference',
    lightingScore,
    distanceScore,
  })

  // --- Lower Body Calculations ---

  // 8. Hip Circumference
  const rawHipDistPx = euclideanDistance2D(leftHip, rightHip)
  const hipWidthPx = rawHipDistPx * 1.28 // Includes lateral trochanter/gluteal expansion
  const hipWidthCm = hipWidthPx / pxPerCm
  const hipEstimate = estimateBodyCircumference(hipWidthCm, 'hip', sideHipDepthCm)
  const hipConf = evaluateMeasurementConfidence({
    relevantLandmarks: [frontLms[LANDMARK_INDEX.LEFT_HIP], frontLms[LANDMARK_INDEX.RIGHT_HIP]],
    frameCount: frontFrames.length,
    frameVariance: frontVariance,
    hasSideView: hasSide,
    hasSegmentation: false,
    method: hipEstimate.method,
    lightingScore,
    distanceScore,
  })

  // 9. Thigh Circumference (1/3 down from hip to knee)
  const thighLengthPx = euclideanDistance2D(leftHip, leftKnee)
  const thighWidthPx = thighLengthPx * 0.38
  const thighWidthCm = thighWidthPx / pxPerCm
  const thighEstimate = estimateBodyCircumference(thighWidthCm, 'thigh')
  const thighConf = evaluateMeasurementConfidence({
    relevantLandmarks: [frontLms[LANDMARK_INDEX.LEFT_HIP], frontLms[LANDMARK_INDEX.LEFT_KNEE]],
    frameCount: frontFrames.length,
    frameVariance: frontVariance,
    hasSideView: false,
    hasSegmentation: false,
    method: 'ramanujan_circumference',
    lightingScore,
    distanceScore,
  })

  // 10. Knee Circumference
  const kneeWidthPx = thighWidthPx * 0.72
  const kneeWidthCm = kneeWidthPx / pxPerCm
  const kneeEstimate = estimateBodyCircumference(kneeWidthCm, 'knee')
  const kneeConf = evaluateMeasurementConfidence({
    relevantLandmarks: [frontLms[LANDMARK_INDEX.LEFT_KNEE], frontLms[LANDMARK_INDEX.RIGHT_KNEE]],
    frameCount: frontFrames.length,
    frameVariance: frontVariance,
    hasSideView: false,
    hasSegmentation: false,
    method: 'ramanujan_circumference',
    lightingScore,
    distanceScore,
  })

  // 11. Inseam (Perineum/crotch level to ankle)
  const crotchMid: Point2D = {
    x: hipMid.x,
    y: hipMid.y + (leftKnee.y - hipMid.y) * 0.12,
  }
  const leftInseamPx = euclideanDistance2D(crotchMid, leftAnkle)
  const rightInseamPx = euclideanDistance2D(crotchMid, rightAnkle)
  const avgInseamPx = (leftInseamPx + rightInseamPx) / 2
  const inseamValCm = Math.round((avgInseamPx / pxPerCm) * 10) / 10
  const inseamConf = evaluateMeasurementConfidence({
    relevantLandmarks: [frontLms[LANDMARK_INDEX.LEFT_HIP], frontLms[LANDMARK_INDEX.LEFT_ANKLE]],
    frameCount: frontFrames.length,
    frameVariance: frontVariance,
    hasSideView: false,
    hasSegmentation: false,
    method: 'direct_geometric',
    lightingScore,
    distanceScore,
  })

  // 12. Outseam (Waist level down lateral side of leg to heel)
  const leftOutseamPx = euclideanDistance2D(leftHip, leftKnee) + euclideanDistance2D(leftKnee, leftHeel)
  const rightOutseamPx = euclideanDistance2D(rightHip, rightKnee) + euclideanDistance2D(rightKnee, rightHeel)
  const avgOutseamPx = (leftOutseamPx + rightOutseamPx) / 2
  const outseamValCm = Math.round((avgOutseamPx / pxPerCm) * 10) / 10
  const outseamConf = evaluateMeasurementConfidence({
    relevantLandmarks: [frontLms[LANDMARK_INDEX.LEFT_HIP], frontLms[LANDMARK_INDEX.LEFT_HEEL]],
    frameCount: frontFrames.length,
    frameVariance: frontVariance,
    hasSideView: false,
    hasSegmentation: false,
    method: 'direct_geometric',
    lightingScore,
    distanceScore,
  })

  // 13. Leg Opening
  const legOpeningWidthCm = Math.max(9, (rawShoulderDistPx * 0.22) / pxPerCm)
  const legOpeningEstimate = estimateBodyCircumference(legOpeningWidthCm, 'legOpening')
  const legOpeningConf = evaluateMeasurementConfidence({
    relevantLandmarks: [frontLms[LANDMARK_INDEX.LEFT_ANKLE]],
    frameCount: frontFrames.length,
    frameVariance: frontVariance,
    hasSideView: false,
    hasSegmentation: false,
    method: 'ramanujan_circumference',
    lightingScore,
    distanceScore,
  })

  const makeItem = (
    key: string,
    label: string,
    valueCm: number,
    conf: ReturnType<typeof evaluateMeasurementConfidence>,
    category: 'upper' | 'lower',
    method: MeasurementItem['method'],
    description: string
  ): MeasurementItem => ({
    id: `m_${key}_${Date.now()}`,
    key,
    label,
    valueCm,
    originalValueCm: valueCm,
    confidence: conf.level,
    confidenceScore: conf.score,
    method,
    isManuallyEdited: false,
    category,
    description,
    uncertaintyCm: conf.uncertaintyCm,
  })

  const shoulderItem = makeItem('shoulderWidth', 'Shoulder Width', shoulderWidthValCm, shoulderConf, 'upper', 'direct_geometric', 'Acromion-to-acromion breadth with deltoid curvature allowance')
  const chestItem = makeItem('chestCircumference', 'Chest Circumference', chestEstimate.circumferenceCm, chestConf, 'upper', chestEstimate.method, chestEstimate.formulaExplanation)
  const waistItem = makeItem('waistCircumference', 'Waist Circumference', waistEstimate.circumferenceCm, waistConf, 'upper', waistEstimate.method, waistEstimate.formulaExplanation)
  const sleeveItem = makeItem('sleeveLength', 'Sleeve Length', sleeveValCm, sleeveConf, 'upper', 'direct_geometric', 'Shoulder joint through elbow vertex to wrist carpal joint')
  const upperArmItem = makeItem('upperArmCircumference', 'Upper Arm Circumference', upperArmEstimate.circumferenceCm, upperArmConf, 'upper', 'ramanujan_circumference', 'Mid-bicep transverse section circumference')
  const shirtLengthItem = makeItem('shirtLength', 'Shirt Length', shirtLengthValCm, shirtLengthConf, 'upper', 'direct_geometric', 'Vertical cervical base to standard shirt hemline')
  const neckItem = makeItem('neckCircumference', 'Neck Circumference', neckEstimate.circumferenceCm, neckConf, 'upper', 'ramanujan_circumference', 'Cervical neck base circumference')

  const hipItem = makeItem('hipCircumference', 'Hip Circumference', hipEstimate.circumferenceCm, hipConf, 'lower', hipEstimate.method, hipEstimate.formulaExplanation)
  const thighItem = makeItem('thighCircumference', 'Thigh Circumference', thighEstimate.circumferenceCm, thighConf, 'lower', 'ramanujan_circumference', 'Upper thigh circumference below gluteal fold')
  const kneeItem = makeItem('kneeCircumference', 'Knee Circumference', kneeEstimate.circumferenceCm, kneeConf, 'lower', 'ramanujan_circumference', 'Patella joint circumference')
  const inseamItem = makeItem('inseam', 'Inseam Length', inseamValCm, inseamConf, 'lower', 'direct_geometric', 'Perineum crotch base to medial ankle malleolus')
  const outseamItem = makeItem('outseam', 'Outseam Length', outseamValCm, outseamConf, 'lower', 'direct_geometric', 'Waist crest down lateral leg aspect to heel base')
  const legOpeningItem = makeItem('legOpening', 'Leg Opening', legOpeningEstimate.circumferenceCm, legOpeningConf, 'lower', 'ramanujan_circumference', 'Trouser bottom hem circumference at ankle')

  const allItems = [
    shoulderItem, chestItem, waistItem, sleeveItem, upperArmItem, shirtLengthItem, neckItem,
    hipItem, thighItem, kneeItem, inseamItem, outseamItem, legOpeningItem,
  ]
  const avgOverallConf = Math.round(
    allItems.reduce((sum, item) => sum + item.confidenceScore, 0) / allItems.length
  )

  return {
    id: `bm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    profileId,
    capturedAt: new Date().toISOString(),
    pixelsPerCm: Math.round(pxPerCm * 100) / 100,
    viewsCaptured: hasSide ? ['front', 'side'] : ['front'],
    shoulderWidth: shoulderItem,
    chestCircumference: chestItem,
    waistCircumference: waistItem,
    sleeveLength: sleeveItem,
    upperArmCircumference: upperArmItem,
    shirtLength: shirtLengthItem,
    neckCircumference: neckItem,
    hipCircumference: hipItem,
    thighCircumference: thighItem,
    kneeCircumference: kneeItem,
    inseam: inseamItem,
    outseam: outseamItem,
    legOpening: legOpeningItem,
    overallConfidence: avgOverallConf,
    calibrationFactor: calibration.isValid ? 1.0 : 0.85,
    notes: hasSide ? 'Front & side views combined' : 'Front view primary capture',
  }
}
