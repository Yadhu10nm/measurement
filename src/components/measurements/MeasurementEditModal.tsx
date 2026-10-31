import React, { useState } from 'react'
import type { MeasurementItem } from '../../types/measurement'
import { X, Check, RotateCcw, AlertTriangle } from 'lucide-react'

interface MeasurementEditModalProps {
  item: MeasurementItem | null
  isOpen: boolean
  onClose: () => void
  onSave: (key: string, newValueCm: number) => void
}

export const MeasurementEditModal: React.FC<MeasurementEditModalProps> = ({
  item,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen || !item) return null

  const [val, setVal] = useState<number>(item.valueCm)

  const handleStep = (delta: number) => {
    setVal(prev => Math.round((prev + delta) * 10) / 10)
  }

  const handleResetToAI = () => {
    setVal(item.originalValueCm)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(item.key, val)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-md rounded-3xl p-6 border border-slate-700 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Edit {item.label}</span>
              {item.isManuallyEdited && (
                <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-mono">
                  Custom
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          <div className="flex flex-col items-center">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-2">
              Dimension Value (cm)
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleStep(-1.0)}
                className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-lg font-bold text-slate-200 transition-all flex items-center justify-center active:scale-95"
              >
                -1
              </button>
              <button
                type="button"
                onClick={() => handleStep(-0.2)}
                className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm font-semibold text-slate-200 transition-all flex items-center justify-center active:scale-95"
              >
                -.2
              </button>
              
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="5"
                  max="300"
                  value={val}
                  onChange={(e) => setVal(parseFloat(e.target.value) || 0)}
                  className="w-32 py-2 px-3 text-center text-3xl font-mono font-bold bg-slate-900 border-2 border-indigo-500/50 rounded-2xl text-white focus:outline-none focus:border-indigo-400"
                />
              </div>

              <button
                type="button"
                onClick={() => handleStep(0.2)}
                className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm font-semibold text-slate-200 transition-all flex items-center justify-center active:scale-95"
              >
                +.2
              </button>
              <button
                type="button"
                onClick={() => handleStep(1.0)}
                className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-lg font-bold text-slate-200 transition-all flex items-center justify-center active:scale-95"
              >
                +1
              </button>
            </div>

            <div className="text-xs text-slate-400 mt-2 font-mono">
              Equivalent to: {(val / 2.54).toFixed(1)} inches
            </div>
          </div>

          {/* AI baseline reference */}
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400">AI Estimated Original:</span>{' '}
              <span className="font-mono text-indigo-300 font-bold">{item.originalValueCm} cm</span>
            </div>
            {val !== item.originalValueCm && (
              <button
                type="button"
                onClick={handleResetToAI}
                className="flex items-center gap-1 text-slate-300 hover:text-indigo-300 text-[11px] underline"
              >
                <RotateCcw className="w-3 h-3" />
                Reset to AI
              </button>
            )}
          </div>

          <div className="flex items-start gap-2 text-[11px] text-amber-300/80 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>
              Manually edited values are recorded as user-verified adjustments and will immediately recalculate all clothing size recommendations.
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all"
            >
              <Check className="w-4 h-4" />
              Save Measurement
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
