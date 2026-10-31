import React, { useState, useEffect } from 'react'
import type { MeasurementRecord } from '../types/sizing'
import { 
  getAllMeasurements, 
  deleteMeasurementRecord, 
  exportMeasurementsToCSV,
  exportToJSON
} from '../services/storage/measurementStorage'
import { 
  History as HistoryIcon, 
  Download, 
  Trash2, 
  ArrowLeftRight, 
  Eye, 
  Calendar, 
  FileSpreadsheet
} from 'lucide-react'

interface HistoryProps {
  onOpenRecord: (record: MeasurementRecord) => void
}

export const History: React.FC<HistoryProps> = ({ onOpenRecord }) => {
  const [records, setRecords] = useState<MeasurementRecord[]>([])
  const [compareIds, setCompareIds] = useState<[string, string] | null>(null)
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    try {
      const all = await getAllMeasurements()
      setRecords(all)
    } catch (e) {
      console.warn('Failed to load history:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this scan session?')) return
    await deleteMeasurementRecord(id)
    if (compareIds && (compareIds[0] === id || compareIds[1] === id)) {
      setCompareIds(null)
    }
    await loadData()
  }

  const toggleCompare = (id: string) => {
    if (!compareIds) {
      setCompareIds([id, ''])
    } else if (compareIds[0] === id) {
      setCompareIds(null)
    } else if (!compareIds[1]) {
      setCompareIds([compareIds[0], id])
    } else if (compareIds[1] === id) {
      setCompareIds([compareIds[0], ''])
    } else {
      setCompareIds([compareIds[1], id])
    }
  }

  const recordA = records.find(r => r.id === compareIds?.[0])
  const recordB = records.find(r => r.id === compareIds?.[1])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <HistoryIcon className="w-7 h-7 text-indigo-400" />
            <span>Measurement History & Comparison</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Persisted securely in local IndexedDB. All sessions stay strictly on your device.
          </p>
        </div>

        {/* Global Export actions */}
        {records.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportMeasurementsToCSV(records)}
              className="px-3.5 py-2 rounded-xl glass-panel text-xs font-semibold text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => exportToJSON(records, `all_body_measurements_${Date.now()}.json`)}
              className="px-3.5 py-2 rounded-xl glass-panel text-xs font-semibold text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Export All JSON</span>
            </button>
          </div>
        )}
      </div>

      {/* Comparison Drawer (if two records selected) */}
      {recordA && recordB && (
        <div className="glass-panel p-6 rounded-3xl border border-indigo-500/50 bg-indigo-950/20 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-indigo-500/30">
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-bold text-white">
                Comparing Scans: {new Date(recordA.capturedAt).toLocaleDateString()} vs {new Date(recordB.capturedAt).toLocaleDateString()}
              </h2>
            </div>
            <button
              onClick={() => setCompareIds(null)}
              className="text-xs text-slate-400 hover:text-white underline"
            >
              Clear Comparison
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2">Dimension</th>
                  <th className="py-2">Session A ({new Date(recordA.capturedAt).toLocaleDateString()})</th>
                  <th className="py-2">Session B ({new Date(recordB.capturedAt).toLocaleDateString()})</th>
                  <th className="py-2 font-mono">Delta (B - A)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {[
                  { key: 'chestCircumference', label: 'Chest Circumference' },
                  { key: 'waistCircumference', label: 'Waist Circumference' },
                  { key: 'hipCircumference', label: 'Hip Circumference' },
                  { key: 'shoulderWidth', label: 'Shoulder Width' },
                  { key: 'sleeveLength', label: 'Sleeve Length' },
                  { key: 'inseam', label: 'Inseam Length' },
                  { key: 'thighCircumference', label: 'Thigh Circumference' },
                ].map(({ key, label }) => {
                  const valA = (recordA.measurements as any)[key]?.valueCm || 0
                  const valB = (recordB.measurements as any)[key]?.valueCm || 0
                  const delta = Math.round((valB - valA) * 10) / 10
                  return (
                    <tr key={key} className="hover:bg-slate-800/30">
                      <td className="py-2.5 font-sans font-medium text-slate-300">{label}</td>
                      <td className="py-2.5 text-white">{valA} cm</td>
                      <td className="py-2.5 text-white">{valB} cm</td>
                      <td className="py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded font-bold ${
                            delta === 0
                              ? 'text-slate-400'
                              : delta > 0
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}
                        >
                          {delta > 0 ? `+${delta}` : delta} cm
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sessions List */}
      <div className="space-y-4">
        {records.map((rec) => {
          const isSelectedForCompare = compareIds?.[0] === rec.id || compareIds?.[1] === rec.id
          return (
            <div
              key={rec.id}
              className={`glass-panel p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                isSelectedForCompare
                  ? 'border-indigo-500 bg-indigo-950/30'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start sm:items-center gap-4">
                {rec.frontThumbnail ? (
                  <img
                    src={rec.frontThumbnail}
                    alt="Scan thumbnail"
                    className="w-14 h-18 object-cover rounded-xl border border-slate-700 shrink-0 bg-slate-950"
                  />
                ) : (
                  <div className="w-14 h-18 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                    <Calendar className="w-6 h-6 text-slate-500" />
                  </div>
                )}

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-white">{rec.profileName}</h3>
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-mono">
                      Height: {rec.heightCm} cm
                    </span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono">
                      {rec.measurements.overallConfidence}% Conf.
                    </span>
                    {rec.manuallyEditedCount > 0 && (
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-mono">
                        {rec.manuallyEditedCount} Edited
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    {new Date(rec.capturedAt).toLocaleString()} • Views: {rec.measurements.viewsCaptured.join(' & ')}
                  </p>
                  
                  {/* Quick summary chips */}
                  <div className="flex flex-wrap gap-2 text-[11px] font-mono text-slate-300 pt-1">
                    <span>Chest: {rec.measurements.chestCircumference.valueCm}cm</span>
                    <span className="text-slate-600">•</span>
                    <span>Waist: {rec.measurements.waistCircumference.valueCm}cm</span>
                    <span className="text-slate-600">•</span>
                    <span>Hips: {rec.measurements.hipCircumference.valueCm}cm</span>
                    <span className="text-slate-600">•</span>
                    <span>Inseam: {rec.measurements.inseam.valueCm}cm</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                <button
                  onClick={() => toggleCompare(rec.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                    isSelectedForCompare
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'glass-panel text-slate-300 hover:text-white border-slate-700'
                  }`}
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  <span>{isSelectedForCompare ? 'Selected' : 'Compare'}</span>
                </button>

                <button
                  onClick={() => onOpenRecord(rec)}
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600/80 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Details</span>
                </button>

                <button
                  onClick={() => handleDelete(rec.id)}
                  className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                  title="Delete scan record"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )
        })}

        {!loading && records.length === 0 && (
          <div className="glass-panel p-12 rounded-3xl text-center space-y-3">
            <HistoryIcon className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No Measurement Sessions Saved</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Run a camera scan and click "Save Session" on the results page to store records locally in your browser.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
