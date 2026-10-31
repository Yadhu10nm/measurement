import React, { useState } from 'react'
import type { SizeRecommendation } from '../../types/sizing'
import { Sparkles, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'

interface ClothingRecommendationCardProps {
  rec: SizeRecommendation
}

export const ClothingRecommendationCard: React.FC<ClothingRecommendationCardProps> = ({ rec }) => {
  const [expanded, setExpanded] = useState(false)

  const getFitBadge = (fit: SizeRecommendation['fitType']) => {
    switch (fit) {
      case 'perfect':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
      case 'slim':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30'
      case 'relaxed':
        return 'bg-sky-500/15 text-sky-300 border-sky-500/30'
      default:
        return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
    }
  }

  return (
    <div className="glass-panel rounded-2xl p-4 border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col justify-between">
      <div>
        {/* Top Info */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-indigo-400 font-semibold uppercase tracking-wider">
                {rec.brand}
              </span>
            </div>
            <h4 className="text-base font-bold text-white mt-0.5">{rec.garmentLabel}</h4>
          </div>

          <div className="text-right">
            <div className="text-2xl font-black font-mono text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]">
              {rec.recommendedSize}
            </div>
            <span
              className={`text-[10px] font-medium px-2 py-0.5 rounded-full border uppercase tracking-wider ${getFitBadge(
                rec.fitType
              )}`}
            >
              {rec.fitType} Fit
            </span>
          </div>
        </div>

        {/* AI Fit explanation */}
        <p className="text-xs text-slate-300 mt-3 leading-relaxed bg-slate-900/50 p-2.5 rounded-xl border border-slate-800">
          <Sparkles className="w-3.5 h-3.5 text-amber-300 inline mr-1" />
          {rec.explanation}
        </p>

        {/* Warnings / fit alerts */}
        {rec.warnings.length > 0 && (
          <div className="mt-2 space-y-1">
            {rec.warnings.map((w, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 text-[11px] text-amber-300 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20"
              >
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{w}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Accordion Toggle */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/80">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-white transition-colors"
        >
          <span>Fit Details & Alternatives ({rec.alternativeSizes.length})</span>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {expanded && (
          <div className="mt-3 space-y-3 pt-1 text-xs">
            {/* Matching Points Table */}
            <div>
              <span className="text-[11px] text-slate-400 font-semibold block mb-1.5">
                Dimension Matching vs Size {rec.recommendedSize}
              </span>
              <div className="space-y-1">
                {rec.matchingPoints.map((pt, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-slate-900/70 px-2.5 py-1.5 rounded-lg font-mono text-[11px]"
                  >
                    <span className="text-slate-300">{pt.dimension}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">
                        Body: <strong className="text-white">{pt.bodyCm.toFixed(1)}</strong>cm
                      </span>
                      <span className="text-slate-500">|</span>
                      <span className="text-slate-400">
                        Range: {pt.chartRangeCm[0]}-{pt.chartRangeCm[1]}cm
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-sans uppercase font-bold ${
                          pt.status === 'in_range'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : pt.status === 'tight'
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {pt.status === 'in_range' ? 'Match' : pt.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Alternatives */}
            {rec.alternativeSizes.length > 0 && (
              <div>
                <span className="text-[11px] text-slate-400 font-semibold block mb-1">
                  Alternative Size Options
                </span>
                <div className="space-y-1">
                  {rec.alternativeSizes.map((alt, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between bg-slate-900/40 px-2.5 py-1.5 rounded-lg border border-slate-800 text-[11px]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                          {alt.size}
                        </span>
                        <span className="text-slate-300 capitalize">{alt.fitType} fit</span>
                      </div>
                      <span className="text-slate-400 text-[10px]">{alt.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
