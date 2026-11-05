import React, { useState } from 'react';
import { 
  LogOut, CheckCircle2, Copy, Check, ExternalLink, 
  AlertTriangle, RefreshCw, Sparkles, HelpCircle,
  Eye, EyeOff, Lock, User, KeyRound
} from 'lucide-react';
import { AuthSession, TabType } from '../types';
import { GoogleSignInModal } from './GoogleSignInModal';
import { auth } from '../firebase';
import { GoogleAuthProvider, signInWithRedirect, signInWithPopup } from 'firebase/auth';

interface SignUpTabProps {
  authSession: AuthSession | null;
  onLogin: (session: AuthSession) => void;
  onLogout: () => void;
  onNavigateTab: (tab: TabType) => void;
  hasRegisteredProfile?: boolean;
  unlockedCount?: number;
}

/**
 * Authentication Method 1: Desktop Browser
 * Uses signInWithPopup() for instant authentication without page navigation.
 */
export const signInWithDesktopBrowser = async (
  onSuccess?: (session: AuthSession) => void
): Promise<AuthSession | undefined> => {
  const provider = new GoogleAuthProvider();
  provider.addScope('profile');
  provider.addScope('email');
  // Forces Google to require password / fresh credentials rather than silently reusing SSO session
  provider.setCustomParameters({ 
    prompt: 'login select_account',
    max_age: '0'
  });

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
 * Uses signInWithRedirect() preserving the currently working Android WebView flow.
 */
export const signInWithAndroidWebView = async (): Promise<void> => {
  const provider = new GoogleAuthProvider();
  provider.addScope('profile');
  provider.addScope('email');
  // Forces Google in Android WebView to demand password / credentials upon re-login
  provider.setCustomParameters({ 
    prompt: 'login select_account',
    max_age: '0'
  });

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
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Direct Password Sign-In states
  const [memberIdentifier, setMemberIdentifier] = useState('');
  const [memberPassword, setMemberPassword] = useState('');
  const [showMemberPassword, setShowMemberPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Dispatches to Desktop browser (signInWithPopup) or Android APK WebView (signInWithRedirect)
  const handleGoogleSignIn = async () => {
    if (isAndroidEnvironment()) {
      // Android APK (WebView) flow - preserving working redirect flow
      await signInWithAndroidWebView();
    } else {
      // Desktop browser flow: execute native Firebase signInWithPopup()
      setIsSigningIn(true);
      try {
        await signInWithDesktopBrowser((session) => {
          onLogin(session);
          onNavigateTab('dashboard');
        });
      } catch (error: any) {
        console.warn("Desktop Google Sign-In caught error:", error?.code, error?.message);
        // Firebase closes popup after 1s if domain is not on Authorized Domains list
        if (
          error?.code === 'auth/unauthorized-domain' ||
          error?.code === 'auth/popup-closed-by-user' ||
          error?.code === 'auth/cancelled-popup-request' ||
          error?.message?.includes('authorized domain')
        ) {
          setUnauthorizedDomain(window.location.hostname);
        } else if (error?.code === 'auth/popup-blocked') {
          setUnauthorizedDomain(window.location.hostname);
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

  // Direct Password Verification & Login
  const handleDirectPasswordLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const idKey = memberIdentifier.trim().toLowerCase();
    if (!idKey || !memberPassword.trim()) {
      setPasswordError("Please enter both ID (Email or Phone) and your password.");
      return;
    }
    if (memberPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }

    try {
      const stored = localStorage.getItem('samaj_account_passwords');
      const passwords: Record<string, string> = stored ? JSON.parse(stored) : {};

      // Check if password exists for this ID
      if (passwords[idKey]) {
        if (passwords[idKey] !== memberPassword) {
          setPasswordError("Incorrect password. Please verify your credentials or use Google sign-in.");
          return;
        }
      } else {
        // Save initial password for this account
        passwords[idKey] = memberPassword;
        localStorage.setItem('samaj_account_passwords', JSON.stringify(passwords));
      }
    } catch (err) {
      console.error("Error verifying password:", err);
    }

    // Lookup member name if registered profile exists
    let memberName = memberIdentifier.split('@')[0];
    try {
      const storedProfiles = localStorage.getItem('samaj_profiles');
      if (storedProfiles) {
        const list = JSON.parse(storedProfiles);
        const match = list.find((p: any) => 
          p.contact?.includes(memberIdentifier) || 
          p.name?.toLowerCase() === idKey
        );
        if (match) memberName = match.name;
      }
    } catch (err) {
      console.error(err);
    }

    const session: AuthSession = {
      method: 'Google',
      name: memberName || 'Samaj Member',
      email: memberIdentifier.includes('@') ? memberIdentifier : `${memberIdentifier}@rathorerishtey.org`,
      photoUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      loggedInAt: new Date().toISOString(),
      verified: true
    };

    setPasswordError('');
    setMemberPassword('');
    onLogin(session);
    onNavigateTab('dashboard');
  };

  // Backwards compatibility alias
  const handleRealGoogleSignIn = handleGoogleSignIn;

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
      <GoogleSignInModal isOpen={showGoogleModal} onClose={() => setShowGoogleModal(false)} onSuccess={handleModalSuccess} />

      <div className="bg-white p-6 md:p-8 rounded-3xl border border-stone-200/90 shadow-sm space-y-6 text-center">
        <div>
          <h2 className="text-2xl font-serif font-bold text-stone-900">Welcome to Rathore Rishtey</h2>
          <p className="text-xs text-stone-500 mt-1 font-light">Sign in to view matrimonial biodatas and member directory.</p>
        </div>

        <div className="space-y-5">
          {/* Option 1: Google Sign-In Button */}
          <button 
            type="button" 
            onClick={handleRealGoogleSignIn} 
            disabled={isSigningIn}
            className="w-full flex items-center justify-center gap-3 bg-white border border-stone-300 hover:bg-stone-50/80 active:bg-stone-100 text-stone-700 font-semibold py-3.5 px-4 rounded-xl shadow-2xs hover:shadow-xs transition-all text-xs cursor-pointer disabled:opacity-60"
          >
            {isSigningIn ? (
              <RefreshCw className="w-4 h-4 animate-spin text-amber-700" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
            )}
            <span>{isSigningIn ? "Connecting to Google..." : "Continue with Google (Password Required)"}</span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-3">
            <div className="border-t border-stone-200 w-full"></div>
            <span className="bg-white px-3 text-[10px] uppercase font-bold text-stone-400 tracking-wider absolute">
              or sign in with password
            </span>
          </div>

          {/* Option 2: Direct ID & Password Authentication */}
          <form onSubmit={handleDirectPasswordLogin} className="space-y-3 text-left">
            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">
                Google ID / Email / Phone
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={memberIdentifier}
                  onChange={(e) => {
                    setMemberIdentifier(e.target.value);
                    setPasswordError('');
                  }}
                  placeholder="e.g. abhiruchirathore97@gmail.com"
                  required
                  className="w-full py-2.5 px-3.5 border rounded-xl border-stone-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-xs outline-none bg-stone-50/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">
                Account Password
              </label>
              <div className="relative">
                <input
                  type={showMemberPassword ? "text" : "password"}
                  value={memberPassword}
                  onChange={(e) => {
                    setMemberPassword(e.target.value);
                    setPasswordError('');
                  }}
                  placeholder="Enter your account password"
                  required
                  className="w-full py-2.5 px-3.5 pr-10 border rounded-xl border-stone-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-xs outline-none bg-stone-50/50"
                />
                <button
                  type="button"
                  onClick={() => setShowMemberPassword(!showMemberPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1 cursor-pointer"
                  aria-label={showMemberPassword ? "Hide password" : "Show password"}
                >
                  {showMemberPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {passwordError && (
              <div className="text-red-600 text-xs flex items-center gap-1.5 pt-0.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-[#540e1b] hover:bg-[#380812] active:bg-black text-amber-100 font-bold py-3 rounded-xl text-xs transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Sign In with Password</span>
            </button>
          </form>

          {/* Domain Authorization Diagnostic & Solution Panel */}
          {unauthorizedDomain && (
            <div className="bg-amber-50/90 border border-amber-300 rounded-2xl p-4 text-left space-y-3 animate-in fade-in duration-200 text-xs">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-950 text-xs">Firebase Domain Authorization Required</h4>
                  <p className="text-amber-800 text-[11px] mt-0.5 leading-relaxed">
                    Firebase automatically closes the popup window after 1 second because this preview domain is not yet on your Firebase project&apos;s Authorized Domains list.
                  </p>
                </div>
              </div>

              {/* Domain Copy Box */}
              <div className="bg-white rounded-xl border border-amber-200 p-2.5 flex items-center justify-between gap-2 shadow-2xs">
                <div className="truncate min-w-0">
                  <span className="text-[10px] uppercase font-semibold text-stone-400 block">Domain to add:</span>
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
                  <span>{copiedDomain ? "Copied!" : "Copy Domain"}</span>
                </button>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-1">
                <a
                  href="https://console.firebase.google.com/project/rathore-rishtey/authentication/settings"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-amber-700 hover:bg-amber-800 text-white font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-2 text-xs transition-colors shadow-xs"
                >
                  <span>Open Firebase Console (Authorized Domains)</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="flex-1 border border-amber-300 hover:bg-amber-100/70 text-amber-950 font-semibold py-2 px-2.5 rounded-xl flex items-center justify-center gap-1 text-[11px] transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Retry Popup</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowGoogleModal(true)}
                    className="flex-1 bg-white border border-stone-300 hover:bg-stone-50 text-stone-800 font-semibold py-2 px-2.5 rounded-xl flex items-center justify-center gap-1 text-[11px] transition-colors shadow-2xs cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    <span>Instant Sign-In</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Helper toggle if panel is not open */}
          {!unauthorizedDomain && (
            <button
              type="button"
              onClick={() => setUnauthorizedDomain(window.location.hostname)}
              className="text-[11px] text-stone-400 hover:text-stone-600 flex items-center justify-center gap-1 mx-auto transition-colors cursor-pointer"
            >
              <HelpCircle className="w-3 h-3" />
              <span>Need help with Firebase Authorized Domains?</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
