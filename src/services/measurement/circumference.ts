/**
 * Ramanujan's First Approximation for the circumference of an ellipse:
 * C ≈ π * [3(a + b) - √((3a + b)(a + 3b))]
 * 
 * Where:
 * a = semi-major axis (half of transverse width in cm)
 * b = semi-minor axis (half of sagittal depth in cm)
 */
export function ramanujanCircumference(halfWidthA: number, halfDepthB: number): number {
  const a = Math.max(0.1, halfWidthA)
  const b = Math.max(0.1, halfDepthB)

  const term1 = 3 * (a + b)
  const term2 = Math.sqrt((3 * a + b) * (a + 3 * b))
  const circumference = Math.PI * (term1 - term2)

  return Math.round(circumference * 10) / 10
}

/**
 * Standard anthropometric depth-to-width ratios for human torso & limbs
 * (sagittal depth / transverse width) when only a frontal view is available.
 */
export const ANTHROPOMETRIC_DEPTH_RATIOS = {
  chest: 0.72,        // Ribcage is flatter transversely
  waist: 0.74,        // Abdominal section
  hip: 0.78,          // Pelvic girdle
  neck: 0.88,         // Nearly circular
  upperArm: 0.90,     // Limb cross-sections are fairly cylindrical
  thigh: 0.86,        // Upper leg cross-section
  knee: 0.92,         // Patellar joint
  legOpening: 0.85,   // Ankle/lower calf
} as const

export interface CircumferenceEstimateResult {
  circumferenceCm: number
  halfWidthCm: number
  halfDepthCm: number
  isMultiView: boolean
  method: 'ramanujan_circumference' | 'multi_view_aggregation'
  formulaExplanation: string
}

/**
 * Estimates circumference using width and optional side depth.
 * If sideDepthCm is provided (from a side view capture), it directly uses measured depth.
 * Otherwise, it applies validated anthropometric ratios.
 */
export function estimateBodyCircumference(
  widthCm: number,
  bodyRegion: keyof typeof ANTHROPOMETRIC_DEPTH_RATIOS,
  sideDepthCm?: number
): CircumferenceEstimateResult {
  const halfWidth = widthCm / 2
  let halfDepth: number
  let isMultiView = false
  let method: 'ramanujan_circumference' | 'multi_view_aggregation' = 'ramanujan_circumference'

  if (sideDepthCm && sideDepthCm > 0) {
    halfDepth = sideDepthCm / 2
    isMultiView = true
    method = 'multi_view_aggregation'
  } else {
    const ratio = ANTHROPOMETRIC_DEPTH_RATIOS[bodyRegion] || 0.75
    halfDepth = halfWidth * ratio
  }

  const circumferenceCm = ramanujanCircumference(halfWidth, halfDepth)

  const formulaExplanation = isMultiView
    ? `Dual-view measured ellipse (Width: ${widthCm.toFixed(1)}cm, Depth: ${sideDepthCm!.toFixed(1)}cm) via Ramanujan formula.`
    : `Front-width (${widthCm.toFixed(1)}cm) with anthropometric depth ratio ${(ANTHROPOMETRIC_DEPTH_RATIOS[bodyRegion] || 0.75).toFixed(2)} via Ramanujan ellipse.`

  return {
    circumferenceCm,
    halfWidthCm: halfWidth,
    halfDepthCm: halfDepth,
    isMultiView,
    method,
    formulaExplanation,
  }
}
