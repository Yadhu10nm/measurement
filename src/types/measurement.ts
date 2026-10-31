export type ConfidenceLevel = 'high' | 'medium' | 'low'

export type MeasurementMethod = 
  | 'direct_geometric'
  | 'contour_assisted'
  | 'ramanujan_circumference'
  | 'multi_view_aggregation'
  | 'manual_override'

export interface MeasurementItem {
  id: string
  key: string
  label: string
  valueCm: number
  originalValueCm: number
  confidence: ConfidenceLevel
  confidenceScore: number // 0-100
  method: MeasurementMethod
  isManuallyEdited: boolean
  category: 'upper' | 'lower'
  description: string
  uncertaintyCm: number // ± cm error range
}

export interface BodyMeasurements {
  id: string
  profileId: string
  capturedAt: string
  pixelsPerCm: number
  viewsCaptured: ('front' | 'side')[]
  
  // Upper body
  shoulderWidth: MeasurementItem
  chestCircumference: MeasurementItem
  waistCircumference: MeasurementItem
  sleeveLength: MeasurementItem
  upperArmCircumference: MeasurementItem
  shirtLength: MeasurementItem
  neckCircumference: MeasurementItem
  
  // Lower body
  hipCircumference: MeasurementItem
  thighCircumference: MeasurementItem
  kneeCircumference: MeasurementItem
  inseam: MeasurementItem
  outseam: MeasurementItem
  legOpening: MeasurementItem

  // Quality & Diagnostic metadata
  overallConfidence: number
  calibrationFactor: number
  notes?: string
}

export interface CapturedFrames {
  frontImage?: string // Data URL
  sideImage?: string // Data URL
  frontLandmarks?: any[]
  sideLandmarks?: any[]
}
