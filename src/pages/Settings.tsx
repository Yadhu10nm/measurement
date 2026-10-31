import React, { useState } from 'react'
import { clearAllLocalData } from '../services/storage/indexedDB'
import { isOpenCVReady } from '../services/opencv/opencvLoader'
import { 
  ShieldCheck, 
  Trash2, 
  Cpu, 
  AlertTriangle, 
  CheckCircle2, 
  Lock
} from 'lucide-react'

interface SettingsProps {
  onDataReset: () => void
}

export const Settings: React.FC<SettingsProps> = ({ onDataReset }) => {
  const [clearing, setClearing] = useState(false)
  const [cleared, setCleared] = useState(false)

  const handleClearAll = async () => {
    if (!confirm('This will wipe all local profiles, measurement history, and custom size charts from IndexedDB and LocalStorage. Proceed?')) {
      return
    }

    setClearing(true)
    try {
      await clearAllLocalData()
      setCleared(true)
      onDataReset()
    } catch (err) {
      console.warn('Clear error:', err)
    } finally {
      setClearing(false)
    }
  }

  const cvStatus = isOpenCVReady()

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-emerald-400" />
          <span>Privacy & System Diagnostics</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Review security guarantees, browser-native AI runtimes, and local data persistence.
        </p>
      </div>

      {/* Privacy Guarantees Matrix */}
      <section className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
        <div className="flex items-center gap-2 text-emerald-400">
          <Lock className="w-5 h-5" />
          <h2 className="text-base font-bold uppercase tracking-wider">Zero-Backend Privacy Architecture</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-white">No Cloud Server Or APIs</h4>
              <p className="text-xs text-slate-400 mt-1">
                Zero REST, GraphQL, or RPC endpoints. No data packets ever leave your browser window during scanning or analysis.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-white">No Image Uploads Or Storage</h4>
              <p className="text-xs text-slate-400 mt-1">
                Camera frames are processed in-memory directly in HTML5 Canvas and WebAssembly. No photos are transmitted to external servers.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-white">Browser-Scoped Storage</h4>
              <p className="text-xs text-slate-400 mt-1">
                Profiles and scan measurements reside strictly in your local device's browser IndexedDB and LocalStorage sandbox.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-white">Instant Stream Disconnect</h4>
              <p className="text-xs text-slate-400 mt-1">
                Camera hardware tracks are immediately revoked and stopped the moment you navigate away from the camera screen.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Engine & Hardware Runtimes */}
      <section className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Cpu className="w-5 h-5 text-indigo-400" />
          <span>Local Computer Vision Engines</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200">MediaPipe Tasks Vision</span>
              <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-emerald-500/20 text-emerald-300">
                WASM Active
              </span>
            </div>
            <p className="text-slate-400">
              33 Landmark Skeletal Tracking (Float16 Full/Lite model loaded locally from <code className="text-indigo-300">/models</code>)
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200">OpenCV.js Engine</span>
              <span className={`px-2 py-0.5 rounded font-mono text-[10px] ${
                cvStatus ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
              }`}>
                {cvStatus ? 'WASM Loaded' : 'Available (Dynamic)'}
              </span>
            </div>
            <p className="text-slate-400">
              Brightness & contrast analysis, Canny edge filter, contour analysis, and morphology operators.
            </p>
          </div>
        </div>
      </section>

      {/* Danger Zone: Clear Local Data */}
      <section className="glass-panel p-6 sm:p-8 rounded-3xl border border-rose-900/50 bg-rose-950/10 space-y-4">
        <div className="flex items-center gap-2 text-rose-400">
          <AlertTriangle className="w-5 h-5" />
          <h2 className="text-base font-bold">Data Management & Reset</h2>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
          Permanently delete all stored body profiles, past scan records, and custom brand size charts from your browser. This action cannot be undone.
        </p>

        {cleared ? (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
            All local data has been successfully wiped from IndexedDB and LocalStorage!
          </div>
        ) : (
          <button
            onClick={handleClearAll}
            disabled={clearing}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>{clearing ? 'Clearing Storage...' : 'Delete All Local Data'}</span>
          </button>
        )}
      </section>
    </div>
  )
}
