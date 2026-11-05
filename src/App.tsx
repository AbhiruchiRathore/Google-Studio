import React, { useState, useEffect } from 'react';
import { TabType, MatrimonyProfile, BusinessAd, SamajEvent, AuthSession } from './types';
import { INITIAL_PROFILES, INITIAL_ADS, INITIAL_EVENTS } from './data/mockData';
import { Header } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { MatrimonyTab } from './components/MatrimonyTab';
import { BusinessTab } from './components/BusinessTab';
import { BookletTab } from './components/BookletTab';
import { EventsTab } from './components/EventsTab';
import SignUpTab from './components/SignUpTab';
import { CreateProfileTab } from './components/CreateProfileTab';
import { AdvertiseShopTab } from './components/AdvertiseShopTab';
import { FamilyDetailsTab } from './components/FamilyDetailsTab';
import { DashboardTab } from './components/DashboardTab';
import { WhatsAppShare } from './components/WhatsAppShare';
import { Footer } from './components/Footer';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<TabType>('matrimony');

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

  // Global Auth Listener to handle Redirect returns across Web & APK WebView
  useEffect(() => {
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
        } catch (e) {
          console.error(e);
        }
        setCurrentTab(prev => (prev === 'signup' ? 'dashboard' : prev));
      } else {
        const stored = localStorage.getItem('user_auth_session');
        if (!stored) {
          setAuthSession(null);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Has registered profile
  const [hasRegisteredProfile, setHasRegisteredProfile] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('samaj_profiles');
      if (stored) {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) && parsed.length > 0;
      }
    } catch (e) {
      console.error("Error checking registered profile:", e);
    }
    return false;
  });

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

  const handleAddProfile = (newProfile: MatrimonyProfile) => {
    setProfiles(prev => [newProfile, ...prev]);
    setHasRegisteredProfile(true);
    try {
      const stored = localStorage.getItem('samaj_profiles');
      const userProfiles = stored ? JSON.parse(stored) : [];
      userProfiles.unshift(newProfile);
      localStorage.setItem('samaj_profiles', JSON.stringify(userProfiles));
    } catch (e) {
      console.error("Error saving profile:", e);
    }
  };

  const handleAddQuickProfile = (partial: Partial<MatrimonyProfile>) => {
    const newProfile: MatrimonyProfile = {
      id: Date.now(),
      name: partial.name || 'Candidate',
      age: partial.age || 26,
      gender: partial.gender || 'Male',
      gotra: partial.gotra || 'Rathore',
      city: partial.city || 'Indore',
      state: 'Madhya Pradesh',
      education: partial.education || 'Graduate',
      profession: partial.profession || 'Business / Professional',
      income: 'Competitive',
      height: "5' 6\"",
      familyDetails: 'Respected Rathore Samaj family. Quick registration via portal.',
      contact: partial.contact || '+91 9800000000',
      photo: partial.gender === 'Female' 
        ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80" 
        : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
      verified: true,
      createdAt: new Date().toISOString()
    };
    handleAddProfile(newProfile);
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
      phone: partial.phone || '+91 98260 00000',
      tagline: partial.tagline || 'Special Samaj Member Discount Available.',
      offer: partial.offer || '10% Discount for Samaj Members',
      rating: '5.0 ★',
      isFeatured: partial.isFeatured || false,
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

  const handleLogin = (session: AuthSession) => {
    setAuthSession(session);
    try {
      localStorage.setItem('user_auth_session', JSON.stringify(session));
    } catch (e) {
      console.error(e);
    }
    setCurrentTab('dashboard');
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
    setCurrentTab('signup');
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-800 font-sans flex flex-col selection:bg-rose-100 selection:text-rose-950">
      <Header 
        currentTab={currentTab} 
        onSelectTab={setCurrentTab} 
        authSession={authSession} 
        onLogout={handleLogout}
      />

      {currentTab === 'matrimony' && (
        <HeroBanner 
          onNavigateTab={setCurrentTab}
          authSession={authSession}
        />
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentTab === 'matrimony' && (
          <MatrimonyTab
            authSession={authSession}
            profiles={profiles}
            unlockedProfiles={unlockedProfiles}
            hasRegisteredProfile={hasRegisteredProfile}
            onUnlockProfile={handleUnlockProfile}
            onNavigateTab={setCurrentTab}
            onAddQuickProfile={handleAddQuickProfile}
          />
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
            onNavigateTab={setCurrentTab}
            onLogout={handleLogout}
          />
        )}

        {currentTab === 'directory' && (
          <BusinessTab 
            authSession={authSession}
            ads={ads} 
            onNavigateTab={setCurrentTab} 
            onAddQuickAd={handleAddQuickAd} 
          />
        )}

        {currentTab === 'booklet' && (
          <BookletTab onNavigateTab={setCurrentTab} />
        )}

        {currentTab === 'events' && (
          <EventsTab 
            events={events} 
            onAddEvent={handleAddEvent} 
          />
        )}

        {currentTab === 'signup' && (
          <SignUpTab
            authSession={authSession}
            onLogin={handleLogin}
            onLogout={handleLogout}
            onNavigateTab={setCurrentTab}
            hasRegisteredProfile={hasRegisteredProfile}
            unlockedCount={unlockedProfiles.length}
          />
        )}

        {currentTab === 'create-profile' && (
          <CreateProfileTab 
            authSession={authSession}
            onLogin={handleLogin}
            onAddProfile={handleAddProfile} 
            onNavigateTab={setCurrentTab} 
          />
        )}

        {currentTab === 'advertise-shop' && (
          <AdvertiseShopTab 
            authSession={authSession}
            onLogin={handleLogin}
            onAddAd={handleAddAd} 
            onNavigateTab={setCurrentTab} 
          />
        )}

        {currentTab === 'family-details' && (
          <FamilyDetailsTab
            authSession={authSession}
            onNavigateTab={setCurrentTab}
            onAddQuickProfile={handleAddQuickProfile}
            hasRegisteredProfile={hasRegisteredProfile}
          />
        )}
      </main>

      <WhatsAppShare />
      <Footer onNavigateTab={setCurrentTab} />
    </div>
  );
};

export default App;
