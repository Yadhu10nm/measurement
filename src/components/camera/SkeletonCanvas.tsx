import React, { useEffect, useRef } from 'react'
import { LANDMARK_INDEX, POSE_CONNECTIONS, type Landmark } from '../../types/landmark'

interface SkeletonCanvasProps {
  landmarks: Landmark[] | null
  allPoses?: Landmark[][]
  width: number
  height: number
  showLandmarks?: boolean
  showConnections?: boolean
}

export const SkeletonCanvas: React.FC<SkeletonCanvasProps> = ({
  landmarks,
  allPoses = [],
  width,
  height,
  showLandmarks = true,
  showConnections = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, width, height)

    if (!landmarks && allPoses.length === 0) return

    // Render secondary poses in warning amber if multiple people detected
    if (allPoses.length > 1) {
      allPoses.slice(1).forEach(secPose => {
        drawSkeleton(ctx, secPose, width, height, 'rgba(239, 68, 68, 0.4)', 'rgba(239, 68, 68, 0.6)')
      })
    }

    // Render primary pose in radiant cyan / emerald
    if (landmarks) {
      drawSkeleton(
        ctx,
        landmarks,
        width,
        height,
        'rgba(99, 102, 241, 0.85)',
        'rgba(168, 85, 247, 0.95)',
        showLandmarks,
        showConnections
      )
    }
  }, [landmarks, allPoses, width, height, showLandmarks, showConnections])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 pointer-events-none w-full h-full object-cover"
    />
  )
}

function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  lms: Landmark[],
  width: number,
  height: number,
  lineColor: string,
  nodeColor: string,
  drawNodes = true,
  drawLines = true
) {
  if (drawLines) {
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.shadowBlur = 8
    ctx.shadowColor = lineColor

    for (const [startIdx, endIdx] of POSE_CONNECTIONS) {
      const p1 = lms[startIdx]
      const p2 = lms[endIdx]

      if (!p1 || !p2) continue
      if ((p1.visibility ?? 1) < 0.4 || (p2.visibility ?? 1) < 0.4) continue

      const x1 = p1.x * width
      const y1 = p1.y * height
      const x2 = p2.x * width
      const y2 = p2.y * height

      // Gradient limb line
      const grad = ctx.createLinearGradient(x1, y1, x2, y2)
      grad.addColorStop(0, lineColor)
      grad.addColorStop(1, nodeColor)

      ctx.strokeStyle = grad
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
    }
    ctx.shadowBlur = 0
  }

  if (drawNodes) {
    for (let i = 0; i < lms.length; i++) {
      const p = lms[i]
      if (!p || (p.visibility ?? 1) < 0.4) continue

      const x = p.x * width
      const y = p.y * height

      // Key joints get distinct styling
      const isKeyJoint = [
        LANDMARK_INDEX.NOSE,
        LANDMARK_INDEX.LEFT_SHOULDER,
        LANDMARK_INDEX.RIGHT_SHOULDER,
        LANDMARK_INDEX.LEFT_HIP,
        LANDMARK_INDEX.RIGHT_HIP,
        LANDMARK_INDEX.LEFT_KNEE,
        LANDMARK_INDEX.RIGHT_KNEE,
        LANDMARK_INDEX.LEFT_ANKLE,
        LANDMARK_INDEX.RIGHT_ANKLE,
      ].includes(i as any)

      const radius = isKeyJoint ? 5 : 3

      // Glow effect
      ctx.beginPath()
      ctx.arc(x, y, radius + 2, 0, 2 * Math.PI)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
      ctx.fill()

      ctx.beginPath()
      ctx.arc(x, y, radius, 0, 2 * Math.PI)
      ctx.fillStyle = isKeyJoint ? '#38bdf8' : nodeColor
      ctx.fill()
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 1.5
      ctx.stroke()
    }
  }
}
