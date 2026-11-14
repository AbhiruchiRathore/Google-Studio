import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { TabType, MatrimonyProfile, BusinessAd, SamajEvent, AuthSession } from './types';
import { INITIAL_PROFILES, INITIAL_ADS, INITIAL_EVENTS } from './data/mockData';
import { Header } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { MatrimonyTab } from './components/MatrimonyTab';
import { BusinessTab } from './components/BusinessTab';
import { BookletTab } from './components/BookletTab';
import { EventsTab } from './components/EventsTab';
import SignUpTab, { isAndroidEnvironment } from './components/SignUpTab';
import { CreateProfileTab } from './components/CreateProfileTab';
import { AdvertiseShopTab } from './components/AdvertiseShopTab';
import { FamilyDetailsTab } from './components/FamilyDetailsTab';
import { DashboardTab } from './components/DashboardTab';
import { KundaliMilanTab } from './components/KundaliMilanTab';
import { GuestListTab } from './components/GuestListTab';
import { AdminDashboardTab } from './components/AdminDashboardTab';
import { WhatsAppShare } from './components/WhatsAppShare';
import { Footer } from './components/Footer';
import { auth } from './firebase';
import { onAuthStateChanged, signOut, getRedirectResult } from 'firebase/auth';
import { Sparkles, Lock } from 'lucide-react';
import { useLanguage } from './context/LanguageContext';
import { useAdminConfig, DEFAULT_ADMIN_CONFIG } from './context/AdminConfigContext';
import { sanitizePhoneInput } from './utils/validation';
import { getSessionOwnerKey, isProfileOwnedBySession } from './utils/profileOwnership';

const VALID_TABS = new Set<TabType>([
  'matrimony',
  'kundali',
  'guest-list',
  'directory',
  'booklet',
  'events',
  'signup',
  'create-profile',
  'advertise-shop',
  'family-details',
  'dashboard',
  'admin'
]);

function hasPasswordResetParams(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return Boolean(params.get('mode') === 'resetPassword' && params.get('oobCode'));
}

function getInitialTabFromUrl(): TabType {
  if (typeof window === 'undefined') return 'matrimony';
  if (hasPasswordResetParams()) {
    return 'signup';
  }
  const hashTab = window.location.hash.replace('#', '') as TabType;
  if (VALID_TABS.has(hashTab) && hashTab !== 'admin') {
    return hashTab;
  }
  return 'matrimony';
}

export const App: React.FC = () => {
  const { t } = useLanguage();
  const { config } = useAdminConfig();
  const [currentTab, setCurrentTab] = useState<TabType>(() => getInitialTabFromUrl());
  const currentTabRef = useRef<TabType>(currentTab);
  currentTabRef.current = currentTab;

  const [backNotice, setBackNotice] = useState(false);
  const [kundaliBoyId, setKundaliBoyId] = useState<number | string | null>(null);
  const [kundaliGirlId, setKundaliGirlId] = useState<number | string | null>(null);

  const navigateToTab = useCallback((nextTab: TabType, options?: { replace?: boolean }) => {
    setCurrentTab((prev) => {
      if (prev !== nextTab && typeof window !== 'undefined') {
        try {
          if (options?.replace) {
            window.history.replaceState({ tab: nextTab }, '', `#${nextTab}`);
          } else {
            window.history.pushState({ tab: nextTab }, '', `#${nextTab}`);
          }
        } catch {
          // Ignore history errors in restricted environments
        }
      }
      return nextTab;
    });
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  // Initialize history stack and handle hardware/browser Back button cleanly
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const initialTab = getInitialTabFromUrl();

    try {
      if (!window.history.state?.tab) {
        if (isAndroidEnvironment()) {
          // Push a root guard entry on Android WebView so pressing Back once doesn't immediately close the APK
          window.history.replaceState({ tab: initialTab, isGuard: true }, '', `${window.location.search}#${initialTab}`);
          window.history.pushState({ tab: initialTab }, '', `${window.location.search}#${initialTab}`);
        } else {
          window.history.replaceState({ tab: initialTab }, '', `${window.location.search}#${initialTab}`);
        }
      }
    } catch {
      // ignore
    }

    const handlePopState = (event: PopStateEvent) => {
      const stateTab = event.state?.tab as TabType | undefined;
      const hashTab = window.location.hash.replace('#', '') as TabType;
      let targetTab =
        stateTab && VALID_TABS.has(stateTab)
          ? stateTab
          : VALID_TABS.has(hashTab)
            ? hashTab
            : 'matrimony';

      // Prevent logged-in users from being thrown back onto the signup / sign-out screen on hardware Back
      if (authSessionRef.current && targetTab === 'signup') {
        targetTab = 'matrimony';
        try {
          window.history.replaceState({ tab: 'matrimony' }, '', '#matrimony');
        } catch {
          // ignore
        }
      }

      // If Android WebView hits the synthetic guard at root, keep user inside app and nudge once
      if (event.state?.isGuard) {
        if (currentTabRef.current !== 'matrimony') {
          setCurrentTab('matrimony');
          window.history.pushState({ tab: 'matrimony' }, '', '#matrimony');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          setBackNotice(true);
          window.history.pushState({ tab: 'matrimony' }, '', '#matrimony');
          setTimeout(() => setBackNotice(false), 2500);
        }
        return;
      }

      const tabChanged = targetTab !== currentTabRef.current;
      setCurrentTab(targetTab);
      if (tabChanged) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleSelectKundaliProfile = (id: number | string, gender: 'Male' | 'Female') => {
    if (gender === 'Male') {
      setKundaliBoyId(id);
    } else {
      setKundaliGirlId(id);
    }
    navigateToTab('kundali');
  };

  // Matrimony Profiles State
  const [profiles, setProfiles] = useState<MatrimonyProfile[]>(() => {
    try {
      const stored = localStorage.getItem('samaj_profiles');
      if (stored) {
        const parsed: MatrimonyProfile[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const defaultIds = new Set(INITIAL_PROFILES.map(p => p.id));
          const customProfiles = parsed.filter(p => !defaultIds.has(p.id));
          return [...customProfiles, ...INITIAL_PROFILES];
        }
      }
    } catch (e) {
      console.error("Error reading samaj_profiles:", e);
    }
    return INITIAL_PROFILES;
  });

  // Business Ads State
  const [ads, setAds] = useState<BusinessAd[]>(() => {
    try {
      const stored = localStorage.getItem('samaj_ads');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const userIds = new Set(parsed.map(a => a.id));
          const remainingDefaults = INITIAL_ADS.filter(a => !userIds.has(a.id));
          return [...parsed, ...remainingDefaults];
        }
      }
    } catch (e) {
      console.error("Error reading samaj_ads:", e);
    }
    return INITIAL_ADS;
  });

  // Events State
  const [events, setEvents] = useState<SamajEvent[]>(() => {
    try {
      const stored = localStorage.getItem('samaj_events');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Error reading samaj_events:", e);
    }
    return INITIAL_EVENTS;
  });

  // Unlocked profile contacts
  const [unlockedProfiles, setUnlockedProfiles] = useState<(number | string)[]>(() => {
    try {
      const stored = localStorage.getItem('unlocked_profiles');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error("Error reading unlocked_profiles:", e);
    }
    return [];
  });

  // Auth session
  const [authSession, setAuthSession] = useState<AuthSession | null>(() => {
    try {
      const stored = localStorage.getItem('user_auth_session');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error("Error reading user_auth_session:", e);
    }
    return null;
  });
  const authSessionRef = useRef<AuthSession | null>(authSession);
  authSessionRef.current = authSession;

  // Global Auth Listener to handle Redirect returns across Web & APK WebView
  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          const session: AuthSession = {
            method: 'Google',
            name: result.user.displayName || 'Google User',
            email: result.user.email || '',
            photoUrl: result.user.photoURL || '',
            loggedInAt: new Date().toISOString(),
            verified: result.user.emailVerified
          };
          setAuthSession(session);
          try {
            localStorage.setItem('user_auth_session', JSON.stringify(session));
            localStorage.setItem('device_google_account', JSON.stringify({
              name: session.name,
              email: session.email,
              photoUrl: session.photoUrl
            }));
          } catch (e) {
            console.error(e);
          }
          if (currentTabRef.current === 'signup') {
            navigateToTab('dashboard', { replace: true });
          }
        }
      })
      .catch((err) => console.warn('Redirect result check:', err?.code || err));

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const session: AuthSession = {
          method: 'Google',
          name: user.displayName || 'Google User',
          email: user.email || '',
          photoUrl: user.photoURL || '',
          loggedInAt: new Date().toISOString(),
          verified: user.emailVerified
        };
        setAuthSession(session);
        try {
          localStorage.setItem('user_auth_session', JSON.stringify(session));
          localStorage.setItem('device_google_account', JSON.stringify({
            name: session.name,
            email: session.email,
            photoUrl: session.photoUrl
          }));
        } catch (e) {
          console.error(e);
        }
        if (currentTabRef.current === 'signup') {
          navigateToTab('dashboard', { replace: true });
        }
      } else {
        const stored = localStorage.getItem('user_auth_session');
        if (!stored) {
          setAuthSession(null);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Profiles owned by the currently logged-in account (max 1 profile per login)
  const userOwnedProfiles = useMemo(() => {
    return profiles.filter(p => isProfileOwnedBySession(p, authSession));
  }, [profiles, authSession]);

  const hasRegisteredProfile = userOwnedProfiles.length > 0;

  // Profiles visible in public Matrimony / Kundali (respecting requireAdminVerification)
  const visiblePublicProfiles = useMemo(() => {
    if (!config.requireAdminVerification) return profiles;
    return profiles.filter((p) => p.verified !== false || isProfileOwnedBySession(p, authSession));
  }, [profiles, config.requireAdminVerification, authSession]);

  const handleUnlockProfile = (id: number | string) => {
    setUnlockedProfiles(prev => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      try {
        localStorage.setItem('unlocked_profiles', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const handleAddProfile = (newProfile: MatrimonyProfile): boolean => {
    if (!config.featureProfileCreationEnabled) {
      return false;
    }

    const ownerKey = getSessionOwnerKey(authSession);
    if (!authSession || !ownerKey) {
      return false;
    }

    // Strict constraint: User can add only 1 profile per login
    if (userOwnedProfiles.length >= 1) {
      return false;
    }

    const ownedProfile: MatrimonyProfile = {
      ...newProfile,
      verified: !config.requireAdminVerification,
      ownerId: ownerKey,
      ownerName: authSession.name || authSession.username || authSession.email || 'Member'
    };

    setProfiles(prev => [ownedProfile, ...prev]);
    try {
      const stored = localStorage.getItem('samaj_profiles');
      const userProfiles = stored ? JSON.parse(stored) : [];
      userProfiles.unshift(ownedProfile);
      localStorage.setItem('samaj_profiles', JSON.stringify(userProfiles));
    } catch (e) {
      console.error("Error saving profile:", e);
    }
    return true;
  };

  const handleAddQuickProfile = (partial: Partial<MatrimonyProfile>): boolean => {
    const cleanPhone = sanitizePhoneInput(partial.phone || partial.contact || authSession?.phone || '');
    const newProfile: MatrimonyProfile = {
      id: Date.now(),
      name: partial.name || 'Candidate',
      age: partial.age || 26,
      gender: partial.gender || 'Male',
      gotra: partial.gotra || 'Rathore',
      city: partial.city || 'Indore',
      state: partial.state || 'Madhya Pradesh',
      native: partial.native || partial.city || 'Indore',
      location: partial.location || `${partial.city || 'Indore'}, ${partial.state || 'Madhya Pradesh'}`,
      education: partial.education || 'Graduate',
      profession: partial.profession || 'Business / Professional',
      income: partial.income || 'Competitive',
      height: partial.height || "5' 6\"",
      familyDetails: partial.familyDetails || 'Respected Rathore Samaj family. Quick registration via portal.',
      about: partial.about || 'Well-settled respected Rathore Samaj family.',
      contact: partial.contact || cleanPhone,
      phone: cleanPhone,
      photo: partial.photo || (partial.gender === 'Female' 
        ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80" 
        : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80"),
      gallery: partial.gallery && partial.gallery.length > 0 ? partial.gallery : undefined,
      verified: true,
      createdAt: new Date().toISOString()
    };
    return handleAddProfile(newProfile);
  };

  const handleAddAd = (newAd: BusinessAd) => {
    setAds(prev => [newAd, ...prev]);
    try {
      const stored = localStorage.getItem('samaj_ads');
      const userAds = stored ? JSON.parse(stored) : [];
      userAds.unshift(newAd);
      localStorage.setItem('samaj_ads', JSON.stringify(userAds));
    } catch (e) {
      console.error("Error saving ad:", e);
    }
  };

  const handleAddQuickAd = (partial: Partial<BusinessAd>) => {
    const newAd: BusinessAd = {
      id: Date.now(),
      title: partial.title || 'New Samaj Business',
      owner: partial.owner || 'Samaj Business Owner',
      category: partial.category || 'Retail & Shopping',
      city: partial.city || 'Indore',
      address: partial.address || 'Main Market',
      phone: sanitizePhoneInput(partial.phone || authSession?.phone || ''),
      tagline: partial.tagline || 'Special Samaj Member Discount Available.',
      offer: partial.offer || '10% Discount for Samaj Members',
      rating: '5.0 ★',
      isFeatured: partial.isFeatured || false,
      adTier: partial.adTier,
      adPricePaid: partial.adPricePaid,
      banner: partial.banner || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80',
      createdAt: new Date().toISOString()
    };
    handleAddAd(newAd);
  };

  const handleAddEvent = (newEvent: SamajEvent) => {
    setEvents(prev => [newEvent, ...prev]);
    try {
      const stored = localStorage.getItem('samaj_events');
      const userEvents = stored ? JSON.parse(stored) : [...INITIAL_EVENTS];
      userEvents.unshift(newEvent);
      localStorage.setItem('samaj_events', JSON.stringify(userEvents));
    } catch (e) {
      console.error("Error saving event:", e);
    }
  };

  const handleUpdateProfile = (updatedProfile: MatrimonyProfile) => {
    setProfiles(prev => prev.map(p => p.id === updatedProfile.id ? updatedProfile : p));
    try {
      const stored = localStorage.getItem('samaj_profiles');
      const userProfiles: MatrimonyProfile[] = stored ? JSON.parse(stored) : [];
      const index = userProfiles.findIndex(p => p.id === updatedProfile.id);
      if (index >= 0) {
        userProfiles[index] = updatedProfile;
      } else {
        userProfiles.unshift(updatedProfile);
      }
      localStorage.setItem('samaj_profiles', JSON.stringify(userProfiles));
    } catch (e) {
      console.error("Error updating profile:", e);
    }
  };

  const handleDeleteProfile = (id: number | string) => {
    setProfiles(prev => prev.filter(p => p.id !== id));
    try {
      const stored = localStorage.getItem('samaj_profiles');
      if (stored) {
        const userProfiles: MatrimonyProfile[] = JSON.parse(stored);
        const remaining = userProfiles.filter(p => p.id !== id);
        localStorage.setItem('samaj_profiles', JSON.stringify(remaining));
      }
    } catch (e) {
      console.error("Error deleting profile:", e);
    }
  };

  const handleUpdateAd = (updatedAd: BusinessAd) => {
    setAds(prev => prev.map(a => a.id === updatedAd.id ? updatedAd : a));
    try {
      const stored = localStorage.getItem('samaj_ads');
      const userAds: BusinessAd[] = stored ? JSON.parse(stored) : [];
      const index = userAds.findIndex(a => a.id === updatedAd.id);
      if (index >= 0) {
        userAds[index] = updatedAd;
      } else {
        userAds.unshift(updatedAd);
      }
      localStorage.setItem('samaj_ads', JSON.stringify(userAds));
    } catch (e) {
      console.error("Error updating ad:", e);
    }
  };

  const handleDeleteAd = (id: number | string) => {
    setAds(prev => prev.filter(a => a.id !== id));
    try {
      const stored = localStorage.getItem('samaj_ads');
      if (stored) {
        const userAds: BusinessAd[] = JSON.parse(stored);
        const remaining = userAds.filter(a => a.id !== id);
        localStorage.setItem('samaj_ads', JSON.stringify(remaining));
      }
    } catch (e) {
      console.error("Error deleting ad:", e);
    }
  };

  const handleLogin = (session: AuthSession, redirectTab: TabType = 'dashboard') => {
    setAuthSession(session);
    try {
      localStorage.setItem('user_auth_session', JSON.stringify(session));
      if (session.method === 'Google' && session.email) {
        localStorage.setItem('device_google_account', JSON.stringify({
          name: session.name || session.email.split('@')[0],
          email: session.email,
          photoUrl: session.photoUrl || ''
        }));
      }
    } catch (e) {
      console.error(e);
    }
    navigateToTab(redirectTab, { replace: currentTabRef.current === 'signup' });
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem('user_auth_session');
      sessionStorage.clear();
      setAuthSession(null);
      await signOut(auth);
    } catch (e) {
      console.error("Logout error:", e);
    }
    navigateToTab('signup');
  };

  // Live broadcast banner from Admin config
  const broadcastMessage = config.isBroadcastActive && config.bannerBroadcastMessage
    ? config.bannerBroadcastMessage
    : null;

  const renderFeatureDisabledCard = (titleEn: string, titleHi: string) => (
    <div className="max-w-lg mx-auto my-10 bg-white rounded-3xl border border-amber-300 shadow-lg p-8 text-center space-y-4">
      <div className="w-14 h-14 bg-amber-100 text-amber-800 rounded-2xl mx-auto flex items-center justify-center border border-amber-300">
        <Lock className="w-7 h-7" />
      </div>
      <h2 className="text-xl font-serif font-bold text-stone-900">
        {t(`${titleEn} Temporarily Paused`, `${titleHi} अस्थायी रूप से बंद है`)}
      </h2>
      <p className="text-xs text-stone-600 leading-relaxed">
        {t(
          'This section has been temporarily turned off by Samaj Administration. Please check back shortly or explore other portal sections.',
          'यह सुविधा वर्तमान में समाज एडमिन द्वारा अस्थायी रूप से बंद की गई है। कृपया अन्य उपलब्ध अनुभाग देखें।'
        )}
      </p>
      <div className="flex flex-wrap justify-center gap-2 pt-2">
        {config.featureMatrimonyEnabled && (
          <button
            onClick={() => navigateToTab('matrimony')}
            className="bg-[#380812] text-amber-200 font-bold px-5 py-2.5 rounded-xl text-xs cursor-pointer"
          >
            {t('Return to Home', 'होम पर लौटें')}
          </button>
        )}
        {authSession?.username === 'AdminAbhi' && (
          <button
            onClick={() => navigateToTab('admin')}
            className="bg-amber-300 text-[#380812] font-bold px-5 py-2.5 rounded-xl text-xs cursor-pointer"
          >
            {t('Manage in Admin Console', 'एडमिन कंसोल में बदलें')}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen min-h-dvh overflow-x-clip bg-[#FDFBF7] text-stone-800 font-sans flex flex-col selection:bg-rose-100 selection:text-rose-950">
      <Header 
        currentTab={currentTab} 
        onSelectTab={navigateToTab} 
        authSession={authSession} 
        onLogout={handleLogout}
      />

      {backNotice && (
        <div className="fixed bottom-[calc(4.75rem+var(--sab))] left-1/2 -translate-x-1/2 z-50 max-w-[calc(100vw-2rem)] bg-stone-900/95 text-amber-100 px-4 py-2 rounded-xl text-xs font-semibold shadow-xl border border-amber-400/30 text-center">
          {t('You are on the Home screen.', 'आप मुख्य पृष्ठ (होम) पर हैं।')}
        </div>
      )}

      {broadcastMessage && (
        <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-stone-950 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-center border-b border-amber-600/30 shadow-xs flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-[#4c0d1b] shrink-0" />
          <span className="break-words">
            {broadcastMessage === DEFAULT_ADMIN_CONFIG.bannerBroadcastMessage
              ? t(
                  DEFAULT_ADMIN_CONFIG.bannerBroadcastMessage,
                  'जय माताजी की! राठौर रिश्ते पोर्टल में आपका स्वागत है। सभी समाज वैवाहिक बायोडाटा सत्यापित हैं।'
                )
              : broadcastMessage}
          </span>
        </div>
      )}

      {currentTab === 'matrimony' && (
        <HeroBanner 
          onNavigateTab={navigateToTab}
          authSession={authSession}
        />
      )}

      <main className="flex-1 max-w-7xl w-full min-w-0 mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8">
        {currentTab === 'matrimony' && (
          config.featureMatrimonyEnabled ? (
            <MatrimonyTab
              authSession={authSession}
              profiles={visiblePublicProfiles}
              unlockedProfiles={unlockedProfiles}
              hasRegisteredProfile={hasRegisteredProfile}
              onUnlockProfile={handleUnlockProfile}
              onNavigateTab={navigateToTab}
              onAddQuickProfile={handleAddQuickProfile}
              onSelectKundaliProfile={handleSelectKundaliProfile}
            />
          ) : (
            renderFeatureDisabledCard('Matrimony Directory', 'वैवाहिक बायोडाटा निर्देशिका')
          )
        )}

        {currentTab === 'kundali' && (
          config.featureKundaliEnabled ? (
            <KundaliMilanTab
              authSession={authSession}
              profiles={visiblePublicProfiles}
              onNavigateTab={navigateToTab}
              preselectedBoyId={kundaliBoyId}
              preselectedGirlId={kundaliGirlId}
            />
          ) : (
            renderFeatureDisabledCard('Kundali Milan', 'कुंडली मिलान')
          )
        )}

        {currentTab === 'dashboard' && (
          <DashboardTab
            authSession={authSession}
            profiles={profiles}
            onUpdateProfile={handleUpdateProfile}
            onAddProfile={handleAddProfile}
            onDeleteProfile={handleDeleteProfile}
            ads={ads}
            onUpdateAd={handleUpdateAd}
            onAddAd={handleAddAd}
            onDeleteAd={handleDeleteAd}
            onNavigateTab={navigateToTab}
            onLogout={handleLogout}
            onSelectKundaliProfile={handleSelectKundaliProfile}
          />
        )}

        {currentTab === 'directory' && (
          config.featureBusinessDirectoryEnabled ? (
            <BusinessTab 
              authSession={authSession}
              ads={ads} 
              onNavigateTab={navigateToTab} 
              onAddQuickAd={handleAddQuickAd} 
            />
          ) : (
            renderFeatureDisabledCard('Business Directory', 'व्यापार निर्देशिका')
          )
        )}

        {currentTab === 'booklet' && (
          config.featureBookletEnabled ? (
            <BookletTab onNavigateTab={navigateToTab} />
          ) : (
            renderFeatureDisabledCard('Digital E-Booklet', 'डिजिटल ई-पत्रिका')
          )
        )}

        {currentTab === 'events' && (
          config.featureEventsEnabled ? (
            <EventsTab 
              events={events} 
              onAddEvent={handleAddEvent}
              authSession={authSession}
            />
          ) : (
            renderFeatureDisabledCard('Samaj Events & Sammelans', 'समाज कार्यक्रम एवं सम्मेलन')
          )
        )}

        {currentTab === 'signup' && (
          <SignUpTab
            authSession={authSession}
            onLogin={handleLogin}
            onLogout={handleLogout}
            onNavigateTab={navigateToTab}
            hasRegisteredProfile={hasRegisteredProfile}
            unlockedCount={unlockedProfiles.length}
          />
        )}

        {currentTab === 'create-profile' && (
          config.featureProfileCreationEnabled ? (
            <CreateProfileTab 
              authSession={authSession}
              onLogin={handleLogin}
              onAddProfile={handleAddProfile} 
              onNavigateTab={navigateToTab}
              hasRegisteredProfile={hasRegisteredProfile}
              existingUserProfile={userOwnedProfiles[0] || null}
            />
          ) : (
            renderFeatureDisabledCard('Profile Creation', 'बायोडाटा निर्माण')
          )
        )}

        {currentTab === 'advertise-shop' && (
          config.featureBusinessDirectoryEnabled ? (
            <AdvertiseShopTab 
              authSession={authSession}
              onLogin={handleLogin}
              onAddAd={handleAddAd} 
              onNavigateTab={navigateToTab} 
            />
          ) : (
            renderFeatureDisabledCard('Advertise Shop', 'दुकान विज्ञापन')
          )
        )}

        {currentTab === 'guest-list' && (
          config.featureGuestListEnabled ? (
            <GuestListTab
              authSession={authSession}
              onNavigateTab={navigateToTab}
            />
          ) : (
            renderFeatureDisabledCard('Guest List Planner', 'अतिथि सूची प्लानर')
          )
        )}

        {currentTab === 'admin' && (
          <AdminDashboardTab
            profiles={profiles}
            ads={ads}
            onUpdateProfile={handleUpdateProfile}
            onDeleteProfile={handleDeleteProfile}
            onUpdateAd={handleUpdateAd}
            onDeleteAd={handleDeleteAd}
            onNavigateTab={navigateToTab}
          />
        )}

        {currentTab === 'family-details' && (
          config.featureProfileCreationEnabled ? (
            <FamilyDetailsTab
              authSession={authSession}
              onNavigateTab={navigateToTab}
              onAddQuickProfile={handleAddQuickProfile}
              hasRegisteredProfile={hasRegisteredProfile}
              existingUserProfile={userOwnedProfiles[0] || null}
            />
          ) : (
            renderFeatureDisabledCard('Family Details Registration', 'पारिवारिक विवरण पंजीकरण')
          )
        )}
      </main>

      <WhatsAppShare />
      <Footer onNavigateTab={navigateToTab} />
    </div>
  );
};

export default App;
