import React, { useState, useMemo } from 'react';
import { 
  Search, GraduationCap, Briefcase, Eye, Phone, X, ShieldAlert, Sparkles, 
  UserPlus, Lock, ShieldCheck, ArrowRight, Users, Heart, 
  MessageCircle, Share2, Compass
} from 'lucide-react';
import { MatrimonyProfile, GenderType, TabType, AuthSession, ProfileAdmirer } from '../types';
import { ChatModal } from './ChatModal';
import { useLanguage } from '../context/LanguageContext';

interface MatrimonyTabProps {
  authSession: AuthSession | null;
  profiles: MatrimonyProfile[];
  unlockedProfiles: (number | string)[];
  hasRegisteredProfile: boolean;
  onUnlockProfile: (id: number | string) => void;
  onNavigateTab: (tab: TabType) => void;
  onAddQuickProfile: (profile: Partial<MatrimonyProfile>) => void;
  onSelectKundaliProfile?: (profileId: number | string, gender: 'Male' | 'Female') => void;
}

const FREE_LIMIT = 3;

export const MatrimonyTab: React.FC<MatrimonyTabProps> = ({
  authSession,
  profiles,
  unlockedProfiles,
  hasRegisteredProfile,
  onUnlockProfile,
  onNavigateTab,
  onAddQuickProfile,
  onSelectKundaliProfile
}) => {
  const { lang, t } = useLanguage();
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState<GenderType>('all');
  const [gotraFilter, setGotraFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');

  // View Mode: 'all' | 'liked_by_me' | 'who_liked_me'
  const [viewMode, setViewMode] = useState<'all' | 'liked_by_me' | 'who_liked_me'>('all');

  // Active Chat Profile for interactive messaging
  const [activeChatProfile, setActiveChatProfile] = useState<MatrimonyProfile | null>(null);

  // Admirers: Who Liked My Profile
  const [admirers] = useState<ProfileAdmirer[]>(() => {
    try {
      const stored = localStorage.getItem('samaj_profile_admirers');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'adm-1',
        admirerName: 'Vikramaditya Singh Rathore',
        admirerGotra: 'Pindoriya',
        admirerCity: 'Indore, MP',
        admirerAge: 28,
        admirerEducation: 'B.Tech, IIT Bombay',
        admirerProfession: 'Senior Software Architect',
        admirerPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        admirerPhone: '9826012345',
        likedAt: '2 hours ago',
        message: 'Respectful greetings. We liked your family biodata and wish to discuss matrimonial alliance.'
      },
      {
        id: 'adm-2',
        admirerName: 'Harshwardhan Kishor Rathore',
        admirerGotra: 'Indruke',
        admirerCity: 'Nanded, MH',
        admirerAge: 27,
        admirerEducation: 'Chartered Accountant (CA)',
        admirerProfession: 'Financial Consultant',
        admirerPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
        admirerPhone: '9420348499',
        likedAt: 'Yesterday',
        message: 'Family matches our Gotra criteria. Requesting parent-to-parent conversation.'
      },
      {
        id: 'adm-3',
        admirerName: 'Rajveer Pradeep Rathore',
        admirerGotra: 'Shekhawat',
        admirerCity: 'Beed, MH',
        admirerAge: 29,
        admirerEducation: 'B.E., M.B.A.',
        admirerProfession: 'Business Enterprise Partner',
        admirerPhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
        admirerPhone: '9359607476',
        likedAt: '3 days ago',
        message: 'Auspicious alliance inquiry. Please connect on chat or phone.'
      }
    ];
  });

  // Persistent Likes State (works for existing and future profiles)
  const [likedProfiles, setLikedProfiles] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('samaj_liked_profiles');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

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
      localStorage.setItem('samaj_liked_profiles', JSON.stringify(Array.from(newSet)));
      localStorage.setItem('samaj_profile_likes_counts', JSON.stringify(newCounts));
    } catch (err) {
      console.error(err);
    }
  };

  const shareProfileWhatsApp = (p: MatrimonyProfile, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const text = lang === 'hi'
      ? `🚩 *राठौर रिश्ते - वैवाहिक बायोडाटा* 🚩

*प्रत्याशी:* ${p.name}
*आयु एवं कद:* ${p.age} वर्ष · ${p.height || "5' 6\""}
*गोत्र:* ${p.gotra}
*शहर एवं राज्य:* ${p.city}, ${p.state || 'भारत'}
*शिक्षा:* ${p.education}
${p.profession ? `*व्यवसाय:* ${p.profession}\n` : ''}${p.income ? `*मासिक/वार्षिक आय:* ${p.income}\n` : ''}*पारिवारिक विवरण:* ${p.familyDetails || 'प्रतिष्ठित राठौर समाज परिवार'}
${p.about ? `*अतिरिक्त जानकारी:* ${p.about}\n` : ''}*संपर्क सूत्र:* ${p.contact}

✨ *राठौर रिश्ते पोर्टल पर पूरा प्रोफ़ाइल और कुंडली मिलान देखें:*
https://svayaa.com/
_Powered by Svayaa_`
      : `🚩 *Rathore Rishtey - Matrimonial Biodata* 🚩

*Candidate:* ${p.name}
*Age & Height:* ${p.age} Yrs · ${p.height || "5' 6\""}
*Gotra:* ${p.gotra}
*City & State:* ${p.city}, ${p.state || 'India'}
*Education:* ${p.education}
${p.profession ? `*Profession:* ${p.profession}\n` : ''}${p.income ? `*Income:* ${p.income}\n` : ''}*Family:* ${p.familyDetails || 'Reputed Rathore Samaj Family'}
${p.about ? `*About:* ${p.about}\n` : ''}*Contact:* ${p.contact}

✨ *View full profile & Kundali Milan on Rathore Rishtey Portal:*
https://svayaa.com/
_Powered by Svayaa_`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Selected Profile for Biodata Modal
  const [selectedProfileId, setSelectedProfileId] = useState<number | string | null>(null);

  const filteredProfiles = useMemo(() => {
    return profiles.filter(p => {
      // If user selected "Profiles I Liked", filter by likedProfiles
      if (viewMode === 'liked_by_me' && !likedProfiles.has(p.id.toString())) {
        return false;
      }

      const q = search.toLowerCase().trim();
      const matchSearch = !q || 
        p.name.toLowerCase().includes(q) || 
        (p.profession && p.profession.toLowerCase().includes(q)) || 
        (p.education && p.education.toLowerCase().includes(q)) ||
        (p.familyDetails && p.familyDetails.toLowerCase().includes(q)) ||
        (p.about && p.about.toLowerCase().includes(q));

      const matchGender = genderFilter === 'all' || p.gender === genderFilter;
      const matchGotra = !gotraFilter.trim() || p.gotra.toLowerCase().includes(gotraFilter.toLowerCase().trim());
      const matchCity = !cityFilter.trim() || p.city.toLowerCase().includes(cityFilter.toLowerCase().trim());

      return matchSearch && matchGender && matchGotra && matchCity;
    });
  }, [profiles, search, genderFilter, gotraFilter, cityFilter, viewMode, likedProfiles]);

  const activeProfile = useMemo(() => {
    if (selectedProfileId === null) return null;
    return profiles.find(p => p.id === selectedProfileId) || null;
  }, [profiles, selectedProfileId]);

  const handleOpenProfile = (id: number | string) => {
    setSelectedProfileId(id);
    const isAlreadyUnlocked = unlockedProfiles.includes(id);
    const hasSlots = unlockedProfiles.length < FREE_LIMIT;
    if (!hasRegisteredProfile && !isAlreadyUnlocked && hasSlots) {
      onUnlockProfile(id);
    }
  };

  const handleCloseModal = () => {
    setSelectedProfileId(null);
  };

  const isProfileAccessible = (id: number | string) => {
    if (hasRegisteredProfile) return true;
    if (unlockedProfiles.includes(id)) return true;
    return unlockedProfiles.length < FREE_LIMIT;
  };

  const remainingFreeContacts = Math.max(0, FREE_LIMIT - unlockedProfiles.length);

  // IF USER IS NOT SIGNED IN: Show gate informing that profiles are visible after signing in
  if (!authSession) {
    return (
      <div className="space-y-8">
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
        <div className="relative">
          <div className="absolute inset-0 z-10 backdrop-blur-xs bg-stone-900/30 flex flex-col items-center justify-center p-6 rounded-3xl border border-amber-400/40 shadow-2xl text-center space-y-3">
            <div className="w-16 h-16 bg-gradient-to-br from-[#380812] to-[#24050b] text-amber-300 rounded-2xl flex items-center justify-center shadow-lg border border-amber-400/40">
              <Lock className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-serif font-bold text-white drop-shadow-sm">
              {t('450+ Verified Samaj Biodatas', '450+ सत्यापित समाज बायोडाटा')}
            </h3>
            <p className="text-xs sm:text-sm text-stone-200 max-w-md drop-shadow-sm font-light">
              {t(
                'Sign in with your Google account or mobile number to view verified candidate photos, educational credentials, and direct family contact numbers.',
                'प्रत्याशियों के फोटो, शैक्षणिक योग्यता और सीधे पारिवारिक संपर्क नंबर देखने के लिए Google या मोबाइल नंबर से साइन इन करें।'
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-30 filter blur-xs select-none pointer-events-none">
            {profiles.slice(0, 4).map((p) => (
              <div key={p.id} className="bg-white rounded-2xl p-6 border border-stone-200 flex gap-5">
                <div className="w-28 h-28 bg-stone-200 rounded-xl"></div>
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
    <div className="space-y-6">
      {/* PRIMARY VIEWS: ALL BIODATAS / PROFILES I LIKED / WHO LIKED MY PROFILE */}
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
          <span>{t(`All Bios (${profiles.length})`, `सभी बायोडाटा (${profiles.length})`)}</span>
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
          <span>{t(`Profiles I Liked (${likedProfiles.size})`, `पसंद किए गए (${likedProfiles.size})`)}</span>
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
          <span>{t(`Who Liked My Profile (${admirers.length})`, `मेरी प्रोफ़ाइल किसने पसंद की (${admirers.length})`)}</span>
        </button>
      </div>

      {/* SEARCH & FILTERS SECTION (WHEN IN ALL OR LIKED VIEW) */}
      {viewMode !== 'who_liked_me' && (
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200/90 p-5 sm:p-6 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
          
          {/* Search bar */}
          <div className="relative w-full lg:w-96">
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
            {/* Gender Segmented Switch */}
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

            {/* Gotra Filter */}
            <input
              type="text"
              value={gotraFilter}
              onChange={(e) => setGotraFilter(e.target.value)}
              placeholder={t('Filter Gotra...', 'गोत्र फ़िल्टर करें...')}
              className="px-3.5 py-2 rounded-xl border border-stone-200 text-xs w-36 focus:outline-none focus:ring-2 focus:ring-amber-500/50 bg-stone-50/50"
            />

            {/* City Filter */}
            <input
              type="text"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              placeholder={t('Filter City...', 'शहर फ़िल्टर करें...')}
              className="px-3.5 py-2 rounded-xl border border-stone-200 text-xs w-36 focus:outline-none focus:ring-2 focus:ring-amber-500/50 bg-stone-50/50"
            />
          </div>
        </div>

        {/* Counter & Action - CLICK TO GO TO SEPARATE ADD FAMILY DETAILS PAGE */}
        <div className="flex flex-col sm:flex-row justify-between items-center text-xs text-stone-500 pt-3 border-t border-stone-100 gap-2">
          <span className="font-medium text-stone-600">
            {lang === 'hi' ? (
              <><strong className="text-stone-900">{filteredProfiles.length}</strong> सत्यापित राठौर समाज बायोडाटा दिखाए जा रहे हैं</>
            ) : (
              <>Showing <strong className="text-stone-900">{filteredProfiles.length}</strong> verified Rathore Samaj Biodatas</>
            )}
          </span>
          <button 
            type="button"
            className="text-[#380812] hover:text-[#540e1b] font-semibold cursor-pointer flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100/70 px-3.5 py-1.5 rounded-xl border border-amber-300/60 transition-colors"
            onClick={() => onNavigateTab('family-details')}
          >
            <Users className="w-3.5 h-3.5 text-amber-800" />
            <span>{t('+ Register family details', '+ पारिवारिक विवरण दर्ज करें')}</span>
          </button>
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
                  {admirers.length} {t('Samaj Families', 'समाज परिवार')}
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {admirers.map((adm) => {
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
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-serif font-bold text-stone-900 text-base truncate group-hover:text-[#380812] transition-colors">
                            {adm.admirerName}
                          </h4>
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        </div>
                        <p className="text-xs text-stone-600 font-medium">
                          {t('Gotra:', 'गोत्र:')} {adm.admirerGotra} · {adm.admirerCity}
                        </p>
                        <span className="text-[10px] text-rose-600 font-bold flex items-center gap-1 mt-0.5">
                          <Heart className="w-3 h-3 fill-rose-500 text-rose-500" /> {t(`Liked your profile ${adm.likedAt}`, `प्रोफ़ाइल पसंद किया (${adm.likedAt})`)}
                        </span>
                      </div>
                    </div>

                    <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80 text-xs space-y-1">
                      <p className="text-stone-700 font-medium">
                        <strong>{t('Qualification:', 'योग्यता:')}</strong> {adm.admirerEducation}
                      </p>
                      {adm.admirerProfession && (
                        <p className="text-stone-700 font-medium">
                          <strong>{t('Profession:', 'व्यवसाय:')}</strong> {adm.admirerProfession}
                        </p>
                      )}
                      {adm.message && (
                        <div className="mt-2 pt-2 border-t border-stone-200/70 text-[11px] text-amber-950 bg-amber-50/70 p-2.5 rounded-xl italic">
                          &quot;{adm.message}&quot;
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-stone-100 flex items-center gap-2">
                    <button
                      onClick={() => setActiveChatProfile(candidateProfile)}
                      className="flex-1 bg-gradient-to-r from-[#380812] to-[#540e1b] hover:from-[#24050b] hover:to-[#380812] text-amber-200 text-xs font-semibold py-2.5 px-3 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-amber-500/20"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-amber-300" />
                      <span>{t('Chat with Family', 'परिवार से चैट करें')}</span>
                    </button>

                    {onSelectKundaliProfile && (
                      <button
                        onClick={() => onSelectKundaliProfile(candidateProfile.id, candidateProfile.gender)}
                        title={t('Kundali Milan (36 Gun)', 'कुंडली मिलान (३६ गुण)')}
                        className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 text-xs font-semibold py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-1 shrink-0"
                      >
                        <Compass className="w-3.5 h-3.5 text-amber-700" />
                        <span className="hidden sm:inline">{t('Milan', 'मिलान')}</span>
                      </button>
                    )}

                    <a
                      href={`tel:${adm.admirerPhone}`}
                      title={`${t('Call', 'कॉल करें')} ${adm.admirerName} (${adm.admirerPhone})`}
                      className="p-2.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs transition-colors cursor-pointer shrink-0"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-700" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredProfiles.map((p) => {
            const photoUrl = p.photo && p.photo.trim() !== '' 
              ? p.photo 
              : p.gender === 'Female'
                ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"
                : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80";

            return (
              <div 
                key={p.id}
                className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-stone-200/80 hover:border-amber-400/50 overflow-hidden flex flex-col sm:flex-row group"
              >
                {/* Photo Column */}
                <div className="sm:w-2/5 relative h-64 sm:h-auto bg-stone-100 overflow-hidden shrink-0">
                  <img 
                    src={photoUrl} 
                    alt={p.name} 
                    className="w-full h-full object-cover object-top group-hover:scale-103 transition-transform duration-500"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = p.gender === 'Female'
                        ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"
                        : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80";
                    }}
                  />
                  {/* Verified Badge */}
                  <div className="absolute top-3 left-3 bg-[#24050b]/90 text-amber-300 text-[11px] font-semibold px-2.5 py-1 rounded-md shadow-sm border border-amber-500/30 flex items-center gap-1 backdrop-blur-xs">
                    <ShieldCheck className="w-3 h-3 text-amber-400" />
                    <span>{t('Gotra:', 'गोत्र:')} {p.gotra}</span>
                  </div>

                  {/* Quick Floating Like Button on Photo */}
                  <button
                    onClick={(e) => toggleLikeProfile(p.id, e)}
                    className="absolute top-3 right-3 bg-white/90 hover:bg-white text-stone-800 p-1.5 rounded-full shadow-md backdrop-blur-xs transition-transform hover:scale-110 cursor-pointer flex items-center gap-1 text-[11px] font-bold px-2"
                    title={likedProfiles.has(p.id.toString()) ? t('Liked', 'पसंद किया') : t('Like profile', 'प्रोफ़ाइल पसंद करें')}
                  >
                    <Heart className={`w-3.5 h-3.5 ${likedProfiles.has(p.id.toString()) ? 'fill-rose-500 text-rose-500' : 'text-stone-600'}`} />
                    <span className={likedProfiles.has(p.id.toString()) ? 'text-rose-600' : 'text-stone-700'}>{getProfileLikes(p.id)}</span>
                  </button>
                </div>

                {/* Content Column */}
                <div className="p-5 sm:w-3/5 flex flex-col justify-between">
                  <div>
                    {/* Header */}
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h3 className="text-lg font-serif font-bold text-stone-900 group-hover:text-[#380812] transition-colors leading-snug">
                          {p.name}
                        </h3>
                        {/* ZERO PILL METADATA DISCIPLINE */}
                        <p className="text-xs text-stone-600 font-medium mt-1">
                          {p.age} {t('Yrs', 'वर्ष')} · {p.height || "5' 6\""} · {p.city}, {p.state || t('India', 'भारत')}
                        </p>
                      </div>
                    </div>

                    {/* Education & Profession */}
                    <div className="mt-4 space-y-2 text-xs text-stone-600">
                      {p.education && p.education.trim() !== '' && (
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-4 h-4 text-amber-700 shrink-0" />
                          <span className="line-clamp-1 font-medium text-stone-700">{p.education}</span>
                        </div>
                      )}
                      {p.profession && p.profession.trim() !== '' && p.profession !== '---' && p.profession !== 'Not specified' && (
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-amber-700 shrink-0" />
                          <span className="line-clamp-1 font-medium text-stone-700">{p.profession}</span>
                        </div>
                      )}
                      {p.income && p.income.trim() !== '' && p.income !== '---' && p.income !== 'Not specified' && (
                        <div className="text-[11px] text-emerald-800 font-semibold pl-6">
                          {t('Income:', 'आय:')} {p.income}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-5 pt-3 border-t border-stone-100 flex items-center gap-2">
                    <button 
                      onClick={() => handleOpenProfile(p.id)}
                      className="flex-1 bg-gradient-to-r from-[#380812] to-[#540e1b] hover:from-[#24050b] hover:to-[#380812] text-amber-200 text-xs font-semibold py-2.5 px-3 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-amber-500/20"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-300" />
                      <span>{t('View Biodata', 'बायोडाटा देखें')}</span>
                    </button>

                    {/* Direct Interactive Chat Button */}
                    <button
                      onClick={() => setActiveChatProfile(p)}
                      title={`${t('Chat with family', 'परिवार से चैट करें')} (${p.name})`}
                      className="bg-amber-100/80 hover:bg-amber-200 text-[#380812] border border-amber-300/80 text-xs font-semibold py-2.5 px-2.5 sm:px-3 rounded-xl transition-all cursor-pointer flex items-center gap-1 shrink-0"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-amber-900" />
                      <span className="hidden sm:inline">{t('Chat', 'चैट')}</span>
                    </button>

                    {onSelectKundaliProfile && (
                      <button
                        onClick={() => onSelectKundaliProfile(p.id, p.gender)}
                        title={t('Kundali Milan (36 Gun)', 'कुंडली मिलान (३६ गुण)')}
                        className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 text-xs font-semibold py-2.5 px-2.5 sm:px-3 rounded-xl transition-all cursor-pointer flex items-center gap-1 shrink-0"
                      >
                        <Compass className="w-3.5 h-3.5 text-amber-700" />
                        <span className="hidden sm:inline">{t('Milan', 'मिलान')}</span>
                      </button>
                    )}

                    <button
                      onClick={(e) => toggleLikeProfile(p.id, e)}
                      title={likedProfiles.has(p.id.toString()) ? t('Liked', 'पसंद किया') : t('Like biodata', 'बायोडाटा पसंद करें')}
                      className={`py-2.5 px-2.5 sm:px-3 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                        likedProfiles.has(p.id.toString())
                          ? 'bg-rose-50 border-rose-300 text-rose-700'
                          : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${likedProfiles.has(p.id.toString()) ? 'fill-rose-500 text-rose-500' : 'text-stone-500'}`} />
                      <span>{getProfileLikes(p.id)}</span>
                    </button>

                    <button
                      onClick={(e) => shareProfileWhatsApp(p, e)}
                      title={t('Share biodata on WhatsApp', 'व्हाट्सएप पर शेयर करें')}
                      className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-semibold py-2.5 px-2.5 sm:px-3 rounded-xl transition-all cursor-pointer flex items-center gap-1 shrink-0"
                    >
                      <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="hidden sm:inline">{t('Share', 'शेयर')}</span>
                    </button>
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
          className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={handleCloseModal}
        >
          <div 
            className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-amber-300/80 relative my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={handleCloseModal} 
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1 rounded-full transition-colors cursor-pointer"
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

                {/* Profile Header */}
                <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start pt-1">
                  <img 
                    src={activeProfile.photo && activeProfile.photo.trim() !== '' ? activeProfile.photo : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80"} 
                    alt={activeProfile.name} 
                    className="w-28 h-28 rounded-2xl object-cover object-top border-2 border-amber-400 shadow-md shrink-0"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80";
                    }}
                  />
                  <div className="w-full text-center sm:text-left space-y-1">
                    {/* ZERO PILL LINE */}
                    <p className="text-xs text-amber-800 font-semibold tracking-wide">
                      {t('Gotra:', 'गोत्र:')} {activeProfile.gotra} · {activeProfile.city}, {activeProfile.state || t('India', 'भारत')}
                    </p>

                    <h2 className="text-2xl font-bold font-serif text-stone-900">
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

                {/* Details box */}
                <div className="space-y-3 border-t border-stone-100 pt-3 text-xs max-h-[48vh] overflow-y-auto pr-1">
                  <div className={`grid grid-cols-1 ${activeProfile.profession && activeProfile.profession.trim() !== '' && activeProfile.profession !== '---' && activeProfile.profession !== 'Not specified' ? 'sm:grid-cols-2' : ''} gap-2.5 bg-stone-50 p-3.5 rounded-xl border border-stone-200/80`}>
                    <div>
                      <span className="text-stone-500 font-medium">{t('Education:', 'शिक्षा:')}</span>
                      <p className="font-semibold text-stone-800 mt-0.5">{activeProfile.education}</p>
                    </div>
                    {activeProfile.profession && activeProfile.profession.trim() !== '' && activeProfile.profession !== '---' && activeProfile.profession !== 'Not specified' && (
                      <div>
                        <span className="text-stone-500 font-medium">{t('Profession:', 'व्यवसाय:')}</span>
                        <p className="font-semibold text-stone-800 mt-0.5">{activeProfile.profession}</p>
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
                  {onSelectKundaliProfile && (
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

                      <button
                        onClick={(e) => shareProfileWhatsApp(activeProfile, e)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                        title={t('Share on WhatsApp', 'व्हाट्सएप पर शेयर करें')}
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>{t('WhatsApp', 'व्हाट्सएप')}</span>
                      </button>

                      <a 
                        href={`tel:${activeProfile.contact.split(',')[0].trim()}`} 
                        className="flex-1 sm:flex-initial bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-4 py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Phone className="w-3.5 h-3.5" /> {t('Call Family', 'कॉल करें')}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Free limit reached dialog */
              <div className="text-center space-y-4 py-4">
                <div className="w-16 h-16 bg-amber-100 rounded-2xl mx-auto flex items-center justify-center shadow-inner border border-amber-300">
                  <ShieldAlert className="w-8 h-8 text-amber-800" />
                </div>
                <h3 className="text-2xl font-serif font-bold text-stone-900">{t('Free View Limit Reached', 'निःशुल्क व्यू सीमा समाप्त')}</h3>
                <p className="text-xs text-stone-600 max-w-sm mx-auto leading-relaxed">
                  {t(
                    'You have viewed 3 free biodatas. To view unlimited community profiles and support fellow Rathore families, please register your family details on our dedicated page.',
                    'आपने 3 निःशुल्क बायोडाटा देख लिए हैं। असीमित समाज प्रोफ़ाइल देखने के लिए, कृपया अपना पारिवारिक विवरण दर्ज करें।'
                  )}
                </p>
                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-left space-y-1.5 max-w-sm mx-auto text-xs">
                  <p className="font-bold text-amber-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-700" /> {t('Community Mutual Sharing Policy', 'समाज पारस्परिक सहयोग नीति')}
                  </p>
                  <p className="text-stone-600 leading-relaxed">
                    {t(
                      'By submitting your family details, you keep the Rathore Samaj directory authentic and verified for everyone.',
                      'अपना पारिवारिक विवरण जोड़कर आप राठौर समाज डायरेक्टरी को सभी के लिए विश्वसनीय और सत्यापित बनाए रखते हैं।'
                    )}
                  </p>
                </div>
                <button 
                  onClick={() => {
                    handleCloseModal();
                    onNavigateTab('family-details');
                  }} 
                  className="w-full max-w-sm mx-auto bg-gradient-to-r from-[#380812] to-[#540e1b] hover:from-[#24050b] hover:to-[#380812] text-amber-200 font-bold py-3 rounded-xl shadow-md block text-xs cursor-pointer transition-all border border-amber-400/30"
                >
                  {t('📝 Open Add Family Details Page (Unlock Unlimited Access)', '📝 परिवार विवरण दर्ज करें (असीमित एक्सेस अनलॉक करें)')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* INTERACTIVE CHAT MODAL */}
      {activeChatProfile && (
        <ChatModal
          profile={activeChatProfile}
          authSession={authSession}
          onClose={() => setActiveChatProfile(null)}
          onSelectKundaliProfile={onSelectKundaliProfile}
        />
      )}
    </div>
  );
};
