import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, Users, Image as ImageIcon, Settings, Plus, Search, 
  Bell, ChevronDown, CheckCircle2, ShieldCheck, ExternalLink, Edit3, 
  Eye, Trash2, Globe, Sparkles, Upload, ArrowRight, 
  X, AlertCircle, Phone, FileText, Camera,
  Linkedin, Instagram, Link2, Sliders, Store,
  Tag, Star, MapPin, Heart, MessageCircle, Compass, Crown
} from 'lucide-react';
import { 
  MatrimonyProfile, BusinessAd, TabType, AuthSession, 
  UserMediaAsset, VisibilitySetting, ProfileStatus, ProfileAdmirer, ChatMessage 
} from '../types';
import { ChatModal } from './ChatModal';
import { useLanguage } from '../context/LanguageContext';
import { useAdminConfig } from '../context/AdminConfigContext';
import { BrandLogo } from './BrandLogo';
import { ImageUploadField } from './ImageUploadField';
import { compressAndReadImageFile } from '../utils/imageUpload';
import { sanitizePhoneInput, validatePhoneNumber } from '../utils/validation';
import { isProfileOwnedBySession } from '../utils/profileOwnership';

interface DashboardTabProps {
  authSession: AuthSession | null;
  profiles: MatrimonyProfile[];
  ads: BusinessAd[];
  onUpdateProfile: (updatedProfile: MatrimonyProfile) => void;
  onAddProfile: (newProfile: MatrimonyProfile) => boolean | void;
  onDeleteProfile: (id: number | string) => void;
  onUpdateAd: (updatedAd: BusinessAd) => void;
  onAddAd: (newAd: BusinessAd) => void;
  onDeleteAd: (id: number | string) => void;
  onNavigateTab: (tab: TabType) => void;
  onLogout: () => void;
  onSelectKundaliProfile?: (id: number | string, gender: 'Male' | 'Female') => void;
}

type DashboardNavSection = 'overview' | 'profiles' | 'ads' | 'liked_by_me' | 'who_liked_me' | 'chats' | 'media' | 'settings';

export const DashboardTab: React.FC<DashboardTabProps> = ({
  authSession,
  profiles,
  ads,
  onUpdateProfile,
  onAddProfile,
  onDeleteProfile,
  onUpdateAd,
  onAddAd,
  onDeleteAd,
  onNavigateTab,
  onLogout,
  onSelectKundaliProfile
}) => {
  const { lang, t } = useLanguage();
  const { config, userSubscription } = useAdminConfig();
  // Current active sidebar section
  const [activeSection, setActiveSection] = useState<DashboardNavSection>('profiles');

  // Search filter across dashboard
  const [searchQuery, setSearchQuery] = useState('');

  // Liked Profiles State
  const [likedProfiles, setLikedProfiles] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('samaj_liked_profiles');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  const likedProfileList = useMemo(() => {
    return profiles.filter(p => likedProfiles.has(p.id.toString()));
  }, [profiles, likedProfiles]);

  const toggleUnlikeProfile = (id: number | string) => {
    const key = id.toString();
    const newSet = new Set(likedProfiles);
    newSet.delete(key);
    setLikedProfiles(newSet);
    try {
      localStorage.setItem('samaj_liked_profiles', JSON.stringify(Array.from(newSet)));
    } catch (e) {
      console.error(e);
    }
  };

  // Who Liked My Profile State
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

  // Stored chat messages & Active Chat Profile
  const [activeChatProfile, setActiveChatProfile] = useState<MatrimonyProfile | null>(null);
  const [chatThreads] = useState<Record<string, ChatMessage[]>>(() => {
    try {
      const stored = localStorage.getItem('samaj_chat_messages');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Notifications state
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Family Contact Requested',
      description: 'A verified Rathore family from Indore requested contact details for your published profile.',
      time: '2 hours ago',
      read: false
    },
    {
      id: 2,
      title: 'Gotra Verification Approved',
      description: 'Your family Gotra lineage was verified by the Central Samaj Committee.',
      time: '1 day ago',
      read: false
    },
    {
      id: 3,
      title: 'Business Ad Impression',
      description: 'Your shop advertisement received 32 new views from community members today.',
      time: '1 day ago',
      read: false
    },
    {
      id: 4,
      title: 'Annual Patrika 2026 Released',
      description: 'The digital e-booklet has been updated with 450+ candidate biodatas.',
      time: '2 days ago',
      read: true
    }
  ]);

  // User Profile Dropdown state
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Status Filter for Profiles section
  const [profileStatusFilter, setProfileStatusFilter] = useState<'all' | 'active' | 'draft'>('all');

  // Status Filter for Ads section
  const [adStatusFilter, setAdStatusFilter] = useState<'all' | 'active' | 'draft' | 'featured'>('all');

  // Inline Profile Editor State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editingProfile, setEditingProfile] = useState<MatrimonyProfile | null>(null);
  const [profileFormError, setProfileFormError] = useState('');
  const [showGalleryAddInput, setShowGalleryAddInput] = useState(false);
  const [newGalleryUrlInput, setNewGalleryUrlInput] = useState('');

  // Inline Business Ad Editor State
  const [isEditingAd, setIsEditingAd] = useState(false);
  const [editingAd, setEditingAd] = useState<BusinessAd | null>(null);
  const [adFormError, setAdFormError] = useState('');

  // Live Preview Modals
  const [previewProfile, setPreviewProfile] = useState<MatrimonyProfile | null>(null);
  const [previewAd, setPreviewAd] = useState<BusinessAd | null>(null);

  // Quick Card Settings Modals
  const [settingsModalProfile, setSettingsModalProfile] = useState<MatrimonyProfile | null>(null);
  const [settingsModalAd, setSettingsModalAd] = useState<BusinessAd | null>(null);
  const [confirmDeleteProfileId, setConfirmDeleteProfileId] = useState<number | string | null>(null);
  const [confirmDeleteAdId, setConfirmDeleteAdId] = useState<number | string | null>(null);

  // User's Media Assets State
  const [mediaAssets, setMediaAssets] = useState<UserMediaAsset[]>([
    {
      id: 'media-1',
      url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
      title: 'Primary Portrait Avatar',
      type: 'avatar',
      uploadedAt: 'Oct 28, 2026',
      size: '1.2 MB'
    },
    {
      id: 'media-2',
      url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
      title: 'Royal Heritage Cover Photo',
      type: 'cover',
      uploadedAt: 'Oct 28, 2026',
      size: '2.8 MB'
    },
    {
      id: 'media-3',
      url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80',
      title: 'Shop Showroom Banner',
      type: 'cover',
      uploadedAt: 'Oct 29, 2026',
      size: '2.4 MB'
    },
    {
      id: 'media-4',
      url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=600&q=80',
      title: 'Family Gathering Photo',
      type: 'gallery',
      uploadedAt: 'Oct 30, 2026',
      size: '1.8 MB'
    }
  ]);

  // New Media Upload Form state
  const [newMediaTitle, setNewMediaTitle] = useState('');
  const [newMediaType, setNewMediaType] = useState<'avatar' | 'cover' | 'gallery' | 'document'>('gallery');
  const [newMediaUrl, setNewMediaUrl] = useState('');

  // User Profile Settings state
  const [visibilityPreference, setVisibilityPreference] = useState<VisibilitySetting>('public');
  const [whatsappMasking, setWhatsappMasking] = useState(false);
  const [notifyOnView, setNotifyOnView] = useState(true);
  const [settingsSavedToast, setSettingsSavedToast] = useState(false);
  const [profileLimitNotice, setProfileLimitNotice] = useState(false);

  // Only show matrimonial profiles added by this logged-in account (never all community profiles)
  const userProfiles = useMemo(() => {
    return profiles
      .filter(p => isProfileOwnedBySession(p, authSession))
      .map((p) => ({
        ...p,
        status: p.status || 'active',
        visibility: p.visibility || 'public',
        coverPhoto: p.coverPhoto || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
        gallery: p.gallery && p.gallery.length > 0 ? p.gallery : (p.photo ? [p.photo] : []),
        socialLinks: p.socialLinks || {
          linkedin: 'https://linkedin.com/in/rathore',
          instagram: '@rathore_rishtey'
        }
      }));
  }, [profiles, authSession]);

  const hasOwnProfile = userProfiles.length >= 1;

  const filteredUserProfiles = useMemo(() => {
    return userProfiles.filter(p => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        p.name.toLowerCase().includes(q) || 
        p.gotra.toLowerCase().includes(q) || 
        p.profession.toLowerCase().includes(q) || 
        p.city.toLowerCase().includes(q);

      const matchesStatus = profileStatusFilter === 'all' || p.status === profileStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [userProfiles, searchQuery, profileStatusFilter]);

  // Processed Business Ads
  const userAds = useMemo(() => {
    return ads.map((ad, idx) => ({
      ...ad,
      status: ad.status || (idx % 2 === 0 ? 'active' : 'draft'),
      viewsCount: ad.viewsCount || (120 + idx * 37),
      inquiriesCount: ad.inquiriesCount || (14 + idx * 5)
    }));
  }, [ads]);

  const filteredUserAds = useMemo(() => {
    return userAds.filter(ad => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        ad.title.toLowerCase().includes(q) || 
        ad.category.toLowerCase().includes(q) || 
        ad.owner.toLowerCase().includes(q) || 
        (ad.city && ad.city.toLowerCase().includes(q));

      if (adStatusFilter === 'all') return matchesSearch;
      if (adStatusFilter === 'featured') return matchesSearch && ad.isFeatured;
      return matchesSearch && ad.status === adStatusFilter;
    });
  }, [userAds, searchQuery, adStatusFilter]);

  const activeProfilesCount = useMemo(() => userProfiles.filter(p => p.status === 'active').length, [userProfiles]);
  const draftProfilesCount = useMemo(() => userProfiles.filter(p => p.status === 'draft').length, [userProfiles]);
  const activeAdsCount = useMemo(() => userAds.filter(a => a.status === 'active').length, [userAds]);
  const featuredAdsCount = useMemo(() => userAds.filter(a => a.isFeatured).length, [userAds]);
  const unreadNotificationCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  // Handler: Start Editing Profile
  const handleStartEditProfile = (profile: MatrimonyProfile) => {
    setProfileFormError('');
    setShowGalleryAddInput(false);
    setNewGalleryUrlInput('');
    setEditingProfile({ ...profile, contact: sanitizePhoneInput(profile.contact || '') || profile.contact });
    setIsEditingProfile(true);
    setIsEditingAd(false);
  };

  // Handler: Create New Profile via Editor (strictly limited to 1 profile per login)
  const handleStartCreateNewProfile = () => {
    if (hasOwnProfile) {
      setActiveSection('profiles');
      setIsEditingProfile(false);
      setIsEditingAd(false);
      setProfileLimitNotice(true);
      setTimeout(() => setProfileLimitNotice(false), 5000);
      return;
    }
    setProfileLimitNotice(false);
    setProfileFormError('');
    setShowGalleryAddInput(false);
    setNewGalleryUrlInput('');
    const initialPhone = sanitizePhoneInput(authSession?.phone || '');
    const blank: MatrimonyProfile = {
      id: Date.now(),
      name: authSession?.name || '',
      gender: 'Male',
      age: 26,
      height: "5' 8\"",
      gotra: '',
      education: '',
      profession: '',
      income: 'Competitive',
      city: 'Indore',
      state: 'Madhya Pradesh',
      native: 'Indore',
      location: 'Indore, Madhya Pradesh',
      contact: initialPhone,
      phone: initialPhone,
      about: 'Well-settled respected Rathore Samaj family alliance sought.',
      familyDetails: 'Father: Respected Elder, Mother: Homemaker. Native: Indore.',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
      coverPhoto: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
      gallery: [],
      socialLinks: { linkedin: '', instagram: '', website: '' },
      visibility: 'public',
      status: 'active',
      verified: !config.requireAdminVerification,
      createdAt: new Date().toISOString()
    };
    setEditingProfile(blank);
    setIsEditingProfile(true);
    setIsEditingAd(false);
  };

  // Handler: Save Profile Edits
  const handleSaveProfileEdits = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfile) return;
    setProfileFormError('');

    if (!editingProfile.name.trim() || !editingProfile.gotra.trim()) {
      setProfileFormError(t('Please provide at least candidate Name and Gotra.', 'कृपया कम से कम प्रत्याशी का नाम और गोत्र दर्ज करें।'));
      return;
    }

    const phoneRes = validatePhoneNumber(editingProfile.contact || '', true);
    if (!phoneRes.valid) {
      setProfileFormError(lang === 'hi' ? (phoneRes.errorHi || '') : (phoneRes.errorEn || ''));
      return;
    }

    const cleanedProfile: MatrimonyProfile = {
      ...editingProfile,
      contact: phoneRes.cleaned,
      phone: phoneRes.cleaned
    };

    const exists = profiles.some(p => p.id === cleanedProfile.id);
    if (exists) {
      onUpdateProfile(cleanedProfile);
    } else {
      if (hasOwnProfile) {
        setProfileFormError(t(
          'Only 1 profile can be created per login. Please edit or delete your existing profile first.',
          'प्रति लॉगिन केवल 1 प्रोफ़ाइल बनाई जा सकती है। कृपया अपनी मौजूदा प्रोफ़ाइल को संपादित करें।'
        ));
        return;
      }
      const added = onAddProfile(cleanedProfile);
      if (added === false) {
        setProfileFormError(t(
          'Only 1 profile can be created per login.',
          'प्रति लॉगिन केवल 1 प्रोफ़ाइल बनाई जा सकती है।'
        ));
        return;
      }
    }

    setIsEditingProfile(false);
    setEditingProfile(null);
  };

  // Handler: Toggle Profile Status
  const handleToggleProfileStatus = (profile: MatrimonyProfile) => {
    const nextStatus: ProfileStatus = profile.status === 'active' ? 'draft' : 'active';
    const updated = { ...profile, status: nextStatus };
    onUpdateProfile(updated);
  };

  // Handler: Update Profile Visibility
  const handleUpdateProfileVisibility = (profile: MatrimonyProfile, visibility: VisibilitySetting) => {
    const updated = { ...profile, visibility };
    onUpdateProfile(updated);
    setSettingsModalProfile(null);
  };

  // Handler: Start Editing Business Ad
  const handleStartEditAd = (ad: BusinessAd) => {
    setAdFormError('');
    setEditingAd({ ...ad, phone: sanitizePhoneInput(ad.phone || '') });
    setIsEditingAd(true);
    setIsEditingProfile(false);
  };

  // Handler: Create New Business Ad
  const handleStartCreateNewAd = () => {
    setAdFormError('');
    const blankAd: BusinessAd = {
      id: Date.now(),
      title: '',
      owner: authSession?.name || '',
      category: 'Clothing & Retail',
      city: 'Indore',
      address: '',
      phone: sanitizePhoneInput(authSession?.phone || ''),
      tagline: 'Trusted Rathore Samaj Member Business',
      offer: '10% Exclusive Discount for Samaj Members',
      rating: '5.0 ★',
      isFeatured: false,
      status: 'active',
      banner: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80',
      description: 'Quality goods and services for community families.',
      viewsCount: 1,
      inquiriesCount: 0,
      createdAt: new Date().toISOString()
    };
    setEditingAd(blankAd);
    setIsEditingAd(true);
    setIsEditingProfile(false);
  };

  // Handler: Save Business Ad Edits
  const handleSaveAdEdits = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAd) return;
    setAdFormError('');

    if (!editingAd.title.trim() || !editingAd.address.trim()) {
      setAdFormError(t('Please provide Business Name and Address.', 'कृपया व्यवसाय का नाम और पता दर्ज करें।'));
      return;
    }

    const phoneRes = validatePhoneNumber(editingAd.phone || '', true);
    if (!phoneRes.valid) {
      setAdFormError(lang === 'hi' ? (phoneRes.errorHi || '') : (phoneRes.errorEn || ''));
      return;
    }

    const cleanedAd: BusinessAd = {
      ...editingAd,
      phone: phoneRes.cleaned
    };

    const exists = ads.some(a => a.id === cleanedAd.id);
    if (exists) {
      onUpdateAd(cleanedAd);
    } else {
      onAddAd(cleanedAd);
    }

    setIsEditingAd(false);
    setEditingAd(null);
  };

  // Handler: Toggle Ad Status (Active <-> Draft)
  const handleToggleAdStatus = (ad: BusinessAd) => {
    const nextStatus = ad.status === 'active' ? 'draft' : 'active';
    const updated: BusinessAd = { ...ad, status: nextStatus };
    onUpdateAd(updated);
  };

  // Handler: Toggle Ad Featured
  const handleToggleAdFeatured = (ad: BusinessAd) => {
    const updated: BusinessAd = { ...ad, isFeatured: !ad.isFeatured };
    onUpdateAd(updated);
    setSettingsModalAd(null);
  };

  // Handler: Add Media Asset
  const handleAddMediaAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMediaUrl) return;

    const newAsset: UserMediaAsset = {
      id: `media-${Date.now()}`,
      url: newMediaUrl,
      title: newMediaTitle.trim() || 'New Uploaded Media Asset',
      type: newMediaType,
      uploadedAt: 'Just now',
      size: '2.4 MB'
    };

    setMediaAssets(prev => [newAsset, ...prev]);
    setNewMediaTitle('');
    setNewMediaUrl('');
  };

  // Handler: Delete Media Asset
  const handleDeleteMediaAsset = (id: string) => {
    setMediaAssets(prev => prev.filter(m => m.id !== id));
  };

  // Handler: Save General Settings
  const handleSaveSettings = () => {
    setSettingsSavedToast(true);
    setTimeout(() => setSettingsSavedToast(false), 3000);
  };

  // Handler: Mark all notifications read
  const handleMarkAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <div className="space-y-6">
      
      {/* ======================================================== */}
      {/* 1. TOP DASHBOARD APP BAR (Header Navigation)              */}
      {/* ======================================================== */}
      <header className="bg-white rounded-2xl sm:rounded-3xl border border-rose-100 shadow-sm p-3.5 sm:p-5 flex flex-wrap md:flex-nowrap items-center justify-between gap-3 sm:gap-4">
        
        {/* Left: Brand Identity & Active Breadcrumb */}
        <div className="order-1 flex items-center gap-2.5 min-w-0 flex-1 md:flex-initial">
          <div 
            onClick={() => onNavigateTab('matrimony')} 
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group min-w-0"
          >
            <BrandLogo size="md" showText={false} tone="crimson" className="shrink-0 group-hover:scale-105 transition-transform" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-serif font-bold text-stone-900 text-sm sm:text-base leading-tight truncate">
                  {t('Member Dashboard', 'सदस्य डैशबोर्ड')}
                </span>
                <span className="hidden xs:inline-block sm:inline-block bg-rose-50 text-[#851834] text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-200 font-serif shrink-0">
                  {t('Workspace', 'कार्यक्षेत्र')}
                </span>
              </div>
              <p className="text-[11px] text-stone-400 font-light mt-0.5 truncate">
                {t('Rathore Rishtey • Member Workspace', 'राठौर रिश्ते • सदस्य प्रबंधन केंद्र')}
              </p>
            </div>
          </div>
        </div>

        {/* Center: Search Bar (wraps neatly to row 2 on mobile, centered on desktop) */}
        <div className="order-3 md:order-2 relative w-full md:flex-1 md:max-w-xs lg:max-w-md">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('Search profiles, ads, gotra, city...', 'प्रोफ़ाइल, विज्ञापन, गोत्र, शहर खोजें...')}
            className="w-full pl-10 pr-8 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-xs sm:text-sm bg-stone-50/50 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right: Quick Directory Link (mobile), Notifications & User Profile Dropdown */}
        <div className="order-2 md:order-3 flex items-center gap-2 sm:gap-2.5 shrink-0">
          
          {/* Quick exit to public directory on mobile */}
          <button
            onClick={() => onNavigateTab('matrimony')}
            className="md:hidden text-[11px] text-[#851834] font-semibold flex items-center gap-1 bg-rose-50 px-2.5 py-2 rounded-xl border border-rose-200 whitespace-nowrap"
          >
            <span>{t('Directory', 'डायरेक्टरी')}</span>
            <ArrowRight className="w-3 h-3 shrink-0" />
          </button>

          {/* Notifications Popover */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileMenu(false);
              }}
              className="relative p-2 sm:p-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 transition-colors cursor-pointer"
              aria-label={t('Notifications', 'सूचनाएं')}
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#851834] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
                  {unreadNotificationCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown Modal */}
            {showNotifications && (
              <div 
                className="fixed inset-x-3 top-[calc(5.25rem+var(--sat))] sm:inset-x-auto sm:top-full sm:right-0 sm:mt-2 sm:w-96 max-w-md mx-auto sm:mx-0 bg-white rounded-3xl shadow-2xl border border-rose-100 z-50 p-4 space-y-3 animate-in fade-in"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-[#851834]" />
                    <span className="font-serif font-bold text-sm text-stone-900">{t('Notifications', 'सूचनाएं')}</span>
                  </div>
                  {unreadNotificationCount > 0 && (
                    <button
                      onClick={handleMarkAllNotificationsRead}
                      className="text-[11px] text-[#851834] font-semibold hover:underline cursor-pointer"
                    >
                      {t('Mark all as read', 'सभी को पढ़ा हुआ मानें')}
                    </button>
                  )}
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {notifications.map((n) => (
                    <div 
                      key={n.id} 
                      className={`p-3 rounded-2xl border transition-all text-xs space-y-1 ${
                        n.read 
                          ? 'bg-stone-50/60 border-stone-100 text-stone-600' 
                          : 'bg-rose-50/50 border-rose-200/70 text-stone-900 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <strong className="font-serif font-bold">{n.title}</strong>
                        <span className="text-[10px] text-stone-400 shrink-0">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-stone-600 font-light leading-relaxed">
                        {n.description}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="pt-1 text-center">
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-xs text-stone-500 hover:text-stone-800 font-semibold cursor-pointer"
                  >
                    {t('Close', 'बंद करें')}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Dropdown Button */}
          <div className="relative">
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-1.5 sm:gap-2.5 p-1 sm:p-1.5 sm:pr-3 rounded-xl sm:rounded-2xl border border-stone-200 hover:border-rose-300 hover:bg-stone-50 transition-all cursor-pointer"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-rose-100 text-[#851834] flex items-center justify-center font-bold text-xs overflow-hidden border border-rose-200">
                {authSession?.photoUrl ? (
                  <img src={authSession.photoUrl} alt="User" className="w-full h-full object-cover" />
                ) : (
                  <span>{authSession?.name ? authSession.name[0] : 'R'}</span>
                )}
              </div>
              <div className="text-left hidden sm:block">
                <span className="text-xs font-bold text-stone-800 block truncate max-w-[120px]">
                  {authSession?.name || t('Samaj Member', 'समाज सदस्य')}
                </span>
                <span className="text-[10px] text-emerald-700 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> {t('Verified', 'सत्यापित')}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
            </button>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div 
                className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-1.5rem)] bg-white rounded-3xl shadow-2xl border border-rose-100 z-50 p-3 space-y-2 text-xs animate-in fade-in"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-3 bg-rose-50/50 rounded-2xl border border-rose-100/80">
                  <p className="font-bold text-stone-900 font-serif truncate">{authSession?.name || t('Samaj Member', 'समाज सदस्य')}</p>
                  <p className="text-[11px] text-stone-500 font-light truncate">
                    {authSession?.email || `+91 ${authSession?.phone}`}
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded-full">
                    <ShieldCheck className="w-3 h-3 text-emerald-700" /> {t('Rathore Samaj ID Verified', 'राठौर समाज आईडी सत्यापित')}
                  </div>
                </div>

                <div className="space-y-1">
                  <button
                    onClick={() => {
                      setActiveSection('profiles');
                      setShowProfileMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-stone-50 font-medium text-stone-700 flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4 text-[#851834]" /> {t('My Published Profiles', 'मेरी प्रकाशित प्रोफ़ाइलें')}
                  </button>

                  <button
                    onClick={() => {
                      setActiveSection('ads');
                      setShowProfileMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-stone-50 font-medium text-stone-700 flex items-center gap-2"
                  >
                    <Store className="w-4 h-4 text-[#851834]" /> {t('My Published Ads', 'मेरे प्रकाशित विज्ञापन')}
                  </button>

                  <button
                    onClick={() => {
                      setActiveSection('media');
                      setShowProfileMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-stone-50 font-medium text-stone-700 flex items-center gap-2"
                  >
                    <ImageIcon className="w-4 h-4 text-[#851834]" /> {t('Media Assets', 'मीडिया और फ़ोटो')}
                  </button>

                  <button
                    onClick={() => {
                      setActiveSection('settings');
                      setShowProfileMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-stone-50 font-medium text-stone-700 flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4 text-[#851834]" /> {t('Account Settings', 'खाता सेटिंग्स')}
                  </button>

                  <button
                    onClick={() => {
                      onNavigateTab('matrimony');
                      setShowProfileMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-50 font-semibold text-[#851834] flex items-center gap-2 border-t border-stone-100 mt-1 pt-2"
                  >
                    <ExternalLink className="w-4 h-4" /> {t('Go to Public Directory', 'पब्लिक डायरेक्टरी पर जाएं')}
                  </button>
                </div>

                <div className="pt-1 border-t border-stone-100">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onLogout();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-red-50 font-semibold text-red-700 flex items-center gap-2 cursor-pointer"
                  >
                    {t('Sign Out of Workspace', 'लॉग आउट करें')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. MAIN LAYOUT: MOBILE NAV + SIDEBAR + CONTENT AREA      */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">

        {/* MOBILE WORKSPACE QUICK-NAV BAR (Android / Tablet < lg) */}
        <div className="lg:hidden space-y-2.5 bg-white rounded-2xl border border-rose-100 shadow-xs p-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => { setActiveSection('overview'); setIsEditingProfile(false); setIsEditingAd(false); }}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeSection === 'overview' && !isEditingProfile && !isEditingAd
                  ? 'bg-gradient-to-r from-[#6e1628] to-[#851834] text-amber-100 shadow-xs'
                  : 'bg-stone-50 text-stone-700 border border-stone-200'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>{t('Overview', 'सारांश')}</span>
            </button>

            <button
              onClick={() => { setActiveSection('profiles'); setIsEditingProfile(false); setIsEditingAd(false); }}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeSection === 'profiles' || isEditingProfile
                  ? 'bg-gradient-to-r from-[#6e1628] to-[#851834] text-amber-100 shadow-xs'
                  : 'bg-stone-50 text-stone-700 border border-stone-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>{t('Profiles', 'प्रोफ़ाइलें')}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeSection === 'profiles' || isEditingProfile ? 'bg-amber-300 text-[#4c0d1b]' : 'bg-rose-100 text-[#851834]'
              }`}>
                {userProfiles.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveSection('ads'); setIsEditingProfile(false); setIsEditingAd(false); }}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeSection === 'ads' || isEditingAd
                  ? 'bg-gradient-to-r from-[#6e1628] to-[#851834] text-amber-100 shadow-xs'
                  : 'bg-stone-50 text-stone-700 border border-stone-200'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>{t('Ads', 'विज्ञापन')}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeSection === 'ads' || isEditingAd ? 'bg-amber-300 text-[#4c0d1b]' : 'bg-rose-100 text-[#851834]'
              }`}>
                {userAds.length}
              </span>
            </button>

            {config.featureLikesEnabled && (
              <button
                onClick={() => { setActiveSection('liked_by_me'); setIsEditingProfile(false); setIsEditingAd(false); }}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  activeSection === 'liked_by_me'
                    ? 'bg-gradient-to-r from-[#6e1628] to-[#851834] text-amber-100 shadow-xs'
                    : 'bg-stone-50 text-stone-700 border border-stone-200'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${activeSection === 'liked_by_me' ? 'text-amber-300 fill-amber-300' : 'text-rose-500'}`} />
                <span>{t('Liked', 'पसंद')}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeSection === 'liked_by_me' ? 'bg-amber-300 text-[#4c0d1b]' : 'bg-rose-100 text-[#851834]'
                }`}>
                  {likedProfileList.length}
                </span>
              </button>
            )}

            {config.featureLikesEnabled && (
              <button
                onClick={() => { setActiveSection('who_liked_me'); setIsEditingProfile(false); setIsEditingAd(false); }}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  activeSection === 'who_liked_me'
                    ? 'bg-gradient-to-r from-[#6e1628] to-[#851834] text-amber-100 shadow-xs'
                    : 'bg-stone-50 text-stone-700 border border-stone-200'
                }`}
              >
                <Sparkles className={`w-3.5 h-3.5 ${activeSection === 'who_liked_me' ? 'text-amber-300' : 'text-amber-500'}`} />
                <span>{t('Admirers', 'प्रशंसक')}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeSection === 'who_liked_me' ? 'bg-amber-300 text-[#4c0d1b]' : 'bg-amber-100 text-amber-900'
                }`}>
                  {admirers.length}
                </span>
              </button>
            )}

            {config.featureChatEnabled && (
              <button
                onClick={() => { setActiveSection('chats'); setIsEditingProfile(false); setIsEditingAd(false); }}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  activeSection === 'chats'
                    ? 'bg-gradient-to-r from-[#6e1628] to-[#851834] text-amber-100 shadow-xs'
                    : 'bg-stone-50 text-stone-700 border border-stone-200'
                }`}
              >
                <MessageCircle className={`w-3.5 h-3.5 ${activeSection === 'chats' ? 'text-amber-300' : 'text-emerald-600'}`} />
                <span>{t('Chats', 'चैट')}</span>
              </button>
            )}

            <button
              onClick={() => { setActiveSection('media'); setIsEditingProfile(false); setIsEditingAd(false); }}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeSection === 'media' && !isEditingProfile && !isEditingAd
                  ? 'bg-gradient-to-r from-[#6e1628] to-[#851834] text-amber-100 shadow-xs'
                  : 'bg-stone-50 text-stone-700 border border-stone-200'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>{t('Media', 'मीडिया')}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeSection === 'media' && !isEditingProfile && !isEditingAd ? 'bg-amber-300 text-[#4c0d1b]' : 'bg-stone-200 text-stone-700'
              }`}>
                {mediaAssets.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveSection('settings'); setIsEditingProfile(false); setIsEditingAd(false); }}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeSection === 'settings' && !isEditingProfile && !isEditingAd
                  ? 'bg-gradient-to-r from-[#6e1628] to-[#851834] text-amber-100 shadow-xs'
                  : 'bg-stone-50 text-stone-700 border border-stone-200'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>{t('Settings', 'सेटिंग्स')}</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {hasOwnProfile ? (
              <button
                onClick={() => handleStartEditProfile(userProfiles[0])}
                className="flex-1 min-w-[140px] bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 text-[#4c0d1b] font-bold py-2 px-3 rounded-xl text-xs shadow-xs flex items-center justify-center gap-1.5 cursor-pointer font-serif"
              >
                <Edit3 className="w-3.5 h-3.5 shrink-0" />
                <span>{t('Edit My Profile (1/1)', 'प्रोफ़ाइल संपादित करें')}</span>
              </button>
            ) : (
              config.featureProfileCreationEnabled && (
                <button
                  onClick={handleStartCreateNewProfile}
                  className="flex-1 min-w-[140px] bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 text-[#4c0d1b] font-bold py-2 px-3 rounded-xl text-xs shadow-xs flex items-center justify-center gap-1.5 cursor-pointer font-serif"
                >
                  <Plus className="w-3.5 h-3.5 shrink-0" />
                  <span>{t('+ Create Profile', '+ नया बायोडाटा')}</span>
                </button>
              )
            )}

            {config.featureBusinessDirectoryEnabled && (
              <button
                onClick={handleStartCreateNewAd}
                className="flex-1 min-w-[140px] bg-rose-50 hover:bg-rose-100 text-[#851834] border border-rose-200 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer font-serif"
              >
                <Store className="w-3.5 h-3.5 shrink-0" />
                <span>{t('+ Post Business Ad', '+ व्यापार विज्ञापन')}</span>
              </button>
            )}
          </div>
        </div>
        
        {/* ====================================================== */}
        {/* SIDEBAR NAVIGATION (Desktop >= lg)                     */}
        {/* ====================================================== */}
        <aside className="hidden lg:block lg:col-span-3 bg-white rounded-3xl border border-rose-100 shadow-sm p-5 space-y-6">
          
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 px-3">
              {t('Workspace Menu', 'मेनू')}
            </span>

            <nav className="space-y-1 pt-1">
              {/* 1. Home / Dashboard */}
              <button
                onClick={() => { 
                  setActiveSection('overview'); 
                  setIsEditingProfile(false); 
                  setIsEditingAd(false); 
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeSection === 'overview' && !isEditingProfile && !isEditingAd
                    ? 'bg-gradient-to-r from-[#6e1628] to-[#851834] text-amber-100 shadow-sm'
                    : 'text-stone-700 hover:bg-rose-50 hover:text-[#851834]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <LayoutDashboard className="w-4 h-4" />
                  <span>{t('Home / Overview', 'होम / सारांश')}</span>
                </div>
              </button>

              {/* 2. Published Profiles */}
              <button
                onClick={() => { 
                  setActiveSection('profiles'); 
                  setIsEditingProfile(false); 
                  setIsEditingAd(false); 
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeSection === 'profiles' || isEditingProfile
                    ? 'bg-gradient-to-r from-[#6e1628] to-[#851834] text-amber-100 shadow-sm'
                    : 'text-stone-700 hover:bg-rose-50 hover:text-[#851834]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4" />
                  <span>{t('Published Profiles', 'प्रकाशित प्रोफ़ाइलें')}</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  activeSection === 'profiles' || isEditingProfile
                    ? 'bg-amber-300 text-[#4c0d1b]'
                    : 'bg-rose-100 text-[#851834]'
                }`}>
                  {userProfiles.length}
                </span>
              </button>

              {/* 3. Published Business Ads */}
              <button
                onClick={() => { 
                  setActiveSection('ads'); 
                  setIsEditingProfile(false); 
                  setIsEditingAd(false); 
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeSection === 'ads' || isEditingAd
                    ? 'bg-gradient-to-r from-[#6e1628] to-[#851834] text-amber-100 shadow-sm'
                    : 'text-stone-700 hover:bg-rose-50 hover:text-[#851834]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Store className="w-4 h-4" />
                  <span>{t('Published Ads', 'प्रकाशित विज्ञापन')}</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  activeSection === 'ads' || isEditingAd
                    ? 'bg-amber-300 text-[#4c0d1b]'
                    : 'bg-rose-100 text-[#851834]'
                }`}>
                  {userAds.length}
                </span>
              </button>

              {/* 4. Profiles I Liked (Saved Biodatas) */}
              {config.featureLikesEnabled && (
                <button
                  onClick={() => { 
                    setActiveSection('liked_by_me'); 
                    setIsEditingProfile(false); 
                    setIsEditingAd(false); 
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    activeSection === 'liked_by_me'
                      ? 'bg-gradient-to-r from-[#6e1628] to-[#851834] text-amber-100 shadow-sm'
                      : 'text-stone-700 hover:bg-rose-50 hover:text-[#851834]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20" />
                    <span>{t('Profiles I Liked', 'मेरी पसंद')}</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    activeSection === 'liked_by_me'
                      ? 'bg-amber-300 text-[#4c0d1b]'
                      : 'bg-rose-100 text-[#851834]'
                  }`}>
                    {likedProfileList.length}
                  </span>
                </button>
              )}

              {/* 5. Who Liked My Profile */}
              {config.featureLikesEnabled && (
                <button
                  onClick={() => { 
                    setActiveSection('who_liked_me'); 
                    setIsEditingProfile(false); 
                    setIsEditingAd(false); 
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    activeSection === 'who_liked_me'
                      ? 'bg-gradient-to-r from-[#6e1628] to-[#851834] text-amber-100 shadow-sm'
                      : 'text-stone-700 hover:bg-rose-50 hover:text-[#851834]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>{t('Who Liked Me', 'प्रशंसक')}</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    activeSection === 'who_liked_me'
                      ? 'bg-amber-300 text-[#4c0d1b]'
                      : 'bg-amber-100 text-amber-900'
                  }`}>
                    {admirers.length}
                  </span>
                </button>
              )}

              {/* 6. Chat Messages */}
              {config.featureChatEnabled && (
                <button
                  onClick={() => { 
                    setActiveSection('chats'); 
                    setIsEditingProfile(false); 
                    setIsEditingAd(false); 
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    activeSection === 'chats'
                      ? 'bg-gradient-to-r from-[#6e1628] to-[#851834] text-amber-100 shadow-sm'
                      : 'text-stone-700 hover:bg-rose-50 hover:text-[#851834]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    <span>{t('Chat Messages', 'चैट संदेश')}</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    activeSection === 'chats'
                      ? 'bg-amber-300 text-[#4c0d1b]'
                      : 'bg-emerald-100 text-emerald-900'
                  }`}>
                    {Object.keys(chatThreads).length || t('Live', 'लाइव')}
                  </span>
                </button>
              )}

              {/* 7. Media Assets */}
              <button
                onClick={() => { 
                  setActiveSection('media'); 
                  setIsEditingProfile(false); 
                  setIsEditingAd(false); 
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeSection === 'media' && !isEditingProfile && !isEditingAd
                    ? 'bg-gradient-to-r from-[#6e1628] to-[#851834] text-amber-100 shadow-sm'
                    : 'text-stone-700 hover:bg-rose-50 hover:text-[#851834]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ImageIcon className="w-4 h-4" />
                  <span>{t('Media Assets', 'मीडिया फ़ाइलें')}</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  activeSection === 'media' && !isEditingProfile && !isEditingAd
                    ? 'bg-amber-300 text-[#4c0d1b]'
                    : 'bg-stone-100 text-stone-600'
                }`}>
                  {mediaAssets.length}
                </span>
              </button>

              {/* 8. Settings */}
              <button
                onClick={() => { 
                  setActiveSection('settings'); 
                  setIsEditingProfile(false); 
                  setIsEditingAd(false); 
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeSection === 'settings' && !isEditingProfile && !isEditingAd
                    ? 'bg-gradient-to-r from-[#6e1628] to-[#851834] text-amber-100 shadow-sm'
                    : 'text-stone-700 hover:bg-rose-50 hover:text-[#851834]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Settings className="w-4 h-4" />
                  <span>{t('Settings', 'सेटिंग्स')}</span>
                </div>
              </button>
            </nav>
          </div>

          {/* Quick Action CTAs in Sidebar */}
          <div className="pt-2 space-y-2">
            {hasOwnProfile ? (
              <button
                onClick={() => handleStartEditProfile(userProfiles[0])}
                className="w-full bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:from-amber-200 hover:to-amber-400 text-[#4c0d1b] font-bold py-2.5 px-4 rounded-2xl text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-101 font-serif"
              >
                <Edit3 className="w-4 h-4" />
                <span>{t('Edit My Profile (1/1)', 'प्रोफ़ाइल संपादित करें (1/1)')}</span>
              </button>
            ) : (
              config.featureProfileCreationEnabled && (
                <button
                  onClick={handleStartCreateNewProfile}
                  className="w-full bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:from-amber-200 hover:to-amber-400 text-[#4c0d1b] font-bold py-2.5 px-4 rounded-2xl text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-101 font-serif"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t('+ Create Profile', '+ नया बायोडाटा जोड़ें')}</span>
                </button>
              )
            )}

            {config.featureBusinessDirectoryEnabled && (
              <button
                onClick={handleStartCreateNewAd}
                className="w-full bg-rose-50 hover:bg-rose-100 text-[#851834] border border-rose-200 font-bold py-2.5 px-4 rounded-2xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer font-serif"
              >
                <Store className="w-4 h-4" />
                <span>{t('+ Post Business Ad', '+ व्यापार विज्ञापन जोड़ें')}</span>
              </button>
            )}
          </div>

          {/* Membership Subscription Status Card in Sidebar (Shown when Subscription Enabled) */}
          {config.subscriptionEnabled && (
            <div className={`rounded-2xl p-3.5 border text-xs space-y-1.5 ${
              userSubscription?.active
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-300 text-amber-950'
            }`}>
              <div className="flex items-center gap-1.5 font-bold font-serif">
                <Crown className={`w-4 h-4 ${userSubscription?.active ? 'text-emerald-600' : 'text-amber-600'}`} />
                <span>
                  {userSubscription?.active
                    ? t('Premium Samaj Pass Active', 'प्रीमियम समाज पास सक्रिय')
                    : t('Membership Plan Available', 'सदस्यता प्लान उपलब्ध')}
                </span>
              </div>
              <p className="text-[11px] opacity-85 leading-relaxed">
                {userSubscription?.active
                  ? t(
                      `${userSubscription.plan === 'lifetime' ? 'Lifetime VIP' : 'Annual Gold'} Plan (₹${userSubscription.pricePaid})`,
                      `${userSubscription.plan === 'lifetime' ? 'आजीवन VIP' : 'वार्षिक गोल्ड'} प्लान (₹${userSubscription.pricePaid})`
                    )
                  : t(
                      `Unlock unlimited contacts starting ₹${config.annualPlanPrice}/yr`,
                      `₹${config.annualPlanPrice}/वर्ष से असीमित संपर्क अनलॉक करें`
                    )}
              </p>
              {!userSubscription?.active && (
                <button
                  onClick={() => onNavigateTab('matrimony')}
                  className="text-[11px] font-bold text-[#851834] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {t('View Plans', 'प्लान देखें')} <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {/* Trust Banner Card in Sidebar */}
          <div className="bg-rose-50/50 rounded-2xl p-4 border border-rose-100 text-xs space-y-2">
            <div className="flex items-center gap-1.5 text-[#851834] font-bold font-serif">
              <ShieldCheck className="w-4 h-4 text-[#851834]" />
              <span>{t('100% Verified Directory', '100% सत्यापित डायरेक्टरी')}</span>
            </div>
            <p className="text-stone-500 text-[11px] font-light leading-relaxed">
              {t('Your listings are screened against Rathore Samaj registry to protect community trust.', 'समाज के विश्वास की रक्षा के लिए आपकी जानकारी राठौर समाज रजिस्ट्री में सत्यापित होती है।')}
            </p>
            <button
              onClick={() => onNavigateTab('matrimony')}
              className="text-[11px] font-bold text-[#851834] hover:underline flex items-center gap-1 pt-1"
            >
              {t('Public Directory', 'पब्लिक डायरेक्टरी')} <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </aside>

        {/* ====================================================== */}
        {/* MAIN DASHBOARD CONTENT VIEWPORT                        */}
        {/* ====================================================== */}
        <main className="lg:col-span-9 space-y-6">

          {/* ==================================================== */}
          {/* VIEW A: INLINE PROFILE EDITOR                        */}
          {/* ==================================================== */}
          {isEditingProfile && editingProfile && (
            <div className="bg-white rounded-3xl border border-rose-100 shadow-sm p-4 sm:p-8 space-y-6 animate-in fade-in">
              <div className="flex items-start justify-between gap-3 border-b border-rose-100 pb-4">
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#851834] font-serif bg-rose-50 px-3 py-1 rounded-full border border-rose-200 inline-block mb-1">
                    {t('Inline Profile Editor', 'प्रोफ़ाइल संपादक')}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 break-words">
                    {editingProfile.name
                      ? t(`Edit Profile: ${editingProfile.name}`, `प्रोफ़ाइल संपादित करें: ${editingProfile.name}`)
                      : t('Create New Matrimonial Biodata', 'नया वैवाहिक बायोडाटा बनाएं')}
                  </h3>
                  <p className="text-xs text-stone-500 font-light mt-0.5">
                    {t(
                      'Update candidate biodata, photos, media gallery, contact details, social handles, and public visibility.',
                      'प्रत्याशी का बायोडाटा, फोटो, संपर्क विवरण, सोशल हैंडल और पब्लिक दृश्यता अपडेट करें।'
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="p-2 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors"
                  aria-label={t('Cancel', 'रद्द करें')}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {profileFormError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{profileFormError}</span>
                </div>
              )}

              <form onSubmit={handleSaveProfileEdits} className="space-y-6">
                
                {/* 1. Basic Info & Candidate Bio */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#851834] font-serif flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5" /> {t('1. Candidate Identity & Background', '1. प्रत्याशी पहचान एवं पृष्ठभूमि')}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={editingProfile.name}
                        onChange={(e) => setEditingProfile({ ...editingProfile, name: e.target.value })}
                        placeholder="e.g. Ritik Solanki"
                        className="w-full p-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-rose-500/20 bg-stone-50/40"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-stone-700 mb-1">Gender *</label>
                      <select
                        value={editingProfile.gender}
                        onChange={(e) => setEditingProfile({ ...editingProfile, gender: e.target.value as 'Male' | 'Female' })}
                        className="w-full p-2.5 rounded-xl border border-stone-200 bg-white"
                      >
                        <option value="Male">Male (Groom)</option>
                        <option value="Female">Female (Bride)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-stone-700 mb-1">Age (Years) *</label>
                      <input
                        type="number"
                        min="18"
                        max="70"
                        value={editingProfile.age}
                        onChange={(e) => setEditingProfile({ ...editingProfile, age: Number(e.target.value) || 26 })}
                        className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50/40"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-stone-700 mb-1">Gotra *</label>
                      <input
                        type="text"
                        required
                        value={editingProfile.gotra}
                        onChange={(e) => setEditingProfile({ ...editingProfile, gotra: e.target.value })}
                        placeholder="e.g. Kashyap / Solanki"
                        className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50/40"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-stone-700 mb-1">Height</label>
                      <input
                        type="text"
                        value={editingProfile.height || ''}
                        onChange={(e) => setEditingProfile({ ...editingProfile, height: e.target.value })}
                        placeholder="e.g. 5' 9&quot;"
                        className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50/40"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-stone-700 mb-1">Annual Package / Income</label>
                      <input
                        type="text"
                        value={editingProfile.income || ''}
                        onChange={(e) => setEditingProfile({ ...editingProfile, income: e.target.value })}
                        placeholder="e.g. 18 LPA"
                        className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50/40"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-stone-700 mb-1">Education *</label>
                      <input
                        type="text"
                        required
                        value={editingProfile.education}
                        onChange={(e) => setEditingProfile({ ...editingProfile, education: e.target.value })}
                        placeholder="e.g. B.Tech (CS) / MBA"
                        className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50/40"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-stone-700 mb-1">Profession / Designation *</label>
                      <input
                        type="text"
                        required
                        value={editingProfile.profession}
                        onChange={(e) => setEditingProfile({ ...editingProfile, profession: e.target.value })}
                        placeholder="e.g. Senior Software Engineer"
                        className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50/40"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-stone-700 mb-1">City of Residence *</label>
                      <input
                        type="text"
                        required
                        value={editingProfile.city}
                        onChange={(e) => setEditingProfile({ ...editingProfile, city: e.target.value })}
                        placeholder="e.g. Indore"
                        className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50/40"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Candidate Bio & About *</label>
                    <textarea
                      rows={3}
                      value={editingProfile.about || ''}
                      onChange={(e) => setEditingProfile({ ...editingProfile, about: e.target.value })}
                      placeholder="Share candidate hobbies, outlook on life, family values, and marriage alliance expectations..."
                      className="w-full p-2.5 rounded-xl border border-stone-200 text-xs bg-stone-50/40"
                    />
                  </div>
                </div>

                {/* 2. Avatar & Background Cover Photos */}
                <div className="space-y-4 pt-2 border-t border-rose-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#851834] font-serif flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5" /> 2. Avatar & Background Cover Photos
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <ImageUploadField
                      label={t('Avatar Profile Photo', 'प्रोफ़ाइल फ़ोटो')}
                      value={editingProfile.photo || ''}
                      onChange={(url) => setEditingProfile({ ...editingProfile, photo: url })}
                      variant="avatar"
                      maxDimension={720}
                      urlPlaceholder="https://images.unsplash.com/photo-..."
                    />

                    <ImageUploadField
                      label={t('Background Cover Photo', 'बैकग्राउंड कवर फ़ोटो')}
                      value={editingProfile.coverPhoto || ''}
                      onChange={(url) => setEditingProfile({ ...editingProfile, coverPhoto: url })}
                      variant="banner"
                      maxDimension={960}
                      urlPlaceholder="https://images.unsplash.com/photo-..."
                    />
                  </div>
                </div>

                {/* 3. Media Gallery */}
                <div className="space-y-3 pt-2 border-t border-rose-100">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#851834] font-serif flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5" /> {t('3. Additional Media Gallery & Kundali', '3. अतिरिक्त फोटो गैलरी एवं कुंडली')}
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowGalleryAddInput(!showGalleryAddInput)}
                      className="text-xs font-bold text-[#851834] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> {t('Add Gallery Photo', 'गैलरी फोटो जोड़ें')}
                    </button>
                  </div>

                  {showGalleryAddInput && (
                    <div className="flex flex-wrap gap-2 items-center bg-rose-50/40 p-2.5 rounded-xl border border-rose-100 text-xs">
                      <label className="bg-white hover:bg-amber-50 text-[#380812] border border-amber-300 px-3 py-2 rounded-lg font-bold cursor-pointer flex items-center gap-1.5 shrink-0">
                        <Upload className="w-3.5 h-3.5 text-amber-700" />
                        <span>{t('Upload Photos (Multiple)', 'एक या अधिक फ़ोटो अपलोड करें')}</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="sr-only"
                          onChange={async (e) => {
                            const files: File[] = Array.from(e.target.files || []);
                            e.target.value = '';
                            if (files.length === 0) return;
                            const uploaded: string[] = [];
                            for (const file of files.slice(0, 6)) {
                              try {
                                const dataUrl = await compressAndReadImageFile(file, { maxDimension: 840, quality: 0.82 });
                                uploaded.push(dataUrl);
                              } catch {
                                // Skip unreadable files
                              }
                            }
                            if (uploaded.length > 0) {
                              const currentGallery = editingProfile.gallery || [];
                              setEditingProfile({
                                ...editingProfile,
                                photo: editingProfile.photo || uploaded[0],
                                gallery: Array.from(new Set([...currentGallery, ...uploaded]))
                              });
                              setShowGalleryAddInput(false);
                            }
                          }}
                        />
                      </label>
                      <input
                        type="url"
                        value={newGalleryUrlInput}
                        onChange={(e) => setNewGalleryUrlInput(e.target.value)}
                        placeholder={t('Or paste photo / Kundali URL (https://...)', 'या फ़ोटो / कुंडली URL डालें (https://...)')}
                        className="flex-1 min-w-[160px] p-2 rounded-lg border border-stone-200 bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newGalleryUrlInput.trim()) {
                            const currentGallery = editingProfile.gallery || [];
                            setEditingProfile({
                              ...editingProfile,
                              gallery: Array.from(new Set([...currentGallery, newGalleryUrlInput.trim()]))
                            });
                            setNewGalleryUrlInput('');
                            setShowGalleryAddInput(false);
                          }
                        }}
                        className="bg-[#851834] text-amber-100 px-3 py-2 rounded-lg font-bold cursor-pointer shrink-0"
                      >
                        {t('Add URL', 'लिंक जोड़ें')}
                      </button>
                    </div>
                  )}

                  {editingProfile.gallery && editingProfile.gallery.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {editingProfile.gallery.map((imgUrl, i) => {
                        const isMain = imgUrl === editingProfile.photo;
                        return (
                          <div key={i} className={`relative rounded-2xl overflow-hidden group border ${isMain ? 'border-amber-500 ring-2 ring-amber-400/40' : 'border-stone-200'}`}>
                            <div className="h-24 w-full bg-stone-100">
                              <img src={imgUrl} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover object-top" />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = editingProfile.gallery?.filter((_, idx) => idx !== i) || [];
                                setEditingProfile({ ...editingProfile, gallery: updated });
                              }}
                              title={t('Remove photo', 'फ़ोटो हटाएं')}
                              className="absolute top-1.5 right-1.5 bg-black/75 hover:bg-red-700 text-white p-1 rounded-full cursor-pointer transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingProfile({ ...editingProfile, photo: imgUrl })}
                              className={`w-full py-1 px-2 text-[10px] font-bold border-t cursor-pointer transition-colors ${
                                isMain
                                  ? 'bg-[#380812] text-amber-200 border-amber-400/30'
                                  : 'bg-white hover:bg-amber-50 text-stone-700 border-stone-200'
                              }`}
                            >
                              {isMain ? t('★ Primary Photo', '★ मुख्य फ़ोटो') : t('Set Primary', 'मुख्य बनाएं')}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[11px] text-stone-400 font-light italic">
                      {t('No additional photos added yet. Click "+ Add Gallery Photo" above.', 'अभी कोई अतिरिक्त फोटो नहीं जोड़ी गई है। ऊपर "+ गैलरी फोटो जोड़ें" पर क्लिक करें।')}
                    </p>
                  )}
                </div>

                {/* 4. Family & Contact Info */}
                <div className="space-y-4 pt-2 border-t border-rose-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#851834] font-serif flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" /> {t('4. Contact & Family Details', '4. संपर्क एवं पारिवारिक विवरण')}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-stone-700">{t('Primary Verified Phone / WhatsApp (10 digits) *', 'प्राथमिक मोबाइल / व्हाट्सएप नंबर (10 अंक) *')}</label>
                        <span className={`text-[10px] font-mono ${sanitizePhoneInput(editingProfile.contact || '').length === 10 ? 'text-emerald-600 font-bold' : 'text-stone-400'}`}>
                          {sanitizePhoneInput(editingProfile.contact || '').length}/10
                        </span>
                      </div>
                      <input
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        required
                        value={editingProfile.contact}
                        onChange={(e) => {
                          setProfileFormError('');
                          setEditingProfile({ ...editingProfile, contact: sanitizePhoneInput(e.target.value) });
                        }}
                        placeholder={t('10-digit mobile number (e.g. 9826012345)', '10 अंकों का नंबर (जैसे 9826012345)')}
                        className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50/40"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-stone-700 mb-1">{t('Family Lineage Summary', 'पारिवारिक वंश विवरण')}</label>
                      <input
                        type="text"
                        value={editingProfile.familyDetails || ''}
                        onChange={(e) => setEditingProfile({ ...editingProfile, familyDetails: e.target.value })}
                        placeholder={t('Father, Mother, Gotra lineage...', 'पिता, माता, गोत्र आदि...')}
                        className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50/40"
                      />
                    </div>
                  </div>
                </div>

                {/* 5. Social & Professional Links */}
                <div className="space-y-4 pt-2 border-t border-rose-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#851834] font-serif flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5" /> 5. Social & Professional Links
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="block font-bold text-stone-700 mb-1 flex items-center gap-1">
                        <Linkedin className="w-3 h-3 text-blue-600" /> LinkedIn URL
                      </label>
                      <input
                        type="url"
                        value={editingProfile.socialLinks?.linkedin || ''}
                        onChange={(e) => setEditingProfile({
                          ...editingProfile,
                          socialLinks: { ...editingProfile.socialLinks, linkedin: e.target.value }
                        })}
                        placeholder="https://linkedin.com/in/..."
                        className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50/40"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-stone-700 mb-1 flex items-center gap-1">
                        <Instagram className="w-3 h-3 text-pink-600" /> Instagram Handle
                      </label>
                      <input
                        type="text"
                        value={editingProfile.socialLinks?.instagram || ''}
                        onChange={(e) => setEditingProfile({
                          ...editingProfile,
                          socialLinks: { ...editingProfile.socialLinks, instagram: e.target.value }
                        })}
                        placeholder="@username"
                        className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50/40"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-stone-700 mb-1 flex items-center gap-1">
                        <Globe className="w-3 h-3 text-emerald-600" /> Portfolio / Website
                      </label>
                      <input
                        type="url"
                        value={editingProfile.socialLinks?.website || ''}
                        onChange={(e) => setEditingProfile({
                          ...editingProfile,
                          socialLinks: { ...editingProfile.socialLinks, website: e.target.value }
                        })}
                        placeholder="https://..."
                        className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50/40"
                      />
                    </div>
                  </div>
                </div>

                {/* 6. Public Visibility Settings */}
                <div className="space-y-3 pt-2 border-t border-rose-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#851834] font-serif flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5" /> 6. Public Visibility & Status
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">Publication Status</label>
                      <select
                        value={editingProfile.status}
                        onChange={(e) => setEditingProfile({ ...editingProfile, status: e.target.value as ProfileStatus })}
                        className="w-full p-2.5 rounded-xl border border-stone-200 bg-white"
                      >
                        <option value="active">Active • Live on Directory</option>
                        <option value="draft">Draft • In Review</option>
                        <option value="archived">Archived • Paused</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-stone-700 mb-1">Audience Visibility</label>
                      <select
                        value={editingProfile.visibility}
                        onChange={(e) => setEditingProfile({ ...editingProfile, visibility: e.target.value as VisibilitySetting })}
                        className="w-full p-2.5 rounded-xl border border-stone-200 bg-white"
                      >
                        <option value="public">Public to All Samaj Members</option>
                        <option value="verified_only">Verified Members Only</option>
                        <option value="private">Private (Only by Direct Request)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="pt-4 border-t border-rose-100 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-stone-200 text-stone-700 font-semibold text-xs hover:bg-stone-50 cursor-pointer"
                  >
                    {t('Cancel & Discard', 'रद्द करें')}
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-[#6e1628] via-[#851834] to-[#6e1628] hover:opacity-95 text-amber-100 font-bold rounded-xl text-xs shadow-md border border-amber-300/30 cursor-pointer"
                  >
                    {t('Save & Update Profile', 'प्रोफ़ाइल सहेजें व अपडेट करें')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ==================================================== */}
          {/* VIEW B: INLINE BUSINESS AD EDITOR                    */}
          {/* ==================================================== */}
          {isEditingAd && editingAd && (
            <div className="bg-white rounded-3xl border border-rose-100 shadow-sm p-4 sm:p-8 space-y-6 animate-in fade-in">
              <div className="flex items-start justify-between gap-3 border-b border-rose-100 pb-4">
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#851834] font-serif bg-rose-50 px-3 py-1 rounded-full border border-rose-200 inline-block mb-1">
                    {t('Business Ad Editor', 'व्यापार विज्ञापन संपादक')}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 break-words">
                    {editingAd.title
                      ? t(`Edit Business Ad: ${editingAd.title}`, `विज्ञापन संपादित करें: ${editingAd.title}`)
                      : t('Post New Business Advertisement', 'नया व्यापार विज्ञापन जोड़ें')}
                  </h3>
                  <p className="text-xs text-stone-500 font-light mt-0.5">
                    {t(
                      'Promote your showroom, wholesale agency, or professional service to thousands of community families.',
                      'अपने शोरूम, व्यवसाय या पेशेवर सेवा को हजारों समाज परिवारों तक पहुंचाएं।'
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingAd(false)}
                  className="p-2 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors"
                  aria-label={t('Cancel', 'रद्द करें')}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {adFormError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{adFormError}</span>
                </div>
              )}

              <form onSubmit={handleSaveAdEdits} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">{t('Business / Firm Title *', 'व्यवसाय / फर्म का नाम *')}</label>
                    <input
                      type="text"
                      required
                      value={editingAd.title}
                      onChange={(e) => setEditingAd({ ...editingAd, title: e.target.value })}
                      placeholder={t('e.g. Rathore Jewellers & Sons', 'जैसे: राठौर ज्वेलर्स एंड संस')}
                      className="w-full p-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-rose-500/20 bg-stone-50/40"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 mb-1">{t('Owner Name *', 'संचालक का नाम *')}</label>
                    <input
                      type="text"
                      required
                      value={editingAd.owner}
                      onChange={(e) => setEditingAd({ ...editingAd, owner: e.target.value })}
                      placeholder={t('e.g. Rameshwar Rathore', 'जैसे: रामेश्वर राठौर')}
                      className="w-full p-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-rose-500/20 bg-stone-50/40"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">{t('Category *', 'श्रेणी *')}</label>
                    <select
                      value={editingAd.category}
                      onChange={(e) => setEditingAd({ ...editingAd, category: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-stone-200 bg-white"
                    >
                      <option value="Clothing & Retail">{t('Clothing & Retail', 'कपड़े और रिटेल')}</option>
                      <option value="Hardware & Home Imprv.">{t('Hardware & Home Imprv.', 'हार्डवेयर व गृह निर्माण')}</option>
                      <option value="Jewelry & Gold">{t('Jewelry & Gold', 'ज्वेलरी व आभूषण')}</option>
                      <option value="Wedding Services & Catering">{t('Wedding Planning & Catering', 'विवाह सेवाएं एवं कैटरिंग')}</option>
                      <option value="Healthcare & Pharmacy">{t('Healthcare & Pharmacy', 'स्वास्थ्य और फार्मेसी')}</option>
                      <option value="Food & Restaurants">{t('Food & Sweets', 'भोजन व मिष्ठान')}</option>
                      <option value="Automobile">{t('Automobile & Transport', 'ऑटोमोबाइल व परिवहन')}</option>
                      <option value="Other">{t('Other Business', 'अन्य व्यवसाय')}</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-stone-700">{t('Phone / WhatsApp (10 digits) *', 'मोबाइल / व्हाट्सएप (10 अंक) *')}</label>
                      <span className={`text-[10px] font-mono ${sanitizePhoneInput(editingAd.phone || '').length === 10 ? 'text-emerald-600 font-bold' : 'text-stone-400'}`}>
                        {sanitizePhoneInput(editingAd.phone || '').length}/10
                      </span>
                    </div>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      required
                      value={editingAd.phone}
                      onChange={(e) => {
                        setAdFormError('');
                        setEditingAd({ ...editingAd, phone: sanitizePhoneInput(e.target.value) });
                      }}
                      placeholder={t('10-digit mobile number', '10 अंकों का मोबाइल नंबर')}
                      className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50/40"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 mb-1">{t('City *', 'शहर *')}</label>
                    <input
                      type="text"
                      required
                      value={editingAd.city || 'Indore'}
                      onChange={(e) => setEditingAd({ ...editingAd, city: e.target.value })}
                      placeholder={t('e.g. Indore', 'जैसे: इंदौर')}
                      className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50/40"
                    />
                  </div>
                </div>

                <div className="text-xs">
                  <label className="block font-bold text-stone-700 mb-1">Full Shop / Showroom Address *</label>
                  <input
                    type="text"
                    required
                    value={editingAd.address}
                    onChange={(e) => setEditingAd({ ...editingAd, address: e.target.value })}
                    placeholder="e.g. 142, Rajwada Main Market, Indore"
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50/40"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Samaj Special Offer</label>
                    <input
                      type="text"
                      value={editingAd.offer || ''}
                      onChange={(e) => setEditingAd({ ...editingAd, offer: e.target.value })}
                      placeholder="e.g. 10% Extra Discount for Rathore Samaj Members"
                      className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50/40"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Status on Directory</label>
                    <select
                      value={editingAd.status || 'active'}
                      onChange={(e) => setEditingAd({ ...editingAd, status: e.target.value as any })}
                      className="w-full p-2.5 rounded-xl border border-stone-200 bg-white"
                    >
                      <option value="active">Active • Live in Directory</option>
                      <option value="draft">Draft • Private Review</option>
                      <option value="paused">Paused • Temporarily Inactive</option>
                    </select>
                  </div>
                </div>

                <ImageUploadField
                  label={t('Shop Photo / Storefront Banner', 'दुकान की फ़ोटो / बैनर')}
                  value={editingAd.banner || ''}
                  onChange={(url) => setEditingAd({ ...editingAd, banner: url })}
                  variant="banner"
                  maxDimension={960}
                  urlPlaceholder="https://images.unsplash.com/photo-..."
                />

                <div className="text-xs">
                  <label className="block font-bold text-stone-700 mb-1">Shop Description & Specialities</label>
                  <textarea
                    rows={3}
                    value={editingAd.description || editingAd.tagline || ''}
                    onChange={(e) => setEditingAd({ ...editingAd, description: e.target.value, tagline: e.target.value.slice(0, 80) })}
                    placeholder="Describe your products, custom tailoring, wholesale deals, or exclusive community facilities..."
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50/40"
                  />
                </div>

                <div className="bg-rose-50/40 p-3.5 rounded-2xl border border-rose-200/60 flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    id="adFeatured"
                    checked={editingAd.isFeatured || false}
                    onChange={(e) => setEditingAd({ ...editingAd, isFeatured: e.target.checked })}
                    className="w-4 h-4 rounded text-[#851834] border-rose-300 focus:ring-rose-500" 
                  />
                  <label htmlFor="adFeatured" className="text-xs font-bold text-stone-900 cursor-pointer">
                    ⭐ Mark as Featured Ad (Top Placement with Golden Badge in Directory)
                  </label>
                </div>

                <div className="pt-4 border-t border-rose-100 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 sm:gap-3">
                    <button
                      type="button"
                      onClick={() => setIsEditingAd(false)}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-stone-200 text-stone-700 font-semibold text-xs hover:bg-stone-50 cursor-pointer"
                    >
                      {t('Cancel', 'रद्द करें')}
                    </button>
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-[#6e1628] via-[#851834] to-[#6e1628] hover:opacity-95 text-amber-100 font-bold rounded-xl text-xs shadow-md border border-amber-300/30 cursor-pointer"
                    >
                      {t('Save & Publish Ad', 'विज्ञापन सहेजें व प्रकाशित करें')}
                    </button>
                  </div>
                </form>
              </div>
          )}

          {/* ==================================================== */}
          {/* VIEW C: OVERVIEW / DASHBOARD HOME                    */}
          {/* ==================================================== */}
          {!isEditingProfile && !isEditingAd && activeSection === 'overview' && (
            <div className="space-y-5 sm:space-y-6 animate-in fade-in">
              
              {/* Welcome Banner */}
              <div className="bg-gradient-to-r from-[#6e1628] via-[#851834] to-[#6e1628] rounded-3xl p-5 sm:p-8 text-white shadow-md border border-amber-400/30 relative overflow-hidden">
                <div className="relative z-10 space-y-2 max-w-xl">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-amber-300/40 text-amber-200 text-xs font-semibold backdrop-blur-xs font-serif">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>{t('Member Management Console', 'सदस्य प्रबंधन कंसोल')}</span>
                  </span>
                  <h3 className="text-xl sm:text-3xl font-serif font-bold text-amber-50">
                    {t(`Welcome, ${authSession?.name || 'Samaj Member'}`, `स्वागत है, ${authSession?.name || 'समाज सदस्य'}`)}
                  </h3>
                  <p className="text-xs sm:text-sm text-rose-100/90 font-light leading-relaxed">
                    {t(
                      'Manage your published candidate profiles, business ads, horoscopes, and contact privacy settings for the Rathore Samaj network.',
                      'राठौर समाज नेटवर्क के लिए अपने प्रकाशित बायोडाटा, व्यापार विज्ञापन और गोपनीयता सेटिंग्स प्रबंधित करें।'
                    )}
                  </p>
                  <div className="pt-2 flex flex-wrap gap-2.5">
                    {hasOwnProfile ? (
                      <button
                        onClick={() => handleStartEditProfile(userProfiles[0])}
                        className="bg-gradient-to-r from-amber-300 to-amber-400 text-[#4c0d1b] font-bold px-4 py-2 rounded-xl text-xs shadow cursor-pointer font-serif"
                      >
                        {t('Edit My Profile (1/1 Limit)', 'मेरा बायोडाटा संपादित करें (1/1)')}
                      </button>
                    ) : (
                      config.featureProfileCreationEnabled && (
                        <button
                          onClick={handleStartCreateNewProfile}
                          className="bg-gradient-to-r from-amber-300 to-amber-400 text-[#4c0d1b] font-bold px-4 py-2 rounded-xl text-xs shadow cursor-pointer font-serif"
                        >
                          {t('+ Create Matrimony Profile', '+ नया बायोडाटा जोड़ें')}
                        </button>
                      )
                    )}
                    {config.featureBusinessDirectoryEnabled && (
                      <button
                        onClick={handleStartCreateNewAd}
                        className="bg-white/15 hover:bg-white/25 text-amber-100 border border-amber-300/30 font-semibold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
                      >
                        {t('+ Post Business Ad', '+ व्यापार विज्ञापन जोड़ें')}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 4 Overview Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div 
                  onClick={() => setActiveSection('profiles')}
                  className="bg-white p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-rose-100 shadow-xs text-center space-y-1 cursor-pointer hover:border-rose-300 transition-colors"
                >
                  <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">{t('Active Profiles', 'सक्रिय बायोडाटा')}</span>
                  <p className="text-2xl sm:text-3xl font-serif font-bold text-[#851834]">{activeProfilesCount}</p>
                  <p className="text-[11px] text-emerald-600 font-medium">{t('Live on Directory', 'डायरेक्टरी में लाइव')}</p>
                </div>

                <div 
                  onClick={() => setActiveSection('ads')}
                  className="bg-white p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-rose-100 shadow-xs text-center space-y-1 cursor-pointer hover:border-rose-300 transition-colors"
                >
                  <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">{t('Published Ads', 'प्रकाशित विज्ञापन')}</span>
                  <p className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">{activeAdsCount}</p>
                  <p className="text-[11px] text-emerald-600 font-medium">{t('Business Directory', 'व्यापार डायरेक्टरी')}</p>
                </div>

                <div 
                  onClick={() => setActiveSection('media')}
                  className="bg-white p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-rose-100 shadow-xs text-center space-y-1 cursor-pointer hover:border-rose-300 transition-colors"
                >
                  <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">{t('Media Assets', 'मीडिया फ़ाइलें')}</span>
                  <p className="text-2xl sm:text-3xl font-serif font-bold text-stone-800">{mediaAssets.length}</p>
                  <p className="text-[11px] text-stone-400 font-light">{t('Photos & Kundalis', 'फोटो और कुंडली')}</p>
                </div>

                <div className="bg-white p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-rose-100 shadow-xs text-center space-y-1">
                  <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">{t('Samaj Trust Score', 'समाज विश्वास स्कोर')}</span>
                  <p className="text-2xl sm:text-3xl font-serif font-bold text-emerald-700">100%</p>
                  <p className="text-[11px] text-emerald-600 font-medium">{t('Verified Gotra', 'सत्यापित गोत्र')}</p>
                </div>
              </div>

              {/* Recent Community Activity Feed */}
              <div className="bg-white rounded-3xl border border-rose-100 shadow-sm p-4 sm:p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-rose-100 pb-3">
                  <h4 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#851834]" />
                    Recent Samaj Activity
                  </h4>
                  <span className="text-xs text-stone-400">Live Network</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-rose-50/40 border border-rose-100">
                    <div className="w-8 h-8 rounded-xl bg-rose-100 text-[#851834] flex items-center justify-center font-bold shrink-0">
                      👁️
                    </div>
                    <div>
                      <p className="font-bold text-stone-800">Biodata View Registered</p>
                      <p className="text-stone-500 font-light">A verified family from Indore viewed the candidate biodata.</p>
                      <span className="text-[10px] text-stone-400">2 hours ago</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">
                      🏬
                    </div>
                    <div>
                      <p className="font-bold text-stone-800">Business Inquiry Received</p>
                      <p className="text-stone-500 font-light">A customer clicked on your store phone number from the Business Directory.</p>
                      <span className="text-[10px] text-stone-400">5 hours ago</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-stone-50/80 border border-stone-100">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold shrink-0">
                      💍
                    </div>
                    <div>
                      <p className="font-bold text-stone-800">Gotra Match Notification</p>
                      <p className="text-stone-500 font-light">14 new compatible profiles matching your criteria were listed in the directory.</p>
                      <span className="text-[10px] text-stone-400">Yesterday</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* VIEW D: PUBLISHED PROFILES (Grid & Actions)          */}
          {/* ==================================================== */}
          {!isEditingProfile && !isEditingAd && activeSection === 'profiles' && (
            <div className="space-y-5 animate-in fade-in">
              
              {/* Header Bar & Status Switcher */}
              <div className="bg-white rounded-3xl border border-rose-100 p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg sm:text-xl font-serif font-bold text-stone-900">
                    {t('Published Candidate Profiles', 'प्रकाशित प्रत्याशी बायोडाटा')}
                  </h3>
                  <p className="text-xs text-stone-500 font-light">
                    {t('Manage active and draft listings, edit media assets, and view live directory previews.', 'सक्रिय और ड्राफ्ट लिस्टिंग प्रबंधित करें, फोटो बदलें और लाइव प्रीव्यू देखें।')}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <div className="flex flex-wrap bg-stone-100 p-1 rounded-xl border border-stone-200">
                    <button
                      onClick={() => setProfileStatusFilter('all')}
                      className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                        profileStatusFilter === 'all'
                          ? 'bg-[#851834] text-amber-100 shadow-xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      {t(`All (${userProfiles.length})`, `सभी (${userProfiles.length})`)}
                    </button>
                    <button
                      onClick={() => setProfileStatusFilter('active')}
                      className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                        profileStatusFilter === 'active'
                          ? 'bg-[#851834] text-amber-100 shadow-xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      {t(`Active (${activeProfilesCount})`, `सक्रिय (${activeProfilesCount})`)}
                    </button>
                    <button
                      onClick={() => setProfileStatusFilter('draft')}
                      className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                        profileStatusFilter === 'draft'
                          ? 'bg-[#851834] text-amber-100 shadow-xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      {t(`Draft (${draftProfilesCount})`, `ड्राफ्ट (${draftProfilesCount})`)}
                    </button>
                  </div>

                  {hasOwnProfile ? (
                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 whitespace-nowrap">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{t('1 / 1 Profile Used', '1 / 1 प्रोफ़ाइल सक्रिय')}</span>
                    </span>
                  ) : (
                    config.featureProfileCreationEnabled && (
                      <button
                        onClick={handleStartCreateNewProfile}
                        className="bg-gradient-to-r from-[#6e1628] via-[#851834] to-[#6e1628] text-amber-100 font-bold px-3.5 py-1.5 rounded-xl text-xs shadow-sm flex items-center gap-1.5 cursor-pointer border border-amber-300/30 whitespace-nowrap"
                      >
                        <Plus className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                        <span>{t('New Profile', 'नया बायोडाटा')}</span>
                      </button>
                    )
                  )}
                </div>
              </div>

              {profileLimitNotice && (
                <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs text-amber-950">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>
                      {t(
                        'Only 1 matrimonial profile can be added per login. Please edit or delete your existing profile below.',
                        'प्रति लॉगिन केवल 1 वैवाहिक प्रोफ़ाइल जोड़ी जा सकती है। कृपया नीचे अपनी मौजूदा प्रोफ़ाइल संपादित करें या हटाएं।'
                      )}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setProfileLimitNotice(false)}
                    className="text-amber-800 hover:text-amber-950 font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* EMPTY STATE SCREEN WITH CLEAR CTA */}
              {filteredUserProfiles.length === 0 ? (
                <div className="bg-white rounded-3xl border border-rose-100 p-8 sm:p-12 text-center space-y-4 shadow-sm">
                  <div className="w-16 h-16 bg-rose-50 rounded-2xl mx-auto flex items-center justify-center text-3xl border border-rose-200 shadow-xs">
                    🌸
                  </div>
                  <div className="max-w-md mx-auto space-y-1">
                    <h4 className="text-xl font-serif font-bold text-stone-900">
                      {t('No Matrimonial Profiles Found', 'कोई वैवाहिक बायोडाटा नहीं मिला')}
                    </h4>
                    <p className="text-xs text-stone-500 font-light leading-relaxed">
                      {searchQuery 
                        ? t(`No profiles matching "${searchQuery}". Clear your search query to see all candidates.`, `"${searchQuery}" से कोई प्रोफ़ाइल मेल नहीं खाती। सभी देखने के लिए खोज साफ़ करें।`)
                        : t("You haven't published or saved any matrimonial profiles in your account yet.", 'आपने अभी तक कोई वैवाहिक बायोडाटा प्रकाशित नहीं किया है।')}
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={searchQuery ? () => setSearchQuery('') : handleStartCreateNewProfile}
                      className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:from-amber-200 hover:to-amber-400 text-[#4c0d1b] font-bold px-6 py-3 rounded-2xl text-xs shadow-md transition-all inline-flex items-center gap-2 cursor-pointer font-serif hover:scale-102"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{searchQuery ? t('Clear Search Filter', 'खोज फ़िल्टर हटाएं') : t('Create Your First Profile', 'अपना पहला बायोडाटा बनाएं')}</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* PROFILES GRID WITH CARD ACTIONS */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {filteredUserProfiles.map((p) => (
                    <div 
                      key={p.id}
                      className="bg-white rounded-3xl border border-rose-100 shadow-xs hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col justify-between group"
                    >
                      <div>
                        {/* Background Cover Photo Header */}
                        <div className="relative h-28 bg-stone-100 overflow-hidden">
                          <img 
                            src={p.coverPhoto || "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80"} 
                            alt="Cover" 
                            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500" 
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                          
                          {/* Status Badge (Active vs Draft) */}
                          <div className="absolute top-3 left-3">
                            {p.status === 'active' ? (
                              <span className="bg-emerald-600/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1 backdrop-blur-xs font-serif">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-200 animate-pulse"></span>
                                {t('Active • Live', 'सक्रिय • लाइव')}
                              </span>
                            ) : (
                              <span className="bg-amber-600/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1 backdrop-blur-xs font-serif">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-200"></span>
                                {t('Draft • Review', 'ड्राफ्ट • समीक्षा')}
                              </span>
                            )}
                          </div>

                          {/* Visibility Chip */}
                          <div className="absolute top-3 right-3 bg-black/60 text-amber-200 text-[10px] font-semibold px-2 py-0.5 rounded-lg border border-amber-300/30 backdrop-blur-xs">
                            {p.visibility === 'public' ? t('Public', 'सार्वजनिक') : p.visibility === 'verified_only' ? t('Verified Only', 'केवल सत्यापित') : t('Private', 'निजी')}
                          </div>
                        </div>

                        {/* Candidate Info with Avatar */}
                        <div className="px-4 sm:px-5 pt-0 pb-4 relative min-w-0">
                          <div className="flex justify-between items-end gap-2 -mt-9 mb-3">
                            <img 
                              src={p.photo || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80"} 
                              alt={p.name} 
                              className="w-18 h-18 rounded-2xl object-cover object-top border-4 border-white shadow-md bg-white shrink-0" 
                            />
                            <div className="text-right min-w-0">
                              <span className="inline-block max-w-full truncate text-[10px] bg-rose-50 text-[#851834] font-serif font-bold px-2 py-0.5 rounded-md border border-rose-200">
                                {t('Gotra:', 'गोत्र:')} {p.gotra}
                              </span>
                            </div>
                          </div>

                          <h4 className="font-serif font-bold text-lg text-stone-900 group-hover:text-[#851834] transition-colors leading-tight break-words">
                            {p.name}
                          </h4>
                          <p className="text-xs text-stone-500 font-medium mt-0.5 break-words">
                            {p.age} {t('Yrs', 'वर्ष')} · {p.height || "5' 8\""} · {p.profession}
                          </p>
                          <p className="text-xs text-stone-400 mt-0.5 font-light break-words">
                            📍 {p.city}, {p.state || 'MP'}
                          </p>
                        </div>
                      </div>

                      {/* QUICK ACTION BUTTONS: Edit Profile, View Live, Settings */}
                      <div className="p-3.5 sm:p-4 pt-3 border-t border-rose-100/80 bg-rose-50/20 flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => handleStartEditProfile(p)}
                          className="flex-1 min-w-[92px] flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-semibold bg-white border border-stone-200 hover:border-rose-300 hover:bg-rose-50 text-stone-700 transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-[#851834] shrink-0" />
                          <span>{t('Edit', 'संपादित करें')}</span>
                        </button>

                        <button
                          onClick={() => setPreviewProfile(p)}
                          className="flex-1 min-w-[92px] flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-semibold bg-white border border-stone-200 hover:border-rose-300 hover:bg-rose-50 text-stone-700 transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#851834] shrink-0" />
                          <span>{t('View Live', 'प्रीव्यू')}</span>
                        </button>

                        <button
                          onClick={() => {
                            setConfirmDeleteProfileId(null);
                            setSettingsModalProfile(p);
                          }}
                          className="flex-1 min-w-[92px] flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-semibold bg-white border border-stone-200 hover:border-rose-300 hover:bg-rose-50 text-stone-700 transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
                        >
                          <Sliders className="w-3.5 h-3.5 text-[#851834] shrink-0" />
                          <span>{t('Settings', 'सेटिंग्स')}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ==================================================== */}
          {/* VIEW E: PUBLISHED BUSINESS ADS                       */}
          {/* ==================================================== */}
          {!isEditingProfile && !isEditingAd && activeSection === 'ads' && (
            <div className="space-y-5 animate-in fade-in">
              
              {/* Header Bar & Filter Controls */}
              <div className="bg-white rounded-3xl border border-rose-100 p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg sm:text-xl font-serif font-bold text-stone-900 flex items-center gap-2">
                    <Store className="w-5 h-5 text-[#851834]" />
                    <span>{t('My Published Business Ads', 'मेरे प्रकाशित व्यापार विज्ञापन')}</span>
                  </h3>
                  <p className="text-xs text-stone-500 font-light">
                    {t('Manage your commercial listings, promotional discounts, and storefront cards in the Rathore Samaj directory.', 'राठौर समाज डायरेक्टरी में अपने व्यापारिक विज्ञापन और विशेष ऑफ़र प्रबंधित करें।')}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <div className="flex flex-wrap bg-stone-100 p-1 rounded-xl border border-stone-200">
                    <button
                      onClick={() => setAdStatusFilter('all')}
                      className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                        adStatusFilter === 'all'
                          ? 'bg-[#851834] text-amber-100 shadow-xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      {t(`All (${userAds.length})`, `सभी (${userAds.length})`)}
                    </button>
                    <button
                      onClick={() => setAdStatusFilter('active')}
                      className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                        adStatusFilter === 'active'
                          ? 'bg-[#851834] text-amber-100 shadow-xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      {t(`Active (${activeAdsCount})`, `सक्रिय (${activeAdsCount})`)}
                    </button>
                    <button
                      onClick={() => setAdStatusFilter('featured')}
                      className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                        adStatusFilter === 'featured'
                          ? 'bg-[#851834] text-amber-100 shadow-xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      {t(`Featured (${featuredAdsCount})`, `प्रमुख (${featuredAdsCount})`)}
                    </button>
                  </div>

                  <button
                    onClick={handleStartCreateNewAd}
                    className="bg-gradient-to-r from-[#6e1628] via-[#851834] to-[#6e1628] text-amber-100 font-bold px-3.5 py-1.5 rounded-xl text-xs shadow-sm flex items-center gap-1.5 cursor-pointer border border-amber-300/30 whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span>{t('Post New Ad', 'नया विज्ञापन जोड़ें')}</span>
                  </button>
                </div>
              </div>

              {/* EMPTY STATE SCREEN FOR BUSINESS ADS */}
              {filteredUserAds.length === 0 ? (
                <div className="bg-white rounded-3xl border border-rose-100 p-8 sm:p-12 text-center space-y-4 shadow-sm">
                  <div className="w-16 h-16 bg-rose-50 rounded-2xl mx-auto flex items-center justify-center text-3xl border border-rose-200 shadow-xs text-[#851834]">
                    🏬
                  </div>
                  <div className="max-w-md mx-auto space-y-1">
                    <h4 className="text-xl font-serif font-bold text-stone-900">
                      {t('No Business Ads Found', 'कोई व्यापार विज्ञापन नहीं मिला')}
                    </h4>
                    <p className="text-xs text-stone-500 font-light leading-relaxed">
                      {searchQuery
                        ? t(`No advertisements match "${searchQuery}".`, `"${searchQuery}" से कोई विज्ञापन मेल नहीं खाता।`)
                        : t('Showcase your retail shop, manufacturing agency, or service to thousands of Rathore Samaj families.', 'राठौर समाज के हजारों परिवारों तक अपनी दुकान या सेवा की जानकारी पहुंचाएं।')}
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={searchQuery ? () => setSearchQuery('') : handleStartCreateNewAd}
                      className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:from-amber-200 hover:to-amber-400 text-[#4c0d1b] font-bold px-6 py-3 rounded-2xl text-xs shadow-md transition-all inline-flex items-center gap-2 cursor-pointer font-serif hover:scale-102"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{searchQuery ? t('Clear Search Filter', 'खोज फ़िल्टर हटाएं') : t('Post Your First Business Ad', 'अपना पहला व्यापार विज्ञापन जोड़ें')}</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* BUSINESS ADS GRID WITH QUICK ACTIONS */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {filteredUserAds.map((ad) => (
                    <div 
                      key={ad.id}
                      className="bg-white rounded-3xl border border-rose-100 shadow-xs hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col justify-between group"
                    >
                      <div>
                        {/* Storefront Banner Image */}
                        <div className="relative h-36 bg-stone-100 overflow-hidden">
                          <img 
                            src={ad.banner || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80"} 
                            alt={ad.title} 
                            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500" 
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                          
                          {/* Category Tag */}
                          <div className="absolute top-3 left-3 bg-[#6e1628]/90 text-amber-200 text-[10px] font-semibold px-2.5 py-1 rounded-lg shadow-xs border border-amber-300/40 backdrop-blur-xs font-serif">
                            {ad.category}
                          </div>

                          {/* Featured Badge */}
                          {ad.isFeatured && (
                            <div className="absolute top-3 right-3 bg-gradient-to-r from-amber-300 to-amber-400 text-[#4c0d1b] text-[10px] font-bold px-2.5 py-1 rounded-lg shadow flex items-center gap-1 font-serif">
                              <Star className="w-3 h-3 fill-[#4c0d1b]" /> {t('Featured', 'प्रमुख')}
                            </div>
                          )}

                          {/* Status Tag on Banner Bottom */}
                          <div className="absolute bottom-2.5 left-3">
                            {ad.status === 'active' ? (
                              <span className="bg-emerald-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-200 animate-pulse"></span>
                                {t('Live in Directory', 'डायरेक्टरी में लाइव')}
                              </span>
                            ) : (
                              <span className="bg-amber-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-200"></span>
                                {t('Draft / Paused', 'ड्राफ्ट / रुका हुआ')}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Content Info */}
                        <div className="p-4 sm:p-5 space-y-2.5 min-w-0">
                          <div>
                            <h4 className="font-serif font-bold text-base text-stone-900 group-hover:text-[#851834] transition-colors leading-tight break-words">
                              {ad.title}
                            </h4>
                            <p className="text-xs text-stone-500 font-medium mt-0.5 break-words">
                              {t('Owner:', 'संचालक:')} {ad.owner} · {ad.city || 'Indore'}
                            </p>
                          </div>

                          <p className="text-xs text-stone-600 font-light line-clamp-2 leading-relaxed">
                            {ad.tagline || ad.description}
                          </p>

                          {ad.address && (
                            <p className="text-[11px] text-stone-400 flex items-center gap-1 min-w-0">
                              <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                              <span className="truncate">{ad.address}</span>
                            </p>
                          )}

                          {ad.offer && (
                            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] p-2 rounded-xl font-semibold flex items-center gap-1.5 min-w-0">
                              <Tag className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span className="truncate">{ad.offer}</span>
                            </div>
                          )}

                          {/* Engagement Metrics Pill */}
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] text-stone-500 pt-1">
                            <span className="bg-stone-50 px-2 py-0.5 rounded-md border border-stone-200 whitespace-nowrap">
                              👁️ {ad.viewsCount || 124} {t('Views', 'व्यूज')}
                            </span>
                            <span className="bg-stone-50 px-2 py-0.5 rounded-md border border-stone-200 whitespace-nowrap">
                              📞 {ad.inquiriesCount || 18} {t('Calls', 'कॉल')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* QUICK ACTION BUTTONS: Edit Ad, View Live, Settings */}
                      <div className="p-3.5 sm:p-4 pt-3 border-t border-rose-100/80 bg-rose-50/20 flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => handleStartEditAd(ad)}
                          className="flex-1 min-w-[92px] flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-semibold bg-white border border-stone-200 hover:border-rose-300 hover:bg-rose-50 text-stone-700 transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-[#851834] shrink-0" />
                          <span>{t('Edit Ad', 'संपादित')}</span>
                        </button>

                        <button
                          onClick={() => setPreviewAd(ad)}
                          className="flex-1 min-w-[92px] flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-semibold bg-white border border-stone-200 hover:border-rose-300 hover:bg-rose-50 text-stone-700 transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#851834] shrink-0" />
                          <span>{t('View Live', 'प्रीव्यू')}</span>
                        </button>

                        <button
                          onClick={() => {
                            setConfirmDeleteAdId(null);
                            setSettingsModalAd(ad);
                          }}
                          className="flex-1 min-w-[92px] flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-semibold bg-white border border-stone-200 hover:border-rose-300 hover:bg-rose-50 text-stone-700 transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
                        >
                          <Sliders className="w-3.5 h-3.5 text-[#851834] shrink-0" />
                          <span>{t('Settings', 'सेटिंग्स')}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ==================================================== */}
          {/* VIEW F: MEDIA ASSETS                                 */}
          {/* ==================================================== */}
          {!isEditingProfile && !isEditingAd && activeSection === 'media' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-white rounded-3xl border border-rose-100 p-4 sm:p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-rose-100 pb-4">
                  <div>
                    <h3 className="text-lg sm:text-xl font-serif font-bold text-stone-900">
                      {t('Media Assets & Photos', 'मीडिया फ़ाइलें और फोटो')}
                    </h3>
                    <p className="text-xs text-stone-500 font-light">
                      {t('Manage avatar portraits, background covers, shop banners, and horoscope documents.', 'प्रोफ़ाइल फोटो, बैकग्राउंड कवर, दुकान बैनर और कुंडली दस्तावेज़ प्रबंधित करें।')}
                    </p>
                  </div>
                  <span className="text-xs bg-rose-50 text-[#851834] font-serif font-bold px-3 py-1 rounded-xl border border-rose-200">
                    {mediaAssets.length} {t('Total Files', 'कुल फ़ाइलें')}
                  </span>
                </div>

                {/* Upload Form Widget */}
                <form onSubmit={handleAddMediaAsset} className="bg-rose-50/30 p-3.5 sm:p-4 rounded-2xl border border-rose-100 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#851834] font-serif">
                    <Upload className="w-4 h-4" />
                    <span>{t('Upload or Add Media Link', 'नई फोटो या मीडिया लिंक जोड़ें')}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <input
                        type="text"
                        placeholder={t('Asset Title (e.g. Portrait Photo)', 'फ़ाइल का शीर्षक (जैसे: मुख्य फोटो)')}
                        value={newMediaTitle}
                        onChange={(e) => setNewMediaTitle(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-stone-200 bg-white"
                      />
                    </div>
                    <div>
                      <select
                        value={newMediaType}
                        onChange={(e) => setNewMediaType(e.target.value as 'avatar' | 'cover' | 'gallery' | 'document')}
                        className="w-full p-2.5 rounded-xl border border-stone-200 bg-white"
                      >
                        <option value="avatar">{t('Avatar Portrait', 'प्रोफ़ाइल फोटो')}</option>
                        <option value="cover">{t('Background Cover', 'बैकग्राउंड कवर')}</option>
                        <option value="gallery">{t('Matrimony Gallery Photo', 'गैलरी फोटो')}</option>
                        <option value="document">{t('Kundali / Document', 'कुंडली / दस्तावेज़')}</option>
                      </select>
                    </div>
                  </div>

                  <ImageUploadField
                    label={t('Select Photo from Device or Paste URL *', 'डिवाइस से फ़ोटो चुनें या लिंक डालें *')}
                    value={newMediaUrl}
                    onChange={(url) => setNewMediaUrl(url)}
                    variant="banner"
                    maxDimension={900}
                    urlPlaceholder={t('Image URL (https://...)', 'फोटो URL (https://...)')}
                  />

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={!newMediaUrl.trim()}
                      className="w-full sm:w-auto bg-gradient-to-r from-[#6e1628] to-[#851834] disabled:opacity-50 text-amber-100 text-xs font-bold px-4 py-2.5 sm:py-2 rounded-xl shadow-xs cursor-pointer border border-amber-300/30"
                    >
                      {t('+ Save to Media Assets', '+ मीडिया में सहेजें')}
                    </button>
                  </div>
                </form>

                {/* Media Assets Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                  {mediaAssets.map((asset) => (
                    <div 
                      key={asset.id}
                      className="rounded-2xl border border-stone-200 overflow-hidden bg-white shadow-2xs group flex flex-col justify-between"
                    >
                      <div className="relative h-36 bg-stone-100 overflow-hidden">
                        <img src={asset.url} alt={asset.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <span className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-md font-medium capitalize backdrop-blur-xs">
                          {asset.type}
                        </span>
                        <button
                          onClick={() => handleDeleteMediaAsset(asset.id)}
                          className="absolute top-2 right-2 bg-black/65 hover:bg-red-700 text-white p-1.5 rounded-lg opacity-95 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity cursor-pointer"
                          title="Delete asset"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="p-3 text-xs space-y-1">
                        <p className="font-bold text-stone-800 truncate">{asset.title}</p>
                        <div className="flex justify-between text-[10px] text-stone-400">
                          <span>{asset.uploadedAt}</span>
                          <span>{asset.size || '1.5 MB'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* VIEW G: SETTINGS                                     */}
          {/* ==================================================== */}
          {!isEditingProfile && !isEditingAd && activeSection === 'settings' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-white rounded-3xl border border-rose-100 p-4 sm:p-8 shadow-sm space-y-6">
                <div className="border-b border-rose-100 pb-3">
                  <h3 className="text-lg sm:text-xl font-serif font-bold text-stone-900">
                    {t('Account & Visibility Settings', 'खाता एवं गोपनीयता सेटिंग्स')}
                  </h3>
                  <p className="text-xs text-stone-500 font-light">
                    {t(
                      'Control who can view your candidate contact numbers, commercial ads, and profile details in the Rathore Samaj network.',
                      'राठौर समाज नेटवर्क पर आपके संपर्क नंबर और प्रोफ़ाइल कौन देख सकता है, यह नियंत्रित करें।'
                    )}
                  </p>
                </div>

                {settingsSavedToast && (
                  <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-3 text-xs text-emerald-800 flex items-center gap-2 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{t('Your privacy and notification preferences have been saved successfully!', 'आपकी गोपनीयता और सूचना सेटिंग्स सफलतापूर्वक सहेजी गईं!')}</span>
                  </div>
                )}

                <div className="space-y-5 text-xs">
                  {/* Public Visibility Setting */}
                  <div className="p-4 rounded-2xl border border-rose-100/90 bg-rose-50/20 space-y-2">
                    <label className="block font-bold text-stone-800 font-serif text-sm">
                      {t('Default Profile Visibility', 'डिफ़ॉल्ट प्रोफ़ाइल दृश्यता')}
                    </label>
                    <p className="text-stone-500 font-light leading-relaxed">
                      {t('Choose how your candidate biodata is shown across search filters and the community directory.', 'चुनें कि समाज डायरेक्टरी में आपका बायोडाटा किसे दिखाई दे।')}
                    </p>

                    <div className="space-y-2 pt-1">
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="radio"
                          name="visPref"
                          checked={visibilityPreference === 'public'}
                          onChange={() => setVisibilityPreference('public')}
                          className="text-[#851834] focus:ring-rose-500"
                        />
                        <span className="font-medium text-stone-700">{t('Public to All Verified Samaj Members (Recommended)', 'सभी सत्यापित समाज सदस्यों के लिए (अनुशंसित)')}</span>
                      </label>

                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="radio"
                          name="visPref"
                          checked={visibilityPreference === 'verified_only'}
                          onChange={() => setVisibilityPreference('verified_only')}
                          className="text-[#851834] focus:ring-rose-500"
                        />
                        <span className="font-medium text-stone-700">{t('Only Members with a Registered Family Biodata', 'केवल पंजीकृत पारिवारिक बायोडाटा वाले सदस्य')}</span>
                      </label>

                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="radio"
                          name="visPref"
                          checked={visibilityPreference === 'private'}
                          onChange={() => setVisibilityPreference('private')}
                          className="text-[#851834] focus:ring-rose-500"
                        />
                        <span className="font-medium text-stone-700">{t('Private (Requires Approval for Every Contact View)', 'निजी (हर संपर्क के लिए अनुमति आवश्यक)')}</span>
                      </label>
                    </div>
                  </div>

                  {/* WhatsApp Privacy */}
                  <div className="p-4 rounded-2xl border border-stone-200 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-stone-800 font-serif">{t('WhatsApp Contact Direct Link', 'व्हाट्सएप सीधा संपर्क लिंक')}</p>
                        <p className="text-[11px] text-stone-500 font-light">{t('Allow verified families to initiate direct chat on WhatsApp', 'सत्यापित परिवारों को व्हाट्सएप पर सीधी बात करने की अनुमति दें')}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={!whatsappMasking}
                        onChange={(e) => setWhatsappMasking(!e.target.checked)}
                        className="w-4 h-4 shrink-0 text-[#851834] rounded"
                      />
                    </div>
                  </div>

                  {/* Notification on View */}
                  <div className="p-4 rounded-2xl border border-stone-200 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-stone-800 font-serif">{t('SMS & In-App View Alerts', 'एसएमएस और ऐप व्यू अलर्ट')}</p>
                        <p className="text-[11px] text-stone-500 font-light">{t('Receive alerts when another Samaj family unlocks and views your contact or ad', 'जब कोई अन्य परिवार आपका संपर्क नंबर देखे तो अलर्ट प्राप्त करें')}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifyOnView}
                        onChange={(e) => setNotifyOnView(e.target.checked)}
                        className="w-4 h-4 shrink-0 text-[#851834] rounded"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={handleSaveSettings}
                      className="w-full sm:w-auto bg-gradient-to-r from-[#6e1628] via-[#851834] to-[#6e1628] text-amber-100 font-bold px-6 py-2.5 rounded-xl shadow-md cursor-pointer border border-amber-300/30"
                    >
                      {t('Save Preferences', 'सेटिंग्स सहेजें')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* VIEW H: PROFILES I LIKED                             */}
          {/* ==================================================== */}
          {!isEditingProfile && !isEditingAd && activeSection === 'liked_by_me' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-white rounded-3xl border border-rose-100 p-4 sm:p-8 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-rose-100 pb-4">
                  <div>
                    <h3 className="text-lg sm:text-xl font-serif font-bold text-stone-900 flex items-center gap-2">
                      <Heart className="w-5 h-5 text-rose-500 fill-rose-500 shrink-0" />
                      <span>{t('Profiles I Liked (Saved Biodatas)', 'पसंद किए गए बायोडाटा')}</span>
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {t('Candidates you saved for family discussions, direct chat, and astrological matching.', 'परिवार से चर्चा, चैट और कुंडली मिलान के लिए सहेजे गए बायोडाटा।')}
                    </p>
                  </div>
                  <span className="text-xs bg-rose-50 text-rose-800 font-bold px-3 py-1 rounded-full border border-rose-200">
                    {likedProfileList.length} {t('Saved Profiles', 'सहेजे गए')}
                  </span>
                </div>

                {likedProfileList.length === 0 ? (
                  <div className="py-12 text-center space-y-3 max-w-sm mx-auto">
                    <div className="w-14 h-14 bg-rose-50 rounded-2xl mx-auto flex items-center justify-center border border-rose-200">
                      <Heart className="w-7 h-7 text-rose-500 fill-rose-500" />
                    </div>
                    <h4 className="font-serif font-bold text-base text-stone-800">{t('No Liked Profiles Yet', 'अभी कोई प्रोफ़ाइल पसंद नहीं की गई')}</h4>
                    <p className="text-xs text-stone-500 leading-relaxed">
                      {t('Tap the heart icon on any matrimonial profile in the directory to bookmark their biodata here.', 'बायोडाटा को यहाँ सहेजने के लिए डायरेक्टरी में किसी भी प्रोफ़ाइल पर दिल ❤️ के आइकन पर टैप करें।')}
                    </p>
                    <button
                      onClick={() => onNavigateTab('matrimony')}
                      className="bg-gradient-to-r from-[#6e1628] to-[#851834] text-amber-100 font-bold px-5 py-2.5 rounded-xl text-xs cursor-pointer shadow-sm hover:scale-102 transition-transform"
                    >
                      {t('Browse Matrimony Biodatas', 'वैवाहिक बायोडाटा देखें')}
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {likedProfileList.map((p) => {
                      const photoUrl = p.photo && p.photo.trim() !== ''
                        ? p.photo
                        : p.gender === 'Female'
                          ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"
                          : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80";

                      return (
                        <div 
                          key={p.id}
                          className="bg-white rounded-2xl border border-stone-200/90 hover:border-amber-400 p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-3 group"
                        >
                          <div className="flex gap-3.5 items-start">
                            <img 
                              src={photoUrl} 
                              alt={p.name} 
                              className="w-16 h-16 rounded-xl object-cover object-top border border-amber-300 shadow-2xs shrink-0" 
                            />
                            <div className="min-w-0 flex-1">
                              <h4 className="font-serif font-bold text-stone-900 text-sm group-hover:text-[#851834] transition-colors truncate">
                                {p.name}
                              </h4>
                              <p className="text-xs text-stone-600 font-medium">
                                {t('Gotra:', 'गोत्र:')} {p.gotra} · {p.city}
                              </p>
                              <p className="text-[11px] text-stone-500">
                                {p.age} {t('Yrs', 'वर्ष')} · {p.education}
                              </p>
                              {p.profession && (
                                <p className="text-[11px] text-emerald-800 font-semibold truncate">
                                  {p.profession}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center gap-1.5">
                            <button
                              onClick={() => setPreviewProfile(p)}
                              className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-800 text-[11px] font-semibold py-2 px-2.5 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors"
                            >
                              <Eye className="w-3 h-3" /> {t('View Bio', 'बायो देखें')}
                            </button>

                            {config.featureChatEnabled && (
                              <button
                                onClick={() => setActiveChatProfile(p)}
                                className="bg-gradient-to-r from-[#6e1628] to-[#851834] text-amber-200 text-[11px] font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                              >
                                <MessageCircle className="w-3 h-3 text-amber-300" /> {t('Chat', 'चैट')}
                              </button>
                            )}

                            {config.featureKundaliEnabled && onSelectKundaliProfile && (
                              <button
                                onClick={() => onSelectKundaliProfile(p.id, p.gender)}
                                title={t('Check Kundali Milan', 'कुंडली मिलान जांचें')}
                                className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-semibold py-2 px-2.5 rounded-lg flex items-center gap-1 cursor-pointer"
                              >
                                <Compass className="w-3 h-3 text-amber-700" /> {t('Milan', 'मिलान')}
                              </button>
                            )}

                            <button
                              onClick={() => toggleUnlikeProfile(p.id)}
                              title={t('Remove from Liked', 'पसंद सूची से हटाएं')}
                              className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* VIEW I: WHO LIKED MY PROFILE                         */}
          {/* ==================================================== */}
          {!isEditingProfile && !isEditingAd && activeSection === 'who_liked_me' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-white rounded-3xl border border-rose-100 p-4 sm:p-8 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-rose-100 pb-4">
                  <div>
                    <h3 className="text-lg sm:text-xl font-serif font-bold text-stone-900 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
                      <span>{t('Who Liked My Profile (Samaj Admirers)', 'मेरी प्रोफ़ाइल किसने पसंद की')}</span>
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {t('Rathore community members who liked your profile and want to discuss matrimonial alliance.', 'राठौर समाज के सदस्य जिन्होंने आपका प्रोफ़ाइल पसंद किया है और रिश्ते के लिए बात करना चाहते हैं।')}
                    </p>
                  </div>
                  <span className="text-xs bg-amber-50 text-amber-900 font-bold px-3 py-1 rounded-full border border-amber-300">
                    {admirers.length} {t('Interested Families', 'इच्छुक परिवार')}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
                        className="bg-white rounded-2xl border border-amber-200/90 hover:border-amber-400 p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-3"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <img 
                              src={adm.admirerPhoto || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80"}
                              alt={adm.admirerName}
                              className="w-12 h-12 rounded-xl object-cover object-top border border-amber-300 shrink-0"
                            />
                            <div className="min-w-0">
                              <h4 className="font-serif font-bold text-stone-900 text-sm truncate">
                                {adm.admirerName}
                              </h4>
                              <p className="text-xs text-stone-600">
                                {t('Gotra:', 'गोत्र:')} {adm.admirerGotra} · {adm.admirerCity}
                              </p>
                              <span className="text-[10px] text-rose-600 font-semibold flex items-center gap-1 mt-0.5">
                                <Heart className="w-2.5 h-2.5 fill-rose-500 text-rose-500" /> {adm.likedAt}
                              </span>
                            </div>
                          </div>

                          <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200 text-[11px] text-stone-700 space-y-0.5">
                            <p><strong>{t('Edu:', 'शिक्षा:')}</strong> {adm.admirerEducation}</p>
                            {adm.admirerProfession && <p><strong>{t('Prof:', 'व्यवसाय:')}</strong> {adm.admirerProfession}</p>}
                            {adm.message && <p className="italic text-amber-900 pt-1 text-[10px]">&quot;{adm.message}&quot;</p>}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center gap-1.5">
                          {config.featureChatEnabled && (
                            <button
                              onClick={() => setActiveChatProfile(candidateProfile)}
                              className="flex-1 min-w-[90px] bg-gradient-to-r from-[#6e1628] to-[#851834] text-amber-200 text-xs font-semibold py-2 px-2.5 rounded-lg flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                            >
                              <MessageCircle className="w-3 h-3 text-amber-300" /> {t('Chat', 'चैट')}
                            </button>
                          )}

                          {config.featureKundaliEnabled && onSelectKundaliProfile && (
                            <button
                              onClick={() => onSelectKundaliProfile(candidateProfile.id, candidateProfile.gender)}
                              title={t('Milan', 'मिलान')}
                              className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-semibold py-2 px-2.5 rounded-lg flex items-center gap-1 cursor-pointer"
                            >
                              <Compass className="w-3 h-3 text-amber-700" /> {t('Milan', 'मिलान')}
                            </button>
                          )}

                          <a
                            href={`tel:${adm.admirerPhone}`}
                            title={`${t('Call', 'कॉल करें')} ${adm.admirerPhone}`}
                            className="p-2 border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 rounded-lg cursor-pointer"
                          >
                            <Phone className="w-3.5 h-3.5 text-emerald-700" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* VIEW J: CHAT MESSAGES & THREADS                      */}
          {/* ==================================================== */}
          {!isEditingProfile && !isEditingAd && activeSection === 'chats' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-white rounded-3xl border border-rose-100 p-4 sm:p-8 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-rose-100 pb-4">
                  <div>
                    <h3 className="text-lg sm:text-xl font-serif font-bold text-stone-900 flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span>{t('Direct Chat Messages & Inquiries', 'सीधी चैट एवं पूछताछ')}</span>
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {t('Manage matrimonial alliance conversations with interested Rathore families.', 'इच्छुक राठौर परिवारों के साथ वैवाहिक बातचीत प्रबंधित करें।')}
                    </p>
                  </div>
                  <button
                    onClick={() => onNavigateTab('matrimony')}
                    className="w-full sm:w-auto text-xs bg-[#851834] text-amber-200 font-bold px-3.5 py-2 sm:py-1.5 rounded-xl cursor-pointer"
                  >
                    {t('+ Start New Chat', '+ नई चैट शुरू करें')}
                  </button>
                </div>

                <div className="space-y-3">
                  {profiles.slice(0, 6).map((p) => {
                    const thread = chatThreads[p.id.toString()] || [];
                    const lastMsg = thread.length > 0 ? thread[thread.length - 1] : null;

                    return (
                      <div
                        key={p.id}
                        onClick={() => setActiveChatProfile(p)}
                        className="p-3 sm:p-4 rounded-2xl border border-stone-200/90 hover:border-amber-400 bg-stone-50/50 hover:bg-amber-50/20 transition-all flex items-center justify-between gap-2.5 sm:gap-4 cursor-pointer group"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <img 
                            src={p.photo && p.photo.trim() !== '' ? p.photo : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80"}
                            alt={p.name}
                            className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl object-cover object-top border border-amber-300 shrink-0" 
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <h4 className="font-serif font-bold text-stone-900 text-sm group-hover:text-[#851834] transition-colors truncate">
                                {p.name}
                              </h4>
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-full shrink-0">{t('Active', 'सक्रिय')}</span>
                            </div>
                            <p className="text-xs text-stone-500 truncate">
                              {t('Gotra:', 'गोत्र:')} {p.gotra} · {p.city}
                            </p>
                            <p className="text-xs text-stone-700 truncate mt-0.5 font-medium">
                              {lastMsg
                                ? `${lastMsg.senderName}: ${lastMsg.text}`
                                : t(`Start conversation with ${p.name}'s family...`, `${p.name} के परिवार से बातचीत शुरू करें...`)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] text-stone-400 hidden sm:inline">{lastMsg ? lastMsg.timestamp : t('Recent', 'हाल ही में')}</span>
                          <button className="bg-gradient-to-r from-[#6e1628] to-[#851834] text-amber-200 text-xs font-semibold py-2 px-2.5 sm:px-3 rounded-xl flex items-center gap-1 shadow-xs whitespace-nowrap">
                            <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{t('Open', 'खोलें')}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </main>

        {/* MOBILE SUBSCRIPTION & TRUST SUMMARY FOOTER (shown below main on < lg) */}
        <div className="lg:hidden space-y-3">
          {config.subscriptionEnabled && (
            <div className={`rounded-2xl p-3.5 border text-xs space-y-1.5 ${
              userSubscription?.active
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-300 text-amber-950'
            }`}>
              <div className="flex items-center gap-1.5 font-bold font-serif">
                <Crown className={`w-4 h-4 ${userSubscription?.active ? 'text-emerald-600' : 'text-amber-600'}`} />
                <span>
                  {userSubscription?.active
                    ? t('Premium Samaj Pass Active', 'प्रीमियम समाज पास सक्रिय')
                    : t('Membership Plan Available', 'सदस्यता प्लान उपलब्ध')}
                </span>
              </div>
              <p className="text-[11px] opacity-85 leading-relaxed">
                {userSubscription?.active
                  ? t(
                      `${userSubscription.plan === 'lifetime' ? 'Lifetime VIP' : 'Annual Gold'} Plan (₹${userSubscription.pricePaid})`,
                      `${userSubscription.plan === 'lifetime' ? 'आजीवन VIP' : 'वार्षिक गोल्ड'} प्लान (₹${userSubscription.pricePaid})`
                    )
                  : t(
                      `Unlock unlimited contacts starting ₹${config.annualPlanPrice}/yr`,
                      `₹${config.annualPlanPrice}/वर्ष से असीमित संपर्क अनलॉक करें`
                    )}
              </p>
              {!userSubscription?.active && (
                <button
                  onClick={() => onNavigateTab('matrimony')}
                  className="text-[11px] font-bold text-[#851834] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {t('View Plans', 'प्लान देखें')} <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          <div className="bg-rose-50/50 rounded-2xl p-4 border border-rose-100 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 text-[#851834] font-bold font-serif">
              <ShieldCheck className="w-4 h-4 text-[#851834]" />
              <span>{t('100% Verified Directory', '100% सत्यापित डायरेक्टरी')}</span>
            </div>
            <p className="text-stone-500 text-[11px] font-light leading-relaxed">
              {t('Your listings are screened against Rathore Samaj registry to protect community trust.', 'समाज के विश्वास की रक्षा के लिए आपकी जानकारी राठौर समाज रजिस्ट्री में सत्यापित होती है।')}
            </p>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. MODAL: LIVE PREVIEW OF CANDIDATE BIODATA               */}
      {/* ======================================================== */}
      {previewProfile && (
        <div 
          className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-start sm:items-center justify-center px-3 sm:px-4 pt-[calc(0.75rem+var(--sat))] pb-[calc(1rem+var(--sab))] overflow-y-auto animate-in fade-in"
          onClick={() => setPreviewProfile(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl border border-rose-200 relative my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewProfile(null)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-4">
              <div className="text-center pb-2 border-b border-rose-100">
                <span className="text-[10px] font-serif text-[#851834] font-bold tracking-widest uppercase">
                  {t('Candidate Matrimonial Profile (Live Preview)', 'प्रत्याशी वैवाहिक बायोडाटा (लाइव प्रीव्यू)')}
                </span>
              </div>

              {/* Cover & Avatar Header */}
              <div className="relative h-28 rounded-2xl overflow-hidden border border-stone-200">
                <img src={previewProfile.coverPhoto} alt="Cover" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/20" />
              </div>

              <div className="flex gap-3.5 sm:gap-4 items-end -mt-12 px-2 relative">
                <img 
                  src={previewProfile.photo} 
                  alt={previewProfile.name} 
                  className="w-20 h-20 rounded-2xl object-cover object-top border-4 border-white shadow-md bg-white shrink-0" 
                />
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg sm:text-xl font-serif font-bold text-stone-900 leading-tight break-words">
                    {previewProfile.name}
                  </h3>
                  <p className="text-xs text-[#851834] font-semibold font-serif truncate">
                    {t('Gotra:', 'गोत्र:')} {previewProfile.gotra} · {previewProfile.city}
                  </p>
                </div>
              </div>

              {previewProfile.gallery && previewProfile.gallery.length > 1 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                    {t('Candidate Photos Gallery', 'प्रत्याशी फ़ोटो गैलरी')} ({previewProfile.gallery.length})
                  </span>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {Array.from(new Set([previewProfile.photo, ...previewProfile.gallery].filter(Boolean))).map((gUrl, idx) => (
                      <img
                        key={idx}
                        src={gUrl}
                        alt={`${previewProfile.name} ${idx + 1}`}
                        className="w-14 h-14 rounded-xl object-cover object-top border border-amber-300 shrink-0"
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 text-xs space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <p><span className="text-stone-500 font-medium">{t('Age:', 'आयु:')}</span> <strong className="text-stone-800">{previewProfile.age} {t('Yrs', 'वर्ष')}</strong></p>
                  <p><span className="text-stone-500 font-medium">{t('Height:', 'कद:')}</span> <strong className="text-stone-800">{previewProfile.height || "5' 8\""}</strong></p>
                  <p><span className="text-stone-500 font-medium">{t('Education:', 'शिक्षा:')}</span> <strong className="text-stone-800">{previewProfile.education}</strong></p>
                  <p><span className="text-stone-500 font-medium">{t('Profession:', 'व्यवसाय:')}</span> <strong className="text-stone-800">{previewProfile.profession}</strong></p>
                </div>
                {previewProfile.about && (
                  <p className="pt-2 border-t border-stone-200/60 text-stone-600 font-light leading-relaxed">
                    {previewProfile.about}
                  </p>
                )}
              </div>

              <div className="bg-emerald-50 border border-emerald-300 p-3.5 rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-emerald-800 font-bold uppercase">{t('Verified Contact:', 'सत्यापित संपर्क:')}</span>
                  <p className="font-extrabold text-emerald-950 mt-0.5">{previewProfile.contact}</p>
                </div>
                <span className="bg-emerald-700 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg">
                  {t('Directory Active', 'डायरेक्टरी में सक्रिय')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. MODAL: LIVE PREVIEW OF BUSINESS AD                     */}
      {/* ======================================================== */}
      {previewAd && (
        <div 
          className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-start sm:items-center justify-center px-3 sm:px-4 pt-[calc(0.75rem+var(--sat))] pb-[calc(1rem+var(--sab))] overflow-y-auto animate-in fade-in"
          onClick={() => setPreviewAd(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-rose-200 relative my-auto space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewAd(null)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center pb-2 border-b border-rose-100">
              <span className="text-[10px] font-serif text-[#851834] font-bold tracking-widest uppercase">
                {t('Business Directory • Live Storefront Preview', 'व्यापार डायरेक्टरी • लाइव प्रीव्यू')}
              </span>
            </div>

            <div className="relative h-44 rounded-2xl overflow-hidden border border-stone-200">
              <img 
                src={previewAd.banner || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80"} 
                alt={previewAd.title} 
                className="w-full h-full object-cover" 
              />
              <div className="absolute top-3 left-3 bg-[#6e1628]/90 text-amber-200 text-xs font-semibold px-2.5 py-1 rounded-lg font-serif">
                {previewAd.category}
              </div>
              {previewAd.isFeatured && (
                <div className="absolute top-3 right-3 bg-gradient-to-r from-amber-300 to-amber-400 text-[#4c0d1b] text-xs font-bold px-2.5 py-1 rounded-lg shadow flex items-center gap-1 font-serif">
                  <Star className="w-3.5 h-3.5 fill-[#4c0d1b]" /> {t('Featured', 'प्रमुख')}
                </div>
              )}
            </div>

            <div className="space-y-2 text-xs">
              <h3 className="font-serif font-bold text-lg text-stone-900 leading-tight">
                {previewAd.title}
              </h3>
              <p className="text-stone-500 font-medium">
                {t('Owner:', 'संचालक:')} {previewAd.owner} · {previewAd.city || 'Indore'}
              </p>
              <p className="text-stone-600 font-light leading-relaxed">
                {previewAd.description || previewAd.tagline}
              </p>
              {previewAd.address && (
                <p className="text-stone-500 font-light">📍 {previewAd.address}</p>
              )}
              {previewAd.offer && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-2.5 rounded-xl font-semibold flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{previewAd.offer}</span>
                </div>
              )}
            </div>

            <div className="pt-2">
              <a
                href={`tel:${previewAd.phone}`}
                className="w-full bg-gradient-to-r from-[#6e1628] via-[#851834] to-[#6e1628] text-amber-100 font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer border border-amber-300/30"
              >
                <Phone className="w-4 h-4 text-amber-300" /> {t('Call Store Owner', 'संचालक को कॉल करें')} ({previewAd.phone})
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. MODAL: PROFILE CARD SETTINGS (Visibility & Status)     */}
      {/* ======================================================== */}
      {settingsModalProfile && (
        <div 
          className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-start sm:items-center justify-center px-3 sm:px-4 pt-[calc(0.75rem+var(--sat))] pb-[calc(1rem+var(--sab))] overflow-y-auto animate-in fade-in"
          onClick={() => setSettingsModalProfile(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-rose-200 relative space-y-4 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-rose-100 pb-2">
              <h4 className="font-serif font-bold text-stone-900 text-sm">
                {t('Profile Settings:', 'प्रोफ़ाइल सेटिंग्स:')} {settingsModalProfile.name}
              </h4>
              <button onClick={() => setSettingsModalProfile(null)}>
                <X className="w-4 h-4 text-stone-400" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">{t('Status on Directory', 'डायरेक्टरी स्थिति')}</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleProfileStatus(settingsModalProfile)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      settingsModalProfile.status === 'active'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-stone-100 text-stone-700'
                    }`}
                  >
                    {t('Active (Live)', 'सक्रिय (लाइव)')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleProfileStatus(settingsModalProfile)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      settingsModalProfile.status === 'draft'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-stone-100 text-stone-700'
                    }`}
                  >
                    {t('Draft (Paused)', 'ड्राफ्ट (रुका हुआ)')}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">{t('Visibility Audience', 'दृश्यता सेटिंग')}</label>
                <select
                  value={settingsModalProfile.visibility}
                  onChange={(e) => handleUpdateProfileVisibility(settingsModalProfile, e.target.value as VisibilitySetting)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 bg-white"
                >
                  <option value="public">{t('Public to All Samaj Members', 'सभी समाज सदस्यों के लिए सार्वजनिक')}</option>
                  <option value="verified_only">{t('Verified Members Only', 'केवल सत्यापित सदस्य')}</option>
                  <option value="private">{t('Private (Direct Request Only)', 'निजी (केवल अनुरोध पर)')}</option>
                </select>
              </div>

              <div className="pt-2 border-t border-rose-100 flex items-center justify-between">
                {confirmDeleteProfileId === settingsModalProfile.id ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteProfile(settingsModalProfile.id);
                        setConfirmDeleteProfileId(null);
                        setSettingsModalProfile(null);
                      }}
                      className="bg-red-600 text-white px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer"
                    >
                      {t('Confirm Delete', 'हटाएं')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteProfileId(null)}
                      className="text-stone-500 text-xs font-semibold cursor-pointer"
                    >
                      {t('Cancel', 'रद्द')}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteProfileId(settingsModalProfile.id)}
                    className="text-red-600 hover:text-red-800 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> {t('Remove Profile', 'प्रोफ़ाइल हटाएं')}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSettingsModalProfile(null)}
                  className="bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold px-4 py-1.5 rounded-xl text-xs cursor-pointer"
                >
                  {t('Close', 'बंद करें')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. MODAL: BUSINESS AD SETTINGS (Featured, Status, Delete) */}
      {/* ======================================================== */}
      {settingsModalAd && (
        <div 
          className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-start sm:items-center justify-center px-3 sm:px-4 pt-[calc(0.75rem+var(--sat))] pb-[calc(1rem+var(--sab))] overflow-y-auto animate-in fade-in"
          onClick={() => setSettingsModalAd(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-rose-200 relative space-y-4 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-rose-100 pb-2">
              <h4 className="font-serif font-bold text-stone-900 text-sm">
                {t('Ad Settings:', 'विज्ञापन सेटिंग्स:')} {settingsModalAd.title}
              </h4>
              <button onClick={() => setSettingsModalAd(null)}>
                <X className="w-4 h-4 text-stone-400" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">{t('Directory Status', 'डायरेक्टरी स्थिति')}</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleAdStatus(settingsModalAd)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      settingsModalAd.status === 'active'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-stone-100 text-stone-700'
                    }`}
                  >
                    {t('Active (Live)', 'सक्रिय (लाइव)')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleAdStatus(settingsModalAd)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      settingsModalAd.status === 'draft'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-stone-100 text-stone-700'
                    }`}
                  >
                    {t('Draft (Paused)', 'ड्राफ्ट (रुका हुआ)')}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">{t('Placement Tier', 'प्रदर्शन श्रेणी')}</label>
                <button
                  type="button"
                  onClick={() => handleToggleAdFeatured(settingsModalAd)}
                  className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    settingsModalAd.isFeatured
                      ? 'bg-gradient-to-r from-amber-300 to-amber-400 text-[#4c0d1b] shadow-xs'
                      : 'bg-stone-100 text-stone-700 hover:bg-amber-50'
                  }`}
                >
                  <Star className="w-3.5 h-3.5" />
                  <span>{settingsModalAd.isFeatured ? t('Featured Top Banner (Active)', 'प्रमुख बैनर (सक्रिय)') : t('Upgrade to Featured Placement', 'प्रमुख बैनर में अपग्रेड करें')}</span>
                </button>
              </div>

              <div className="pt-2 border-t border-rose-100 flex items-center justify-between">
                {confirmDeleteAdId === settingsModalAd.id ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteAd(settingsModalAd.id);
                        setConfirmDeleteAdId(null);
                        setSettingsModalAd(null);
                      }}
                      className="bg-red-600 text-white px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer"
                    >
                      {t('Confirm Delete', 'हटाएं')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteAdId(null)}
                      className="text-stone-500 text-xs font-semibold cursor-pointer"
                    >
                      {t('Cancel', 'रद्द')}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteAdId(settingsModalAd.id)}
                    className="text-red-600 hover:text-red-800 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> {t('Delete Ad', 'विज्ञापन हटाएं')}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSettingsModalAd(null)}
                  className="bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold px-4 py-1.5 rounded-xl text-xs cursor-pointer"
                >
                  {t('Close', 'बंद करें')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CHAT MODAL */}
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
