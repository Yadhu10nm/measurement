const DB_NAME = 'BodyMeasureAI_DB'
const DB_VERSION = 1

export const STORES = {
  PROFILES: 'profiles',
  MEASUREMENTS: 'measurements',
  SETTINGS: 'settings',
} as const

let dbInstance: IDBDatabase | null = null

export async function getDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      if (!db.objectStoreNames.contains(STORES.PROFILES)) {
        const profileStore = db.createObjectStore(STORES.PROFILES, { keyPath: 'id' })
        profileStore.createIndex('updatedAt', 'updatedAt', { unique: false })
      }

      if (!db.objectStoreNames.contains(STORES.MEASUREMENTS)) {
        const measurementStore = db.createObjectStore(STORES.MEASUREMENTS, { keyPath: 'id' })
        measurementStore.createIndex('profileId', 'profileId', { unique: false })
        measurementStore.createIndex('capturedAt', 'capturedAt', { unique: false })
      }

      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' })
      }
    }

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result
      resolve(dbInstance)
    }

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error)
    }
  })
}

export async function clearAllLocalData(): Promise<void> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.PROFILES, STORES.MEASUREMENTS, STORES.SETTINGS], 'readwrite')
    tx.objectStore(STORES.PROFILES).clear()
    tx.objectStore(STORES.MEASUREMENTS).clear()
    tx.objectStore(STORES.SETTINGS).clear()
    tx.oncomplete = () => {
      localStorage.clear()
      resolve()
    }
    tx.onerror = () => reject(tx.error)
  })
}
