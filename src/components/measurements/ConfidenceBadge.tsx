import React from 'react'
import type { ConfidenceLevel } from '../../types/measurement'
import { ShieldCheck, ShieldAlert, AlertCircle } from 'lucide-react'

interface ConfidenceBadgeProps {
  level: ConfidenceLevel
  score: number
  uncertaintyCm?: number
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({
  level,
  score,
  uncertaintyCm,
}) => {
  if (level === 'high') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span>High ({score}%)</span>
        {uncertaintyCm && <span className="opacity-75 font-mono text-[10px]">±{uncertaintyCm}cm</span>}
      </span>
    )
  }

  if (level === 'medium') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
        <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
        <span>Medium ({score}%)</span>
        {uncertaintyCm && <span className="opacity-75 font-mono text-[10px]">±{uncertaintyCm}cm</span>}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/15 text-rose-300 border border-rose-500/30">
      <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
      <span>Low ({score}%)</span>
      {uncertaintyCm && <span className="opacity-75 font-mono text-[10px]">±{uncertaintyCm}cm</span>}
    </span>
  )
}
