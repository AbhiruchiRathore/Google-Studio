import React, { useState, useEffect, useRef } from 'react';
import { 
  LogOut, CheckCircle2, Copy, Check, ExternalLink, 
  AlertTriangle, RefreshCw, HelpCircle,
  User, Lock, Eye, EyeOff, Phone, UserPlus, LogIn,
  AlertCircle, ShieldCheck, KeyRound, ArrowLeft, Mail, Send
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

function isKnownAuthorizedHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host.endsWith('.firebaseapp.com') ||
    host.endsWith('.web.app')
  );
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
}: SignUpTabProps) {
  const { lang, t } = useLanguage();
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [emailProviderDisabled, setEmailProviderDisabled] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Authentication Mode: 'login', 'signup', or 'forgot'
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot'>('login');

  // Sign Up Form State
  const [signupFullName, setSignupFullName] = useState('');
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
  const [firebaseOobCode, setFirebaseOobCode] = useState<string | null>(null);
  const [forgotSending, setForgotSending] = useState(false);
  const [forgotResetting, setForgotResetting] = useState(false);
  const [isVerifyingResetLink, setIsVerifyingResetLink] = useState(false);
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
      const cleaned = `${url.pathname}${url.search}${url.hash || '#signup'}`;
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
    const params = new URLSearchParams(window.location.search);
    const modeParam = params.get('mode');
    const oobCodeParam = params.get('oobCode');

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
        setIsVerifyingResetLink(false);
        setForgotStep('identify');
        if (err?.code === 'auth/network-request-failed') {
          setForgotError(
            t(
              'Network error while verifying your reset link. Please check your internet connection and reload.',
              'रीसेट लिंक सत्यापित करते समय नेटवर्क त्रुटि। कृपया अपना इंटरनेट जांचें और पृष्ठ पुनः लोड करें।'
            )
          );
          return;
        }
        if (err?.code === 'auth/expired-action-code') {
          setForgotError(
            t(
              'This password reset link has expired. Please request a new reset link below.',
              'यह पासवर्ड रीसेट लिंक समाप्त हो चुका है। कृपया नीचे से नया रीसेट लिंक मंगाएं।'
            )
          );
        } else {
          setForgotError(
            t(
              'This reset link has already been used or replaced by a newer email. If you sent multiple requests, please open the LATEST email in your inbox or request a fresh link.',
              'यह रीसेट लिंक पहले ही उपयोग हो चुका है या नए ईमेल द्वारा बदल दिया गया है। कृपया अपने इनबॉक्स का सबसे नया (Latest) ईमेल खोलें या नया लिंक मंगाएं।'
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
    setForgotStep('identify');
    setForgotIdentifier(loginIdentifier.trim());
    setForgotAccount(null);
    setForgotTargetEmail('');
    setForgotDisplayEmail('');
    setFirebaseOobCode(null);
    setResendCooldown(0);
    setForgotNewPassword('');
    setForgotConfirmPassword('');
    setForgotError(null);
    setLoginError(null);
  };

  const dispatchEmailResetLink = async (rawInput: string) => {
    if (forgotSendLockRef.current || forgotSending) return;
    setForgotError(null);
    const trimmed = rawInput.trim();
    const lower = trimmed.toLowerCase();

    if (!lower) {
      setForgotError(
        t(
          'Please enter your registered email address (or username linked with an email).',
          'कृपया अपना पंजीकृत ईमेल पता (या ईमेल से जुड़ा यूज़रनेम) दर्ज करें।'
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
            'No email address is saved on this username yet. Please enter your email address directly to receive the reset link.',
            'इस यूज़रनेम में ईमेल पता सहेजा नहीं गया है। रीसेट लिंक पाने के लिए कृपया अपना ईमेल पता दर्ज करें।'
          )
        );
        return;
      } else {
        setForgotError(
          t(
            'Please enter a valid registered email address (e.g. name@gmail.com) or a registered username.',
            'कृपया एक मान्य पंजीकृत ईमेल पता (जैसे name@gmail.com) या पंजीकृत यूज़रनेम दर्ज करें।'
          )
        );
        return;
      }
    }

    forgotSendLockRef.current = true;
    setForgotSending(true);
    try {
      if (typeof window !== 'undefined' && isKnownAuthorizedHost(window.location.hostname)) {
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
      forgotSendLockRef.current = false;
      setForgotSending(false);
      if (err?.code === 'auth/invalid-email') {
        setForgotError(t('Please enter a valid email address.', 'कृपया एक मान्य ईमेल पता दर्ज करें।'));
        return;
      }
      if (err?.code === 'auth/user-not-found') {
        setForgotError(
          t(
            'No email account found with this address. Please check your email or sign up first.',
            'इस ईमेल पते से कोई खाता नहीं मिला। कृपया जांचें या नया खाता बनाएं।'
          )
        );
        return;
      }
      if (err?.code === 'auth/too-many-requests') {
        setForgotError(
          t(
            'Too many reset requests sent. Please wait a few minutes and check your email inbox.',
            'बहुत अधिक अनुरोध भेजे गए हैं। कृपया कुछ मिनट प्रतीक्षा करें और अपना ईमेल जांचें।'
          )
        );
        return;
      }
      if (err?.code === 'auth/network-request-failed') {
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

    forgotSendLockRef.current = false;
    setForgotSending(false);
    setForgotAccount(matched);
    setForgotTargetEmail(resolvedEmail);
    setForgotDisplayEmail(isDirectEmail ? resolvedEmail : maskEmailAddress(resolvedEmail));
    setFirebaseOobCode(null);
    setResendCooldown(60);
    setForgotStep('link_sent');
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

    let firebaseUid = `user_${Date.now()}`;
    try {
      // Check if username already exists in Firestore directory across devices
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
      const cred = await createUserWithEmailAndPassword(secondaryAuth, cleanEmail, signupPassword);
      if (cred.user) {
        firebaseUid = cred.user.uid;
        await updateProfile(cred.user, { displayName: cleanFullName }).catch(() => {});
        await syncUserProfileToFirestore(secondaryDb, secondaryAuth, cred.user, {
          username: cleanUsername,
          fullName: cleanFullName,
          phone: phoneCheck.cleaned || '',
          provider: 'password',
          isNewUser: true
        });
        await signOut(secondaryAuth).catch(() => {});
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
      let emailCandidate = matched?.email?.trim().toLowerCase() || (EMAIL_REGEX.test(identifier) ? identifier : '');

      // Resolve username -> email via Firestore for cross-device Username ID login
      if (!emailCandidate && !identifier.includes('@')) {
        const firestoreProfile = await lookupEmailByUsernameFromFirestore(auth, identifier);
        if (firestoreProfile?.email) {
          emailCandidate = firestoreProfile.email;
          resolvedUsername = resolvedUsername || firestoreProfile.username;
          resolvedFullName = resolvedFullName || firestoreProfile.fullName;
          resolvedPhone = resolvedPhone || firestoreProfile.phone || '';
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
            provider: 'password'
          });

          if (matched) {
            const synced = accounts.map((acc) =>
              acc.id === matched.id ? { ...acc, id: cred.user.uid, password } : acc
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

  return (
    <div className="space-y-6 max-w-md mx-auto py-3 sm:py-8 px-0 sm:px-4">
      <GoogleSignInModal isOpen={showGoogleModal} onClose={() => setShowGoogleModal(false)} onSuccess={handleModalSuccess} />

      <div className="bg-white p-5 sm:p-8 rounded-3xl border border-stone-200/90 shadow-sm space-y-6">
        <div className="text-center space-y-1">
          <div className="flex justify-center">
            <BrandLogo size="lg" showText={false} tone="crimson" />
          </div>
          <h2 className="font-logo text-3xl sm:text-4xl font-bold text-[#6e1628] leading-tight">
            {t('Rathore Rishtey', 'राठौड़ रिश्ते')}
          </h2>
          <p className="text-xs text-stone-500 font-light">
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
              authMode === 'login' || authMode === 'forgot'
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
              setPasswordResetSuccessUser(null);
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
        {/* SUCCESS NOTIFICATION AFTER PASSWORD RESET                 */}
        {/* ========================================================= */}
        {passwordResetSuccessUser && authMode === 'login' && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-left space-y-1 animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-emerald-950 text-xs">
                  {t('Password Updated Successfully!', 'पासवर्ड सफलतापूर्वक बदल गया!')}
                </h4>
                <p className="text-[11px] text-emerald-800 mt-0.5">
                  {t(
                    `New password saved for @${passwordResetSuccessUser}. Please sign in below.`,
                    `@${passwordResetSuccessUser} के लिए नया पासवर्ड सहेजा गया है। नीचे साइन इन करें।`
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

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

        {emailProviderDisabled && (
          <div className="bg-amber-50/90 border border-amber-300 rounded-2xl p-4 text-left space-y-2.5 animate-in fade-in duration-200 text-xs">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-bold text-amber-950 text-xs">
                  {t('Enable Email/Password Sign-In in Firebase Console', 'Firebase Console में Email/Password साइन-इन चालू करें')}
                </h4>
                <p className="text-amber-900 text-[11px] leading-relaxed">
                  {t(
                    'To store Username ID & Password users in Firebase Authentication alongside Google users, turn ON "Email/Password" under Authentication → Sign-in method.',
                    'Google उपयोगकर्ताओं के साथ Username ID और Password उपयोगकर्ताओं को Firebase Authentication में सहेजने के लिए Authentication → Sign-in method में "Email/Password" चालू करें।'
                  )}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <a
                href="https://console.firebase.google.com/project/rathore-rishtey/authentication/providers"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-amber-700 hover:bg-amber-800 text-white font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 text-[11px] transition-colors shadow-xs"
              >
                <span>{t('Open Sign-in Providers', 'Firebase Sign-in Providers खोलें')}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <button
                type="button"
                onClick={() => setEmailProviderDisabled(false)}
                className="px-3 py-2 bg-white border border-amber-200 text-amber-900 rounded-xl text-[11px] font-semibold cursor-pointer"
              >
                {t('Dismiss', 'बंद करें')}
              </button>
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
                <span>{t('Username, Email, or Mobile Number', 'यूज़रनेम, ईमेल या मोबाइल नंबर')}</span>
              </label>
              <input
                type="text"
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                placeholder={t('e.g. abhiruchi97, email, or 9826012345', 'उदा. abhiruchi97, ईमेल या 9826012345')}
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
              <div className="flex justify-end mt-1.5">
                <button
                  type="button"
                  onClick={openForgotPasswordFlow}
                  className="text-[11px] font-bold text-[#851834] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <KeyRound className="w-3 h-3" />
                  <span>{t('Forgot Password?', 'पासवर्ड भूल गए?')}</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-gradient-to-r from-[#6e1628] via-[#851834] to-[#6e1628] text-amber-100 hover:text-white font-bold py-3 rounded-xl text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer border border-amber-300/30 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoggingIn ? (
                <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
              ) : (
                <LogIn className="w-4 h-4 text-amber-300" />
              )}
              <span>
                {isLoggingIn
                  ? t('Signing In...', 'साइन इन हो रहा है...')
                  : t('Sign In with Password', 'पासवर्ड से साइन इन करें')}
              </span>
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
        {/* FORM C: FORGOT PASSWORD (EMAIL PASSWORD RESET LINK)       */}
        {/* ========================================================= */}
        {authMode === 'forgot' && (
          <div className="space-y-4 text-left animate-in fade-in">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-50 text-[#851834] flex items-center justify-center border border-rose-200">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-stone-900">
                    {t('Email Password Reset Link', 'ईमेल पासवर्ड रीसेट लिंक')}
                  </h3>
                  <p className="text-[10px] text-stone-500">
                    {forgotStep === 'identify'
                      ? t('Enter email to receive password reset link', 'रीसेट लिंक पाने के लिए ईमेल दर्ज करें')
                      : forgotStep === 'link_sent'
                        ? t('Reset link dispatched to your email', 'आपके ईमेल पर रीसेट लिंक भेजा गया')
                        : t('Set a new strong password for your account', 'अपने खाते के लिए नया मजबूत पासवर्ड चुनें')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  clearResetQueryParamsFromUrl();
                  setAuthMode('login');
                  setForgotError(null);
                }}
                className="text-[11px] font-semibold text-stone-500 hover:text-stone-800 flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>{t('Back', 'वापस')}</span>
              </button>
            </div>

            {forgotError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{forgotError}</span>
              </div>
            )}

            {isVerifyingResetLink && (
              <div className="p-5 bg-stone-50 border border-stone-200 rounded-2xl text-center space-y-2 animate-in fade-in">
                <RefreshCw className="w-6 h-6 animate-spin text-[#851834] mx-auto" />
                <p className="text-xs font-semibold text-stone-700">
                  {t('Verifying your password reset link...', 'आपके पासवर्ड रीसेट लिंक का सत्यापन हो रहा है...')}
                </p>
              </div>
            )}

            {!isVerifyingResetLink && forgotStep === 'identify' && (
              <form onSubmit={handleForgotSendResetLink} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-stone-400" />
                    <span>{t('Registered Email Address (or Username)', 'पंजीकृत ईमेल पता (या यूज़रनेम)')}</span>
                  </label>
                  <input
                    type="text"
                    value={forgotIdentifier}
                    onChange={(e) => setForgotIdentifier(e.target.value)}
                    placeholder={t('e.g. abhiruchirathore97@gmail.com', 'उदा. abhiruchirathore97@gmail.com')}
                    required
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#851834] bg-stone-50/50"
                  />
                  <p className="text-[10px] text-stone-400 mt-1">
                    {t(
                      'We will send a secure single-use password reset link to your email.',
                      'हम आपके ईमेल पर एक सुरक्षित सिंगल-यूज़ पासवर्ड रीसेट लिंक भेजेंगे।'
                    )}
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={forgotSending}
                  className="w-full bg-gradient-to-r from-[#6e1628] via-[#851834] to-[#6e1628] disabled:opacity-60 text-amber-100 font-bold py-2.5 rounded-xl text-xs shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {forgotSending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>
                    {forgotSending
                      ? t('Sending Reset Link...', 'रीसेट लिंक भेजा जा रहा है...')
                      : t('Send Password Reset Link', 'पासवर्ड रीसेट लिंक भेजें')}
                  </span>
                </button>
              </form>
            )}

            {!isVerifyingResetLink && forgotStep === 'link_sent' && (
              <div className="space-y-4 animate-in fade-in">
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-2 text-xs">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="font-bold text-emerald-950">
                        {t('Password Reset Link Sent to Your Email', 'आपके ईमेल पर पासवर्ड रीसेट लिंक भेजा गया है')}
                      </p>
                      <p className="text-[11px] text-emerald-800 break-all">
                        {t('Email:', 'ईमेल:')} <strong className="font-semibold">{forgotDisplayEmail || forgotTargetEmail}</strong>
                      </p>
                      <p className="text-[11px] text-emerald-700 leading-relaxed pt-0.5">
                        {t(
                          'Please open the latest password reset email sent to your inbox (also check Spam/Junk folder) and click the link once.',
                          'नया पासवर्ड सेट करने के लिए कृपया अपने ईमेल इनबॉक्स (या स्पैम/जंक फ़ोल्डर) में आया सबसे नया रीसेट ईमेल खोलें और लिंक पर एक बार क्लिक करें।'
                        )}
                      </p>
                      <p className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200/80 rounded-lg px-2.5 py-1.5 mt-1.5 leading-relaxed">
                        {t(
                          'Important: Sending another reset email automatically invalidates any previous email link. Wait at least 1 minute before resending.',
                          'महत्वपूर्ण: नया रीसेट लिंक भेजने पर पुराना लिंक स्वतः अमान्य हो जाता है। पुनः भेजने से पहले कृपया 1 मिनट प्रतीक्षा करें।'
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotStep('identify');
                      setForgotError(null);
                    }}
                    className="px-3.5 py-2 rounded-xl border border-stone-200 text-stone-700 font-semibold text-[11px] hover:bg-stone-50 cursor-pointer"
                  >
                    {t('Use Different Email', 'दूसरा ईमेल बदलें')}
                  </button>
                  <button
                    type="button"
                    disabled={forgotSending || resendCooldown > 0}
                    onClick={() => dispatchEmailResetLink(forgotTargetEmail || forgotIdentifier)}
                    className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-[#851834] border border-rose-200 font-bold text-[11px] flex items-center gap-1 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`w-3 h-3 ${forgotSending ? 'animate-spin' : ''}`} />
                    <span>
                      {resendCooldown > 0
                        ? t(`Resend in ${resendCooldown}s`, `${resendCooldown} सेकंड में पुनः भेजें`)
                        : t('Resend Reset Link', 'लिंक पुनः भेजें')}
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
                  className="w-full bg-gradient-to-r from-[#6e1628] via-[#851834] to-[#6e1628] text-amber-100 font-bold py-2.5 rounded-xl text-xs shadow-sm cursor-pointer"
                >
                  {t('Back to Sign In', 'साइन इन पर वापस जाएं')}
                </button>
              </div>
            )}

            {!isVerifyingResetLink && forgotStep === 'reset' && (
              <form onSubmit={handleForgotResetPassword} className="space-y-3.5">
                <div className="text-xs bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-700 break-all">
                  {t('Reset link verified for', 'रीसेट लिंक सत्यापित:')}{' '}
                  <strong className="font-mono text-[#6e1628]">
                    {forgotAccount ? `@${forgotAccount.username}` : forgotTargetEmail}
                  </strong>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center justify-between">
                    <span>{t('New Strong Password *', 'नया मजबूत पासवर्ड *')}</span>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(!showForgotPassword)}
                      className="text-[10px] text-stone-400 hover:text-stone-600 cursor-pointer"
                    >
                      {showForgotPassword ? t('Hide', 'छिपाएं') : t('Show', 'दिखाएं')}
                    </button>
                  </label>
                  <input
                    type={showForgotPassword ? 'text' : 'password'}
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    placeholder={t('e.g. Rathore@2026', 'उदा. Rathore@2026')}
                    required
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#851834] bg-stone-50/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    {t('Confirm New Password *', 'नए पासवर्ड की पुष्टि करें *')}
                  </label>
                  <input
                    type={showForgotPassword ? 'text' : 'password'}
                    value={forgotConfirmPassword}
                    onChange={(e) => setForgotConfirmPassword(e.target.value)}
                    placeholder={t('Re-enter new password', 'नया पासवर्ड पुनः दर्ज करें')}
                    required
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#851834] bg-stone-50/50"
                  />
                </div>

                <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 space-y-2 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-700">{t('Password Strength:', 'पासवर्ड मजबूती:')}</span>
                    <span className={`font-bold ${
                      forgotPasswordValidation.valid
                        ? 'text-emerald-700'
                        : forgotPasswordValidation.score >= 3
                          ? 'text-amber-700'
                          : 'text-rose-600'
                    }`}>
                      {forgotPasswordValidation.valid
                        ? t('Strong ✓', 'मजबूत ✓')
                        : forgotPasswordValidation.score >= 3
                          ? t('Medium', 'मध्यम')
                          : t('Weak', 'कमज़ोर')}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[10px]">
                    <span className={forgotPasswordValidation.checks.minLength ? 'text-emerald-700 font-semibold' : 'text-stone-500'}>
                      {forgotPasswordValidation.checks.minLength ? '✓' : '○'} {t('8+ characters', '8+ अक्षर')}
                    </span>
                    <span className={forgotPasswordValidation.checks.hasUpper ? 'text-emerald-700 font-semibold' : 'text-stone-500'}>
                      {forgotPasswordValidation.checks.hasUpper ? '✓' : '○'} {t('Uppercase (A–Z)', 'बड़ा अक्षर')}
                    </span>
                    <span className={forgotPasswordValidation.checks.hasLower ? 'text-emerald-700 font-semibold' : 'text-stone-500'}>
                      {forgotPasswordValidation.checks.hasLower ? '✓' : '○'} {t('Lowercase (a–z)', 'छोटा अक्षर')}
                    </span>
                    <span className={forgotPasswordValidation.checks.hasNumber ? 'text-emerald-700 font-semibold' : 'text-stone-500'}>
                      {forgotPasswordValidation.checks.hasNumber ? '✓' : '○'} {t('Number (0–9)', 'अंक (0–9)')}
                    </span>
                    <span className={`col-span-2 ${forgotPasswordValidation.checks.hasSpecial ? 'text-emerald-700 font-semibold' : 'text-stone-500'}`}>
                      {forgotPasswordValidation.checks.hasSpecial ? '✓' : '○'} {t('Special symbol (@, #, $, !, %)', 'विशेष चिह्न (@, #, $, !, %)')}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={forgotResetting}
                  className="w-full bg-gradient-to-r from-[#6e1628] via-[#851834] to-[#6e1628] disabled:opacity-60 text-amber-100 font-bold py-2.5 rounded-xl text-xs shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {forgotResetting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>
                    {forgotResetting
                      ? t('Updating Password...', 'पासवर्ड अपडेट हो रहा है...')
                      : t('Update Password & Sign In', 'पासवर्ड अपडेट करें')}
                  </span>
                </button>
              </form>
            )}
          </div>
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

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-stone-400" />
                <span>{t('Email Address * (for Password Reset Link)', 'ईमेल पता * (पासवर्ड रीसेट लिंक हेतु)')}</span>
              </label>
              <input
                type="email"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                placeholder={t('e.g. name@gmail.com', 'उदा. name@gmail.com')}
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
              disabled={isCreatingAccount}
              className="w-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-stone-950 font-bold py-3 rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isCreatingAccount ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              <span>
                {isCreatingAccount
                  ? t('Creating Firebase Account...', 'खाता बनाया जा रहा है...')
                  : t('Create Account', 'खाता बनाएं')}
              </span>
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
