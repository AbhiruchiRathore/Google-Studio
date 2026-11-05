import React, { useState, useEffect } from 'react';
import { 
  X, Check, Shield, AlertCircle, ArrowLeft, ExternalLink, 
  Loader2, Eye, EyeOff, Lock, KeyRound 
} from 'lucide-react';
import { AuthSession } from '../types';

interface GoogleSignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (session: AuthSession) => void;
}

export const GoogleSignInModal: React.FC<GoogleSignInModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  // Step 1: Account selection, Step 2: Password verification, Step 3: Consent, Step 4: Authorizing
  const [step, setStep] = useState<'choose' | 'password' | 'consent' | 'custom_email' | 'authorizing'>('choose');
  const [selectedAccount, setSelectedAccount] = useState<{
    name: string;
    email: string;
    photo: string;
  }>({
    name: 'Abhiruchi Rathore',
    email: 'abhiruchirathore97@gmail.com',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80'
  });

  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  
  // Password verification states
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [resetMessage, setResetMessage] = useState('');

  // Reset to initial step and clear password when opened
  useEffect(() => {
    if (isOpen) {
      setStep('choose');
      setPassword('');
      setPasswordError('');
      setShowPassword(false);
      setResetMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectDefaultAccount = () => {
    setSelectedAccount({
      name: 'Abhiruchi Rathore',
      email: 'abhiruchirathore97@gmail.com',
      photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80'
    });
    setPassword('');
    setPasswordError('');
    setResetMessage('');
    setStep('password');
  };

  const handleCustomAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail) return;
    const derivedName = customName.trim() || customEmail.split('@')[0];
    setSelectedAccount({
      name: derivedName,
      email: customEmail.trim(),
      photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
    });
    setPassword('');
    setPasswordError('');
    setResetMessage('');
    setStep('password');
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setPasswordError("Please enter your password.");
      return;
    }
    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }

    const emailKey = selectedAccount.email.trim().toLowerCase();
    try {
      const stored = localStorage.getItem('samaj_account_passwords');
      const passwords: Record<string, string> = stored ? JSON.parse(stored) : {};
      
      // If a password was previously saved for this account, verify it strictly
      if (passwords[emailKey]) {
        if (passwords[emailKey] !== password) {
          setPasswordError("Incorrect password. Please try again or click Reset Password.");
          return;
        }
      } else {
        // Save the password for this account so subsequent logins require it
        passwords[emailKey] = password;
        localStorage.setItem('samaj_account_passwords', JSON.stringify(passwords));
      }
    } catch (err) {
      console.error("Error verifying password:", err);
    }

    setPasswordError('');
    setStep('consent');
  };

  const handleForgotPassword = () => {
    try {
      const stored = localStorage.getItem('samaj_account_passwords');
      const passwords: Record<string, string> = stored ? JSON.parse(stored) : {};
      const emailKey = selectedAccount.email.trim().toLowerCase();
      delete passwords[emailKey];
      localStorage.setItem('samaj_account_passwords', JSON.stringify(passwords));
      setPassword('');
      setPasswordError('');
      setResetMessage("Password reset. Please enter a new password to secure your account.");
    } catch (e) {
      console.error(e);
    }
  };

  const handleGrantPermission = () => {
    setStep('authorizing');
    setTimeout(() => {
      const session: AuthSession = {
        method: 'Google',
        name: selectedAccount.name,
        email: selectedAccount.email,
        photoUrl: selectedAccount.photo,
        loggedInAt: new Date().toISOString(),
        verified: true
      };
      onSuccess(session);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 relative overflow-hidden font-sans my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Google Header Bar */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.19v3.15C3.17 21.32 7.23 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.19C.43 8.1 0 9.8 0 12s.43 3.9 1.19 5.42l4.09-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.23 0 3.17 2.68 1.19 6.58l4.09 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            <span className="font-semibold text-xs text-slate-700 tracking-tight">
              Sign in with Google
            </span>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-700 p-1 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {step === 'choose' && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h3 className="text-lg font-bold text-slate-900">Choose an account</h3>
                <p className="text-xs text-slate-500">to continue to <strong className="text-red-950 font-serif">Rathore Rishtey</strong></p>
              </div>

              {/* Account list */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={handleSelectDefaultAccount}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/30 transition-all text-left cursor-pointer group"
                >
                  <img 
                    src={selectedAccount.photo} 
                    alt={selectedAccount.name} 
                    className="w-10 h-10 rounded-full object-cover border border-slate-300" 
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate group-hover:text-red-950">
                      {selectedAccount.name}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {selectedAccount.email}
                    </p>
                  </div>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                    Current
                  </span>
                </button>

                <button
                  onClick={() => setStep('custom_email')}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl border border-dashed border-slate-300 hover:bg-slate-50 transition-all text-left cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-xs">
                    +
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700">Use another Google account</p>
                    <p className="text-[11px] text-slate-400">Sign in with custom Gmail ID</p>
                  </div>
                </button>
              </div>

              <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 text-center leading-relaxed">
                To continue, Google will share your name, email address, and profile picture with Rathore Rishtey.
              </div>
            </div>
          )}

          {step === 'custom_email' && (
            <form onSubmit={handleCustomAccountSubmit} className="space-y-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStep('choose')}
                  className="text-slate-500 hover:text-slate-800 p-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h3 className="text-sm font-bold text-slate-900">Sign in with Google Account</h3>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Your Full Name</label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g. Abhiruchi Rathore"
                    required
                    className="w-full p-2.5 border rounded-xl border-slate-300 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Gmail / Google Email</label>
                  <input
                    type="email"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="user@gmail.com"
                    required
                    className="w-full p-2.5 border rounded-xl border-slate-300 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('choose')}
                  className="flex-1 py-2.5 border border-slate-300 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow"
                >
                  Next
                </button>
              </div>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="text-center space-y-2">
                {/* Account badge */}
                <button
                  type="button" 
                  onClick={() => setStep('choose')}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer text-left mx-auto"
                  title="Click to switch account"
                >
                  <img src={selectedAccount.photo} alt={selectedAccount.name} className="w-5 h-5 rounded-full object-cover" />
                  <span className="text-xs font-semibold text-slate-700 max-w-[180px] truncate">{selectedAccount.email}</span>
                  <ArrowLeft className="w-3 h-3 text-slate-400 rotate-90" />
                </button>

                <div>
                  <h3 className="text-xl font-bold text-slate-900">Enter your password</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    To continue to <strong className="text-red-950 font-serif">Rathore Rishtey</strong>, first verify your identity.
                  </p>
                </div>
              </div>

              {resetMessage && (
                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0 text-blue-600" />
                  <span>{resetMessage}</span>
                </div>
              )}

              <div className="space-y-3 pt-1">
                <div className="space-y-1 text-left">
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setPasswordError('');
                      }}
                      placeholder="Enter your password"
                      required
                      autoFocus
                      className="w-full p-3 pr-10 border rounded-xl border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {passwordError && (
                    <div className="text-red-600 text-xs flex items-center gap-1.5 pt-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{passwordError}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-blue-600 hover:underline font-medium text-[11px] cursor-pointer"
                  >
                    Forgot password?
                  </button>

                  <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer text-[11px]">
                    <input
                      type="checkbox"
                      checked={showPassword}
                      onChange={(e) => setShowPassword(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Show password</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('choose')}
                  className="flex-1 py-2.5 border border-slate-300 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-50 transition-colors"
                >
                  Change Account
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-bold text-xs shadow transition-colors cursor-pointer"
                >
                  Next
                </button>
              </div>
            </form>
          )}

          {step === 'consent' && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-full mx-auto overflow-hidden border-2 border-slate-200 mb-2">
                  <img src={selectedAccount.photo} alt={selectedAccount.name} className="w-full h-full object-cover" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Rathore Rishtey wants access to your Google Account
                </h3>
                <p className="text-xs text-blue-600 font-medium">{selectedAccount.email}</p>
              </div>

              {/* Scopes & Permissions Requested */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3 text-xs">
                <p className="font-bold text-slate-800">This will allow Rathore Rishtey to:</p>
                
                <div className="flex items-start gap-2.5 text-slate-700">
                  <div className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3" />
                  </div>
                  <div>
                    <strong className="block text-slate-800">See your personal info (name, profile picture)</strong>
                    <span className="text-[11px] text-slate-500">Allows automatic verification of your Rathore Samaj member identity.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 text-slate-700">
                  <div className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3" />
                  </div>
                  <div>
                    <strong className="block text-slate-800">See your primary Google Account email address</strong>
                    <span className="text-[11px] text-slate-500">Used for login authentication and account recovery notifications.</span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 space-y-1">
                <p>
                  You can review or revoke permissions anytime in your Google Account Security settings.
                </p>
              </div>

              {/* Action Buttons: Cancel vs Allow */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-slate-700 hover:bg-slate-100 rounded-xl font-bold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleGrantPermission}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  Allow & Connect
                </button>
              </div>
            </div>
          )}

          {step === 'authorizing' && (
            <div className="py-10 text-center space-y-4">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto" />
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Authorizing Google Connection...</h4>
                <p className="text-xs text-slate-500 mt-1">Verifying account credentials for {selectedAccount.email}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
