import React, { useState } from 'react';
import { 
  ShieldCheck, Lock, Key, DollarSign, ToggleLeft, ToggleRight, 
  Store, AlertTriangle, CheckCircle2, Trash2, LogOut, Bell, Compass
} from 'lucide-react';
import { MatrimonyProfile, BusinessAd, TabType, AdminRuntimeConfig } from '../types';
import { useLanguage } from '../context/LanguageContext';

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
  bannerBroadcastMessage: 'Jai Mataji Ki! Welcome to Rathore Rishtey Portal. All community matrimonial biodatas are verified.',
  isBroadcastActive: true,
  requireAdminVerification: false,
  kundaliAstrologerServiceEnabled: true,
  allowGuestDownloads: true
};

export const AdminDashboardTab: React.FC<AdminDashboardTabProps> = ({
  profiles,
  ads,
  onDeleteProfile,
  onUpdateAd,
  onDeleteAd,
  onNavigateTab
}) => {
  const { t } = useLanguage();

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
      setAuthError(
        t(
          'Invalid Admin credentials. Please check your username and password.',
          'अमान्य एडमिन क्रेडेंशियल। कृपया अपना यूज़रनेम और पासवर्ड जाँचें।'
        )
      );
    }
  };

  const handleLogout = () => {
    setIsAdminLoggedIn(false);
    sessionStorage.removeItem('samaj_admin_session');
    setUsername('');
    setPassword('');
    onNavigateTab('signup');
  };

  // Filtered Profiles for Admin Moderation
  const filteredProfiles = profiles.filter(p => {
    const matchSearch = !searchProfile || p.name.toLowerCase().includes(searchProfile.toLowerCase()) || p.city.toLowerCase().includes(searchProfile.toLowerCase());
    return matchSearch;
  });

  // Calculate stats
  const totalGrooms = profiles.filter(p => p.gender === 'Male').length;
  const totalBrides = profiles.filter(p => p.gender === 'Female').length;
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
              {t('Rathore Rishtey Admin', 'राठौर रिश्ते एडमिन')}
            </h2>
            <p className="text-xs text-stone-500">
              {t(
                'Restricted portal for central Samaj administration, feature flags & live APK monetization controls.',
                'केंद्रीय समाज प्रबंधन, लाइव फीचर फ्लैग्स और APK सब्सक्रिप्शन नियंत्रण हेतु सुरक्षित एडमिन पोर्टल।'
              )}
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
                {t('Admin Username', 'एडमिन यूज़रनेम')}
              </label>
              <input 
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t('Enter username', 'यूज़रनेम दर्ज करें')}
                required
                className="w-full text-xs bg-stone-50 border border-stone-300 rounded-xl px-4 py-3 focus:outline-hidden focus:border-amber-600 focus:bg-white text-stone-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                {t('Admin Password', 'एडमिन पासवर्ड')}
              </label>
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('Enter password', 'पासवर्ड दर्ज करें')}
                required
                className="w-full text-xs bg-stone-50 border border-stone-300 rounded-xl px-4 py-3 focus:outline-hidden focus:border-amber-600 focus:bg-white text-stone-900"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#380812] via-[#540e1b] to-[#380812] hover:from-[#24050b] hover:to-[#380812] text-amber-200 font-bold py-3.5 rounded-xl shadow-md text-xs tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2 border border-amber-500/30"
            >
              <Key className="w-4 h-4 text-amber-300" />
              <span>{t('Authenticate & Enter Admin Console', 'सत्यापित करें और एडमिन कंसोल खोलें')}</span>
            </button>
          </form>

          <div className="pt-4 border-t border-stone-100 text-center">
            <button
              onClick={() => onNavigateTab('matrimony')}
              className="text-xs text-stone-500 hover:text-stone-800 font-semibold cursor-pointer"
            >
              {t('← Return to Community Portal', '← मुख्य समाज पोर्टल पर लौटें')}
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
            <span>{t('Master SuperAdmin Portal • Logged in as AdminAbhi', 'मास्टर सुपरएडमिन पोर्टल • AdminAbhi के रूप में लॉग इन')}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-amber-50">
            {t('Samaj Command & Feature Flags Console', 'समाज कमांड एवं फीचर फ्लैग कंसोल')}
          </h2>
          <p className="text-xs sm:text-sm text-stone-300 font-light mt-1">
            {t(
              'Toggle features, subscriptions & paywalls remotely without resubmitting APK to Google Play Store.',
              'Google Play Store पर बार-बार नया APK अपडेट किए बिना दूरस्थ रूप से सब्सक्रिप्शन, पेवॉल और ऐप फीचर्स नियंत्रित करें।'
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateTab('matrimony')}
            className="bg-white/10 hover:bg-white/20 text-stone-200 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
          >
            {t('Preview App', 'ऐप देखें')}
          </button>
          <button
            onClick={handleLogout}
            className="bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-500/40 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" /> {t('Logout', 'लॉग आउट')}
          </button>
        </div>
      </div>

      {saveToast && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-3.5 text-xs text-emerald-900 font-semibold flex items-center gap-2 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{t('Feature flag settings updated live! All client apps & APKs will adapt immediately.', 'फीचर फ्लैग सेटिंग्स लाइव अपडेट हो गईं! सभी ऐप तुरंत नए नियम लागू करेंगे।')}</span>
        </div>
      )}

      {/* METRICS ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <span className="text-[10px] font-bold text-stone-400 uppercase">{t('Total Candidates', 'कुल प्रत्याशी')}</span>
          <p className="text-2xl font-bold font-serif text-stone-900 mt-1">{profiles.length}</p>
          <span className="text-[11px] text-stone-500 font-medium">
            {totalGrooms} {t('Grooms', 'वर')} · {totalBrides} {t('Brides', 'वधू')}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <span className="text-[10px] font-bold text-stone-400 uppercase">{t('Subscription Status', 'सब्सक्रिप्शन स्थिति')}</span>
          <p className="text-xl font-bold font-serif text-stone-900 mt-1">
            {config.subscriptionEnabled ? t('🟢 Paywall ACTIVE', '🟢 पेड प्लान सक्रिय') : t('⚪ Free Samaj Mode', '⚪ निःशुल्क समाज मोड')}
          </p>
          <span className="text-[11px] text-amber-800 font-medium">
            ₹{config.annualPlanPrice}/{t('yr Plan', 'वर्ष प्लान')}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <span className="text-[10px] font-bold text-stone-400 uppercase">{t('Business Directory', 'व्यापार निर्देशिका')}</span>
          <p className="text-2xl font-bold font-serif text-stone-900 mt-1">{ads.length}</p>
          <span className="text-[11px] text-emerald-700 font-medium">
            {totalFeaturedAds} {t('Featured Top Banners', 'फीचर्ड प्रमुख बैनर')}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <span className="text-[10px] font-bold text-stone-400 uppercase">{t('Verified Gotras', 'सत्यापित गोत्र')}</span>
          <p className="text-2xl font-bold font-serif text-stone-900 mt-1">28+ {t('Gotras', 'गोत्र')}</p>
          <span className="text-[11px] text-stone-500 font-medium">
            {t('100% Rajput Lineage', '100% प्रमाणित वंशावली')}
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
          ⚙️ {t('App Feature Toggles & Remote Flags', 'ऐप फीचर टॉगल एवं रिमोट फ्लैग')}
        </button>

        <button
          onClick={() => setActiveAdminTab('monetization')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeAdminTab === 'monetization'
              ? 'bg-[#380812] text-amber-200 shadow-xs'
              : 'text-stone-700 hover:bg-stone-100'
          }`}
        >
          💳 {t('Subscription Plans & Pricing', 'सब्सक्रिप्शन प्लान एवं शुल्क')}
        </button>

        <button
          onClick={() => setActiveAdminTab('profiles')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeAdminTab === 'profiles'
              ? 'bg-[#380812] text-amber-200 shadow-xs'
              : 'text-stone-700 hover:bg-stone-100'
          }`}
        >
          👥 {t('Candidate Profiles Moderation', 'प्रत्याशी बायोडाटा प्रबंधन')} ({profiles.length})
        </button>

        <button
          onClick={() => setActiveAdminTab('ads')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeAdminTab === 'ads'
              ? 'bg-[#380812] text-amber-200 shadow-xs'
              : 'text-stone-700 hover:bg-stone-100'
          }`}
        >
          🛍️ {t('Shop Advertisements', 'व्यापार विज्ञापन')} ({ads.length})
        </button>
      </div>

      {/* TAB 1: FEATURE TOGGLES & REMOTE APK SWITCHES */}
      {activeAdminTab === 'flags' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="border-b border-stone-100 pb-3">
            <h3 className="text-xl font-serif font-bold text-stone-900">
              {t('Live App Feature Switches (Play Store Remote Configuration)', 'लाइव ऐप फीचर स्विच (Play Store रिमोट कॉन्फ़िगरेशन)')}
            </h3>
            <p className="text-xs text-stone-500">
              {t(
                'Flipping these toggles modifies application behavior dynamically without requiring Play Store APK re-release.',
                'इन स्विच को बदलने से Play Store पर नया APK डाले बिना ऐप की सभी सुविधाएं तुरंत बदल जाएंगी।'
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. Subscription Paywall Switch */}
            <div className="p-5 rounded-2xl border border-amber-200 bg-amber-50/40 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-amber-700" />
                  {t('Subscription Monetization Paywall', 'सब्सक्रिप्शन पेड प्लान स्विच')}
                </span>
                <p className="text-xs text-stone-600 leading-relaxed">
                  {t(
                    `When enabled, users must purchase an annual membership (₹${config.annualPlanPrice}) after consuming free views to access contact numbers and initiate chats.`,
                    `चालू होने पर उपयोगकर्ताओं को संपर्क नंबर देखने और चैट शुरू करने के लिए वार्षिक सदस्यता (₹${config.annualPlanPrice}) लेनी होगी।`
                  )}
                </p>
                <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${config.subscriptionEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-700'}`}>
                  {config.subscriptionEnabled
                    ? t('ENABLED (Paid Subscription Active)', 'सक्रिय (पेड सब्सक्रिप्शन चालू)')
                    : t('DISABLED (Free Community Mutual Sharing)', 'निष्क्रिय (निःशुल्क समाज सेवा मोड)')}
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
                {t('Contact Details Access Rule', 'संपर्क नंबर देखने का नियम')}
              </span>
              <p className="text-xs text-stone-600">
                {t(
                  "Determine policy for viewing parents' phone numbers on matrimonial biodatas.",
                  'वैवाहिक बायोडाटा पर अभिभावकों के फ़ोन नंबर देखने की नीति निर्धारित करें।'
                )}
              </p>
              <select
                value={config.contactAccessMode}
                onChange={(e) => updateConfig({ contactAccessMode: e.target.value as AdminRuntimeConfig['contactAccessMode'] })}
                className="w-full text-xs bg-white border border-stone-300 rounded-xl px-3 py-2 font-medium text-stone-800"
              >
                <option value="limited_3_views">{t('3 Free Contact Views (Then register family details or pay)', '3 निःशुल्क संपर्क दृश्य (फिर परिवार विवरण या प्लान)')}</option>
                <option value="free">{t('100% Free & Open to All Verified Members', 'सभी सत्यापित सदस्यों के लिए 100% निःशुल्क')}</option>
                <option value="subscription_required">{t('Strict Subscription Required from 1st Profile', 'पहले ही बायोडाटा से सब्सक्रिप्शन अनिवार्य')}</option>
              </select>
            </div>

            {/* 3. Shop Ads Monetization */}
            <div className="p-5 rounded-2xl border border-stone-200 bg-stone-50/50 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-amber-700" />
                  {t('Shop Advertisement Monetization', 'दुकान विज्ञापन पेड शुल्क')}
                </span>
                <p className="text-xs text-stone-600 leading-relaxed">
                  {t('Toggle ₹500 fee for Featured Top Banner shop placement.', 'प्रमुख फीचर्ड बैनर विज्ञापन हेतु ₹500 शुल्क चालू/बंद करें।')}
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
                  {t('Vedic Astrologer Kundali Service', 'वैदिक ज्योतिषी कुंडली सेवा')}
                </span>
                <p className="text-xs text-stone-600 leading-relaxed">
                  {t('Offer 1-on-1 Jyotish consultation for Kundali Milan dosha remedies.', 'कुंडली मिलान दोष निवारण हेतु 1-ऑन-1 ज्योतिष परामर्श सेवा दिखाएं।')}
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
                {t('Global Community Broadcast Banner Message', 'वैश्विक समाज घोषणा बैनर संदेश')}
              </span>
              <button
                onClick={() => updateConfig({ isBroadcastActive: !config.isBroadcastActive })}
                className="text-xs font-bold text-amber-900 cursor-pointer flex items-center gap-1"
              >
                <span>{t('Status:', 'स्थिति:')}</span>
                <strong className={config.isBroadcastActive ? 'text-emerald-700' : 'text-stone-400'}>
                  {config.isBroadcastActive ? t('Active (Visible on Top)', 'सक्रिय (ऊपर दिखाई दे रहा है)') : t('Hidden', 'छिपा हुआ')}
                </strong>
              </button>
            </div>

            <textarea
              rows={2}
              value={config.bannerBroadcastMessage}
              onChange={(e) => updateConfig({ bannerBroadcastMessage: e.target.value })}
              className="w-full text-xs bg-white border border-stone-300 rounded-xl p-3 focus:outline-hidden focus:border-amber-600 text-stone-900"
              placeholder={t('Enter announcement to display at top of portal...', 'पोर्टल के शीर्ष पर दिखाने हेतु घोषणा लिखें...')}
            />
          </div>
        </div>
      )}

      {/* TAB 2: SUBSCRIPTION PLANS & PRICING */}
      {activeAdminTab === 'monetization' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="border-b border-stone-100 pb-3">
            <h3 className="text-xl font-serif font-bold text-stone-900">
              {t('Subscription Tiers & Membership Plans', 'सदस्यता स्तर एवं शुल्क योजनाएँ')}
            </h3>
            <p className="text-xs text-stone-500">
              {t('Configure annual and lifetime community patron membership rates.', 'वार्षिक एवं आजीवन समाज संरक्षक सदस्यता शुल्क निर्धारित करें।')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border-2 border-amber-300 rounded-3xl p-6 bg-amber-50/30 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                {t('Tier 1: Annual Samaj Rishtey Pass', 'श्रेणी 1: वार्षिक समाज रिश्ते पास')}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold font-serif text-stone-900">₹</span>
                <input 
                  type="number"
                  value={config.annualPlanPrice}
                  onChange={(e) => updateConfig({ annualPlanPrice: Number(e.target.value) })}
                  className="w-28 text-3xl font-bold font-serif bg-white border border-amber-300 rounded-xl px-3 py-1"
                />
                <span className="text-xs text-stone-500 font-semibold">/ {t('Year', 'वर्ष')}</span>
              </div>
              <ul className="text-xs space-y-2 text-stone-700">
                <li className="flex items-center gap-2">✅ {t('Unlimited Verified Contact Unlocks', 'असीमित सत्यापित संपर्क अनलॉक')}</li>
                <li className="flex items-center gap-2">✅ {t('Direct Family Chat with All Candidates', 'सभी परिवारों के साथ प्रत्यक्ष चैट')}</li>
                <li className="flex items-center gap-2">✅ {t('Complete Vedic 36-Guna Kundali Milan', 'संपूर्ण वैदिक 36-गुण कुंडली मिलान')}</li>
                <li className="flex items-center gap-2">✅ {t('Priority Gotra Verification Badge', 'प्राथमिकता गोत्र सत्यापन बैज')}</li>
              </ul>
            </div>

            <div className="border-2 border-stone-300 rounded-3xl p-6 bg-stone-50/50 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-800">
                {t('Tier 2: Royal Samaj Lifetime Patron', 'श्रेणी 2: रॉयल समाज आजीवन संरक्षक')}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold font-serif text-stone-900">₹</span>
                <input 
                  type="number"
                  value={config.lifetimePlanPrice}
                  onChange={(e) => updateConfig({ lifetimePlanPrice: Number(e.target.value) })}
                  className="w-28 text-3xl font-bold font-serif bg-white border border-stone-300 rounded-xl px-3 py-1"
                />
                <span className="text-xs text-stone-500 font-semibold">{t('One-Time Lifetime', 'एकमुश्त आजीवन')}</span>
              </div>
              <ul className="text-xs space-y-2 text-stone-700">
                <li className="flex items-center gap-2">✅ {t('Unlimited Candidates for Entire Family', 'पूरे परिवार के लिए असीमित बायोडाटा')}</li>
                <li className="flex items-center gap-2">✅ {t('Top Placement in Annual Printed Patrika Booklet', 'वार्षिक मुद्रित पत्रिका में प्रमुख स्थान')}</li>
                <li className="flex items-center gap-2">✅ {t('Free Commercial Shop Ad on Portal', 'पोर्टल पर निःशुल्क व्यापार विज्ञापन')}</li>
                <li className="flex items-center gap-2">✅ {t('VIP Astrologer Tele-Consultation', 'VIP ज्योतिषी फोन परामर्श')}</li>
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
                {t('Candidate Profiles Moderation', 'प्रत्याशी बायोडाटा प्रबंधन')} ({filteredProfiles.length})
              </h3>
              <p className="text-xs text-stone-500">
                {t('Approve, verify Gotra, or delete candidate entries across Rajasthan, MP, and Maharashtra.', 'राजस्थान, मध्य प्रदेश और महाराष्ट्र के बायोडाटा सत्यापित या प्रबंधित करें।')}
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input 
                type="text"
                placeholder={t('Search name or city...', 'नाम या शहर खोजें...')}
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
                  <th className="py-3 px-3">{t('Candidate', 'प्रत्याशी')}</th>
                  <th className="py-3 px-3">{t('Gotra & City', 'गोत्र व शहर')}</th>
                  <th className="py-3 px-3">{t('Education / Job', 'शिक्षा / व्यवसाय')}</th>
                  <th className="py-3 px-3">{t('Contact', 'संपर्क')}</th>
                  <th className="py-3 px-3">{t('Status', 'स्थिति')}</th>
                  <th className="py-3 px-3 text-right">{t('Actions', 'कार्रवाई')}</th>
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
                          <span className="text-[10px] text-stone-500">{p.gender === 'Male' ? t('Male', 'वर') : t('Female', 'वधू')} · {p.age} {t('Yrs', 'वर्ष')}</span>
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
                        <ShieldCheck className="w-3 h-3 text-emerald-600" /> {t('Verified', 'सत्यापित')}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            if (window.confirm(t(`Delete profile for ${p.name}?`, `क्या आप ${p.name} का बायोडाटा हटाना चाहते हैं?`))) {
                              onDeleteProfile(p.id);
                            }
                          }}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                          title={t('Delete profile', 'प्रोफ़ाइल हटाएं')}
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
              {t('Shop & Business Advertisements', 'दुकान एवं व्यापार विज्ञापन')} ({ads.length})
            </h3>
            <p className="text-xs text-stone-500">
              {t('Manage local Rathore businesses, shops, and featured sponsorship tiers.', 'राठौर समाज के स्थानीय व्यापार, दुकानों और प्रमुख विज्ञापनों का प्रबंधन करें।')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {ads.map((ad) => (
              <div key={ad.id} className="p-4 rounded-2xl border border-stone-200 bg-stone-50/50 space-y-2 text-xs">
                <div className="flex justify-between items-start gap-2">
                  <h4 className="font-bold text-stone-900 font-serif text-sm">{ad.title}</h4>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ad.isFeatured ? 'bg-amber-300 text-stone-950' : 'bg-stone-200 text-stone-700'}`}>
                    {ad.isFeatured ? t('★ Featured', '★ प्रमुख') : t('Standard', 'सामान्य')}
                  </span>
                </div>
                <p className="text-stone-600">{t('Owner:', 'संचालक:')} {ad.owner} · {ad.category}</p>
                <p className="text-stone-500 font-mono">📞 {ad.phone}</p>
                <div className="pt-2 border-t border-stone-200 flex justify-between items-center">
                  <button
                    onClick={() => onUpdateAd({ ...ad, isFeatured: !ad.isFeatured })}
                    className="text-amber-900 font-bold hover:underline cursor-pointer"
                  >
                    {ad.isFeatured ? t('Demote to Standard', 'सामान्य श्रेणी में करें') : t('Make Featured Banner', 'प्रमुख बैनर बनाएं')}
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(t(`Delete advertisement ${ad.title}?`, `क्या आप विज्ञापन ${ad.title} हटाना चाहते हैं?`))) {
                        onDeleteAd(ad.id);
                      }
                    }}
                    className="text-rose-600 hover:text-rose-800 cursor-pointer"
                  >
                    {t('Delete', 'हटाएं')}
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

