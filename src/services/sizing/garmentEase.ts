import type { GarmentType } from '../../types/sizing'

export interface GarmentEaseRecommendation {
  chestEaseCm: number
  waistEaseCm: number
  hipEaseCm: number
  description: string
}

/**
 * Standard tailoring ease allowances (difference between garment finished dimension and actual skin body measurement)
 */
export const DEFAULT_GARMENT_EASE: Record<GarmentType, GarmentEaseRecommendation> = {
  t_shirt: {
    chestEaseCm: 6,
    waistEaseCm: 6,
    hipEaseCm: 4,
    description: 'Standard comfortable stretch & drape allowance (+6cm chest)',
  },
  shirt: {
    chestEaseCm: 8,
    waistEaseCm: 7,
    hipEaseCm: 6,
    description: 'Formal/semi-casual ease for clean lines without pulling (+8cm chest)',
  },
  hoodie: {
    chestEaseCm: 12,
    waistEaseCm: 10,
    hipEaseCm: 8,
    description: 'Relaxed streetwear ease for fleece layering (+12cm chest)',
  },
  jacket: {
    chestEaseCm: 12,
    waistEaseCm: 10,
    hipEaseCm: 10,
    description: 'Outerwear ease to accommodate inner shirts and sweaters (+12cm chest)',
  },
  sweater: {
    chestEaseCm: 8,
    waistEaseCm: 8,
    hipEaseCm: 6,
    description: 'Moderate knit ease for comfort and natural flexibility (+8cm chest)',
  },
  trousers: {
    chestEaseCm: 0,
    waistEaseCm: 2,
    hipEaseCm: 5,
    description: 'Structured fit with minimal waist gap and sitting comfort (+2cm waist, +5cm hip)',
  },
  jeans: {
    chestEaseCm: 0,
    waistEaseCm: 1.5,
    hipEaseCm: 3.5,
    description: 'Denim ease designed to conform to natural waist and hip contours',
  },
  shorts: {
    chestEaseCm: 0,
    waistEaseCm: 3,
    hipEaseCm: 6,
    description: 'Casual ease allowing full leg mobility and seated comfort',
  },
  formal_pants: {
    chestEaseCm: 0,
    waistEaseCm: 2,
    hipEaseCm: 4,
    description: 'Tailored drape with standard trouser rise and minimal buckling',
  },
}
