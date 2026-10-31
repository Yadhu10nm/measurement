import React from 'react'

interface SilhouetteOverlayProps {
  isAligned: boolean
  viewMode: 'front' | 'side'
}

export const SilhouetteOverlay: React.FC<SilhouetteOverlayProps> = ({
  isAligned,
  viewMode,
}) => {
  const strokeColor = isAligned ? '#10b981' : 'rgba(255, 255, 255, 0.35)'
  const fillColor = isAligned ? 'rgba(16, 185, 129, 0.08)' : 'rgba(99, 102, 241, 0.04)'

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-4">
      <svg
        viewBox="0 0 400 800"
        preserveAspectRatio="xMidYMid meet"
        className={`w-full h-full max-h-[90vh] transition-all duration-300 ${
          isAligned ? 'scale-[1.01] filter drop-shadow-[0_0_12px_rgba(16,185,129,0.5)]' : 'opacity-70'
        }`}
      >
        {viewMode === 'front' ? (
          // Front A-Pose Full Body Silhouette Guide
          <g>
            {/* Head oval */}
            <ellipse
              cx="200"
              cy="95"
              rx="38"
              ry="48"
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth="2.5"
              strokeDasharray={isAligned ? 'none' : '6 4'}
            />

            {/* Neck */}
            <path
              d="M185 142 L185 165 L215 165 L215 142"
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth="2.5"
            />

            {/* Torso & Shoulders */}
            <path
              d="M130 175 L200 165 L270 175 L255 350 L145 350 Z"
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth="2.5"
              strokeDasharray={isAligned ? 'none' : '6 4'}
            />

            {/* Left Arm (A-Pose angle) */}
            <path
              d="M130 175 L75 320 L55 420 L75 425 L100 325 L145 220"
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth="2.5"
            />

            {/* Right Arm (A-Pose angle) */}
            <path
              d="M270 175 L325 320 L345 420 L325 425 L300 325 L255 220"
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth="2.5"
            />

            {/* Pelvis & Legs */}
            {/* Left Leg */}
            <path
              d="M145 350 L140 540 L150 710 L125 715 L120 540 L190 350"
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth="2.5"
            />

            {/* Right Leg */}
            <path
              d="M255 350 L260 540 L250 710 L275 715 L280 540 L210 350"
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth="2.5"
            />

            {/* Alignment horizontal guides */}
            <line x1="80" y1="175" x2="320" y2="175" stroke={strokeColor} strokeWidth="1" strokeDasharray="4 4" />
            <text x="325" y="178" fill={strokeColor} fontSize="11" fontFamily="sans-serif">Shoulders</text>

            <line x1="110" y1="350" x2="290" y2="350" stroke={strokeColor} strokeWidth="1" strokeDasharray="4 4" />
            <text x="295" y="353" fill={strokeColor} fontSize="11" fontFamily="sans-serif">Hips</text>

            <line x1="100" y1="710" x2="300" y2="710" stroke={strokeColor} strokeWidth="1" strokeDasharray="4 4" />
            <text x="305" y="713" fill={strokeColor} fontSize="11" fontFamily="sans-serif">Feet Base</text>
          </g>
        ) : (
          // Side Profile Full Body Silhouette Guide
          <g>
            {/* Side Head & Nose profile */}
            <path
              d="M185 55 Q235 55 235 95 Q235 125 210 145 L200 165 L175 165 Q165 120 165 95 Q165 55 185 55 Z"
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth="2.5"
              strokeDasharray={isAligned ? 'none' : '6 4'}
            />

            {/* Side Torso & Spine curve */}
            <path
              d="M175 165 Q150 240 160 320 Q165 370 175 400 L215 390 Q230 330 220 250 Q215 190 200 165 Z"
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth="2.5"
              strokeDasharray={isAligned ? 'none' : '6 4'}
            />

            {/* Side Leg & Foot */}
            <path
              d="M175 400 Q165 530 175 600 L170 710 L230 710 L210 680 L205 600 Q215 500 215 390 Z"
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth="2.5"
            />

            {/* Side Arm */}
            <path
              d="M185 180 L180 300 L175 410 L195 410 L200 300 L195 180 Z"
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth="2"
            />

            <line x1="120" y1="165" x2="280" y2="165" stroke={strokeColor} strokeWidth="1" strokeDasharray="4 4" />
            <line x1="120" y1="390" x2="280" y2="390" stroke={strokeColor} strokeWidth="1" strokeDasharray="4 4" />
            <line x1="120" y1="710" x2="280" y2="710" stroke={strokeColor} strokeWidth="1" strokeDasharray="4 4" />
            <text x="285" y="393" fill={strokeColor} fontSize="11" fontFamily="sans-serif">Side Plane</text>
          </g>
        )}
      </svg>
    </div>
  )
}
