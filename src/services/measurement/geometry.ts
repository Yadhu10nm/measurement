import type { Landmark } from '../../types/landmark'

export interface Point2D {
  x: number
  y: number
}

/**
 * Calculates 2D Euclidean distance in normalized or pixel coordinates
 */
export function euclideanDistance2D(p1: Point2D, p2: Point2D): number {
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Calculates 3D Euclidean distance if z is present
 */
export function euclideanDistance3D(p1: Landmark, p2: Landmark): number {
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  const dz = (p2.z || 0) - (p1.z || 0)
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

/**
 * Calculates midpoint between two points
 */
export function midpoint(p1: Point2D, p2: Point2D): Point2D {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  }
}

/**
 * Computes angle in degrees between three landmarks (at p2 vertex)
 */
export function angleBetween(p1: Point2D, p2: Point2D, p3: Point2D): number {
  const v1 = { x: p1.x - p2.x, y: p1.y - p2.y }
  const v2 = { x: p3.x - p2.x, y: p3.y - p2.y }
  const dot = v1.x * v2.x + v1.y * v2.y
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y)
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y)
  if (mag1 === 0 || mag2 === 0) return 0
  const cos = Math.max(-1, Math.min(1, dot / (mag1 * mag2)))
  return (Math.acos(cos) * 180) / Math.PI
}
