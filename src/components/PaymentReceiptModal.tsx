import { FC, useRef } from 'react';
import { 
  X, 
  Printer, 
  CheckCircle, 
  ShieldCheck, 
  Download, 
  Copy, 
  Check, 
  Building2,
  Calendar,
  FileText,
  User,
  Zap
} from 'lucide-react';
import { useState } from 'react';
import { Complaint } from '../types';

interface PaymentReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  complaint: Complaint;
}

export const PaymentReceiptModal: FC<PaymentReceiptModalProps> = ({
  isOpen,
  onClose,
  complaint,
}) => {
  const [copied, setCopied] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const paymentId = complaint.paymentId || 'pay_rzp_DEMO50FREE';
  const paidDate = complaint.paidAt 
    ? new Date(complaint.paidAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

  const handleCopyPaymentId = () => {
    navigator.clipboard.writeText(paymentId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col transition-all max-h-[95vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Controls Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-bold tracking-tight">Official Grievance Payment Receipt</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 transition-colors text-white cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div ref={receiptRef} className="p-6 sm:p-8 space-y-6 overflow-y-auto bg-white">
          {/* Institution Header */}
          <div className="text-center pb-5 border-b border-slate-200">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-[#1E3A8A] text-white rounded-xl mb-2 font-bold text-lg shadow-sm">
              CC
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              CampusCare Grievance Cell
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Central Student Redressal & Oversight Authority
            </p>
            <span className="inline-block mt-2 px-3 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-[11px] font-bold tracking-wider uppercase">
              Fee Payment Acknowledgment
            </span>
          </div>

          {/* Amount Box */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Total Fee Paid
              </span>
              <div className="text-2xl font-black text-slate-900">
                ₹{complaint.paymentAmount || 50}.00
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold">
                ✓ Free Test Mode / Sandbox Verified
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Payment Gateway
              </span>
              <div className="flex items-center gap-1 text-sm font-bold text-[#0284C7] justify-end">
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Razorpay</span>
              </div>
              <span className="text-[10px] text-slate-400">Status: SUCCESS</span>
            </div>
          </div>

          {/* Detailed Metadata Grid */}
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Complaint Reference ID</span>
              <span className="font-mono font-bold text-[#1E3A8A] text-sm">{complaint.referenceId}</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Razorpay Payment ID</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-slate-800">{paymentId}</span>
                <button
                  type="button"
                  onClick={handleCopyPaymentId}
                  className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="Copy Payment ID"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Complainant Name</span>
              <span className="font-semibold text-slate-800">
                {complaint.studentName || 'Confidential / Anonymous'}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Category</span>
              <span className="font-semibold text-slate-800">{complaint.category}</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Payment Mode</span>
              <span className="font-semibold text-slate-800">
                {complaint.paymentMethod || 'Razorpay UPI (Test Gateway)'}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Timestamp</span>
              <span className="text-slate-700 font-medium">{paidDate}</span>
            </div>
          </div>

          {/* Official Verification Seal */}
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
            <div className="text-[11px] text-emerald-800 leading-tight">
              <strong>Authenticity Verified:</strong> This receipt certifies that complaint #{complaint.referenceId} has been successfully validated with Razorpay test token transaction.
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
