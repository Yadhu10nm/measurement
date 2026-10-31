import type { ConfidenceLevel, MeasurementMethod } from '../../types/measurement'
import type { Landmark } from '../../types/landmark'

export interface ConfidenceEvaluationParams {
  relevantLandmarks: (Landmark | undefined)[]
  frameCount: number
  frameVariance: number
  hasSideView: boolean
  hasSegmentation: boolean
  method: MeasurementMethod
  lightingScore: number // 0-100
  distanceScore: number // 0-100
}

export interface ConfidenceAssessment {
  level: ConfidenceLevel
  score: number // 0-100
  uncertaintyCm: number // ± cm tolerance
  reasons: string[]
}

export function evaluateMeasurementConfidence(
  params: ConfidenceEvaluationParams
): ConfidenceAssessment {
  const {
    relevantLandmarks,
    frameCount,
    frameVariance,
    hasSideView,
    hasSegmentation,
    method,
    lightingScore,
    distanceScore,
  } = params

  let baseScore = 60
  const reasons: string[] = []

  // Check landmark visibility
  const validLandmarks = relevantLandmarks.filter(
    l => l && (l.visibility === undefined || l.visibility > 0.5)
  )
  const validRatio = relevantLandmarks.length > 0 ? validLandmarks.length / relevantLandmarks.length : 1
  const avgVisibility = relevantLandmarks.length > 0
    ? relevantLandmarks.reduce((sum, l) => sum + (l?.visibility ?? 0.8), 0) / relevantLandmarks.length
    : 0

  if (avgVisibility > 0.85 && validRatio >= 0.9) {
    baseScore += 12
    reasons.push('High landmark tracking clarity')
  } else if (avgVisibility < 0.65) {
    baseScore -= 18
    reasons.push('Marginal landmark visibility')
  }

  // Frame count & temporal averaging
  if (frameCount >= 5) {
    baseScore += 8
    reasons.push(`Averaged over ${frameCount} coherent frames`)
  } else if (frameCount < 3) {
    baseScore -= 10
    reasons.push('Single or sparse frame sample')
  }

  // Pose stability (frame variance)
  if (frameVariance < 3.0) {
    baseScore += 8
    reasons.push('Minimal subject motion jitter')
  } else if (frameVariance > 8.0) {
    baseScore -= 15
    reasons.push('Subject motion detected during capture')
  }

  // Method specific adjustments
  if (method === 'multi_view_aggregation') {
    baseScore += 15
    reasons.push('Dual-plane front & side cross-verification')
  } else if (method === 'ramanujan_circumference' && !hasSideView) {
    // Front-only ellipse circumference cannot be 100% confidence
    baseScore -= 6
    reasons.push('Circumference estimated from frontal aspect with depth model')
  } else if (method === 'direct_geometric') {
    baseScore += 5
    reasons.push('Direct skeletal landmark geometry')
  }

  // Segmentation assistance
  if (hasSegmentation) {
    baseScore += 5
    reasons.push('Contour mask validated')
  }

  // Lighting & distance penalties
  if (lightingScore < 60) {
    baseScore -= 10
    reasons.push('Sub-optimal lighting')
  }
  if (distanceScore < 70) {
    baseScore -= 8
    reasons.push('Subject distance not ideal')
  }

  // Clamp score
  const finalScore = Math.max(25, Math.min(96, Math.round(baseScore)))

  let level: ConfidenceLevel
  let uncertaintyCm: number

  if (finalScore >= 85) {
    level = 'high'
    uncertaintyCm = 1.0 // ± 1.0 cm
  } else if (finalScore >= 68) {
    level = 'medium'
    uncertaintyCm = 2.2 // ± 2.2 cm
  } else {
    level = 'low'
    uncertaintyCm = 4.0 // ± 4.0 cm
  }

  return {
    level,
    score: finalScore,
    uncertaintyCm,
    reasons,
  }
}
