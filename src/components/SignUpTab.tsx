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
  hasRegisteredProfile: boolean;
  unlockedCount: number;
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
      <div className="space-y-6 max-w-lg mx-auto py-6">
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-stone-200/90 shadow-sm space-y-6 text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl mx-auto flex items-center justify-center text-3xl border border-emerald-200 overflow-hidden">
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
          <button onClick={onLogout} className="w-full border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-md mx-auto py-8">
      <GoogleSignInModal isOpen={showGoogleModal} onClose={() => setShowGoogleModal(false)} onSuccess={(session) => { onLogin(session); onNavigateTab('matrimony'); }} />
      <div id="recaptcha-container"></div>

      <div className="bg-white p-6 md:p-8 rounded-3xl border border-stone-200/90 shadow-sm space-y-6 text-center">
        <div>
          <h2 className="text-2xl font-serif font-bold text-stone-900">Welcome to Rathore Rishtey</h2>
          <p className="text-xs text-stone-500 mt-1 font-light">Sign in to view matrimonial biodatas and member options.</p>
        </div>

        <div className="space-y-4">
          <button type="button" onClick={handleRealGoogleSignIn} className="w-full flex items-center justify-center gap-3 bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 font-semibold py-3 px-4 rounded-xl shadow-xs transition-all text-xs cursor-pointer">
            <span>Continue with Google</span>
          </button>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-stone-200"></div>
            <span className="flex-shrink mx-4 text-stone-400 text-[11px] font-medium">OR USE PHONE OTP</span>
            <div className="flex-grow border-t border-stone-200"></div>
          </div>

          {!otpSent ? (
            <form onSubmit={handleRequestOtp} className="space-y-3 text-left">
              <div>
                <label className="block font-bold text-stone-700 mb-1 text-xs">Mobile Number *</label>
                <div className="flex gap-2">
                  <span className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-xs font-bold text-stone-700 flex items-center">+91</span>
                  <input 
                    type="tel" 
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required 
                    placeholder="10-digit mobile number" 
                    maxLength={10} 
                    className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50/50 text-xs" 
                  />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-[#380812] text-amber-200 font-bold py-3 rounded-xl text-xs cursor-pointer flex items-center justify-center gap-2">
                {loading ? 'Sending Real SMS...' : 'Send SMS Verification Code (OTP)'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4 text-left">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-stone-700">Enter 6-Digit Code sent to +91 {phoneNumber}</span>
                <button type="button" onClick={() => { setOtpSent(false); setOtpCode(['','','','','','']); }} className="text-amber-800 underline font-semibold">Change Number</button>
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
                    className="w-12 h-12 text-center text-xl font-bold border border-stone-300 rounded-xl focus:border-emerald-600 focus:outline-none"
                  />
                ))}
              </div>

              {otpError && <p className="text-red-600 text-xs font-semibold">{otpError}</p>}

              <button type="submit" disabled={loading} className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 rounded-xl text-xs cursor-pointer">
                {loading ? 'Verifying...' : 'Verify OTP & Access Directory'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
