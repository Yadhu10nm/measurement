import { getDB, STORES } from './indexedDB'
import type { MeasurementRecord } from '../../types/sizing'
import type { BodyMeasurements, MeasurementItem } from '../../types/measurement'

export async function saveMeasurementRecord(record: MeasurementRecord): Promise<void> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.MEASUREMENTS, 'readwrite')
    const store = tx.objectStore(STORES.MEASUREMENTS)
    const request = store.put(record)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function getMeasurementRecord(id: string): Promise<MeasurementRecord | null> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.MEASUREMENTS, 'readonly')
    const store = tx.objectStore(STORES.MEASUREMENTS)
    const request = store.get(id)

    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(request.error)
  })
}

export async function getAllMeasurements(): Promise<MeasurementRecord[]> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.MEASUREMENTS, 'readonly')
    const store = tx.objectStore(STORES.MEASUREMENTS)
    const request = store.getAll()

    request.onsuccess = () => {
      const records: MeasurementRecord[] = request.result || []
      // sort latest first
      records.sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime())
      resolve(records)
    }
    request.onerror = () => reject(request.error)
  })
}

export async function getMeasurementsByProfile(profileId: string): Promise<MeasurementRecord[]> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.MEASUREMENTS, 'readonly')
    const store = tx.objectStore(STORES.MEASUREMENTS)
    const index = store.index('profileId')
    const request = index.getAll(profileId)

    request.onsuccess = () => {
      const records: MeasurementRecord[] = request.result || []
      records.sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime())
      resolve(records)
    }
    request.onerror = () => reject(request.error)
  })
}

export async function deleteMeasurementRecord(id: string): Promise<void> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.MEASUREMENTS, 'readwrite')
    const store = tx.objectStore(STORES.MEASUREMENTS)
    const request = store.delete(id)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function updateMeasurementItemValue(
  recordId: string,
  key: keyof BodyMeasurements,
  newValueCm: number
): Promise<MeasurementRecord> {
  const record = await getMeasurementRecord(recordId)
  if (!record) throw new Error('Record not found')

  const target = record.measurements[key] as unknown as MeasurementItem
  if (target && typeof target === 'object' && 'valueCm' in target) {
    target.valueCm = Math.round(newValueCm * 10) / 10
    target.isManuallyEdited = true
    target.method = 'manual_override'
    target.confidence = 'high' // user verified
    record.manuallyEditedCount = (record.manuallyEditedCount || 0) + 1
  }

  await saveMeasurementRecord(record)
  return record
}

// Export utilities
export function exportToJSON(data: unknown, filename = 'body_measurements.json'): void {
  const jsonStr = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function exportMeasurementsToCSV(records: MeasurementRecord[]): void {
  if (records.length === 0) return

  const headers = [
    'Record ID',
    'Date',
    'Profile Name',
    'Height (cm)',
    'Shoulder Width (cm)',
    'Chest (cm)',
    'Waist (cm)',
    'Sleeve (cm)',
    'Upper Arm (cm)',
    'Shirt Length (cm)',
    'Neck (cm)',
    'Hip (cm)',
    'Thigh (cm)',
    'Knee (cm)',
    'Inseam (cm)',
    'Outseam (cm)',
    'Leg Opening (cm)',
    'Overall Confidence (%)',
    'Edited Count'
  ]

  const rows = records.map(r => {
    const m = r.measurements
    return [
      `"${r.id}"`,
      `"${new Date(r.capturedAt).toLocaleString()}"`,
      `"${r.profileName}"`,
      r.heightCm,
      m.shoulderWidth.valueCm,
      m.chestCircumference.valueCm,
      m.waistCircumference.valueCm,
      m.sleeveLength.valueCm,
      m.upperArmCircumference.valueCm,
      m.shirtLength.valueCm,
      m.neckCircumference.valueCm,
      m.hipCircumference.valueCm,
      m.thighCircumference.valueCm,
      m.kneeCircumference.valueCm,
      m.inseam.valueCm,
      m.outseam.valueCm,
      m.legOpening.valueCm,
      m.overallConfidence,
      r.manuallyEditedCount
    ].join(',')
  })

  const csvContent = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `body_measurements_${Date.now()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
