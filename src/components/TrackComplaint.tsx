import { useState, FC, useEffect, FormEvent } from 'react';
import { 
  Search, 
  Clock, 
  RotateCw, 
  CheckCircle2, 
  MapPin, 
  Calendar, 
  User, 
  MessageSquareQuote, 
  AlertCircle,
  Copy,
  Check,
  Building,
  ArrowRight
} from 'lucide-react';
import { Complaint } from '../types';
import { trackComplaint } from '../services/api';
import { StatusBadge, CategoryBadge, PriorityBadge } from './StatusBadge';

interface TrackComplaintProps {
  initialReferenceId?: string;
  onNavigateToSubmit?: () => void;
}

const SAMPLE_IDS = ['CMP-2026-8942', 'CMP-2026-3180', 'CMP-2026-5521', 'CMP-2026-9043'];

export const TrackComplaint: FC<TrackComplaintProps> = ({ 
  initialReferenceId = '', 
  onNavigateToSubmit 
}) => {
  const [referenceId, setReferenceId] = useState(initialReferenceId);
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialReferenceId) {
      setReferenceId(initialReferenceId);
      performSearch(initialReferenceId);
    }
  }, [initialReferenceId]);

  const performSearch = async (refId: string) => {
    if (!refId.trim()) {
      setErrorMessage('Please enter a complaint reference ID.');
      setComplaint(null);
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await trackComplaint(refId.trim());
      if (res.success && res.complaint) {
        setComplaint(res.complaint);
      } else {
        setComplaint(null);
        setErrorMessage('Case not found. Please verify the Reference ID.');
      }
    } catch (err: any) {
      setComplaint(null);
      setErrorMessage(err.message || 'No case found matching this Reference ID.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    performSearch(referenceId);
  };

  const handleCopy = () => {
    if (!complaint?.referenceId) return;
    navigator.clipboard.writeText(complaint.referenceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to determine active step in the visual progression
  const getProgressStep = (status: string) => {
    switch (status) {
      case 'Pending':
        return 1;
      case 'In Progress':
        return 2;
      case 'Resolved':
        return 3;
      default:
        return 1;
    }
  };

  const activeStep = complaint ? getProgressStep(complaint.status) : 1;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="mb-2">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight font-sans">
          Track Your Case
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          Enter your unique reference ID below to view real-time investigation updates and remarks.
        </p>
      </div>

      {/* Search Bar Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <form onSubmit={handleSearchSubmit} className="space-y-4">
          <label htmlFor="input-track-ref-id" className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
            Enter Reference ID
          </label>
          
          <div className="relative flex flex-col sm:flex-row items-stretch gap-2.5">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                id="input-track-ref-id"
                type="text"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
                placeholder="e.g. CMP-2026-8942"
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 rounded-lg text-sm font-mono font-medium text-slate-900 placeholder:text-slate-400 placeholder:font-sans outline-none transition-all"
              />
            </div>

            <button
              id="btn-search-complaint"
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#1E3A8A] hover:bg-blue-900 text-white font-bold rounded-lg text-xs sm:text-sm uppercase tracking-wider transition-all shadow-md shadow-blue-950/10 disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <span>Track Status</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Quick Demo Reference IDs */}
          <div className="flex flex-wrap items-center gap-2 pt-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-600 text-xs">Quick Samples:</span>
            {SAMPLE_IDS.map((sampleId) => (
              <button
                key={sampleId}
                type="button"
                id={`sample-id-${sampleId.toLowerCase()}`}
                onClick={() => {
                  setReferenceId(sampleId);
                  performSearch(sampleId);
                }}
                className="font-mono bg-slate-50 hover:bg-blue-50 hover:text-[#1E3A8A] hover:border-blue-200 text-slate-700 px-2.5 py-1 rounded text-xs border border-slate-200 transition-colors cursor-pointer"
              >
                {sampleId}
              </button>
            ))}
          </div>
        </form>

        {/* Error Alert */}
        {errorMessage && (
          <div 
            id="track-error-alert"
            className="mt-6 flex items-start gap-3 p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm animate-fadeIn"
          >
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold block">Lookup Notice</strong>
              <span>{errorMessage}</span>
              {onNavigateToSubmit && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={onNavigateToSubmit}
                    className="text-xs font-bold text-rose-900 underline hover:text-rose-700 cursor-pointer"
                  >
                    Haven't submitted an issue yet? Click here to lodge a new case.
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Complaint Result Card */}
      {complaint && (
        <div 
          id="tracked-complaint-result"
          className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 animate-fadeIn"
        >
          {/* Header Row: Ref ID + Badges */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                  Official Reference ID
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-slate-400 hover:text-[#1E3A8A] transition-colors p-1 cursor-pointer"
                  title="Copy Reference ID"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <h3 className="font-mono text-2xl sm:text-3xl font-extrabold text-[#1E3A8A] mt-0.5 tracking-tight">
                {complaint.referenceId}
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <CategoryBadge category={complaint.category} />
              <PriorityBadge priority={complaint.priority} />
              <StatusBadge status={complaint.status} size="lg" />
            </div>
          </div>

          {/* Visual Multi-Stage Progress Tracker */}
          <div className="py-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
              Resolution Pipeline
            </h4>
            
            <div className="relative flex items-center justify-between max-w-xl mx-auto px-4 sm:px-0">
              {/* Connector Lines */}
              <div className="absolute left-10 right-10 top-1/2 -translate-y-1/2 h-1 bg-slate-200 -z-0">
                <div 
                  className="h-full bg-[#1E3A8A] transition-all duration-500"
                  style={{ width: activeStep === 1 ? '0%' : activeStep === 2 ? '50%' : '100%' }}
                />
              </div>

              {/* Step 1: Logged */}
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                  activeStep >= 1 ? 'bg-[#1E3A8A] text-white ring-4 ring-blue-100 shadow-sm' : 'bg-slate-200 text-slate-600'
                }`}>
                  <Clock className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-900 mt-2">1. Submitted</span>
                <span className="text-[10px] text-slate-500">Logged in queue</span>
              </div>

              {/* Step 2: In Progress */}
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                  activeStep >= 2 
                    ? 'bg-[#1E3A8A] text-white ring-4 ring-blue-100 shadow-sm' 
                    : 'bg-slate-100 text-slate-400 border border-slate-300'
                }`}>
                  <RotateCw className={`w-5 h-5 ${activeStep === 2 ? 'animate-spin-slow' : ''}`} />
                </div>
                <span className={`text-xs font-bold mt-2 ${activeStep >= 2 ? 'text-slate-900' : 'text-slate-400'}`}>
                  2. In Progress
                </span>
                <span className="text-[10px] text-slate-500">Assigned / In action</span>
              </div>

              {/* Step 3: Resolved */}
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                  activeStep >= 3 
                    ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 shadow-sm' 
                    : 'bg-slate-100 text-slate-400 border border-slate-300'
                }`}>
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <span className={`text-xs font-bold mt-2 ${activeStep >= 3 ? 'text-emerald-700' : 'text-slate-400'}`}>
                  3. Resolved
                </span>
                <span className="text-[10px] text-slate-500">Verified & closed</span>
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="bg-slate-50 rounded-lg p-5 border border-slate-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Case Description
            </h4>
            <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap">
              {complaint.description}
            </p>
          </div>

          {/* Admin Remark Callout (Highlighted Official Response) */}
          <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-5">
            <div className="flex items-center gap-2 text-[#1E3A8A] font-bold text-xs uppercase tracking-wider mb-2">
              <MessageSquareQuote className="w-4 h-4 text-[#1E3A8A]" />
              <span>Official Administration Action Remarks</span>
            </div>

            {complaint.adminRemark ? (
              <div className="text-sm text-slate-900 font-medium pl-3 border-l-3 border-[#1E3A8A] py-1">
                "{complaint.adminRemark}"
                <div className="text-[11px] text-slate-500 font-normal mt-1.5 flex items-center gap-1.5">
                  <span>Updated: {new Date(complaint.updatedAt).toLocaleString()}</span>
                  <span>•</span>
                  <span className="text-[#1E3A8A] font-semibold">Campus Redressal Desk</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic pl-3 border-l-2 border-slate-300 py-1">
                No administrative remarks posted yet. The grievance department is currently investigating the submission.
              </p>
            )}
          </div>

          {/* Metadata Grid (Location, Date, Student) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs text-slate-600">
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Location</span>
                <span className="font-semibold text-slate-800">{complaint.location || 'Campus Wide'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Submitted On</span>
                <span className="font-semibold text-slate-800">
                  {new Date(complaint.createdAt).toLocaleDateString(undefined, { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <User className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Student Reporter</span>
                <span className="font-semibold text-slate-800">
                  {complaint.studentName ? complaint.studentName : 'Anonymous Student 🔒'}
                </span>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

