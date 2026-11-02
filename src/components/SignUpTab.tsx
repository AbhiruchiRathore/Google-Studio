import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, User, Phone, LogOut, ArrowRight, Sparkles, PlusCircle, Store } from 'lucide-react';
import { AuthSession, TabType } from '../types';

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
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  const handleGoogleSignIn = () => {
    const session: AuthSession = {
      method: 'Google',
      name: 'Google User',
      loggedInAt: new Date().toISOString()
    };
    onLogin(session);
    alert("✅ Successfully signed in with Google! You can now access the 'Create Profile' and 'Advertise Business' tabs in the top navigation bar.");
    onNavigateTab('matrimony');
  };

  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phoneNumber.trim().replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }
    setOtpSent(true);
    setOtpCode('123456'); // prefill simulated code for user convenience
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 4) {
      alert("Please enter the verification code.");
      return;
    }

    const session: AuthSession = {
      method: 'Phone',
      phone: phoneNumber.trim(),
      loggedInAt: new Date().toISOString()
    };
    onLogin(session);
    alert(`✅ OTP verified for +91 ${phoneNumber}! The 'Create Profile' and 'Advertise Business' tabs are now unlocked in your navigation bar.`);
    onNavigateTab('matrimony');
  };

  if (authSession) {
    return (
      <div className="space-y-6 max-w-lg mx-auto py-6">
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-amber-200 shadow-xl space-y-6 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full mx-auto flex items-center justify-center text-3xl border border-emerald-300">
            <CheckCircle2 className="w-8 h-8 text-emerald-700" />
          </div>

          <div>
            <h2 className="text-2xl font-serif font-bold text-red-950">Welcome to Your Samaj Account</h2>
            <p className="text-xs text-slate-600 mt-1">
              Signed in via {authSession.method} {authSession.phone ? `(+91 ${authSession.phone})` : ''}
            </p>
          </div>

          {/* Member navigation unlocked announcement */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 p-4 rounded-xl text-left space-y-1.5">
            <p className="text-xs font-bold text-red-950 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              Member Tabs Unlocked in Navigation
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              You can now see and open <strong className="text-red-900">Create Profile</strong> and <strong className="text-red-900">Advertise Business</strong> directly from the top navigation bar.
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
                <h4 className="font-bold text-red-950 text-xs font-serif">Advertise Your Business</h4>
                <p className="text-[11px] text-slate-600 mt-1">
                  Promote your shop & special discounts to Samaj families.
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
                {hasRegisteredProfile ? 'Active Contributor' : 'Standard Member'}
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

  return (
    <div className="space-y-6 max-w-md mx-auto py-8">
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-amber-200 shadow-xl space-y-6 text-center">
        <div>
          <div className="w-14 h-14 bg-amber-100 rounded-full mx-auto flex items-center justify-center text-2xl mb-2 border border-amber-300">
            🔐
          </div>
          <h2 className="text-2xl font-serif font-bold text-red-950">Welcome to Rathore Rishtey</h2>
          <p className="text-xs text-slate-600 mt-1">
            Sign in to access all community features, including creating your profile and advertising your business.
          </p>
        </div>

        <div className="space-y-3">
          {/* Google Sign Up / Sign In Button */}
          <button 
            type="button"
            onClick={handleGoogleSignIn} 
            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold py-3 px-4 rounded-xl shadow-xs transition-all text-xs cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.19v3.15C3.17 21.32 7.23 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.19C.43 8.1 0 9.8 0 12s.43 3.9 1.19 5.42l4.09-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.23 0 3.17 2.68 1.19 6.58l4.09 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            Continue with Google
          </button>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-slate-400 text-[11px] font-medium tracking-wide">
              OR USE PHONE NUMBER
            </span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Phone Number Sign Up */}
          {!otpSent ? (
            <form onSubmit={handleRequestOtp} className="space-y-3 text-left">
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-xs">Mobile Number *</label>
                <div className="flex gap-2">
                  <span className="bg-amber-50 border border-amber-300 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 flex items-center">
                    +91
                  </span>
                  <input 
                    type="tel" 
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required 
                    placeholder="10-digit mobile number" 
                    maxLength={10} 
                    className="w-full p-2.5 border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 bg-amber-50/30 text-xs" 
                  />
                </div>
              </div>
              <button 
                type="submit" 
                className="w-full bg-red-900 hover:bg-red-800 text-amber-100 font-bold py-3 rounded-xl shadow-lg transition-all text-xs cursor-pointer"
              >
                Get Verification Code (OTP)
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-3 text-left">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block font-bold text-slate-700 text-xs">Enter Verification Code</label>
                  <button 
                    type="button" 
                    onClick={() => setOtpSent(false)} 
                    className="text-[11px] text-amber-800 underline font-semibold"
                  >
                    Change Number
                  </button>
                </div>
                <input 
                  type="text" 
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  required 
                  placeholder="6-digit OTP code" 
                  maxLength={6} 
                  className="w-full p-2.5 border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 bg-amber-50/30 text-xs text-center font-mono text-sm tracking-widest" 
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Demo code <strong className="text-red-900">123456</strong> pre-filled for instant verification.
                </p>
              </div>
              <button 
                type="submit" 
                className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl shadow-lg transition-all text-xs cursor-pointer"
              >
                Verify & Sign In
              </button>
            </form>
          )}
        </div>

        <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
          Note: After signing in, you will be able to see the <strong>Create Profile</strong> and <strong>Advertise Business</strong> tabs in the navigation bar.
        </div>
      </div>
    </div>
  );
};
