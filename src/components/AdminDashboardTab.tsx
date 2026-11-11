import React, { useState } from 'react';
import {
  ShieldCheck, Lock, Key, DollarSign, ToggleLeft, ToggleRight,
  Store, AlertTriangle, CheckCircle2, Trash2, LogOut, Bell, Compass,
  HeartHandshake, MessageCircle, Heart, ClipboardList, BookOpen, Calendar,
  FileText, UserPlus, Share2, Star, Crown, RotateCcw, Check, Sparkles
} from 'lucide-react';
import { MatrimonyProfile, BusinessAd, TabType, AdminRuntimeConfig } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useAdminConfig, DEFAULT_ADMIN_CONFIG } from '../context/AdminConfigContext';

export { DEFAULT_ADMIN_CONFIG };

interface AdminDashboardTabProps {
  profiles: MatrimonyProfile[];
  ads: BusinessAd[];
  onUpdateProfile: (profile: MatrimonyProfile) => void;
  onDeleteProfile: (id: number | string) => void;
  onUpdateAd: (ad: BusinessAd) => void;
  onDeleteAd: (id: number | string) => void;
  onNavigateTab: (tab: TabType) => void;
}

interface FeatureToggleDefinition {
  key: keyof AdminRuntimeConfig;
  group: 'monetization' | 'matrimony' | 'utilities' | 'community';
  icon: React.ReactNode;
  titleEn: string;
  titleHi: string;
  descEn: string;
  descHi: string;
  highlight?: boolean;
}

export const AdminDashboardTab: React.FC<AdminDashboardTabProps> = ({
  profiles,
  ads,
  onUpdateProfile,
  onDeleteProfile,
  onUpdateAd,
  onDeleteAd,
  onNavigateTab
}) => {
  const { t } = useLanguage();
  const { config, updateConfig, resetConfig } = useAdminConfig();

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

  const [activeAdminTab, setActiveAdminTab] = useState<'flags' | 'monetization' | 'profiles' | 'ads'>('flags');
  const [saveToast, setSaveToast] = useState(false);
  const [searchProfile, setSearchProfile] = useState('');
  const [confirmDeleteProfileId, setConfirmDeleteProfileId] = useState<number | string | null>(null);
  const [confirmDeleteAdId, setConfirmDeleteAdId] = useState<number | string | null>(null);

  const handleConfigUpdate = (partial: Partial<AdminRuntimeConfig>) => {
    updateConfig(partial);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  const handleToggleFeature = (key: keyof AdminRuntimeConfig) => {
    const current = Boolean(config[key]);
    handleConfigUpdate({ [key]: !current } as Partial<AdminRuntimeConfig>);
  };

  const handleEnableAllFeatures = () => {
    handleConfigUpdate({
      featureMatrimonyEnabled: true,
      featureChatEnabled: true,
      featureLikesEnabled: true,
      featureKundaliEnabled: true,
      kundaliAstrologerServiceEnabled: true,
      featureGuestListEnabled: true,
      featureBusinessDirectoryEnabled: true,
      featureBookletEnabled: true,
      allowGuestDownloads: true,
      featureEventsEnabled: true,
      allowUserEventPosting: true,
      featureProfileCreationEnabled: true,
      featureWhatsAppShareEnabled: true,
      featuredAdsEnabled: true,
      isBroadcastActive: true
    });
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
  const filteredProfiles = profiles.filter((p) => {
    const matchSearch =
      !searchProfile ||
      p.name.toLowerCase().includes(searchProfile.toLowerCase()) ||
      p.city.toLowerCase().includes(searchProfile.toLowerCase());
    return matchSearch;
  });

  // Calculate stats
  const totalGrooms = profiles.filter((p) => p.gender === 'Male').length;
  const totalBrides = profiles.filter((p) => p.gender === 'Female').length;
  const totalFeaturedAds = ads.filter((a) => a.isFeatured).length;

  const billingSuffixEn =
    config.adBillingCycle === 'monthly'
      ? '/ Month'
      : config.adBillingCycle === 'quarterly'
        ? '/ Quarter'
        : '/ Year';
  const billingSuffixHi =
    config.adBillingCycle === 'monthly'
      ? '/ माह'
      : config.adBillingCycle === 'quarterly'
        ? '/ तिमाही'
        : '/ वर्ष';

  const featureToggleDefs: FeatureToggleDefinition[] = [
    // Monetization & Access
    {
      key: 'subscriptionEnabled',
      group: 'monetization',
      icon: <DollarSign className="w-4 h-4 text-amber-700" />,
      titleEn: 'User Subscription Paywall',
      titleHi: 'यूज़र सब्सक्रिप्शन पेड प्लान',
      descEn: `Turn subscription ON/OFF for all users. Currently Annual ₹${config.annualPlanPrice} / Lifetime ₹${config.lifetimePlanPrice}.`,
      descHi: `सभी उपयोगकर्ताओं के लिए सब्सक्रिप्शन चालू/बंद करें। वर्तमान शुल्क वार्षिक ₹${config.annualPlanPrice} / आजीवन ₹${config.lifetimePlanPrice}।`,
      highlight: true
    },
    {
      key: 'adsMonetizationEnabled',
      group: 'monetization',
      icon: <Store className="w-4 h-4 text-amber-700" />,
      titleEn: 'Shop Advertisement Pricing (Paid Ads)',
      titleHi: 'दुकान विज्ञापन पेड शुल्क (प्राइसिंग)',
      descEn: `Charge ₹${config.featuredAdPrice}${billingSuffixEn} for Featured Shop Ads instead of free posting.`,
      descHi: `निःशुल्क के बजाय फीचर्ड दुकान विज्ञापन पर ₹${config.featuredAdPrice}${billingSuffixHi} शुल्क लागू करें।`,
      highlight: true
    },
    {
      key: 'featuredAdsEnabled',
      group: 'monetization',
      icon: <Star className="w-4 h-4 text-amber-700" />,
      titleEn: 'Featured Top Banner Shop Slots',
      titleHi: 'फीचर्ड टॉप बैनर विज्ञापन विकल्प',
      descEn: 'Allow shop owners to choose Featured Banner & Spotlight tiers when advertising.',
      descHi: 'दुकान संचालकों को विज्ञापन देते समय फीचर्ड बैनर व स्पॉटलाइट श्रेणी चुनने की सुविधा दें।'
    },
    // Matrimonial Core
    {
      key: 'featureMatrimonyEnabled',
      group: 'matrimony',
      icon: <HeartHandshake className="w-4 h-4 text-rose-700" />,
      titleEn: 'Matrimony Biodatas Directory',
      titleHi: 'वैवाहिक बायोडाटा निर्देशिका',
      descEn: 'Show or pause candidate biodata search and browsing across the portal.',
      descHi: 'पोर्टल पर वर-वधु बायोडाटा खोज एवं ब्राउज़िंग सुविधा चालू या बंद करें।'
    },
    {
      key: 'featureChatEnabled',
      group: 'matrimony',
      icon: <MessageCircle className="w-4 h-4 text-amber-700" />,
      titleEn: 'Direct Family Chat',
      titleHi: 'परिवार प्रत्यक्ष चैट सुविधा',
      descEn: 'Enable or disable 1-on-1 chat messaging buttons on profiles and dashboard.',
      descHi: 'प्रोफ़ाइल कार्ड, बायोडाटा और डैशबोर्ड पर 1-ऑन-1 चैट सुविधा चालू/बंद करें।'
    },
    {
      key: 'featureLikesEnabled',
      group: 'matrimony',
      icon: <Heart className="w-4 h-4 text-rose-600" />,
      titleEn: 'Profile Likes & Admirers List',
      titleHi: 'प्रोफ़ाइल पसंद (लाइक) व एडमायरर्स',
      descEn: 'Enable heart likes, "Profiles I Liked", and "Who Liked Me" tabs for members.',
      descHi: 'सदस्यों के लिए लाइक बटन, "पसंद किए गए" और "किसने पसंद किया" टैब चालू/बंद करें।'
    },
    {
      key: 'featureProfileCreationEnabled',
      group: 'matrimony',
      icon: <UserPlus className="w-4 h-4 text-emerald-700" />,
      titleEn: 'Profile & Family Registration',
      titleHi: 'नया बायोडाटा व पारिवारिक पंजीकरण',
      descEn: 'Allow logged-in members to create new matrimonial profiles and family details.',
      descHi: 'लॉग इन सदस्यों को नया वैवाहिक बायोडाटा और पारिवारिक विवरण जोड़ने की अनुमति दें।'
    },
    {
      key: 'requireAdminVerification',
      group: 'matrimony',
      icon: <ShieldCheck className="w-4 h-4 text-emerald-700" />,
      titleEn: 'Require Admin Approval for New Profiles',
      titleHi: 'नए बायोडाटा हेतु एडमिन स्वीकृति अनिवार्य',
      descEn: 'Hold newly submitted biodatas in Pending state until approved in Profiles Moderation.',
      descHi: 'नए जोड़े गए बायोडाटा एडमिन द्वारा सत्यापित होने के बाद ही सार्वजनिक रूप से दिखाएं।'
    },
    // Utilities & Directory
    {
      key: 'featureKundaliEnabled',
      group: 'utilities',
      icon: <Compass className="w-4 h-4 text-amber-700" />,
      titleEn: 'Vedic 36-Guna Kundali Milan',
      titleHi: 'वैदिक ३६-गुण कुंडली मिलान',
      descEn: 'Turn the Kundali Milan Ashtakoot matching calculator tab and shortcuts ON/OFF.',
      descHi: 'वैदिक कुंडली मिलान टैब और प्रोफ़ाइल मिलान बटन चालू या बंद करें।'
    },
    {
      key: 'kundaliAstrologerServiceEnabled',
      group: 'utilities',
      icon: <Sparkles className="w-4 h-4 text-amber-700" />,
      titleEn: 'Vedic Astrologer Consultation Card',
      titleHi: 'वैदिक ज्योतिषी परामर्श सेवा',
      descEn: 'Show 1-on-1 Jyotish consultation & Dosha remedies section inside Kundali Milan.',
      descHi: 'कुंडली मिलान रिपोर्ट में दोष निवारण हेतु ज्योतिषी परामर्श अनुभाग दिखाएं।'
    },
    {
      key: 'featureGuestListEnabled',
      group: 'utilities',
      icon: <ClipboardList className="w-4 h-4 text-amber-700" />,
      titleEn: 'Wedding Guest List Planner',
      titleHi: 'विवाह अतिथि सूची प्लानर',
      descEn: 'Turn saved occasion guest lists, RSVP tracking, printing & export ON/OFF.',
      descHi: 'अतिथि सूची, निमंत्रण प्रबंधन, प्रिंट और एक्सपोर्ट सुविधा चालू या बंद करें।'
    },
    {
      key: 'featureBusinessDirectoryEnabled',
      group: 'utilities',
      icon: <Store className="w-4 h-4 text-amber-700" />,
      titleEn: 'Samaj Business & Shop Directory',
      titleHi: 'राठौड़ समाज व्यापार एवं दुकान निर्देशिका',
      descEn: 'Turn Business Ads directory browsing and Advertise Shop submissions ON/OFF.',
      descHi: 'व्यापार निर्देशिका और दुकान विज्ञापन पोस्टिंग सुविधा चालू या बंद करें।'
    },
    // Community & Sharing
    {
      key: 'featureBookletEnabled',
      group: 'community',
      icon: <BookOpen className="w-4 h-4 text-amber-700" />,
      titleEn: 'Annual Samaj E-Booklet (Patrika)',
      titleHi: 'वार्षिक समाज ई-पत्रिका',
      descEn: 'Show or hide the interactive digital Samaj Patrika booklet reader.',
      descHi: 'डिजिटल समाज ई-पत्रिका रीडर टैब दिखाएं या छिपाएं।'
    },
    {
      key: 'allowGuestDownloads',
      group: 'community',
      icon: <FileText className="w-4 h-4 text-amber-700" />,
      titleEn: 'E-Booklet Printable PDF Download',
      titleHi: 'ई-पत्रिका PDF डाउनलोड सुविधा',
      descEn: 'Enable or lock the Download Printable PDF button inside the E-Booklet page.',
      descHi: 'ई-पत्रिका पृष्ठ पर प्रिंट करने योग्य PDF डाउनलोड बटन चालू या लॉक करें।'
    },
    {
      key: 'featureEventsEnabled',
      group: 'community',
      icon: <Calendar className="w-4 h-4 text-amber-700" />,
      titleEn: 'Samaj Sammelans & Events',
      titleHi: 'समाज सम्मेलन एवं कार्यक्रम',
      descEn: 'Turn the Samaj Events & Community News tab ON/OFF across navigation.',
      descHi: 'समाज सम्मेलन एवं कार्यक्रम सूचना टैब चालू या बंद करें।'
    },
    {
      key: 'allowUserEventPosting',
      group: 'community',
      icon: <Bell className="w-4 h-4 text-amber-700" />,
      titleEn: 'Member Event Notice Posting',
      titleHi: 'सदस्यों द्वारा कार्यक्रम सूचना प्रकाशन',
      descEn: 'Allow community members to submit new sammelan notices (Admin can always post).',
      descHi: 'सामान्य सदस्यों को नए समाज कार्यक्रम की सूचना जोड़ने की अनुमति दें।'
    },
    {
      key: 'featureWhatsAppShareEnabled',
      group: 'community',
      icon: <Share2 className="w-4 h-4 text-emerald-700" />,
      titleEn: 'WhatsApp & Social Sharing',
      titleHi: 'व्हाट्सऐप एवं सोशल शेयरिंग',
      descEn: 'Toggle WhatsApp share buttons across biodatas, ads, guest list, and floating share.',
      descHi: 'बायोडाटा, विज्ञापन, अतिथि सूची और फ्लोटिंग व्हाट्सऐप शेयर बटन चालू/बंद करें।'
    },
    {
      key: 'isBroadcastActive',
      group: 'community',
      icon: <Bell className="w-4 h-4 text-amber-700" />,
      titleEn: 'Top Announcement Broadcast Banner',
      titleHi: 'शीर्ष समाज घोषणा बैनर',
      descEn: 'Display the live gold broadcast strip across the top of the app.',
      descHi: 'ऐप के शीर्ष पर लाइव घोषणा पट्टी दिखाएं या छिपाएं।'
    }
  ];

  const allSwitchKeys = featureToggleDefs.map((f) => f.key);
  const enabledFeatureCount = allSwitchKeys.filter((k) => Boolean(config[k])).length;

  const renderToggleCard = (item: FeatureToggleDefinition) => {
    const isOn = Boolean(config[item.key]);
    return (
      <div
        key={item.key}
        className={`p-4 sm:p-5 rounded-2xl border flex items-start justify-between gap-4 transition-colors ${
          item.highlight
            ? isOn
              ? 'border-amber-400 bg-amber-50/70'
              : 'border-amber-200 bg-amber-50/30'
            : isOn
              ? 'border-stone-200 bg-white'
              : 'border-stone-200 bg-stone-100/70'
        }`}
      >
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
              {item.icon}
              <span>{t(item.titleEn, item.titleHi)}</span>
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isOn ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'
              }`}
            >
              {isOn ? t('ON', 'चालू') : t('OFF', 'बंद')}
            </span>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">{t(item.descEn, item.descHi)}</p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={isOn}
          aria-label={t(item.titleEn, item.titleHi)}
          onClick={() => handleToggleFeature(item.key)}
          className="cursor-pointer hover:scale-105 transition-transform shrink-0 flex flex-col items-center gap-0.5"
        >
          {isOn ? (
            <ToggleRight className="w-10 h-10 text-emerald-600 fill-emerald-100" />
          ) : (
            <ToggleLeft className="w-10 h-10 text-stone-400" />
          )}
        </button>
      </div>
    );
  };

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
              'Toggle all features, user subscriptions & shop ad pricing live without resubmitting APK to Google Play Store.',
              'Google Play Store पर बार-बार नया APK अपडेट किए बिना सभी ऐप फीचर्स, सब्सक्रिप्शन और दुकान विज्ञापन शुल्क लाइव नियंत्रित करें।'
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
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{t('Settings updated live! All user tabs and pricing reflect these changes immediately.', 'सेटिंग्स लाइव अपडेट हो गईं! सभी यूज़र टैब और शुल्क तुरंत बदल गए हैं।')}</span>
        </div>
      )}

      {/* METRICS & QUICK SWITCHES ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Quick Subscription Status & Toggle */}
        <div className="bg-white p-4 rounded-2xl border border-amber-300/80 shadow-2xs flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold text-stone-400 uppercase">{t('User Subscription', 'यूज़र सब्सक्रिप्शन')}</span>
            <button
              type="button"
              role="switch"
              aria-checked={config.subscriptionEnabled}
              onClick={() => handleConfigUpdate({ subscriptionEnabled: !config.subscriptionEnabled })}
              className="cursor-pointer flex items-center gap-1 text-[10px] font-bold"
              title={t('Toggle Subscription On/Off for Users', 'यूज़र सब्सक्रिप्शन चालू/बंद करें')}
            >
              {config.subscriptionEnabled ? (
                <ToggleRight className="w-8 h-8 text-emerald-600 fill-emerald-100" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-stone-400" />
              )}
            </button>
          </div>
          <div>
            <p className="text-base font-bold font-serif text-stone-900">
              {config.subscriptionEnabled ? t('Active (Paid Plans ON)', 'सक्रिय (पेड प्लान चालू)') : t('OFF (Free Samaj Mode)', 'बंद (निःशुल्क समाज मोड)')}
            </p>
            <span className="text-[11px] text-amber-800 font-medium">
              ₹{config.annualPlanPrice}/{t('yr', 'वर्ष')} · ₹{config.lifetimePlanPrice} {t('Lifetime', 'आजीवन')}
            </span>
          </div>
        </div>

        {/* Quick Shop Ad Pricing & Toggle */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold text-stone-400 uppercase">{t('Shop Ad Pricing', 'दुकान विज्ञापन शुल्क')}</span>
            <button
              type="button"
              role="switch"
              aria-checked={config.adsMonetizationEnabled}
              onClick={() => handleConfigUpdate({ adsMonetizationEnabled: !config.adsMonetizationEnabled })}
              className="cursor-pointer flex items-center gap-1 text-[10px] font-bold"
              title={t('Toggle Shop Advertisement Fees On/Off', 'दुकान विज्ञापन शुल्क चालू/बंद करें')}
            >
              {config.adsMonetizationEnabled ? (
                <ToggleRight className="w-8 h-8 text-emerald-600 fill-emerald-100" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-stone-400" />
              )}
            </button>
          </div>
          <div>
            <p className="text-base font-bold font-serif text-stone-900">
              {config.adsMonetizationEnabled
                ? t(`Paid Ads ON (₹${config.featuredAdPrice}${billingSuffixEn})`, `पेड विज्ञापन चालू (₹${config.featuredAdPrice}${billingSuffixHi})`)
                : t('OFF (Free Directory Ads)', 'बंद (निःशुल्क विज्ञापन)')}
            </p>
            <span className="text-[11px] text-emerald-700 font-medium">
              {ads.length} {t('Total Shops', 'कुल दुकानें')} · {totalFeaturedAds} {t('Featured', 'फीचर्ड')}
            </span>
          </div>
        </div>

        {/* Candidates Metric */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs flex flex-col justify-between gap-2">
          <span className="text-[10px] font-bold text-stone-400 uppercase">{t('Candidate Profiles', 'प्रत्याशी बायोडाटा')}</span>
          <div>
            <p className="text-2xl font-bold font-serif text-stone-900">{profiles.length}</p>
            <span className="text-[11px] text-stone-500 font-medium">
              {totalGrooms} {t('Grooms', 'वर')} · {totalBrides} {t('Brides', 'वधू')}
            </span>
          </div>
        </div>

        {/* Active Switches Counter */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs flex flex-col justify-between gap-2">
          <span className="text-[10px] font-bold text-stone-400 uppercase">{t('App Feature Toggles', 'सक्रिय ऐप फीचर्स')}</span>
          <div>
            <p className="text-2xl font-bold font-serif text-stone-900">
              {enabledFeatureCount} <span className="text-sm font-normal text-stone-500">/ {allSwitchKeys.length}</span>
            </p>
            <span className="text-[11px] text-emerald-700 font-medium">
              {t('Live Remote Flags Enabled', 'लाइव रिमोट फ्लैग चालू')}
            </span>
          </div>
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
          ⚙️ {t('All App Feature Toggles', 'सभी ऐप फीचर टॉगल')}
        </button>

        <button
          onClick={() => setActiveAdminTab('monetization')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeAdminTab === 'monetization'
              ? 'bg-[#380812] text-amber-200 shadow-xs'
              : 'text-stone-700 hover:bg-stone-100'
          }`}
        >
          💳 {t('Subscription & Shop Ad Pricing', 'सब्सक्रिप्शन व दुकान विज्ञापन शुल्क')}
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

      {/* TAB 1: ALL FEATURE TOGGLES & REMOTE APK SWITCHES */}
      {activeAdminTab === 'flags' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 space-y-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
            <div>
              <h3 className="text-xl font-serif font-bold text-stone-900">
                {t('Master Feature Controls (Turn Any Feature ON / OFF Live)', 'मास्टर फीचर नियंत्रण (सभी ऐप सुविधाएं लाइव चालू / बंद करें)')}
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                {t(
                  'Toggle any module, monetization rule, or community tool immediately for all users without updating the Play Store APK.',
                  'बिना Play Store APK अपडेट किए किसी भी सुविधा, सब्सक्रिप्शन या विज्ञापन नियम को सभी उपयोगकर्ताओं के लिए तुरंत चालू या बंद करें।'
                )}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleEnableAllFeatures}
                className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-bold cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                {t('Enable All App Features', 'सभी सुविधाएं चालू करें')}
              </button>
              <button
                type="button"
                onClick={() => {
                  resetConfig();
                  setSaveToast(true);
                  setTimeout(() => setSaveToast(false), 2500);
                }}
                className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 text-xs font-semibold cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {t('Reset Defaults', 'डिफ़ॉल्ट रीसेट')}
              </button>
            </div>
          </div>

          {/* Group 1: Monetization & Subscription Access */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-900">
              {t('1. Subscription & Shop Ad Monetization Controls', '1. सब्सक्रिप्शन एवं दुकान विज्ञापन शुल्क नियंत्रण')}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {featureToggleDefs.filter((f) => f.group === 'monetization').map(renderToggleCard)}

              {/* Contact Access Rule Selector */}
              <div className="p-4 sm:p-5 rounded-2xl border border-stone-200 bg-stone-50/50 space-y-2">
                <span className="text-xs font-bold text-stone-800 block">
                  {t('Matrimony Contact Details Access Policy', 'वैवाहिक संपर्क नंबर देखने की नीति')}
                </span>
                <p className="text-xs text-stone-600">
                  {t(
                    'Controls how users unlock phone numbers & contact details on biodatas.',
                    'तय करें कि उपयोगकर्ता बायोडाटा के संपर्क नंबर कैसे देख पाएंगे।'
                  )}
                </p>
                <select
                  value={config.contactAccessMode}
                  onChange={(e) =>
                    handleConfigUpdate({
                      contactAccessMode: e.target.value as AdminRuntimeConfig['contactAccessMode']
                    })
                  }
                  className="w-full text-xs bg-white border border-stone-300 rounded-xl px-3 py-2.5 font-medium text-stone-800"
                >
                  <option value="limited_3_views">
                    {t('3 Free Contact Views (Then Family Profile or Subscription)', '3 निःशुल्क संपर्क दृश्य (फिर परिवार विवरण या प्लान)')}
                  </option>
                  <option value="free">
                    {t('100% Free & Open to All Signed-In Members', 'सभी लॉग-इन सदस्यों के लिए 100% निःशुल्क')}
                  </option>
                  <option value="subscription_required">
                    {t('Subscription Required from 1st Profile (When Subscription is ON)', 'पहले बायोडाटा से सब्सक्रिप्शन अनिवार्य (सब्सक्रिप्शन चालू होने पर)')}
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* Group 2: Matrimonial Core Features */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-rose-900">
              {t('2. Matrimonial, Chat, Likes & Moderation Features', '2. वैवाहिक बायोडाटा, चैट, पसंद और सत्यापन सुविधाएं')}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {featureToggleDefs.filter((f) => f.group === 'matrimony').map(renderToggleCard)}
            </div>
          </div>

          {/* Group 3: Utilities & Business Directory */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-stone-700">
              {t('3. Kundali Milan, Guest List & Business Directory', '3. कुंडली मिलान, अतिथि सूची एवं व्यापार निर्देशिका')}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {featureToggleDefs.filter((f) => f.group === 'utilities').map(renderToggleCard)}
            </div>
          </div>

          {/* Group 4: E-Booklet, Events, Sharing & Broadcast */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-stone-700">
              {t('4. E-Booklet, Events, WhatsApp Sharing & Broadcast', '4. ई-पत्रिका, कार्यक्रम, व्हाट्सऐप शेयर और घोषणा')}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {featureToggleDefs.filter((f) => f.group === 'community').map(renderToggleCard)}
            </div>
          </div>

          {/* Broadcast Banner Customizer */}
          <div className="p-5 rounded-2xl border border-amber-200 bg-amber-50/30 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-stone-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-700" />
                {t('Global Community Broadcast Banner Message', 'वैश्विक समाज घोषणा बैनर संदेश')}
              </span>
              <span className={`text-[11px] font-bold ${config.isBroadcastActive ? 'text-emerald-700' : 'text-stone-400'}`}>
                {config.isBroadcastActive ? t('Active (Visible on Top)', 'सक्रिय (ऊपर दिखाई दे रहा है)') : t('Hidden', 'छिपा हुआ')}
              </span>
            </div>

            <textarea
              rows={2}
              value={config.bannerBroadcastMessage}
              onChange={(e) => handleConfigUpdate({ bannerBroadcastMessage: e.target.value })}
              className="w-full text-xs bg-white border border-stone-300 rounded-xl p-3 focus:outline-hidden focus:border-amber-600 text-stone-900"
              placeholder={t('Enter announcement to display at top of portal...', 'पोर्टल के शीर्ष पर दिखाने हेतु घोषणा लिखें...')}
            />
          </div>
        </div>
      )}

      {/* TAB 2: SUBSCRIPTION PLANS & SHOP ADVERTISEMENT PRICING */}
      {activeAdminTab === 'monetization' && (
        <div className="space-y-6">
          {/* SUBSCRIPTION MASTER CONTROL & PLANS CARD */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100 pb-4">
              <div>
                <h3 className="text-xl font-serif font-bold text-stone-900 flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-700" />
                  <span>{t('User Subscription Control & Membership Plans', 'यूज़र सब्सक्रिप्शन नियंत्रण एवं सदस्यता योजनाएँ')}</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  {t(
                    'Turn subscription ON or OFF for all users and set your Annual & Lifetime plan pricing.',
                    'सभी उपयोगकर्ताओं के लिए सब्सक्रिप्शन चालू या बंद करें और वार्षिक व आजीवन सदस्यता शुल्क तय करें।'
                  )}
                </p>
              </div>

              {/* MASTER SUBSCRIPTION ON/OFF SWITCH RIGHT INSIDE SUBSCRIPTION DETAILS */}
              <div
                className={`px-4 py-3 rounded-2xl border-2 flex items-center gap-4 shrink-0 ${
                  config.subscriptionEnabled
                    ? 'bg-emerald-50 border-emerald-400'
                    : 'bg-stone-50 border-stone-300'
                }`}
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                    {t('Subscription For Users', 'यूज़र्स हेतु सब्सक्रिप्शन')}
                  </span>
                  <span className={`text-xs font-extrabold ${config.subscriptionEnabled ? 'text-emerald-800' : 'text-stone-700'}`}>
                    {config.subscriptionEnabled
                      ? t('ENABLED (Paid Plans Active)', 'चालू (पेड प्लान सक्रिय)')
                      : t('DISABLED (Free Samaj Mode)', 'बंद (निःशुल्क समाज मोड)')}
                  </span>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={config.subscriptionEnabled}
                  aria-label={t('Toggle User Subscription On or Off', 'यूज़र सब्सक्रिप्शन चालू या बंद करें')}
                  onClick={() => handleConfigUpdate({ subscriptionEnabled: !config.subscriptionEnabled })}
                  className="cursor-pointer hover:scale-105 transition-transform flex items-center"
                >
                  {config.subscriptionEnabled ? (
                    <ToggleRight className="w-11 h-11 text-emerald-600 fill-emerald-100" />
                  ) : (
                    <ToggleLeft className="w-11 h-11 text-stone-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Contact Access Rule inside Subscription Tab */}
            <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-amber-950 block">
                  {t('When should users be prompted for Subscription?', 'उपयोगकर्ताओं को सब्सक्रिप्शन कब दिखाया जाए?')}
                </span>
                <span className="text-[11px] text-stone-600 block">
                  {config.subscriptionEnabled
                    ? t(
                        'Subscription is ON. Choose whether to give 3 free profile views first or require subscription immediately.',
                        'सब्सक्रिप्शन चालू है। चुनें कि पहले 3 निःशुल्क व्यू दिए जाएं या पहले बायोडाटा से ही प्लान आवश्यक हो।'
                      )
                    : t(
                        'Note: Turn the Subscription switch ON above for paid subscription prompts to apply to users.',
                        'नोट: उपयोगकर्ताओं पर पेड प्लान लागू करने के लिए ऊपर सब्सक्रिप्शन स्विच चालू करें।'
                      )}
                </span>
              </div>
              <select
                value={config.contactAccessMode}
                onChange={(e) =>
                  handleConfigUpdate({
                    contactAccessMode: e.target.value as AdminRuntimeConfig['contactAccessMode']
                  })
                }
                className="text-xs bg-white border border-amber-300 rounded-xl px-3 py-2 font-semibold text-stone-800 md:w-80 shrink-0"
              >
                <option value="limited_3_views">
                  {t('3 Free Views, then Subscription / Family Profile', '3 निःशुल्क व्यू, फिर सब्सक्रिप्शन / परिवार प्रोफ़ाइल')}
                </option>
                <option value="subscription_required">
                  {t('Strict Subscription Required Immediately (0 Free Views)', 'तुरंत सब्सक्रिप्शन अनिवार्य (0 निःशुल्क व्यू)')}
                </option>
                <option value="free">
                  {t('Keep Contacts Free (Show Optional Patron Upgrade)', 'संपर्क निःशुल्क रखें (वैकल्पिक पैट्रन प्लान)')}
                </option>
              </select>
            </div>

            {/* Subscription Tiers Grid with Per-Tier Enable/Disable Switch */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div
                className={`border-2 rounded-3xl p-6 space-y-4 transition-all ${
                  config.annualPlanEnabled ? 'border-amber-300 bg-amber-50/30' : 'border-stone-200 bg-stone-50 opacity-75'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                    {t('Tier 1: Annual Samaj Rishtey Pass', 'श्रेणी 1: वार्षिक समाज रिश्ते पास')}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={config.annualPlanEnabled}
                    onClick={() => handleConfigUpdate({ annualPlanEnabled: !config.annualPlanEnabled })}
                    className="cursor-pointer flex items-center gap-1.5 text-[11px] font-bold"
                  >
                    <span className={config.annualPlanEnabled ? 'text-emerald-700' : 'text-stone-500'}>
                      {config.annualPlanEnabled ? t('Plan ON', 'प्लान चालू') : t('Plan OFF', 'प्लान बंद')}
                    </span>
                    {config.annualPlanEnabled ? (
                      <ToggleRight className="w-8 h-8 text-emerald-600 fill-emerald-100" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-stone-400" />
                    )}
                  </button>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold font-serif text-stone-900">₹</span>
                  <input
                    type="number"
                    min={0}
                    value={config.annualPlanPrice}
                    onChange={(e) => handleConfigUpdate({ annualPlanPrice: Math.max(0, Number(e.target.value) || 0) })}
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

              <div
                className={`border-2 rounded-3xl p-6 space-y-4 transition-all ${
                  config.lifetimePlanEnabled ? 'border-stone-300 bg-stone-50/70' : 'border-stone-200 bg-stone-100 opacity-75'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-800">
                    {t('Tier 2: Royal Samaj Lifetime Patron', 'श्रेणी 2: रॉयल समाज आजीवन संरक्षक')}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={config.lifetimePlanEnabled}
                    onClick={() => handleConfigUpdate({ lifetimePlanEnabled: !config.lifetimePlanEnabled })}
                    className="cursor-pointer flex items-center gap-1.5 text-[11px] font-bold"
                  >
                    <span className={config.lifetimePlanEnabled ? 'text-emerald-700' : 'text-stone-500'}>
                      {config.lifetimePlanEnabled ? t('Plan ON', 'प्लान चालू') : t('Plan OFF', 'प्लान बंद')}
                    </span>
                    {config.lifetimePlanEnabled ? (
                      <ToggleRight className="w-8 h-8 text-emerald-600 fill-emerald-100" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-stone-400" />
                    )}
                  </button>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold font-serif text-stone-900">₹</span>
                  <input
                    type="number"
                    min={0}
                    value={config.lifetimePlanPrice}
                    onChange={(e) => handleConfigUpdate({ lifetimePlanPrice: Math.max(0, Number(e.target.value) || 0) })}
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

          {/* SHOP ADVERTISEMENTS PRICING SECTION */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100 pb-4">
              <div>
                <h3 className="text-xl font-serif font-bold text-stone-900 flex items-center gap-2">
                  <Store className="w-5 h-5 text-amber-700" />
                  <span>{t('Shop Advertisement Pricing & Packages', 'दुकान एवं व्यापार विज्ञापन शुल्क योजनाएँ')}</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  {t(
                    'Configure rates for Standard, Featured Top Banner, and Premium Spotlight shop ads shown to business owners.',
                    'दुकान मालिकों के लिए सामान्य, फीचर्ड टॉप बैनर और प्रीमियम स्पॉटलाइट विज्ञापन शुल्क निर्धारित करें।'
                  )}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <select
                  value={config.adBillingCycle}
                  onChange={(e) =>
                    handleConfigUpdate({
                      adBillingCycle: e.target.value as AdminRuntimeConfig['adBillingCycle']
                    })
                  }
                  className="text-xs bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 font-bold text-stone-800"
                  aria-label={t('Ad Billing Cycle', 'विज्ञापन बिलिंग अवधि')}
                >
                  <option value="monthly">{t('Billing: Monthly', 'अवधि: मासिक')}</option>
                  <option value="quarterly">{t('Billing: Quarterly', 'अवधि: तिमाही')}</option>
                  <option value="yearly">{t('Billing: Yearly', 'अवधि: वार्षिक')}</option>
                </select>

                <div
                  className={`px-3.5 py-2 rounded-2xl border-2 flex items-center gap-3 ${
                    config.adsMonetizationEnabled
                      ? 'bg-emerald-50 border-emerald-400'
                      : 'bg-stone-50 border-stone-300'
                  }`}
                >
                  <span className={`text-xs font-extrabold ${config.adsMonetizationEnabled ? 'text-emerald-800' : 'text-stone-700'}`}>
                    {config.adsMonetizationEnabled ? t('Paid Shop Ads ON', 'पेड विज्ञापन चालू') : t('Free Shop Ads Mode', 'निःशुल्क विज्ञापन')}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={config.adsMonetizationEnabled}
                    onClick={() => handleConfigUpdate({ adsMonetizationEnabled: !config.adsMonetizationEnabled })}
                    className="cursor-pointer flex items-center"
                  >
                    {config.adsMonetizationEnabled ? (
                      <ToggleRight className="w-9 h-9 text-emerald-600 fill-emerald-100" />
                    ) : (
                      <ToggleLeft className="w-9 h-9 text-stone-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Standard Shop Ad */}
              <div className="border-2 border-stone-200 rounded-3xl p-5 bg-stone-50/50 space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-700 block">
                  {t('Package 1: Standard Shop Listing', 'पैकेज 1: सामान्य दुकान विज्ञापन')}
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-serif text-stone-900">₹</span>
                  <input
                    type="number"
                    min={0}
                    value={config.standardAdPrice}
                    onChange={(e) => handleConfigUpdate({ standardAdPrice: Math.max(0, Number(e.target.value) || 0) })}
                    className="w-24 text-2xl font-bold font-serif bg-white border border-stone-300 rounded-xl px-2.5 py-1"
                  />
                  <span className="text-xs text-stone-500 font-semibold">{t(billingSuffixEn, billingSuffixHi)}</span>
                </div>
                <p className="text-[11px] text-stone-500">
                  {t('Set ₹0 to keep Standard Listings free even when Paid Ads are ON.', 'यदि आप सामान्य लिस्टिंग निःशुल्क रखना चाहते हैं तो ₹0 दर्ज करें।')}
                </p>
                <ul className="text-xs space-y-1.5 text-stone-700 pt-1">
                  <li>✅ {t('Directory Card & Direct Call Link', 'निर्देशिका कार्ड एवं डायरेक्ट कॉल')}</li>
                  <li>✅ {t('WhatsApp Share & Member Discount Tag', 'व्हाट्सऐप शेयर व छूट टैग')}</li>
                </ul>
              </div>

              {/* Featured Top Banner Ad */}
              <div className="border-2 border-amber-300 rounded-3xl p-5 bg-amber-50/40 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
                    {t('Package 2: Featured Top Banner', 'पैकेज 2: फीचर्ड टॉप बैनर')}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={config.featuredAdsEnabled}
                    onClick={() => handleConfigUpdate({ featuredAdsEnabled: !config.featuredAdsEnabled })}
                    className="cursor-pointer"
                    title={t('Toggle Featured Tier Option', 'फीचर्ड विकल्प चालू/बंद करें')}
                  >
                    {config.featuredAdsEnabled ? (
                      <ToggleRight className="w-7 h-7 text-emerald-600 fill-emerald-100" />
                    ) : (
                      <ToggleLeft className="w-7 h-7 text-stone-400" />
                    )}
                  </button>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-serif text-stone-900">₹</span>
                  <input
                    type="number"
                    min={0}
                    value={config.featuredAdPrice}
                    onChange={(e) => handleConfigUpdate({ featuredAdPrice: Math.max(0, Number(e.target.value) || 0) })}
                    className="w-24 text-2xl font-bold font-serif bg-white border border-amber-300 rounded-xl px-2.5 py-1"
                  />
                  <span className="text-xs text-stone-500 font-semibold">{t(billingSuffixEn, billingSuffixHi)}</span>
                </div>
                <p className="text-[11px] text-amber-900 font-medium">
                  {t('Golden Featured badge + top-of-category placement.', 'गोल्डन फीचर्ड बैज + श्रेणी में सबसे ऊपर स्थान।')}
                </p>
                <ul className="text-xs space-y-1.5 text-stone-700 pt-1">
                  <li>⭐ {t('Top Directory Placement', 'डायरेक्टरी में शीर्ष स्थान')}</li>
                  <li>⭐ {t('Gold Featured Star Badge', 'गोल्डन फीचर्ड स्टार बैज')}</li>
                </ul>
              </div>

              {/* Premium Spotlight Package */}
              <div className="border-2 border-[#6e1628]/40 rounded-3xl p-5 bg-rose-50/30 space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#380812] block">
                  {t('Package 3: Royal E-Booklet + Spotlight', 'पैकेज 3: रॉयल ई-पत्रिका + स्पॉटलाइट')}
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-serif text-stone-900">₹</span>
                  <input
                    type="number"
                    min={0}
                    value={config.spotlightAdPrice}
                    onChange={(e) => handleConfigUpdate({ spotlightAdPrice: Math.max(0, Number(e.target.value) || 0) })}
                    className="w-24 text-2xl font-bold font-serif bg-white border border-rose-300 rounded-xl px-2.5 py-1"
                  />
                  <span className="text-xs text-stone-500 font-semibold">{t(billingSuffixEn, billingSuffixHi)}</span>
                </div>
                <p className="text-[11px] text-stone-600">
                  {t('Maximum visibility across Directory, E-Patrika & Sponsor Banner.', 'डायरेक्टरी, ई-पत्रिका और स्पॉन्सर बैनर में अधिकतम प्रचार।')}
                </p>
                <ul className="text-xs space-y-1.5 text-stone-700 pt-1">
                  <li>👑 {t('Featured Banner + E-Patrika Sponsor Page', 'फीचर्ड बैनर + ई-पत्रिका पेज विज्ञापन')}</li>
                  <li>👑 {t('Broadcast Promotion Eligibility', 'समाज घोषणा में प्रचार सुविधा')}</li>
                </ul>
              </div>
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
                {t(
                  'Approve, verify Gotra, or delete candidate entries across Rajasthan, MP, and Maharashtra.',
                  'राजस्थान, मध्य प्रदेश और महाराष्ट्र के बायोडाटा सत्यापित या प्रबंधित करें।'
                )}
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
                {filteredProfiles.map((p) => {
                  const isVerified = p.verified !== false;
                  const isConfirming = confirmDeleteProfileId === p.id;
                  return (
                    <tr key={p.id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={
                              p.photo ||
                              'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80'
                            }
                            alt={p.name}
                            className="w-9 h-9 rounded-lg object-cover border border-stone-200"
                          />
                          <div>
                            <p className="font-bold text-stone-900">{p.name}</p>
                            <span className="text-[10px] text-stone-500">
                              {p.gender === 'Male' ? t('Male', 'वर') : t('Female', 'वधू')} · {p.age} {t('Yrs', 'वर्ष')}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-medium text-amber-900">{p.gotra}</span>
                        <p className="text-[10px] text-stone-500">{p.city}</p>
                      </td>
                      <td className="py-3 px-3">
                        <p className="truncate max-w-[140px] font-medium">{p.education}</p>
                        <span className="text-[10px] text-stone-500 truncate block max-w-[140px]">
                          {p.profession || '---'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-stone-700">{p.contact}</td>
                      <td className="py-3 px-3">
                        <button
                          type="button"
                          onClick={() => onUpdateProfile({ ...p, verified: !isVerified })}
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full cursor-pointer transition-colors ${
                            isVerified
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                          }`}
                          title={t('Click to toggle verification status', 'सत्यापन स्थिति बदलने के लिए क्लिक करें')}
                        >
                          <ShieldCheck className={`w-3 h-3 ${isVerified ? 'text-emerald-600' : 'text-amber-700'}`} />
                          {isVerified ? t('Verified', 'सत्यापित') : t('Pending Approval', 'अनुमोदन लंबित')}
                        </button>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isConfirming ? (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  onDeleteProfile(p.id);
                                  setConfirmDeleteProfileId(null);
                                }}
                                className="px-2 py-1 bg-rose-600 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                              >
                                {t('Confirm', 'हटाएं')}
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteProfileId(null)}
                                className="px-2 py-1 bg-stone-200 text-stone-700 rounded-lg text-[10px] font-semibold cursor-pointer"
                              >
                                {t('Cancel', 'रद्द')}
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteProfileId(p.id)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                              title={t('Delete profile', 'प्रोफ़ाइल हटाएं')}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: BUSINESS ADS MODERATION & QUICK PRICING */}
      {activeAdminTab === 'ads' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100 pb-4">
            <div>
              <h3 className="text-xl font-serif font-bold text-stone-900">
                {t('Shop & Business Advertisements', 'दुकान एवं व्यापार विज्ञापन')} ({ads.length})
              </h3>
              <p className="text-xs text-stone-500">
                {t(
                  'Manage shop listings, pricing rates, and featured banner sponsorships.',
                  'दुकानों के विज्ञापन, शुल्क दरें और फीचर्ड बैनर प्रायोजन प्रबंधित करें।'
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 bg-amber-50/70 border border-amber-200 rounded-2xl px-4 py-2.5 text-xs">
              <div>
                <span className="font-bold text-amber-950">{t('Paid Ads:', 'पेड विज्ञापन:')} </span>
                <span className="font-semibold text-stone-700">
                  {config.adsMonetizationEnabled
                    ? `₹${config.standardAdPrice} / ₹${config.featuredAdPrice} / ₹${config.spotlightAdPrice} ${t(billingSuffixEn, billingSuffixHi)}`
                    : t('Free Mode', 'निःशुल्क मोड')}
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={config.adsMonetizationEnabled}
                onClick={() => handleConfigUpdate({ adsMonetizationEnabled: !config.adsMonetizationEnabled })}
                className="cursor-pointer flex items-center gap-1"
              >
                {config.adsMonetizationEnabled ? (
                  <ToggleRight className="w-8 h-8 text-emerald-600 fill-emerald-100" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-stone-400" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveAdminTab('monetization')}
                className="text-[11px] font-bold text-[#380812] underline cursor-pointer"
              >
                {t('Edit Pricing', 'शुल्क बदलें')}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {ads.map((ad) => {
              const isConfirming = confirmDeleteAdId === ad.id;
              return (
                <div key={ad.id} className="p-4 rounded-2xl border border-stone-200 bg-stone-50/50 space-y-2 text-xs">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-bold text-stone-900 font-serif text-sm">{ad.title}</h4>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        ad.isFeatured ? 'bg-amber-300 text-stone-950' : 'bg-stone-200 text-stone-700'
                      }`}
                    >
                      {ad.isFeatured ? t('★ Featured', '★ प्रमुख') : t('Standard', 'सामान्य')}
                    </span>
                  </div>
                  <p className="text-stone-600">
                    {t('Owner:', 'संचालक:')} {ad.owner} · {ad.category}
                  </p>
                  <p className="text-stone-500 font-mono">📞 {ad.phone}</p>
                  {ad.adPricePaid !== undefined && (
                    <p className="text-[11px] font-semibold text-emerald-800">
                      {ad.adPricePaid > 0
                        ? `${t('Plan Fee:', 'योजना शुल्क:')} ₹${ad.adPricePaid}`
                        : t('Plan: Free Listing', 'योजना: निःशुल्क')}
                    </p>
                  )}
                  <div className="pt-2 border-t border-stone-200 flex flex-wrap justify-between items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onUpdateAd({ ...ad, isFeatured: !ad.isFeatured })}
                      className="text-amber-900 font-bold hover:underline cursor-pointer text-left"
                    >
                      {ad.isFeatured ? t('Demote to Standard', 'सामान्य श्रेणी में करें') : t('Make Featured Banner', 'प्रमुख बैनर बनाएं')}
                    </button>

                    {isConfirming ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteAd(ad.id);
                            setConfirmDeleteAdId(null);
                          }}
                          className="px-2 py-0.5 bg-rose-600 text-white rounded text-[10px] font-bold cursor-pointer"
                        >
                          {t('Confirm', 'हटाएं')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteAdId(null)}
                          className="px-2 py-0.5 bg-stone-200 text-stone-700 rounded text-[10px] cursor-pointer"
                        >
                          {t('Cancel', 'रद्द')}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteAdId(ad.id)}
                        className="text-rose-600 hover:text-rose-800 cursor-pointer font-semibold"
                      >
                        {t('Delete', 'हटाएं')}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
