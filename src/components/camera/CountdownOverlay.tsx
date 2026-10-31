import React from 'react'
import { Sparkles } from 'lucide-react'

interface CountdownOverlayProps {
  seconds: number | null
  currentView: 'front' | 'side'
}

export const CountdownOverlay: React.FC<CountdownOverlayProps> = ({
  seconds,
  currentView,
}) => {
  if (seconds === null) return null

  return (
    <div className="absolute inset-0 z-30 pointer-events-none flex flex-col items-center justify-center bg-black/35 backdrop-blur-[2px] transition-all animate-fade-in">
      <div className="relative flex flex-col items-center">
        {/* Pulsing circular aura */}
        <div className="w-36 h-36 rounded-full border-4 border-emerald-400/80 flex items-center justify-center bg-slate-950/80 shadow-[0_0_40px_rgba(16,185,129,0.5)] animate-pulse">
          <span className="text-7xl font-black font-mono text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.8)]">
            {seconds}
          </span>
        </div>

        {/* Text Banner */}
        <div className="mt-4 px-5 py-2 rounded-2xl glass-panel border border-emerald-500/40 text-emerald-200 text-sm font-bold flex items-center gap-2 shadow-xl">
          <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
          <span>Hold steady! Auto-capturing {currentView === 'front' ? 'Front' : 'Side'} View...</span>
        </div>
      </div>
    </div>
  )
}
