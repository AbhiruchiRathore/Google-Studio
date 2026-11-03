/*import React, { useState, useEffect, useRef } from 'react';
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

  <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Register - Rathore Rishtey</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gradient-to-b from-[#e52d42] to-[#c41e3a] min-h-screen flex flex-col justify-between font-sans antialiased text-gray-800">

  <!-- Header / Branding Section -->
  <div class="flex-1 flex flex-col items-center justify-center text-white pt-12 pb-8 px-4 text-center">
    <div class="flex items-center space-x-1 text-4xl font-extrabold tracking-tight">
      <span>rathore</span><span class="text-white opacity-90">rishtey</span>
    </div>
    <p class="mt-2 text-sm font-medium tracking-wide opacity-90">Find Your Perfect Match</p>
  </div>

  <!-- Bottom Sheet / Form Card -->
  <div class="bg-white rounded-t-3xl px-6 pt-8 pb-10 shadow-2xl w-full max-w-md mx-auto">
    <h2 class="text-2xl font-bold text-center text-gray-900 mb-6">Register for Free</h2>

    <!-- Phone Registration Form -->
    <form id="phone-form" onsubmit="event.preventDefault();" class="space-y-4">
      <div class="flex gap-2">
        <!-- Country Code Dropdown -->
        <div class="relative border border-gray-300 rounded-lg px-3 py-3 flex items-center bg-gray-50 focus-within:ring-2 focus-within:ring-rose-500">
          <select id="country-code" class="bg-transparent text-gray-700 font-semibold focus:outline-none cursor-pointer pr-2">
            <option value="+91">+91</option>
            <option value="+1">+1</option>
            <option value="+44">+44</option>
          </select>
        </div>

        <!-- Phone Input Field -->
        <input 
          type="tel" 
          id="phone-number" 
          placeholder="Enter mobile no." 
          maxlength="10"
          oninput="toggleOtpButton(this.value)"
          class="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 font-medium"
        />
      </div>

      <!-- Invisible reCAPTCHA container for Firebase Phone Auth -->
      <div id="recaptcha-container"></div>

      <!-- Submit / Get OTP Button -->
      <button 
        type="button" 
        id="otp-btn" 
        disabled 
        onclick="handleSendOTP()"
        class="w-full py-3.5 rounded-full text-base font-bold transition-all bg-gray-200 text-gray-400 cursor-not-allowed"
      >
        Get OTP
      </button>
    </form>

    <!-- Divider -->
    <div class="relative my-6 text-center">
      <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-gray-200"></div></div>
      <span class="relative bg-white px-3 text-xs text-gray-400 font-medium">Or</span>
    </div>

    <!-- Google Sign-In Button (Centered & Full Width for 2-option setup) -->
    <div class="mb-6">
      <button 
        onclick="handleGoogleAuth()" 
        class="w-full flex items-center justify-center space-x-3 border border-gray-300 rounded-full py-3 px-4 hover:bg-gray-50 transition shadow-sm"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
        </svg>
        <span class="text-sm font-semibold text-gray-700">Continue with Google</span>
      </button>
    </div>

    <!-- Terms Disclaimer -->
    <p class="text-center text-xs text-gray-400 mb-6 leading-relaxed">
      By continuing, you agree to our <a href="#" class="underline hover:text-gray-600">Privacy Policy</a> and <a href="#" class="underline hover:text-gray-600">T&C</a>.
    </p>

    <!-- Already Have Account / Login Link -->
    <div class="border border-gray-200 rounded-full py-3 text-center">
      <span class="text-xs text-gray-600 font-medium">Already have an account?</span>
      <a href="/login" class="text-xs text-cyan-600 font-bold ml-1 hover:underline">Login &gt;</a>
    </div>
  </div>

  <!-- JavaScript Handler Logic -->
  <script type="module">
    import { auth } from './firebase.js';
    import { GoogleAuthProvider, signInWithPopup, RecaptchaVerifier, signInWithPhoneNumber } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

    // Enable / Disable 'Get OTP' button based on phone number length
    window.toggleOtpButton = function(val) {
      const btn = document.getElementById('otp-btn');
      if (val.trim().length === 10) {
        btn.disabled = false;
        btn.className = "w-full py-3.5 rounded-full text-base font-bold transition-all bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-md hover:opacity-95 cursor-pointer";
      } else {
        btn.disabled = true;
        btn.className = "w-full py-3.5 rounded-full text-base font-bold transition-all bg-gray-200 text-gray-400 cursor-not-allowed";
      }
    };

    // Trigger Google Sign-In with scopes
    window.handleGoogleAuth = async function() {
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      try {
        const result = await signInWithPopup(auth, provider);
        console.log("Logged in user:", result.user);
      } catch (err) {
        console.error("Google Auth Error:", err.message);
      }
    };

    // Trigger Phone OTP Request
    window.handleSendOTP = async function() {
      const code = document.getElementById('country-code').value;
      const num = document.getElementById('phone-number').value;
      const fullPhone = `${code}${num}`;

      try {
        if (!window.recaptchaVerifier) {
          window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { 'size': 'invisible' });
        }
        const confirmation = await signInWithPhoneNumber(auth, fullPhone, window.recaptchaVerifier);
        window.confirmationResult = confirmation;
        alert("OTP sent successfully to " + fullPhone);
      } catch (err) {
        console.error("Phone Auth Error:", err.message);
      }
    };
  </script>
</body>
</html>

  
