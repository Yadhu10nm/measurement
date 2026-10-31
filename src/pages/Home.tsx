import React from 'react'
import type { UserProfile } from '../types/profile'
import type { MeasurementRecord } from '../types/sizing'
import { 
  Camera, 
  Ruler, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  History, 
  CheckCircle2, 
  Cpu, 
  Layers,
  ChevronRight
} from 'lucide-react'

interface HomeProps {
  activeProfile: UserProfile | null
  recentRecords: MeasurementRecord[]
  onStartMeasurement: () => void
  onOpenProfile: () => void
  onOpenResults: (record: MeasurementRecord) => void
  onOpenHistory: () => void
}

export const Home: React.FC<HomeProps> = ({
  activeProfile,
  recentRecords,
  onStartMeasurement,
  onOpenProfile,
  onOpenResults,
  onOpenHistory,
}) => {
  const latestRecord = recentRecords[0]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl glass-panel p-8 sm:p-12 border border-slate-800">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>Zero-Backend Client-Side Computer Vision Engine</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.1]">
            Instant Body Measurements & Tailored Size Matching.
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
            Stand in front of your webcam or phone camera. Our browser-native MediaPipe & OpenCV engine detects your 3D skeletal posture in real time, computes anthropometric dimensions, and matches your exact fit across shirts, suits, and denim.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={onStartMeasurement}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold text-base flex items-center gap-3 shadow-xl shadow-indigo-600/30 transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Camera className="w-5 h-5" />
              <span>Start Live Measurement</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            {!activeProfile && (
              <button
                onClick={onOpenProfile}
                className="px-6 py-4 rounded-2xl glass-panel text-slate-200 hover:text-white hover:bg-slate-800 font-semibold text-sm transition-all border border-slate-700/60"
              >
                Set Up Profile First (Height Required)
              </button>
            )}
          </div>

          {/* Key Privacy Highlights */}
          <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>100% Private (No image leaves your device)</span>
            </div>
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-400" />
              <span>Local WebAssembly & GPU Inference</span>
            </div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              <span>Ramanujan Ellipse 3D Approximation</span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Profile Card */}
        <div
          onClick={onOpenProfile}
          className="glass-panel-interactive p-5 rounded-2xl border border-slate-800 cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase font-semibold">Active Subject</span>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-mono">
              Profile
            </span>
          </div>
          <div className="my-3">
            <div className="text-xl font-bold text-white">
              {activeProfile ? activeProfile.name : 'No Profile Set'}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {activeProfile ? `Height: ${activeProfile.heightCm} cm` : 'Click to create calibration profile'}
            </p>
          </div>
          <div className="flex items-center text-xs text-indigo-400 font-medium">
            <span>Manage Profile</span>
            <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </div>

        {/* Total Scans Card */}
        <div
          onClick={onOpenHistory}
          className="glass-panel-interactive p-5 rounded-2xl border border-slate-800 cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase font-semibold">Saved Sessions</span>
            <History className="w-4 h-4 text-slate-400" />
          </div>
          <div className="my-3">
            <div className="text-3xl font-black font-mono text-white">
              {recentRecords.length}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Stored in local IndexedDB</p>
          </div>
          <div className="flex items-center text-xs text-indigo-400 font-medium">
            <span>View Measurement Log</span>
            <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </div>

        {/* Latest Scan Confidence */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase font-semibold">AI Confidence</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="my-3">
            <div className="text-3xl font-black font-mono text-emerald-400">
              {latestRecord ? `${latestRecord.measurements.overallConfidence}%` : 'N/A'}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {latestRecord ? 'Multi-frame verified' : 'Perform your first scan'}
            </p>
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            {latestRecord ? `Scale: ${latestRecord.measurements.pixelsPerCm} px/cm` : 'Ready to calibrate'}
          </div>
        </div>

        {/* Saved Recommendations */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase font-semibold">Garment Profiles</span>
            <Ruler className="w-4 h-4 text-purple-400" />
          </div>
          <div className="my-3">
            <div className="text-3xl font-black font-mono text-purple-400">9 Types</div>
            <p className="text-xs text-slate-400 mt-0.5">Shirts, Denim, Trousers & Jackets</p>
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Ease-adjusted matching
          </div>
        </div>
      </section>

      {/* Recent Measurements Quick Section */}
      {recentRecords.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Latest Body Scan Summary</h2>
              <p className="text-xs text-slate-400">Recorded {new Date(latestRecord.capturedAt).toLocaleString()}</p>
            </div>
            <button
              onClick={() => onOpenResults(latestRecord)}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              <span>View Full Analytics & Sizes</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {[
              { label: 'Shoulder', item: latestRecord.measurements.shoulderWidth },
              { label: 'Chest', item: latestRecord.measurements.chestCircumference },
              { label: 'Waist', item: latestRecord.measurements.waistCircumference },
              { label: 'Hips', item: latestRecord.measurements.hipCircumference },
              { label: 'Inseam', item: latestRecord.measurements.inseam },
              { label: 'Sleeve', item: latestRecord.measurements.sleeveLength },
            ].map(({ label, item }) => (
              <div key={label} className="glass-panel p-3.5 rounded-xl border border-slate-800/80">
                <span className="text-[11px] text-slate-400 block font-medium">{label}</span>
                <span className="text-xl font-bold font-mono text-white mt-0.5 block">
                  {item.valueCm.toFixed(1)} <span className="text-xs text-slate-400 font-normal">cm</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {(item.valueCm / 2.54).toFixed(1)} in
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* How It Works Guide */}
      <section className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6">
        <h2 className="text-xl font-bold text-white text-center">How Browser-Native AI Body Measuring Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 font-black font-mono flex items-center justify-center text-lg">
              1
            </div>
            <h3 className="font-bold text-white text-base">Height-Calibrated Scale</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Using your actual standing height and anthropometric vertex correction, our calibration engine derives the precise <code className="text-indigo-300">pixelsPerCm</code> ratio without needing reference markers or calibration cards.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 font-black font-mono flex items-center justify-center text-lg">
              2
            </div>
            <h3 className="font-bold text-white text-base">Skeletal Geometry & Ellipse</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              MediaPipe extracts 33 landmarks while OpenCV inspects lighting and posture stability. 3D circumferences are computed via Ramanujan’s ellipse approximation across transverse width and sagittal depth.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 font-black font-mono flex items-center justify-center text-lg">
              3
            </div>
            <h3 className="font-bold text-white text-base">Garment Ease Matching</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Body dimensions are cross-referenced with tailoring size charts. Tailoring ease allowances (for stretch, drape, and movement) ensure accurate size recommendations for shirts, jeans, and suits.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
