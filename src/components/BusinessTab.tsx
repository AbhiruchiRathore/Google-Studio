import React, { useState } from 'react';
import { Store, PlusCircle, Phone, Tag, Star, X, Sparkles, UserPlus, Heart, Share2, AlertCircle } from 'lucide-react';
import { BusinessAd, TabType, AuthSession } from '../types';
import { sanitizePhoneInput, validatePhoneNumber } from '../utils/validation';
import { useLanguage } from '../context/LanguageContext';
import { useAdminConfig } from '../context/AdminConfigContext';
import { shareViaWhatsApp } from '../utils/shareAndPrint';
import { ImageUploadField } from './ImageUploadField';

interface BusinessTabProps {
  authSession: AuthSession | null;
  ads: BusinessAd[];
  onNavigateTab: (tab: TabType) => void;
  onAddQuickAd: (ad: Partial<BusinessAd>) => void;
}

export const BusinessTab: React.FC<BusinessTabProps> = ({
  authSession,
  ads,
  onNavigateTab,
  onAddQuickAd
}) => {
  const { lang, t } = useLanguage();
  const { config } = useAdminConfig();
  const [showQuickModal, setShowQuickModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [modalError, setModalError] = useState<string | null>(null);

  const cycleLabel =
    config.adBillingCycle === 'monthly'
      ? t('Month', 'माह')
      : config.adBillingCycle === 'quarterly'
        ? t('Quarter', 'तिमाही')
        : t('Year', 'वर्ष');

  const [formState, setFormState] = useState({
    title: '',
    owner: '',
    category: 'Clothing & Retail',
    phone: '',
    address: '',
    tagline: '',
    offer: 'Special Samaj Member Discount',
    tier: 'standard' as 'standard' | 'featured' | 'spotlight',
    banner: ''
  });

  const [likedAds, setLikedAds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('samaj_liked_ads');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [adLikeCounts, setAdLikeCounts] = useState<Record<string, number>>(() => {
    try {
      const stored = localStorage.getItem('samaj_ad_likes_counts');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const getAdLikes = (id: number | string) => {
    const key = id.toString();
    if (adLikeCounts[key] !== undefined) return adLikeCounts[key];
    const numId = typeof id === 'number' ? id : parseInt(id as string, 10) || 3;
    return ((numId * 17 + 23) % 45) + 12;
  };

  const toggleLikeAd = (id: number | string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const key = id.toString();
    const isLiked = likedAds.has(key);
    const newSet = new Set(likedAds);
    const currentCount = getAdLikes(id);
    const newCounts = { ...adLikeCounts };

    if (isLiked) {
      newSet.delete(key);
      newCounts[key] = Math.max(0, currentCount - 1);
    } else {
      newSet.add(key);
      newCounts[key] = currentCount + 1;
    }

    setLikedAds(newSet);
    setAdLikeCounts(newCounts);
    try {
      localStorage.setItem('samaj_liked_ads', JSON.stringify(Array.from(newSet)));
      localStorage.setItem('samaj_ad_likes_counts', JSON.stringify(newCounts));
    } catch (err) {
      console.error(err);
    }
  };

  const shareAdWhatsApp = (ad: BusinessAd, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const text = lang === 'hi'
      ? `🛍️ *राठौड़ समाज व्यापार डायरेक्टरी* 🛍️\n\n*${ad.title}*\n*श्रेणी:* ${ad.category}\n*संचालक:* ${ad.owner} ${ad.city ? `(${ad.city})` : ''}\n${ad.tagline || ad.description ? `*विवरण:* ${ad.tagline || ad.description}\n` : ''}${ad.offer ? `🎁 *विशेष ऑफर:* ${ad.offer}\n` : ''}${ad.address ? `📍 *पता:* ${ad.address}\n` : ''}📞 *संपर्क:* ${ad.phone}\n\n✨ *राठौड़ समाज व्यापार डायरेक्टरी से जुड़ें:*\nhttps://svayaa.com/`
      : `🛍️ *Rathore Samaj Business Directory* 🛍️\n\n*${ad.title}*\n*Category:* ${ad.category}\n*Owner:* ${ad.owner} ${ad.city ? `(${ad.city})` : ''}\n${ad.tagline || ad.description ? `*About:* ${ad.tagline || ad.description}\n` : ''}${ad.offer ? `🎁 *Special Offer:* ${ad.offer}\n` : ''}${ad.address ? `📍 *Address:* ${ad.address}\n` : ''}📞 *Contact:* ${ad.phone}\n\n✨ *Connect with Rathore Samaj businesses on our community portal:*\nhttps://svayaa.com/\n_Powered by Svayaa_`;

    shareViaWhatsApp(text);
  };

  const categories = ['all', 'Clothing & Retail', 'Hardware & Home Imprv.', 'Jewelry & Gold'];

  const translateCategory = (cat: string) => {
    switch (cat) {
      case 'all': return t('All Businesses', 'सभी व्यापार');
      case 'Clothing & Retail': return t('Clothing & Retail', 'वस्त्र एवं रिटेल');
      case 'Hardware & Home Imprv.': return t('Hardware & Home Imprv.', 'हार्डवेयर व गृह निर्माण');
      case 'Jewelry & Gold': return t('Jewelry & Gold', 'ज्वेलरी व स्वर्ण');
      default: return cat;
    }
  };

  const filteredAds = ads.filter(ad => {
    if (selectedCategory === 'all') return true;
    return ad.category === selectedCategory;
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    if (!formState.title.trim()) {
      setModalError(t('Shop name is required.', 'दुकान का नाम आवश्यक है।'));
      return;
    }

    const phoneCheck = validatePhoneNumber(formState.phone, true);
    if (!phoneCheck.valid) {
      setModalError(lang === 'hi' ? (phoneCheck.errorHi || '') : (phoneCheck.errorEn || ''));
      return;
    }

    const isFeaturedAd =
      (formState.tier === 'featured' && config.featuredAdsEnabled) || formState.tier === 'spotlight';
    const adPricePaid = !config.adsMonetizationEnabled
      ? 0
      : formState.tier === 'spotlight'
        ? config.spotlightAdPrice
        : formState.tier === 'featured' && config.featuredAdsEnabled
          ? config.featuredAdPrice
          : config.standardAdPrice;

    onAddQuickAd({
      title: formState.title.trim(),
      owner: formState.owner.trim() || 'Samaj Business Owner',
      category: formState.category,
      city: 'Indore',
      address: formState.address.trim() || 'Main City Market',
      phone: phoneCheck.cleaned,
      tagline: formState.tagline.trim() || 'Quality services & verified products for community members.',
      offer: formState.offer,
      rating: '5.0 ★',
      isFeatured: isFeaturedAd,
      adTier: formState.tier,
      adPricePaid,
      banner: formState.banner.trim() !== ''
        ? formState.banner.trim()
        : isFeaturedAd
          ? 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80'
          : 'https://images.unsplash.com/photo-1555421689-491a97ff2040?auto=format&fit=crop&w=600&q=80'
    });

    setShowQuickModal(false);
    setFormState({
      title: '',
      owner: '',
      category: 'Clothing & Retail',
      phone: '',
      address: '',
      tagline: '',
      offer: 'Special Samaj Member Discount',
      tier: 'standard',
      banner: ''
    });
  };

  return (
    <div className="space-y-6">
      {/* HERO BANNER SECTION */}
      <div className="bg-gradient-to-r from-[#24050b] via-[#380812] to-[#24050b] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 border border-amber-500/30">
        <div className="space-y-2 text-center md:text-left">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('Rathore Samaj Business Network', 'राठौड़ समाज व्यापार नेटवर्क')}</span>
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif text-amber-50">
            {t('Promote Your Business & Shop', 'अपने व्यापार व दुकान का प्रचार करें')}
          </h2>
          <p className="text-xs sm:text-sm text-stone-300 max-w-xl font-light leading-relaxed">
            {t(
              'Reach thousands of Rathore Samaj families across MP, Rajasthan, and Maharashtra. Connect directly with verified community storefronts.',
              'मध्यप्रदेश, राजस्थान और महाराष्ट्र के हजारों राठौड़ समाज परिवारों तक पहुँचें। समाज बंधुओं की विश्वसनीय दुकानों व सेवाओं से सीधे जुड़ें।'
            )}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          {authSession ? (
            <button 
              onClick={() => onNavigateTab('advertise-shop')}
              className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-bold px-5 py-3 rounded-xl shadow-lg transition-all text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer hover:scale-102"
            >
              <PlusCircle className="w-4 h-4 text-stone-950" />
              <span>{t('Post Shop Advertisement', 'दुकान का विज्ञापन दें')}</span>
            </button>
          ) : (
            <button 
              onClick={() => onNavigateTab('signup')}
              className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-bold px-5 py-3 rounded-xl shadow-lg transition-all text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer hover:scale-102"
            >
              <UserPlus className="w-4 h-4 text-stone-950" />
              <span>{t('Sign In to Post Shop Ad', 'विज्ञापन देने हेतु लॉग इन करें')}</span>
            </button>
          )}
        </div>
      </div>

      {/* LIVE SHOP ADVERTISEMENT PRICING STRIP (Shown when Paid Shop Ads enabled in Admin) */}
      {config.adsMonetizationEnabled && (
        <div className="bg-amber-50/80 border border-amber-300 rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-xs">
          <div className="space-y-1">
            <h3 className="font-serif font-bold text-stone-900 text-sm flex items-center gap-2">
              <Tag className="w-4 h-4 text-amber-700" />
              <span>{t('Shop Advertisement Packages & Tariffs', 'दुकान विज्ञापन पैकेज व शुल्क दरें')}</span>
            </h3>
            <p className="text-xs text-stone-600">
              {t(
                `Promote your family business across Rathore Samaj. Active billing cycle: per ${cycleLabel}.`,
                `राठौर समाज में अपने व्यापार का प्रचार करें। वर्तमान शुल्क अवधि: प्रति ${cycleLabel}।`
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <span className="bg-white border border-stone-200 px-3 py-1.5 rounded-xl font-bold text-stone-800">
              {t('Standard:', 'सामान्य:')} ₹{config.standardAdPrice}/{cycleLabel}
            </span>
            {config.featuredAdsEnabled && (
              <span className="bg-amber-100 border border-amber-300 px-3 py-1.5 rounded-xl font-bold text-amber-950 flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                {t('Featured Banner:', 'फीचर्ड बैनर:')} ₹{config.featuredAdPrice}/{cycleLabel}
              </span>
            )}
            <span className="bg-[#380812] border border-amber-400/40 px-3 py-1.5 rounded-xl font-bold text-amber-200 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              {t('Patrika + Spotlight:', 'ई-पत्रिका + स्पॉटलाइट:')} ₹{config.spotlightAdPrice}/{cycleLabel}
            </span>
          </div>
        </div>
      )}

      {/* CATEGORY FILTER BAR */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-2xl border border-stone-200/90 shadow-xs">
        <span className="text-xs font-bold text-stone-700 ml-2 mr-1">
          {t('Categories:', 'श्रेणियाँ:')}
        </span>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              selectedCategory === cat
                ? 'bg-[#380812] text-amber-200 shadow-xs'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            {translateCategory(cat)}
          </button>
        ))}
      </div>

      {/* ADS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAds.map((ad) => {
          const bannerUrl = ad.banner || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80";

          return (
            <div 
              key={ad.id} 
              className="bg-white rounded-2xl shadow-sm border border-stone-200/80 overflow-hidden flex flex-col justify-between hover:shadow-xl hover:border-amber-400/50 transition-all duration-300 group"
            >
              <div>
                <div className="relative h-44 bg-stone-100 overflow-hidden">
                  <img 
                    src={bannerUrl} 
                    alt={ad.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute top-3 left-3 bg-[#24050b]/90 text-amber-300 text-xs font-semibold px-2.5 py-1 rounded-md shadow-xs border border-amber-500/30 backdrop-blur-xs">
                    {ad.category}
                  </div>
                  {ad.isFeatured && (
                    <div className="absolute top-3 right-3 bg-gradient-to-r from-amber-400 to-amber-300 text-stone-950 text-xs font-bold px-2.5 py-1 rounded-md shadow flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-stone-950" /> {t('Featured', 'फीचर्ड')}
                    </div>
                  )}

                  {config.featureLikesEnabled && (
                    <button
                      onClick={(e) => toggleLikeAd(ad.id, e)}
                      className="absolute bottom-3 right-3 bg-white/95 hover:bg-white text-stone-800 p-1.5 rounded-full shadow-md backdrop-blur-xs transition-transform hover:scale-110 cursor-pointer flex items-center gap-1 text-[11px] font-bold px-2"
                      title={likedAds.has(ad.id.toString()) ? t('Liked', 'पसंद किया') : t('Like business ad', 'पसंद करें')}
                    >
                      <Heart className={`w-3.5 h-3.5 ${likedAds.has(ad.id.toString()) ? 'fill-rose-500 text-rose-500' : 'text-stone-600'}`} />
                      <span className={likedAds.has(ad.id.toString()) ? 'text-rose-600' : 'text-stone-700'}>{getAdLikes(ad.id)}</span>
                    </button>
                  )}
                </div>

                <div className="p-4 sm:p-5 min-w-0">
                  <h3 className="font-bold text-lg text-stone-900 font-serif mb-1 leading-snug group-hover:text-[#380812] transition-colors break-words">
                    {ad.title}
                  </h3>

                  <p className="text-xs text-stone-600 font-medium mb-2.5 break-words">
                    {t('Owner:', 'संचालक:')} {ad.owner} {ad.city ? `· ${ad.city}` : ''}
                  </p>

                  <p className="text-xs text-stone-600 mb-3 leading-relaxed break-words">
                    {ad.tagline || ad.description}
                  </p>

                  {ad.address && (
                    <p className="text-[11px] text-stone-500 mb-3 break-words">
                      📍 {ad.address}
                    </p>
                  )}

                  {ad.offer && (
                    <div className="bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs p-2.5 rounded-xl font-semibold mb-3 flex items-center gap-1.5 min-w-0">
                      <Tag className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="break-words">{ad.offer}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 sm:p-5 pt-0 space-y-2.5">
                {(config.featureLikesEnabled || config.featureWhatsAppShareEnabled) && (
                  <div className="flex flex-wrap items-center gap-2">
                    {config.featureLikesEnabled && (
                      <button
                        onClick={(e) => toggleLikeAd(ad.id, e)}
                        title={likedAds.has(ad.id.toString()) ? t('Liked', 'पसंद किया') : t('Like this business ad', 'विज्ञापन पसंद करें')}
                        className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                          likedAds.has(ad.id.toString())
                            ? 'bg-rose-50 border-rose-300 text-rose-700'
                            : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 shrink-0 ${likedAds.has(ad.id.toString()) ? 'fill-rose-500 text-rose-500' : 'text-stone-500'}`} />
                        <span>{getAdLikes(ad.id)}</span>
                      </button>
                    )}

                    {config.featureWhatsAppShareEnabled && (
                      <button
                        onClick={(e) => shareAdWhatsApp(ad, e)}
                        title={t('Share business ad on WhatsApp', 'व्हाट्सऐप पर साझा करें')}
                        className="flex-1 min-w-[140px] bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-semibold py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
                      >
                        <Share2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{t('Share on WhatsApp', 'व्हाट्सऐप शेयर')}</span>
                      </button>
                    )}
                  </div>
                )}

                <a 
                  href={`tel:${ad.phone}`} 
                  className="w-full bg-gradient-to-r from-[#380812] to-[#540e1b] hover:from-[#24050b] hover:to-[#380812] text-amber-200 font-semibold py-2.5 px-3 rounded-xl text-xs flex flex-wrap items-center justify-center gap-1.5 text-center transition-all shadow-xs border border-amber-500/20 cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5 text-amber-300 shrink-0" /> <span className="whitespace-nowrap">{t('Call Owner', 'कॉल करें')} ({ad.phone})</span>
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* QUICK AD MODAL */}
      {showQuickModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start sm:items-center justify-center px-3 sm:px-4 pt-[calc(0.75rem+var(--sat))] pb-[calc(1rem+var(--sab))] overflow-y-auto"
          onClick={() => setShowQuickModal(false)}
        >
          <div 
            className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-amber-300 relative my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowQuickModal(false)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-full cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-2xl font-serif font-bold text-red-950 mb-1 flex items-center gap-2">
              <Store className="w-6 h-6 text-amber-700" /> {t('Advertise Your Business', 'व्यापार का विज्ञापन दें')}
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              {t('Promote your shop in the directory.', 'समाज डायरेक्टरी में अपनी दुकान का प्रचार करें।')}
            </p>

            {modalError && (
              <div className="mb-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">{t('Shop Name *', 'दुकान का नाम *')}</label>
                <input 
                  required 
                  type="text" 
                  value={formState.title}
                  onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                  className="w-full p-2.5 border rounded-xl border-amber-300 focus:ring-2 focus:ring-amber-500" 
                  placeholder={t('e.g. Rathore Shree Sarees', 'उदा. राठौड़ श्री साड़ीज़')} 
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">{t('Owner Name *', 'संचालक का नाम *')}</label>
                <input 
                  required 
                  type="text" 
                  value={formState.owner}
                  onChange={(e) => setFormState({ ...formState, owner: e.target.value })}
                  className="w-full p-2.5 border rounded-xl border-amber-300 focus:ring-2 focus:ring-amber-500" 
                  placeholder={t('e.g. Rameshwar Rathore', 'उदा. रामेश्वर राठौड़')} 
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">{t('Tagline & Offer *', 'विवरण एवं ऑफर *')}</label>
                <textarea 
                  required 
                  rows={2} 
                  value={formState.tagline}
                  onChange={(e) => setFormState({ ...formState, tagline: e.target.value })}
                  className="w-full p-2.5 border rounded-xl border-amber-300 focus:ring-2 focus:ring-amber-500" 
                  placeholder={t('Special offer for Rathore Samaj members...', 'राठौड़ समाज सदस्यों के लिए विशेष छूट...')} 
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1 flex items-center justify-between">
                  <span>{t('Contact Phone (10 Digits) *', 'संपर्क मोबाइल (10 अंक) *')}</span>
                  <span className="text-[10px] font-mono text-stone-400">{formState.phone.length}/10</span>
                </label>
                <input 
                  required 
                  type="tel" 
                  inputMode="numeric"
                  maxLength={10}
                  value={formState.phone}
                  onChange={(e) => {
                    const cleaned = sanitizePhoneInput(e.target.value);
                    setFormState({ ...formState, phone: cleaned });
                    if (cleaned.length > 0) {
                      const check = validatePhoneNumber(cleaned, true);
                      setModalError(check.valid ? null : (lang === 'hi' ? check.errorHi || null : check.errorEn || null));
                    } else {
                      setModalError(null);
                    }
                  }}
                  className="w-full p-2.5 border rounded-xl border-amber-300 focus:ring-2 focus:ring-amber-500 font-mono" 
                  placeholder={t('10-digit mobile number', '10 अंकों का मोबाइल नंबर')} 
                />
              </div>

              <div>
                <ImageUploadField
                  label={t('Shop Photo / Banner (Optional)', 'दुकान की फ़ोटो / बैनर (वैकल्पिक)')}
                  value={formState.banner}
                  onChange={(url) => setFormState({ ...formState, banner: url })}
                  variant="banner"
                  maxDimension={960}
                  urlPlaceholder={t('https://... (optional shop image link)', 'https://... (वैकल्पिक इमेज लिंक)')}
                />
              </div>

              <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-300 space-y-2">
                <label className="font-bold text-amber-900 block">{t('Select Ad Listing Type:', 'विज्ञापन प्रकार चुनें:')}</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="radio" 
                    name="ad_tier" 
                    id="tier-standard" 
                    checked={formState.tier === 'standard'}
                    onChange={() => setFormState({ ...formState, tier: 'standard' })}
                    value="standard" 
                  />
                  <label htmlFor="tier-standard" className="text-slate-800 cursor-pointer">
                    {config.adsMonetizationEnabled
                      ? t(`Standard Listing (₹${config.standardAdPrice} / ${cycleLabel})`, `सामान्य विज्ञापन (₹${config.standardAdPrice} / ${cycleLabel})`)
                      : t('Standard Listing (Free)', 'सामान्य विज्ञापन (निःशुल्क)')}
                  </label>
                </div>
                {config.featuredAdsEnabled && (
                  <div className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      name="ad_tier" 
                      id="tier-featured" 
                      checked={formState.tier === 'featured'}
                      onChange={() => setFormState({ ...formState, tier: 'featured' })}
                      value="featured" 
                    />
                    <label htmlFor="tier-featured" className="font-bold text-red-900 flex items-center gap-1 cursor-pointer">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />{' '}
                      {config.adsMonetizationEnabled
                        ? t(`Featured Top Banner Ad (₹${config.featuredAdPrice} / ${cycleLabel})`, `फीचर्ड टॉप बैनर विज्ञापन (₹${config.featuredAdPrice} / ${cycleLabel})`)
                        : t('Featured Top Banner Ad (Free)', 'फीचर्ड टॉप बैनर विज्ञापन (निःशुल्क)')}
                    </label>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <input 
                    type="radio" 
                    name="ad_tier" 
                    id="tier-spotlight" 
                    checked={formState.tier === 'spotlight'}
                    onChange={() => setFormState({ ...formState, tier: 'spotlight' })}
                    value="spotlight" 
                  />
                  <label htmlFor="tier-spotlight" className="font-bold text-[#380812] flex items-center gap-1 cursor-pointer">
                    <Star className="w-3.5 h-3.5 text-amber-600" />{' '}
                    {config.adsMonetizationEnabled
                      ? t(`Patrika + Spotlight Ad (₹${config.spotlightAdPrice} / ${cycleLabel})`, `ई-पत्रिका + स्पॉटलाइट विज्ञापन (₹${config.spotlightAdPrice} / ${cycleLabel})`)
                      : t('Patrika + Spotlight Ad (Free)', 'ई-पत्रिका + स्पॉटलाइट विज्ञापन (निःशुल्क)')}
                  </label>
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full bg-amber-500 hover:bg-amber-400 text-red-950 font-bold py-3 rounded-xl shadow mt-2 cursor-pointer transition-colors"
              >
                {t('Submit Advertisement', 'विज्ञापन सबमिट करें')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
