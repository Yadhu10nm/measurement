import type { BodyMeasurements } from './measurement'

export type GarmentType = 
  | 't_shirt'
  | 'shirt'
  | 'hoodie'
  | 'jacket'
  | 'sweater'
  | 'trousers'
  | 'jeans'
  | 'shorts'
  | 'formal_pants'

export interface SizeRange {
  size: string
  chest?: [number, number]
  waist?: [number, number]
  hip?: [number, number]
  shoulder?: [number, number]
  sleeve?: [number, number]
  length?: [number, number]
  inseam?: [number, number]
  thigh?: [number, number]
}

export interface SizeChart {
  id: string
  brand: string
  garment: GarmentType
  garmentLabel: string
  category: 'upper' | 'lower'
  gender: 'menswear' | 'womenswear' | 'unisex'
  sizes: SizeRange[]
  defaultEaseCm: {
    chest?: number
    waist?: number
    hip?: number
    shoulder?: number
  }
}

export interface SizeAlternative {
  size: string
  fitScore: number // 0 to 100
  fitType: 'snug' | 'relaxed' | 'tight' | 'oversized'
  reason: string
}

export interface SizeRecommendation {
  garmentType: GarmentType
  garmentLabel: string
  brand: string
  recommendedSize: string
  fitScore: number // 0-100
  fitType: 'perfect' | 'regular' | 'slim' | 'relaxed'
  explanation: string
  matchingPoints: {
    dimension: string
    bodyCm: number
    chartRangeCm: [number, number]
    status: 'in_range' | 'tight' | 'loose'
  }[]
  alternativeSizes: SizeAlternative[]
  warnings: string[]
}

export interface MeasurementRecord {
  id: string
  profileId: string
  profileName: string
  heightCm: number
  weightKg?: number
  capturedAt: string
  measurements: BodyMeasurements
  recommendations: SizeRecommendation[]
  frontThumbnail?: string
  sideThumbnail?: string
  manuallyEditedCount: number
}
