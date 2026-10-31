import React, { useState } from 'react'
import type { SizeChart, GarmentType } from '../../types/sizing'
import { saveCustomChart } from '../../services/sizing/sizeMatcher'
import { X, Plus, Trash2, Check } from 'lucide-react'

interface CustomSizeChartModalProps {
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
}

export const CustomSizeChartModal: React.FC<CustomSizeChartModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  if (!isOpen) return null

  const [brand, setBrand] = useState('')
  const [garmentLabel, setGarmentLabel] = useState('')
  const [garment, setGarment] = useState<GarmentType>('shirt')
  const [category, setCategory] = useState<'upper' | 'lower'>('upper')
  const [sizes, setSizes] = useState<Array<{ size: string; chestMin: number; chestMax: number; waistMin: number; waistMax: number }>>([
    { size: 'S', chestMin: 88, chestMax: 94, waistMin: 76, waistMax: 82 },
    { size: 'M', chestMin: 94, chestMax: 102, waistMin: 82, waistMax: 90 },
    { size: 'L', chestMin: 102, chestMax: 110, waistMin: 90, waistMax: 98 },
  ])

  const handleAddRow = () => {
    setSizes(prev => [
      ...prev,
      { size: `Size ${prev.length + 1}`, chestMin: 100, chestMax: 108, waistMin: 85, waistMax: 93 },
    ])
  }

  const handleRemoveRow = (index: number) => {
    setSizes(prev => prev.filter((_, i) => i !== index))
  }

  const handleRowChange = (index: number, field: string, val: string | number) => {
    setSizes(prev => {
      const copy = [...prev]
      copy[index] = { ...copy[index], [field]: val }
      return copy
    })
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!brand.trim() || !garmentLabel.trim()) return

    const newChart: SizeChart = {
      id: `custom_${Date.now()}`,
      brand: brand.trim(),
      garmentLabel: garmentLabel.trim(),
      garment,
      category,
      gender: 'unisex',
      defaultEaseCm: { chest: 6, waist: 4 },
      sizes: sizes.map(s => ({
        size: s.size,
        ...(category === 'upper' ? { chest: [s.chestMin, s.chestMax] as [number, number] } : {}),
        waist: [s.waistMin, s.waistMax] as [number, number],
      })),
    }

    saveCustomChart(newChart)
    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-2xl rounded-3xl p-6 border border-slate-700 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white">Create Custom Garment Size Chart</h3>
            <p className="text-xs text-slate-400">Add a custom brand or tailored specification table</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">Brand or Label Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Zara, Uniqlo, Bespoke Studio"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">Garment Description</label>
              <input
                type="text"
                required
                placeholder="e.g. Slim Stretch Chino, Oxford Shirt"
                value={garmentLabel}
                onChange={(e) => setGarmentLabel(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">Garment Category</label>
              <select
                value={category}
                onChange={(e) => {
                  const cat = e.target.value as 'upper' | 'lower'
                  setCategory(cat)
                  setGarment(cat === 'upper' ? 'shirt' : 'trousers')
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
              >
                <option value="upper">Upper Body (Shirts, Hoodies, Jackets)</option>
                <option value="lower">Lower Body (Trousers, Jeans, Shorts)</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">Garment Silhouette Type</label>
              <select
                value={garment}
                onChange={(e) => setGarment(e.target.value as GarmentType)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
              >
                {category === 'upper' ? (
                  <>
                    <option value="shirt">Button-Down Shirt</option>
                    <option value="t_shirt">T-Shirt</option>
                    <option value="hoodie">Hoodie</option>
                    <option value="jacket">Jacket / Blazer</option>
                    <option value="sweater">Sweater</option>
                  </>
                ) : (
                  <>
                    <option value="trousers">Trousers / Chinos</option>
                    <option value="jeans">Denim Jeans</option>
                    <option value="shorts">Shorts</option>
                    <option value="formal_pants">Formal Dress Pants</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Sizes Matrix */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-slate-300 font-semibold uppercase tracking-wider">
                Size Intervals (cm)
              </label>
              <button
                type="button"
                onClick={handleAddRow}
                className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Size
              </button>
            </div>

            <div className="space-y-2">
              {sizes.map((row, i) => (
                <div key={i} className="flex items-center gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                  <input
                    type="text"
                    value={row.size}
                    onChange={(e) => handleRowChange(i, 'size', e.target.value)}
                    placeholder="Size"
                    className="w-16 bg-slate-800 text-center font-mono font-bold text-white text-xs rounded-lg py-1 px-1 border border-slate-700"
                  />

                  {category === 'upper' && (
                    <div className="flex items-center gap-1 flex-1">
                      <span className="text-[10px] text-slate-400">Chest:</span>
                      <input
                        type="number"
                        value={row.chestMin}
                        onChange={(e) => handleRowChange(i, 'chestMin', parseFloat(e.target.value) || 0)}
                        className="w-14 bg-slate-800 text-xs text-white rounded px-1.5 py-1 text-center"
                      />
                      <span className="text-slate-500">-</span>
                      <input
                        type="number"
                        value={row.chestMax}
                        onChange={(e) => handleRowChange(i, 'chestMax', parseFloat(e.target.value) || 0)}
                        className="w-14 bg-slate-800 text-xs text-white rounded px-1.5 py-1 text-center"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-1 flex-1">
                    <span className="text-[10px] text-slate-400">Waist:</span>
                    <input
                      type="number"
                      value={row.waistMin}
                      onChange={(e) => handleRowChange(i, 'waistMin', parseFloat(e.target.value) || 0)}
                      className="w-14 bg-slate-800 text-xs text-white rounded px-1.5 py-1 text-center"
                    />
                    <span className="text-slate-500">-</span>
                    <input
                      type="number"
                      value={row.waistMax}
                      onChange={(e) => handleRowChange(i, 'waistMax', parseFloat(e.target.value) || 0)}
                      className="w-14 bg-slate-800 text-xs text-white rounded px-1.5 py-1 text-center"
                    />
                  </div>

                  {sizes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(i)}
                      className="p-1 text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-lg shadow-indigo-600/30"
            >
              <Check className="w-4 h-4" />
              Save Size Chart
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
