import React, { useState, useEffect, useRef } from 'react';
import { 
  LogOut, CheckCircle2, Copy, Check, ExternalLink, 
  AlertTriangle, RefreshCw,
  User, Lock, Eye, EyeOff, Phone, UserPlus, LogIn,
  AlertCircle, KeyRound, ArrowLeft, Mail, Send
} from 'lucide-react';
import { AuthSession, TabType, UserAccount } from '../types';
import { GoogleSignInModal } from './GoogleSignInModal';
import { auth, secondaryAuth, db, secondaryDb } from '../firebase';
import {
  GoogleAuthProvider,
  signInWithRedirect,
  signInWithPopup,
  sendPasswordResetEmail,
  verifyPasswordResetCode,
  confirmPasswordReset,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';
import { sanitizePhoneInput, validatePhoneNumber, validateStrongPassword } from '../utils/validation';
import { useLanguage } from '../context/LanguageContext';
import { BrandLogo } from './BrandLogo';
import { syncUserProfileToFirestore, lookupEmailByUsernameFromFirestore } from '../utils/firebaseUserSync';

interface SignUpTabProps {
  authSession: AuthSession | null;
  onLogin: (session: AuthSession, redirectTab?: TabType) => void;
  onLogout: () => void;
  onNavigateTab: (tab: TabType) => void;
  onSignupComplete?: () => void;
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
    email: 'member@rathorerishtey.in',
    gotra: 'Pindoria',
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'I2soKGvrx3W4Ei8WyJmlATG9i5h2',
    username: 'playstore_demo',
    fullName: 'Rathore Demo Member',
    password: 'PlayDemo@2026',
    phone: '9893011224',
    email: 'playstore.demo@rathorerishtey.in',
    gender: 'Male',
    createdAt: '2026-11-18T17:42:00.000Z'
  }
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function maskEmailAddress(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  if (local.length <= 2) return `${local[0] || '*'}***@${domain}`;
  return `${local.slice(0, 2)}${'*'.repeat(Math.min(5, Math.max(2, local.length - 2)))}@${domain}`;
}

// Deduplicate verifyPasswordResetCode across React.StrictMode double-mounts
const oobVerificationCache = new Map<string, Promise<string>>();

function verifyOobCodeOnce(code: string): Promise<string> {
  const existing = oobVerificationCache.get(code);
  if (existing) return existing;

  const pending = verifyPasswordResetCode(auth, code).catch((err) => {
    // Allow retries on transient network errors
    if (err?.code === 'auth/network-request-failed') {
      oobVerificationCache.delete(code);
    }
    throw err;
  });
  oobVerificationCache.set(code, pending);
  return pending;
}

function extractPasswordResetParams(): { mode: string | null; oobCode: string | null } {
  if (typeof window === 'undefined') return { mode: null, oobCode: null };
  const searchParams = new URLSearchParams(window.location.search);
  const searchMode = searchParams.get('mode');
  const searchCode = searchParams.get('oobCode');
  if (searchMode === 'resetPassword' && searchCode) {
    return { mode: searchMode, oobCode: searchCode };
  }
  const hashQueryIndex = window.location.hash.indexOf('?');
  if (hashQueryIndex >= 0) {
    const hashParams = new URLSearchParams(window.location.hash.slice(hashQueryIndex + 1));
    const hashMode = hashParams.get('mode');
    const hashCode = hashParams.get('oobCode');
    if (hashMode === 'resetPassword' && hashCode) {
      return { mode: hashMode, oobCode: hashCode };
    }
  }
  return { mode: null, oobCode: null };
}

const RESET_THROTTLE_STORAGE_KEY = 'samaj_reset_last_sent';
const RESET_COOLDOWN_MS = 60_000;

function getRecentResetInfo(email?: string): { email: string; remainingSec: number } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(RESET_THROTTLE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { email?: string; sentAt?: number };
    if (!parsed?.email || typeof parsed.sentAt !== 'number') return null;
    if (email && parsed.email.toLowerCase() !== email.toLowerCase()) return null;
    const elapsed = Date.now() - parsed.sentAt;
    if (elapsed >= RESET_COOLDOWN_MS) return null;
    return {
      email: parsed.email,
      remainingSec: Math.max(1, Math.ceil((RESET_COOLDOWN_MS - elapsed) / 1000))
    };
  } catch {
    return null;
  }
}

function recordResetSent(email: string): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(
      RESET_THROTTLE_STORAGE_KEY,
      JSON.stringify({ email: email.toLowerCase(), sentAt: Date.now() })
    );
  } catch {
    // ignore storage errors
  }
}

function clearResetSentRecord(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(RESET_THROTTLE_STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
}

/**
 * Helper to check if a Google account is already logged in on the phone/device
 */
export function getExistingDeviceGoogleSession(): AuthSession | null {
  if (auth.currentUser && auth.currentUser.providerData.some((p) => p.providerId === 'google.com')) {
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
  if (auth.currentUser && auth.currentUser.providerData.some((p) => p.providerId === 'google.com')) {
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
  if (auth.currentUser && auth.currentUser.providerData.some((p) => p.providerId === 'google.com')) {
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
  onSignupComplete,
}: SignUpTabProps) {
  const { lang, t } = useLanguage();
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [emailProviderDisabled, setEmailProviderDisabled] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const initialResetParams = extractPasswordResetParams();
  const hasInitialResetLink = initialResetParams.mode === 'resetPassword' && Boolean(initialResetParams.oobCode);

  // Authentication Mode: 'login', 'signup', or 'forgot'
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot'>(
    hasInitialResetLink ? 'forgot' : 'login'
  );

  // Sign Up Form State
  const [signupFullName, setSignupFullName] = useState('');
  const [signupGender, setSignupGender] = useState<'Male' | 'Female' | ''>('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPhoneError, setSignupPhoneError] = useState<string | null>(null);
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [signupSuccessInfo, setSignupSuccessInfo] = useState<{ username: string; fullName: string } | null>(null);

  const passwordValidation = validateStrongPassword(signupPassword, signupUsername);

  // Log In Form State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Forgot Password (Email Password Reset Link — sent to email only)
  const [forgotStep, setForgotStep] = useState<'identify' | 'link_sent' | 'reset'>('identify');
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotAccount, setForgotAccount] = useState<UserAccount | null>(null);
  const [forgotTargetEmail, setForgotTargetEmail] = useState('');
  const [forgotDisplayEmail, setForgotDisplayEmail] = useState('');
  const [firebaseOobCode, setFirebaseOobCode] = useState<string | null>(
    hasInitialResetLink ? initialResetParams.oobCode : null
  );
  const [forgotSending, setForgotSending] = useState(false);
  const [forgotResetting, setForgotResetting] = useState(false);
  const [isVerifyingResetLink, setIsVerifyingResetLink] = useState(hasInitialResetLink);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [passwordResetSuccessUser, setPasswordResetSuccessUser] = useState<string | null>(null);

  const signupLockRef = useRef(false);
  const loginLockRef = useRef(false);
  const forgotSendLockRef = useRef(false);
  const forgotResetLockRef = useRef(false);

  const forgotPasswordValidation = validateStrongPassword(forgotNewPassword, forgotAccount?.username);

  const deviceGoogleSession = getExistingDeviceGoogleSession();

  // Load registered accounts (always keeping permanent demo/seeded accounts resolvable)
  const getStoredAccounts = (): UserAccount[] => {
    try {
      const stored = localStorage.getItem('samaj_user_accounts');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingUsernames = new Set(
            parsed.map((acc: UserAccount) => (acc.username || '').toLowerCase())
          );
          const missingDefaults = INITIAL_ACCOUNTS.filter(
            (def) => !existingUsernames.has(def.username.toLowerCase())
          );
          return missingDefaults.length > 0 ? [...parsed, ...missingDefaults] : parsed;
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
    if (auth.currentUser && auth.currentUser.providerData.some((p) => p.providerId === 'google.com')) {
      const activeSession: AuthSession = {
        method: 'Google',
        name: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'Google User',
        email: auth.currentUser.email || '',
        photoUrl: auth.currentUser.photoURL || '',
        loggedInAt: new Date().toISOString(),
        verified: auth.currentUser.emailVerified
      };
      void syncUserProfileToFirestore(db, auth, auth.currentUser, {
        provider: 'google.com'
      });
      onLogin(activeSession, 'dashboard');
      return;
    }

    if (isAndroidEnvironment()) {
      setIsSigningIn(true);
      try {
        await signInWithAndroidWebView((session) => {
          onLogin(session, 'dashboard');
        });
      } catch (error: any) {
        if (error?.code === 'auth/unauthorized-domain' && typeof window !== 'undefined') {
          setUnauthorizedDomain(window.location.hostname);
        }
        setShowGoogleModal(true);
      } finally {
        setIsSigningIn(false);
      }
    } else {
      setIsSigningIn(true);
      try {
        await signInWithDesktopBrowser((session) => {
          onLogin(session, 'dashboard');
        });
      } catch (error: any) {
        console.warn("Desktop Google Sign-In caught error:", error?.code, error?.message);
        if (
          error?.code === 'auth/unauthorized-domain' ||
          error?.message?.includes('authorized domain')
        ) {
          if (typeof window !== 'undefined') {
            setUnauthorizedDomain(window.location.hostname);
          }
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
    onLogin(session, 'dashboard');
  };

  const clearResetQueryParamsFromUrl = () => {
    if (typeof window === 'undefined') return;
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('resetToken');
      url.searchParams.delete('mode');
      url.searchParams.delete('oobCode');
      url.searchParams.delete('apiKey');
      url.searchParams.delete('lang');
      url.searchParams.delete('continueUrl');
      const cleanHash = (url.hash || '#signup').split('?')[0] || '#signup';
      const cleaned = `${url.pathname}${url.search}${cleanHash}`;
      window.history.replaceState(window.history.state, '', cleaned);
    } catch {
      // ignore history errors
    }
  };

  // Cooldown timer for Resend Reset Link (prevents accidental invalidation of the active email link)
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setTimeout(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [resendCooldown]);

  // Detect Firebase email password reset callback (?mode=resetPassword&oobCode=...)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const { mode: modeParam, oobCode: oobCodeParam } = extractPasswordResetParams();

    if (modeParam !== 'resetPassword' || !oobCodeParam) return;

    let cancelled = false;
    setAuthMode('forgot');
    setForgotError(null);
    setIsVerifyingResetLink(true);

    verifyOobCodeOnce(oobCodeParam)
      .then((verifiedEmail) => {
        if (cancelled) return;
        const accounts = getStoredAccounts();
        const matched = accounts.find(
          (acc) => acc.email && acc.email.toLowerCase() === verifiedEmail.toLowerCase()
        ) || null;
        setForgotAccount(matched);
        setForgotTargetEmail(verifiedEmail);
        setForgotDisplayEmail(verifiedEmail);
        setFirebaseOobCode(oobCodeParam);
        setForgotNewPassword('');
        setForgotConfirmPassword('');
        setForgotStep('reset');
        setIsVerifyingResetLink(false);
      })
      .catch((err: any) => {
        if (cancelled) return;
        const code = err?.code || '';
        setIsVerifyingResetLink(false);
        setForgotStep('identify');
        if (code === 'auth/network-request-failed') {
          setForgotError(
            t(
              'Network error while verifying your reset link. Please check your internet connection and reload.',
              'रीसेट लिंक सत्यापित करते समय नेटवर्क त्रुटि। कृपया अपना इंटरनेट जांचें और पृष्ठ पुनः लोड करें।'
            )
          );
          return;
        }
        if (code === 'auth/operation-not-allowed') {
          setEmailProviderDisabled(true);
          setForgotError(
            t(
              'Email/Password sign-in is currently disabled in Firebase Authentication.',
              'Firebase Authentication में Email/Password साइन-इन अभी बंद है।'
            )
          );
        } else if (code === 'auth/expired-action-code') {
          setForgotError(
            t(
              'This password reset link has expired. Please request a new reset link below.',
              'यह पासवर्ड रीसेट लिंक समाप्त हो चुका है। कृपया नीचे से नया रीसेट लिंक मंगाएं।'
            )
          );
        } else if (code === 'auth/invalid-action-code') {
          setForgotError(
            t(
              'This reset link has already been used or was replaced by a newer email. In Gmail, scroll to the bottom message in the thread or request one fresh link below.',
              'यह रीसेट लिंक पहले ही उपयोग हो चुका है या नए ईमेल द्वारा बदल दिया गया है। Gmail में कृपया थ्रेड के सबसे नीचे (नए) ईमेल का लिंक खोलें या नीचे से नया लिंक मंगाएं।'
            )
          );
        } else {
          setForgotError(
            err?.message ||
              t(
                'Could not verify this reset link. Please request a fresh password reset link below.',
                'इस रीसेट लिंक का सत्यापन नहीं हो सका। कृपया नीचे से नया रीसेट लिंक मंगाएं।'
              )
          );
        }
        clearResetQueryParamsFromUrl();
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const openForgotPasswordFlow = () => {
    setAuthMode('forgot');
    setForgotError(null);
    setLoginError(null);
    setFirebaseOobCode(null);
    setForgotNewPassword('');
    setForgotConfirmPassword('');

    const recent = getRecentResetInfo();
    if (recent) {
      setForgotTargetEmail(recent.email);
      setForgotDisplayEmail(recent.email);
      setResendCooldown(recent.remainingSec);
      setForgotStep('link_sent');
      return;
    }

    setForgotStep('identify');
    setForgotIdentifier(loginIdentifier.trim());
    setForgotAccount(null);
    setForgotTargetEmail('');
    setForgotDisplayEmail('');
    setResendCooldown(0);
  };

  const dispatchEmailResetLink = async (rawInput: string) => {
    if (forgotSendLockRef.current || forgotSending) return;
    setForgotError(null);
    setEmailProviderDisabled(false);

    const trimmed = rawInput.trim();
    const lower = trimmed.toLowerCase();

    if (!lower) {
      setForgotError(
        t(
          'Please enter your registered email address or username.',
          'कृपया अपना पंजीकृत ईमेल पता या यूज़रनेम दर्ज करें।'
        )
      );
      return;
    }

    if (lower === 'adminabhi') {
      setForgotError(
        t(
          'Admin portal credentials are managed by Samaj Technical Committee.',
          'एडमिन पासवर्ड तकनीकी समिति द्वारा प्रबंधित किया जाता है।'
        )
      );
      return;
    }

    forgotSendLockRef.current = true;
    setForgotSending(true);

    try {
      const accounts = getStoredAccounts();
      const cleanedPhone = sanitizePhoneInput(trimmed);
      const matched = accounts.find(
        (acc) =>
          (acc.email && acc.email.toLowerCase() === lower) ||
          acc.username.toLowerCase() === lower ||
          (acc.phone && (acc.phone === lower || (cleanedPhone.length === 10 && acc.phone === cleanedPhone)))
      ) || null;

      const isDirectEmail = EMAIL_REGEX.test(lower);
      let resolvedEmail = '';

      if (matched?.email) {
        resolvedEmail = matched.email.trim().toLowerCase();
      } else if (isDirectEmail) {
        resolvedEmail = lower;
      } else {
        const firestoreLookup = await lookupEmailByUsernameFromFirestore(auth, lower);
        if (firestoreLookup?.email) {
          resolvedEmail = firestoreLookup.email;
        } else if (matched && !matched.email) {
          setForgotError(
            t(
              'No email address is saved on this username. Please enter your email address directly.',
              'इस यूज़रनेम में ईमेल पता सहेजा नहीं गया है। कृपया सीधे अपना ईमेल पता दर्ज करें।'
            )
          );
          return;
        } else {
          setForgotError(
            t(
              'Enter a valid email address (e.g. name@gmail.com) or a registered username.',
              'कृपया एक मान्य ईमेल पता (जैसे name@gmail.com) या पंजीकृत यूज़रनेम दर्ज करें।'
            )
          );
          return;
        }
      }

      // Guard against sending a duplicate email within 60s for the same address,
      // which would immediately invalidate the first email link while it is in transit.
      const recentForSameEmail = getRecentResetInfo(resolvedEmail);
      if (recentForSameEmail) {
        setForgotAccount(matched);
        setForgotTargetEmail(resolvedEmail);
        setForgotDisplayEmail(isDirectEmail ? resolvedEmail : maskEmailAddress(resolvedEmail));
        setFirebaseOobCode(null);
        setResendCooldown(recentForSameEmail.remainingSec);
        setForgotStep('link_sent');
        return;
      }

      try {
        if (typeof window !== 'undefined') {
          try {
            await sendPasswordResetEmail(auth, resolvedEmail, {
              url: `${window.location.origin}${window.location.pathname}#signup`,
              handleCodeInApp: false
            });
          } catch (continueErr: any) {
            if (
              continueErr?.code === 'auth/unauthorized-continue-uri' ||
              continueErr?.code === 'auth/invalid-continue-uri'
            ) {
              await sendPasswordResetEmail(auth, resolvedEmail);
            } else {
              throw continueErr;
            }
          }
        } else {
          await sendPasswordResetEmail(auth, resolvedEmail);
        }
      } catch (err: any) {
        const code = err?.code || '';
        if (code === 'auth/operation-not-allowed') {
          setEmailProviderDisabled(true);
          setForgotError(
            t(
              'Email/Password sign-in is disabled in Firebase Console. Enable Email/Password under Authentication → Sign-in method.',
              'Firebase Console में Email/Password साइन-इन बंद है। कृपया Authentication → Sign-in method में इसे चालू करें।'
            )
          );
          return;
        }
        if (code === 'auth/invalid-email') {
          setForgotError(t('Please enter a valid email address.', 'कृपया एक मान्य ईमेल पता दर्ज करें।'));
          return;
        }
        if (code === 'auth/user-not-found') {
          setForgotError(
            t(
              'No account found with this email address. Please check your email or sign up first.',
              'इस ईमेल पते से कोई खाता नहीं मिला। कृपया जांचें या नया खाता बनाएं।'
            )
          );
          return;
        }
        if (code === 'auth/too-many-requests') {
          setForgotError(
            t(
              'Too many reset requests sent. Please wait a few minutes and check your inbox.',
              'बहुत अधिक अनुरोध भेजे गए हैं। कृपया कुछ मिनट प्रतीक्षा करें और अपना इनबॉक्स जांचें।'
            )
          );
          return;
        }
        if (code === 'auth/network-request-failed') {
          setForgotError(
            t(
              'Network error while sending the reset email. Please check your internet connection.',
              'रीसेट ईमेल भेजने में नेटवर्क त्रुटि। कृपया अपना इंटरनेट कनेक्शन जांचें।'
            )
          );
          return;
        }
        setForgotError(
          err?.message ||
            t(
              'Could not send password reset email right now. Please try again shortly.',
              'अभी पासवर्ड रीसेट ईमेल नहीं भेजा जा सका। कृपया थोड़ी देर बाद पुनः प्रयास करें।'
            )
        );
        return;
      }

      recordResetSent(resolvedEmail);
      setForgotAccount(matched);
      setForgotTargetEmail(resolvedEmail);
      setForgotDisplayEmail(isDirectEmail ? resolvedEmail : maskEmailAddress(resolvedEmail));
      setFirebaseOobCode(null);
      setResendCooldown(60);
      setForgotStep('link_sent');
    } finally {
      forgotSendLockRef.current = false;
      setForgotSending(false);
    }
  };

  const handleForgotSendResetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    await dispatchEmailResetLink(forgotIdentifier);
  };

  const handleForgotResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (forgotResetLockRef.current || forgotResetting) return;
    setForgotError(null);

    if (!forgotTargetEmail && !forgotAccount) {
      setForgotStep('identify');
      return;
    }

    const check = validateStrongPassword(forgotNewPassword, forgotAccount?.username);
    if (!check.valid) {
      setForgotError(lang === 'hi' ? (check.errorHi || '') : (check.errorEn || ''));
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError(t('Passwords do not match.', 'दोनों पासवर्ड मेल नहीं खाते हैं।'));
      return;
    }

    if (firebaseOobCode) {
      forgotResetLockRef.current = true;
      setForgotResetting(true);
      try {
        await confirmPasswordReset(auth, firebaseOobCode, forgotNewPassword);
        oobVerificationCache.delete(firebaseOobCode);
      } catch (err: any) {
        forgotResetLockRef.current = false;
        setForgotResetting(false);
        if (err?.code === 'auth/expired-action-code') {
          setForgotError(
            t(
              'Your reset link has expired. Please request a fresh password reset email.',
              'आपका रीसेट लिंक समाप्त हो चुका है। कृपया नया पासवर्ड रीसेट ईमेल मंगाएं।'
            )
          );
        } else if (err?.code === 'auth/invalid-action-code') {
          setForgotError(
            t(
              'This reset link has already been used or was superseded by a newer link. Please check your latest email or request a new link.',
              'यह रीसेट लिंक पहले ही उपयोग हो चुका है या नया लिंक आ चुका है। कृपया सबसे नया ईमेल जांचें या नया लिंक मंगाएं।'
            )
          );
        } else if (err?.code === 'auth/network-request-failed') {
          setForgotError(
            t(
              'Network error while updating password. Please check your connection and try again.',
              'पासवर्ड अपडेट करते समय नेटवर्क त्रुटि। कृपया कनेक्शन जांच कर पुनः प्रयास करें।'
            )
          );
        } else {
          setForgotError(
            err?.message ||
              t('Reset link expired or invalid. Please request a new reset link.', 'रीसेट लिंक समाप्त हो गया है। कृपया नया लिंक प्राप्त करें।')
          );
        }
        return;
      } finally {
        forgotResetLockRef.current = false;
        setForgotResetting(false);
      }
    }

    // Update local Samaj account password if account exists
    const accounts = getStoredAccounts();
    const hasLocalMatch = accounts.some(
      (acc) =>
        (forgotAccount && (acc.id === forgotAccount.id || acc.username.toLowerCase() === forgotAccount.username.toLowerCase())) ||
        (acc.email && forgotTargetEmail && acc.email.toLowerCase() === forgotTargetEmail.toLowerCase())
    );

    if (hasLocalMatch) {
      const updatedAccounts = accounts.map((acc) => {
        const isMatch =
          (forgotAccount && (acc.id === forgotAccount.id || acc.username.toLowerCase() === forgotAccount.username.toLowerCase())) ||
          (acc.email && forgotTargetEmail && acc.email.toLowerCase() === forgotTargetEmail.toLowerCase());
        return isMatch ? { ...acc, password: forgotNewPassword } : acc;
      });
      try {
        localStorage.setItem('samaj_user_accounts', JSON.stringify(updatedAccounts));
      } catch (err) {
        console.error('Error saving reset password:', err);
      }
    }

    clearResetQueryParamsFromUrl();
    clearResetSentRecord();

    const identifierForLogin = forgotAccount?.username || forgotTargetEmail;
    setLoginIdentifier(identifierForLogin);
    setLoginPassword('');
    setSignupSuccessInfo(null);
    setPasswordResetSuccessUser(identifierForLogin);
    setFirebaseOobCode(null);
    setAuthMode('login');
    setLoginError(null);
  };

  // Sign Up Handler with strict email, 10-digit phone & mandatory Firebase Authentication + Firestore sync
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signupLockRef.current || isCreatingAccount) return;

    setSignupError(null);
    setSignupPhoneError(null);
    setEmailProviderDisabled(false);

    const cleanUsername = signupUsername.trim().toLowerCase();
    const cleanFullName = signupFullName.trim();
    const cleanEmail = signupEmail.trim().toLowerCase();

    if (!cleanFullName) {
      setSignupError(t('Please enter your full name.', 'कृपया अपना पूरा नाम दर्ज करें।'));
      return;
    }

    if (!signupGender) {
      setSignupError(
        t(
          'Please select candidate gender (Male or Female) so relevant opposite-gender matches are shown.',
          'कृपया प्रत्याशी का लिंग (पुरुष या महिला) चुनें ताकि उपयुक्त रिश्ते दिखाए जा सकें।'
        )
      );
      return;
    }

    if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
      setSignupError(
        t(
          'Please enter a valid email address (used for Firebase login & password reset links).',
          'कृपया एक मान्य ईमेल पता दर्ज करें (Firebase लॉगिन और पासवर्ड रीसेट लिंक के लिए आवश्यक)।'
        )
      );
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
      acc =>
        acc.username.toLowerCase() === cleanUsername ||
        (cleanEmail && acc.email && acc.email.toLowerCase() === cleanEmail) ||
        (phoneCheck.cleaned && acc.phone && acc.phone === phoneCheck.cleaned)
    );

    if (existing) {
      setSignupError(
        t(
          `Username "${cleanUsername}", email, or mobile number is already registered. Please choose another or log in.`,
          `यूज़रनेम "${cleanUsername}", ईमेल या मोबाइल नंबर पहले से पंजीकृत है। कृपया दूसरा चुनें या लॉग इन करें।`
        )
      );
      return;
    }

    signupLockRef.current = true;
    setIsCreatingAccount(true);

    const withAuthTimeout = <T,>(promise: Promise<T>, timeoutMs = 15000): Promise<T> => {
      return new Promise<T>((resolve, reject) => {
        const timer = window.setTimeout(() => {
          const timeoutErr = new Error('Network request timed out') as Error & { code?: string };
          timeoutErr.code = 'auth/network-request-failed';
          reject(timeoutErr);
        }, timeoutMs);
        promise.then(
          (val) => {
            window.clearTimeout(timer);
            resolve(val);
          },
          (err) => {
            window.clearTimeout(timer);
            reject(err);
          }
        );
      });
    };

    let firebaseUid = `user_${Date.now()}`;
    try {
      // Check if username already exists in Firestore directory across devices (bounded timeout)
      const existingRemoteUsername = await lookupEmailByUsernameFromFirestore(secondaryAuth, cleanUsername);
      if (existingRemoteUsername && existingRemoteUsername.email !== cleanEmail) {
        setSignupError(
          t(
            `Username "@${cleanUsername}" is already taken. Please choose another username.`,
            `यूज़रनेम "@${cleanUsername}" पहले से उपयोग में है। कृपया दूसरा यूज़रनेम चुनें।`
          )
        );
        return;
      }

      // Create user in Firebase Authentication (appears in Firebase Console -> Authentication -> Users)
      const cred = await withAuthTimeout(
        createUserWithEmailAndPassword(secondaryAuth, cleanEmail, signupPassword),
        15000
      );
      if (cred.user) {
        firebaseUid = cred.user.uid;
        await Promise.race([
          updateProfile(cred.user, { displayName: cleanFullName }).catch(() => {}),
          new Promise<void>((resolve) => window.setTimeout(resolve, 2000))
        ]);
        await syncUserProfileToFirestore(secondaryDb, secondaryAuth, cred.user, {
          username: cleanUsername,
          fullName: cleanFullName,
          phone: phoneCheck.cleaned || '',
          gender: signupGender,
          provider: 'password',
          isNewUser: true
        });
        await Promise.race([
          signOut(secondaryAuth).catch(() => {}),
          new Promise<void>((resolve) => window.setTimeout(resolve, 1000))
        ]);
      }
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/operation-not-allowed') {
        setEmailProviderDisabled(true);
        setSignupError(
          t(
            'Email/Password sign-in is disabled in your Firebase Console. Please enable Email/Password under Authentication → Sign-in method, then click Create Account again.',
            'आपके Firebase Console में Email/Password साइन-इन बंद है। कृपया Authentication → Sign-in method में Email/Password चालू करें और फिर खाता बनाएं।'
          )
        );
      } else if (code === 'auth/email-already-in-use') {
        setSignupError(
          t(
            'This email address is already registered in Firebase. Please log in or use Forgot Password to reset your password.',
            'यह ईमेल पता Firebase में पहले से पंजीकृत है। कृपया लॉग इन करें या पासवर्ड रीसेट करें।'
          )
        );
      } else if (code === 'auth/weak-password') {
        setSignupError(
          t(
            'Password is too weak for Firebase Authentication. Please choose a stronger password.',
            'पासवर्ड बहुत कमज़ोर है। कृपया अधिक मजबूत पासवर्ड चुनें।'
          )
        );
      } else if (code === 'auth/invalid-email') {
        setSignupError(t('Please enter a valid email address.', 'कृपया एक मान्य ईमेल पता दर्ज करें।'));
      } else if (code === 'auth/network-request-failed') {
        setSignupError(
          t(
            'Network error while connecting to Firebase. Please check your internet connection and try again.',
            'Firebase से जुड़ते समय नेटवर्क त्रुटि। कृपया अपना इंटरनेट जांचें और पुनः प्रयास करें।'
          )
        );
      } else {
        setSignupError(
          err?.message ||
            t(
              'Could not create Firebase account right now. Please try again.',
              'अभी Firebase खाता नहीं बनाया जा सका। कृपया पुनः प्रयास करें।'
            )
        );
      }
      return;
    } finally {
      signupLockRef.current = false;
      setIsCreatingAccount(false);
    }

    // Save synced account metadata locally as well
    const newAccount: UserAccount = {
      id: firebaseUid,
      username: cleanUsername,
      fullName: cleanFullName,
      password: signupPassword,
      email: cleanEmail,
      phone: phoneCheck.cleaned || undefined,
      gender: signupGender,
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
    onSignupComplete?.();
  };

  // Log In Handler (authenticates via Firebase Auth primary instance so Signed In & Users stay in sync)
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loginLockRef.current || isLoggingIn) return;

    setLoginError(null);
    setEmailProviderDisabled(false);

    const rawIdentifier = loginIdentifier.trim();
    const identifier = rawIdentifier.toLowerCase();
    const password = loginPassword.trim();

    if (!identifier) {
      setLoginError(t('Please enter your username, email, or mobile number.', 'कृपया अपना यूज़रनेम, ईमेल या मोबाइल नंबर दर्ज करें।'));
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

      onLogin(adminSession, 'admin');
      return;
    }

    loginLockRef.current = true;
    setIsLoggingIn(true);

    try {
      const accounts = getStoredAccounts();
      const cleanedPhoneAttempt = sanitizePhoneInput(rawIdentifier);
      const matched = accounts.find(acc =>
        acc.username.toLowerCase() === identifier ||
        (acc.phone && (acc.phone === identifier || (cleanedPhoneAttempt.length === 10 && acc.phone === cleanedPhoneAttempt))) ||
        (acc.email && acc.email.toLowerCase() === identifier)
      );

      let resolvedUsername = matched?.username;
      let resolvedFullName = matched?.fullName;
      let resolvedPhone = matched?.phone || '';
      let resolvedGender: 'Male' | 'Female' | undefined = matched?.gender;
      let emailCandidate = matched?.email?.trim().toLowerCase() || (EMAIL_REGEX.test(identifier) ? identifier : '');

      // Resolve username -> email via Firestore for cross-device Username ID login
      if (!emailCandidate && !identifier.includes('@')) {
        const firestoreProfile = await lookupEmailByUsernameFromFirestore(auth, identifier);
        if (firestoreProfile?.email) {
          emailCandidate = firestoreProfile.email;
          resolvedUsername = resolvedUsername || firestoreProfile.username;
          resolvedFullName = resolvedFullName || firestoreProfile.fullName;
          resolvedPhone = resolvedPhone || firestoreProfile.phone || '';
          resolvedGender = resolvedGender || firestoreProfile.gender;
        }
      }

      if (emailCandidate) {
        try {
          // Sign in on primary `auth` so Firebase Console updates Signed In timestamp and keeps user session active
          const cred = await signInWithEmailAndPassword(auth, emailCandidate, password);
          const displayName =
            cred.user.displayName ||
            resolvedFullName ||
            resolvedUsername ||
            emailCandidate.split('@')[0];
          const finalUsername = resolvedUsername || emailCandidate.split('@')[0];

          await syncUserProfileToFirestore(db, auth, cred.user, {
            username: finalUsername,
            fullName: displayName,
            phone: resolvedPhone,
            gender: resolvedGender,
            provider: 'password'
          });

          if (matched) {
            const synced = accounts.map((acc) =>
              acc.id === matched.id
                ? { ...acc, id: cred.user.uid, password, gender: resolvedGender || acc.gender }
                : acc
            );
            try {
              localStorage.setItem('samaj_user_accounts', JSON.stringify(synced));
            } catch {
              // ignore
            }
          } else {
            const cacheEntry: UserAccount = {
              id: cred.user.uid,
              username: finalUsername,
              fullName: displayName,
              password,
              email: emailCandidate,
              phone: resolvedPhone || undefined,
              gender: resolvedGender,
              createdAt: new Date().toISOString()
            };
            try {
              localStorage.setItem('samaj_user_accounts', JSON.stringify([cacheEntry, ...accounts]));
            } catch {
              // ignore
            }
          }

          const session: AuthSession = {
            method: 'UsernamePassword',
            name: displayName,
            username: finalUsername,
            phone: resolvedPhone,
            email: emailCandidate,
            gender: resolvedGender,
            loggedInAt: new Date().toISOString(),
            verified: true
          };
          onLogin(session, 'dashboard');
          return;
        } catch (err: any) {
          const code = err?.code || '';

          if (code === 'auth/operation-not-allowed') {
            setEmailProviderDisabled(true);
            setLoginError(
              t(
                'Email/Password sign-in is disabled in Firebase Console. Please enable Authentication → Sign-in method → Email/Password.',
                'Firebase Console में Email/Password साइन-इन बंद है। कृपया Authentication → Sign-in method → Email/Password चालू करें।'
              )
            );
            return;
          }

          // Auto-migrate legacy local-only account into Firebase Auth on matching password
          if (
            (code === 'auth/user-not-found' || code === 'auth/invalid-credential') &&
            matched &&
            matched.password === password
          ) {
            try {
              const createdCred = await createUserWithEmailAndPassword(auth, emailCandidate, password);
              if (createdCred.user) {
                const displayName = matched.fullName || matched.username;
                await updateProfile(createdCred.user, { displayName }).catch(() => {});
                await syncUserProfileToFirestore(db, auth, createdCred.user, {
                  username: matched.username,
                  fullName: displayName,
                  phone: matched.phone || '',
                  gender: matched.gender,
                  provider: 'password',
                  isNewUser: true
                });
                const updatedAccounts = accounts.map((acc) =>
                  acc.id === matched.id ? { ...acc, id: createdCred.user.uid } : acc
                );
                try {
                  localStorage.setItem('samaj_user_accounts', JSON.stringify(updatedAccounts));
                } catch {
                  // ignore
                }
                const session: AuthSession = {
                  method: 'UsernamePassword',
                  name: displayName,
                  username: matched.username,
                  phone: matched.phone || '',
                  email: emailCandidate,
                  gender: matched.gender,
                  loggedInAt: new Date().toISOString(),
                  verified: true
                };
                onLogin(session, 'dashboard');
                return;
              }
            } catch (createErr: any) {
              if (createErr?.code === 'auth/operation-not-allowed') {
                setEmailProviderDisabled(true);
                setLoginError(
                  t(
                    'Email/Password sign-in is disabled in Firebase Console. Please enable it under Authentication → Sign-in method.',
                    'Firebase Console में Email/Password साइन-इन बंद है। कृपया इसे Authentication → Sign-in method में चालू करें।'
                  )
                );
                return;
              }
              if (createErr?.code === 'auth/email-already-in-use') {
                setLoginError(t('Incorrect password. Please verify and try again.', 'गलत पासवर्ड। कृपया जांचें और पुनः प्रयास करें।'));
                return;
              }
            }
          }

          if (code === 'auth/too-many-requests') {
            setLoginError(
              t(
                'Too many failed attempts. Please wait a few minutes or use Forgot Password.',
                'कई गलत प्रयास हुए हैं। कृपया कुछ मिनट प्रतीक्षा करें या पासवर्ड रीसेट करें।'
              )
            );
            return;
          }

          if (code === 'auth/network-request-failed') {
            setLoginError(
              t(
                'Network error while connecting to Firebase. Please check your internet connection.',
                'Firebase से जुड़ते समय नेटवर्क त्रुटि। कृपया इंटरनेट जांचें।'
              )
            );
            return;
          }

          if (code === 'auth/user-not-found' && !matched) {
            setLoginError(
              t(
                'This username, email, or mobile number is not registered. Please sign up first.',
                'यह यूज़रनेम, ईमेल या मोबाइल नंबर पंजीकृत नहीं है। कृपया पहले साइन अप करें।'
              )
            );
            return;
          }

          if (matched || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
            setLoginError(t('Incorrect password or unregistered account. Please verify or sign up first.', 'गलत पासवर्ड या अपंजीकृत खाता। कृपया जांचें या नया खाता बनाएं।'));
            return;
          }
        }
      }

      // Local-only record without any email attached
      if (matched && !emailCandidate && matched.password === password) {
        const session: AuthSession = {
          method: 'UsernamePassword',
          name: matched.fullName || matched.username,
          username: matched.username,
          phone: matched.phone || '',
          email: '',
          loggedInAt: new Date().toISOString(),
          verified: true
        };
        onLogin(session, 'dashboard');
        return;
      }

      if (!matched) {
        setLoginError(t('This username, email, or mobile number is not registered. Please sign up first.', 'यह यूज़रनेम, ईमेल या मोबाइल नंबर पंजीकृत नहीं है। कृपया पहले साइन अप करें।'));
        return;
      }

      setLoginError(t('Incorrect password. Please verify and try again.', 'गलत पासवर्ड। कृपया जांचें और पुनः प्रयास करें।'));
    } finally {
      loginLockRef.current = false;
      setIsLoggingIn(false);
    }
  };

  const isProcessingEmailResetCallback =
    authMode === 'forgot' &&
    (forgotStep === 'reset' || Boolean(firebaseOobCode) || isVerifyingResetLink || Boolean(forgotError));

  if (authSession && !isProcessingEmailResetCallback) {
    return (
      <div className="space-y-6 max-w-lg mx-auto py-3 sm:py-6 px-0 sm:px-4">
        <div className="bg-white p-5 sm:p-8 rounded-3xl border border-stone-200/90 shadow-sm space-y-6 text-center">
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

  const renderPasswordMeter = (password: string, validation: ReturnType<typeof validateStrongPassword>) => {
    if (!password) return null;
    const missing: string[] = [];
    if (!validation.checks.minLength) missing.push(t('8+ chars', '8+ अक्षर'));
    if (!validation.checks.hasUpper) missing.push(t('uppercase', 'बड़ा अक्षर'));
    if (!validation.checks.hasLower) missing.push(t('lowercase', 'छोटा अक्षर'));
    if (!validation.checks.hasNumber) missing.push(t('number', 'अंक'));
    if (!validation.checks.hasSpecial) missing.push(t('symbol (@#$!%)', 'विशेष चिह्न'));

    return (
      <div className="space-y-1.5 pt-0.5">
        <div className="grid grid-cols-5 gap-1 h-1">
          {[1, 2, 3, 4, 5].map((level) => (
            <div
              key={level}
              className={`rounded-full transition-colors ${
                validation.score >= level
                  ? validation.valid
                    ? 'bg-emerald-600'
                    : validation.score >= 3
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  : 'bg-stone-200'
              }`}
            />
          ))}
        </div>
        <div className="flex items-center justify-between gap-2 text-[11px]">
          <span className={validation.valid ? 'text-emerald-700 font-medium' : 'text-stone-500'}>
            {validation.valid
              ? t('Strong password', 'मजबूत पासवर्ड')
              : `${t('Add:', 'जोड़ें:')} ${missing.join(', ')}`}
          </span>
          {validation.valid && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto py-4 sm:py-8 px-1 sm:px-4">
      <GoogleSignInModal isOpen={showGoogleModal} onClose={() => setShowGoogleModal(false)} onSuccess={handleModalSuccess} />

      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200/90 shadow-sm space-y-5">
        <div className="text-center space-y-1.5">
          <div className="flex justify-center">
            <BrandLogo size="md" showText={false} tone="crimson" />
          </div>
          <h2 className="font-logo text-2xl sm:text-3xl font-bold text-[#6e1628] leading-tight">
            {t('Rathore Rishtey', 'राठौड़ रिश्ते')}
          </h2>
          <p className="text-xs text-stone-500">
            {t('Matrimonial & Business Directory', 'वैवाहिक एवं व्यापार डायरेक्टरी')}
          </p>
        </div>

        {/* Google Sign-In */}
        {authMode !== 'forgot' && (
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
              className="w-full flex items-center justify-center gap-2.5 bg-white border border-stone-300 hover:bg-stone-50 active:bg-stone-100 text-stone-800 font-semibold py-2.5 px-4 rounded-xl transition-colors text-xs sm:text-sm cursor-pointer disabled:opacity-60"
            >
              {isSigningIn ? (
                <RefreshCw className="w-4 h-4 animate-spin text-amber-700 shrink-0" />
              ) : (
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
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
                    ? t(`Continue as ${deviceGoogleSession.email}`, `${deviceGoogleSession.email} से जारी रखें`)
                    : t('Continue with Google', 'Google के साथ जारी रखें')}
              </span>
            </button>

            {deviceGoogleSession && (
              <div className="flex items-center justify-end px-1">
                <button
                  type="button"
                  onClick={() => setShowGoogleModal(true)}
                  className="text-[11px] text-stone-500 hover:text-stone-800 underline cursor-pointer"
                >
                  {t('Use a different Google account', 'दूसरा Google खाता चुनें')}
                </button>
              </div>
            )}

            {unauthorizedDomain && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-left space-y-2.5 text-xs">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="font-semibold text-amber-950">
                      {t('Authorize this domain in Firebase Console', 'Firebase Console में यह डोमेन जोड़ें')}
                    </p>
                    <div className="flex items-center justify-between gap-2 bg-white border border-amber-200 rounded-lg px-2.5 py-1.5">
                      <code className="text-[11px] font-mono text-stone-800 truncate select-all">
                        {unauthorizedDomain}
                      </code>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(unauthorizedDomain);
                          setCopiedDomain(true);
                          setTimeout(() => setCopiedDomain(false), 2000);
                        }}
                        className="text-[11px] font-medium text-amber-900 hover:text-amber-700 flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        {copiedDomain ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedDomain ? t('Copied', 'कॉपी') : t('Copy', 'कॉपी')}</span>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <a
                    href="https://console.firebase.google.com/project/rathore-rishtey/authentication/settings"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-semibold text-amber-900 hover:underline flex items-center gap-1"
                  >
                    <span>{t('Open Firebase Console', 'Firebase कंसोल खोलें')}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    type="button"
                    onClick={() => setUnauthorizedDomain(null)}
                    className="text-[11px] text-stone-500 hover:text-stone-800 cursor-pointer"
                  >
                    {t('Dismiss', 'बंद करें')}
                  </button>
                </div>
              </div>
            )}

            <div className="relative flex items-center justify-center py-2">
              <div className="border-t border-stone-200 w-full" />
              <span className="bg-white px-3 text-xs text-stone-400">
                {t('or', 'या')}
              </span>
            </div>

            {/* Clean Log In / Sign Up Switcher */}
            <div className="grid grid-cols-2 rounded-xl bg-stone-100 p-1 gap-1">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setLoginError(null);
                }}
                className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  authMode === 'login'
                    ? 'bg-white text-[#4c0d1b] shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{t('Log In', 'लॉग इन')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setSignupError(null);
                  setPasswordResetSuccessUser(null);
                }}
                className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  authMode === 'signup'
                    ? 'bg-white text-[#4c0d1b] shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{t('Sign Up', 'साइन अप')}</span>
              </button>
            </div>
          </div>
        )}

        {/* Success notices */}
        {passwordResetSuccessUser && authMode === 'login' && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-left flex items-start gap-2.5 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-emerald-950">
                {t('Password updated', 'पासवर्ड बदल गया')}
              </p>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                {t(
                  `Sign in with your new password for ${passwordResetSuccessUser}.`,
                  `${passwordResetSuccessUser} के लिए नए पासवर्ड से साइन इन करें।`
                )}
              </p>
            </div>
          </div>
        )}

        {signupSuccessInfo && authMode === 'login' && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-left flex items-start gap-2.5 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-emerald-950">
                {t('Account created successfully', 'खाता सफलतापूर्वक बन गया')}
              </p>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                {t('Username:', 'यूज़रनेम:')} <span className="font-mono font-semibold">@{signupSuccessInfo.username}</span>
                {' · '}
                {t('Sign in below to continue.', 'आगे बढ़ने के लिए नीचे साइन इन करें।')}
              </p>
            </div>
          </div>
        )}

        {emailProviderDisabled && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-left space-y-2 text-xs">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-amber-950">
                  {t('Enable Email/Password in Firebase', 'Firebase में Email/Password चालू करें')}
                </p>
                <p className="text-[11px] text-amber-900">
                  {t(
                    'Turn on Email/Password under Authentication → Sign-in method in Firebase Console.',
                    'Firebase Console में Authentication → Sign-in method के अंतर्गत Email/Password चालू करें।'
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 pt-0.5">
              <a
                href="https://console.firebase.google.com/project/rathore-rishtey/authentication/providers"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-semibold text-amber-900 hover:underline flex items-center gap-1"
              >
                <span>{t('Open Sign-in Providers', 'Firebase Providers खोलें')}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <button
                type="button"
                onClick={() => setEmailProviderDisabled(false)}
                className="text-[11px] text-stone-500 hover:text-stone-800 cursor-pointer"
              >
                {t('Dismiss', 'बंद करें')}
              </button>
            </div>
          </div>
        )}

        {/* FORM A: LOG IN */}
        {authMode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4 text-left">
            {loginError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                {t('Username, Email, or Mobile', 'यूज़रनेम, ईमेल या मोबाइल')}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder={t('Username, email, or 10-digit mobile', 'यूज़रनेम, ईमेल या मोबाइल नंबर')}
                  required
                  className="w-full pl-9 pr-3.5 py-2.5 text-sm sm:text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#851834] focus:border-transparent bg-white"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-stone-700">
                  {t('Password', 'पासवर्ड')}
                </label>
                <button
                  type="button"
                  onClick={openForgotPasswordFlow}
                  className="text-[11px] font-semibold text-[#851834] hover:underline cursor-pointer"
                >
                  {t('Forgot password?', 'पासवर्ड भूल गए?')}
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder={t('Enter your password', 'अपना पासवर्ड दर्ज करें')}
                  required
                  className="w-full pl-9 pr-10 py-2.5 text-sm sm:text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#851834] focus:border-transparent bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  aria-label={showLoginPassword ? t('Hide password', 'पासवर्ड छिपाएं') : t('Show password', 'पासवर्ड दिखाएं')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-[#6e1628] hover:bg-[#851834] text-white font-semibold py-2.5 px-4 rounded-xl text-xs sm:text-sm shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoggingIn && <RefreshCw className="w-4 h-4 animate-spin" />}
              <span>
                {isLoggingIn ? t('Signing In...', 'साइन इन हो रहा है...') : t('Sign In', 'साइन इन करें')}
              </span>
            </button>
          </form>
        )}

        {/* FORM B: FORGOT PASSWORD */}
        {authMode === 'forgot' && (
          <div className="space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#851834]" />
                <h3 className="text-sm font-bold text-stone-900">
                  {forgotStep === 'reset'
                    ? t('Create New Password', 'नया पासवर्ड बनाएं')
                    : t('Reset Password', 'पासवर्ड रीसेट करें')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  clearResetQueryParamsFromUrl();
                  setAuthMode('login');
                  setForgotError(null);
                }}
                className="text-xs font-medium text-stone-500 hover:text-stone-800 flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t('Back', 'वापस')}</span>
              </button>
            </div>

            {forgotError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                <span>{forgotError}</span>
              </div>
            )}

            {isVerifyingResetLink && (
              <div className="py-6 text-center space-y-2.5">
                <RefreshCw className="w-6 h-6 animate-spin text-[#851834] mx-auto" />
                <p className="text-xs font-medium text-stone-600">
                  {t('Verifying reset link...', 'रीसेट लिंक सत्यापित हो रहा है...')}
                </p>
              </div>
            )}

            {!isVerifyingResetLink && forgotStep === 'identify' && (
              <form onSubmit={handleForgotSendResetLink} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    {t('Registered Email or Username', 'पंजीकृत ईमेल या यूज़रनेम')}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={forgotIdentifier}
                      onChange={(e) => setForgotIdentifier(e.target.value)}
                      placeholder={t('name@gmail.com or username', 'name@gmail.com या यूज़रनेम')}
                      required
                      className="w-full pl-9 pr-3.5 py-2.5 text-sm sm:text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#851834] focus:border-transparent bg-white"
                    />
                  </div>
                  <p className="text-[11px] text-stone-500 mt-1.5 leading-relaxed">
                    {t(
                      'We will email you a password reset link. If you usually sign in with Google, go back and tap Continue with Google.',
                      'हम आपके ईमेल पर पासवर्ड रीसेट लिंक भेजेंगे। यदि आप Google से साइन इन करते हैं, तो वापस जाकर Google से जारी रखें।'
                    )}
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={forgotSending}
                  className="w-full bg-[#6e1628] hover:bg-[#851834] disabled:opacity-60 text-white font-semibold py-2.5 px-4 rounded-xl text-xs sm:text-sm shadow-xs cursor-pointer flex items-center justify-center gap-2 transition-colors"
                >
                  {forgotSending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>
                    {forgotSending
                      ? t('Sending Link...', 'लिंक भेजा जा रहा है...')
                      : t('Send Reset Link', 'रीसेट लिंक भेजें')}
                  </span>
                </button>
              </form>
            )}

            {!isVerifyingResetLink && forgotStep === 'link_sent' && (
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2 text-xs">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="font-semibold text-emerald-950">
                        {t('Reset link sent', 'रीसेट लिंक भेजा गया')}
                      </p>
                      <p className="text-[11px] text-emerald-900 break-all">
                        {t('Sent to', 'ईमेल:')} <span className="font-semibold">{forgotDisplayEmail || forgotTargetEmail}</span>
                      </p>
                      <p className="text-[11px] text-emerald-800 leading-relaxed pt-0.5">
                        {t(
                          'Check your inbox or Spam folder. If multiple emails appear in a thread, open the newest message at the bottom and click once.',
                          'अपना इनबॉक्स या स्पैम फ़ोल्डर जांचें। यदि एक ही थ्रेड में कई ईमेल दिखें, तो सबसे नीचे वाला नया ईमेल खोलें और लिंक पर एक बार क्लिक करें।'
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotStep('identify');
                      setForgotError(null);
                    }}
                    className="px-3 py-2 rounded-xl border border-stone-200 text-stone-700 font-medium text-xs hover:bg-stone-50 cursor-pointer"
                  >
                    {t('Change Email', 'ईमेल बदलें')}
                  </button>
                  <button
                    type="button"
                    disabled={forgotSending || resendCooldown > 0}
                    onClick={() => dispatchEmailResetLink(forgotTargetEmail || forgotIdentifier)}
                    className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${forgotSending ? 'animate-spin' : ''}`} />
                    <span>
                      {resendCooldown > 0
                        ? t(`Resend in ${resendCooldown}s`, `${resendCooldown}s में पुनः भेजें`)
                        : t('Resend Link', 'पुनः भेजें')}
                    </span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    clearResetQueryParamsFromUrl();
                    setAuthMode('login');
                    setForgotError(null);
                  }}
                  className="w-full bg-[#6e1628] hover:bg-[#851834] text-white font-semibold py-2.5 rounded-xl text-xs shadow-xs cursor-pointer transition-colors"
                >
                  {t('Back to Sign In', 'साइन इन पर वापस जाएं')}
                </button>
              </div>
            )}

            {!isVerifyingResetLink && forgotStep === 'reset' && (
              <form onSubmit={handleForgotResetPassword} className="space-y-4">
                <p className="text-xs text-stone-600 break-all">
                  {t('Resetting password for', 'खाते का पासवर्ड बदलें:')}{' '}
                  <strong className="text-stone-900">
                    {forgotAccount ? `@${forgotAccount.username}` : forgotTargetEmail}
                  </strong>
                </p>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    {t('New Password', 'नया पासवर्ड')}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showForgotPassword ? 'text' : 'password'}
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      placeholder={t('Create a strong password', 'मजबूत पासवर्ड बनाएं')}
                      required
                      className="w-full pl-9 pr-10 py-2.5 text-sm sm:text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#851834] focus:border-transparent bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(!showForgotPassword)}
                      aria-label={showForgotPassword ? t('Hide password', 'पासवर्ड छिपाएं') : t('Show password', 'पासवर्ड दिखाएं')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
                    >
                      {showForgotPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    {t('Confirm New Password', 'नए पासवर्ड की पुष्टि करें')}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showForgotPassword ? 'text' : 'password'}
                      value={forgotConfirmPassword}
                      onChange={(e) => setForgotConfirmPassword(e.target.value)}
                      placeholder={t('Re-enter new password', 'नया पासवर्ड पुनः दर्ज करें')}
                      required
                      className="w-full pl-9 pr-3.5 py-2.5 text-sm sm:text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#851834] focus:border-transparent bg-white"
                    />
                  </div>
                </div>

                {renderPasswordMeter(forgotNewPassword, forgotPasswordValidation)}

                <button
                  type="submit"
                  disabled={forgotResetting}
                  className="w-full bg-[#6e1628] hover:bg-[#851834] disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-xs sm:text-sm shadow-xs cursor-pointer flex items-center justify-center gap-2 transition-colors"
                >
                  {forgotResetting && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>
                    {forgotResetting
                      ? t('Updating Password...', 'पासवर्ड अपडेट हो रहा है...')
                      : t('Update Password', 'पासवर्ड अपडेट करें')}
                  </span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* FORM C: SIGN UP */}
        {authMode === 'signup' && (
          <form onSubmit={handleSignupSubmit} className="space-y-3.5 text-left">
            {signupError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                <span>{signupError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                {t('Full Name', 'पूरा नाम')}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={signupFullName}
                  onChange={(e) => setSignupFullName(e.target.value)}
                  placeholder={t('e.g. Abhiruchi Rathore', 'उदा. अभिरुचि राठौड़')}
                  required
                  className="w-full pl-9 pr-3.5 py-2.5 text-sm sm:text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#851834] focus:border-transparent bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                {t('Candidate Gender (Match Preference)', 'प्रत्याशी का लिंग (रिश्ते प्राथमिकता हेतु)')}
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setSignupGender('Male')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    signupGender === 'Male'
                      ? 'bg-[#380812] text-amber-200 border-[#380812] shadow-xs'
                      : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                  }`}
                >
                  <span>{t('Male (Groom)', 'पुरुष (वर)')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSignupGender('Female')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    signupGender === 'Female'
                      ? 'bg-[#380812] text-amber-200 border-[#380812] shadow-xs'
                      : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                  }`}
                >
                  <span>{t('Female (Bride)', 'महिला (वधु)')}</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                {t('Email Address', 'ईमेल पता')}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  required
                  className="w-full pl-9 pr-3.5 py-2.5 text-sm sm:text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#851834] focus:border-transparent bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {t('Username', 'यूज़रनेम')}
                </label>
                <input
                  type="text"
                  value={signupUsername}
                  onChange={(e) => setSignupUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="abhiruchi97"
                  required
                  className="w-full px-3.5 py-2.5 text-sm sm:text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#851834] focus:border-transparent bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {t('Mobile (Optional)', 'मोबाइल (वैकल्पिक)')}
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                    className={`w-full pl-8 pr-3 py-2.5 text-sm sm:text-xs rounded-xl border focus:outline-none focus:ring-2 bg-white tabular-nums ${
                      signupPhoneError
                        ? 'border-rose-400 focus:ring-rose-500'
                        : 'border-stone-300 focus:ring-[#851834] focus:border-transparent'
                    }`}
                  />
                </div>
                {signupPhoneError && (
                  <p className="text-[11px] text-rose-600 mt-1">{signupPhoneError}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {t('Password', 'पासवर्ड')}
                </label>
                <div className="relative">
                  <input
                    type={showSignupPassword ? 'text' : 'password'}
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder={t('8+ chars, e.g. Name@123', 'जैसे Name@123')}
                    required
                    className="w-full pl-3.5 pr-9 py-2.5 text-sm sm:text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#851834] focus:border-transparent bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                    aria-label={showSignupPassword ? t('Hide password', 'पासवर्ड छिपाएं') : t('Show password', 'पासवर्ड दिखाएं')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
                  >
                    {showSignupPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {t('Confirm Password', 'पासवर्ड पुष्टि')}
                </label>
                <input
                  type={showSignupPassword ? 'text' : 'password'}
                  value={signupConfirmPassword}
                  onChange={(e) => setSignupConfirmPassword(e.target.value)}
                  placeholder={t('Re-enter password', 'पासवर्ड पुनः दर्ज करें')}
                  required
                  className="w-full px-3.5 py-2.5 text-sm sm:text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#851834] focus:border-transparent bg-white"
                />
              </div>
            </div>

            {renderPasswordMeter(signupPassword, passwordValidation)}

            <button
              type="submit"
              disabled={isCreatingAccount}
              className="w-full bg-[#6e1628] hover:bg-[#851834] text-white font-semibold py-2.5 px-4 rounded-xl text-xs sm:text-sm shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isCreatingAccount && <RefreshCw className="w-4 h-4 animate-spin" />}
              <span>
                {isCreatingAccount
                  ? t('Creating Account...', 'खाता बनाया जा रहा है...')
                  : t('Create Account', 'खाता बनाएं')}
              </span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
