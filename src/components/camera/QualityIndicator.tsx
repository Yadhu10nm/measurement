import React from 'react'
import type { QualityAnalysisResult } from '../../types/landmark'
import { CheckCircle2, AlertTriangle, Eye, Sun, UserCheck, Users, Activity } from 'lucide-react'

interface QualityIndicatorProps {
  quality: QualityAnalysisResult | null
  fps: number
  isModelReady: boolean
}

export const QualityIndicator: React.FC<QualityIndicatorProps> = ({
  quality,
  fps,
  isModelReady,
}) => {
  if (!isModelReady) {
    return (
      <div className="glass-panel px-4 py-2.5 rounded-2xl flex items-center gap-3 text-sm text-slate-300">
        <div className="w-3 h-3 rounded-full bg-amber-400 animate-ping" />
        <span>Initializing Neural Vision Engine...</span>
      </div>
    )
  }

  if (!quality) {
    return (
      <div className="glass-panel px-4 py-2 rounded-2xl flex items-center gap-2 text-xs text-slate-400">
        <Activity className="w-3.5 h-3.5 animate-spin" />
        <span>Awaiting camera frame...</span>
      </div>
    )
  }

  const primaryInstruction = quality.instructions[0] || 'Hold steady for capture'
  const isPerfect = quality.isReadyForCapture

  return (
    <div className="flex flex-col gap-2 w-full max-w-md mx-auto">
      {/* Primary Dynamic Banner */}
      <div
        className={`px-4 py-3 rounded-2xl flex items-center gap-3 transition-all duration-300 shadow-lg ${
          isPerfect
            ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-200 backdrop-blur-md'
            : 'glass-panel text-amber-200 border-amber-500/30'
        }`}
      >
        {isPerfect ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 animate-bounce" />
        ) : (
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
        )}
        <div className="flex-1">
          <p className="font-semibold text-sm tracking-wide">{primaryInstruction}</p>
          {quality.instructions.length > 1 && (
            <p className="text-xs text-slate-300 opacity-80 mt-0.5">
              Next: {quality.instructions[1]}
            </p>
          )}
        </div>
        <div className="text-right shrink-0">
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-mono font-medium ${
              quality.overallConfidence >= 80
                ? 'bg-emerald-500/30 text-emerald-300'
                : quality.overallConfidence >= 55
                ? 'bg-amber-500/30 text-amber-300'
                : 'bg-rose-500/30 text-rose-300'
            }`}
          >
            {quality.overallConfidence}% Match
          </span>
        </div>
      </div>

      {/* Real-time Checklist Chips */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px] font-medium">
        {/* Full body */}
        <span
          className={`px-2.5 py-1 rounded-full flex items-center gap-1 backdrop-blur-md border ${
            quality.isFullBodyVisible
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
              : 'bg-slate-900/80 border-slate-700 text-slate-400'
          }`}
        >
          <Eye className="w-3 h-3" />
          Full Body
        </span>

        {/* Distance */}
        <span
          className={`px-2.5 py-1 rounded-full flex items-center gap-1 backdrop-blur-md border ${
            quality.distanceStatus === 'optimal'
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
              : 'bg-amber-950/60 border-amber-500/40 text-amber-300'
          }`}
        >
          <UserCheck className="w-3 h-3" />
          {quality.distanceStatus === 'optimal'
            ? 'Distance OK'
            : quality.distanceStatus === 'too_close'
            ? 'Too Close'
            : 'Too Far'}
        </span>

        {/* Alignment */}
        <span
          className={`px-2.5 py-1 rounded-full flex items-center gap-1 backdrop-blur-md border ${
            quality.isShoulderAligned && quality.isHipAligned
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
              : 'bg-slate-900/80 border-slate-700 text-slate-400'
          }`}
        >
          Posture
        </span>

        {/* Lighting */}
        <span
          className={`px-2.5 py-1 rounded-full flex items-center gap-1 backdrop-blur-md border ${
            quality.lightingStatus === 'optimal'
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
          }`}
        >
          <Sun className="w-3 h-3" />
          Light: {quality.brightnessValue}
        </span>

        {/* Multi-person */}
        {quality.personCount > 1 && (
          <span className="px-2.5 py-1 rounded-full flex items-center gap-1 bg-rose-950/80 border border-rose-500/50 text-rose-300 animate-pulse">
            <Users className="w-3 h-3" />
            {quality.personCount} People Detected
          </span>
        )}

        {/* FPS */}
        <span className="px-2 py-1 rounded-full bg-slate-900/70 border border-slate-800 text-slate-400 font-mono text-[10px]">
          {fps} FPS
        </span>
      </div>
    </div>
  )
}
