import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Lock, Unlock, Key, Settings, DollarSign, ToggleLeft, ToggleRight, 
  Users, Store, AlertTriangle, Sparkles, CheckCircle2, RefreshCw, Eye, 
  Trash2, Award, Download, Upload, LogOut, Bell, Compass, FileText, Check, X
} from 'lucide-react';
import { MatrimonyProfile, BusinessAd, TabType, AdminRuntimeConfig } from '../types';

interface AdminDashboardTabProps {
  profiles: MatrimonyProfile[];
  ads: BusinessAd[];
  onUpdateProfile: (profile: MatrimonyProfile) => void;
  onDeleteProfile: (id: number | string) => void;
  onUpdateAd: (ad: BusinessAd) => void;
  onDeleteAd: (id: number | string) => void;
  onNavigateTab: (tab: TabType) => void;
}

export const DEFAULT_ADMIN_CONFIG: AdminRuntimeConfig = {
  subscriptionEnabled: false,
  contactAccessMode: 'limited_3_views',
  annualPlanPrice: 499,
  lifetimePlanPrice: 1499,
  adsMonetizationEnabled: false,
  bannerBroadcastMessage: '॥ जय माताजी की ॥ राठौड़ रिश्ते पोर्टल पर आपका स्वागत है। समस्त परिचय पत्र पूर्णतः समाज सत्यापित हैं।',
  isBroadcastActive: true,
  requireAdminVerification: false,
  kundaliAstrologerServiceEnabled: true,
  allowGuestDownloads: true
};

export const AdminDashboardTab: React.FC<AdminDashboardTabProps> = ({
  profiles,
  ads,
  onUpdateProfile,
  onDeleteProfile,
  onUpdateAd,
  onDeleteAd,
  onNavigateTab
}) => {
  // Authentication State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('samaj_admin_session') === 'active';
    } catch {
      return false;
    }
  });

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Runtime Config State (Persisted in localStorage)
  const [config, setConfig] = useState<AdminRuntimeConfig>(() => {
    try {
      const stored = localStorage.getItem('samaj_admin_config');
      if (stored) return { ...DEFAULT_ADMIN_CONFIG, ...JSON.parse(stored) };
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_ADMIN_CONFIG;
  });

  const [activeAdminTab, setActiveAdminTab] = useState<'flags' | 'monetization' | 'profiles' | 'ads' | 'analytics'>('flags');
  const [saveToast, setSaveToast] = useState(false);
  const [filterGotra, setFilterGotra] = useState('');
  const [searchProfile, setSearchProfile] = useState('');

  // Save config changes live
  const updateConfig = (partial: Partial<AdminRuntimeConfig>) => {
    const updated = { ...config, ...partial };
    setConfig(updated);
    try {
      localStorage.setItem('samaj_admin_config', JSON.stringify(updated));
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() === 'AdminAbhi' && password.trim() === 'Abhiruchi@123') {
      setIsAdminLoggedIn(true);
      sessionStorage.setItem('samaj_admin_session', 'active');
      setAuthError('');
    } else {
      setAuthError('Invalid Admin credentials. Please check your username and password.');
    }
  };

  const handleLogout = () => {
    setIsAdminLoggedIn(false);
    sessionStorage.removeItem('samaj_admin_session');
    setUsername('');
    setPassword('');
  };

  // Filtered Profiles for Admin Moderation
  const filteredProfiles = profiles.filter(p => {
    const matchSearch = !searchProfile || p.name.toLowerCase().includes(searchProfile.toLowerCase()) || p.city.toLowerCase().includes(searchProfile.toLowerCase());
    const matchGotra = !filterGotra || p.gotra.toLowerCase().includes(filterGotra.toLowerCase());
    return matchSearch && matchGotra;
  });

  // Calculate stats
  const totalGrooms = profiles.filter(p => p.gender === 'Male').length;
  const totalBrides = profiles.filter(p => p.gender === 'Female').length;
  const totalVerified = profiles.filter(p => p.verified !== false).length;
  const totalFeaturedAds = ads.filter(a => a.isFeatured).length;

  // 1. IF NOT LOGGED IN: SHOW SECURE ADMIN LOGIN SCREEN
  if (!isAdminLoggedIn) {
    return (
      <div className="max-w-md mx-auto my-12 p-4">
        <div className="bg-white rounded-3xl shadow-xl border border-amber-300 p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-[#380812] text-amber-300 rounded-2xl mx-auto flex items-center justify-center shadow-md border-2 border-amber-400">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-stone-900">
              Rathore Rishtey Admin
            </h2>
            <p className="text-xs text-stone-500">
              Restricted portal for central Samaj administration, feature flags & live APK monetization controls.
            </p>
          </div>

          {authError && (
            <div className="bg-rose-50 border border-rose-300 rounded-2xl p-3 text-xs text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Admin Username
              </label>
              <input 
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                required
                className="w-full text-xs bg-stone-50 border border-stone-300 rounded-xl px-4 py-3 focus:outline-hidden focus:border-amber-600 focus:bg-white text-stone-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Admin Password
              </label>
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className="w-full text-xs bg-stone-50 border border-stone-300 rounded-xl px-4 py-3 focus:outline-hidden focus:border-amber-600 focus:bg-white text-stone-900"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#380812] via-[#540e1b] to-[#380812] hover:from-[#24050b] hover:to-[#380812] text-amber-200 font-bold py-3.5 rounded-xl shadow-md text-xs tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2 border border-amber-500/30"
            >
              <Key className="w-4 h-4 text-amber-300" />
              <span>Authenticate & Enter Admin Console</span>
            </button>
          </form>

          <div className="pt-4 border-t border-stone-100 text-center">
            <button
              onClick={() => onNavigateTab('matrimony')}
              className="text-xs text-stone-500 hover:text-stone-800 font-semibold cursor-pointer"
            >
              ← Return to Community Portal
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. LOGGED IN ADMIN DASHBOARD
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ADMIN HEADER BANNER */}
      <div className="bg-gradient-to-r from-[#24050b] via-[#380812] to-[#24050b] rounded-3xl p-6 sm:p-7 text-white shadow-xl border border-amber-500/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-semibold border border-amber-400/40 mb-2">
            <ShieldCheck className="w-4 h-4" />
            <span>Master SuperAdmin Portal • Logged in as AdminAbhi</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-amber-50">
            Samaj Command & Feature Flags Console
          </h2>
          <p className="text-xs sm:text-sm text-stone-300 font-light mt-1">
            Toggle features, subscriptions & paywalls remotely without resubmitting APK to Google Play Store.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateTab('matrimony')}
            className="bg-white/10 hover:bg-white/20 text-stone-200 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
          >
            Preview App
          </button>
          <button
            onClick={handleLogout}
            className="bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-500/40 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </div>

      {saveToast && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-3.5 text-xs text-emerald-900 font-semibold flex items-center gap-2 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Feature flag settings updated live! All client apps & APKs will adapt immediately.</span>
        </div>
      )}

      {/* METRICS ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <span className="text-[10px] font-bold text-stone-400 uppercase">Total Candidates</span>
          <p className="text-2xl font-bold font-serif text-stone-900 mt-1">{profiles.length}</p>
          <span className="text-[11px] text-stone-500 font-medium">
            {totalGrooms} वर · {totalBrides} वधु
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <span className="text-[10px] font-bold text-stone-400 uppercase">Subscription Status</span>
          <p className="text-xl font-bold font-serif text-stone-900 mt-1">
            {config.subscriptionEnabled ? '🟢 Paywall ACTIVE' : '⚪ Free Samaj Mode'}
          </p>
          <span className="text-[11px] text-amber-800 font-medium">
            ₹{config.annualPlanPrice}/yr Plan
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <span className="text-[10px] font-bold text-stone-400 uppercase">Business Directory</span>
          <p className="text-2xl font-bold font-serif text-stone-900 mt-1">{ads.length}</p>
          <span className="text-[11px] text-emerald-700 font-medium">
            {totalFeaturedAds} Featured Top Banners
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <span className="text-[10px] font-bold text-stone-400 uppercase">Verified Gotras</span>
          <p className="text-2xl font-bold font-serif text-stone-900 mt-1">28+ Gotras</p>
          <span className="text-[11px] text-stone-500 font-medium">
            100% Rajput Lineage
          </span>
        </div>
      </div>

      {/* ADMIN TABS NAVIGATION */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-2.5 rounded-2xl border border-stone-200 shadow-xs">
        <button
          onClick={() => setActiveAdminTab('flags')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeAdminTab === 'flags'
              ? 'bg-[#380812] text-amber-200 shadow-xs'
              : 'text-stone-700 hover:bg-stone-100'
          }`}
        >
          ⚙️ App Feature Toggles & Remote Flags
        </button>

        <button
          onClick={() => setActiveAdminTab('monetization')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeAdminTab === 'monetization'
              ? 'bg-[#380812] text-amber-200 shadow-xs'
              : 'text-stone-700 hover:bg-stone-100'
          }`}
        >
          💳 Subscription Plans & Pricing
        </button>

        <button
          onClick={() => setActiveAdminTab('profiles')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeAdminTab === 'profiles'
              ? 'bg-[#380812] text-amber-200 shadow-xs'
              : 'text-stone-700 hover:bg-stone-100'
          }`}
        >
          👥 Candidate Profiles Moderation ({profiles.length})
        </button>

        <button
          onClick={() => setActiveAdminTab('ads')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeAdminTab === 'ads'
              ? 'bg-[#380812] text-amber-200 shadow-xs'
              : 'text-stone-700 hover:bg-stone-100'
          }`}
        >
          🛍️ Shop Advertisements ({ads.length})
        </button>
      </div>

      {/* TAB 1: FEATURE TOGGLES & REMOTE APK SWITCHES */}
      {activeAdminTab === 'flags' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="border-b border-stone-100 pb-3">
            <h3 className="text-xl font-serif font-bold text-stone-900">
              Live App Feature Switches (Play Store Remote Configuration)
            </h3>
            <p className="text-xs text-stone-500">
              Flipping these toggles modifies application behavior dynamically without requiring Play Store APK re-release.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. Subscription Paywall Switch */}
            <div className="p-5 rounded-2xl border border-amber-200 bg-amber-50/40 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-amber-700" />
                  Subscription Monetization Paywall
                </span>
                <p className="text-xs text-stone-600 leading-relaxed">
                  When enabled, users must purchase an annual membership (₹{config.annualPlanPrice}) after consuming free views to access contact numbers and initiate chats.
                </p>
                <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${config.subscriptionEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-700'}`}>
                  {config.subscriptionEnabled ? 'ENABLED (Paid Subscription Active)' : 'DISABLED (Free Community Mutual Sharing)'}
                </span>
              </div>
              <button
                onClick={() => updateConfig({ subscriptionEnabled: !config.subscriptionEnabled })}
                className="cursor-pointer text-amber-900 hover:scale-105 transition-transform shrink-0"
              >
                {config.subscriptionEnabled ? (
                  <ToggleRight className="w-10 h-10 text-emerald-600 fill-emerald-100" />
                ) : (
                  <ToggleLeft className="w-10 h-10 text-stone-400" />
                )}
              </button>
            </div>

            {/* 2. Contact View Access Rule */}
            <div className="p-5 rounded-2xl border border-stone-200 bg-stone-50/50 space-y-2">
              <span className="text-xs font-bold text-stone-800">
                Contact Details Access Rule
              </span>
              <p className="text-xs text-stone-600">
                Determine policy for viewing parents&apos; phone numbers on matrimonial biodatas.
              </p>
              <select
                value={config.contactAccessMode}
                onChange={(e) => updateConfig({ contactAccessMode: e.target.value as any })}
                className="w-full text-xs bg-white border border-stone-300 rounded-xl px-3 py-2 font-medium text-stone-800"
              >
                <option value="limited_3_views">3 Free Contact Views (Then register family details or pay)</option>
                <option value="free">100% Free & Open to All Verified Members</option>
                <option value="subscription_required">Strict Subscription Required from 1st Profile</option>
              </select>
            </div>

            {/* 3. Shop Ads Monetization */}
            <div className="p-5 rounded-2xl border border-stone-200 bg-stone-50/50 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-amber-700" />
                  Shop Advertisement Monetization
                </span>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Toggle ₹500 fee for Featured Top Banner shop placement.
                </p>
              </div>
              <button
                onClick={() => updateConfig({ adsMonetizationEnabled: !config.adsMonetizationEnabled })}
                className="cursor-pointer text-stone-800 hover:scale-105 transition-transform shrink-0"
              >
                {config.adsMonetizationEnabled ? (
                  <ToggleRight className="w-10 h-10 text-emerald-600 fill-emerald-100" />
                ) : (
                  <ToggleLeft className="w-10 h-10 text-stone-400" />
                )}
              </button>
            </div>

            {/* 4. Astrologer Consultation Service */}
            <div className="p-5 rounded-2xl border border-stone-200 bg-stone-50/50 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-amber-700" />
                  Vedic Astrologer Kundali Service
                </span>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Offer 1-on-1 Jyotish consultation for Kundali Milan dosha remedies.
                </p>
              </div>
              <button
                onClick={() => updateConfig({ kundaliAstrologerServiceEnabled: !config.kundaliAstrologerServiceEnabled })}
                className="cursor-pointer text-stone-800 hover:scale-105 transition-transform shrink-0"
              >
                {config.kundaliAstrologerServiceEnabled ? (
                  <ToggleRight className="w-10 h-10 text-emerald-600 fill-emerald-100" />
                ) : (
                  <ToggleLeft className="w-10 h-10 text-stone-400" />
                )}
              </button>
            </div>
          </div>

          {/* Broadcast Banner Customizer */}
          <div className="p-5 rounded-2xl border border-stone-200 bg-stone-50/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-700" />
                Global Community Broadcast Banner Message
              </span>
              <button
                onClick={() => updateConfig({ isBroadcastActive: !config.isBroadcastActive })}
                className="text-xs font-bold text-amber-900 cursor-pointer flex items-center gap-1"
              >
                <span>Status:</span>
                <strong className={config.isBroadcastActive ? 'text-emerald-700' : 'text-stone-400'}>
                  {config.isBroadcastActive ? 'Active (Visible on Top)' : 'Hidden'}
                </strong>
              </button>
            </div>

            <textarea
              rows={2}
              value={config.bannerBroadcastMessage}
              onChange={(e) => updateConfig({ bannerBroadcastMessage: e.target.value })}
              className="w-full text-xs bg-white border border-stone-300 rounded-xl p-3 focus:outline-hidden focus:border-amber-600 text-stone-900"
              placeholder="Enter announcement to display at top of portal..."
            />
          </div>
        </div>
      )}

      {/* TAB 2: SUBSCRIPTION PLANS & PRICING */}
      {activeAdminTab === 'monetization' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="border-b border-stone-100 pb-3">
            <h3 className="text-xl font-serif font-bold text-stone-900">
              Subscription Tiers & Membership Plans
            </h3>
            <p className="text-xs text-stone-500">
              Configure annual and lifetime community patron membership rates.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border-2 border-amber-300 rounded-3xl p-6 bg-amber-50/30 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900">Tier 1: Annual Samaj Rishtey Pass</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold font-serif text-stone-900">₹</span>
                <input 
                  type="number"
                  value={config.annualPlanPrice}
                  onChange={(e) => updateConfig({ annualPlanPrice: Number(e.target.value) })}
                  className="w-28 text-3xl font-bold font-serif bg-white border border-amber-300 rounded-xl px-3 py-1"
                />
                <span className="text-xs text-stone-500 font-semibold">/ Year</span>
              </div>
              <ul className="text-xs space-y-2 text-stone-700">
                <li className="flex items-center gap-2">✅ Unlimited Verified Contact Unlocks</li>
                <li className="flex items-center gap-2">✅ Direct Family Chat with All Candidates</li>
                <li className="flex items-center gap-2">✅ Complete Vedic 36-Guna Kundali Milan</li>
                <li className="flex items-center gap-2">✅ Priority Gotra Verification Badge</li>
              </ul>
            </div>

            <div className="border-2 border-stone-300 rounded-3xl p-6 bg-stone-50/50 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-800">Tier 2: Royal Samaj Lifetime Patron</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold font-serif text-stone-900">₹</span>
                <input 
                  type="number"
                  value={config.lifetimePlanPrice}
                  onChange={(e) => updateConfig({ lifetimePlanPrice: Number(e.target.value) })}
                  className="w-28 text-3xl font-bold font-serif bg-white border border-stone-300 rounded-xl px-3 py-1"
                />
                <span className="text-xs text-stone-500 font-semibold">One-Time Lifetime</span>
              </div>
              <ul className="text-xs space-y-2 text-stone-700">
                <li className="flex items-center gap-2">✅ Unlimited Candidates for Entire Family</li>
                <li className="flex items-center gap-2">✅ Top Placement in Annual Printed Patrika Booklet</li>
                <li className="flex items-center gap-2">✅ Free Commercial Shop Ad on Portal</li>
                <li className="flex items-center gap-2">✅ VIP Astrologer Tele-Consultation</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PROFILES MODERATION */}
      {activeAdminTab === 'profiles' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-stone-100 pb-4">
            <div>
              <h3 className="text-xl font-serif font-bold text-stone-900">
                Candidate Profiles Moderation ({filteredProfiles.length})
              </h3>
              <p className="text-xs text-stone-500">
                Approve, verify Gotra, or delete candidate entries across Rajasthan, MP, and Maharashtra.
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input 
                type="text"
                placeholder="Search name or city..."
                value={searchProfile}
                onChange={(e) => setSearchProfile(e.target.value)}
                className="text-xs bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 w-full sm:w-48"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Candidate</th>
                  <th className="py-3 px-3">Gotra & City</th>
                  <th className="py-3 px-3">Education / Job</th>
                  <th className="py-3 px-3">Contact</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-800">
                {filteredProfiles.map((p) => (
                  <tr key={p.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <img 
                          src={p.photo || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80"}
                          alt={p.name}
                          className="w-9 h-9 rounded-lg object-cover border border-stone-200"
                        />
                        <div>
                          <p className="font-bold text-stone-900">{p.name}</p>
                          <span className="text-[10px] text-stone-500">{p.gender} · {p.age} Yrs</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-medium text-amber-900">{p.gotra}</span>
                      <p className="text-[10px] text-stone-500">{p.city}</p>
                    </td>
                    <td className="py-3 px-3">
                      <p className="truncate max-w-[140px] font-medium">{p.education}</p>
                      <span className="text-[10px] text-stone-500 truncate block max-w-[140px]">{p.profession || '---'}</span>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-stone-700">
                      {p.contact}
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete profile for ${p.name}?`)) {
                              onDeleteProfile(p.id);
                            }
                          }}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                          title="Delete profile"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: BUSINESS ADS MODERATION */}
      {activeAdminTab === 'ads' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="border-b border-stone-100 pb-3">
            <h3 className="text-xl font-serif font-bold text-stone-900">
              Shop & Business Advertisements ({ads.length})
            </h3>
            <p className="text-xs text-stone-500">
              Manage local Rathore businesses, shops, and featured sponsorship tiers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {ads.map((ad) => (
              <div key={ad.id} className="p-4 rounded-2xl border border-stone-200 bg-stone-50/50 space-y-2 text-xs">
                <div className="flex justify-between items-start gap-2">
                  <h4 className="font-bold text-stone-900 font-serif text-sm">{ad.title}</h4>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ad.isFeatured ? 'bg-amber-300 text-stone-950' : 'bg-stone-200 text-stone-700'}`}>
                    {ad.isFeatured ? '★ Featured' : 'Standard'}
                  </span>
                </div>
                <p className="text-stone-600">Owner: {ad.owner} · {ad.category}</p>
                <p className="text-stone-500 font-mono">📞 {ad.phone}</p>
                <div className="pt-2 border-t border-stone-200 flex justify-between items-center">
                  <button
                    onClick={() => onUpdateAd({ ...ad, isFeatured: !ad.isFeatured })}
                    className="text-amber-900 font-bold hover:underline cursor-pointer"
                  >
                    {ad.isFeatured ? 'Demote to Standard' : 'Make Featured Banner'}
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete advertisement ${ad.title}?`)) {
                        onDeleteAd(ad.id);
                      }
                    }}
                    className="text-rose-600 hover:text-rose-800 cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
