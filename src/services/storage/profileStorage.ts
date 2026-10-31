import { getDB, STORES } from './indexedDB'
import type { UserProfile, ProfileInput } from '../../types/profile'

export async function saveProfile(input: ProfileInput, existingId?: string): Promise<UserProfile> {
  // Validate height between 100 cm and 230 cm
  if (input.heightCm < 100 || input.heightCm > 230) {
    throw new Error('Height must be between 100 cm and 230 cm')
  }

  const db = await getDB()
  const now = new Date().toISOString()
  
  const profile: UserProfile = {
    id: existingId || `prof_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: input.name.trim() || 'Anonymous',
    heightCm: Math.round(input.heightCm * 10) / 10,
    weightKg: input.weightKg ? Math.round(input.weightKg * 10) / 10 : undefined,
    age: input.age,
    genderPreference: input.genderPreference || 'unisex',
    createdAt: existingId ? (await getProfile(existingId))?.createdAt || now : now,
    updatedAt: now,
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.PROFILES, 'readwrite')
    const store = tx.objectStore(STORES.PROFILES)
    const request = store.put(profile)

    request.onsuccess = () => {
      // Also cache active profile ID in LocalStorage for quick access
      localStorage.setItem('activeProfileId', profile.id)
      resolve(profile)
    }
    request.onerror = () => reject(request.error)
  })
}

export async function getProfile(id: string): Promise<UserProfile | null> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.PROFILES, 'readonly')
    const store = tx.objectStore(STORES.PROFILES)
    const request = store.get(id)

    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(request.error)
  })
}

export async function getAllProfiles(): Promise<UserProfile[]> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.PROFILES, 'readonly')
    const store = tx.objectStore(STORES.PROFILES)
    const request = store.getAll()

    request.onsuccess = () => resolve(request.result || [])
    request.onerror = () => reject(request.error)
  })
}

export async function getActiveProfile(): Promise<UserProfile | null> {
  const activeId = localStorage.getItem('activeProfileId')
  if (activeId) {
    const prof = await getProfile(activeId)
    if (prof) return prof
  }

  const all = await getAllProfiles()
  if (all.length > 0) {
    localStorage.setItem('activeProfileId', all[0].id)
    return all[0]
  }

  return null
}

export async function deleteProfile(id: string): Promise<void> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.PROFILES, STORES.MEASUREMENTS], 'readwrite')
    tx.objectStore(STORES.PROFILES).delete(id)
    
    // Also remove associated measurements
    const measureStore = tx.objectStore(STORES.MEASUREMENTS)
    const index = measureStore.index('profileId')
    const request = index.getAllKeys(id)
    
    request.onsuccess = () => {
      const keys = request.result
      keys.forEach((key) => measureStore.delete(key))
    }

    tx.oncomplete = () => {
      if (localStorage.getItem('activeProfileId') === id) {
        localStorage.removeItem('activeProfileId')
      }
      resolve()
    }
    tx.onerror = () => reject(tx.error)
  })
}
