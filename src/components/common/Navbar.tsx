import React from 'react'
import { Ruler, Camera, History, User, Settings, ShieldCheck, Sparkles } from 'lucide-react'
import type { UserProfile } from '../../types/profile'

interface NavbarProps {
  activeTab: 'home' | 'camera' | 'results' | 'history' | 'profile' | 'settings'
  onSelectTab: (tab: 'home' | 'camera' | 'results' | 'history' | 'profile' | 'settings') => void
  activeProfile: UserProfile | null
  hasResults: boolean
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  activeProfile,
  hasResults,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div
          onClick={() => onSelectTab('home')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Ruler className="w-5 h-5 text-indigo-400 group-hover:rotate-12 transition-transform" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-white">
                BodyFit<span className="text-indigo-400">AI</span>
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              100% Client-Side Private AI
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 glass-panel px-2 py-1.5 rounded-2xl">
          <button
            onClick={() => onSelectTab('home')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'home'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Dashboard
          </button>

          <button
            onClick={() => onSelectTab('camera')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'camera'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Measure</span>
          </button>

          {hasResults && (
            <button
              onClick={() => onSelectTab('results')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'results'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Results & Sizes</span>
            </button>
          )}

          <button
            onClick={() => onSelectTab('history')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'history'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>History</span>
          </button>
        </nav>

        {/* Right Actions: Profile Chip */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelectTab('profile')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border transition-all ${
              activeTab === 'profile'
                ? 'border-indigo-500 bg-indigo-500/10 text-white'
                : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white uppercase">
              {activeProfile ? activeProfile.name.charAt(0) : <User className="w-3.5 h-3.5" />}
            </div>
            <div className="text-left hidden sm:block">
              <span className="text-xs font-semibold block leading-none">
                {activeProfile ? activeProfile.name : 'Create Profile'}
              </span>
              {activeProfile && (
                <span className="text-[10px] text-slate-400 font-mono">
                  {activeProfile.heightCm} cm
                </span>
              )}
            </div>
          </button>

          <button
            onClick={() => onSelectTab('settings')}
            className={`p-2 rounded-xl text-slate-400 hover:text-white transition-colors ${
              activeTab === 'settings' ? 'text-indigo-400 bg-slate-800' : ''
            }`}
            title="Settings & Privacy"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile Bottom bar */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-800 bg-slate-950 py-2 px-2">
        <button
          onClick={() => onSelectTab('home')}
          className={`flex flex-col items-center gap-1 text-[10px] ${
            activeTab === 'home' ? 'text-indigo-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Ruler className="w-4 h-4" />
          <span>Home</span>
        </button>
        <button
          onClick={() => onSelectTab('camera')}
          className={`flex flex-col items-center gap-1 text-[10px] ${
            activeTab === 'camera' ? 'text-indigo-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Camera</span>
        </button>
        {hasResults && (
          <button
            onClick={() => onSelectTab('results')}
            className={`flex flex-col items-center gap-1 text-[10px] ${
              activeTab === 'results' ? 'text-indigo-400 font-bold' : 'text-slate-400'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Results</span>
          </button>
        )}
        <button
          onClick={() => onSelectTab('history')}
          className={`flex flex-col items-center gap-1 text-[10px] ${
            activeTab === 'history' ? 'text-indigo-400 font-bold' : 'text-slate-400'
          }`}
        >
          <History className="w-4 h-4" />
          <span>History</span>
        </button>
        <button
          onClick={() => onSelectTab('profile')}
          className={`flex flex-col items-center gap-1 text-[10px] ${
            activeTab === 'profile' ? 'text-indigo-400 font-bold' : 'text-slate-400'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Profile</span>
        </button>
      </div>
    </header>
  )
}
