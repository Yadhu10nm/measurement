import React from 'react'
import type { MeasurementItem } from '../../types/measurement'
import { ConfidenceBadge } from './ConfidenceBadge'
import { Edit3, CheckCircle } from 'lucide-react'

interface MeasurementCardProps {
  item: MeasurementItem
  onEdit: (item: MeasurementItem) => void
  showInches?: boolean
  isSelected?: boolean
  onSelect?: () => void
}

export const MeasurementCard: React.FC<MeasurementCardProps> = ({
  item,
  onEdit,
  showInches = false,
  isSelected = false,
  onSelect,
}) => {
  const displayVal = showInches
    ? `${(item.valueCm / 2.54).toFixed(1)} in`
    : `${item.valueCm.toFixed(1)} cm`

  const getMethodBadge = (m: MeasurementItem['method']) => {
    switch (m) {
      case 'direct_geometric':
        return { label: 'Geometric', bg: 'bg-blue-500/10 text-blue-300 border-blue-500/20' }
      case 'ramanujan_circumference':
        return { label: 'Ramanujan Ellipse', bg: 'bg-purple-500/10 text-purple-300 border-purple-500/20' }
      case 'multi_view_aggregation':
        return { label: 'Dual-Plane 3D', bg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' }
      case 'manual_override':
        return { label: 'User Verified', bg: 'bg-amber-500/10 text-amber-300 border-amber-500/20' }
      default:
        return { label: 'Estimated', bg: 'bg-slate-500/10 text-slate-300 border-slate-500/20' }
    }
  }

  const methodBadge = getMethodBadge(item.method)

  return (
    <div
      onClick={onSelect}
      className={`glass-panel p-4 rounded-2xl transition-all duration-200 border cursor-pointer ${
        isSelected
          ? 'border-indigo-500 shadow-lg shadow-indigo-500/10 bg-indigo-950/20'
          : 'border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-slate-200">{item.label}</h4>
            {item.isManuallyEdited && (
              <span className="flex items-center gap-1 text-[10px] text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full font-medium">
                <CheckCircle className="w-2.5 h-2.5" />
                Edited
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{item.description}</p>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation()
            onEdit(item)
          }}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
          title="Edit measurement"
        >
          <Edit3 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <span className="text-2xl font-bold font-mono tracking-tight text-white">
          {displayVal}
        </span>
        <ConfidenceBadge
          level={item.confidence}
          score={item.confidenceScore}
          uncertaintyCm={item.uncertaintyCm}
        />
      </div>

      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
        <span className={`px-2 py-0.5 rounded-md border font-mono text-[10px] ${methodBadge.bg}`}>
          {methodBadge.label}
        </span>
        <span className="text-slate-400 text-[10px]">
          {showInches ? `${item.valueCm.toFixed(1)} cm` : `${(item.valueCm / 2.54).toFixed(1)} in`}
        </span>
      </div>
    </div>
  )
}
