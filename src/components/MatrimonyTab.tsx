import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Search, GraduationCap, Briefcase, Eye, Phone, X, ShieldAlert, Sparkles, 
  UserPlus, Lock, ShieldCheck, ArrowRight, Users, Heart, 
  MessageCircle, Share2, Compass, Crown, MapPin, Ban,
  ChevronLeft, ChevronRight, Camera
} from 'lucide-react';
import { MatrimonyProfile, GenderType, TabType, AuthSession, ProfileAdmirer } from '../types';
import { ChatModal } from './ChatModal';
import { useLanguage } from '../context/LanguageContext';
import { useAdminConfig } from '../context/AdminConfigContext';
import { buildAppShareUrl, shareContent } from '../utils/shareAndPrint';
import { UserLocationData } from '../hooks/useUserLocation';
import {
  ProfileWithDistance,
  rankProfilesByLocation
} from '../utils/locationMatcher';
import { getUserStorageKey, isProfileOwnedBySession } from '../utils/profileOwnership';
import { FOUNDING_PROFILE_LIMIT } from './FoundingOfferCard';

interface MatrimonyTabProps {
  authSession: AuthSession | null;
  profiles: MatrimonyProfile[];
  unlockedProfiles: (number | string)[];
  hasRegisteredProfile: boolean;
  userLocation?: UserLocationData | null;
  onOpenLocationModal?: () => void;
  onUpdateSessionGender?: (gender: 'Male' | 'Female') => void;
  blockedProfileIds?: Set<string>;
  onBlockProfile?: (profile: MatrimonyProfile) => void;
  onUnblockProfile?: (id: number | string) => void;
  onUnlockProfile: (id: number | string) => void;
  onNavigateTab: (tab: TabType) => void;
  onAddQuickProfile: (profile: Partial<MatrimonyProfile>) => Promise<{ ok: boolean; error?: string }> | { ok: boolean; error?: string } | boolean | void;
  onSelectKundaliProfile?: (profileId: number | string, gender: 'Male' | 'Female') => void;
  onOpenDashboardChats?: () => void;
}

const FREE_LIMIT = 3;

const getCandidatePhotos = (p: MatrimonyProfile): string[] => {
  const fallback =
    p.gender === 'Female'
      ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
      : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80';

  const unique = Array.from(
    new Set(
      [p.photo, ...(p.gallery || [])]
        .map((url) => (typeof url === 'string' ? url.trim() : ''))
        .filter((url) => url !== '')
    )
  );

  return unique.length > 0 ? unique : [fallback];
};

export const MatrimonyTab: React.FC<MatrimonyTabProps> = ({
  authSession,
  profiles,
  unlockedProfiles,
  hasRegisteredProfile,
  userLocation = null,
  onOpenLocationModal,
  onUpdateSessionGender,
  blockedProfileIds,
  onBlockProfile,
  onUnblockProfile,
  onUnlockProfile,
  onNavigateTab,
  onAddQuickProfile,
  onSelectKundaliProfile,
  onOpenDashboardChats
}) => {
  const { lang, t } = useLanguage();
  const { config, userSubscription, activateUserSubscription } = useAdminConfig();
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState<GenderType>('all');
  const [gotraFilter, setGotraFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');

  // View Mode: 'all' | 'liked_by_me' | 'who_liked_me'
  const [viewMode, setViewMode] = useState<'all' | 'liked_by_me' | 'who_liked_me'>('all');

  // Active Chat Profile & Block confirmation state
  const [activeChatProfile, setActiveChatProfile] = useState<MatrimonyProfile | null>(null);
  const [pendingBlockProfile, setPendingBlockProfile] = useState<MatrimonyProfile | null>(null);
  const [recentBlockedNotice, setRecentBlockedNotice] = useState<{ id: number | string; name: string } | null>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subscriptionNotice, setSubscriptionNotice] = useState<string | null>(null);

  const admirersStorageKey = getUserStorageKey('samaj_profile_admirers', authSession);
  const likedStorageKey = getUserStorageKey('samaj_liked_profiles', authSession);

  // Admirers: Who Liked My Profile (starts at 0 for new users)
  const [admirers, setAdmirers] = useState<ProfileAdmirer[]>(() => {
    try {
      const stored = localStorage.getItem(admirersStorageKey);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // Persistent Likes State (scoped per user login so new users start with 0)
  const [likedProfiles, setLikedProfiles] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(likedStorageKey);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    try {
      const storedAdmirers = localStorage.getItem(admirersStorageKey);
      setAdmirers(storedAdmirers ? JSON.parse(storedAdmirers) : []);
    } catch {
      setAdmirers([]);
    }
    try {
      const storedLikes = localStorage.getItem(likedStorageKey);
      setLikedProfiles(storedLikes ? new Set(JSON.parse(storedLikes)) : new Set());
    } catch {
      setLikedProfiles(new Set());
    }
  }, [admirersStorageKey, likedStorageKey]);

  const [likeCounts, setLikeCounts] = useState<Record<string, number>>(() => {
    try {
      const stored = localStorage.getItem('samaj_profile_likes_counts');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const getProfileLikes = (id: number | string) => {
    const key = id.toString();
    if (likeCounts[key] !== undefined) return likeCounts[key];
    const numId = typeof id === 'number' ? id : parseInt(id as string, 10) || 5;
    return ((numId * 13 + 17) % 38) + 8;
  };

  const toggleLikeProfile = (id: number | string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const key = id.toString();
    const isLiked = likedProfiles.has(key);
    const newSet = new Set(likedProfiles);
    const currentCount = getProfileLikes(id);
    const newCounts = { ...likeCounts };

    if (isLiked) {
      newSet.delete(key);
      newCounts[key] = Math.max(0, currentCount - 1);
    } else {
      newSet.add(key);
      newCounts[key] = currentCount + 1;
    }

    setLikedProfiles(newSet);
    setLikeCounts(newCounts);
    try {
      localStorage.setItem(likedStorageKey, JSON.stringify(Array.from(newSet)));
      localStorage.setItem('samaj_profile_likes_counts', JSON.stringify(newCounts));
    } catch (err) {
      console.error(err);
    }
  };

  const buildProfileShareText = (p: MatrimonyProfile) =>
    lang === 'hi'
      ? `🚩 *राठौर रिश्ते - वैवाहिक बायोडाटा* 🚩

*प्रत्याशी:* ${p.name}
*आयु एवं कद:* ${p.age} वर्ष · ${p.height || "5' 6\""}
*गोत्र:* ${p.gotra}
*शहर एवं राज्य:* ${p.city}, ${p.state || 'भारत'}
*शिक्षा:* ${p.education}
${p.profession ? `*व्यवसाय:* ${p.profession}\n` : ''}${p.income ? `*मासिक/वार्षिक आय:* ${p.income}\n` : ''}*पारिवारिक विवरण:* ${p.familyDetails || 'प्रतिष्ठित राठौर समाज परिवार'}
${p.about ? `*अतिरिक्त जानकारी:* ${p.about}\n` : ''}${p.contact ? `*संपर्क सूत्र:* ${p.contact}` : ''}`.trim()
      : `🚩 *Rathore Rishtey - Matrimonial Biodata* 🚩

*Candidate:* ${p.name}
*Age & Height:* ${p.age} Yrs · ${p.height || "5' 6\""}
*Gotra:* ${p.gotra}
*City & State:* ${p.city}, ${p.state || 'India'}
*Education:* ${p.education}
${p.profession ? `*Profession:* ${p.profession}\n` : ''}${p.income ? `*Income:* ${p.income}\n` : ''}*Family:* ${p.familyDetails || 'Reputed Rathore Samaj Family'}
${p.about ? `*About:* ${p.about}\n` : ''}${p.contact ? `*Contact:* ${p.contact}` : ''}`.trim();

  // Selected Profile for Biodata Modal
  const [selectedProfileId, setSelectedProfileId] = useState<number | string | null>(null);
  const [modalPhotoIndex, setModalPhotoIndex] = useState<number>(0);

  const effectiveViewMode = config.featureLikesEnabled ? viewMode : 'all';

  const isAdminUser =
    authSession?.username === 'AdminAbhi' ||
    (authSession?.email || '').trim().toLowerCase() === 'abhiruchirathore97@gmail.com';
  const genderPrefStorageKey = getUserStorageKey('samaj_candidate_gender', authSession);
  const [storedCandidateGender, setStoredCandidateGender] = useState<'Male' | 'Female' | null>(() => {
    try {
      const val = localStorage.getItem(genderPrefStorageKey);
      return val === 'Male' || val === 'Female' ? val : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      const val = localStorage.getItem(genderPrefStorageKey);
      setStoredCandidateGender(val === 'Male' || val === 'Female' ? val : null);
    } catch {
      setStoredCandidateGender(null);
    }
  }, [genderPrefStorageKey]);

  const userOwnedProfile = useMemo(() => {
    if (!authSession) return null;
    return profiles.find((p) => isProfileOwnedBySession(p, authSession)) || null;
  }, [profiles, authSession]);

  const candidateGender: 'Male' | 'Female' | null = isAdminUser
    ? null
    : userOwnedProfile?.gender || authSession?.gender || storedCandidateGender || null;

  const oppositeGender: 'Male' | 'Female' | null =
    candidateGender === 'Female'
      ? 'Male'
      : candidateGender === 'Male'
        ? 'Female'
        : null;

  const handleSelectCandidateGender = (gender: 'Male' | 'Female') => {
    setStoredCandidateGender(gender);
    try {
      localStorage.setItem(genderPrefStorageKey, gender);
    } catch {
      // ignore storage errors
    }
    onUpdateSessionGender?.(gender);
  };

  const visibleAdmirers = useMemo(() => {
    if (!blockedProfileIds || blockedProfileIds.size === 0) return admirers;
    return admirers.filter((adm) => !blockedProfileIds.has(adm.id.toString()));
  }, [admirers, blockedProfileIds]);

  const unblockedProfiles = useMemo(() => {
    if (!blockedProfileIds || blockedProfileIds.size === 0) return profiles;
    return profiles.filter((p) => !blockedProfileIds.has(p.id.toString()));
  }, [profiles, blockedProfileIds]);

  const visibleLikedCount = useMemo(() => {
    return unblockedProfiles.filter((p) => likedProfiles.has(p.id.toString())).length;
  }, [unblockedProfiles, likedProfiles]);

  const matchPoolProfiles = useMemo(() => {
    if (!oppositeGender) return unblockedProfiles;
    return unblockedProfiles.filter((p) => p.gender === oppositeGender);
  }, [unblockedProfiles, oppositeGender]);

  const executeBlockProfile = useCallback(
    (profile: MatrimonyProfile) => {
      if (!authSession || !onBlockProfile) return;
      onBlockProfile(profile);
      setPendingBlockProfile(null);
      if (selectedProfileId === profile.id) {
        setSelectedProfileId(null);
      }
      if (activeChatProfile?.id === profile.id) {
        setActiveChatProfile(null);
      }
      setRecentBlockedNotice({ id: profile.id, name: profile.name });
    },
    [authSession, onBlockProfile, selectedProfileId, activeChatProfile]
  );

  const distanceMap = useMemo(() => {
    const map = new Map<string, ProfileWithDistance>();
    if (!userLocation) return map;
    const ranked = rankProfilesByLocation(
      unblockedProfiles,
      userLocation.coords,
      userLocation.city,
      userLocation.state
    );
    for (const item of ranked) {
      map.set(item.profile.id.toString(), item);
    }
    return map;
  }, [unblockedProfiles, userLocation]);

  const filteredProfiles = useMemo(() => {
    const effectiveGender: GenderType = oppositeGender || genderFilter;

    const matched = unblockedProfiles.filter(p => {
      // If user selected "Profiles I Liked", filter by likedProfiles
      if (effectiveViewMode === 'liked_by_me' && !likedProfiles.has(p.id.toString())) {
        return false;
      }

      const q = search.toLowerCase().trim();
      const matchSearch = !q || 
        p.name.toLowerCase().includes(q) || 
        (p.profession && p.profession.toLowerCase().includes(q)) || 
        (p.education && p.education.toLowerCase().includes(q)) ||
        (p.familyDetails && p.familyDetails.toLowerCase().includes(q)) ||
        (p.about && p.about.toLowerCase().includes(q));

      const matchGender = effectiveGender === 'all' || p.gender === effectiveGender;
      const matchGotra = !gotraFilter.trim() || p.gotra.toLowerCase().includes(gotraFilter.toLowerCase().trim());
      const matchCity = !cityFilter.trim() || p.city.toLowerCase().includes(cityFilter.toLowerCase().trim());

      return matchSearch && matchGender && matchGotra && matchCity;
    });

    if (userLocation) {
      return [...matched].sort((a, b) => {
        const infoA = distanceMap.get(a.id.toString());
        const infoB = distanceMap.get(b.id.toString());
        if (!infoA || !infoB) return 0;
        if (infoA.isSameCity !== infoB.isSameCity) return infoA.isSameCity ? -1 : 1;
        if (infoA.distanceKm !== null && infoB.distanceKm !== null) {
          return infoA.distanceKm - infoB.distanceKm;
        }
        if (infoA.distanceKm !== null) return -1;
        if (infoB.distanceKm !== null) return 1;
        if (infoA.isSameState !== infoB.isSameState) return infoA.isSameState ? -1 : 1;
        return 0;
      });
    }

    return matched;
  }, [unblockedProfiles, search, genderFilter, oppositeGender, gotraFilter, cityFilter, effectiveViewMode, likedProfiles, userLocation, distanceMap]);

  const activeProfile = useMemo(() => {
    if (selectedProfileId === null) return null;
    return profiles.find(p => p.id === selectedProfileId) || null;
  }, [profiles, selectedProfileId]);

  const verifiedProfilesCount = useMemo(
    () => profiles.filter((p) => p.verified !== false).length,
    [profiles]
  );
  const isFoundingLifetimeMember = hasRegisteredProfile && verifiedProfilesCount <= FOUNDING_PROFILE_LIMIT;

  const hasActivePaidSubscription = Boolean(userSubscription?.active) || isFoundingLifetimeMember;
  const isStrictPaywallActive = config.subscriptionEnabled && config.contactAccessMode === 'subscription_required';
  const isFreeOpenMode =
    isAdminUser ||
    hasActivePaidSubscription ||
    config.contactAccessMode === 'free' ||
    (!config.subscriptionEnabled && config.contactAccessMode === 'subscription_required');

  const clearModalHistoryEntry = useCallback(() => {
    if (typeof window !== 'undefined' && window.history.state?.biodataModalId !== undefined) {
      try {
        window.history.replaceState({ tab: 'matrimony' }, '', '#matrimony');
      } catch {
        // ignore history errors
      }
    }
  }, []);

  // Close Biodata modal gracefully when Android / browser Back button is pressed
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onPopState = (event: PopStateEvent) => {
      if (event.state?.biodataModalId === undefined) {
        setSelectedProfileId(null);
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const handleOpenProfile = (id: number | string) => {
    setModalPhotoIndex(0);
    setSelectedProfileId(id);
    if (typeof window !== 'undefined') {
      try {
        window.history.pushState({ tab: 'matrimony', biodataModalId: id }, '', '#matrimony');
      } catch {
        // ignore history errors
      }
    }
    if (isFreeOpenMode || isStrictPaywallActive) return;
    const isAlreadyUnlocked = unlockedProfiles.includes(id);
    const hasSlots = unlockedProfiles.length < FREE_LIMIT;
    if (!hasRegisteredProfile && !isAlreadyUnlocked && hasSlots) {
      onUnlockProfile(id);
    }
  };

  // Dismiss via X button or backdrop: pop our modal history entry cleanly
  const handleDismissModal = () => {
    setSelectedProfileId(null);
    if (typeof window !== 'undefined' && window.history.state?.biodataModalId !== undefined) {
      try {
        window.history.back();
      } catch {
        clearModalHistoryEntry();
      }
    }
  };

  // Close without calling history.back() when immediately navigating to another tab/modal
  const handleCloseModal = () => {
    setSelectedProfileId(null);
    clearModalHistoryEntry();
  };

  const isProfileAccessible = (id: number | string) => {
    if (isFreeOpenMode) return true;
    if (isStrictPaywallActive) return false;
    if (hasRegisteredProfile) return true;
    if (unlockedProfiles.includes(id)) return true;
    return unlockedProfiles.length < FREE_LIMIT;
  };

  const handleSelectPlan = (plan: 'annual' | 'lifetime') => {
    activateUserSubscription(plan);
    setShowSubscriptionModal(false);
    setSubscriptionNotice(
      plan === 'annual'
        ? t(`Annual Rishtey Pass (₹${config.annualPlanPrice}) activated! All verified contacts & chats are unlocked.`, `वार्षिक रिश्ते पास (₹${config.annualPlanPrice}) सक्रिय हो गया! अब सभी संपर्क और चैट अनलॉक हैं।`)
        : t(`Royal Lifetime Patron Plan (₹${config.lifetimePlanPrice}) activated!`, `रॉयल आजीवन संरक्षक प्लान (₹${config.lifetimePlanPrice}) सक्रिय हो गया!`)
    );
    setTimeout(() => setSubscriptionNotice(null), 5000);
  };

  const remainingFreeContacts = isStrictPaywallActive ? 0 : Math.max(0, FREE_LIMIT - unlockedProfiles.length);

  const formatDistanceLabel = (info?: ProfileWithDistance): string | null => {
    if (!info) return null;
    if (info.isSameCity) {
      return info.distanceKm !== null && info.distanceKm <= 25
        ? t(`~${Math.max(1, info.distanceKm)} km · Your Area`, `~${Math.max(1, info.distanceKm)} किमी · आपका क्षेत्र`)
        : t('In Your City', 'आपके शहर में');
    }
    if (info.distanceKm !== null) {
      return lang === 'hi' ? `लगभग ${info.distanceKm} किमी दूर` : `~${info.distanceKm} km away`;
    }
    if (info.isSameState) {
      return t('Same State', 'समान राज्य');
    }
    return null;
  };

  // IF USER IS NOT SIGNED IN: Show gate informing that profiles are visible after signing in
  if (!authSession) {
    return (
      <div className="space-y-6">
        {/* SIGN IN REQUIRED HERO CARD */}
        <div className="bg-white rounded-3xl shadow-xl border border-stone-200/90 overflow-hidden">
          <div className="bg-gradient-to-r from-[#24050b] via-[#380812] to-[#24050b] p-8 sm:p-10 text-white flex flex-col md:flex-row justify-between items-center gap-6 border-b border-amber-500/30">
            <div className="space-y-3 max-w-xl text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t('Samaj Privacy & Trust Protection', 'समाज गोपनीयता एवं विश्वास सुरक्षा')}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-amber-50">
                {t('Sign In to View Matrimony Biodatas', 'वैवाहिक बायोडाटा देखने के लिए साइन इन करें')}
              </h2>
              <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-light">
                {t(
                  'To respect the privacy of Rathore Samaj families and safeguard candidate contact details, biodata records are accessible to verified community members.',
                  'राठौर समाज के परिवारों की गोपनीयता और संपर्क विवरण की सुरक्षा के लिए, बायोडाटा केवल सत्यापित समाज सदस्यों के लिए उपलब्ध हैं।'
                )}
              </p>
            </div>

            <button
              onClick={() => onNavigateTab('signup')}
              className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-bold px-6 py-3.5 rounded-xl shadow-lg transition-all text-xs sm:text-sm shrink-0 flex items-center gap-2 cursor-pointer hover:scale-102"
            >
              <UserPlus className="w-4 h-4 text-stone-950" />
              <span>{t('Sign In / Register', 'लॉग इन / रजिस्टर करें')}</span>
            </button>
          </div>

          {/* COMMUNITY TRUST PILLARS */}
          <div className="p-6 md:p-8 bg-[#FAF8F5] grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-900 border border-amber-200/60 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5 text-amber-800" />
              </div>
              <h4 className="font-serif font-bold text-sm text-stone-900">{t('100% Samaj Verified', '100% समाज सत्यापित')}</h4>
              <p className="text-stone-600 leading-relaxed">
                {t(
                  'Biodatas screened for authentic Gotra lineage, education, and family background across MP, Maharashtra & beyond.',
                  'मध्यप्रदेश, महाराष्ट्र एवं अन्य राज्यों के प्रतिष्ठित परिवारों के गोत्र, शिक्षा व पारिवारिक पृष्ठभूमि की जाँच के साथ।'
                )}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-900 border border-amber-200/60 flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5 text-amber-800" />
              </div>
              <h4 className="font-serif font-bold text-sm text-stone-900">{t('3 Free Direct Contacts', '3 निःशुल्क सीधे संपर्क')}</h4>
              <p className="text-stone-600 leading-relaxed">
                {t(
                  'Immediately explore and unlock verified phone numbers for up to 3 candidates upon sign-in.',
                  'साइन इन करते ही आप 3 प्रत्याशियों के सत्यापित मोबाइल नंबर तुरंत देख और अनलॉक कर सकते हैं।'
                )}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-900 border border-amber-200/60 flex items-center justify-center font-bold">
                <Lock className="w-5 h-5 text-amber-800" />
              </div>
              <h4 className="font-serif font-bold text-sm text-stone-900">{t('Mutual Community Access', 'पारस्परिक समाज पहुंच')}</h4>
              <p className="text-stone-600 leading-relaxed">
                {t(
                  'Contribute your own family details to unlock unlimited biodatas and expand the community directory network.',
                  'असीमित बायोडाटा अनलॉक करने और समाज डायरेक्टरी नेटवर्क को बढ़ाने के लिए अपना पारिवारिक विवरण जोड़ें।'
                )}
              </p>
            </div>
          </div>
        </div>

        {/* SAMPLE TEASER CARDS (BLURRED PREVIEW) */}
        <div className="relative min-h-[300px] rounded-3xl overflow-hidden">
          <div className="absolute inset-0 z-10 backdrop-blur-xs bg-stone-900/35 flex flex-col items-center justify-center p-5 sm:p-6 rounded-3xl border border-amber-400/40 shadow-2xl text-center space-y-3">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-[#380812] to-[#24050b] text-amber-300 rounded-2xl flex items-center justify-center shadow-lg border border-amber-400/40 shrink-0">
              <Lock className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-white drop-shadow-sm">
              {t('Verified Samaj Biodatas Waiting Inside', 'सत्यापित समाज बायोडाटा देखें')}
            </h3>
            <p className="text-xs sm:text-sm text-stone-200 max-w-md drop-shadow-sm font-light">
              {t(
                'Sign in with your Google account or username to view verified candidate photos, educational credentials, and direct family contact numbers.',
                'प्रत्याशियों के फोटो, शैक्षणिक योग्यता और सीधे पारिवारिक संपर्क नंबर देखने के लिए Google या यूज़रनेम से साइन इन करें।'
              )}
            </p>
            <button
              onClick={() => onNavigateTab('signup')}
              className="bg-gradient-to-r from-amber-400 to-amber-300 text-stone-950 font-bold px-6 py-2.5 rounded-xl text-xs shadow-md flex items-center gap-2 cursor-pointer transition-transform hover:scale-105"
            >
              <span>{t('Unlock Directory Access', 'डायरेक्टरी एक्सेस अनलॉक करें')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Blurred Background Mock Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-30 filter blur-xs select-none pointer-events-none min-h-[300px]">
            {profiles.slice(0, 4).map((p) => (
              <div key={p.id} className="bg-white rounded-2xl p-6 border border-stone-200 flex gap-5">
                <div className="w-24 h-24 sm:w-28 sm:h-28 bg-stone-200 rounded-xl shrink-0"></div>
                <div className="space-y-2.5 flex-1">
                  <div className="h-5 bg-stone-300 rounded w-3/4"></div>
                  <div className="h-4 bg-stone-200 rounded w-1/2"></div>
                  <div className="h-4 bg-stone-200 rounded w-5/6"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // IF USER IS SIGNED IN: Full profiles view
  return (
    <div id="biodatas-section" className="space-y-6 scroll-mt-20">

      {/* QUICK GENDER PROMPT FOR ACCOUNTS WITHOUT GENDER YET (e.g. GOOGLE SIGN-IN BEFORE PROFILE) */}
      {!isAdminUser && candidateGender === null && (
        <div className="bg-amber-50/90 border border-amber-300/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div>
            <h4 className="font-serif font-bold text-sm text-[#380812]">
              {t('Select Your Candidate Gender to View Matches', 'उपयुक्त रिश्ते देखने हेतु प्रत्याशी का लिंग चुनें')}
            </h4>
            <p className="text-xs text-stone-600 mt-0.5">
              {t(
                'Female candidates are shown verified Male (Groom) profiles, and Male candidates are shown verified Female (Bride) profiles.',
                'महिला प्रत्याशी को केवल वर (पुरुष) बायोडाटा और पुरुष प्रत्याशी को केवल वधु (महिला) बायोडाटा दिखाए जाते हैं।'
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => handleSelectCandidateGender('Male')}
              className="flex-1 sm:flex-initial bg-[#380812] hover:bg-[#540e1b] text-amber-200 font-semibold text-xs px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
            >
              {t('I am Male (Show Brides)', 'मैं पुरुष हूँ (वधु देखें)')}
            </button>
            <button
              type="button"
              onClick={() => handleSelectCandidateGender('Female')}
              className="flex-1 sm:flex-initial bg-[#380812] hover:bg-[#540e1b] text-amber-200 font-semibold text-xs px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
            >
              {t('I am Female (Show Grooms)', 'मैं महिला हूँ (वर देखें)')}
            </button>
          </div>
        </div>
      )}

      {/* PRIMARY VIEWS: ALL MATCHING BIODATAS / PROFILES I LIKED / WHO LIKED MY PROFILE */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-2.5 rounded-2xl border border-stone-200/90 shadow-xs">
        <button
          onClick={() => setViewMode('all')}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            viewMode === 'all'
              ? 'bg-[#380812] text-amber-200 shadow-xs'
              : 'text-stone-700 hover:bg-stone-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>
            {oppositeGender === 'Male'
              ? t(`Male Profiles (${matchPoolProfiles.length})`, `वर बायोडाटा (${matchPoolProfiles.length})`)
              : oppositeGender === 'Female'
                ? t(`Female Profiles (${matchPoolProfiles.length})`, `वधु बायोडाटा (${matchPoolProfiles.length})`)
                : t(`All Bios (${unblockedProfiles.length})`, `सभी बायोडाटा (${unblockedProfiles.length})`)}
          </span>
        </button>

        <button
          onClick={() => setViewMode('liked_by_me')}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            viewMode === 'liked_by_me'
              ? 'bg-rose-700 text-white shadow-xs'
              : 'text-rose-800 bg-rose-50/70 hover:bg-rose-100 border border-rose-200/60'
          }`}
        >
          <Heart className={`w-4 h-4 ${viewMode === 'liked_by_me' ? 'fill-white text-white' : 'fill-rose-500 text-rose-500'}`} />
          <span>{t(`Profiles I Liked (${visibleLikedCount})`, `पसंद किए गए (${visibleLikedCount})`)}</span>
        </button>

        <button
          onClick={() => setViewMode('who_liked_me')}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            viewMode === 'who_liked_me'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300/70'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>{t(`Who Liked My Profile (${visibleAdmirers.length})`, `मेरी प्रोफ़ाइल किसने पसंद की (${visibleAdmirers.length})`)}</span>
        </button>
      </div>

      {/* RECENT BLOCKED CONFIRMATION TOAST WITH UNDO (SIGNED-IN ONLY) */}
      {authSession && recentBlockedNotice && (
        <div className="bg-stone-900 text-amber-100 px-4 py-3 rounded-2xl border border-amber-400/30 shadow-md flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Ban className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              {lang === 'hi'
                ? `${recentBlockedNotice.name} को ब्लॉक किया गया और आपकी सूची से हटाया गया।`
                : `${recentBlockedNotice.name} has been blocked and hidden from your feed.`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {onUnblockProfile && (
              <button
                type="button"
                onClick={() => {
                  onUnblockProfile(recentBlockedNotice.id);
                  setRecentBlockedNotice(null);
                }}
                className="text-amber-300 font-bold hover:underline cursor-pointer"
              >
                {t('Undo', 'वापस लें')}
              </button>
            )}
            <button
              type="button"
              onClick={() => setRecentBlockedNotice(null)}
              className="text-stone-400 hover:text-white cursor-pointer"
              aria-label={t('Dismiss', 'बंद करें')}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* SEARCH & FILTERS SECTION (WHEN IN ALL OR LIKED VIEW) */}
      {viewMode !== 'who_liked_me' && (
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200/90 p-3.5 sm:p-5 space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 justify-between items-stretch lg:items-center">
          
          {/* Search bar */}
          <div className="relative w-full lg:w-88">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('Search name, qualification, profession...', 'नाम, शिक्षा या व्यवसाय खोजें...')}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 text-sm bg-stone-50/50 transition-all"
            />
          </div>

          <div className="flex flex-wrap gap-2.5 items-center">
            {/* Gender Status / Filter: Opposite-gender matched automatically for candidates; Admin keeps All/Grooms/Brides */}
            {oppositeGender ? (
              <div className="flex items-center gap-2 bg-rose-50/90 border border-rose-200/80 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#380812]">
                <span>
                  {oppositeGender === 'Male'
                    ? t('Showing Male Profiles (Female Candidate)', 'वर प्रोफ़ाइल (महिला प्रत्याशी हेतु)')
                    : t('Showing Female Profiles (Male Candidate)', 'वधु प्रोफ़ाइल (पुरुष प्रत्याशी हेतु)')}
                </span>
                {!userOwnedProfile && (
                  <button
                    type="button"
                    onClick={() => handleSelectCandidateGender(candidateGender === 'Female' ? 'Male' : 'Female')}
                    className="text-[11px] font-bold text-[#851834] hover:underline cursor-pointer"
                  >
                    {t('Switch', 'बदलें')}
                  </button>
                )}
              </div>
            ) : (
              <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200/80">
                <button
                  onClick={() => setGenderFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    genderFilter === 'all'
                      ? 'bg-[#380812] text-amber-200 shadow-xs'
                      : 'text-stone-700 hover:text-stone-900'
                  }`}
                >
                  {t('All', 'समस्त')}
                </button>
                <button
                  onClick={() => setGenderFilter('Male')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    genderFilter === 'Male'
                      ? 'bg-[#380812] text-amber-200 shadow-xs'
                      : 'text-stone-700 hover:text-stone-900'
                  }`}
                >
                  {t('Grooms', 'वर')}
                </button>
                <button
                  onClick={() => setGenderFilter('Female')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    genderFilter === 'Female'
                      ? 'bg-[#380812] text-amber-200 shadow-xs'
                      : 'text-stone-700 hover:text-stone-900'
                  }`}
                >
                  {t('Brides', 'वधु')}
                </button>
              </div>
            )}

            {/* Gotra Filter */}
            <input
              type="text"
              value={gotraFilter}
              onChange={(e) => setGotraFilter(e.target.value)}
              placeholder={t('Filter Gotra...', 'गोत्र फ़िल्टर करें...')}
              className="px-3.5 py-2 rounded-xl border border-stone-200 text-xs flex-1 min-w-[130px] sm:flex-initial sm:w-36 focus:outline-none focus:ring-2 focus:ring-amber-500/50 bg-stone-50/50"
            />

            {/* City Filter */}
            <input
              type="text"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              placeholder={t('Filter City...', 'शहर फ़िल्टर करें...')}
              className="px-3.5 py-2 rounded-xl border border-stone-200 text-xs flex-1 min-w-[130px] sm:flex-initial sm:w-36 focus:outline-none focus:ring-2 focus:ring-amber-500/50 bg-stone-50/50"
            />

            {/* Compact Standard Location Sharing Trigger */}
            {onOpenLocationModal && (
              <button
                type="button"
                onClick={onOpenLocationModal}
                className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                  userLocation
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100/70'
                    : 'bg-amber-50 border-amber-300/70 text-[#380812] hover:bg-amber-100/70'
                }`}
              >
                <MapPin className={`w-3.5 h-3.5 shrink-0 ${userLocation ? 'text-emerald-600' : 'text-[#6e1628]'}`} />
                <span>
                  {userLocation
                    ? `${userLocation.city}`
                    : t('Location Permission', 'लोकेशन अनुमति')}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Counter */}
        <div className="flex flex-col sm:flex-row justify-between items-center text-xs text-stone-500 pt-3 border-t border-stone-100 gap-2">
          <span className="font-medium text-stone-600">
            {lang === 'hi' ? (
              <><strong className="text-stone-900">{filteredProfiles.length}</strong> सत्यापित राठौर समाज {oppositeGender === 'Male' ? 'वर ' : oppositeGender === 'Female' ? 'वधु ' : ''}बायोडाटा दिखाए जा रहे हैं</>
            ) : (
              <>Showing <strong className="text-stone-900">{filteredProfiles.length}</strong> verified Rathore Samaj {oppositeGender === 'Male' ? 'Male (Groom) ' : oppositeGender === 'Female' ? 'Female (Bride) ' : ''}Biodatas</>
            )}
          </span>
        </div>
      </div>
      )}

      {/* WHO LIKED MY PROFILE SECTION */}
      {viewMode === 'who_liked_me' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-amber-50 via-amber-100/40 to-stone-50 p-5 sm:p-6 rounded-3xl border border-amber-300/80 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-lg sm:text-xl text-stone-900">
                  {t('Who Liked My Profile', 'प्रोफ़ाइल प्रशंसक एवं रिश्ते प्रस्ताव')}
                </h3>
                <span className="text-xs bg-[#380812] text-amber-200 font-bold px-2.5 py-0.5 rounded-full">
                  {visibleAdmirers.length} {t('Samaj Families', 'समाज परिवार')}
                </span>
              </div>
              <p className="text-xs text-stone-600 mt-1 max-w-2xl leading-relaxed">
                {t(
                  'These verified Rathore Samaj candidates & families recently liked your published profile and expressed interest in connecting for matrimonial alliance.',
                  'इन सत्यापित राठौर समाज परिवारों ने हाल ही में आपका प्रोफ़ाइल पसंद किया है और वैवाहिक संबंध के लिए संपर्क करना चाहते हैं।'
                )}
              </p>
            </div>
            {!hasRegisteredProfile && (
              <button
                onClick={() => onNavigateTab('family-details')}
                className="bg-[#380812] hover:bg-[#540e1b] text-amber-200 text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors cursor-pointer shrink-0 shadow-xs flex items-center gap-1.5"
              >
                <Users className="w-3.5 h-3.5 text-amber-300" />
                <span>{t('Register Family Details for More Inquiries', 'अधिक प्रस्तावों के लिए परिवार विवरण जोड़ें')}</span>
              </button>
            )}
          </div>

          {visibleAdmirers.length === 0 ? (
            <div className="bg-white rounded-3xl border border-amber-200/80 p-8 sm:p-12 text-center space-y-3 shadow-xs">
              <div className="w-14 h-14 bg-amber-50 rounded-2xl mx-auto flex items-center justify-center border border-amber-200">
                <Sparkles className="w-7 h-7 text-amber-600" />
              </div>
              <h4 className="font-serif font-bold text-base sm:text-lg text-stone-900">
                {t('No Admirers Yet', 'अभी तक कोई प्रशंसक नहीं')}
              </h4>
              <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
                {t(
                  'When verified Rathore Samaj families like your published profile, their alliance requests will appear here.',
                  'जब सत्यापित राठौर समाज परिवार आपका प्रकाशित प्रोफ़ाइल पसंद करेंगे, तो उनके रिश्ते प्रस्ताव यहाँ दिखाई देंगे।'
                )}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleAdmirers.map((adm) => {
                const candidateProfile: MatrimonyProfile = {
                  id: adm.id,
                  name: adm.admirerName,
                  age: adm.admirerAge,
                  gender: 'Male',
                  gotra: adm.admirerGotra,
                  city: adm.admirerCity,
                  education: adm.admirerEducation,
                  profession: adm.admirerProfession || 'Professional',
                  contact: adm.admirerPhone,
                  photo: adm.admirerPhoto,
                  familyDetails: `Respected Rathore family from ${adm.admirerCity}`
                };

                return (
                  <div 
                    key={adm.id}
                    className="bg-white rounded-3xl border border-amber-200/90 hover:border-amber-400 p-5 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-4 group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center gap-3.5">
                        <img 
                          src={adm.admirerPhoto || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80"}
                          alt={adm.admirerName}
                          className="w-14 h-14 rounded-2xl object-cover object-top border-2 border-amber-300 shadow-xs shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-serif font-bold text-stone-900 text-base truncate group-hover:text-[#380812] transition-colors">
                              {adm.admirerName}
                            </h4>
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          </div>
                          <p className="text-xs text-stone-600 font-medium break-words">
                            {t('Gotra:', 'गोत्र:')} {adm.admirerGotra} · {adm.admirerCity}
                          </p>
                          <span className="text-[10px] text-rose-600 font-bold flex items-center gap-1 mt-0.5">
                            <Heart className="w-3 h-3 fill-rose-500 text-rose-500 shrink-0" /> <span className="truncate">{t(`Liked your profile ${adm.likedAt}`, `प्रोफ़ाइल पसंद किया (${adm.likedAt})`)}</span>
                          </span>
                        </div>
                      </div>

                      <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80 text-xs space-y-1">
                        <p className="text-stone-700 font-medium break-words">
                          <strong>{t('Qualification:', 'योग्यता:')}</strong> {adm.admirerEducation}
                        </p>
                        {adm.admirerProfession && (
                          <p className="text-stone-700 font-medium break-words">
                            <strong>{t('Profession:', 'व्यवसाय:')}</strong> {adm.admirerProfession}
                          </p>
                        )}
                        {adm.message && (
                          <div className="mt-2 pt-2 border-t border-stone-200/70 text-[11px] text-amber-950 bg-amber-50/70 p-2.5 rounded-xl italic break-words">
                            &quot;{adm.message}&quot;
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-stone-100 flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setActiveChatProfile(candidateProfile)}
                        className="flex-1 min-w-[140px] bg-gradient-to-r from-[#380812] to-[#540e1b] hover:from-[#24050b] hover:to-[#380812] text-amber-200 text-xs font-semibold py-2.5 px-3 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-amber-500/20 whitespace-nowrap"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                        <span>{t('Chat with Family', 'परिवार से चैट करें')}</span>
                      </button>

                      {onSelectKundaliProfile && (
                        <button
                          onClick={() => onSelectKundaliProfile(candidateProfile.id, candidateProfile.gender)}
                          title={t('Kundali Milan (36 Gun)', 'कुंडली मिलान (३६ गुण)')}
                          className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 text-xs font-semibold py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 shrink-0 whitespace-nowrap"
                        >
                          <Compass className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                          <span>{t('Milan', 'मिलान')}</span>
                        </button>
                      )}

                      <a
                        href={`tel:${adm.admirerPhone}`}
                        title={`${t('Call', 'कॉल करें')} ${adm.admirerName} (${adm.admirerPhone})`}
                        className="p-2.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs transition-colors cursor-pointer shrink-0 inline-flex items-center justify-center"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-700" />
                      </a>

                      {authSession && onBlockProfile && (
                        <button
                          type="button"
                          onClick={() => setPendingBlockProfile(candidateProfile)}
                          title={t(`Block ${adm.admirerName}`, `${adm.admirerName} को ब्लॉक करें`)}
                          aria-label={t(`Block ${adm.admirerName}`, `${adm.admirerName} को ब्लॉक करें`)}
                          className="p-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs transition-colors cursor-pointer shrink-0 inline-flex items-center justify-center"
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* UNREGISTERED FAMILY BANNER PROMPT */}
      {!hasRegisteredProfile && (
        <div className="bg-gradient-to-r from-amber-50 via-amber-100/40 to-stone-50 border border-amber-300/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-3 text-[#380812]">
            <div className="w-8 h-8 rounded-full bg-amber-200/80 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-amber-900" />
            </div>
            <div>
              <p className="font-bold text-stone-900">{t('Unlock Unlimited Community Contacts', 'असीमित समाज संपर्क अनलॉक करें')}</p>
              <p className="text-stone-600">
                {lang === 'hi' ? (
                  <>आपके पास <strong>3 में से {remainingFreeContacts} निःशुल्क व्यू</strong> शेष हैं। असीमित बायोडाटा देखने के लिए अपने परिवार का विवरण दर्ज करें!</>
                ) : (
                  <>You have <strong>{remainingFreeContacts} of 3 free view unlocks</strong> remaining. Register your family details to browse without limits!</>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('family-details')}
            className="bg-[#380812] hover:bg-[#540e1b] text-amber-200 font-semibold px-4 py-2 rounded-xl text-xs shrink-0 shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-amber-300" />
            <span>{t('Add Family Details', 'परिवार का विवरण जोड़ें')}</span>
          </button>
        </div>
      )}

      {/* MATRIMONY CARDS GRID (OR EMPTY LIKED STATE) */}
      {viewMode === 'liked_by_me' && filteredProfiles.length === 0 ? (
        <div className="bg-white rounded-3xl border border-stone-200 p-10 text-center space-y-4 max-w-lg mx-auto shadow-sm">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl mx-auto flex items-center justify-center border border-rose-200">
            <Heart className="w-8 h-8 fill-rose-500 text-rose-500" />
          </div>
          <h3 className="font-serif font-bold text-xl text-stone-900">{t('No Liked Profiles Yet', 'अभी कोई प्रोफ़ाइल पसंद नहीं की गई है')}</h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            {t(
              "You haven't liked any matrimonial profiles yet. Tap the heart (❤️) icon on any candidate card to save their biodata here for easy family discussions, direct chat, and Kundali Milan.",
              'आपने अभी तक किसी भी वैवाहिक प्रोफ़ाइल को पसंद नहीं किया है। किसी भी प्रत्याशी के कार्ड पर दिल (❤️) के आइकन पर टैप करके उसे यहाँ सहेजें।'
            )}
          </p>
          <button
            onClick={() => setViewMode('all')}
            className="bg-[#380812] hover:bg-[#24050b] text-amber-200 text-xs font-bold px-5 py-2.5 rounded-xl transition-colors cursor-pointer"
          >
            {t('Browse All Profiles', 'सभी प्रोफ़ाइल देखें')}
          </button>
        </div>
      ) : filteredProfiles.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200/90 p-12 text-center text-stone-500">
          <p className="text-base font-serif font-bold text-stone-800">{t('No profiles found matching your search filters.', 'आपके खोज फ़िल्टर से मेल खाती कोई प्रोफ़ाइल नहीं मिली।')}</p>
          <p className="text-xs text-stone-500 mt-1">{t('Try clearing your search keyword, gotra, or city filter.', 'खोज शब्द, गोत्र या शहर का फ़िल्टर साफ़ करके पुनः प्रयास करें।')}</p>
          <button
            onClick={() => { setSearch(''); setGenderFilter('all'); setGotraFilter(''); setCityFilter(''); }}
            className="mt-4 bg-gradient-to-r from-amber-400 to-amber-300 text-stone-950 font-bold px-4 py-2 rounded-xl text-xs shadow-xs cursor-pointer hover:scale-102 transition-transform"
          >
            {t('Reset Filters', 'फ़िल्टर रीसेट करें')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-5">
          {filteredProfiles.map((p) => {
            const candidatePhotos = getCandidatePhotos(p);
            const photoUrl = candidatePhotos[0];
            const distLabel = formatDistanceLabel(distanceMap.get(p.id.toString()));
            const isLiked = likedProfiles.has(p.id.toString());

            return (
              <div
                key={p.id}
                onClick={() => handleOpenProfile(p.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleOpenProfile(p.id);
                  }
                }}
                className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-200 border border-stone-200/90 hover:border-amber-400/60 p-3 sm:p-4 flex flex-row items-stretch gap-3.5 sm:gap-4 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/60"
              >
                {/* Uncropped Portrait Photo Frame */}
                <div className="relative w-[104px] sm:w-[132px] aspect-[3/4] rounded-xl overflow-hidden bg-stone-100 border border-stone-200/80 shrink-0 self-center">
                  {/* Subtle blurred color-matched backdrop prevents harsh letterboxing without cropping */}
                  <img
                    src={photoUrl}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full object-cover scale-110 blur-md opacity-25 pointer-events-none"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <img
                    src={photoUrl}
                    alt={p.name}
                    referrerPolicy="no-referrer"
                    className="relative z-10 w-full h-full object-contain object-center transition-transform duration-300 group-hover:scale-[1.02]"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = p.gender === 'Female'
                        ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"
                        : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80";
                    }}
                  />

                  {candidatePhotos.length > 1 && (
                    <span className="absolute bottom-1.5 right-1.5 z-20 bg-black/70 text-amber-200 text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 backdrop-blur-xs">
                      <Camera className="w-2.5 h-2.5 text-amber-300" />
                      {candidatePhotos.length}
                    </span>
                  )}
                </div>

                {/* Compact Basic Details & Single Primary CTA */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 gap-2.5">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base sm:text-lg font-serif font-bold text-stone-900 group-hover:text-[#380812] transition-colors leading-snug line-clamp-1">
                        {p.name}
                      </h3>
                      <ShieldCheck
                        className="w-4 h-4 text-amber-600 shrink-0 mt-0.5"
                        aria-label={t('Verified Samaj Biodata', 'सत्यापित समाज बायोडाटा')}
                      />
                    </div>

                    <p className="text-xs text-stone-700 font-medium truncate">
                      {p.age} {t('Yrs', 'वर्ष')} · {p.height || "5' 6\""} · {t('Gotra:', 'गोत्र:')} {p.gotra}
                    </p>

                    <p className="text-xs text-stone-500 flex items-center gap-1 min-w-0">
                      <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span className="truncate">
                        {p.city}{p.state ? `, ${p.state}` : ''}
                      </span>
                    </p>

                    {distLabel && (
                      <p className="text-[11px] text-emerald-700 font-semibold truncate">
                        {distLabel}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-stone-100 mt-auto">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenProfile(p.id);
                      }}
                      className="flex-1 min-h-[40px] bg-gradient-to-r from-[#380812] to-[#540e1b] hover:from-[#24050b] hover:to-[#380812] text-amber-200 text-xs font-semibold py-2 px-3 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-amber-500/20 whitespace-nowrap"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                      <span>{t('View Biodata', 'बायोडाटा देखें')}</span>
                    </button>

                    {config.featureLikesEnabled && (
                      <button
                        type="button"
                        onClick={(e) => toggleLikeProfile(p.id, e)}
                        title={isLiked ? t('Liked', 'पसंद किया') : t('Like biodata', 'बायोडाटा पसंद करें')}
                        aria-label={isLiked ? t('Unlike biodata', 'पसंद हटाएं') : t('Like biodata', 'बायोडाटा पसंद करें')}
                        className={`min-h-[40px] px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer shrink-0 ${
                          isLiked
                            ? 'bg-rose-50 border-rose-300 text-rose-700'
                            : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 shrink-0 ${isLiked ? 'fill-rose-500 text-rose-500' : 'text-stone-500'}`} />
                        <span className="tabular-nums">{getProfileLikes(p.id)}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FULL BIODATA DETAIL MODAL */}
      {activeProfile && (
        <div 
          className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-start sm:items-center justify-center px-3 sm:px-4 pt-[calc(0.75rem+var(--sat))] pb-[calc(1rem+var(--sab))] overflow-y-auto animate-in fade-in duration-200"
          onClick={handleDismissModal}
        >
          <div 
            className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-7 shadow-2xl border border-amber-300/80 relative my-auto max-h-[90dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={handleDismissModal} 
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1 rounded-full transition-colors cursor-pointer z-20"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {isProfileAccessible(activeProfile.id) ? (
              <div className="space-y-4">
                {/* Traditional Sacred Heading */}
                <div className="text-center pb-2 border-b border-stone-100">
                  <p className="text-[11px] font-serif text-amber-800 font-medium tracking-widest">
                    ॥ शुभ विवाह • वर-वधु परिचय पत्र ॥
                  </p>
                </div>

                {/* Status Bar */}
                <div className="flex items-center justify-between bg-amber-50/80 p-2.5 rounded-xl text-xs font-semibold text-amber-950 border border-amber-200/60">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                    <span>
                      {hasRegisteredProfile
                        ? t('Status: Unlocked (Family Details Registered)', 'स्थिति: अनलॉक्ड (परिवार विवरण पंजीकृत)')
                        : t(`Free Contacts Left: ${remainingFreeContacts}`, `शेष निःशुल्क संपर्क: ${remainingFreeContacts}`)}
                    </span>
                  </span>
                  <span className="text-stone-500 hidden sm:inline text-[11px]">{t('Rathore Samaj Verified', 'राठौर समाज सत्यापित')}</span>
                </div>

                {/* Profile Header with Uncropped Multi-Photo Viewer */}
                {(() => {
                  const modalPhotos = getCandidatePhotos(activeProfile);
                  const safeIdx = modalPhotoIndex % modalPhotos.length;
                  const activePhotoUrl = modalPhotos[safeIdx];

                  return (
                    <div className="space-y-3 pt-1">
                      <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 items-center sm:items-start">
                        <div className="relative w-44 sm:w-40 aspect-[3/4] rounded-2xl overflow-hidden border-2 border-amber-400 shadow-md shrink-0 bg-stone-100">
                          <img
                            src={activePhotoUrl}
                            alt=""
                            aria-hidden="true"
                            className="absolute inset-0 w-full h-full object-cover scale-110 blur-md opacity-25 pointer-events-none"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          <img 
                            src={activePhotoUrl} 
                            alt={activeProfile.name}
                            referrerPolicy="no-referrer"
                            className="relative z-10 w-full h-full object-contain object-center"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = activeProfile.gender === 'Female'
                                ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"
                                : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80";
                            }}
                          />
                          {modalPhotos.length > 1 && (
                            <>
                              <button
                                type="button"
                                onClick={() => setModalPhotoIndex((safeIdx - 1 + modalPhotos.length) % modalPhotos.length)}
                                aria-label="Previous candidate photo"
                                className="absolute left-1.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer"
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setModalPhotoIndex((safeIdx + 1) % modalPhotos.length)}
                                aria-label="Next candidate photo"
                                className="absolute right-1.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                              <span className="absolute bottom-1.5 right-1.5 z-20 bg-black/70 text-amber-200 text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                                {safeIdx + 1}/{modalPhotos.length}
                              </span>
                            </>
                          )}
                        </div>

                        <div className="w-full min-w-0 text-center sm:text-left space-y-1">
                          {/* ZERO PILL LINE */}
                          <p className="text-xs text-amber-800 font-semibold tracking-wide">
                            {t('Gotra:', 'गोत्र:')} {activeProfile.gotra} · {activeProfile.city}, {activeProfile.state || t('India', 'भारत')}
                          </p>

                          <h2 className="text-2xl font-bold font-serif text-stone-900 break-words">
                            {activeProfile.name}
                          </h2>
                          <p className="text-xs text-stone-600 font-medium">
                            {t('Age:', 'आयु:')} {activeProfile.age} {t('Yrs', 'वर्ष')} {activeProfile.dob ? `(${t('DOB:', 'जन्म तिथि:')} ${activeProfile.dob})` : ''} · {t('Height:', 'कद:')} {activeProfile.height || "5' 6\""} · {activeProfile.gender === 'Male' ? t('Male', 'वर (पुरुष)') : t('Female', 'वधु (महिला)')}
                          </p>
                          {activeProfile.income && activeProfile.income.trim() !== '' && activeProfile.income !== '---' && activeProfile.income !== 'Not specified' && (
                            <p className="text-xs text-emerald-800 font-bold">
                              {t('Package / Income:', 'आय:')} {activeProfile.income}
                            </p>
                          )}
                        </div>
                      </div>

                      {modalPhotos.length > 1 && (
                        <div className="flex items-center gap-2 overflow-x-auto pb-1">
                          {modalPhotos.map((thumbUrl, thumbIdx) => (
                            <button
                              key={thumbIdx}
                              type="button"
                              onClick={() => setModalPhotoIndex(thumbIdx)}
                              className={`relative w-14 h-16 rounded-xl overflow-hidden border-2 shrink-0 cursor-pointer transition-all bg-stone-100 ${
                                thumbIdx === safeIdx
                                  ? 'border-[#380812] ring-2 ring-amber-400 scale-102'
                                  : 'border-stone-200 opacity-75 hover:opacity-100'
                              }`}
                            >
                              <img
                                src={thumbUrl}
                                alt={`${activeProfile.name} photo ${thumbIdx + 1}`}
                                className="w-full h-full object-contain object-center"
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Details box */}
                <div className="space-y-3 border-t border-stone-100 pt-3 text-xs">
                  <div className={`grid grid-cols-1 ${activeProfile.profession && activeProfile.profession.trim() !== '' && activeProfile.profession !== '---' && activeProfile.profession !== 'Not specified' ? 'sm:grid-cols-2' : ''} gap-2.5 bg-stone-50 p-3.5 rounded-xl border border-stone-200/80`}>
                    <div className="flex items-start gap-2">
                      <GraduationCap className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-stone-500 font-medium">{t('Education:', 'शिक्षा:')}</span>
                        <p className="font-semibold text-stone-800 mt-0.5">{activeProfile.education}</p>
                      </div>
                    </div>
                    {activeProfile.profession && activeProfile.profession.trim() !== '' && activeProfile.profession !== '---' && activeProfile.profession !== 'Not specified' && (
                      <div className="flex items-start gap-2">
                        <Briefcase className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-stone-500 font-medium">{t('Profession:', 'व्यवसाय:')}</span>
                          <p className="font-semibold text-stone-800 mt-0.5">{activeProfile.profession}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {activeProfile.familyDetails && (
                    <div className="bg-amber-50/50 p-3.5 rounded-xl border border-amber-200/60 space-y-1">
                      <span className="text-amber-900 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-amber-700" />
                        {t('Full Family Details:', 'पारिवारिक विवरण:')}
                      </span>
                      <p className="font-medium text-stone-800 leading-relaxed">{activeProfile.familyDetails}</p>
                    </div>
                  )}

                  {activeProfile.about && (
                    <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80 space-y-1">
                      <span className="text-stone-500 font-bold uppercase text-[10px] tracking-wider">
                        {t('Additional Lineage & Notes:', 'अतिरिक्त वंश एवं परिचय:')}
                      </span>
                      <p className="font-medium text-stone-800 leading-relaxed">{activeProfile.about}</p>
                    </div>
                  )}

                  {/* Kundali Milan Shortcut */}
                  {config.featureKundaliEnabled && onSelectKundaliProfile && (
                    <button
                      onClick={() => {
                        const candidateId = activeProfile.id;
                        const candidateGender = activeProfile.gender;
                        handleCloseModal();
                        onSelectKundaliProfile(candidateId, candidateGender);
                      }}
                      className="w-full bg-gradient-to-r from-amber-500/15 via-amber-400/20 to-amber-500/15 hover:from-amber-500/25 hover:to-amber-400/30 border border-amber-300 text-amber-950 font-bold p-3 rounded-xl flex items-center justify-between text-xs transition-all cursor-pointer group shadow-2xs"
                    >
                      <span className="flex items-center gap-2">
                        <Compass className="w-4 h-4 text-amber-700 group-hover:rotate-45 transition-transform" />
                        <span>{t(`Match Kundali with ${activeProfile.name}`, `${activeProfile.name} के साथ कुंडली मिलान (वैदिक ३६ गुण)`)}</span>
                      </span>
                      <span className="text-[11px] bg-[#380812] text-amber-200 px-2.5 py-1 rounded-lg font-semibold">
                        {t('Check Milan →', 'मिलान देखें →')}
                      </span>
                    </button>
                  )}

                  {/* Contact & Social Sharing Details */}
                  <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider">
                        {t('Verified Contact Numbers:', 'सत्यापित संपर्क नंबर:')}
                      </span>
                      <p className="text-emerald-950 font-extrabold text-sm mt-0.5">{activeProfile.contact}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                      {config.featureChatEnabled && (
                        <button
                          onClick={() => {
                            const prof = activeProfile;
                            handleCloseModal();
                            setActiveChatProfile(prof);
                          }}
                          className="bg-gradient-to-r from-[#380812] to-[#540e1b] hover:from-[#24050b] hover:to-[#380812] text-amber-200 font-semibold px-3.5 py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer border border-amber-500/20"
                          title={t('Chat with candidate family', 'परिवार से चैट करें')}
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-amber-300" />
                          <span>{t('Chat with Family', 'परिवार से चैट')}</span>
                        </button>
                      )}

                      {config.featureLikesEnabled && (
                        <button
                          onClick={(e) => toggleLikeProfile(activeProfile.id, e)}
                          className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                            likedProfiles.has(activeProfile.id.toString())
                              ? 'bg-rose-50 border-rose-300 text-rose-700'
                              : 'bg-white border-stone-300 text-stone-700 hover:bg-stone-100'
                          }`}
                          title={t('Like biodata', 'बायोडाटा पसंद करें')}
                        >
                          <Heart className={`w-3.5 h-3.5 ${likedProfiles.has(activeProfile.id.toString()) ? 'fill-rose-500 text-rose-500' : 'text-stone-500'}`} />
                          <span>{getProfileLikes(activeProfile.id)}</span>
                        </button>
                      )}

                      {config.featureWhatsAppShareEnabled && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            void shareContent({
                              title: `${activeProfile.name} · ${activeProfile.gotra} Gotra — Rathore Rishtey`,
                              text: buildProfileShareText(activeProfile),
                              url: buildAppShareUrl('matrimony', { profile: activeProfile.id })
                            });
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold px-3 py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-colors touch-manipulation select-none"
                          title={t('Share biodata', 'बायोडाटा साझा करें')}
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>{t('Share', 'साझा करें')}</span>
                        </button>
                      )}

                      <a 
                        href={`tel:${activeProfile.contact.split(',')[0].trim()}`} 
                        className="flex-1 sm:flex-initial bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-4 py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Phone className="w-3.5 h-3.5" /> {t('Call Family', 'कॉल करें')}
                      </a>

                      {authSession && onBlockProfile && (
                        <button
                          type="button"
                          onClick={() => setPendingBlockProfile(activeProfile)}
                          className="bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700 font-semibold px-3 py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                          title={t(`Block ${activeProfile.name}`, `${activeProfile.name} को ब्लॉक करें`)}
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>{t('Block Profile', 'प्रोफ़ाइल ब्लॉक करें')}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Free limit reached / Subscription paywall dialog */
              <div className="text-center space-y-4 py-4">
                <div className="w-16 h-16 bg-amber-100 rounded-2xl mx-auto flex items-center justify-center shadow-inner border border-amber-300">
                  {config.subscriptionEnabled ? (
                    <Crown className="w-8 h-8 text-amber-800" />
                  ) : (
                    <ShieldAlert className="w-8 h-8 text-amber-800" />
                  )}
                </div>
                <h3 className="text-2xl font-serif font-bold text-stone-900">
                  {config.subscriptionEnabled
                    ? isStrictPaywallActive
                      ? t('Samaj Subscription Required', 'समाज सब्सक्रिप्शन आवश्यक है')
                      : t('Free View Limit Reached', 'निःशुल्क व्यू सीमा समाप्त')
                    : t('Free View Limit Reached', 'निःशुल्क व्यू सीमा समाप्त')}
                </h3>
                <p className="text-xs text-stone-600 max-w-sm mx-auto leading-relaxed">
                  {config.subscriptionEnabled
                    ? t(
                        'Activate an active Samaj Membership Pass below to unlock verified family phone numbers and direct chat without limits.',
                        'सत्यापित पारिवारिक संपर्क नंबर और सीधी चैट अनलॉक करने के लिए नीचे से एक सक्रिय सदस्यता प्लान चुनें।'
                      )
                    : t(
                        'You have viewed 3 free biodatas. To view unlimited community profiles and support fellow Rathore families, please register your family details on our dedicated page.',
                        'आपने 3 निःशुल्क बायोडाटा देख लिए हैं। असीमित समाज प्रोफ़ाइल देखने के लिए, कृपया अपना पारिवारिक विवरण दर्ज करें।'
                      )}
                </p>

                {config.subscriptionEnabled && (config.annualPlanEnabled || config.lifetimePlanEnabled) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left max-w-md mx-auto pt-1">
                    {config.annualPlanEnabled && (
                      <div className="p-4 rounded-2xl border-2 border-amber-300 bg-amber-50/60 space-y-2 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-bold uppercase text-amber-900 block">
                            {t('Annual Rishtey Pass', 'वार्षिक रिश्ते पास')}
                          </span>
                          <p className="text-2xl font-serif font-bold text-stone-900">
                            ₹{config.annualPlanPrice} <span className="text-[11px] font-normal text-stone-500">/ {t('Yr', 'वर्ष')}</span>
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSelectPlan('annual')}
                          className="w-full bg-[#380812] hover:bg-[#24050b] text-amber-200 font-bold py-2 rounded-xl text-xs cursor-pointer"
                        >
                          {t('Activate Annual', 'वार्षिक प्लान लें')}
                        </button>
                      </div>
                    )}

                    {config.lifetimePlanEnabled && (
                      <div className="p-4 rounded-2xl border-2 border-stone-300 bg-stone-50 space-y-2 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-bold uppercase text-stone-700 block">
                            {t('Lifetime Patron', 'आजीवन संरक्षक')}
                          </span>
                          <p className="text-2xl font-serif font-bold text-stone-900">
                            ₹{config.lifetimePlanPrice} <span className="text-[11px] font-normal text-stone-500">{t('Lifetime', 'आजीवन')}</span>
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSelectPlan('lifetime')}
                          className="w-full bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold py-2 rounded-xl text-xs cursor-pointer"
                        >
                          {t('Activate Lifetime', 'आजीवन प्लान लें')}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {!isStrictPaywallActive && config.featureProfileCreationEnabled && (
                  <button 
                    onClick={() => {
                      handleCloseModal();
                      onNavigateTab('family-details');
                    }} 
                    className="w-full max-w-sm mx-auto bg-gradient-to-r from-[#380812] to-[#540e1b] hover:from-[#24050b] hover:to-[#380812] text-amber-200 font-bold py-3 rounded-xl shadow-md block text-xs cursor-pointer transition-all border border-amber-400/30"
                  >
                    {t('📝 Open Add Family Details Page (Unlock Unlimited Access)', '📝 परिवार विवरण दर्ज करें (असीमित एक्सेस अनलॉक करें)')}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBSCRIPTION PLANS POPUP MODAL */}
      {showSubscriptionModal && config.subscriptionEnabled && (
        <div
          className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-xs flex items-start sm:items-center justify-center px-3 sm:px-4 pt-[calc(0.75rem+var(--sat))] pb-[calc(1rem+var(--sab))] overflow-y-auto"
          onClick={() => setShowSubscriptionModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-7 shadow-2xl border-2 border-amber-300 relative space-y-5 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowSubscriptionModal(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 bg-[#380812] text-amber-300 rounded-2xl mx-auto flex items-center justify-center">
                <Crown className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-serif font-bold text-stone-900">
                {t('Rathore Rishtey Membership Plans', 'राठौर रिश्ते सदस्यता योजनाएँ')}
              </h3>
              <p className="text-xs text-stone-600">
                {t('Unlock all verified biodata contacts, family chat & Kundali reports.', 'सभी सत्यापित संपर्क नंबर, परिवार चैट और कुंडली मिलान अनलॉक करें।')}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {config.annualPlanEnabled && (
                <div className="border-2 border-amber-300 rounded-2xl p-5 bg-amber-50/40 space-y-3 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold uppercase text-amber-900">{t('Annual Pass', 'वार्षिक पास')}</span>
                    <p className="text-3xl font-serif font-bold text-stone-900">
                      ₹{config.annualPlanPrice} <span className="text-xs font-normal text-stone-500">/ {t('Yr', 'वर्ष')}</span>
                    </p>
                    <ul className="text-[11px] text-stone-700 space-y-1 pt-2">
                      <li>✅ {t('Unlimited Contact Unlocks', 'असीमित संपर्क अनलॉक')}</li>
                      <li>✅ {t('Direct Family Chat Access', 'परिवार से सीधी चैट')}</li>
                      <li>✅ {t('Verified Samaj Directory', 'सत्यापित समाज निर्देशिका')}</li>
                    </ul>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectPlan('annual')}
                    className="w-full bg-[#380812] hover:bg-[#24050b] text-amber-200 font-bold py-2.5 rounded-xl text-xs cursor-pointer"
                  >
                    {t(`Choose Annual (₹${config.annualPlanPrice})`, `वार्षिक चुनें (₹${config.annualPlanPrice})`)}
                  </button>
                </div>
              )}

              {config.lifetimePlanEnabled && (
                <div className="border-2 border-stone-300 rounded-2xl p-5 bg-stone-50 space-y-3 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold uppercase text-stone-700">{t('Lifetime Patron', 'आजीवन संरक्षक')}</span>
                    <p className="text-3xl font-serif font-bold text-stone-900">
                      ₹{config.lifetimePlanPrice} <span className="text-xs font-normal text-stone-500">{t('One-Time', 'एकमुश्त')}</span>
                    </p>
                    <ul className="text-[11px] text-stone-700 space-y-1 pt-2">
                      <li>👑 {t('Lifetime Family Access', 'पूरे परिवार हेतु आजीवन पहुंच')}</li>
                      <li>👑 {t('Free Commercial Shop Ad', 'निःशुल्क व्यापार विज्ञापन')}</li>
                      <li>👑 {t('VIP Kundali Consultation', 'VIP कुंडली परामर्श')}</li>
                    </ul>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectPlan('lifetime')}
                    className="w-full bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold py-2.5 rounded-xl text-xs cursor-pointer"
                  >
                    {t(`Choose Lifetime (₹${config.lifetimePlanPrice})`, `आजीवन चुनें (₹${config.lifetimePlanPrice})`)}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* BLOCK PROFILE CONFIRMATION MODAL (SIGNED-IN ONLY) */}
      {authSession && pendingBlockProfile && onBlockProfile && (
        <div
          className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center px-4 py-6 animate-in fade-in duration-200"
          onClick={() => setPendingBlockProfile(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-rose-200 space-y-4 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
              <Ban className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-serif font-bold text-lg text-stone-900">
                {t(`Block ${pendingBlockProfile.name}?`, `क्या ${pendingBlockProfile.name} को ब्लॉक करें?`)}
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                {t(
                  'Once blocked, this profile will no longer appear in your match directory, liked lists, or chat suggestions. You can unblock them anytime from Dashboard Settings.',
                  'ब्लॉक करने के बाद यह प्रोफ़ाइल आपकी खोज, पसंद सूची और चैट में नहीं दिखेगी। आप डैशबोर्ड सेटिंग्स से कभी भी अनब्लॉक कर सकते हैं।'
                )}
              </p>
            </div>
            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setPendingBlockProfile(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 text-xs font-semibold cursor-pointer"
              >
                {t('Cancel', 'रद्द करें')}
              </button>
              <button
                type="button"
                onClick={() => executeBlockProfile(pendingBlockProfile)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>{t('Block Profile', 'ब्लॉक करें')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INTERACTIVE CHAT MODAL */}
      {activeChatProfile && config.featureChatEnabled && (
        <ChatModal
          profile={activeChatProfile}
          authSession={authSession}
          onClose={() => setActiveChatProfile(null)}
          onSelectKundaliProfile={config.featureKundaliEnabled ? onSelectKundaliProfile : undefined}
          onNavigateToSignIn={() => {
            setActiveChatProfile(null);
            onNavigateTab('signup');
          }}
          onOpenInbox={() => {
            setActiveChatProfile(null);
            if (onOpenDashboardChats) {
              onOpenDashboardChats();
            } else {
              onNavigateTab('dashboard');
            }
          }}
          isBlocked={blockedProfileIds?.has(activeChatProfile.id.toString()) ?? false}
          onBlockProfile={authSession && onBlockProfile ? executeBlockProfile : undefined}
          onUnblockProfile={authSession ? onUnblockProfile : undefined}
        />
      )}
    </div>
  );
};
