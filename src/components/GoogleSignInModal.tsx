import React, { useState, useEffect } from 'react';
import {
  X, Loader2, ShieldCheck, AlertCircle, RefreshCw, Mail
} from 'lucide-react';
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect } from 'firebase/auth';
import { AuthSession } from '../types';
import { auth } from '../firebase';
import { useLanguage } from '../context/LanguageContext';

interface GoogleSignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (session: AuthSession) => void;
  onUseEmailAuth?: () => void;
  errorCode?: string | null;
}

export const GoogleSignInModal: React.FC<GoogleSignInModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onUseEmailAuth,
  errorCode = null
}) => {
  const { t } = useLanguage();
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  const activeGoogleUser =
    auth.currentUser && auth.currentUser.providerData.some((p) => p.providerId === 'google.com')
      ? auth.currentUser
      : null;

  useEffect(() => {
    if (isOpen) {
      setIsRetrying(false);
      setRetryError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleContinueActiveGoogle = () => {
    if (!activeGoogleUser) return;
    onSuccess({
      method: 'Google',
      name: activeGoogleUser.displayName || activeGoogleUser.email?.split('@')[0] || 'Google User',
      email: activeGoogleUser.email || '',
      photoUrl: activeGoogleUser.photoURL || '',
      loggedInAt: new Date().toISOString(),
      verified: activeGoogleUser.emailVerified
    });
  };

  const handleRetryGoogleOAuth = async () => {
    setRetryError(null);
    setIsRetrying(true);
    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      const result = await signInWithPopup(auth, provider);
      if (result?.user) {
        onSuccess({
          method: 'Google',
          name: result.user.displayName || result.user.email?.split('@')[0] || 'Google User',
          email: result.user.email || '',
          photoUrl: result.user.photoURL || '',
          loggedInAt: new Date().toISOString(),
          verified: result.user.emailVerified
        });
      }
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/popup-blocked') {
        try {
          await signInWithRedirect(auth, provider);
          return;
        } catch (redirectErr: any) {
          setRetryError(redirectErr?.message || t('Google Sign-In redirect failed.', 'Google साइन-इन विफल रहा।'));
        }
      } else if (code === 'auth/unauthorized-domain') {
        setRetryError(
          t(
            'This app domain needs to be authorized in Firebase Console for Google popup login. Please use Email & Password Sign Up / Log In below — it works immediately on all devices.',
            'इस डोमेन पर Google पॉपअप लॉगिन के लिए Firebase Console में डोमेन अनुमति आवश्यक है। कृपया नीचे Email & Password साइन-इन का उपयोग करें — यह तुरंत काम करता है।'
          )
        );
      } else {
        setRetryError(
          t(
            'Google Sign-In could not open in this app browser. Please use Email & Password Sign Up / Log In below to save & sync your biodata live.',
            'इस ऐप ब्राउज़र में Google पॉपअप नहीं खुल सका। अपना बायोडाटा और विज्ञापन लाइव सेव करने के लिए कृपया नीचे Email & Password का उपयोग करें।'
          )
        );
      }
    } finally {
      setIsRetrying(false);
    }
  };

  const handleFallbackToEmail = () => {
    onClose();
    if (onUseEmailAuth) {
      onUseEmailAuth();
    } else if (typeof window !== 'undefined') {
      window.location.hash = '#signup';
    }
  };

  const isUnauthorizedDomain = errorCode === 'auth/unauthorized-domain';

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start sm:items-center justify-center px-3 sm:px-4 pt-[calc(0.75rem+var(--sat))] pb-[calc(1rem+var(--sab))] overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 relative overflow-hidden font-sans my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.19v3.15C3.17 21.32 7.23 24 12 24z" />
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.19C.43 8.1 0 9.8 0 12s.43 3.9 1.19 5.42l4.09-3.15z" />
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.23 0 3.17 2.68 1.19 6.58l4.09 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
            </svg>
            <span className="font-semibold text-xs text-slate-700 tracking-tight">
              {t('Google Sign-In & Cloud Sync', 'Google साइन-इन व क्लाउड सिंक')}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-full transition-colors cursor-pointer"
            aria-label={t('Close', 'बंद करें')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {activeGoogleUser ? (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h3 className="text-lg font-bold text-slate-900">
                  {t('Google Session Active', 'Google सत्र सक्रिय है')}
                </h3>
                <p className="text-xs text-slate-500">
                  {t('Continue securely with your verified Google account.', 'अपने सत्यापित Google खाते से सुरक्षित रूप से आगे बढ़ें।')}
                </p>
              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-2xl border-2 border-emerald-400/70 bg-emerald-50/40">
                {activeGoogleUser.photoURL && (
                  <img
                    src={activeGoogleUser.photoURL}
                    alt={activeGoogleUser.displayName || 'User'}
                    className="w-11 h-11 rounded-full object-cover border border-emerald-300"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {activeGoogleUser.displayName || activeGoogleUser.email}
                  </p>
                  <p className="text-[11px] text-slate-600 truncate">
                    {activeGoogleUser.email}
                  </p>
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold mt-0.5">
                    <ShieldCheck className="w-3 h-3" />
                    {t('Verified Cloud Connection', 'क्लाउड डेटाबेस से जुड़ा है')}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleContinueActiveGoogle}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow cursor-pointer transition-colors"
              >
                {t(
                  `Continue as ${activeGoogleUser.displayName || activeGoogleUser.email}`,
                  `${activeGoogleUser.displayName || activeGoogleUser.email} के रूप में आगे बढ़ें`
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-amber-950">
                      {isUnauthorizedDomain
                        ? t('Google Popup Unavailable on This Domain', 'इस डोमेन पर Google पॉपअप उपलब्ध नहीं है')
                        : t('Google Window Could Not Complete', 'Google लॉगिन पूरा नहीं हो सका')}
                    </p>
                    <p className="text-[11px] text-amber-900 leading-relaxed">
                      {t(
                        'To make sure your profile, family details, and business ads save to the live database for everyone to see in real time, please Sign Up / Log In using Email & Password below or retry Google Sign-In.',
                        'ताकि आपका बायोडाटा, पारिवारिक विवरण और व्यापार विज्ञापन लाइव डेटाबेस में सेव होकर सभी को रीयल-टाइम में दिखें, कृपया नीचे Email और Password से साइन अप / लॉग इन करें या पुनः Google प्रयास करें।'
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {retryError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{retryError}</span>
                </div>
              )}

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={handleFallbackToEmail}
                  className="w-full py-3 px-4 bg-[#6e1628] hover:bg-[#851834] text-white rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Mail className="w-4 h-4 text-amber-300" />
                  <span>{t('Sign Up / Log In with Email & Password', 'ईमेल व पासवर्ड से साइन अप / लॉग इन करें')}</span>
                </button>

                <button
                  type="button"
                  disabled={isRetrying}
                  onClick={handleRetryGoogleOAuth}
                  className="w-full py-2.5 px-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 transition-colors"
                >
                  {isRetrying ? (
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
                  )}
                  <span>
                    {isRetrying
                      ? t('Connecting to Google...', 'Google से जुड़ रहा है...')
                      : t('Try Google Sign-In Again', 'पुनः Google से साइन इन करें')}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
