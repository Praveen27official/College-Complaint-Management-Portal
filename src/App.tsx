import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SubmitComplaint } from './components/SubmitComplaint';
import { TrackComplaint } from './components/TrackComplaint';
import { AdminPortal } from './components/AdminPortal';
import { DeploymentGuide } from './components/DeploymentGuide';
import { fetchDbStatus, fetchStats } from './services/api';
import { Complaint, DatabaseStatus } from './types';
import { 
  Building2, 
  PhoneCall, 
  Mail, 
  MapPin, 
  ShieldCheck, 
  Send, 
  Search, 
  BookOpen, 
  ExternalLink,
  HeartHandshake
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'submit' | 'track' | 'admin' | 'guide'>('submit');
  const [trackRefId, setTrackRefId] = useState<string>('');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return !!sessionStorage.getItem('campuscare_admin_token');
  });
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [pendingCount, setPendingCount] = useState<number>(0);

  // Initialize DB status and stats on load
  useEffect(() => {
    fetchDbStatus()
      .then((data) => setDbStatus(data.status))
      .catch(console.error);

    fetchStats()
      .then((stats) => setPendingCount(stats.pending))
      .catch(console.error);
  }, [activeTab]);

  // Handle successful complaint submission
  const handleSubmissionSuccess = (complaint: Complaint) => {
    setTrackRefId(complaint.referenceId);
    setPendingCount((prev) => prev + 1);
  };

  // Transition from confirmation to Track tab directly with reference ID
  const handleTrackRedirect = (referenceId: string) => {
    setTrackRefId(referenceId);
    setActiveTab('track');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      
      {/* Header with Navigation */}
      <Header
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        isAdminLoggedIn={isAdminLoggedIn}
        dbStatus={dbStatus}
        pendingCount={pendingCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'submit' && (
          <SubmitComplaint
            onSuccess={handleSubmissionSuccess}
            onTrackRedirect={handleTrackRedirect}
          />
        )}

        {activeTab === 'track' && (
          <TrackComplaint
            initialReferenceId={trackRefId}
            onNavigateToSubmit={() => setActiveTab('submit')}
          />
        )}

        {activeTab === 'admin' && (
          <AdminPortal
            onAdminAuthChange={setIsAdminLoggedIn}
            onNavigateToGuide={() => setActiveTab('guide')}
          />
        )}

        {activeTab === 'guide' && (
          <DeploymentGuide />
        )}
      </main>

      {/* Official College Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-8 text-xs text-slate-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-6 border-b border-slate-100">
            
            {/* Col 1: College Identity */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Building2 className="w-4 h-4 text-blue-700" />
                <span>CampusCare Redressal Cell</span>
              </div>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Official centralized complaint handling platform providing transparent redressal for all students and campus residents.
              </p>
            </div>

            {/* Col 2: Quick Links */}
            <div>
              <span className="font-bold text-slate-900 block mb-2 text-xs uppercase tracking-wider">
                Quick Portals
              </span>
              <ul className="space-y-1.5 text-slate-500 text-xs">
                <li>
                  <button 
                    type="button"
                    onClick={() => { setActiveTab('submit'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Send className="w-3 h-3 text-slate-400" /> Lodge a Complaint
                  </button>
                </li>
                <li>
                  <button 
                    type="button"
                    onClick={() => { setActiveTab('track'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Search className="w-3 h-3 text-slate-400" /> Track Resolution Status
                  </button>
                </li>
                <li>
                  <button 
                    type="button"
                    onClick={() => { setActiveTab('admin'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    <ShieldCheck className="w-3 h-3 text-slate-400" /> Administrative Console
                  </button>
                </li>
                <li>
                  <button 
                    type="button"
                    onClick={() => { setActiveTab('guide'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    <BookOpen className="w-3 h-3 text-slate-400" /> Deployment & Architecture
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: Emergency Helpline */}
            <div>
              <span className="font-bold text-slate-900 block mb-2 text-xs uppercase tracking-wider">
                Campus Helplines
              </span>
              <div className="space-y-1.5 text-slate-500 text-xs">
                <div className="flex items-center gap-1.5">
                  <PhoneCall className="w-3.5 h-3.5 text-blue-600" />
                  <span>Hostel Warden Desk: <strong>+1 (800) 555-0199</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                  <span>24/7 Security & Medical: <strong>+1 (800) 555-0100</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-indigo-600" />
                  <span>grievance@college.edu</span>
                </div>
              </div>
            </div>

            {/* Col 4: Service Commitment */}
            <div>
              <span className="font-bold text-slate-900 block mb-2 text-xs uppercase tracking-wider">
                Resolution Standard
              </span>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
                <div className="flex items-center gap-1 font-semibold text-slate-800">
                  <HeartHandshake className="w-3.5 h-3.5 text-blue-700" />
                  <span>Transparent Redressal</span>
                </div>
                <p>
                  Every complaint is cataloged with an immutable reference ID and monitored by collegiate grievance officers.
                </p>
              </div>
            </div>

          </div>

          {/* Bottom attribution */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between text-slate-400 text-[11px] gap-2">
            <span>© 2026 College Complaint Management System. All rights reserved.</span>
            <div className="flex items-center gap-4">
              <span>Frontend: React + Vite</span>
              <span>•</span>
              <span>Backend: Node + Express</span>
              <span>•</span>
              <span>DB: Supabase</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
