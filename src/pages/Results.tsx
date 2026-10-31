import React, { useState } from 'react'
import type { MeasurementRecord } from '../types/sizing'
import type { MeasurementItem, BodyMeasurements } from '../types/measurement'
import { MeasurementCard } from '../components/measurements/MeasurementCard'
import { MeasurementEditModal } from '../components/measurements/MeasurementEditModal'
import { BodyVisualizer } from '../components/measurements/BodyVisualizer'
import { ClothingRecommendationCard } from '../components/dashboard/ClothingRecommendationCard'
import { CustomSizeChartModal } from '../components/dashboard/CustomSizeChartModal'
import { saveMeasurementRecord, exportToJSON } from '../services/storage/measurementStorage'
import { generateAllGarmentRecommendations } from '../services/sizing/sizeMatcher'
import confetti from 'canvas-confetti'
import { 
  Sparkles, 
  Save, 
  Download, 
  Plus, 
  Check, 
  Ruler, 
  Shirt, 
  Scissors,
  History
} from 'lucide-react'

interface ResultsProps {
  initialRecord: MeasurementRecord
  onRecordSaved?: (record: MeasurementRecord) => void
  onNavigateToHistory: () => void
}

export const Results: React.FC<ResultsProps> = ({
  initialRecord,
  onRecordSaved,
  onNavigateToHistory,
}) => {
  const [record, setRecord] = useState<MeasurementRecord>(initialRecord)
  const [showInches, setShowInches] = useState(false)
  const [selectedMeasurementKey, setSelectedMeasurementKey] = useState<string>('shoulderWidth')
  const [editingItem, setEditingItem] = useState<MeasurementItem | null>(null)
  const [isCustomChartModalOpen, setIsCustomChartModalOpen] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [selectedGarmentFilter, setSelectedGarmentFilter] = useState<string>('all')

  const measurements = record.measurements

  // Trigger celebration confetti on mount
  React.useEffect(() => {
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
    })
  }, [])

  // Handle saving manual edit on any measurement item
  const handleSaveEdit = (key: string, newValueCm: number) => {
    const updatedMeasurements = { ...record.measurements }
    const targetItem = updatedMeasurements[key as keyof BodyMeasurements] as unknown as MeasurementItem

    if (targetItem && typeof targetItem === 'object') {
      const updatedItem: MeasurementItem = {
        ...targetItem,
        valueCm: Math.round(newValueCm * 10) / 10,
        isManuallyEdited: true,
        method: 'manual_override',
        confidence: 'high',
        confidenceScore: 95,
      }
      ;(updatedMeasurements as any)[key] = updatedItem

      // Recalculate clothing recommendations with updated dimensions
      const updatedRecs = generateAllGarmentRecommendations(updatedMeasurements)

      const updatedRecord: MeasurementRecord = {
        ...record,
        measurements: updatedMeasurements,
        recommendations: updatedRecs,
        manuallyEditedCount: record.manuallyEditedCount + 1,
      }

      setRecord(updatedRecord)
      setIsSaved(false)
    }
  }

  // Save session record to IndexedDB
  const handleSaveToIndexedDB = async () => {
    try {
      await saveMeasurementRecord(record)
      setIsSaved(true)
      if (onRecordSaved) onRecordSaved(record)
    } catch (err) {
      console.warn('Failed to save to IndexedDB:', err)
    }
  }

  // Refresh recommendations when new custom charts are saved
  const handleCustomChartSaved = () => {
    const updatedRecs = generateAllGarmentRecommendations(record.measurements)
    setRecord(prev => ({ ...prev, recommendations: updatedRecs }))
  }

  const upperItems: MeasurementItem[] = [
    measurements.shoulderWidth,
    measurements.chestCircumference,
    measurements.waistCircumference,
    measurements.sleeveLength,
    measurements.upperArmCircumference,
    measurements.shirtLength,
    measurements.neckCircumference,
  ]

  const lowerItems: MeasurementItem[] = [
    measurements.hipCircumference,
    measurements.thighCircumference,
    measurements.kneeCircumference,
    measurements.inseam,
    measurements.outseam,
    measurements.legOpening,
  ]

  const filteredRecommendations = record.recommendations.filter(r => {
    if (selectedGarmentFilter === 'all') return true
    if (selectedGarmentFilter === 'upper') {
      return ['t_shirt', 'shirt', 'hoodie', 'jacket', 'sweater'].includes(r.garmentType)
    }
    if (selectedGarmentFilter === 'lower') {
      return ['trousers', 'jeans', 'shorts', 'formal_pants'].includes(r.garmentType)
    }
    return r.garmentType === selectedGarmentFilter
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10">
      {/* Top Header & Session Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Measurement Diagnostics Complete
            </span>
            {record.manuallyEditedCount > 0 && (
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono">
                {record.manuallyEditedCount} Custom Override(s)
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
            {record.profileName}'s Body Measurements
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Captured {new Date(record.capturedAt).toLocaleString()} • Calibrated Height: {record.heightCm} cm • Scale: {record.measurements.pixelsPerCm} px/cm
          </p>
        </div>

        {/* Global Actions (Unit Toggle, Save, Export) */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Unit Toggle Button */}
          <button
            onClick={() => setShowInches(!showInches)}
            className="px-3.5 py-2 rounded-xl glass-panel text-xs font-semibold text-slate-300 hover:text-white border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <Ruler className="w-3.5 h-3.5 text-indigo-400" />
            <span>Unit: {showInches ? 'Inches (in)' : 'Metric (cm)'}</span>
          </button>

          {/* Export JSON Button */}
          <button
            onClick={() => exportToJSON(record, `measurements_${record.profileName}_${Date.now()}.json`)}
            className="px-3.5 py-2 rounded-xl glass-panel text-xs font-semibold text-slate-300 hover:text-white border border-slate-700 transition-colors flex items-center gap-1.5"
            title="Export full diagnostic JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>

          {/* Save to History Button */}
          <button
            onClick={handleSaveToIndexedDB}
            disabled={isSaved}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg ${
              isSaved
                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 cursor-default'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 cursor-pointer'
            }`}
          >
            {isSaved ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Save className="w-3.5 h-3.5" />}
            <span>{isSaved ? 'Saved Locally' : 'Save Session'}</span>
          </button>

          {/* History link */}
          <button
            onClick={onNavigateToHistory}
            className="px-3 py-2 rounded-xl glass-panel text-xs font-semibold text-slate-300 hover:text-white border border-slate-700 transition-colors flex items-center gap-1"
            title="View all saved scans"
          >
            <History className="w-3.5 h-3.5 text-slate-400" />
            <span>History</span>
          </button>
        </div>
      </div>

      {/* Main Measurements & Visualizer Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left (Visualizer): 4 cols */}
        <div className="lg:col-span-4 space-y-4">
          <div className="sticky top-24 space-y-4">
            <BodyVisualizer
              selectedKey={selectedMeasurementKey}
              frontImageUrl={record.frontThumbnail}
            />

            <div className="glass-panel p-4 rounded-2xl border border-slate-800 text-xs space-y-2">
              <div className="flex items-center justify-between font-semibold text-slate-300">
                <span>Composite AI Confidence</span>
                <span className="font-mono text-emerald-400">{record.measurements.overallConfidence}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${record.measurements.overallConfidence}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 leading-normal pt-1">
                Measurements combine direct skeletal joint geometry with Ramanujan ellipse circumference modeling and multi-frame averaging. Click any dimension to focus.
              </p>
            </div>
          </div>
        </div>

        {/* Right (Measurements Grid): 8 cols */}
        <div className="lg:col-span-8 space-y-8">
          {/* Upper Body Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <Shirt className="w-4 h-4 text-indigo-400" />
              <h2 className="text-base font-bold text-white uppercase tracking-wider">
                Upper Body Dimensions (7 Metrics)
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {upperItems.map((item) => (
                <MeasurementCard
                  key={item.key}
                  item={item}
                  showInches={showInches}
                  isSelected={selectedMeasurementKey === item.key}
                  onSelect={() => setSelectedMeasurementKey(item.key)}
                  onEdit={(target) => setEditingItem(target)}
                />
              ))}
            </div>
          </div>

          {/* Lower Body Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <Scissors className="w-4 h-4 text-purple-400" />
              <h2 className="text-base font-bold text-white uppercase tracking-wider">
                Lower Body Dimensions (6 Metrics)
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {lowerItems.map((item) => (
                <MeasurementCard
                  key={item.key}
                  item={item}
                  showInches={showInches}
                  isSelected={selectedMeasurementKey === item.key}
                  onSelect={() => setSelectedMeasurementKey(item.key)}
                  onEdit={(target) => setEditingItem(target)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Garment Sizing Recommendation Engine Section */}
      <section className="space-y-6 pt-4 border-t border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs text-amber-300 font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tailoring Fit Engine</span>
            </div>
            <h2 className="text-2xl font-black text-white">Recommended Garment Sizes</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Matched against ease allowances for relaxed drape, seated comfort, and chest expansion.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter buttons */}
            <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs font-medium">
              <button
                onClick={() => setSelectedGarmentFilter('all')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  selectedGarmentFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedGarmentFilter('upper')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  selectedGarmentFilter === 'upper' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Tops
              </button>
              <button
                onClick={() => setSelectedGarmentFilter('lower')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  selectedGarmentFilter === 'lower' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Bottoms
              </button>
            </div>

            {/* Custom chart button */}
            <button
              onClick={() => setIsCustomChartModalOpen(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold glass-panel text-slate-200 hover:text-white border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-400" />
              <span>Custom Chart</span>
            </button>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecommendations.map((rec, idx) => (
            <ClothingRecommendationCard key={idx} rec={rec} />
          ))}
        </div>
      </section>

      {/* Edit Modal */}
      <MeasurementEditModal
        item={editingItem}
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        onSave={handleSaveEdit}
      />

      {/* Custom Size Chart Modal */}
      <CustomSizeChartModal
        isOpen={isCustomChartModalOpen}
        onClose={() => setIsCustomChartModalOpen(false)}
        onSaved={handleCustomChartSaved}
      />
    </div>
  )
}
