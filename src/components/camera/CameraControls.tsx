import React from 'react'
import { Camera, RefreshCw, Layers, Sparkles, Check, Zap, ZapOff } from 'lucide-react'
import type { CameraDeviceInfo } from '../../services/camera/cameraService'

interface CameraControlsProps {
  cameras: CameraDeviceInfo[]
  selectedDeviceId: string
  facingMode: 'user' | 'environment'
  modelType: 'full' | 'lite'
  isReadyForCapture: boolean
  isCapturing: boolean
  captureProgress: number
  currentView: 'front' | 'side'
  frontCaptured: boolean
  sideCaptured: boolean
  autoCaptureEnabled: boolean
  countdownSeconds: number | null
  onSelectCamera: (id: string) => void
  onSwitchFacingMode: () => void
  onToggleModelType: () => void
  onToggleAutoCapture: () => void
  onTriggerCapture: () => void
  onSwitchView: (view: 'front' | 'side') => void
  onFinishAndProcess: () => void
}

export const CameraControls: React.FC<CameraControlsProps> = ({
  cameras,
  selectedDeviceId,
  facingMode,
  modelType,
  isReadyForCapture,
  isCapturing,
  captureProgress,
  currentView,
  frontCaptured,
  sideCaptured,
  autoCaptureEnabled,
  countdownSeconds,
  onSelectCamera,
  onSwitchFacingMode,
  onToggleModelType,
  onToggleAutoCapture,
  onTriggerCapture,
  onSwitchView,
  onFinishAndProcess,
}) => {
  return (
    <div className="flex flex-col gap-3 w-full max-w-xl mx-auto items-center">
      {/* View Switcher Tabs & Auto-Capture Status */}
      <div className="flex flex-wrap items-center justify-between w-full px-2 gap-2">
        <div className="flex items-center gap-2 p-1.5 rounded-2xl glass-panel text-xs font-medium">
          <button
            onClick={() => onSwitchView('front')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
              currentView === 'front'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {frontCaptured && <Check className="w-3.5 h-3.5 text-emerald-400" />}
            <span>1. Front View</span>
            {frontCaptured && <span className="text-[10px] text-emerald-300 font-mono">(Ready)</span>}
          </button>

          <button
            onClick={() => onSwitchView('side')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
              currentView === 'side'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {sideCaptured && <Check className="w-3.5 h-3.5 text-emerald-400" />}
            <span>2. Side View</span>
            <span className="text-[10px] text-slate-400">(Optional for depth)</span>
          </button>
        </div>

        {/* Auto-Capture Toggle Pill */}
        <button
          onClick={onToggleAutoCapture}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-semibold border transition-all ${
            autoCaptureEnabled
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/10'
              : 'glass-panel text-slate-400 border-slate-700 hover:text-slate-200'
          }`}
          title="Toggle Auto-Capture (automatically snaps when you hold position)"
        >
          {autoCaptureEnabled ? (
            <>
              <Zap className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400 animate-pulse" />
              <span>Auto-Capture ON</span>
            </>
          ) : (
            <>
              <ZapOff className="w-3.5 h-3.5 text-slate-500" />
              <span>Auto-Capture OFF</span>
            </>
          )}
        </button>
      </div>

      {/* Main Action Bar */}
      <div className="flex items-center justify-between w-full px-4 py-2 glass-panel rounded-3xl gap-3">
        {/* Left Options (Camera device & Model toggle) */}
        <div className="flex items-center gap-2">
          {cameras.length > 1 && (
            <select
              value={selectedDeviceId}
              onChange={(e) => onSelectCamera(e.target.value)}
              className="bg-slate-800 text-xs text-slate-200 border border-slate-700 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-[120px] truncate"
            >
              {cameras.map((c) => (
                <option key={c.deviceId} value={c.deviceId}>
                  {c.label}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={onSwitchFacingMode}
            title={`Switch Front / Rear Camera (Currently ${facingMode})`}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/60"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleModelType}
            title={`Switch Pose Model: Currently ${modelType.toUpperCase()}`}
            className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-mono">{modelType.toUpperCase()}</span>
          </button>
        </div>

        {/* Center: Primary Capture Button / Status Ring */}
        <div className="relative flex items-center justify-center">
          {isCapturing ? (
            <div className="flex flex-col items-center">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="rgba(99, 102, 241, 0.2)"
                    strokeWidth="4"
                    fill="none"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="#10b981"
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={175}
                    strokeDashoffset={175 - (175 * captureProgress) / 100}
                    className="transition-all duration-150"
                  />
                </svg>
                <span className="absolute text-xs font-mono font-bold text-emerald-400">
                  {captureProgress}%
                </span>
              </div>
              <span className="text-[11px] text-slate-300 mt-1 font-medium">Sampling frames...</span>
            </div>
          ) : countdownSeconds !== null ? (
            <div className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-500/30 border-2 border-emerald-400 text-emerald-200 font-bold text-sm animate-pulse">
              <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
              <span>Snapping in {countdownSeconds}s...</span>
            </div>
          ) : (
            <button
              onClick={onTriggerCapture}
              disabled={!isReadyForCapture}
              className={`relative px-7 py-3 rounded-2xl font-semibold text-sm flex items-center gap-2.5 transition-all shadow-xl ${
                isReadyForCapture
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/25 cursor-pointer transform hover:scale-105 active:scale-95'
                  : 'bg-slate-800/80 text-slate-500 border border-slate-700/50 cursor-not-allowed'
              }`}
            >
              <Camera className={`w-4 h-4 ${isReadyForCapture ? 'text-slate-950' : 'text-slate-500'}`} />
              <span>
                {autoCaptureEnabled
                  ? `Hold Still to Snap (${currentView === 'front' ? 'Front' : 'Side'})`
                  : `Capture ${currentView === 'front' ? 'Front' : 'Side'}`}
              </span>
            </button>
          )}
        </div>

        {/* Right: Proceed to Results Button */}
        <div>
          {frontCaptured ? (
            <button
              onClick={onFinishAndProcess}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-500/25 transition-all transform hover:scale-105"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Analyze Sizes</span>
            </button>
          ) : (
            <span className="text-[11px] text-slate-500 italic px-2">
              {autoCaptureEnabled ? 'Auto-snapping enabled' : 'Capture 1 to finish'}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
