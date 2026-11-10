import React, { useState } from 'react';
import { 
  LogOut, CheckCircle2, Copy, Check, ExternalLink, 
  AlertTriangle, RefreshCw, HelpCircle,
  User, Lock, Eye, EyeOff, Phone, UserPlus, LogIn,
  AlertCircle, ShieldCheck
} from 'lucide-react';
import { AuthSession, TabType, UserAccount } from '../types';
import { GoogleSignInModal } from './GoogleSignInModal';
import { auth } from '../firebase';
import { GoogleAuthProvider, signInWithRedirect, signInWithPopup } from 'firebase/auth';
import { sanitizePhoneInput, validatePhoneNumber, validateStrongPassword } from '../utils/validation';
import { useLanguage } from '../context/LanguageContext';

interface SignUpTabProps {
  authSession: AuthSession | null;
  onLogin: (session: AuthSession) => void;
  onLogout: () => void;
  onNavigateTab: (tab: TabType) => void;
  hasRegisteredProfile?: boolean;
  unlockedCount?: number;
}

// Initial seeded accounts so existing testing accounts work out-of-the-box
const INITIAL_ACCOUNTS: UserAccount[] = [
  {
    id: 'user_admin_demo',
    username: 'abhiruchi97',
    fullName: 'Abhiruchi Rathore',
    password: 'Abhiruchi@123',
    phone: '9826012345',
    email: 'abhiruchirathore97@gmail.com',
    gotra: 'Indruke',
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'user_member_demo',
    username: 'rathore_member',
    fullName: 'Rathore Samaj Member',
    password: 'Member@123',
    phone: '9820011223',
    gotra: 'Pindoria',
    createdAt: '2026-01-01T00:00:00.000Z'
  }
];

/**
 * Helper to check if a Google account is already logged in on the phone/device
 */
export function getExistingDeviceGoogleSession(): AuthSession | null {
  if (auth.currentUser) {
    return {
      method: 'Google',
      name: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'Google User',
      email: auth.currentUser.email || '',
      photoUrl: auth.currentUser.photoURL || '',
      loggedInAt: new Date().toISOString(),
      verified: auth.currentUser.emailVerified
    };
  }
  try {
    const raw = localStorage.getItem('device_google_account');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.email) {
        return {
          method: 'Google',
          name: parsed.name || parsed.email.split('@')[0],
          email: parsed.email,
          photoUrl: parsed.photoUrl || '',
          loggedInAt: new Date().toISOString(),
          verified: true
        };
      }
    }
  } catch {
    // ignore storage errors
  }
  return null;
}

/**
 * Authentication Method 1: Desktop Browser
 * Signs in directly without forcing account-picker or password if Google session is already active on device;
 * otherwise Google prompts for email & password.
 */
export const signInWithDesktopBrowser = async (
  onSuccess?: (session: AuthSession) => void
): Promise<AuthSession | undefined> => {
  if (auth.currentUser) {
    const existingSession: AuthSession = {
      method: 'Google',
      name: auth.currentUser.displayName || 'Google User',
      email: auth.currentUser.email || '',
      photoUrl: auth.currentUser.photoURL || '',
      loggedInAt: new Date().toISOString(),
      verified: auth.currentUser.emailVerified
    };
    if (onSuccess) onSuccess(existingSession);
    return existingSession;
  }

  const provider = new GoogleAuthProvider();
  provider.addScope('profile');
  provider.addScope('email');

  try {
    const result = await signInWithPopup(auth, provider);
    if (result?.user) {
      const session: AuthSession = {
        method: 'Google',
        name: result.user.displayName || 'Google User',
        email: result.user.email || '',
        photoUrl: result.user.photoURL || '',
        loggedInAt: new Date().toISOString(),
        verified: result.user.emailVerified
      };
      if (onSuccess) {
        onSuccess(session);
      }
      return session;
    }
  } catch (error: any) {
    console.error("Desktop Google Sign-In (Popup) Error:", error?.code, error?.message || error);
    throw error;
  }
};

/**
 * Authentication Method 2: Android APK (WebView)
 * Uses signInWithRedirect() without forcing re-authentication when Google account is already logged in on the phone.
 */
export const signInWithAndroidWebView = async (
  onSuccess?: (session: AuthSession) => void
): Promise<void> => {
  if (auth.currentUser) {
    const existingSession: AuthSession = {
      method: 'Google',
      name: auth.currentUser.displayName || 'Google User',
      email: auth.currentUser.email || '',
      photoUrl: auth.currentUser.photoURL || '',
      loggedInAt: new Date().toISOString(),
      verified: auth.currentUser.emailVerified
    };
    if (onSuccess) onSuccess(existingSession);
    return;
  }

  const provider = new GoogleAuthProvider();
  provider.addScope('profile');
  provider.addScope('email');

  try {
    await signInWithRedirect(auth, provider);
  } catch (error: any) {
    console.error("Android Google Sign-In (Redirect) Error:", error?.message || error);
    throw error;
  }
};

/**
 * Helper to determine whether the app is running in an Android APK (WebView) environment.
 */
export const isAndroidEnvironment = (): boolean => {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isAndroid = /Android/i.test(ua);
  const isWebView = /wv|Version\/[0-9.]+/i.test(ua) || Boolean((window as unknown as { Android?: unknown }).Android);
  return isAndroid || isWebView;
};

export default function SignUpTab({
  authSession,
  onLogin,
  onLogout,
  onNavigateTab,
}: SignUpTabProps) {
  const { lang, t } = useLanguage();
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Authentication Mode: 'login' or 'signup'
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  // Sign Up Form State
  const [signupFullName, setSignupFullName] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPhoneError, setSignupPhoneError] = useState<string | null>(null);
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupSuccessInfo, setSignupSuccessInfo] = useState<{ username: string; fullName: string } | null>(null);

  const passwordValidation = validateStrongPassword(signupPassword, signupUsername);

  // Log In Form State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const deviceGoogleSession = getExistingDeviceGoogleSession();

  // Load registered accounts
  const getStoredAccounts = (): UserAccount[] => {
    try {
      const stored = localStorage.getItem('samaj_user_accounts');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Error reading accounts:", e);
    }
    return INITIAL_ACCOUNTS;
  };

  // Google Sign-In Handler:
  // Logs in directly without password if Google account is already logged in on the phone,
  // otherwise invokes Google OAuth / modal asking for password.
  const handleGoogleSignIn = async () => {
    const existing = getExistingDeviceGoogleSession();
    if (existing) {
      onLogin(existing);
      onNavigateTab('dashboard');
      return;
    }

    if (isAndroidEnvironment()) {
      setIsSigningIn(true);
      try {
        await signInWithAndroidWebView((session) => {
          onLogin(session);
          onNavigateTab('dashboard');
        });
      } catch {
        setShowGoogleModal(true);
      } finally {
        setIsSigningIn(false);
      }
    } else {
      setIsSigningIn(true);
      try {
        await signInWithDesktopBrowser((session) => {
          onLogin(session);
          onNavigateTab('dashboard');
        });
      } catch (error: any) {
        console.warn("Desktop Google Sign-In caught error:", error?.code, error?.message);
        if (
          error?.code === 'auth/unauthorized-domain' ||
          error?.code === 'auth/popup-blocked' ||
          error?.code === 'auth/operation-not-supported-in-this-environment' ||
          error?.message?.includes('authorized domain')
        ) {
          setShowGoogleModal(true);
        } else if (
          error?.code === 'auth/popup-closed-by-user' ||
          error?.code === 'auth/cancelled-popup-request'
        ) {
          // User closed popup intentionally, fall back quietly or offer modal
          setShowGoogleModal(true);
        } else {
          setShowGoogleModal(true);
        }
      } finally {
        setIsSigningIn(false);
      }
    }
  };

  const handleModalSuccess = (session: AuthSession) => {
    setShowGoogleModal(false);
    onLogin(session);
    onNavigateTab('dashboard');
  };

  // Sign Up Handler with strict 10-digit & anti-fake phone validation
  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);
    setSignupPhoneError(null);

    const cleanUsername = signupUsername.trim().toLowerCase();
    const cleanFullName = signupFullName.trim();

    if (!cleanFullName) {
      setSignupError(t('Please enter your full name.', 'कृपया अपना पूरा नाम दर्ज करें।'));
      return;
    }

    if (!cleanUsername || cleanUsername.length < 3) {
      setSignupError(t('Username must be at least 3 characters.', 'यूज़रनेम कम से कम 3 अक्षरों का होना चाहिए।'));
      return;
    }

    // Alphanumeric with underscores allowed
    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      setSignupError(t('Username can only contain letters, numbers, and underscores (_).', 'यूज़रनेम में केवल अक्षर, संख्याएं और अंडरस्कोर (_) हो सकते हैं।'));
      return;
    }

    // Validate mobile number strictly if provided (or if non-empty)
    const phoneCheck = validatePhoneNumber(signupPhone, false);
    if (!phoneCheck.valid) {
      const msg = lang === 'hi' ? (phoneCheck.errorHi || '') : (phoneCheck.errorEn || '');
      setSignupPhoneError(msg);
      setSignupError(msg);
      return;
    }

    const passwordCheck = validateStrongPassword(signupPassword, cleanUsername);
    if (!passwordCheck.valid) {
      setSignupError(lang === 'hi' ? (passwordCheck.errorHi || '') : (passwordCheck.errorEn || ''));
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setSignupError(t('Passwords do not match.', 'पासवर्ड मेल नहीं खाते हैं।'));
      return;
    }

    const accounts = getStoredAccounts();
    const existing = accounts.find(
      acc => acc.username.toLowerCase() === cleanUsername || (phoneCheck.cleaned && acc.phone && acc.phone === phoneCheck.cleaned)
    );

    if (existing) {
      setSignupError(
        t(
          `Username "${cleanUsername}" or mobile number is already registered. Please choose another or log in.`,
          `यूज़रनेम "${cleanUsername}" या मोबाइल नंबर पहले से पंजीकृत है। कृपया दूसरा चुनें या लॉग इन करें।`
        )
      );
      return;
    }

    // Create and save account
    const newAccount: UserAccount = {
      id: `user_${Date.now()}`,
      username: cleanUsername,
      fullName: cleanFullName,
      password: signupPassword,
      phone: phoneCheck.cleaned || undefined,
      createdAt: new Date().toISOString()
    };

    const updated = [newAccount, ...accounts];
    try {
      localStorage.setItem('samaj_user_accounts', JSON.stringify(updated));
    } catch (err) {
      console.error("Error saving account:", err);
    }

    // Set success state
    setSignupSuccessInfo({
      username: cleanUsername,
      fullName: cleanFullName
    });

    // Auto pre-fill login fields
    setLoginIdentifier(cleanUsername);
    setLoginPassword(signupPassword);
    setLoginError(null);

    // Switch view to provide login option as requested
    setAuthMode('login');
  };

  // Log In Handler
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const rawIdentifier = loginIdentifier.trim();
    const identifier = rawIdentifier.toLowerCase();
    const password = loginPassword.trim();

    if (!identifier) {
      setLoginError(t('Please enter your username or mobile number.', 'कृपया अपना यूज़रनेम या मोबाइल नंबर दर्ज करें।'));
      return;
    }

    if (!password) {
      setLoginError(t('Please enter your password.', 'कृपया अपना पासवर्ड दर्ज करें।'));
      return;
    }

    // 1. Check for Admin Credentials (AdminAbhi / Abhiruchi@123)
    if (
      (identifier === 'adminabhi' || rawIdentifier === 'AdminAbhi') &&
      password === 'Abhiruchi@123'
    ) {
      sessionStorage.setItem('samaj_admin_session', 'active');
      const adminSession: AuthSession = {
        method: 'UsernamePassword',
        name: 'Admin Abhiruchi',
        username: 'AdminAbhi',
        loggedInAt: new Date().toISOString(),
        verified: true
      };

      onLogin(adminSession);
      onNavigateTab('admin');
      return;
    }

    const accounts = getStoredAccounts();
    const cleanedPhoneAttempt = sanitizePhoneInput(rawIdentifier);
    const matched = accounts.find(acc => 
      acc.username.toLowerCase() === identifier || 
      (acc.phone && (acc.phone === identifier || (cleanedPhoneAttempt.length === 10 && acc.phone === cleanedPhoneAttempt))) ||
      (acc.email && acc.email.toLowerCase() === identifier)
    );

    if (!matched) {
      setLoginError(t('This username or mobile number is not registered. Please sign up first.', 'यह यूज़रनेम या मोबाइल नंबर पंजीकृत नहीं है। कृपया पहले साइन अप करें।'));
      return;
    }

    if (matched.password !== password) {
      setLoginError(t('Incorrect password. Please verify and try again.', 'गलत पासवर्ड। कृपया जांचें और पुनः प्रयास करें।'));
      return;
    }

    // Successful login
    const session: AuthSession = {
      method: 'UsernamePassword',
      name: matched.fullName || matched.username,
      username: matched.username,
      phone: matched.phone || '',
      email: matched.email || '',
      loggedInAt: new Date().toISOString(),
      verified: true
    };

    onLogin(session);
    onNavigateTab('dashboard');
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
            <h2 className="text-2xl font-serif font-bold text-stone-900">
              {t(`Welcome, ${authSession.name || 'Samaj Member'}`, `स्वागत है, ${authSession.name || 'समाज सदस्य'}`)}
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              {t('Verified via', 'सत्यापित माध्यम:')}{' '}
              {authSession.method === 'UsernamePassword'
                ? t('Username & Password', 'यूज़रनेम और पासवर्ड')
                : authSession.method}
            </p>
            {authSession.username && (
              <p className="text-xs font-mono text-amber-900 bg-amber-50 px-2.5 py-1 rounded-md inline-block mt-2 border border-amber-200">
                @{authSession.username}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => onNavigateTab('dashboard')}
              className="bg-gradient-to-r from-amber-300 to-amber-400 text-[#4c0d1b] font-bold py-2.5 px-3 rounded-xl text-xs shadow-xs hover:brightness-105 cursor-pointer"
            >
              {t('Member Dashboard', 'सदस्य डैशबोर्ड')}
            </button>
            <button
              onClick={() => onNavigateTab('matrimony')}
              className="bg-[#6e1628] hover:bg-[#851834] text-amber-100 font-bold py-2.5 px-3 rounded-xl text-xs shadow-xs cursor-pointer"
            >
              {t('Browse Biodatas', 'बायोडाटा देखें')}
            </button>
          </div>
          <button onClick={onLogout} className="w-full border border-stone-300 hover:bg-stone-50 text-stone-700 font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors">
            <LogOut className="w-4 h-4" /> {t('Sign Out', 'लॉग आउट करें')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-md mx-auto py-8 px-4">
      <GoogleSignInModal isOpen={showGoogleModal} onClose={() => setShowGoogleModal(false)} onSuccess={handleModalSuccess} />

      <div className="bg-white p-6 md:p-8 rounded-3xl border border-stone-200/90 shadow-sm space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-300 to-amber-500 rounded-2xl mx-auto flex items-center justify-center text-[#4c0d1b] font-serif font-bold text-lg border border-amber-200 shadow-xs mb-3">
            RR
          </div>
          <h2 className="text-2xl font-serif font-bold text-stone-900">
            {t('Welcome to Rathore Rishtey', 'राठौड़ रिश्ते में आपका स्वागत है')}
          </h2>
          <p className="text-xs text-stone-500 mt-1 font-light">
            {t('Rathore Rajput Community • Matrimonial & Business Directory', 'राठौड़ राजपूत समाज • वैवाहिक एवं व्यापार डायरेक्टरी')}
          </p>
        </div>

        {/* ========================================================= */}
        {/* SECTION 1: CONTINUE WITH GOOGLE                           */}
        {/* Logs in directly without password if logged in on phone   */}
        {/* ========================================================= */}
        <div className="space-y-2.5">
          <button 
            type="button" 
            onClick={handleGoogleSignIn} 
            disabled={isSigningIn}
            className="w-full flex items-center justify-center gap-3 bg-white border border-stone-300 hover:bg-stone-50/80 active:bg-stone-100 text-stone-700 font-semibold py-3 px-4 rounded-xl shadow-2xs hover:shadow-xs transition-all text-xs cursor-pointer disabled:opacity-60"
          >
            {isSigningIn ? (
              <RefreshCw className="w-4 h-4 animate-spin text-amber-700" />
            ) : (
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
            )}
            <span className="truncate">
              {isSigningIn
                ? t('Connecting to Google...', 'Google से जुड़ रहा है...')
                : deviceGoogleSession
                  ? t(`Continue with Google (${deviceGoogleSession.email})`, `Google के साथ जारी रखें (${deviceGoogleSession.email})`)
                  : t('Continue with Google', 'Google के साथ जारी रखें')}
            </span>
          </button>

          {deviceGoogleSession ? (
            <div className="flex items-center justify-between text-[11px] px-1">
              <span className="text-emerald-700 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {t('Logged in on device — 1-tap without password', 'डिवाइस में लॉग इन — बिना पासवर्ड 1-क्लिक लॉगिन')}
              </span>
              <button
                type="button"
                onClick={() => setShowGoogleModal(true)}
                className="text-stone-500 hover:text-stone-800 underline cursor-pointer"
              >
                {t('Switch account', 'खाता बदलें')}
              </button>
            </div>
          ) : (
            <p className="text-[11px] text-center text-stone-400">
              {t('Logs in directly if already signed in on phone; otherwise asks for password.', 'फ़ोन में पहले से लॉग इन होने पर बिना पासवर्ड प्रवेश, अन्यथा पासवर्ड पूछेगा।')}
            </p>
          )}

          {/* Domain Authorization Diagnostic Panel */}
          {unauthorizedDomain && (
            <div className="bg-amber-50/90 border border-amber-300 rounded-2xl p-4 text-left space-y-3 animate-in fade-in duration-200 text-xs">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-950 text-xs">
                    {t('Firebase Domain Authorization', 'Firebase डोमेन प्रमाणीकरण')}
                  </h4>
                  <p className="text-amber-800 text-[11px] mt-0.5 leading-relaxed">
                    {t(
                      'Add this domain to Firebase Authorized Domains for native popup OAuth.',
                      'पॉपअप OAuth के लिए इस डोमेन को Firebase Authorized Domains में जोड़ें।'
                    )}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-amber-200 p-2.5 flex items-center justify-between gap-2 shadow-2xs">
                <div className="truncate min-w-0">
                  <span className="text-[10px] uppercase font-semibold text-stone-400 block">
                    {t('Domain to add:', 'जोड़ने हेतु डोमेन:')}
                  </span>
                  <code className="text-xs font-mono font-bold text-stone-800 truncate block select-all">
                    {unauthorizedDomain}
                  </code>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(unauthorizedDomain);
                    setCopiedDomain(true);
                    setTimeout(() => setCopiedDomain(false), 2000);
                  }}
                  className="px-2.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-xs font-medium flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                >
                  {copiedDomain ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedDomain ? t('Copied!', 'कॉपी किया!') : t('Copy', 'कॉपी')}</span>
                </button>
              </div>

              <div className="flex gap-2">
                <a
                  href="https://console.firebase.google.com/project/rathore-rishtey/authentication/settings"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-amber-700 hover:bg-amber-800 text-white font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 text-[11px] transition-colors shadow-xs"
                >
                  <span>{t('Firebase Console', 'Firebase कंसोल')}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  type="button"
                  onClick={() => setUnauthorizedDomain(null)}
                  className="px-3 py-2 bg-white border border-amber-200 text-amber-900 rounded-xl text-[11px] font-semibold cursor-pointer"
                >
                  {t('Close', 'बंद करें')}
                </button>
              </div>
            </div>
          )}

          {!unauthorizedDomain && (
            <button
              type="button"
              onClick={() => setUnauthorizedDomain(window.location.hostname)}
              className="text-[11px] text-stone-400 hover:text-stone-600 flex items-center justify-center gap-1 mx-auto transition-colors cursor-pointer"
            >
              <HelpCircle className="w-3 h-3" />
              <span>{t('Need help with Firebase Authorized Domains?', 'Firebase अधिकृत डोमेन के बारे में सहायता चाहिए?')}</span>
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-4">
          <div className="border-t border-stone-200 w-full"></div>
          <span className="bg-white px-3 text-[11px] text-stone-400 uppercase tracking-wider font-semibold absolute">
            {t('OR USE SAMAJ ACCOUNT', 'या समाज खाते का उपयोग करें')}
          </span>
        </div>

        {/* ========================================================= */}
        {/* SECTION 2: SIGN UP / LOG IN TOGGLE TABS                   */}
        {/* ========================================================= */}
        <div className="flex rounded-2xl bg-stone-100 p-1 border border-stone-200">
          <button
            type="button"
            onClick={() => {
              setAuthMode('login');
              setLoginError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              authMode === 'login'
                ? 'bg-white text-[#4c0d1b] shadow-xs border border-stone-200/80 font-bold'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <LogIn className="w-3.5 h-3.5 text-amber-700" />
            <span>{t('Log In', 'लॉग इन')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthMode('signup');
              setSignupError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              authMode === 'signup'
                ? 'bg-white text-[#4c0d1b] shadow-xs border border-stone-200/80 font-bold'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 text-amber-700" />
            <span>{t('Sign Up', 'साइन अप')}</span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* SUCCESS NOTIFICATION AFTER SIGN UP                        */}
        {/* ========================================================= */}
        {signupSuccessInfo && authMode === 'login' && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-left space-y-2 animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-emerald-950 text-xs">
                  {t('🎉 Congratulations! Your account has been created successfully!', '🎉 बधाई हो! आपका खाता सफलतापूर्वक बन गया है!')}
                </h4>
                <p className="text-[11px] text-emerald-800 mt-0.5">
                  {t('Your Username:', 'आपका यूज़रनेम:')}{' '}
                  <strong className="font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-200 text-emerald-900">@{signupSuccessInfo.username}</strong>
                </p>
                <p className="text-[11px] text-emerald-700 mt-1">
                  {t('Enter your password below to Sign In.', 'साइन इन करने के लिए नीचे अपना पासवर्ड दर्ज करें।')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* FORM A: LOG IN WITH USERNAME & PASSWORD                   */}
        {/* ========================================================= */}
        {authMode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4 text-left animate-in fade-in">
            {loginError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-stone-400" />
                <span>{t('Username or Mobile Number', 'यूज़रनेम या मोबाइल नंबर')}</span>
              </label>
              <input
                type="text"
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                placeholder={t('e.g. abhiruchi97 or 9826012345', 'उदा. abhiruchi97 या 9826012345')}
                required
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#851834] bg-stone-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-stone-400" />
                  <span>{t('Password', 'पासवर्ड')}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="text-[11px] text-stone-400 hover:text-stone-600 flex items-center gap-1 cursor-pointer"
                >
                  {showLoginPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showLoginPassword ? t('Hide', 'छिपाएं') : t('Show', 'दिखाएं')}</span>
                </button>
              </label>
              <div className="relative">
                <input
                  type={showLoginPassword ? "text" : "password"}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder={t('Enter your account password', 'अपना पासवर्ड दर्ज करें')}
                  required
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#851834] bg-stone-50/50"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#6e1628] via-[#851834] to-[#6e1628] text-amber-100 hover:text-white font-bold py-3 rounded-xl text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer border border-amber-300/30"
            >
              <LogIn className="w-4 h-4 text-amber-300" />
              <span>{t('Sign In with Password', 'पासवर्ड से साइन इन करें')}</span>
            </button>

            <div className="text-center pt-2">
              <p className="text-xs text-stone-500">
                {t("Don't have an account?", 'क्या आपका खाता नहीं है?')}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setSignupError(null);
                  }}
                  className="text-[#851834] font-bold hover:underline cursor-pointer"
                >
                  {t('Create one now', 'अभी नया बनाएं')}
                </button>
              </p>
            </div>
          </form>
        )}

        {/* ========================================================= */}
        {/* FORM B: SIGN UP WITH USERNAME & PASSWORD                  */}
        {/* ========================================================= */}
        {authMode === 'signup' && (
          <form onSubmit={handleSignupSubmit} className="space-y-3.5 text-left animate-in fade-in">
            {signupError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{signupError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-stone-400" />
                <span>{t('Full Name *', 'पूरा नाम *')}</span>
              </label>
              <input
                type="text"
                value={signupFullName}
                onChange={(e) => setSignupFullName(e.target.value)}
                placeholder={t('e.g. Abhiruchi Rathore', 'उदा. अभिरुचि राठौड़')}
                required
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#851834] bg-stone-50/50"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {t('Username *', 'यूज़रनेम *')}
                </label>
                <input
                  type="text"
                  value={signupUsername}
                  onChange={(e) => setSignupUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="e.g. abhiruchi97"
                  required
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#851834] bg-stone-50/50"
                />
                <span className="text-[10px] text-stone-400">{t('Unique login handle', 'विशिष्ट लॉगिन नाम')}</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-stone-400" />
                  <span>{t('Mobile (10 Digits)', 'मोबाइल (10 अंक)')}</span>
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={signupPhone}
                  onChange={(e) => {
                    const cleaned = sanitizePhoneInput(e.target.value);
                    setSignupPhone(cleaned);
                    if (cleaned.length > 0) {
                      const check = validatePhoneNumber(cleaned, false);
                      setSignupPhoneError(
                        check.valid ? null : (lang === 'hi' ? check.errorHi || null : check.errorEn || null)
                      );
                    } else {
                      setSignupPhoneError(null);
                    }
                  }}
                  placeholder={t('10-digit mobile', '10 अंकों का नंबर')}
                  className={`w-full px-3.5 py-2.5 text-xs rounded-xl border focus:outline-none focus:ring-2 bg-stone-50/50 font-mono ${
                    signupPhoneError
                      ? 'border-rose-400 focus:ring-rose-500'
                      : 'border-stone-300 focus:ring-[#851834]'
                  }`}
                />
                <div className="flex items-center justify-between mt-0.5">
                  <span className={`text-[10px] ${signupPhoneError ? 'text-rose-600 font-medium' : 'text-stone-400'}`}>
                    {signupPhoneError || t('Optional · Starts with 6-9', 'वैकल्पिक · 6-9 से शुरू')}
                  </span>
                  <span className="text-[10px] font-mono text-stone-400">{signupPhone.length}/10</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center justify-between">
                  <span>{t('Password *', 'पासवर्ड *')}</span>
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                    className="text-[10px] text-stone-400 hover:text-stone-600 cursor-pointer"
                  >
                    {showSignupPassword ? t('Hide', 'छिपाएं') : t('Show', 'दिखाएं')}
                  </button>
                </label>
                <input
                  type={showSignupPassword ? "text" : "password"}
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder={t('Strong (e.g. Name@123)', 'मजबूत (उदा. Name@123)')}
                  required
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#851834] bg-stone-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {t('Confirm Password *', 'पासवर्ड की पुष्टि करें *')}
                </label>
                <input
                  type={showSignupPassword ? "text" : "password"}
                  value={signupConfirmPassword}
                  onChange={(e) => setSignupConfirmPassword(e.target.value)}
                  placeholder={t('Re-enter password', 'पासवर्ड पुनः दर्ज करें')}
                  required
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#851834] bg-stone-50/50"
                />
              </div>
            </div>

            {/* Live Strong Password Checklist & Strength Meter */}
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 space-y-2 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-700">
                  {t('Strong Password Rules:', 'मजबूत पासवर्ड नियम:')}
                </span>
                <span className={`font-bold ${
                  passwordValidation.valid
                    ? 'text-emerald-700'
                    : passwordValidation.score >= 3
                      ? 'text-amber-700'
                      : 'text-rose-600'
                }`}>
                  {passwordValidation.valid
                    ? t('Strong ✓', 'मजबूत ✓')
                    : passwordValidation.score >= 3
                      ? t('Medium', 'मध्यम')
                      : t('Weak', 'कमज़ोर')}
                </span>
              </div>

              <div className="grid grid-cols-5 gap-1 h-1.5">
                {[1, 2, 3, 4, 5].map((level) => (
                  <div
                    key={level}
                    className={`rounded-full transition-colors ${
                      passwordValidation.score >= level
                        ? passwordValidation.valid
                          ? 'bg-emerald-500'
                          : passwordValidation.score >= 3
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        : 'bg-stone-200'
                    }`}
                  />
                ))}
              </div>

              <div className="grid grid-cols-2 gap-1 text-[10px]">
                <span className={passwordValidation.checks.minLength ? 'text-emerald-700 font-semibold' : 'text-stone-500'}>
                  {passwordValidation.checks.minLength ? '✓' : '○'} {t('8+ characters', 'कम से कम 8 अक्षर')}
                </span>
                <span className={passwordValidation.checks.hasUpper ? 'text-emerald-700 font-semibold' : 'text-stone-500'}>
                  {passwordValidation.checks.hasUpper ? '✓' : '○'} {t('Uppercase (A–Z)', 'बड़ा अक्षर (A–Z)')}
                </span>
                <span className={passwordValidation.checks.hasLower ? 'text-emerald-700 font-semibold' : 'text-stone-500'}>
                  {passwordValidation.checks.hasLower ? '✓' : '○'} {t('Lowercase (a–z)', 'छोटा अक्षर (a–z)')}
                </span>
                <span className={passwordValidation.checks.hasNumber ? 'text-emerald-700 font-semibold' : 'text-stone-500'}>
                  {passwordValidation.checks.hasNumber ? '✓' : '○'} {t('Number (0–9)', 'अंक (0–9)')}
                </span>
                <span className={`col-span-2 ${passwordValidation.checks.hasSpecial ? 'text-emerald-700 font-semibold' : 'text-stone-500'}`}>
                  {passwordValidation.checks.hasSpecial ? '✓' : '○'} {t('Special symbol (@, #, $, !, %, etc.)', 'विशेष चिह्न (@, #, $, !, % आदि)')}
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-stone-950 font-bold py-3 rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>{t('Create Account', 'खाता बनाएं')}</span>
            </button>

            <div className="text-center pt-2">
              <p className="text-xs text-stone-500">
                {t('Already registered?', 'पहले से पंजीकृत हैं?')}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setLoginError(null);
                  }}
                  className="text-[#851834] font-bold hover:underline cursor-pointer"
                >
                  {t('Log In here', 'यहाँ लॉग इन करें')}
                </button>
              </p>
            </div>
          </form>
        )}

        <div className="border-t border-stone-100 pt-3 text-center">
          <p className="text-[11px] text-stone-400 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t('100% Verified Rathore Rajput Community Platform', '100% सत्यापित राठौड़ राजपूत समाज पोर्टल')}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
