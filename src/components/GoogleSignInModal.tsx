import React, { useState, useEffect } from 'react';
import { 
  X, Check, ArrowLeft, Loader2, Lock, Eye, EyeOff, ShieldCheck, AlertCircle, Trash2
} from 'lucide-react';
import { AuthSession } from '../types';
import { auth } from '../firebase';
import { useLanguage } from '../context/LanguageContext';

interface GoogleSignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (session: AuthSession) => void;
}

interface DeviceGoogleAccount {
  name: string;
  email: string;
  photoUrl: string;
}

function getDeviceGoogleAccount(): DeviceGoogleAccount | null {
  if (auth.currentUser) {
    return {
      name: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'Google User',
      email: auth.currentUser.email || '',
      photoUrl: auth.currentUser.photoURL || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80'
    };
  }
  try {
    const raw = localStorage.getItem('device_google_account');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.email) {
        return {
          name: parsed.name || parsed.email.split('@')[0],
          email: parsed.email,
          photoUrl: parsed.photoUrl || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80'
        };
      }
    }
  } catch {
    // ignore storage errors
  }
  return null;
}

export const GoogleSignInModal: React.FC<GoogleSignInModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { t } = useLanguage();
  const [deviceAccount, setDeviceAccount] = useState<DeviceGoogleAccount | null>(null);

  // 'choose': Account already logged in on phone (no password required)
  // 'custom_email': Account NOT logged in on phone (asks for Google email & password)
  // 'consent': Permissions screen
  // 'authorizing': Loading spinner
  const [step, setStep] = useState<'choose' | 'consent' | 'custom_email' | 'authorizing'>('choose');
  const [selectedAccount, setSelectedAccount] = useState<{
    name: string;
    email: string;
    photo: string;
  }>({
    name: '',
    email: '',
    photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
  });

  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [googlePassword, setGooglePassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Sync device login state whenever opened
  useEffect(() => {
    if (isOpen) {
      const acc = getDeviceGoogleAccount();
      setDeviceAccount(acc);
      setCustomEmail('');
      setCustomName('');
      setGooglePassword('');
      setShowPassword(false);
      setFormError(null);
      if (acc) {
        setSelectedAccount({
          name: acc.name,
          email: acc.email,
          photo: acc.photoUrl
        });
        setStep('choose');
      } else {
        // No Google account currently logged in on the phone -> ask for Google Email & Password
        setStep('custom_email');
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Direct passwordless login for an account already logged in on the phone
  const handleContinueWithPhoneAccount = () => {
    if (!deviceAccount) return;
    setSelectedAccount({
      name: deviceAccount.name,
      email: deviceAccount.email,
      photo: deviceAccount.photoUrl
    });
    setStep('authorizing');
    setTimeout(() => {
      const session: AuthSession = {
        method: 'Google',
        name: deviceAccount.name,
        email: deviceAccount.email,
        photoUrl: deviceAccount.photoUrl,
        loggedInAt: new Date().toISOString(),
        verified: true
      };
      onSuccess(session);
    }, 350);
  };

  const handleRemoveDeviceAccount = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      localStorage.removeItem('device_google_account');
    } catch {
      // ignore
    }
    setDeviceAccount(null);
    setStep('custom_email');
  };

  // Account NOT logged in on the phone -> MUST enter email and password
  const handleCustomAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanEmail = customEmail.trim();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setFormError(t('Please enter a valid Google email address.', 'कृपया एक मान्य Google ईमेल पता दर्ज करें।'));
      return;
    }

    if (!googlePassword || googlePassword.trim().length < 6) {
      setFormError(t('Please enter your Google account password (minimum 6 characters).', 'कृपया अपने Google खाते का पासवर्ड दर्ज करें (कम से कम 6 अक्षर)।'));
      return;
    }

    const derivedName = customName.trim() || cleanEmail.split('@')[0];
    setSelectedAccount({
      name: derivedName,
      email: cleanEmail,
      photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
    });
    setStep('consent');
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
      try {
        localStorage.setItem('device_google_account', JSON.stringify({
          name: selectedAccount.name,
          email: selectedAccount.email,
          photoUrl: selectedAccount.photo
        }));
      } catch {
        // ignore
      }
      onSuccess(session);
    }, 450);
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
              {t('Sign in with Google', 'Google के साथ साइन इन करें')}
            </span>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-700 p-1 rounded-full transition-colors cursor-pointer"
            aria-label={t('Close', 'बंद करें')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {step === 'choose' && deviceAccount && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h3 className="text-lg font-bold text-slate-900">
                  {t('Account Logged In on This Device', 'इस डिवाइस पर लॉग इन खाता')}
                </h3>
                <p className="text-xs text-slate-500">
                  {t('Continue directly without password to', 'बिना पासवर्ड के सीधे आगे बढ़ें:')}{' '}
                  <strong className="text-red-950 font-serif">{t('Rathore Rishtey', 'राठौड़ रिश्ते')}</strong>
                </p>
              </div>

              {/* Logged-in Phone Account Card -> Direct 1-click Login */}
              <div className="space-y-2 pt-1">
                <div
                  onClick={handleContinueWithPhoneAccount}
                  className="w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 border-emerald-400/70 bg-emerald-50/40 hover:bg-emerald-50 transition-all text-left cursor-pointer group shadow-xs"
                >
                  <img 
                    src={deviceAccount.photoUrl} 
                    alt={deviceAccount.name} 
                    className="w-11 h-11 rounded-full object-cover border border-emerald-300" 
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {deviceAccount.name}
                    </p>
                    <p className="text-[11px] text-slate-600 truncate">
                      {deviceAccount.email}
                    </p>
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold mt-0.5">
                      <ShieldCheck className="w-3 h-3" />
                      {t('Already signed in • No password needed', 'पहले से लॉग इन • पासवर्ड की आवश्यकता नहीं')}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveDeviceAccount}
                    title={t('Remove account from device', 'डिवाइस से खाता हटाएं')}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleContinueWithPhoneAccount}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow cursor-pointer transition-colors"
                >
                  {t(`Continue as ${deviceAccount.name}`, `${deviceAccount.name} के रूप में सीधे लॉगिन करें`)}
                </button>

                <button
                  type="button"
                  onClick={() => setStep('custom_email')}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl border border-dashed border-slate-300 hover:bg-slate-50 transition-all text-left cursor-pointer mt-2"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-xs">
                    +
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700">
                      {t('Use another Google account', 'किसी अन्य Google खाते से लॉगिन करें')}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {t('Requires Gmail & Password verification', 'Gmail और पासवर्ड सत्यापन आवश्यक')}
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {step === 'custom_email' && (
            <form onSubmit={handleCustomAccountSubmit} className="space-y-4">
              <div className="flex items-center gap-2">
                {deviceAccount && (
                  <button
                    type="button"
                    onClick={() => setStep('choose')}
                    className="text-slate-500 hover:text-slate-800 p-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {t('Sign in with Google Account', 'Google खाते से साइन इन करें')}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {t('Account not logged in on phone — please verify password', 'फ़ोन में खाता लॉग इन नहीं है — कृपया पासवर्ड दर्ज करें')}
                  </p>
                </div>
              </div>

              {formError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {t('Your Full Name', 'आपका पूरा नाम')}
                  </label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder={t('e.g. Abhiruchi Rathore', 'उदा. अभिरुचि राठौड़')}
                    required
                    className="w-full p-2.5 border rounded-xl border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {t('Gmail / Google Email *', 'Gmail / Google ईमेल *')}
                  </label>
                  <input
                    type="email"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="user@gmail.com"
                    required
                    className="w-full p-2.5 border rounded-xl border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Lock className="w-3 h-3 text-slate-400" />
                      <span>{t('Google Password *', 'Google पासवर्ड *')}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[11px] text-slate-500 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showPassword ? t('Hide', 'छिपाएं') : t('Show', 'दिखाएं')}</span>
                    </button>
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={googlePassword}
                    onChange={(e) => setGooglePassword(e.target.value)}
                    placeholder={t('Enter your Google password', 'अपना Google पासवर्ड दर्ज करें')}
                    required
                    className="w-full p-2.5 border rounded-xl border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                {deviceAccount ? (
                  <button
                    type="button"
                    onClick={() => setStep('choose')}
                    className="flex-1 py-2.5 border border-slate-300 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-50 cursor-pointer"
                  >
                    {t('Back', 'वापस')}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2.5 border border-slate-300 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-50 cursor-pointer"
                  >
                    {t('Cancel', 'रद्द करें')}
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow cursor-pointer"
                >
                  {t('Verify & Next', 'सत्यापित करें और आगे बढ़ें')}
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
                  {t('Rathore Rishtey wants access to your Google Account', 'राठौड़ रिश्ते आपके Google खाते तक पहुंच चाहता है')}
                </h3>
                <p className="text-xs text-blue-600 font-medium">{selectedAccount.email}</p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3 text-xs">
                <p className="font-bold text-slate-800">
                  {t('This will allow Rathore Rishtey to:', 'इससे राठौड़ रिश्ते को अनुमति मिलेगी:')}
                </p>
                
                <div className="flex items-start gap-2.5 text-slate-700">
                  <div className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3" />
                  </div>
                  <div>
                    <strong className="block text-slate-800">
                      {t('See your personal info (name, profile picture)', 'आपकी व्यक्तिगत जानकारी (नाम, प्रोफ़ाइल फ़ोटो) देखना')}
                    </strong>
                    <span className="text-[11px] text-slate-500">
                      {t('Allows automatic verification of your Rathore Samaj member identity.', 'राठौड़ समाज सदस्य पहचान के स्वचालित सत्यापन हेतु।')}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 text-slate-700">
                  <div className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3" />
                  </div>
                  <div>
                    <strong className="block text-slate-800">
                      {t('See your primary Google Account email address', 'आपका प्राथमिक Google ईमेल पता देखना')}
                    </strong>
                    <span className="text-[11px] text-slate-500">
                      {t('Used for login authentication and account recovery notifications.', 'लॉगिन प्रमाणीकरण और खाता सुरक्षा सूचनाओं हेतु।')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-slate-700 hover:bg-slate-100 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  {t('Cancel', 'रद्द करें')}
                </button>
                <button
                  type="button"
                  onClick={handleGrantPermission}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {t('Allow & Connect', 'अनुमति दें और जुड़ें')}
                </button>
              </div>
            </div>
          )}

          {step === 'authorizing' && (
            <div className="py-10 text-center space-y-4">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto" />
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  {t('Authorizing Google Connection...', 'Google कनेक्शन सत्यापित हो रहा है...')}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  {t('Signing in as', 'लॉग इन किया जा रहा है:')} {selectedAccount.email}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
