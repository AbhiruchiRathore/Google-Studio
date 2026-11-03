import React, { useState, useEffect } from 'react';
import { LogOut, CheckCircle2 } from 'lucide-react';
import { AuthSession, TabType } from '../types';
import { GoogleSignInModal } from './GoogleSignInModal';
import { auth } from '../firebase';
import { GoogleAuthProvider, signInWithPopup, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

interface SignUpTabProps {
  authSession: AuthSession | null;
  onLogin: (session: AuthSession) => void;
  onLogout: () => void;
  onNavigateTab: (tab: TabType) => void;
  hasRegisteredProfile?: boolean;
  unlockedCount?: number;
}

export default function SignUpTab({
  authSession,
  onLogin,
  onLogout,
  onNavigateTab,
}: SignUpTabProps) {
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  // Setup invisible reCAPTCHA for Firebase Phone Auth
  useEffect(() => {
    if (!(window as any).recaptchaVerifier) {
      try {
        (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {}
        });
      } catch (err) {
        console.error("Recaptcha initialization error:", err);
      }
    }
  }, []);

  // Request Real Firebase SMS OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phoneNumber.trim().replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }

    setLoading(true);
    setOtpError(null);

    const formattedPhoneNumber = `+91${cleanPhone}`;
    const appVerifier = (window as any).recaptchaVerifier;

    try {
      const confirmation = await signInWithPhoneNumber(auth, formattedPhoneNumber, appVerifier);
      setConfirmationResult(confirmation);
      setOtpSent(true);
    } catch (error: any) {
      console.error("SMS OTP Error:", error);
      setOtpError(error.message || "Failed to send SMS OTP. Check phone number or Firebase setup.");
      if (appVerifier && (window as any).grecaptcha) {
        appVerifier.render().then((widgetId: any) => (window as any).grecaptcha.reset(widgetId));
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP digit input box navigation
  const handleOtpInput = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    const newOtp = [...otpCode];
    newOtp[index] = value;
    setOtpCode(newOtp);

    // Auto-advance focus to next box
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  // Verify Real Firebase Code
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = otpCode.join('');
    if (fullCode.length < 6) {
      setOtpError("Please enter all 6 digits.");
      return;
    }

    setLoading(true);
    setOtpError(null);

    try {
      const result = await confirmationResult.confirm(fullCode);
      const user = result.user;

      const session: AuthSession = {
        method: 'Phone',
        phone: user.phoneNumber || phoneNumber,
        name: `Samaj Member (${user.phoneNumber?.slice(-4) || 'User'})`,
        loggedInAt: new Date().toISOString(),
        verified: true
      };

      onLogin(session);
      onNavigateTab('matrimony');
    } catch (error: any) {
      console.error("OTP Verification Error:", error);
      setOtpError("Invalid verification code. Please check your SMS and try again.");
    } finally {
      setLoading(false);
    }
  };

  // Real Google Sign-In
  const handleRealGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const session: AuthSession = {
        method: 'Google',
        name: user.displayName || 'Google User',
        email: user.email || '',
        photoUrl: user.photoURL || '',
        loggedInAt: new Date().toISOString(),
        verified: user.emailVerified
      };

      setShowGoogleModal(false);
      onLogin(session);
      onNavigateTab('matrimony');
    } catch (error: any) {
      console.error("Google Sign-In Error:", error.message);
    }
  };

  if (authSession) {
    return (
      <div className="space-y-6 max-w-lg mx-auto py-6 px-4">
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-stone-200/90 shadow-sm space-y-6 text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl mx-auto flex items-center justify-center text-3xl border border-emerald-200 overflow-hidden shadow-xs">
            {authSession.photoUrl ? (
              <img src={authSession.photoUrl} alt={authSession.name} referrerPolicy="no-referrer" className="w-full h-full rounded-2xl object-cover" />
            ) : (
              <CheckCircle2 className="w-8 h-8 text-emerald-700" />
            )}
          </div>
          <div>
            <h2 className="text-2xl font-serif font-bold text-stone-900">Welcome, {authSession.name || 'Samaj Member'}</h2>
            <p className="text-xs text-stone-500 mt-1">Verified via {authSession.method}</p>
          </div>
          <button onClick={onLogout} className="w-full border border-stone-300 hover:bg-stone-50 text-stone-700 font-semibold py-3 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-md mx-auto py-8 px-4">
      <GoogleSignInModal isOpen={showGoogleModal} onClose={() => setShowGoogleModal(false)} onSuccess={(session) => { onLogin(session); onNavigateTab('matrimony'); }} />
      <div id="recaptcha-container"></div>

      <div className="bg-white p-6 md:p-8 rounded-3xl border border-stone-200/90 shadow-sm space-y-6 text-center">
        <div>
          <h2 className="text-2xl font-serif font-bold text-stone-900">Welcome to Rathore Rishtey</h2>
          <p className="text-xs text-stone-500 mt-1 font-light">Sign in to view matrimonial biodatas and member options.</p>
        </div>

        <div className="space-y-5">
          {/* Google Sign-In Button with Official Brand Logo */}
          <button 
            type="button" 
            onClick={handleRealGoogleSignIn} 
            className="w-full flex items-center justify-center gap-3 bg-white border border-stone-300 hover:bg-stone-50/80 active:bg-stone-100 text-stone-700 font-semibold py-3.5 px-4 rounded-xl shadow-2xs hover:shadow-xs transition-all text-xs cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-stone-200"></div>
            <span className="flex-shrink mx-4 text-stone-400 text-[11px] font-medium tracking-wide">OR USE PHONE OTP</span>
            <div className="flex-grow border-t border-stone-200"></div>
          </div>

          {!otpSent ? (
            <form onSubmit={handleRequestOtp} className="space-y-3.5 text-left">
              <div>
                <label className="block font-bold text-stone-700 mb-1.5 text-xs">Mobile Number *</label>
                <div className="flex gap-2">
                  <span className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-xs font-bold text-stone-700 flex items-center shadow-2xs">+91</span>
                  <input 
                    type="tel" 
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required 
                    placeholder="10-digit mobile number" 
                    maxLength={10} 
                    className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50/50 text-xs focus:bg-white focus:border-stone-400 focus:outline-none transition-all" 
                  />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-[#380812] hover:bg-[#4a0b18] text-amber-200 font-bold py-3.5 rounded-xl text-xs cursor-pointer flex items-center justify-center gap-2 shadow-sm transition-all">
                {loading ? 'Sending Real SMS...' : 'Send SMS Verification Code (OTP)'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4 text-left">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-stone-700">Enter 6-Digit Code sent to +91 {phoneNumber}</span>
                <button type="button" onClick={() => { setOtpSent(false); setOtpCode(['','','','','','']); }} className="text-amber-800 hover:text-amber-900 underline font-semibold">Change Number</button>
              </div>

              <div className="flex justify-between gap-2">
                {otpCode.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-input-${index}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpInput(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-11 h-12 text-center text-lg font-bold border border-stone-300 rounded-xl focus:border-stone-800 focus:ring-1 focus:ring-stone-800 focus:outline-none transition-all"
                  />
                ))}
              </div>

              {otpError && <p className="text-red-600 text-xs font-semibold">{otpError}</p>}

              <button type="submit" disabled={loading} className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3.5 rounded-xl text-xs cursor-pointer shadow-sm transition-all">
                {loading ? 'Verifying...' : 'Verify OTP & Access Directory'}
