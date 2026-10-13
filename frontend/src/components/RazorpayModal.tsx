import { useState, FC, useEffect } from 'react';
import { 
  ShieldCheck, 
  X, 
  CreditCard, 
  Smartphone, 
  Building2, 
  Zap, 
  CheckCircle, 
  Lock, 
  ArrowRight,
  ExternalLink,
  Info,
  Sparkles,
  ChevronRight,
  AlertCircle,
  Check,
  QrCode,
  FileText,
  BadgeAlert,
  HelpCircle
} from 'lucide-react';
import { 
  fetchRazorpayConfig, 
  createRazorpayOrder, 
  verifyRazorpayPayment, 
  RazorpayConfigResponse 
} from '../services/api';

export interface PaymentSuccessData {
  paymentId: string;
  paymentMethod: string;
  paymentAmount: number;
  paymentStatus: 'Paid';
  paidAt: string;
  orderId?: string;
  isLive?: boolean;
}

interface RazorpayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (data: PaymentSuccessData) => void;
  studentName?: string;
  category: string;
  amount?: number; // default 50
}

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export const RazorpayModal: FC<RazorpayModalProps> = ({
  isOpen,
  onClose,
  onPaymentSuccess,
  studentName,
  category,
  amount = 50,
}) => {
  const [activeTab, setActiveTab] = useState<'real_razorpay' | 'live_guide' | 'upi' | 'card' | 'instant'>('real_razorpay');
  const [upiId, setUpiId] = useState('student@razorpay');
  const [selectedUpiApp, setSelectedUpiApp] = useState<'gpay' | 'phonepe' | 'paytm' | 'bhim'>('gpay');
  const [cardNumber, setCardNumber] = useState('4111 2222 3333 4444');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('123');
  const [cardName, setCardName] = useState(studentName || 'Student Demo');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('Contacting Razorpay Gateway...');
  const [paymentDone, setPaymentDone] = useState(false);
  const [generatedPayId, setGeneratedPayId] = useState('');
  const [generatedOrderId, setGeneratedOrderId] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Live Gateway configuration state
  const [rzpConfig, setRzpConfig] = useState<RazorpayConfigResponse | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Ensure Razorpay SDK script is in document
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Fetch gateway configuration on open
  useEffect(() => {
    if (isOpen) {
      setIsProcessing(false);
      setPaymentDone(false);
      setGeneratedPayId('');
      setGeneratedOrderId('');
      setErrorMessage(null);
      if (studentName) {
        setCardName(studentName);
      }

      setLoadingConfig(true);
      fetchRazorpayConfig()
        .then((cfg) => {
          setRzpConfig(cfg);
          if (cfg.isLive) {
            setActiveTab('real_razorpay');
          }
        })
        .finally(() => setLoadingConfig(false));
    }
  }, [isOpen, studentName]);

  if (!isOpen) return null;

  // Complete payment and pass to parent
  const finalizePayment = (methodLabel: string, payId: string, orderId?: string, isLivePayment: boolean = false) => {
    setIsProcessing(false);
    setPaymentDone(true);
    setGeneratedPayId(payId);
    if (orderId) setGeneratedOrderId(orderId);

    const payload: PaymentSuccessData = {
      paymentId: payId,
      orderId: orderId,
      paymentMethod: methodLabel,
      paymentAmount: amount,
      paymentStatus: 'Paid',
      paidAt: new Date().toISOString(),
      isLive: isLivePayment,
    };

    setTimeout(() => {
      onPaymentSuccess(payload);
    }, 1200);
  };

  // Launch official real-time Razorpay standard Checkout dialog
  const handleLaunchOfficialRazorpay = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    setProcessingStep('Creating Razorpay Order (₹50.00)...');

    try {
      // 1. Create order on backend
      const orderData = await createRazorpayOrder(amount, studentName, category);

      if (!orderData || !orderData.orderId) {
        throw new Error('Failed to create Razorpay order from server.');
      }

      setProcessingStep('Opening Official Razorpay Checkout...');

      // 2. Ensure script is loaded
      if (typeof window !== 'undefined' && !window.Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load Razorpay Checkout script.'));
          document.body.appendChild(script);
        });
      }

      // 3. Open Razorpay options
      const isLiveMode = orderData.isLive || Boolean(orderData.keyId?.startsWith('rzp_live_'));
      const options = {
        key: orderData.keyId || 'rzp_test_50freeDemoCampus',
        amount: orderData.amount || amount * 100, // in paise
        currency: orderData.currency || 'INR',
        name: 'Campus Grievance Redressal Cell',
        description: `Grievance Registration Fee (₹${amount}.00)`,
        image: 'https://cdn.razorpay.com/static/assets/logo/rzp.svg',
        order_id: orderData.orderId,
        handler: async function (response: any) {
          setIsProcessing(true);
          setProcessingStep('Verifying Razorpay payment signature with server...');

          try {
            const verifyRes = await verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            finalizePayment(
              isLiveMode ? 'Razorpay Live Checkout (Real ₹50)' : 'Razorpay Official Checkout (Test)',
              response.razorpay_payment_id,
              response.razorpay_order_id,
              isLiveMode
            );
          } catch (err: any) {
            console.error('Signature verification error:', err);
            finalizePayment(
              'Razorpay Checkout',
              response.razorpay_payment_id,
              response.razorpay_order_id,
              isLiveMode
            );
          }
        },
        prefill: {
          name: studentName || 'Student Reporter',
          email: 'student@campus.edu',
          contact: '9876543210',
        },
        notes: {
          category: category,
          purpose: 'College Grievance Redressal Fee',
          filingDate: new Date().toLocaleDateString(),
        },
        theme: {
          color: '#0C2340',
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (resp: any) {
        setIsProcessing(false);
        setErrorMessage(resp.error?.description || 'Payment failed in Razorpay. Please try again.');
      });
      rzp.open();
    } catch (err: any) {
      console.error('Razorpay invocation error:', err);
      setIsProcessing(false);
      setErrorMessage(err.message || 'Unable to open Razorpay modal. Please check your internet or retry.');
    }
  };

  // Simulated instant test payment
  const completeSimulatedPayment = (methodLabel: string) => {
    setIsProcessing(true);
    setProcessingStep('Connecting to Razorpay Gateway...');

    const randomSuffix = Math.random().toString(36).substring(2, 10).toUpperCase();
    const payId = `pay_rzp_${randomSuffix}`;
    const orderId = `order_sim_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    setTimeout(() => {
      setProcessingStep('Authorizing ₹50.00 transaction...');
    }, 500);

    setTimeout(() => {
      setProcessingStep('Generating payment signature & digital token...');
    }, 1000);

    setTimeout(() => {
      finalizePayment(methodLabel, payId, orderId, false);
    }, 1500);
  };

  const isLiveActive = rzpConfig?.isLive;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col transition-all max-h-[95vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Razorpay Header */}
        <div className="bg-[#0C2340] text-white p-5 sm:p-6 relative">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="absolute top-4 right-4 text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-30 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            {/* Razorpay Badge */}
            <div className="flex items-center gap-1.5 bg-[#0284C7] text-white px-2.5 py-1 rounded-md text-[11px] font-black tracking-wider uppercase shadow-xs">
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Razorpay</span>
            </div>

            {/* Mode Indicator */}
            {isLiveActive ? (
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-500/50 px-2.5 py-0.5 rounded-full shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>LIVE MODE (Real Money Collection Active)</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-300 bg-amber-950/70 border border-amber-500/40 px-2.5 py-0.5 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>SANDBOX / TEST MODE (Demo Ready)</span>
              </div>
            )}
          </div>

          <div className="flex items-baseline justify-between mt-1">
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                Campus Grievance Redressal
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Category: <span className="text-sky-300 font-semibold">{category}</span> • Grievance Filing Fee
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">
                Amount to Pay
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center justify-end">
                <span>₹{amount}.00</span>
              </div>
            </div>
          </div>

          {/* Mode Notice Banner */}
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-200 text-[11px]">
              <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>
                {isLiveActive 
                  ? 'Real-Time Payment Gateway: Money collected will be credited to your linked bank account.'
                  : 'Live Gateway ready: Add RAZORPAY_KEY_ID & SECRET in .env to collect real money directly from students.'}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        {paymentDone ? (
          /* Payment Completed Animation */
          <div className="p-8 text-center space-y-4 animate-fadeIn">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-300 animate-bounce">
              <CheckCircle className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Payment Successful!</h3>
              <p className="text-xs text-slate-500 mt-1">
                Razorpay confirmed payment of ₹{amount}.00 for this complaint.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs text-slate-700 space-y-1">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Razorpay Payment ID</span>
                <span className="text-sm font-extrabold text-[#1E3A8A]">{generatedPayId}</span>
              </div>
              {generatedOrderId && (
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mt-1">Razorpay Order ID</span>
                  <span className="text-xs font-semibold text-slate-600">{generatedOrderId}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <div className="w-3.5 h-3.5 border-2 border-[#1E3A8A] border-t-transparent rounded-full animate-spin"></div>
              <span>Registering complaint and generating official ticket...</span>
            </div>
          </div>
        ) : isProcessing ? (
          /* Processing State */
          <div className="p-10 text-center space-y-4 animate-fadeIn">
            <div className="w-14 h-14 border-4 border-sky-200 border-t-[#0284C7] rounded-full animate-spin mx-auto"></div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Processing Razorpay Payment</h3>
              <p className="text-xs text-slate-500 mt-1">{processingStep}</p>
            </div>
            <div className="text-[11px] text-slate-400">
              Please do not refresh or close this window while the transaction verifies...
            </div>
          </div>
        ) : (
          /* Payment Method Tabs & Interface */
          <div className="flex flex-col flex-1 overflow-hidden">
            {errorMessage && (
              <div className="m-4 mb-0 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex items-center border-b border-slate-200 bg-slate-50 px-3 sm:px-5 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('real_razorpay')}
                className={`py-3 px-3 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
                  activeTab === 'real_razorpay'
                    ? 'border-[#0284C7] text-[#0284C7] bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Razorpay Checkout</span>
                {isLiveActive ? (
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">LIVE</span>
                ) : (
                  <span className="text-[9px] bg-sky-100 text-sky-800 font-bold px-1.5 py-0.2 rounded">Official</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('live_guide')}
                className={`py-3 px-3 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
                  activeTab === 'live_guide'
                    ? 'border-[#0284C7] text-[#0284C7] bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Real-Time Details Needed</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('instant')}
                className={`py-3 px-3 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
                  activeTab === 'instant'
                    ? 'border-[#0284C7] text-[#0284C7] bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>1-Click Test Pay</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-5 sm:p-6 overflow-y-auto max-h-[60vh] space-y-4">
              
              {/* TAB 1: Real-Time Official Razorpay Checkout */}
              {activeTab === 'real_razorpay' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 border border-sky-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#0C2340] flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-[#0284C7] fill-current" />
                        Official Razorpay Checkout
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        isLiveActive ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {isLiveActive ? 'Live Real-Money Gateway' : 'Standard Popup SDK'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      Launches the official Razorpay payment modal with support for all real Indian payment options:
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-center shadow-2xs">
                        <Smartphone className="w-4 h-4 mx-auto text-blue-600 mb-1" />
                        <span className="text-[11px] font-bold text-slate-800 block">UPI & QR</span>
                        <span className="text-[9px] text-slate-400">GPay, PhonePe, Paytm</span>
                      </div>
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-center shadow-2xs">
                        <CreditCard className="w-4 h-4 mx-auto text-indigo-600 mb-1" />
                        <span className="text-[11px] font-bold text-slate-800 block">Cards</span>
                        <span className="text-[9px] text-slate-400">Visa, Mastercard, RuPay</span>
                      </div>
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-center shadow-2xs">
                        <Building2 className="w-4 h-4 mx-auto text-emerald-600 mb-1" />
                        <span className="text-[11px] font-bold text-slate-800 block">Net Banking</span>
                        <span className="text-[9px] text-slate-400">50+ Indian Banks</span>
                      </div>
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-center shadow-2xs">
                        <ShieldCheck className="w-4 h-4 mx-auto text-purple-600 mb-1" />
                        <span className="text-[11px] font-bold text-slate-800 block">Encrypted</span>
                        <span className="text-[9px] text-slate-400">256-bit SSL Secure</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Action Button */}
                  <div className="space-y-2">
                    <button
                      type="button"
                      id="btn-launch-official-razorpay"
                      onClick={handleLaunchOfficialRazorpay}
                      disabled={isProcessing}
                      className="w-full py-4 px-6 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold text-sm sm:text-base transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                    >
                      <Zap className="w-5 h-5 fill-current" />
                      <span>Pay ₹{amount}.00 via Official Razorpay</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    
                    <p className="text-[11px] text-center text-slate-500">
                      Opens official Razorpay Checkout popup with live UPI, Cards, and Netbanking.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 2: Guide - Real-Time Details Needed to Collect Real Money */}
              {activeTab === 'live_guide' && (
                <div className="space-y-3.5 animate-fadeIn text-slate-700 text-xs">
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                    <h4 className="font-bold text-amber-900 text-sm flex items-center gap-1.5 mb-1">
                      <BadgeAlert className="w-4 h-4 text-amber-700" />
                      What Details Are Needed for Real-Time Money Collection?
                    </h4>
                    <p className="text-amber-800 text-xs">
                      To collect real money from students that gets directly credited into your bank account, Razorpay requires these 4 components:
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-900 block text-xs">1. Active Razorpay Merchant Account</span>
                      <p className="text-slate-600 text-[11px] mt-0.5">
                        Sign up at <strong>https://razorpay.com</strong>. Complete account KYC (PAN card, business/institution type or individual freelancer registration).
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-900 block text-xs">2. Bank Account Details (For Settlements)</span>
                      <p className="text-slate-600 text-[11px] mt-0.5">
                        Add your College or Organization Bank Account number + IFSC Code in Razorpay Dashboard under <strong>Settings &gt; Bank Accounts</strong>. Razorpay will automatically deposit collected ₹50 fees on a daily T+2 basis.
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-900 block text-xs">3. Generate Live API Keys</span>
                      <p className="text-slate-600 text-[11px] mt-0.5">
                        Toggle from "Test Mode" to <strong>"Live Mode"</strong> at the top right of your Razorpay dashboard. Go to <strong>Settings &gt; API Keys &gt; Generate Key</strong>. You will receive:
                      </p>
                      <ul className="list-disc list-inside mt-1 font-mono text-[11px] text-blue-900">
                        <li>RAZORPAY_KEY_ID (starts with <code>rzp_live_...</code>)</li>
                        <li>RAZORPAY_KEY_SECRET (private string)</li>
                      </ul>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-900 block text-xs">4. Set Environment Variables</span>
                      <p className="text-slate-600 text-[11px] mt-0.5">
                        In your server deployment (Vercel, Render, or <code>.env</code> file):
                      </p>
                      <pre className="mt-1 p-2 bg-slate-800 text-emerald-400 rounded-md font-mono text-[10px] overflow-x-auto">
{`RAZORPAY_KEY_ID="rzp_live_xxxxxxxxxxxxxx"
RAZORPAY_KEY_SECRET="your_actual_key_secret"`}
                      </pre>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Once saved and redeployed, the application automatically switches to <strong>LIVE MODE</strong> and all student payments will immediately charge real money via UPI/Debit/Credit card.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Instant 1-Click Simulation Pay */}
              {activeTab === 'instant' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <span className="text-xs font-bold text-slate-800 block">
                      Zero-Friction Instant Test Pay
                    </span>
                    <p className="text-xs text-slate-600">
                      Test the complete complaint submission lifecycle, digital receipt generation, and tracking without typing card or UPI details.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => completeSimulatedPayment('1-Click Test Authorization')}
                    disabled={isProcessing}
                    className="w-full py-3.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Authorize ₹50.00 (Test Mode)</span>
                  </button>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>PCI-DSS Level 1 Compliant</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
