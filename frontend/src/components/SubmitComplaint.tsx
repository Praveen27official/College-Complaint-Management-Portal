import { useState, useEffect, FC, FormEvent } from 'react';
import { 
  Send, 
  CheckCircle, 
  Copy, 
  Check, 
  ArrowRight, 
  AlertTriangle, 
  Sparkles, 
  Building2, 
  Home, 
  UtensilsCrossed, 
  GraduationCap, 
  BookOpen, 
  Bus, 
  HelpCircle,
  Shield,
  Clock,
  CheckCircle2,
  Info,
  Zap,
  CreditCard,
  FileText,
  ShieldCheck
} from 'lucide-react';
import { Complaint, ComplaintCategory, ComplaintPriority } from '../types';
import { submitComplaint, fetchRazorpayConfig, RazorpayConfigResponse } from '../services/api';
import { RazorpayModal, PaymentSuccessData } from './RazorpayModal';
import { PaymentReceiptModal } from './PaymentReceiptModal';

interface SubmitComplaintProps {
  onSuccess: (complaint: Complaint) => void;
  onTrackRedirect: (referenceId: string) => void;
}

const CATEGORIES: { label: ComplaintCategory; description: string; icon: any }[] = [
  { label: 'Hostel', description: 'Rooms, washrooms, Wi-Fi, electricity, plumbing', icon: Home },
  { label: 'Mess', description: 'Food quality, hygiene, drinking water, dining hall', icon: UtensilsCrossed },
  { label: 'Infrastructure', description: 'Classrooms, labs, projectors, air conditioning, benches', icon: Building2 },
  { label: 'Academics', description: 'Faculty, timetable, examinations, coursework', icon: GraduationCap },
  { label: 'Library', description: 'Book availability, digital access, quiet zones', icon: BookOpen },
  { label: 'Transport', description: 'College buses, parking, shuttle schedules', icon: Bus },
  { label: 'Other', description: 'General campus amenities, sports, administrative requests', icon: HelpCircle },
];

export const SubmitComplaint: FC<SubmitComplaintProps> = ({ onSuccess, onTrackRedirect }) => {
  const [studentName, setStudentName] = useState('');
  const [category, setCategory] = useState<ComplaintCategory>('Hostel');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [priority, setPriority] = useState<ComplaintPriority>('Medium');
  
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedComplaint, setSubmittedComplaint] = useState<Complaint | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedPayId, setCopiedPayId] = useState(false);

  // Razorpay payment integration states
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [lastPayment, setLastPayment] = useState<PaymentSuccessData | null>(null);
  const [rzpConfig, setRzpConfig] = useState<RazorpayConfigResponse | null>(null);

  useEffect(() => {
    fetchRazorpayConfig().then(setRzpConfig).catch(() => {});
  }, []);

  const handleOpenPayment = (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!category) {
      setErrorMessage('Please select a complaint category.');
      return;
    }

    if (!description.trim() || description.trim().length < 10) {
      setErrorMessage('Please provide a descriptive explanation of the issue (at least 10 characters).');
      return;
    }

    // Open Razorpay ₹50 Free Test Gateway Modal
    setShowRazorpayModal(true);
  };

  const handlePaymentCompleted = async (paymentData: PaymentSuccessData) => {
    setShowRazorpayModal(false);
    setLastPayment(paymentData);
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await submitComplaint({
        studentName: studentName.trim() || undefined,
        category,
        description: description.trim(),
        location: location.trim() || undefined,
        priority,
        paymentStatus: 'Paid',
        paymentAmount: paymentData.paymentAmount,
        paymentId: paymentData.paymentId,
        paymentMethod: paymentData.paymentMethod,
        paidAt: paymentData.paidAt,
      });

      if (res.success && res.complaint) {
        setSubmittedComplaint(res.complaint);
        onSuccess(res.complaint);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while submitting the complaint. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyId = () => {
    if (!submittedComplaint?.referenceId) return;
    navigator.clipboard.writeText(submittedComplaint.referenceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyPayId = () => {
    const pId = submittedComplaint?.paymentId || lastPayment?.paymentId;
    if (!pId) return;
    navigator.clipboard.writeText(pId);
    setCopiedPayId(true);
    setTimeout(() => setCopiedPayId(false), 2500);
  };

  const resetForm = () => {
    setSubmittedComplaint(null);
    setStudentName('');
    setDescription('');
    setLocation('');
    setCategory('Hostel');
    setPriority('Medium');
    setErrorMessage(null);
    setLastPayment(null);
  };

  // If complaint has just been submitted, display the confirmation view
  if (submittedComplaint) {
    return (
      <div className="max-w-2xl mx-auto py-4">
        <div 
          id="complaint-success-card"
          className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8 text-center transition-all animate-fadeIn"
        >
          <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center mx-auto mb-4 border border-emerald-200">
            <CheckCircle className="w-8 h-8" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 mb-3">
            <Check className="w-3 h-3" /> Case Logged Successfully
          </span>

          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Thank you for submitting your case
          </h2>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
            Your complaint has been registered in the centralized queue. Use the Reference ID below to track real-time resolution updates.
          </p>

          {/* Reference ID Callout Box */}
          <div className="my-6 p-6 bg-slate-50 rounded-xl border border-slate-200 text-left">
            <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">
              <span>Official Reference ID</span>
              <span className="text-[#1E3A8A] font-bold">{submittedComplaint.category}</span>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1">
              <span 
                id="generated-ref-id"
                className="font-mono text-2xl sm:text-3xl font-extrabold text-[#1E3A8A] tracking-wider"
              >
                {submittedComplaint.referenceId}
              </span>
              
              <button
                id="btn-copy-ref-id"
                type="button"
                onClick={handleCopyId}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:text-[#1E3A8A] shadow-xs transition-all cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-500" />
                    <span>Copy ID</span>
                  </>
                )}
              </button>
            </div>

            {/* Razorpay Payment Verification Callout */}
            <div className="mt-4 p-4 rounded-xl bg-sky-50/70 border border-sky-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#0284C7] text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Zap className="w-4 h-4 fill-current" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#0C2340] uppercase tracking-wider">
                      Razorpay Payment Verified
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                      ₹{submittedComplaint.paymentAmount || 50}.00 PAID (FREE)
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 font-mono text-xs text-slate-600">
                    <span>ID:</span>
                    <span className="font-bold text-slate-800">{submittedComplaint.paymentId || 'pay_rzp_DEMO50'}</span>
                    <button
                      type="button"
                      onClick={handleCopyPayId}
                      className="text-slate-400 hover:text-slate-700 cursor-pointer"
                      title="Copy Payment ID"
                    >
                      {copiedPayId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowReceiptModal(true)}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold uppercase tracking-wider shadow-xs cursor-pointer transition-all"
              >
                <FileText className="w-3.5 h-3.5 text-[#0284C7]" />
                <span>View Receipt</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-200 text-xs text-slate-600">
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Category</span>
                <span className="font-semibold text-slate-800">{submittedComplaint.category}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Location</span>
                <span className="font-semibold text-slate-800">{submittedComplaint.location || 'Campus'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Initial Status</span>
                <span className="inline-block px-2.5 py-0.5 bg-yellow-100 text-yellow-800 text-[10px] font-bold uppercase rounded-full mt-0.5 border border-yellow-200">
                  Pending
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              id="btn-track-now"
              type="button"
              onClick={() => onTrackRedirect(submittedComplaint.referenceId)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-xs sm:text-sm font-bold uppercase tracking-wider bg-[#1E3A8A] text-white hover:bg-blue-900 shadow-md shadow-blue-950/10 transition-all cursor-pointer"
            >
              <span>Track Resolution Status</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              id="btn-submit-another"
              type="button"
              onClick={resetForm}
              className="w-full sm:w-auto px-5 py-3 rounded-lg text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer border border-slate-200"
            >
              Submit Another Case
            </button>
          </div>
        </div>

        {/* Printable/Viewable Receipt Modal */}
        {submittedComplaint && (
          <PaymentReceiptModal
            isOpen={showReceiptModal}
            onClose={() => setShowReceiptModal(false)}
            complaint={submittedComplaint}
          />
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header Banner - Geometric Balance Theme */}
      <div className="mb-2">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight font-sans">
          Submit a Complaint
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          Your feedback helps us maintain a better campus environment. Anonymous reporting is fully supported.
        </p>
      </div>

      {/* Main Submission Card */}
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-slate-200">
        <form onSubmit={handleOpenPayment} className="space-y-6">
          
          {errorMessage && (
            <div 
              id="submit-error-banner"
              className="flex items-start gap-3 p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm animate-fadeIn"
            >
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold block">Submission Error</strong>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Grid of Two Columns: Full Name + Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Full Name */}
            <div className="flex flex-col gap-2">
              <label htmlFor="student-name" className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Full Name (Optional)
              </label>
              <input
                type="text"
                id="student-name"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="e.g. Alex Johnson (Leave blank for anonymous)"
                className="border border-slate-200 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-white transition-all text-slate-900 placeholder:text-slate-400"
              />
              <span className="text-[11px] text-slate-400">
                🔒 Kept confidential if provided.
              </span>
            </div>

            {/* Category Select */}
            <div className="flex flex-col gap-2">
              <label htmlFor="complaint-category-select" className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                id="complaint-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
                className="border border-slate-200 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-white transition-all text-slate-900 font-medium cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.label} value={cat.label}>
                    {cat.label} — {cat.description}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* Category Visual Grid Selection */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Quick Category Selector
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {CATEGORIES.map((cat) => {
                const IconComponent = cat.icon;
                const isSelected = category === cat.label;
                return (
                  <button
                    key={cat.label}
                    type="button"
                    id={`cat-btn-${cat.label.toLowerCase()}`}
                    onClick={() => setCategory(cat.label)}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#1E3A8A] bg-blue-50/70 ring-2 ring-blue-600/20 text-[#1E3A8A] font-bold shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <IconComponent className={`w-4 h-4 mb-1.5 ${isSelected ? 'text-[#1E3A8A]' : 'text-slate-500'}`} />
                    <span className="text-xs">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Two-Column: Location & Urgency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Location / Block */}
            <div className="flex flex-col gap-2">
              <label htmlFor="complaint-location" className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Location / Block / Room
              </label>
              <input
                type="text"
                id="complaint-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Hostel Block C Room 402, CS Lab 2"
                className="border border-slate-200 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-white transition-all text-slate-900 placeholder:text-slate-400"
              />
            </div>

            {/* Urgency Level */}
            <div className="flex flex-col gap-2">
              <label htmlFor="complaint-priority" className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Urgency Level
              </label>
              <select
                id="complaint-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as ComplaintPriority)}
                className="border border-slate-200 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-white transition-all text-slate-900 cursor-pointer"
              >
                <option value="Low">Low — Minor suggestion / general inquiry</option>
                <option value="Medium">Medium — Standard campus maintenance</option>
                <option value="High">High — Affects daily routine or classes</option>
                <option value="Urgent">Urgent — Safety, water, electrical breakdown</option>
              </select>
            </div>

          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label htmlFor="complaint-description" className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Description <span className="text-rose-500">*</span>
              </label>
              <span className={`text-xs ${description.length < 10 ? 'text-slate-400' : 'text-emerald-600 font-medium'}`}>
                {description.length} chars (min 10)
              </span>
            </div>
            <textarea
              id="complaint-description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide details about the issue..."
              className="border border-slate-200 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-white transition-all text-slate-900 placeholder:text-slate-400 resize-none"
              required
            ></textarea>
          </div>

          {/* Razorpay ₹50 Payment Callout Section */}
          <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 border border-sky-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0C2340] text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Zap className="w-5 h-5 text-sky-400 fill-current" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-[#0C2340] uppercase tracking-wider">
                      Complaint Verification & Filing Fee
                    </span>
                    <span className="inline-flex items-center gap-1 bg-[#0284C7] text-white text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-xs">
                      Razorpay
                    </span>
                    {rzpConfig?.isLive ? (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        LIVE REAL-TIME GATEWAY
                      </span>
                    ) : (
                      <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full border border-amber-300">
                        OFFICIAL CHECKOUT (SANDBOX / LIVE READY)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    {rzpConfig?.isLive 
                      ? '₹50 registration fee will be collected via Razorpay (UPI, GPay, PhonePe, Cards, Netbanking) and credited to the college redressal account.'
                      : 'A nominal ₹50 token fee authenticates your grievance report and generates a verifiable Razorpay transaction receipt. Connect your live keys to collect real money.'}
                  </p>
                </div>
              </div>

              <div className="text-right sm:text-right shrink-0 bg-white/80 backdrop-blur-xs p-3 rounded-lg border border-sky-100 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Payable</span>
                <span className="text-xl sm:text-2xl font-black text-[#0C2340]">₹50.00</span>
                <span className="text-[10px] text-slate-500 font-semibold block">
                  {rzpConfig?.isLive ? 'Real Money (Live)' : 'Test / Demo Ready'}
                </span>
              </div>
            </div>
          </div>

          {/* Submit Action Button */}
          <button
            id="btn-submit-complaint"
            type="submit"
            disabled={loading}
            className="w-full bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-sky-900/15 uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Securing Case Registration...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-current text-sky-200" />
                <span>
                  {rzpConfig?.isLive 
                    ? 'Pay ₹50 via Razorpay (Live) & File Complaint' 
                    : 'Pay ₹50 via Razorpay & File Complaint'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

        </form>
      </div>

      {/* Razorpay Payment Gateway Modal */}
      <RazorpayModal
        isOpen={showRazorpayModal}
        onClose={() => setShowRazorpayModal(false)}
        onPaymentSuccess={handlePaymentCompleted}
        studentName={studentName.trim() || undefined}
        category={category}
        amount={50}
      />

      {/* System Performance Callout Card */}
      <div className="bg-blue-900 text-white p-6 rounded-xl flex items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight">System Redressal Guarantee</div>
            <div className="text-xs text-blue-200 mt-0.5">Average case turnaround: under 24–48 hours across departments.</div>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
          <Shield className="w-4 h-4 text-emerald-300" />
          <span>Active Grievance Cell</span>
        </div>
      </div>

    </div>
  );
};
