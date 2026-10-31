import React, { useState, useEffect } from 'react'
import type { UserProfile, ProfileInput } from '../types/profile'
import { saveProfile, getAllProfiles, deleteProfile } from '../services/storage/profileStorage'
import { Check, Trash2, Plus, Ruler, AlertCircle, ShieldCheck } from 'lucide-react'

interface ProfileProps {
  activeProfile: UserProfile | null
  onProfileUpdated: (profile: UserProfile | null) => void
  onProceedToCamera: () => void
}

export const Profile: React.FC<ProfileProps> = ({
  activeProfile,
  onProfileUpdated,
  onProceedToCamera,
}) => {
  const [profiles, setProfiles] = useState<UserProfile[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form fields
  const [name, setName] = useState('')
  const [heightCm, setHeightCm] = useState<number>(175)
  const [weightKg, setWeightKg] = useState<string>('')
  const [age, setAge] = useState<string>('')
  const [genderPreference, setGenderPreference] = useState<'menswear' | 'womenswear' | 'unisex'>('unisex')

  const loadProfiles = async () => {
    try {
      const list = await getAllProfiles()
      setProfiles(list)
    } catch (e) {
      console.warn('Failed to load profiles:', e)
    }
  }

  useEffect(() => {
    loadProfiles()
  }, [])

  useEffect(() => {
    if (activeProfile && !isEditing) {
      setName(activeProfile.name)
      setHeightCm(activeProfile.heightCm)
      setWeightKg(activeProfile.weightKg ? String(activeProfile.weightKg) : '')
      setAge(activeProfile.age ? String(activeProfile.age) : '')
      setGenderPreference(activeProfile.genderPreference)
    }
  }, [activeProfile, isEditing])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (heightCm < 100 || heightCm > 230) {
      setError('Height must be between 100 cm and 230 cm for accurate anthropometric calibration.')
      return
    }

    try {
      const input: ProfileInput = {
        name: name.trim() || 'My Profile',
        heightCm,
        weightKg: weightKg ? parseFloat(weightKg) : undefined,
        age: age ? parseInt(age, 10) : undefined,
        genderPreference,
      }

      const saved = await saveProfile(input, isEditing && activeProfile ? activeProfile.id : undefined)
      onProfileUpdated(saved)
      setSuccess('Profile saved locally in IndexedDB!')
      setIsEditing(false)
      await loadProfiles()
    } catch (err: any) {
      setError(err?.message || 'Failed to save profile')
    }
  }

  const handleSelectProfile = (p: UserProfile) => {
    localStorage.setItem('activeProfileId', p.id)
    onProfileUpdated(p)
  }

  const handleDeleteProfile = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this profile and its measurements?')) return

    await deleteProfile(id)
    const list = await getAllProfiles()
    setProfiles(list)
    if (activeProfile?.id === id) {
      onProfileUpdated(list[0] || null)
    }
  }

  const handleStartNew = () => {
    setName('')
    setHeightCm(175)
    setWeightKg('')
    setAge('')
    setGenderPreference('unisex')
    setIsEditing(true)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white">Body Calibration Profile</h1>
        <p className="text-sm text-slate-400 mt-1">
          Your physical height is strictly used as the scale reference for Euclidean camera calibration.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Saved Profiles List */}
        <div className="md:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Local Profiles ({profiles.length})
            </span>
            <button
              onClick={handleStartNew}
              className="flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
            >
              <Plus className="w-3.5 h-3.5" />
              New
            </button>
          </div>

          <div className="space-y-2">
            {profiles.map((p) => {
              const isActive = activeProfile?.id === p.id
              return (
                <div
                  key={p.id}
                  onClick={() => handleSelectProfile(p)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    isActive
                      ? 'border-indigo-500 bg-indigo-950/30 shadow-md shadow-indigo-500/10'
                      : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm uppercase ${
                        isActive
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {p.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-1.5">
                        <span>{p.name}</span>
                        {isActive && (
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        {p.heightCm} cm • {p.genderPreference}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleDeleteProfile(p.id, e)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition-colors"
                    title="Delete profile"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )
            })}

            {profiles.length === 0 && (
              <div className="p-6 text-center text-xs text-slate-500 glass-panel rounded-2xl">
                No profiles saved yet. Fill out the form to create your first calibration profile.
              </div>
            )}
          </div>
        </div>

        {/* Right: Profile Edit / Create Form */}
        <div className="md:col-span-2 glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white">
                {isEditing ? 'Create New Profile' : activeProfile ? 'Edit Active Profile' : 'Setup Profile'}
              </h2>
              <p className="text-xs text-slate-400">Stored only in your browser's IndexedDB</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Offline & Private</span>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-5">
            {/* Name */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Full Name / Identifier <span className="text-indigo-400">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe, Maya"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Height (CRITICAL) */}
            <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <Ruler className="w-4 h-4" />
                  <span>Standing Height in Centimeters (100 - 230 cm)</span>
                  <span className="text-amber-400">*</span>
                </label>
                <span className="text-sm font-black font-mono text-white">
                  {heightCm} cm{' '}
                  <span className="text-xs text-slate-400 font-normal">
                    ({Math.floor(heightCm / 30.48)}'{Math.round((heightCm % 30.48) / 2.54)}")
                  </span>
                </span>
              </div>

              <input
                type="range"
                min="100"
                max="230"
                step="0.5"
                value={heightCm}
                onChange={(e) => setHeightCm(parseFloat(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />

              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>100 cm</span>
                <span>165 cm</span>
                <span>180 cm</span>
                <span>200 cm</span>
                <span>230 cm</span>
              </div>
            </div>

            {/* Optional Fields: Weight, Age, Gender Preference */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Weight (kg) <span className="text-slate-500">(Optional)</span>
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="30"
                  max="250"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  placeholder="e.g. 72"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Age <span className="text-slate-500">(Optional)</span>
                </label>
                <input
                  type="number"
                  min="5"
                  max="120"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g. 28"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Sizing Preference
                </label>
                <select
                  value={genderPreference}
                  onChange={(e) => setGenderPreference(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="menswear">Menswear Chart</option>
                  <option value="womenswear">Womenswear Chart</option>
                  <option value="unisex">Unisex / Neutral</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex items-center justify-between">
              {activeProfile && (
                <button
                  type="button"
                  onClick={onProceedToCamera}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                >
                  Proceed to Camera Scan
                </button>
              )}

              <button
                type="submit"
                className="ml-auto px-6 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Save Profile</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
