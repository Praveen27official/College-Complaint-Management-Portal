import { FC } from 'react';
import { 
  Building, 
  Send, 
  Search, 
  ShieldCheck, 
  BookOpen, 
  Database,
  Sparkles
} from 'lucide-react';
import { DatabaseStatus } from '../types';

interface HeaderProps {
  activeTab: 'submit' | 'track' | 'admin' | 'guide';
  onTabChange: (tab: 'submit' | 'track' | 'admin' | 'guide') => void;
  isAdminLoggedIn: boolean;
  dbStatus: DatabaseStatus | null;
  pendingCount?: number;
}

export const Header: FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  isAdminLoggedIn,
  dbStatus,
  pendingCount = 0,
}) => {
  return (
    <header className="bg-[#1E3A8A] text-white shadow-md sticky top-0 z-40">
      {/* Top collegiate status sub-bar */}
      <div className="bg-[#172554] text-white/80 text-[11px] px-4 sm:px-10 py-1.5 border-b border-blue-900/60">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="font-medium text-slate-100">University Care Portal — Grievance Redressal Desk</span>
            <span className="hidden md:inline text-blue-300/40">•</span>
            <span className="hidden md:inline text-slate-300">Official student support service</span>
          </div>
          <div className="flex items-center gap-3">
            {dbStatus && (
              <div 
                title={dbStatus.message}
                className="flex items-center gap-1.5 text-[11px] text-blue-200 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800"
              >
                <Database className={`w-3 h-3 ${dbStatus.provider === 'supabase' ? 'text-emerald-400' : 'text-amber-400'}`} />
                <span className="font-mono">
                  {dbStatus.provider === 'supabase' ? 'Supabase DB' : 'Dev Storage'}
                </span>
              </div>
            )}
            <span className="text-blue-200/80">Academic Year 2026</span>
          </div>
        </div>
      </div>

      {/* Main navigation header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-10">
        <div className="flex flex-col md:flex-row items-center justify-between py-3.5 gap-4">
          
          {/* Geometric Diamond Logo & Portal Identity */}
          <div 
            id="portal-logo"
            onClick={() => onTabChange('submit')} 
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            {/* Geometric Rotated Square Diamond Icon */}
            <div className="w-8 h-8 bg-white rotate-45 flex items-center justify-center rounded-xs shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              <div className="w-4 h-4 bg-[#1E3A8A] -rotate-45 rounded-2xs"></div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-bold tracking-tight text-lg sm:text-xl font-sans">
                  University Care Portal
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-200 bg-white/10 px-2 py-0.5 rounded border border-white/20">
                  CampusCare
                </span>
              </div>
              <p className="text-[11px] text-blue-200/80 font-medium">
                Hostel • Mess • Infrastructure • Academics • Transport
              </p>
            </div>
          </div>

          {/* Navigation Tab Group (Geometric Balance Theme Style) */}
          <nav className="flex items-center gap-2 sm:gap-6 text-sm font-medium overflow-x-auto max-w-full pb-1 md:pb-0">
            <button
              id="nav-tab-submit"
              type="button"
              onClick={() => onTabChange('submit')}
              className={`px-3 py-1.5 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'submit'
                  ? 'text-white border-b-2 border-white font-bold'
                  : 'text-white/80 hover:text-white hover:border-b-2 hover:border-white/50'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Case</span>
            </button>

            <button
              id="nav-tab-track"
              type="button"
              onClick={() => onTabChange('track')}
              className={`px-3 py-1.5 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'track'
                  ? 'text-white border-b-2 border-white font-bold'
                  : 'text-white/80 hover:text-white hover:border-b-2 hover:border-white/50'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Track Case</span>
            </button>

            <button
              id="nav-tab-admin"
              type="button"
              onClick={() => onTabChange('admin')}
              className={`px-3 py-1.5 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'admin'
                  ? 'text-white border-b-2 border-white font-bold'
                  : 'text-white/80 hover:text-white hover:border-b-2 hover:border-white/50'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Login</span>
              {isAdminLoggedIn ? (
                <span className="w-2 h-2 rounded-full bg-emerald-400 ml-0.5" title="Admin Active"></span>
              ) : pendingCount > 0 ? (
                <span className="text-[10px] bg-yellow-400 text-slate-900 px-1.5 py-0.2 rounded-full font-bold ml-0.5">
                  {pendingCount}
                </span>
              ) : null}
            </button>

            <button
              id="nav-tab-guide"
              type="button"
              onClick={() => onTabChange('guide')}
              title="Vercel + Render + Supabase Architecture Guide"
              className={`px-3 py-1.5 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 text-xs ${
                activeTab === 'guide'
                  ? 'text-white border-b-2 border-white font-bold'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Deployment Guide</span>
              <span className="sm:hidden">Guide</span>
            </button>
          </nav>

        </div>
      </div>
    </header>
  );
};

