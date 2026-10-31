import React from 'react'

interface BodyVisualizerProps {
  selectedKey?: string
  frontImageUrl?: string
  landmarks?: any[]
  highlightRegion?: string
}

export const BodyVisualizer: React.FC<BodyVisualizerProps> = ({
  selectedKey,
  frontImageUrl,
}) => {
  // If user captured snapshot image, we show it with overlay guides
  if (frontImageUrl) {
    return (
      <div className="relative rounded-3xl overflow-hidden glass-panel border border-slate-700/60 aspect-[3/4] max-h-[460px] flex items-center justify-center bg-slate-950">
        <img
          src={frontImageUrl}
          alt="Subject capture"
          className="w-full h-full object-cover filter brightness-90"
        />
        
        {/* Visual measurement guide overlays */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/40" />

        {/* Dynamic highlighted anatomical plane */}
        {selectedKey && (
          <div className="absolute top-4 left-4 right-4 glass-panel px-3 py-1.5 rounded-xl border border-indigo-500/40 text-xs text-indigo-300 flex items-center justify-between">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Active Focus Plane:</span>
            <span className="font-mono text-white capitalize">{selectedKey.replace(/([A-Z])/g, ' $1')}</span>
          </div>
        )}
      </div>
    )
  }

  // Interactive anatomical schematic vector
  const isHighlighted = (region: string) => {
    if (!selectedKey) return false
    const keyLower = selectedKey.toLowerCase()
    return keyLower.includes(region.toLowerCase())
  }

  return (
    <div className="relative rounded-3xl p-6 glass-panel border border-slate-700/60 aspect-[3/4] max-h-[460px] flex flex-col items-center justify-center bg-slate-950/80">
      <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
        Anatomical Coordinate Matrix
      </div>

      <svg viewBox="0 0 300 480" className="w-full h-full max-h-[380px]">
        {/* Human Silhouette outline */}
        <path
          d="M150 40 C162 40 172 50 172 65 C172 80 162 90 150 90 C138 90 128 80 128 65 C128 50 138 40 150 40 Z"
          fill="rgba(99, 102, 241, 0.1)"
          stroke="#475569"
          strokeWidth="1.5"
        />
        {/* Torso & Limbs */}
        <path
          d="M100 120 L150 108 L200 120 L190 230 L110 230 Z"
          fill="rgba(99, 102, 241, 0.12)"
          stroke="#475569"
          strokeWidth="1.5"
        />
        {/* Arms */}
        <path d="M100 120 L65 210 L50 280" stroke="#475569" strokeWidth="2" fill="none" />
        <path d="M200 120 L235 210 L250 280" stroke="#475569" strokeWidth="2" fill="none" />
        {/* Legs */}
        <path d="M125 230 L120 340 L125 440" stroke="#475569" strokeWidth="2" fill="none" />
        <path d="M175 230 L180 340 L175 440" stroke="#475569" strokeWidth="2" fill="none" />

        {/* --- Highlighted Measurement Planes --- */}

        {/* Shoulder */}
        <g className={isHighlighted('shoulder') ? 'opacity-100' : 'opacity-40'}>
          <line x1="90" y1="120" x2="210" y2="120" stroke="#38bdf8" strokeWidth="3" strokeDasharray="4 2" />
          <circle cx="100" cy="120" r="4" fill="#38bdf8" />
          <circle cx="200" cy="120" r="4" fill="#38bdf8" />
        </g>

        {/* Chest */}
        <g className={isHighlighted('chest') ? 'opacity-100' : 'opacity-40'}>
          <ellipse cx="150" cy="148" rx="42" ry="9" stroke="#a855f7" strokeWidth="3" fill="none" />
        </g>

        {/* Waist */}
        <g className={isHighlighted('waist') ? 'opacity-100' : 'opacity-40'}>
          <ellipse cx="150" cy="195" rx="36" ry="8" stroke="#10b981" strokeWidth="3" fill="none" />
        </g>

        {/* Hip */}
        <g className={isHighlighted('hip') ? 'opacity-100' : 'opacity-40'}>
          <ellipse cx="150" cy="235" rx="46" ry="9" stroke="#ec4899" strokeWidth="3" fill="none" />
        </g>

        {/* Sleeve */}
        <g className={isHighlighted('sleeve') ? 'opacity-100' : 'opacity-40'}>
          <path d="M100 120 L65 210 L50 280" stroke="#f59e0b" strokeWidth="3.5" fill="none" />
        </g>

        {/* Inseam */}
        <g className={isHighlighted('inseam') ? 'opacity-100' : 'opacity-40'}>
          <line x1="150" y1="245" x2="135" y2="440" stroke="#06b6d4" strokeWidth="3" strokeDasharray="4 2" />
        </g>

        {/* Outseam */}
        <g className={isHighlighted('outseam') ? 'opacity-100' : 'opacity-40'}>
          <line x1="190" y1="230" x2="185" y2="440" stroke="#6366f1" strokeWidth="3" strokeDasharray="4 2" />
        </g>

        {/* Thigh */}
        <g className={isHighlighted('thigh') ? 'opacity-100' : 'opacity-40'}>
          <ellipse cx="123" cy="285" rx="16" ry="6" stroke="#eab308" strokeWidth="2.5" fill="none" />
        </g>
      </svg>
    </div>
  )
}
