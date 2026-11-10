import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, Users, Image as ImageIcon, Settings, Plus, Search, 
  Bell, ChevronDown, CheckCircle2, ShieldCheck, ExternalLink, Edit3, 
  Eye, Trash2, Globe, Lock, Shield, Sparkles, Upload, ArrowRight, 
  X, Check, AlertCircle, Phone, HeartHandshake, FileText, Camera,
  Share2, Linkedin, Instagram, Link2, MoreVertical, Sliders, Store,
  Tag, Star, MapPin, Building, Heart, MessageCircle, Compass
} from 'lucide-react';
import { 
  MatrimonyProfile, BusinessAd, TabType, AuthSession, 
  UserMediaAsset, VisibilitySetting, ProfileStatus, ProfileAdmirer, ChatMessage 
} from '../types';
import { ChatModal } from './ChatModal';

interface DashboardTabProps {
  authSession: AuthSession | null;
  profiles: MatrimonyProfile[];
  ads: BusinessAd[];
  onUpdateProfile: (updatedProfile: MatrimonyProfile) => void;
  onAddProfile: (newProfile: MatrimonyProfile) => void;
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
  const [admirers, setAdmirers] = useState<ProfileAdmirer[]>(() => {
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
  const [chatThreads, setChatThreads] = useState<Record<string, ChatMessage[]>>(() => {
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

  // Inline Business Ad Editor State
  const [isEditingAd, setIsEditingAd] = useState(false);
  const [editingAd, setEditingAd] = useState<BusinessAd | null>(null);

  // Live Preview Modals
  const [previewProfile, setPreviewProfile] = useState<MatrimonyProfile | null>(null);
  const [previewAd, setPreviewAd] = useState<BusinessAd | null>(null);

  // Quick Card Settings Modals
  const [settingsModalProfile, setSettingsModalProfile] = useState<MatrimonyProfile | null>(null);
  const [settingsModalAd, setSettingsModalAd] = useState<BusinessAd | null>(null);

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

  // Processed Matrimony Profiles
  const userProfiles = useMemo(() => {
    return profiles.map((p, idx) => ({
      ...p,
      status: p.status || (idx % 2 === 0 ? 'active' : 'draft'),
      visibility: p.visibility || (idx % 2 === 0 ? 'public' : 'verified_only'),
      coverPhoto: p.coverPhoto || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
      gallery: p.gallery || [
        p.photo || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=600&q=80'
      ],
      socialLinks: p.socialLinks || {
        linkedin: 'https://linkedin.com/in/rathore',
        instagram: '@rathore_rishtey'
      }
    }));
  }, [profiles]);

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
  const draftAdsCount = useMemo(() => userAds.filter(a => a.status === 'draft').length, [userAds]);
  const featuredAdsCount = useMemo(() => userAds.filter(a => a.isFeatured).length, [userAds]);
  const unreadNotificationCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  // Handler: Start Editing Profile
  const handleStartEditProfile = (profile: MatrimonyProfile) => {
    setEditingProfile({ ...profile });
    setIsEditingProfile(true);
    setIsEditingAd(false);
  };

  // Handler: Create New Profile via Editor
  const handleStartCreateNewProfile = () => {
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
      contact: authSession?.phone ? `+91 ${authSession.phone}` : '+91 98260 00000',
      phone: authSession?.phone ? `+91 ${authSession.phone}` : '',
      about: 'Well-settled respected Rathore Samaj family alliance sought.',
      familyDetails: 'Father: Respected Elder, Mother: Homemaker. Native: Indore.',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
      coverPhoto: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
      gallery: [],
      socialLinks: { linkedin: '', instagram: '', website: '' },
      visibility: 'public',
      status: 'active',
      verified: true,
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

    if (!editingProfile.name.trim() || !editingProfile.gotra.trim()) {
      alert("Please provide at least candidate Name and Gotra.");
      return;
    }

    const exists = profiles.some(p => p.id === editingProfile.id);
    if (exists) {
      onUpdateProfile(editingProfile);
    } else {
      onAddProfile(editingProfile);
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
    setEditingAd({ ...ad });
    setIsEditingAd(true);
    setIsEditingProfile(false);
  };

  // Handler: Create New Business Ad
  const handleStartCreateNewAd = () => {
    const blankAd: BusinessAd = {
      id: Date.now(),
      title: '',
      owner: authSession?.name || '',
      category: 'Clothing & Retail',
      city: 'Indore',
      address: '',
      phone: authSession?.phone ? `+91 ${authSession.phone}` : '+91 98260 00000',
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

    if (!editingAd.title.trim() || !editingAd.phone.trim() || !editingAd.address.trim()) {
      alert("Please provide Business Name, Phone, and Address.");
      return;
    }

    const exists = ads.some(a => a.id === editingAd.id);
    if (exists) {
      onUpdateAd(editingAd);
    } else {
      onAddAd(editingAd);
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
      <header className="bg-white rounded-3xl border border-rose-100 shadow-sm p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Left: Brand Identity & Active Breadcrumb */}
        <div className="flex items-center gap-3.5 w-full md:w-auto justify-between md:justify-start">
          <div 
            onClick={() => onNavigateTab('matrimony')} 
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#851834] to-[#6e1628] text-amber-200 font-bold flex items-center justify-center text-sm font-serif shadow-xs border border-amber-300/40 group-hover:scale-105 transition-transform">
              RR
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-serif font-bold text-stone-900 text-sm sm:text-base leading-none">
                  Member Dashboard
                </span>
                <span className="bg-rose-50 text-[#851834] text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-200 font-serif">
                  Workspace
                </span>
              </div>
              <p className="text-[11px] text-stone-400 font-light mt-0.5">
                Rathore Rishtey • Member Workspace & Management
              </p>
            </div>
          </div>

          {/* Quick exit to public directory on mobile */}
          <button
            onClick={() => onNavigateTab('matrimony')}
            className="md:hidden text-xs text-[#851834] font-semibold flex items-center gap-1 bg-rose-50 px-2.5 py-1.5 rounded-xl border border-rose-200"
          >
            Directory <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Center: Search Bar */}
        <div className="relative w-full md:w-80 lg:w-96">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search profiles, business ads, gotra, city..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-xs sm:text-sm bg-stone-50/50 transition-all"
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

        {/* Right: Notifications & User Profile Dropdown */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          
          {/* Notifications Popover */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileMenu(false);
              }}
              className="relative p-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 transition-colors cursor-pointer"
              aria-label="Notifications"
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
                className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-rose-100 z-50 p-4 space-y-3 animate-in fade-in"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-[#851834]" />
                    <span className="font-serif font-bold text-sm text-stone-900">Notifications</span>
                  </div>
                  {unreadNotificationCount > 0 && (
                    <button
                      onClick={handleMarkAllNotificationsRead}
                      className="text-[11px] text-[#851834] font-semibold hover:underline cursor-pointer"
                    >
                      Mark all as read
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
                      <div className="flex items-center justify-between">
                        <strong className="font-serif font-bold">{n.title}</strong>
                        <span className="text-[10px] text-stone-400">{n.time}</span>
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
                    Close
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
              className="flex items-center gap-2.5 p-1.5 pr-3 rounded-2xl border border-stone-200 hover:border-rose-300 hover:bg-stone-50 transition-all cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-rose-100 text-[#851834] flex items-center justify-center font-bold text-xs overflow-hidden border border-rose-200">
                {authSession?.photoUrl ? (
                  <img src={authSession.photoUrl} alt="User" className="w-full h-full object-cover" />
                ) : (
                  <span>{authSession?.name ? authSession.name[0] : 'R'}</span>
                )}
              </div>
              <div className="text-left hidden sm:block">
                <span className="text-xs font-bold text-stone-800 block truncate max-w-[120px]">
                  {authSession?.name || 'Samaj Member'}
                </span>
                <span className="text-[10px] text-emerald-700 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Verified
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
            </button>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div 
                className="absolute right-0 mt-2 w-64 bg-white rounded-3xl shadow-2xl border border-rose-100 z-50 p-3 space-y-2 text-xs animate-in fade-in"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-3 bg-rose-50/50 rounded-2xl border border-rose-100/80">
                  <p className="font-bold text-stone-900 font-serif">{authSession?.name || 'Samaj Member'}</p>
                  <p className="text-[11px] text-stone-500 font-light truncate">
                    {authSession?.email || `+91 ${authSession?.phone}`}
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded-full">
                    <ShieldCheck className="w-3 h-3 text-emerald-700" /> Rathore Samaj ID Verified
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
                    <FileText className="w-4 h-4 text-[#851834]" /> My Published Profiles
                  </button>

                  <button
                    onClick={() => {
                      setActiveSection('ads');
                      setShowProfileMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-stone-50 font-medium text-stone-700 flex items-center gap-2"
                  >
                    <Store className="w-4 h-4 text-[#851834]" /> My Published Ads
                  </button>

                  <button
                    onClick={() => {
                      setActiveSection('media');
                      setShowProfileMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-stone-50 font-medium text-stone-700 flex items-center gap-2"
                  >
                    <ImageIcon className="w-4 h-4 text-[#851834]" /> Media Assets
                  </button>

                  <button
                    onClick={() => {
                      setActiveSection('settings');
                      setShowProfileMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-stone-50 font-medium text-stone-700 flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4 text-[#851834]" /> Account Settings
                  </button>

                  <button
                    onClick={() => {
                      onNavigateTab('matrimony');
                      setShowProfileMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-50 font-semibold text-[#851834] flex items-center gap-2 border-t border-stone-100 mt-1 pt-2"
                  >
                    <ExternalLink className="w-4 h-4" /> Go to Public Directory
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
                    Sign Out of Workspace
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. MAIN LAYOUT: SIDEBAR + CONTENT AREA                   */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ====================================================== */}
        {/* SIDEBAR NAVIGATION                                     */}
        {/* ====================================================== */}
        <aside className="lg:col-span-3 bg-white rounded-3xl border border-rose-100 shadow-sm p-4 sm:p-5 space-y-6">
          
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 px-3">
              Workspace Menu
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
                  <span>Home / Overview</span>
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
                  <span>Published Profiles</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  activeSection === 'profiles' || isEditingProfile
                    ? 'bg-amber-300 text-[#4c0d1b]'
                    : 'bg-rose-100 text-[#851834]'
                }`}>
                  {userProfiles.length}
                </span>
              </button>

              {/* 3. Published Business Ads (NEW FEATURE!) */}
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
                  <span>Published Ads</span>
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
                  <span>Profiles I Liked</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  activeSection === 'liked_by_me'
                    ? 'bg-amber-300 text-[#4c0d1b]'
                    : 'bg-rose-100 text-[#851834]'
                }`}>
                  {likedProfileList.length}
                </span>
              </button>

              {/* 5. Who Liked My Profile */}
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
                  <span>Who Liked Me</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  activeSection === 'who_liked_me'
                    ? 'bg-amber-300 text-[#4c0d1b]'
                    : 'bg-amber-100 text-amber-900'
                }`}>
                  {admirers.length}
                </span>
              </button>

              {/* 6. Chat Messages */}
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
                  <span>Chat Messages</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  activeSection === 'chats'
                    ? 'bg-amber-300 text-[#4c0d1b]'
                    : 'bg-emerald-100 text-emerald-900'
                }`}>
                  {Object.keys(chatThreads).length || 'Live'}
                </span>
              </button>

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
                  <span>Media Assets</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  activeSection === 'media' && !isEditingProfile && !isEditingAd
                    ? 'bg-amber-300 text-[#4c0d1b]'
                    : 'bg-stone-100 text-stone-600'
                }`}>
                  {mediaAssets.length}
                </span>
              </button>

              {/* 5. Settings */}
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
                  <span>Settings</span>
                </div>
              </button>
            </nav>
          </div>

          {/* Quick Action CTAs in Sidebar */}
          <div className="pt-2 space-y-2">
            <button
              onClick={handleStartCreateNewProfile}
              className="w-full bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:from-amber-200 hover:to-amber-400 text-[#4c0d1b] font-bold py-2.5 px-4 rounded-2xl text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-101 font-serif"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create Profile</span>
            </button>

            <button
              onClick={handleStartCreateNewAd}
              className="w-full bg-rose-50 hover:bg-rose-100 text-[#851834] border border-rose-200 font-bold py-2.5 px-4 rounded-2xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer font-serif"
            >
              <Store className="w-4 h-4" />
              <span>+ Post Business Ad</span>
            </button>
          </div>

          {/* Trust Banner Card in Sidebar */}
          <div className="bg-rose-50/50 rounded-2xl p-4 border border-rose-100 text-xs space-y-2">
            <div className="flex items-center gap-1.5 text-[#851834] font-bold font-serif">
              <ShieldCheck className="w-4 h-4 text-[#851834]" />
              <span>100% Verified Directory</span>
            </div>
            <p className="text-stone-500 text-[11px] font-light leading-relaxed">
              Your listings are screened against Rathore Samaj registry to protect community trust.
            </p>
            <button
              onClick={() => onNavigateTab('matrimony')}
              className="text-[11px] font-bold text-[#851834] hover:underline flex items-center gap-1 pt-1"
            >
              Public Directory <ArrowRight className="w-3 h-3" />
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
            <div className="bg-white rounded-3xl border border-rose-100 shadow-sm p-6 sm:p-8 space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-rose-100 pb-4">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#851834] font-serif bg-rose-50 px-3 py-1 rounded-full border border-rose-200 inline-block mb-1">
                    Inline Profile Editor
                  </span>
                  <h3 className="text-2xl font-serif font-bold text-stone-900">
                    {editingProfile.name ? `Edit Profile: ${editingProfile.name}` : 'Create New Matrimonial Biodata'}
                  </h3>
                  <p className="text-xs text-stone-500 font-light mt-0.5">
                    Update candidate biodata, photos, media gallery, contact details, social handles, and public visibility.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="p-2 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors"
                  aria-label="Cancel"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProfileEdits} className="space-y-6">
                
                {/* 1. Basic Info & Candidate Bio */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#851834] font-serif flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5" /> 1. Candidate Identity & Background
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
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">Avatar Profile Photo URL</label>
                      <input
                        type="url"
                        value={editingProfile.photo || ''}
                        onChange={(e) => setEditingProfile({ ...editingProfile, photo: e.target.value })}
                        placeholder="https://images.unsplash.com/photo-..."
                        className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50/40"
                      />
                      {editingProfile.photo && (
                        <div className="mt-2 flex items-center gap-3">
                          <img 
                            src={editingProfile.photo} 
                            alt="Avatar Preview" 
                            className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-300 shadow-xs" 
                          />
                          <span className="text-[11px] text-stone-500">Avatar Live Preview</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block font-bold text-stone-700 mb-1">Background Cover Photo URL</label>
                      <input
                        type="url"
                        value={editingProfile.coverPhoto || ''}
                        onChange={(e) => setEditingProfile({ ...editingProfile, coverPhoto: e.target.value })}
                        placeholder="https://images.unsplash.com/photo-..."
                        className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50/40"
                      />
                      {editingProfile.coverPhoto && (
                        <div className="mt-2">
                          <img 
                            src={editingProfile.coverPhoto} 
                            alt="Cover Preview" 
                            className="w-full h-14 rounded-xl object-cover border border-stone-200 shadow-xs" 
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Media Gallery */}
                <div className="space-y-3 pt-2 border-t border-rose-100">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#851834] font-serif flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5" /> 3. Additional Media Gallery & Kundali
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        const currentGallery = editingProfile.gallery || [];
                        const sampleUrl = prompt("Enter additional photo or Kundali document image URL:");
                        if (sampleUrl) {
                          setEditingProfile({
                            ...editingProfile,
                            gallery: [...currentGallery, sampleUrl]
                          });
                        }
                      }}
                      className="text-xs font-bold text-[#851834] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Gallery Photo
                    </button>
                  </div>

                  {editingProfile.gallery && editingProfile.gallery.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {editingProfile.gallery.map((imgUrl, i) => (
                        <div key={i} className="relative rounded-2xl overflow-hidden group h-24 border border-stone-200">
                          <img src={imgUrl} alt={`Gallery ${i}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = editingProfile.gallery?.filter((_, idx) => idx !== i) || [];
                              setEditingProfile({ ...editingProfile, gallery: updated });
                            }}
                            className="absolute top-1.5 right-1.5 bg-black/70 hover:bg-red-700 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-stone-400 font-light italic">
                      No additional photos added yet. Click "+ Add Gallery Photo" above.
                    </p>
                  )}
                </div>

                {/* 4. Family & Contact Info */}
                <div className="space-y-4 pt-2 border-t border-rose-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#851834] font-serif flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" /> 4. Contact & Family Details
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">Primary Verified Phone / WhatsApp *</label>
                      <input
                        type="tel"
                        required
                        value={editingProfile.contact}
                        onChange={(e) => setEditingProfile({ ...editingProfile, contact: e.target.value })}
                        placeholder="+91 98260 00000"
                        className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50/40"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-stone-700 mb-1">Family Lineage Summary</label>
                      <input
                        type="text"
                        value={editingProfile.familyDetails || ''}
                        onChange={(e) => setEditingProfile({ ...editingProfile, familyDetails: e.target.value })}
                        placeholder="Father, Mother, Gotra lineage..."
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
                <div className="pt-4 border-t border-rose-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="px-5 py-2.5 rounded-xl border border-stone-200 text-stone-700 font-semibold text-xs hover:bg-stone-50 cursor-pointer"
                  >
                    Cancel & Discard
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-gradient-to-r from-[#6e1628] via-[#851834] to-[#6e1628] hover:opacity-95 text-amber-100 font-bold rounded-xl text-xs shadow-md border border-amber-300/30 cursor-pointer"
                  >
                    Save & Update Profile
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ==================================================== */}
          {/* VIEW B: INLINE BUSINESS AD EDITOR                    */}
          {/* ==================================================== */}
          {isEditingAd && editingAd && (
            <div className="bg-white rounded-3xl border border-rose-100 shadow-sm p-6 sm:p-8 space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-rose-100 pb-4">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#851834] font-serif bg-rose-50 px-3 py-1 rounded-full border border-rose-200 inline-block mb-1">
                    Business Ad Editor
                  </span>
                  <h3 className="text-2xl font-serif font-bold text-stone-900">
                    {editingAd.title ? `Edit Business Ad: ${editingAd.title}` : 'Post New Business Advertisement'}
                  </h3>
                  <p className="text-xs text-stone-500 font-light mt-0.5">
                    Promote your showroom, wholesale agency, or professional service to thousands of community families.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingAd(false)}
                  className="p-2 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors"
                  aria-label="Cancel"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveAdEdits} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Business / Firm Title *</label>
                    <input
                      type="text"
                      required
                      value={editingAd.title}
                      onChange={(e) => setEditingAd({ ...editingAd, title: e.target.value })}
                      placeholder="e.g. Rathore Jewellers & Sons"
                      className="w-full p-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-rose-500/20 bg-stone-50/40"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Owner Name *</label>
                    <input
                      type="text"
                      required
                      value={editingAd.owner}
                      onChange={(e) => setEditingAd({ ...editingAd, owner: e.target.value })}
                      placeholder="e.g. Rameshwar Rathore"
                      className="w-full p-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-rose-500/20 bg-stone-50/40"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Category *</label>
                    <select
                      value={editingAd.category}
                      onChange={(e) => setEditingAd({ ...editingAd, category: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-stone-200 bg-white"
                    >
                      <option value="Clothing & Retail">Clothing & Retail</option>
                      <option value="Hardware & Home Imprv.">Hardware & Home Imprv.</option>
                      <option value="Jewelry & Gold">Jewelry & Gold</option>
                      <option value="Wedding Services & Catering">Wedding Planning & Catering</option>
                      <option value="Healthcare & Pharmacy">Healthcare & Pharmacy</option>
                      <option value="Food & Restaurants">Food & Sweets</option>
                      <option value="Automobile">Automobile & Transport</option>
                      <option value="Other">Other Business</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Phone / WhatsApp *</label>
                    <input
                      type="tel"
                      required
                      value={editingAd.phone}
                      onChange={(e) => setEditingAd({ ...editingAd, phone: e.target.value })}
                      placeholder="+91 98261 11223"
                      className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50/40"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={editingAd.city || 'Indore'}
                      onChange={(e) => setEditingAd({ ...editingAd, city: e.target.value })}
                      placeholder="e.g. Indore"
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

                <div className="text-xs">
                  <label className="block font-bold text-stone-700 mb-1">Storefront Banner Photo URL</label>
                  <input
                    type="url"
                    value={editingAd.banner || ''}
                    onChange={(e) => setEditingAd({ ...editingAd, banner: e.target.value })}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50/40"
                  />
                  {editingAd.banner && (
                    <div className="mt-2">
                      <img 
                        src={editingAd.banner} 
                        alt="Banner Preview" 
                        className="w-full h-24 rounded-xl object-cover border border-stone-200 shadow-2xs" 
                      />
                    </div>
                  )}
                </div>

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

                <div className="pt-4 border-t border-rose-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditingAd(false)}
                    className="px-5 py-2.5 rounded-xl border border-stone-200 text-stone-700 font-semibold text-xs hover:bg-stone-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-gradient-to-r from-[#6e1628] via-[#851834] to-[#6e1628] hover:opacity-95 text-amber-100 font-bold rounded-xl text-xs shadow-md border border-amber-300/30 cursor-pointer"
                  >
                    Save & Publish Ad
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ==================================================== */}
          {/* VIEW C: OVERVIEW / DASHBOARD HOME                    */}
          {/* ==================================================== */}
          {!isEditingProfile && !isEditingAd && activeSection === 'overview' && (
            <div className="space-y-6 animate-in fade-in">
              
              {/* Welcome Banner */}
              <div className="bg-gradient-to-r from-[#6e1628] via-[#851834] to-[#6e1628] rounded-3xl p-6 sm:p-8 text-white shadow-md border border-amber-400/30 relative overflow-hidden">
                <div className="relative z-10 space-y-2 max-w-xl">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-amber-300/40 text-amber-200 text-xs font-semibold backdrop-blur-xs font-serif">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Member Management Console</span>
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-serif font-bold text-amber-50">
                    Welcome, {authSession?.name || 'Samaj Member'}
                  </h3>
                  <p className="text-xs sm:text-sm text-rose-100/90 font-light leading-relaxed">
                    Manage your published candidate profiles, business ads, horoscopes, and contact privacy settings for the Rathore Samaj network.
                  </p>
                  <div className="pt-2 flex flex-wrap gap-2.5">
                    <button
                      onClick={handleStartCreateNewProfile}
                      className="bg-gradient-to-r from-amber-300 to-amber-400 text-[#4c0d1b] font-bold px-4 py-2 rounded-xl text-xs shadow cursor-pointer font-serif"
                    >
                      + Create Matrimony Profile
                    </button>
                    <button
                      onClick={handleStartCreateNewAd}
                      className="bg-white/15 hover:bg-white/25 text-amber-100 border border-amber-300/30 font-semibold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      + Post Business Ad
                    </button>
                  </div>
                </div>
              </div>

              {/* 4 Overview Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div 
                  onClick={() => setActiveSection('profiles')}
                  className="bg-white p-4 rounded-3xl border border-rose-100 shadow-xs text-center space-y-1 cursor-pointer hover:border-rose-300 transition-colors"
                >
                  <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Active Profiles</span>
                  <p className="text-2xl sm:text-3xl font-serif font-bold text-[#851834]">{activeProfilesCount}</p>
                  <p className="text-[11px] text-emerald-600 font-medium">Live on Directory</p>
                </div>

                <div 
                  onClick={() => setActiveSection('ads')}
                  className="bg-white p-4 rounded-3xl border border-rose-100 shadow-xs text-center space-y-1 cursor-pointer hover:border-rose-300 transition-colors"
                >
                  <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Published Ads</span>
                  <p className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">{activeAdsCount}</p>
                  <p className="text-[11px] text-emerald-600 font-medium">Business Directory</p>
                </div>

                <div 
                  onClick={() => setActiveSection('media')}
                  className="bg-white p-4 rounded-3xl border border-rose-100 shadow-xs text-center space-y-1 cursor-pointer hover:border-rose-300 transition-colors"
                >
                  <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Media Assets</span>
                  <p className="text-2xl sm:text-3xl font-serif font-bold text-stone-800">{mediaAssets.length}</p>
                  <p className="text-[11px] text-stone-400 font-light">Photos & Kundalis</p>
                </div>

                <div className="bg-white p-4 rounded-3xl border border-rose-100 shadow-xs text-center space-y-1">
                  <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Samaj Trust Score</span>
                  <p className="text-2xl sm:text-3xl font-serif font-bold text-emerald-700">100%</p>
                  <p className="text-[11px] text-emerald-600 font-medium">Verified Gotra</p>
                </div>
              </div>

              {/* Recent Community Activity Feed */}
              <div className="bg-white rounded-3xl border border-rose-100 shadow-sm p-6 space-y-4">
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
                    Published Candidate Profiles
                  </h3>
                  <p className="text-xs text-stone-500 font-light">
                    Manage active and draft listings, edit media assets, and view live directory previews.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200">
                    <button
                      onClick={() => setProfileStatusFilter('all')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        profileStatusFilter === 'all'
                          ? 'bg-[#851834] text-amber-100 shadow-xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      All ({userProfiles.length})
                    </button>
                    <button
                      onClick={() => setProfileStatusFilter('active')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        profileStatusFilter === 'active'
                          ? 'bg-[#851834] text-amber-100 shadow-xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Active ({activeProfilesCount})
                    </button>
                    <button
                      onClick={() => setProfileStatusFilter('draft')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        profileStatusFilter === 'draft'
                          ? 'bg-[#851834] text-amber-100 shadow-xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Draft ({draftProfilesCount})
                    </button>
                  </div>

                  <button
                    onClick={handleStartCreateNewProfile}
                    className="bg-gradient-to-r from-[#6e1628] via-[#851834] to-[#6e1628] text-amber-100 font-bold px-3.5 py-1.5 rounded-xl text-xs shadow-sm flex items-center gap-1.5 cursor-pointer border border-amber-300/30"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-300" />
                    <span>New Profile</span>
                  </button>
                </div>
              </div>

              {/* EMPTY STATE SCREEN WITH CLEAR CTA */}
              {filteredUserProfiles.length === 0 ? (
                <div className="bg-white rounded-3xl border border-rose-100 p-8 sm:p-12 text-center space-y-4 shadow-sm">
                  <div className="w-16 h-16 bg-rose-50 rounded-2xl mx-auto flex items-center justify-center text-3xl border border-rose-200 shadow-xs">
                    🌸
                  </div>
                  <div className="max-w-md mx-auto space-y-1">
                    <h4 className="text-xl font-serif font-bold text-stone-900">
                      No Matrimonial Profiles Found
                    </h4>
                    <p className="text-xs text-stone-500 font-light leading-relaxed">
                      {searchQuery 
                        ? `No profiles matching "${searchQuery}". Clear your search query to see all candidates.`
                        : "You haven't published or saved any matrimonial profiles in your account yet. Create your first profile to connect with 450+ verified Rathore Samaj families."}
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={searchQuery ? () => setSearchQuery('') : handleStartCreateNewProfile}
                      className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:from-amber-200 hover:to-amber-400 text-[#4c0d1b] font-bold px-6 py-3 rounded-2xl text-xs shadow-md transition-all inline-flex items-center gap-2 cursor-pointer font-serif hover:scale-102"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{searchQuery ? "Clear Search Filter" : "Create Your First Profile"}</span>
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
                                Active • Live on Directory
                              </span>
                            ) : (
                              <span className="bg-amber-600/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1 backdrop-blur-xs font-serif">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-200"></span>
                                Draft • In Review
                              </span>
                            )}
                          </div>

                          {/* Visibility Chip */}
                          <div className="absolute top-3 right-3 bg-black/60 text-amber-200 text-[10px] font-semibold px-2 py-0.5 rounded-lg border border-amber-300/30 backdrop-blur-xs">
                            {p.visibility === 'public' ? 'Public' : p.visibility === 'verified_only' ? 'Verified Only' : 'Private'}
                          </div>
                        </div>

                        {/* Candidate Info with Avatar */}
                        <div className="px-5 pt-0 pb-4 relative">
                          <div className="flex justify-between items-end -mt-9 mb-3">
                            <img 
                              src={p.photo || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80"} 
                              alt={p.name} 
                              className="w-18 h-18 rounded-2xl object-cover object-top border-4 border-white shadow-md bg-white" 
                            />
                            <div className="text-right">
                              <span className="text-[10px] bg-rose-50 text-[#851834] font-serif font-bold px-2 py-0.5 rounded-md border border-rose-200">
                                Gotra: {p.gotra}
                              </span>
                            </div>
                          </div>

                          <h4 className="font-serif font-bold text-lg text-stone-900 group-hover:text-[#851834] transition-colors leading-tight">
                            {p.name}
                          </h4>
                          <p className="text-xs text-stone-500 font-medium mt-0.5">
                            {p.age} Yrs · {p.height || "5' 8\""} · {p.profession}
                          </p>
                          <p className="text-xs text-stone-400 mt-0.5 font-light">
                            📍 {p.city}, {p.state || 'MP'}
                          </p>
                        </div>
                      </div>

                      {/* QUICK ACTION BUTTONS: Edit Profile, View Live, Settings */}
                      <div className="p-4 pt-3 border-t border-rose-100/80 bg-rose-50/20 grid grid-cols-3 gap-2">
                        <button
                          onClick={() => handleStartEditProfile(p)}
                          className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold bg-white border border-stone-200 hover:border-rose-300 hover:bg-rose-50 text-stone-700 transition-colors cursor-pointer shadow-2xs"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-[#851834]" />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => setPreviewProfile(p)}
                          className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold bg-white border border-stone-200 hover:border-rose-300 hover:bg-rose-50 text-stone-700 transition-colors cursor-pointer shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#851834]" />
                          <span>View Live</span>
                        </button>

                        <button
                          onClick={() => setSettingsModalProfile(p)}
                          className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold bg-white border border-stone-200 hover:border-rose-300 hover:bg-rose-50 text-stone-700 transition-colors cursor-pointer shadow-2xs"
                        >
                          <Sliders className="w-3.5 h-3.5 text-[#851834]" />
                          <span>Settings</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ==================================================== */}
          {/* VIEW E: PUBLISHED BUSINESS ADS (NEW FEATURE!)        */}
          {/* ==================================================== */}
          {!isEditingProfile && !isEditingAd && activeSection === 'ads' && (
            <div className="space-y-5 animate-in fade-in">
              
              {/* Header Bar & Filter Controls */}
              <div className="bg-white rounded-3xl border border-rose-100 p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg sm:text-xl font-serif font-bold text-stone-900 flex items-center gap-2">
                    <Store className="w-5 h-5 text-[#851834]" />
                    <span>My Published Business Ads</span>
                  </h3>
                  <p className="text-xs text-stone-500 font-light">
                    Manage your commercial listings, promotional discounts, and storefront cards in the Rathore Samaj directory.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200">
                    <button
                      onClick={() => setAdStatusFilter('all')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        adStatusFilter === 'all'
                          ? 'bg-[#851834] text-amber-100 shadow-xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      All ({userAds.length})
                    </button>
                    <button
                      onClick={() => setAdStatusFilter('active')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        adStatusFilter === 'active'
                          ? 'bg-[#851834] text-amber-100 shadow-xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Active ({activeAdsCount})
                    </button>
                    <button
                      onClick={() => setAdStatusFilter('featured')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        adStatusFilter === 'featured'
                          ? 'bg-[#851834] text-amber-100 shadow-xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Featured ({featuredAdsCount})
                    </button>
                  </div>

                  <button
                    onClick={handleStartCreateNewAd}
                    className="bg-gradient-to-r from-[#6e1628] via-[#851834] to-[#6e1628] text-amber-100 font-bold px-3.5 py-1.5 rounded-xl text-xs shadow-sm flex items-center gap-1.5 cursor-pointer border border-amber-300/30"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-300" />
                    <span>Post New Ad</span>
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
                      No Business Ads Found
                    </h4>
                    <p className="text-xs text-stone-500 font-light leading-relaxed">
                      {searchQuery
                        ? `No advertisements match "${searchQuery}". Clear your search keyword to view all ads.`
                        : "Showcase your retail shop, manufacturing agency, or service to thousands of Rathore Samaj families across MP, Rajasthan, and Maharashtra."}
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={searchQuery ? () => setSearchQuery('') : handleStartCreateNewAd}
                      className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:from-amber-200 hover:to-amber-400 text-[#4c0d1b] font-bold px-6 py-3 rounded-2xl text-xs shadow-md transition-all inline-flex items-center gap-2 cursor-pointer font-serif hover:scale-102"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{searchQuery ? "Clear Search Filter" : "Post Your First Business Ad"}</span>
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
                              <Star className="w-3 h-3 fill-[#4c0d1b]" /> Featured
                            </div>
                          )}

                          {/* Status Tag on Banner Bottom */}
                          <div className="absolute bottom-2.5 left-3">
                            {ad.status === 'active' ? (
                              <span className="bg-emerald-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-200 animate-pulse"></span>
                                Live in Directory
                              </span>
                            ) : (
                              <span className="bg-amber-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-200"></span>
                                Draft / Paused
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Content Info */}
                        <div className="p-5 space-y-2.5">
                          <div>
                            <h4 className="font-serif font-bold text-base text-stone-900 group-hover:text-[#851834] transition-colors leading-tight">
                              {ad.title}
                            </h4>
                            <p className="text-xs text-stone-500 font-medium mt-0.5">
                              Owner: {ad.owner} · {ad.city || 'Indore'}
                            </p>
                          </div>

                          <p className="text-xs text-stone-600 font-light line-clamp-2 leading-relaxed">
                            {ad.tagline || ad.description}
                          </p>

                          {ad.address && (
                            <p className="text-[11px] text-stone-400 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                              <span className="truncate">{ad.address}</span>
                            </p>
                          )}

                          {ad.offer && (
                            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] p-2 rounded-xl font-semibold flex items-center gap-1.5">
                              <Tag className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span className="truncate">{ad.offer}</span>
                            </div>
                          )}

                          {/* Engagement Metrics Pill */}
                          <div className="flex items-center gap-3 text-[11px] text-stone-500 pt-1">
                            <span className="bg-stone-50 px-2 py-0.5 rounded-md border border-stone-200">
                              👁️ {ad.viewsCount || 124} Directory Views
                            </span>
                            <span className="bg-stone-50 px-2 py-0.5 rounded-md border border-stone-200">
                              📞 {ad.inquiriesCount || 18} Calls
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* QUICK ACTION BUTTONS: Edit Ad, View Live, Settings */}
                      <div className="p-4 pt-3 border-t border-rose-100/80 bg-rose-50/20 grid grid-cols-3 gap-2">
                        <button
                          onClick={() => handleStartEditAd(ad)}
                          className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold bg-white border border-stone-200 hover:border-rose-300 hover:bg-rose-50 text-stone-700 transition-colors cursor-pointer shadow-2xs"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-[#851834]" />
                          <span>Edit Ad</span>
                        </button>

                        <button
                          onClick={() => setPreviewAd(ad)}
                          className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold bg-white border border-stone-200 hover:border-rose-300 hover:bg-rose-50 text-stone-700 transition-colors cursor-pointer shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#851834]" />
                          <span>View Live</span>
                        </button>

                        <button
                          onClick={() => setSettingsModalAd(ad)}
                          className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold bg-white border border-stone-200 hover:border-rose-300 hover:bg-rose-50 text-stone-700 transition-colors cursor-pointer shadow-2xs"
                        >
                          <Sliders className="w-3.5 h-3.5 text-[#851834]" />
                          <span>Settings</span>
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
              <div className="bg-white rounded-3xl border border-rose-100 p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-rose-100 pb-4">
                  <div>
                    <h3 className="text-xl font-serif font-bold text-stone-900">
                      Media Assets & Photos
                    </h3>
                    <p className="text-xs text-stone-500 font-light">
                      Manage avatar portraits, background covers, shop banners, and horoscope documents.
                    </p>
                  </div>
                  <span className="text-xs bg-rose-50 text-[#851834] font-serif font-bold px-3 py-1 rounded-xl border border-rose-200">
                    {mediaAssets.length} Total Files
                  </span>
                </div>

                {/* Upload Form Widget */}
                <form onSubmit={handleAddMediaAsset} className="bg-rose-50/30 p-4 rounded-2xl border border-rose-100 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#851834] font-serif">
                    <Upload className="w-4 h-4" />
                    <span>Upload or Add Media Link</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <input
                        type="text"
                        placeholder="Asset Title (e.g. Traditional Kurta Photo)"
                        value={newMediaTitle}
                        onChange={(e) => setNewMediaTitle(e.target.value)}
                        className="w-full p-2 rounded-xl border border-stone-200 bg-white"
                      />
                    </div>
                    <div>
                      <select
                        value={newMediaType}
                        onChange={(e) => setNewMediaType(e.target.value as any)}
                        className="w-full p-2 rounded-xl border border-stone-200 bg-white"
                      >
                        <option value="avatar">Avatar Portrait</option>
                        <option value="cover">Background Cover</option>
                        <option value="gallery">Matrimony Gallery Photo</option>
                        <option value="document">Kundali / Document</option>
                      </select>
                    </div>
                    <div>
                      <input
                        type="url"
                        required
                        placeholder="Image URL (https://...)"
                        value={newMediaUrl}
                        onChange={(e) => setNewMediaUrl(e.target.value)}
                        className="w-full p-2 rounded-xl border border-stone-200 bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="bg-gradient-to-r from-[#6e1628] to-[#851834] text-amber-100 text-xs font-bold px-4 py-2 rounded-xl shadow-xs cursor-pointer border border-amber-300/30"
                    >
                      + Save to Media Assets
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
                          className="absolute top-2 right-2 bg-black/60 hover:bg-red-700 text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
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
              <div className="bg-white rounded-3xl border border-rose-100 p-6 sm:p-8 shadow-sm space-y-6">
                <div className="border-b border-rose-100 pb-3">
                  <h3 className="text-xl font-serif font-bold text-stone-900">
                    Account & Visibility Settings
                  </h3>
                  <p className="text-xs text-stone-500 font-light">
                    Control who can view your candidate contact numbers, commercial ads, and profile details in the Rathore Samaj network.
                  </p>
                </div>

                {settingsSavedToast && (
                  <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-3 text-xs text-emerald-800 flex items-center gap-2 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Your privacy and notification preferences have been saved successfully!</span>
                  </div>
                )}

                <div className="space-y-5 text-xs">
                  {/* Public Visibility Setting */}
                  <div className="p-4 rounded-2xl border border-rose-100/90 bg-rose-50/20 space-y-2">
                    <label className="block font-bold text-stone-800 font-serif text-sm">
                      Default Profile Visibility
                    </label>
                    <p className="text-stone-500 font-light leading-relaxed">
                      Choose how your candidate biodata is shown across search filters and the community directory.
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
                        <span className="font-medium text-stone-700">Public to All Verified Samaj Members (Recommended)</span>
                      </label>

                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="radio"
                          name="visPref"
                          checked={visibilityPreference === 'verified_only'}
                          onChange={() => setVisibilityPreference('verified_only')}
                          className="text-[#851834] focus:ring-rose-500"
                        />
                        <span className="font-medium text-stone-700">Only Members with a Registered Family Biodata</span>
                      </label>

                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="radio"
                          name="visPref"
                          checked={visibilityPreference === 'private'}
                          onChange={() => setVisibilityPreference('private')}
                          className="text-[#851834] focus:ring-rose-500"
                        />
                        <span className="font-medium text-stone-700">Private (Requires Approval for Every Contact View)</span>
                      </label>
                    </div>
                  </div>

                  {/* WhatsApp Privacy */}
                  <div className="p-4 rounded-2xl border border-stone-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-stone-800 font-serif">WhatsApp Contact Direct Link</p>
                        <p className="text-[11px] text-stone-500 font-light">Allow verified families to initiate direct chat on WhatsApp</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={!whatsappMasking}
                        onChange={(e) => setWhatsappMasking(!e.target.checked)}
                        className="w-4 h-4 text-[#851834] rounded"
                      />
                    </div>
                  </div>

                  {/* Notification on View */}
                  <div className="p-4 rounded-2xl border border-stone-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-stone-800 font-serif">SMS & In-App View Alerts</p>
                        <p className="text-[11px] text-stone-500 font-light">Receive alerts when another Samaj family unlocks and views your contact or ad</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifyOnView}
                        onChange={(e) => setNotifyOnView(e.target.checked)}
                        className="w-4 h-4 text-[#851834] rounded"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={handleSaveSettings}
                      className="bg-gradient-to-r from-[#6e1628] via-[#851834] to-[#6e1628] text-amber-100 font-bold px-6 py-2.5 rounded-xl shadow-md cursor-pointer border border-amber-300/30"
                    >
                      Save Preferences
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
              <div className="bg-white rounded-3xl border border-rose-100 p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-rose-100 pb-4">
                  <div>
                    <h3 className="text-xl font-serif font-bold text-stone-900 flex items-center gap-2">
                      <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                      <span>Profiles I Liked (Saved Biodatas)</span>
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Candidates you saved for family discussions, direct chat, and astrological matching.
                    </p>
                  </div>
                  <span className="text-xs bg-rose-50 text-rose-800 font-bold px-3 py-1 rounded-full border border-rose-200">
                    {likedProfileList.length} Saved Profiles
                  </span>
                </div>

                {likedProfileList.length === 0 ? (
                  <div className="py-12 text-center space-y-3 max-w-sm mx-auto">
                    <div className="w-14 h-14 bg-rose-50 rounded-2xl mx-auto flex items-center justify-center border border-rose-200">
                      <Heart className="w-7 h-7 text-rose-500 fill-rose-500" />
                    </div>
                    <h4 className="font-serif font-bold text-base text-stone-800">No Liked Profiles Yet</h4>
                    <p className="text-xs text-stone-500 leading-relaxed">
                      Tap the heart icon on any matrimonial profile in the directory to bookmark their biodata here.
                    </p>
                    <button
                      onClick={() => onNavigateTab('matrimony')}
                      className="bg-gradient-to-r from-[#6e1628] to-[#851834] text-amber-100 font-bold px-5 py-2.5 rounded-xl text-xs cursor-pointer shadow-sm hover:scale-102 transition-transform"
                    >
                      Browse Matrimony Biodatas
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
                                Gotra: {p.gotra} · {p.city}
                              </p>
                              <p className="text-[11px] text-stone-500">
                                {p.age} Yrs · {p.education}
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
                              <Eye className="w-3 h-3" /> View Bio
                            </button>

                            <button
                              onClick={() => setActiveChatProfile(p)}
                              className="bg-gradient-to-r from-[#6e1628] to-[#851834] text-amber-200 text-[11px] font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                            >
                              <MessageCircle className="w-3 h-3 text-amber-300" /> Chat
                            </button>

                            {onSelectKundaliProfile && (
                              <button
                                onClick={() => onSelectKundaliProfile(p.id, p.gender)}
                                title="Check Kundali Milan"
                                className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-semibold py-2 px-2.5 rounded-lg flex items-center gap-1 cursor-pointer"
                              >
                                <Compass className="w-3 h-3 text-amber-700" /> Milan
                              </button>
                            )}

                            <button
                              onClick={() => toggleUnlikeProfile(p.id)}
                              title="Remove from Liked"
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
              <div className="bg-white rounded-3xl border border-rose-100 p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-rose-100 pb-4">
                  <div>
                    <h3 className="text-xl font-serif font-bold text-stone-900 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-500" />
                      <span>Who Liked My Profile (Samaj Admirers)</span>
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Rathore community members who liked your profile and want to discuss matrimonial alliance.
                    </p>
                  </div>
                  <span className="text-xs bg-amber-50 text-amber-900 font-bold px-3 py-1 rounded-full border border-amber-300">
                    {admirers.length} Interested Families
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
                                Gotra: {adm.admirerGotra} · {adm.admirerCity}
                              </p>
                              <span className="text-[10px] text-rose-600 font-semibold flex items-center gap-1 mt-0.5">
                                <Heart className="w-2.5 h-2.5 fill-rose-500 text-rose-500" /> {adm.likedAt}
                              </span>
                            </div>
                          </div>

                          <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200 text-[11px] text-stone-700 space-y-0.5">
                            <p><strong>Edu:</strong> {adm.admirerEducation}</p>
                            {adm.admirerProfession && <p><strong>Prof:</strong> {adm.admirerProfession}</p>}
                            {adm.message && <p className="italic text-amber-900 pt-1 text-[10px]">&quot;{adm.message}&quot;</p>}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-stone-100 flex items-center gap-1.5">
                          <button
                            onClick={() => setActiveChatProfile(candidateProfile)}
                            className="flex-1 bg-gradient-to-r from-[#6e1628] to-[#851834] text-amber-200 text-xs font-semibold py-2 px-2.5 rounded-lg flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                          >
                            <MessageCircle className="w-3 h-3 text-amber-300" /> Chat
                          </button>

                          {onSelectKundaliProfile && (
                            <button
                              onClick={() => onSelectKundaliProfile(candidateProfile.id, candidateProfile.gender)}
                              title="Milan"
                              className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-semibold py-2 px-2.5 rounded-lg flex items-center gap-1 cursor-pointer"
                            >
                              <Compass className="w-3 h-3 text-amber-700" /> Milan
                            </button>
                          )}

                          <a
                            href={`tel:${adm.admirerPhone}`}
                            title={`Call ${adm.admirerPhone}`}
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
              <div className="bg-white rounded-3xl border border-rose-100 p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-rose-100 pb-4">
                  <div>
                    <h3 className="text-xl font-serif font-bold text-stone-900 flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-emerald-600" />
                      <span>Direct Chat Messages & Inquiries</span>
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Manage matrimonial alliance conversations with interested Rathore families.
                    </p>
                  </div>
                  <button
                    onClick={() => onNavigateTab('matrimony')}
                    className="text-xs bg-[#851834] text-amber-200 font-bold px-3.5 py-1.5 rounded-xl cursor-pointer"
                  >
                    + Start New Chat
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
                        className="p-4 rounded-2xl border border-stone-200/90 hover:border-amber-400 bg-stone-50/50 hover:bg-amber-50/20 transition-all flex items-center justify-between gap-4 cursor-pointer group"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <img 
                            src={p.photo && p.photo.trim() !== '' ? p.photo : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80"}
                            alt={p.name}
                            className="w-12 h-12 rounded-xl object-cover object-top border border-amber-300 shrink-0" 
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-serif font-bold text-stone-900 text-sm group-hover:text-[#851834] transition-colors truncate">
                                {p.name}
                              </h4>
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.2 rounded-full">Active</span>
                            </div>
                            <p className="text-xs text-stone-500 truncate">
                              Gotra: {p.gotra} · {p.city}
                            </p>
                            <p className="text-xs text-stone-700 truncate mt-0.5 font-medium">
                              {lastMsg ? `${lastMsg.senderName}: ${lastMsg.text}` : `Start conversation with ${p.name}'s family...`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] text-stone-400 hidden sm:inline">{lastMsg ? lastMsg.timestamp : 'Recent'}</span>
                          <button className="bg-gradient-to-r from-[#6e1628] to-[#851834] text-amber-200 text-xs font-semibold py-2 px-3 rounded-xl flex items-center gap-1 shadow-xs">
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Open</span>
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
      </div>

      {/* ======================================================== */}
      {/* 3. MODAL: LIVE PREVIEW OF CANDIDATE BIODATA               */}
      {/* ======================================================== */}
      {previewProfile && (
        <div 
          className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in"
          onClick={() => setPreviewProfile(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-rose-200 relative my-8"
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
                  Candidate Matrimonial Profile (Live Preview)
                </span>
              </div>

              {/* Cover & Avatar Header */}
              <div className="relative h-28 rounded-2xl overflow-hidden border border-stone-200">
                <img src={previewProfile.coverPhoto} alt="Cover" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/20" />
              </div>

              <div className="flex gap-4 items-end -mt-12 px-2 relative">
                <img 
                  src={previewProfile.photo} 
                  alt={previewProfile.name} 
                  className="w-20 h-20 rounded-2xl object-cover object-top border-4 border-white shadow-md bg-white shrink-0" 
                />
                <div>
                  <h3 className="text-xl font-serif font-bold text-stone-900 leading-tight">
                    {previewProfile.name}
                  </h3>
                  <p className="text-xs text-[#851834] font-semibold font-serif">
                    Gotra: {previewProfile.gotra} · {previewProfile.city}
                  </p>
                </div>
              </div>

              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 text-xs space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <p><span className="text-stone-500 font-medium">Age:</span> <strong className="text-stone-800">{previewProfile.age} Yrs</strong></p>
                  <p><span className="text-stone-500 font-medium">Height:</span> <strong className="text-stone-800">{previewProfile.height || "5' 8\""}</strong></p>
                  <p><span className="text-stone-500 font-medium">Education:</span> <strong className="text-stone-800">{previewProfile.education}</strong></p>
                  <p><span className="text-stone-500 font-medium">Profession:</span> <strong className="text-stone-800">{previewProfile.profession}</strong></p>
                </div>
                {previewProfile.about && (
                  <p className="pt-2 border-t border-stone-200/60 text-stone-600 font-light leading-relaxed">
                    {previewProfile.about}
                  </p>
                )}
              </div>

              <div className="bg-emerald-50 border border-emerald-300 p-3.5 rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-emerald-800 font-bold uppercase">Verified Contact:</span>
                  <p className="font-extrabold text-emerald-950 mt-0.5">{previewProfile.contact}</p>
                </div>
                <span className="bg-emerald-700 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg">
                  Directory Active
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
          className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in"
          onClick={() => setPreviewAd(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-200 relative my-8 space-y-4"
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
                Business Directory • Live Storefront Preview
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
                  <Star className="w-3.5 h-3.5 fill-[#4c0d1b]" /> Featured
                </div>
              )}
            </div>

            <div className="space-y-2 text-xs">
              <h3 className="font-serif font-bold text-lg text-stone-900 leading-tight">
                {previewAd.title}
              </h3>
              <p className="text-stone-500 font-medium">
                Owner: {previewAd.owner} · {previewAd.city || 'Indore'}
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
                <Phone className="w-4 h-4 text-amber-300" /> Call Store Owner ({previewAd.phone})
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
          className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in"
          onClick={() => setSettingsModalProfile(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-rose-200 relative space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-rose-100 pb-2">
              <h4 className="font-serif font-bold text-stone-900 text-sm">
                Profile Settings: {settingsModalProfile.name}
              </h4>
              <button onClick={() => setSettingsModalProfile(null)}>
                <X className="w-4 h-4 text-stone-400" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Status on Directory</label>
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
                    Active (Live)
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
                    Draft (Paused)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Visibility Audience</label>
                <select
                  value={settingsModalProfile.visibility}
                  onChange={(e) => handleUpdateProfileVisibility(settingsModalProfile, e.target.value as VisibilitySetting)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 bg-white"
                >
                  <option value="public">Public to All Samaj Members</option>
                  <option value="verified_only">Verified Members Only</option>
                  <option value="private">Private (Direct Request Only)</option>
                </select>
              </div>

              <div className="pt-2 border-t border-rose-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Are you sure you want to remove ${settingsModalProfile.name}'s profile?`)) {
                      onDeleteProfile(settingsModalProfile.id);
                      setSettingsModalProfile(null);
                    }
                  }}
                  className="text-red-600 hover:text-red-800 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove Profile
                </button>

                <button
                  type="button"
                  onClick={() => setSettingsModalProfile(null)}
                  className="bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold px-4 py-1.5 rounded-xl text-xs cursor-pointer"
                >
                  Close
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
          className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in"
          onClick={() => setSettingsModalAd(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-rose-200 relative space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-rose-100 pb-2">
              <h4 className="font-serif font-bold text-stone-900 text-sm">
                Ad Settings: {settingsModalAd.title}
              </h4>
              <button onClick={() => setSettingsModalAd(null)}>
                <X className="w-4 h-4 text-stone-400" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Directory Status</label>
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
                    Active (Live)
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
                    Draft (Paused)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Placement Tier</label>
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
                  <span>{settingsModalAd.isFeatured ? 'Featured Top Banner (Active)' : 'Upgrade to Featured Placement'}</span>
                </button>
              </div>

              <div className="pt-2 border-t border-rose-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete ${settingsModalAd.title}?`)) {
                      onDeleteAd(settingsModalAd.id);
                      setSettingsModalAd(null);
                    }
                  }}
                  className="text-red-600 hover:text-red-800 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Ad
                </button>

                <button
                  type="button"
                  onClick={() => setSettingsModalAd(null)}
                  className="bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold px-4 py-1.5 rounded-xl text-xs cursor-pointer"
                >
                  Close
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
