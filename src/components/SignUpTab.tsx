import React, { useState, useEffect } from 'react';
import { LogOut, CheckCircle2 } from 'lucide-react';
import { AuthSession, TabType } from '../types';
import { GoogleSignInModal } from './GoogleSignInModal';
import { auth } from '../firebase';
import { GoogleAuthProvider, signInWithRedirect, getRedirectResult } from 'firebase/auth';

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

  // Handle the redirect result when the user comes back from Google's login flow
  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result && result.user) {
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
        }
      })
      .catch((error: any) => {
        console.error("Google Redirect Auth Error:", error.message);
      });
  }, [onLogin, onNavigateTab]);

  // Real Google Sign-In via Redirect (Compatible with Android WebViews)
  const handleRealGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');

    try {
      await signInWithRedirect(auth, provider);
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
        </div>
      </div>
    </div>
  );
}
