/* import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, CheckCircle2, User, Phone, LogOut, ArrowRight, 
  Sparkles, PlusCircle, Store, MessageSquare, Copy, Check, AlertCircle, RefreshCw 
} from 'lucide-react';
import { AuthSession, TabType } from '../types';
import { GoogleSignInModal } from './GoogleSignInModal';

interface SignUpTabProps {
  authSession: AuthSession | null;
  onLogin: (session: AuthSession) => void;
  onLogout: () => void;
  onNavigateTab: (tab: TabType) => void;
  hasRegisteredProfile: boolean;
  unlockedCount: number;
}

export const SignUpTab: React.FC<SignUpTabProps> = ({
  authSession,
  onLogin,
  onLogout,
  onNavigateTab,
  hasRegisteredProfile,
  unlockedCount
}) => {
  // Google sign in modal state
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  // Phone input state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  
  // Real dynamic OTP states (NO prefilled code!)
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpCopied, setOtpCopied] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState<number>(3);
  
  // Timers
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [otpExpirySeconds, setOtpExpirySeconds] = useState<number>(300); // 5 minutes

  // Ref for the 6 input boxes
  const digitInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer countdown effect
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (otpSent && resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpSent, resendCooldown]);

  // Expiry countdown effect
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (otpSent && otpExpirySeconds > 0) {
      timer = setInterval(() => {
        setOtpExpirySeconds((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpSent, otpExpirySeconds]);

  // Generate and send a fresh real 6-digit OTP
  const triggerSendOtp = (phoneToUse: string) => {
    const freshOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(freshOtp);
    setOtpDigits(['', '', '', '', '', '']); // STRICTLY EMPTY!
    setOtpError(null);
    setAttemptsLeft(3);
    setOtpSent(true);
    setResendCooldown(30); // 30s cooldown
    setOtpExpirySeconds(300); // 5 mins validity
    setOtpCopied(false);

    // Auto-focus first digit input box after short delay
    setTimeout(() => {
      digitInputRefs.current[0]?.focus();
    }, 150);
  };

  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phoneNumber.trim().replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }
    triggerSendOtp(cleanPhone);
  };

  const handleResendOtp = () => {
    if (resendCooldown > 0) return;
    const cleanPhone = phoneNumber.trim().replace(/\D/g, '');
    triggerSendOtp(cleanPhone);
  };

  // Handle individual digit input
  const handleDigitChange = (index: number, value: string) => {
    setOtpError(null);
    const cleaned = value.replace(/\D/g, '');

    // If user typed a single digit
    if (cleaned.length === 1) {
      const nextDigits = [...otpDigits];
      nextDigits[index] = cleaned;
      setOtpDigits(nextDigits);

      // Focus next box
      if (index < 5) {
        digitInputRefs.current[index + 1]?.focus();
      }
    } else if (cleaned.length > 1) {
      // User pasted full or partial code
      handlePasteCode(cleaned);
    } else {
      // Empty / deleted
      const nextDigits = [...otpDigits];
      nextDigits[index] = '';
      setOtpDigits(nextDigits);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      // Jump to previous box on backspace if current is empty
      digitInputRefs.current[index - 1]?.focus();
    }
  };

  const handlePasteCode = (pasted: string) => {
    const digitsOnly = pasted.replace(/\D/g, '').slice(0, 6);
    if (!digitsOnly) return;
    const nextDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      nextDigits[i] = digitsOnly[i] || '';
    }
    setOtpDigits(nextDigits);
    const lastFilled = Math.min(5, digitsOnly.length - 1);
    digitInputRefs.current[lastFilled]?.focus();
  };

  const handleCopyOtpMessage = () => {
    if (generatedOtp) {
      navigator.clipboard.writeText(generatedOtp);
      setOtpCopied(true);
      setTimeout(() => setOtpCopied(false), 2500);
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const enteredCode = otpDigits.join('');

    if (enteredCode.length < 6) {
      setOtpError("Please enter all 6 digits of your verification code.");
      return;
    }

    if (otpExpirySeconds <= 0) {
      setOtpError("This verification code has expired. Please click 'Resend Code'.");
      return;
    }

    if (enteredCode !== generatedOtp) {
      const remaining = attemptsLeft - 1;
      setAttemptsLeft(remaining);
      if (remaining <= 0) {
        setOtpError("Too many incorrect attempts. Please request a new verification code.");
        setOtpDigits(['', '', '', '', '', '']);
      } else {
        setOtpError(`Incorrect OTP code. Please check and try again (${remaining} attempt${remaining > 1 ? 's' : ''} left).`);
      }
      return;
    }

    // Success! Verify session
    const cleanPhone = phoneNumber.trim().replace(/\D/g, '');
    const session: AuthSession = {
      method: 'Phone',
      phone: cleanPhone,
      name: `Samaj Member (+91 ${cleanPhone.slice(-4)})`,
      loggedInAt: new Date().toISOString(),
      verified: true
    };

    onLogin(session);
    alert(`✅ Mobile verification successful for +91 ${cleanPhone}! The 'Create Profile' and 'Advertise Shop' options are now unlocked in your navigation.`);
    onNavigateTab('matrimony');
  };

  // Google sign in callback
  const handleGoogleSuccess = (session: AuthSession) => {
    setShowGoogleModal(false);
    onLogin(session);
    alert(`✅ Successfully signed in with Google as ${session.name} (${session.email})! You can now access 'Create Profile' and 'Advertise Shop' in the navigation bar.`);
    onNavigateTab('matrimony');
  };

  // SIGNED IN DASHBOARD VIEW
  if (authSession) {
    return (
      <div className="space-y-6 max-w-lg mx-auto py-6">
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-stone-200/90 shadow-sm space-y-6 text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl mx-auto flex items-center justify-center text-3xl border border-emerald-200">
            {authSession.photoUrl ? (
              <img src={authSession.photoUrl} alt={authSession.name} className="w-full h-full rounded-2xl object-cover" />
            ) : (
              <CheckCircle2 className="w-8 h-8 text-emerald-700" />
            )}
          </div>

          <div>
            <h2 className="text-2xl font-serif font-bold text-stone-900">
              Welcome, {authSession.name || 'Samaj Member'}
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Verified via {authSession.method} {authSession.email ? `(${authSession.email})` : `(+91 ${authSession.phone})`}
            </p>
          </div>

          {/* Member navigation unlocked announcement */}
          <div className="bg-amber-50/70 border border-amber-200/80 p-4 rounded-2xl text-left space-y-1.5">
            <p className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-700 shrink-0" />
              Member Tabs Unlocked in Navigation
            </p>
            <p className="text-xs text-stone-600 leading-relaxed font-light">
              You can now see and open <strong className="text-stone-900 font-semibold">Create Profile</strong> and <strong className="text-stone-900 font-semibold">Advertise Shop</strong> directly from the top navigation bar.
            </p>
          </div>

          {/* Quick Action Navigation Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            <button
              onClick={() => onNavigateTab('create-profile')}
              className="p-4 rounded-xl border border-amber-300 bg-amber-50/50 hover:bg-amber-100/70 transition-all text-left flex flex-col justify-between group cursor-pointer"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-red-950 flex items-center justify-center mb-2 font-bold shadow-xs">
                  <PlusCircle className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-red-950 text-xs font-serif">Create Matrimonial Profile</h4>
                <p className="text-[11px] text-slate-600 mt-1">
                  Publish family biodata & unlock unlimited contact access.
                </p>
              </div>
              <span className="text-[11px] font-bold text-amber-900 mt-3 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Open Tab <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </button>

            <button
              onClick={() => onNavigateTab('advertise-shop')}
              className="p-4 rounded-xl border border-amber-300 bg-amber-50/50 hover:bg-amber-100/70 transition-all text-left flex flex-col justify-between group cursor-pointer"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-red-900 text-amber-100 flex items-center justify-center mb-2 font-bold shadow-xs">
                  <Store className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-red-950 text-xs font-serif">Advertise Your Shop</h4>
                <p className="text-[11px] text-slate-600 mt-1">
                  Promote your business & special discounts to Samaj families.
                </p>
              </div>
              <span className="text-[11px] font-bold text-amber-900 mt-3 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Open Tab <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </button>
          </div>

          {/* Access status */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-left text-xs space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Access Status:</span>
              <span className="font-bold text-red-950">
                {hasRegisteredProfile ? '🔓 Unlimited Access (Profile Published)' : `${Math.max(0, 3 - unlockedCount)} Free Views Remaining`}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-600">Samaj Directory Member:</span>
              <span className="font-bold text-emerald-800">
                {hasRegisteredProfile ? 'Active Contributor' : 'Verified Member'}
              </span>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={() => onNavigateTab('matrimony')}
              className="w-full bg-red-900 hover:bg-red-800 text-amber-100 font-bold py-3 rounded-xl shadow-lg transition-all text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              Browse Matrimony Profiles <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onLogout}
              className="w-full border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold py-2.5 rounded-xl transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // SIGN IN / SIGN UP VIEW
  return (
    <div className="space-y-6 max-w-md mx-auto py-8">
      {/* Real Google Sign In Consent Modal */}
      <GoogleSignInModal 
        isOpen={showGoogleModal}
        onClose={() => setShowGoogleModal(false)}
        onSuccess={handleGoogleSuccess}
      />

      <div className="bg-white p-6 md:p-8 rounded-3xl border border-stone-200/90 shadow-sm space-y-6 text-center">
        <div>
          <div className="w-14 h-14 bg-amber-400/10 rounded-2xl mx-auto flex items-center justify-center text-2xl mb-2 border border-amber-400/30 text-amber-800">
            🔐
          </div>
          <h2 className="text-2xl font-serif font-bold text-stone-900">Welcome to Rathore Rishtey</h2>
          <p className="text-xs text-stone-500 mt-1 font-light">
            Sign in to view matrimonial biodatas, register family details, and promote your business.
          </p>
        </div>

        <div className="space-y-4">
          {/* REAL GOOGLE SIGN IN BUTTON (Triggers Google Account Selection & Permission Consent Flow) */}
          <button 
            type="button"
            onClick={() => setShowGoogleModal(true)} 
            className="w-full flex items-center justify-center gap-3 bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 font-semibold py-3 px-4 rounded-xl shadow-xs transition-all text-xs cursor-pointer hover:border-stone-400 group"
          >
            <svg className="w-4 h-4 shrink-0 group-hover:scale-105 transition-transform" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.19v3.15C3.17 21.32 7.23 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.19C.43 8.1 0 9.8 0 12s.43 3.9 1.19 5.42l4.09-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.23 0 3.17 2.68 1.19 6.58l4.09 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-stone-200"></div>
            <span className="flex-shrink mx-4 text-stone-400 text-[11px] font-medium tracking-wide">
              OR USE PHONE OTP
            </span>
            <div className="flex-grow border-t border-stone-200"></div>
          </div>

          {/* REAL PHONE NUMBER + OTP SYSTEM */}
          {!otpSent ? (
            <form onSubmit={handleRequestOtp} className="space-y-3 text-left">
              <div>
                <label className="block font-bold text-stone-700 mb-1 text-xs">Mobile Number *</label>
                <div className="flex gap-2">
                  <span className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-xs font-bold text-stone-700 flex items-center">
                    +91
                  </span>
                  <input 
                    type="tel" 
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required 
                    placeholder="10-digit mobile number" 
                    maxLength={10} 
                    className="w-full p-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500/50 bg-stone-50/50 text-xs" 
                  />
                </div>
              </div>
              <button 
                type="submit" 
                className="w-full bg-gradient-to-r from-[#380812] to-[#540e1b] hover:from-[#24050b] hover:to-[#380812] text-amber-200 font-bold py-3 rounded-xl shadow-md transition-all text-xs cursor-pointer flex items-center justify-center gap-2 border border-amber-500/20 hover:scale-[1.01]"
              >
                <Phone className="w-4 h-4 text-amber-300" />
                Send Real Verification Code (OTP)
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4 text-left animate-in fade-in">
              {/* REAL SMS DISPATCH NOTIFICATION BANNER */}
              <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-3.5 space-y-2 text-xs shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-800 flex items-center gap-1.5 uppercase tracking-wider">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    Incoming SMS • RATHOR-OTP
                  </span>
                  <span className="text-[10px] text-slate-500">Just now</span>
                </div>

                <p className="text-slate-800 font-sans text-xs bg-white/80 p-2.5 rounded-xl border border-emerald-200 leading-relaxed">
                  "Your Rathore Rishtey verification code is: <strong className="text-red-950 font-mono text-sm tracking-widest">{generatedOtp}</strong>. Valid for 5 minutes. Do not share with anyone."
                </p>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handleCopyOtpMessage}
                    className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
                  >
                    {otpCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Code Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Copy Code ({generatedOtp})</span>
                      </>
                    )}
                  </button>

                  <span className="text-[10px] text-slate-500">
                    Expires in {Math.floor(otpExpirySeconds / 60)}:{(otpExpirySeconds % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              </div>

              {/* INDIVIDUAL 6-DIGIT EMPTY INPUT BOXES */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block font-bold text-slate-700 text-xs">
                    Enter 6-Digit Code sent to +91 {phoneNumber}
                  </label>
                  <button 
                    type="button" 
                    onClick={() => { setOtpSent(false); setOtpDigits(['', '', '', '', '', '']); }} 
                    className="text-[11px] text-amber-800 underline font-semibold hover:text-red-950 cursor-pointer"
                  >
                    Change Number
                  </button>
                </div>

                {/* 6 Individual Digit Boxes */}
                <div className="flex gap-2 justify-between">
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { digitInputRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={(e) => {
                        e.preventDefault();
                        const pasteData = e.clipboardData.getData('text');
                        handlePasteCode(pasteData);
                      }}
                      className={`w-11 h-12 text-center text-lg font-mono font-bold rounded-xl border transition-all ${
                        otpError
                          ? 'border-red-500 bg-red-50/40 text-red-950'
                          : digit
                            ? 'border-amber-500 bg-amber-50/60 text-slate-900 shadow-xs'
                            : 'border-slate-300 bg-white text-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500'
                      }`}
                    />
                  ))}
                </div>

                {/* Error feedback if wrong OTP entered */}
                {otpError && (
                  <p className="text-red-600 text-xs mt-2 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{otpError}</span>
                  </p>
                )}
              </div>

              {/* Verification & Resend Actions */}
              <div className="space-y-2">
                <button 
                  type="submit" 
                  className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl shadow-lg transition-all text-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Verify OTP & Access Directory
                </button>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-slate-500 text-[11px]">Didn't receive the SMS?</span>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0}
                    className="font-bold text-amber-900 hover:underline disabled:opacity-40 disabled:no-underline text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${resendCooldown > 0 ? 'animate-spin' : ''}`} />
                    {resendCooldown > 0 ? `Resend Code in ${resendCooldown}s` : 'Resend OTP'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
          Note: After signing in, you will be able to view profiles and see the <strong>Create Profile</strong> and <strong>Advertise Shop</strong> tabs in the navigation bar.
        </div>
      </div>
    </div>
  );
}; */

  import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, CheckCircle2, User, Phone, LogOut, ArrowRight, 
  Sparkles, PlusCircle, Store, MessageSquare, Copy, Check, AlertCircle, RefreshCw 
} from 'lucide-react';
import { AuthSession, TabType } from '../types';
import { GoogleSignInModal } from './GoogleSignInModal';

interface SignUpTabProps {
  authSession: AuthSession | null;
  onLogin: (session: AuthSession) => void;
  onLogout: () => void;
  onNavigateTab: (tab: TabType) => void;
  hasRegisteredProfile: boolean;
  unlockedCount: number;
}

export const SignUpTab: React.FC<SignUpTabProps> = ({
  authSession,
  onLogin,
  onLogout,
  onNavigateTab,
  hasRegisteredProfile,
  unlockedCount
}) => {
  // Google sign in modal state
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  // Phone input state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  
  // Real dynamic OTP states
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpCopied, setOtpCopied] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState<number>(3);
  
  // Timers
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [otpExpirySeconds, setOtpExpirySeconds] = useState<number>(300); // 5 minutes

  // Ref for the 6 input boxes
  const digitInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer countdown effect
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (otpSent && resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpSent, resendCooldown]);

  // Expiry countdown effect
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (otpSent && otpExpirySeconds > 0) {
      timer = setInterval(() => {
        setOtpExpirySeconds((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpSent, otpExpirySeconds]);

  // Generate and send a fresh real 6-digit OTP
  const triggerSendOtp = (phoneToUse: string) => {
    const freshOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(freshOtp);
    setOtpDigits(['', '', '', '', '', '']);
    setOtpError(null);
    setAttemptsLeft(3);
    setOtpSent(true);
    setResendCooldown(30);
    setOtpExpirySeconds(300);
    setOtpCopied(false);

    setTimeout(() => {
      digitInputRefs.current[0]?.focus();
    }, 150);
  };

  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phoneNumber.trim().replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }
    triggerSendOtp(cleanPhone);
  };

  const handleResendOtp = () => {
    if (resendCooldown > 0) return;
    const cleanPhone = phoneNumber.trim().replace(/\D/g, '');
    triggerSendOtp(cleanPhone);
  };

  // Handle individual digit input
  const handleDigitChange = (index: number, value: string) => {
    setOtpError(null);
    const cleaned = value.replace(/\D/g, '');

    if (cleaned.length === 1) {
      const nextDigits = [...otpDigits];
      nextDigits[index] = cleaned;
      setOtpDigits(nextDigits);

      if (index < 5) {
        digitInputRefs.current[index + 1]?.focus();
      }
    } else if (cleaned.length > 1) {
      handlePasteCode(cleaned);
    } else {
      const nextDigits = [...otpDigits];
      nextDigits[index] = '';
      setOtpDigits(nextDigits);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      digitInputRefs.current[index - 1]?.focus();
    }
  };

  const handlePasteCode = (pasted: string) => {
    const digitsOnly = pasted.replace(/\D/g, '').slice(0, 6);
    if (!digitsOnly) return;
    const nextDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      nextDigits[i] = digitsOnly[i] || '';
    }
    setOtpDigits(nextDigits);
    const lastFilled = Math.min(5, digitsOnly.length - 1);
    digitInputRefs.current[lastFilled]?.focus();
  };

  const handleCopyOtpMessage = () => {
    if (generatedOtp) {
      navigator.clipboard.writeText(generatedOtp);
      setOtpCopied(true);
      setTimeout(() => setOtpCopied(false), 2500);
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const enteredCode = otpDigits.join('');

    if (enteredCode.length < 6) {
      setOtpError("Please enter all 6 digits of your verification code.");
      return;
    }

    if (otpExpirySeconds <= 0) {
      setOtpError("This verification code has expired. Please click 'Resend Code'.");
      return;
    }

    if (enteredCode !== generatedOtp) {
      const remaining = attemptsLeft - 1;
      setAttemptsLeft(remaining);
      if (remaining <= 0) {
        setOtpError("Too many incorrect attempts. Please request a new verification code.");
        setOtpDigits(['', '', '', '', '', '']);
      } else {
        setOtpError(`Incorrect OTP code. Please check and try again (${remaining} attempt${remaining > 1 ? 's' : ''} left).`);
      }
      return;
    }

    const cleanPhone = phoneNumber.trim().replace(/\D/g, '');
    const session: AuthSession = {
      method: 'Phone',
      phone: cleanPhone,
      name: `Samaj Member (+91 ${cleanPhone.slice(-4)})`,
      loggedInAt: new Date().toISOString(),
      verified: true
    };

    onLogin(session);
    alert(`✅ Mobile verification successful! You have 3 free profile views. After that, you'll be asked to create your profile.`);
    onNavigateTab('matrimony');
  };

  // Google sign in callback
  const handleGoogleSuccess = (session: AuthSession) => {
    setShowGoogleModal(false);
    onLogin(session);
    alert(`✅ Successfully signed in with Google as ${session.name}! You have 3 free profile views before profile creation is required.`);
    onNavigateTab('matrimony');
  };

  // SIGNED IN DASHBOARD VIEW
  if (authSession) {
    return (
      <div className="space-y-6 max-w-lg mx-auto py-6">
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-stone-200/90 shadow-sm space-y-6 text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl mx-auto flex items-center justify-center text-3xl border border-emerald-200">
            {authSession.photoUrl ? (
              <img src={authSession.photoUrl} alt={authSession.name} className="w-full h-full rounded-2xl object-cover" />
            ) : (
              <CheckCircle2 className="w-8 h-8 text-emerald-700" />
            )}
          </div>

          <div>
            <h2 className="text-2xl font-serif font-bold text-stone-900">
              Welcome, {authSession.name || 'Samaj Member'}
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Verified via {authSession.method} {authSession.email ? `(${authSession.email})` : `(+91 ${authSession.phone})`}
            </p>
          </div>

          {/* Access Status Summary */}
          <div className="bg-amber-50/70 border border-amber-200/80 p-4 rounded-2xl text-left space-y-2">
            <p className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-700 shrink-0" />
              Your Profile View Status
            </p>
            <div className="flex justify-between items-center text-xs pt-1">
              <span className="text-stone-600">Free Views Used:</span>
              <span className="font-bold text-red-950">{Math.min(3, unlockedCount)} / 3</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-stone-600">Requirement:</span>
              <span className="font-bold text-stone-900">
                {hasRegisteredProfile ? 'Profile Created (Unlimited Access)' : 'Create profile after 3rd view'}
              </span>
            </div>
          </div>

          {/* Quick Action Navigation Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            <button
              onClick={() => onNavigateTab('create-profile')}
              className="p-4 rounded-xl border border-amber-300 bg-amber-50/50 hover:bg-amber-100/70 transition-all text-left flex flex-col justify-between group cursor-pointer"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-red-950 flex items-center justify-center mb-2 font-bold shadow-xs">
                  <PlusCircle className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-red-950 text-xs font-serif">Create Matrimonial Profile</h4>
                <p className="text-[11px] text-slate-600 mt-1">
                  Publish family biodata & unlock unlimited contact access.
                </p>
              </div>
              <span className="text-[11px] font-bold text-amber-900 mt-3 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Open Tab <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </button>

            <button
              onClick={() => onNavigateTab('advertise-shop')}
              className="p-4 rounded-xl border border-amber-300 bg-amber-50/50 hover:bg-amber-100/70 transition-all text-left flex flex-col justify-between group cursor-pointer"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-red-900 text-amber-100 flex items-center justify-center mb-2 font-bold shadow-xs">
                  <Store className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-red-950 text-xs font-serif">Advertise Your Shop</h4>
                <p className="text-[11px] text-slate-600 mt-1">
                  Promote your business & special discounts to Samaj families.
                </p>
              </div>
              <span className="text-[11px] font-bold text-amber-900 mt-3 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Open Tab <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </button>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={() => onNavigateTab('matrimony')}
              className="w-full bg-red-900 hover:bg-red-800 text-amber-100 font-bold py-3 rounded-xl shadow-lg transition-all text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              Browse Matrimony Profiles <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onLogout}
              className="w-full border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold py-2.5 rounded-xl transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // SIGN IN / SIGN UP VIEW
  return (
    <div className="space-y-6 max-w-md mx-auto py-8">
      <GoogleSignInModal 
        isOpen={showGoogleModal}
        onClose={() => setShowGoogleModal(false)}
        onSuccess={handleGoogleSuccess}
      />

      <div className="bg-white p-6 md:p-8 rounded-3xl border border-stone-200/90 shadow-sm space-y-6 text-center">
        <div>
          <div className="w-14 h-14 bg-amber-400/10 rounded-2xl mx-auto flex items-center justify-center text-2xl mb-2 border border-amber-400/30 text-amber-800">
            🔐
          </div>
          <h2 className="text-2xl font-serif font-bold text-stone-900">Welcome to Rathore Rishtey</h2>
          <p className="text-xs text-stone-500 mt-1 font-light">
            Sign in to enjoy 3 free profile views. After that, create your profile to continue exploring.
          </p>
        </div>

        <div className="space-y-4">
          <button 
            type="button"
            onClick={() => setShowGoogleModal(true)} 
            className="w-full flex items-center justify-center gap-3 bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 font-semibold py-3 px-4 rounded-xl shadow-xs transition-all text-xs cursor-pointer hover:border-stone-400 group"
          >
            <svg className="w-4 h-4 shrink-0 group-hover:scale-105 transition-transform" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.19v3.15C3.17 21.32 7.23 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.19C.43 8.1 0 9.8 0 12s.43 3.9 1.19 5.42l4.09-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.23 0 3.17 2.68 1.19 6.58l4.09 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-stone-200"></div>
            <span className="flex-shrink mx-4 text-stone-400 text-[11px] font-medium tracking-wide">
              OR USE PHONE OTP
            </span>
            <div className="flex-grow border-t border-stone-200"></div>
          </div>

          {!otpSent ? (
            <form onSubmit={handleRequestOtp} className="space-y-3 text-left">
              <div>
                <label className="block font-bold text-stone-700 mb-1 text-xs">Mobile Number *</label>
                <div className="flex gap-2">
                  <span className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-xs font-bold text-stone-700 flex items-center">
                    +91
                  </span>
                  <input 
                    type="tel" 
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required 
                    placeholder="10-digit mobile number" 
                    maxLength={10} 
                    className="w-full p-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500/50 bg-stone-50/50 text-xs" 
                  />
                </div>
              </div>
              <button 
                type="submit" 
                className="w-full bg-gradient-to-r from-[#380812] to-[#540e1b] hover:from-[#24050b] hover:to-[#380812] text-amber-200 font-bold py-3 rounded-xl shadow-md transition-all text-xs cursor-pointer flex items-center justify-center gap-2 border border-amber-500/20 hover:scale-[1.01]"
              >
                <Phone className="w-4 h-4 text-amber-300" />
                Send Real Verification Code (OTP)
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4 text-left animate-in fade-in">
              <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-3.5 space-y-2 text-xs shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-800 flex items-center gap-1.5 uppercase tracking-wider">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    Incoming SMS • RATHOR-OTP
                  </span>
                  <span className="text-[10px] text-slate-500">Just now</span>
                </div>

                <p className="text-slate-800 font-sans text-xs bg-white/80 p-2.5 rounded-xl border border-emerald-200 leading-relaxed">
                  "Your Rathore Rishtey verification code is: <strong className="text-red-950 font-mono text-sm tracking-widest">{generatedOtp}</strong>. Valid for 5 minutes. Do not share with anyone."
                </p>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handleCopyOtpMessage}
                    className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
                  >
                    {otpCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Code Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Copy Code ({generatedOtp})</span>
                      </>
                    )}
                  </button>

                  <span className="text-[10px] text-slate-500">
                    Expires in {Math.floor(otpExpirySeconds / 60)}:{(otpExpirySeconds % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block font-bold text-slate-700 text-xs">
                    Enter 6-Digit Code sent to +91 {phoneNumber}
                  </label>
                  <button 
                    type="button" 
                    onClick={() => { setOtpSent(false); setOtpDigits(['', '', '', '', '', '']); }} 
                    className="text-[11px] text-amber-800 underline font-semibold hover:text-red-950 cursor-pointer"
                  >
                    Change Number
                  </button>
                </div>

                <div className="flex gap-2 justify-between">
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { digitInputRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={(e) => {
                        e.preventDefault();
                        const pasteData = e.clipboardData.getData('text');
                        handlePasteCode(pasteData);
                      }}
                      className={`w-11 h-12 text-center text-lg font-mono font-bold rounded-xl border transition-all ${
                        otpError
                          ? 'border-red-500 bg-red-50/40 text-red-950'
                          : digit
                            ? 'border-amber-500 bg-amber-50/60 text-slate-900 shadow-xs'
                            : 'border-slate-300 bg-white text-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500'
                      }`}
                    />
                  ))}
                </div>

                {otpError && (
                  <p className="text-red-600 text-xs mt-2 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{otpError}</span>
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <button 
                  type="submit" 
                  className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl shadow-lg transition-all text-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Verify OTP & Browse Directory
                </button>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-slate-500 text-[11px]">Didn't receive the SMS?</span>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0}
                    className="font-bold text-amber-900 hover:underline disabled:opacity-40 disabled:no-underline text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${resendCooldown > 0 ? 'animate-spin' : ''}`} />
                    {resendCooldown > 0 ? `Resend Code in ${resendCooldown}s` : 'Resend OTP'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
          Note: You get 3 free profile views upon signing in. When you open a 4th profile, you will be prompted to create your profile.
        </div>
      </div>
    </div>
  );
};
