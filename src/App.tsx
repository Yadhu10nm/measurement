import { useState, useEffect } from 'react'
import { Navbar } from './components/common/Navbar'
import { Home } from './pages/Home'
import { Profile } from './pages/Profile'
import { CameraPage } from './pages/Camera'
import { Results } from './pages/Results'
import { History } from './pages/History'
import { Settings } from './pages/Settings'
import { getActiveProfile } from './services/storage/profileStorage'
import { getAllMeasurements } from './services/storage/measurementStorage'
import { loadOpenCV } from './services/opencv/opencvLoader'
import type { UserProfile } from './types/profile'
import type { MeasurementRecord } from './types/sizing'

export function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'camera' | 'results' | 'history' | 'profile' | 'settings'>('home')
  const [activeProfile, setActiveProfile] = useState<UserProfile | null>(null)
  const [recentRecords, setRecentRecords] = useState<MeasurementRecord[]>([])
  const [currentResultRecord, setCurrentResultRecord] = useState<MeasurementRecord | null>(null)

  // Load initial active profile, measurement history & warmup OpenCV
  const refreshStorage = async () => {
    try {
      const prof = await getActiveProfile()
      setActiveProfile(prof)
      const records = await getAllMeasurements()
      setRecentRecords(records)
      if (records.length > 0 && !currentResultRecord) {
        setCurrentResultRecord(records[0])
      }
    } catch (e) {
      console.warn('Init storage error:', e)
    }
  }

  useEffect(() => {
    refreshStorage()
    // Asynchronously preload OpenCV wasm in background
    loadOpenCV().catch(console.warn)
  }, [])

  const handleMeasurementCompleted = (record: MeasurementRecord) => {
    setCurrentResultRecord(record)
    setRecentRecords(prev => [record, ...prev])
    setActiveTab('results')
  }

  const handleOpenRecordFromHistory = (record: MeasurementRecord) => {
    setCurrentResultRecord(record)
    setActiveTab('results')
  }

  const handleProfileUpdated = (profile: UserProfile | null) => {
    setActiveProfile(profile)
    refreshStorage()
  }

  const handleDataReset = () => {
    setActiveProfile(null)
    setRecentRecords([])
    setCurrentResultRecord(null)
    setActiveTab('home')
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Global Navbar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        activeProfile={activeProfile}
        hasResults={!!currentResultRecord}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {activeTab === 'home' && (
          <Home
            activeProfile={activeProfile}
            recentRecords={recentRecords}
            onStartMeasurement={() => setActiveTab('camera')}
            onOpenProfile={() => setActiveTab('profile')}
            onOpenResults={handleOpenRecordFromHistory}
            onOpenHistory={() => setActiveTab('history')}
          />
        )}

        {activeTab === 'camera' && (
          <CameraPage
            activeProfile={activeProfile}
            onMeasurementCompleted={handleMeasurementCompleted}
            onOpenProfile={() => setActiveTab('profile')}
          />
        )}

        {activeTab === 'results' && currentResultRecord && (
          <Results
            initialRecord={currentResultRecord}
            onRecordSaved={(saved) => {
              setCurrentResultRecord(saved)
              refreshStorage()
            }}
            onNavigateToHistory={() => setActiveTab('history')}
          />
        )}

        {activeTab === 'profile' && (
          <Profile
            activeProfile={activeProfile}
            onProfileUpdated={handleProfileUpdated}
            onProceedToCamera={() => setActiveTab('camera')}
          />
        )}

        {activeTab === 'history' && (
          <History
            onOpenRecord={handleOpenRecordFromHistory}
          />
        )}

        {activeTab === 'settings' && (
          <Settings
            onDataReset={handleDataReset}
          />
        )}
      </main>
    </div>
  )
}

export default App
