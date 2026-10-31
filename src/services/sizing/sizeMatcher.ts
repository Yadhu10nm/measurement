import type { BodyMeasurements } from '../../types/measurement'
import type { 
  SizeChart, 
  SizeRecommendation, 
  SizeAlternative 
} from '../../types/sizing'
import { DEFAULT_GARMENT_EASE } from './garmentEase'

import genericShirts from '../../data/size-charts/generic-shirts.json'
import genericPants from '../../data/size-charts/generic-pants.json'
import genericJeans from '../../data/size-charts/generic-jeans.json'
import genericJackets from '../../data/size-charts/generic-jackets.json'

export const DEFAULT_CHARTS: SizeChart[] = [
  ...(genericShirts as SizeChart[]),
  ...(genericPants as SizeChart[]),
  ...(genericJeans as SizeChart[]),
  ...(genericJackets as SizeChart[]),
]

export function getCustomCharts(): SizeChart[] {
  try {
    const raw = localStorage.getItem('customSizeCharts')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveCustomChart(chart: SizeChart): void {
  const existing = getCustomCharts().filter(c => c.id !== chart.id)
  existing.push(chart)
  localStorage.setItem('customSizeCharts', JSON.stringify(existing))
}

export function getAllAvailableCharts(): SizeChart[] {
  return [...DEFAULT_CHARTS, ...getCustomCharts()]
}

export function recommendSizeForGarment(
  measurements: BodyMeasurements,
  chart: SizeChart
): SizeRecommendation {
  const ease = DEFAULT_GARMENT_EASE[chart.garment] || { chestEaseCm: 6, waistEaseCm: 4, hipEaseCm: 4 }
  
  // Extract key target body metrics
  const chest = measurements.chestCircumference.valueCm
  const waist = measurements.waistCircumference.valueCm
  const hip = measurements.hipCircumference.valueCm
  const shoulder = measurements.shoulderWidth.valueCm
  const inseam = measurements.inseam.valueCm
  const thigh = measurements.thighCircumference.valueCm

  const candidates: {
    size: string
    score: number
    penalties: string[]
    matchingPoints: SizeRecommendation['matchingPoints']
    fitType: 'perfect' | 'regular' | 'slim' | 'relaxed'
  }[] = []

  for (const sizeObj of chart.sizes) {
    let score = 100
    const penalties: string[] = []
    const matchingPoints: SizeRecommendation['matchingPoints'] = []

    // Evaluate Chest (for upper body garments)
    if (chart.category === 'upper' && sizeObj.chest) {
      const [minC, maxC] = sizeObj.chest
      const targetWithEase = chest + (chart.defaultEaseCm?.chest ? 0 : (ease.chestEaseCm ? 1 : 0))
      const diffMin = minC - targetWithEase
      const diffMax = targetWithEase - maxC

      if (targetWithEase >= minC && targetWithEase <= maxC) {
        matchingPoints.push({ dimension: 'Chest', bodyCm: chest, chartRangeCm: [minC, maxC], status: 'in_range' })
      } else if (diffMax > 0) {
        score -= diffMax * 4
        matchingPoints.push({ dimension: 'Chest', bodyCm: chest, chartRangeCm: [minC, maxC], status: 'tight' })
        penalties.push(`Chest is ${diffMax.toFixed(1)} cm over upper range`)
      } else if (diffMin > 0) {
        score -= diffMin * 2.5
        matchingPoints.push({ dimension: 'Chest', bodyCm: chest, chartRangeCm: [minC, maxC], status: 'loose' })
        penalties.push(`Chest is ${diffMin.toFixed(1)} cm under lower range (roomier fit)`)
      }
    }

    // Evaluate Waist
    if (sizeObj.waist) {
      const [minW, maxW] = sizeObj.waist
      const targetWithEase = waist
      const diffMin = minW - targetWithEase
      const diffMax = targetWithEase - maxW

      if (targetWithEase >= minW && targetWithEase <= maxW) {
        matchingPoints.push({ dimension: 'Waist', bodyCm: waist, chartRangeCm: [minW, maxW], status: 'in_range' })
      } else if (diffMax > 0) {
        score -= diffMax * 3.5
        matchingPoints.push({ dimension: 'Waist', bodyCm: waist, chartRangeCm: [minW, maxW], status: 'tight' })
        penalties.push(`Waist exceeds range by ${diffMax.toFixed(1)} cm`)
      } else if (diffMin > 0) {
        score -= diffMin * 2
        matchingPoints.push({ dimension: 'Waist', bodyCm: waist, chartRangeCm: [minW, maxW], status: 'loose' })
      }
    }

    // Evaluate Hip (for lower body garments)
    if (chart.category === 'lower' && sizeObj.hip) {
      const [minH, maxH] = sizeObj.hip
      const targetWithEase = hip
      const diffMin = minH - targetWithEase
      const diffMax = targetWithEase - maxH

      if (targetWithEase >= minH && targetWithEase <= maxH) {
        matchingPoints.push({ dimension: 'Hip', bodyCm: hip, chartRangeCm: [minH, maxH], status: 'in_range' })
      } else if (diffMax > 0) {
        score -= diffMax * 4
        matchingPoints.push({ dimension: 'Hip', bodyCm: hip, chartRangeCm: [minH, maxH], status: 'tight' })
        penalties.push(`Hip exceeds chart by ${diffMax.toFixed(1)} cm`)
      } else if (diffMin > 0) {
        score -= diffMin * 2
        matchingPoints.push({ dimension: 'Hip', bodyCm: hip, chartRangeCm: [minH, maxH], status: 'loose' })
      }
    }

    // Evaluate Shoulder
    if (chart.category === 'upper' && sizeObj.shoulder) {
      const [minS, maxS] = sizeObj.shoulder
      if (shoulder >= minS && shoulder <= maxS) {
        matchingPoints.push({ dimension: 'Shoulder', bodyCm: shoulder, chartRangeCm: [minS, maxS], status: 'in_range' })
      } else if (shoulder > maxS) {
        const diff = shoulder - maxS
        score -= diff * 3
        matchingPoints.push({ dimension: 'Shoulder', bodyCm: shoulder, chartRangeCm: [minS, maxS], status: 'tight' })
        penalties.push(`Shoulder width is tight by ${diff.toFixed(1)} cm`)
      } else {
        const diff = minS - shoulder
        score -= diff * 1.5
        matchingPoints.push({ dimension: 'Shoulder', bodyCm: shoulder, chartRangeCm: [minS, maxS], status: 'loose' })
      }
    }

    // Evaluate Inseam (if defined)
    if (chart.category === 'lower' && sizeObj.inseam) {
      const [minI, maxI] = sizeObj.inseam
      if (inseam >= minI && inseam <= maxI) {
        matchingPoints.push({ dimension: 'Inseam', bodyCm: inseam, chartRangeCm: [minI, maxI], status: 'in_range' })
      } else if (inseam < minI) {
        penalties.push(`Length may need hem adjustment (inseam is ${(minI - inseam).toFixed(1)} cm longer)`)
      }
    }

    // Evaluate Thigh (if defined)
    if (chart.category === 'lower' && sizeObj.thigh) {
      const [minT, maxT] = sizeObj.thigh
      if (thigh >= minT && thigh <= maxT) {
        matchingPoints.push({ dimension: 'Thigh', bodyCm: thigh, chartRangeCm: [minT, maxT], status: 'in_range' })
      } else if (thigh > maxT) {
        const diff = thigh - maxT
        score -= diff * 2.5
        matchingPoints.push({ dimension: 'Thigh', bodyCm: thigh, chartRangeCm: [minT, maxT], status: 'tight' })
        penalties.push(`Thigh circumference exceeds chart by ${diff.toFixed(1)} cm`)
      }
    }

    const clampedScore = Math.max(0, Math.min(100, Math.round(score)))
    let fitType: 'perfect' | 'regular' | 'slim' | 'relaxed' = 'regular'
    if (clampedScore >= 90) fitType = 'perfect'
    else if (penalties.some(p => p.includes('tight') || p.includes('over upper'))) fitType = 'slim'
    else fitType = 'relaxed'

    candidates.push({
      size: sizeObj.size,
      score: clampedScore,
      penalties,
      matchingPoints,
      fitType,
    })
  }

  // Sort candidates by fit score descending
  candidates.sort((a, b) => b.score - a.score)

  const topMatch = candidates[0] || {
    size: chart.sizes[0]?.size || 'M',
    score: 75,
    penalties: [],
    matchingPoints: [],
    fitType: 'regular' as const,
  }

  const alternatives: SizeAlternative[] = candidates.slice(1, 4).map(c => ({
    size: c.size,
    fitScore: c.score,
    fitType: c.fitType === 'slim' ? 'snug' : c.fitType === 'relaxed' ? 'relaxed' : 'relaxed',
    reason: c.score > 70 
      ? `Alternative size with ${c.fitType} profile (${c.score}% compatibility)` 
      : `May feel ${c.fitType === 'slim' ? 'restrictive' : 'baggy'} around critical regions`,
  }))

  const explanation = topMatch.score >= 90
    ? `Size ${topMatch.size} is an optimal match! All critical body contours align within the brand's recommended ease allowances.`
    : topMatch.score >= 75
    ? `Size ${topMatch.size} is recommended. Key proportions align well, with modest variation across secondary dimensions.`
    : `Size ${topMatch.size} is the closest statistical fit, but some dimensions may feel ${topMatch.penalties.length > 0 ? topMatch.penalties[0].toLowerCase() : 'slightly off'}. Review dimension details below.`

  return {
    garmentType: chart.garment,
    garmentLabel: chart.garmentLabel,
    brand: chart.brand,
    recommendedSize: topMatch.size,
    fitScore: topMatch.score,
    fitType: topMatch.fitType,
    explanation,
    matchingPoints: topMatch.matchingPoints,
    alternativeSizes: alternatives,
    warnings: topMatch.penalties,
  }
}

export function generateAllGarmentRecommendations(
  measurements: BodyMeasurements,
  charts = getAllAvailableCharts()
): SizeRecommendation[] {
  return charts.map(chart => recommendSizeForGarment(measurements, chart))
}
