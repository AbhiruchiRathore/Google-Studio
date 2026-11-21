import React from 'react';
import { Crown, Check, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { AuthSession, TabType } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useAdminConfig } from '../context/AdminConfigContext';

interface FoundingOfferCardProps {
  verifiedCount: number;
  hasRegisteredProfile: boolean;
  authSession: AuthSession | null;
  onNavigateTab: (tab: TabType) => void;
}

export const FOUNDING_PROFILE_LIMIT = 500;

export const FoundingOfferCard: React.FC<FoundingOfferCardProps> = ({
  verifiedCount,
  hasRegisteredProfile,
  authSession,
  onNavigateTab
}) => {
  const { lang, t } = useLanguage();
  const { config } = useAdminConfig();

  const claimedCount = Math.min(FOUNDING_PROFILE_LIMIT, Math.max(0, verifiedCount));
  const remainingSpots = Math.max(0, FOUNDING_PROFILE_LIMIT - claimedCount);
  const progressPercent = Math.min(100, Math.max(6, Math.round((claimedCount / FOUNDING_PROFILE_LIMIT) * 100)));
  const isOfferActive = remainingSpots > 0;
  const userQualified = hasRegisteredProfile && verifiedCount <= FOUNDING_PROFILE_LIMIT;

  const handleClaimClick = () => {
    if (!authSession) {
      onNavigateTab('signup');
      return;
    }
    onNavigateTab(hasRegisteredProfile ? 'dashboard' : 'create-profile');
  };

  if (userQualified) {
    return (
      <section
        aria-label={t('Founding Member Lifetime Premium', 'फाउंडिंग सदस्य आजीवन प्रीमियम')}
        className="rounded-2xl bg-gradient-to-r from-[#28060d] via-[#3d0a16] to-[#1e0308] text-white border border-amber-400/35 px-4 py-3 sm:px-5 flex flex-wrap items-center justify-between gap-3 shadow-sm"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <p className="text-xs sm:text-sm font-medium text-amber-50 truncate">
            {t(
              'Founding Lifetime Premium active on your verified profile',
              'आपकी सत्यापित प्रोफ़ाइल पर आजीवन प्रीमियम सक्रिय है'
            )}
          </p>
        </div>
        <span className="text-[11px] font-semibold text-amber-300 tabular-nums shrink-0">
          {lang === 'hi'
            ? `${claimedCount}/${FOUNDING_PROFILE_LIMIT} सत्यापित स्थान`
            : `${claimedCount}/${FOUNDING_PROFILE_LIMIT} spots claimed`}
        </span>
      </section>
    );
  }

  return (
    <section
      aria-label={t('First 500 Verified Profiles Lifetime Premium Offer', 'प्रथम ५०० सत्यापित प्रोफ़ाइल हेतु आजीवन प्रीमियम ऑफर')}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#28060d] via-[#3d0a16] to-[#1e0308] text-white border border-amber-400/40 shadow-lg"
    >
      <div className="absolute -top-20 -right-16 w-72 h-72 rounded-full bg-amber-400/12 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-16 w-64 h-64 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 p-5 sm:p-8 lg:p-9 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
        {/* Left Offer Copy & Benefits */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-300 tracking-wide">
            <Crown className="w-4 h-4 text-amber-300 shrink-0" />
            <span>
              {t(
                'Community Milestone Offer · First 500 Verified Profiles',
                'समुदाय विशेष ऑफर · प्रथम ५०० सत्यापित बायोडाटा'
              )}
            </span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-serif font-bold text-amber-50 leading-tight text-balance">
            {t(
              'First 500 Verified Profiles Get Free Lifetime Premium Access',
              'पहले ५०० सत्यापित प्रोफ़ाइल को मिलेगा आजीवन निःशुल्क प्रीमियम एक्सेस'
            )}
          </h3>

          <p className="text-xs sm:text-sm text-stone-300 leading-relaxed max-w-2xl">
            {t(
              'Over 220+ verified community profiles are already live across cities. Publish and verify your biodata before all 500 milestone spots fill up to receive permanent premium membership with zero renewal fees.',
              'हमारे समाज पोर्टल पर २२०+ सत्यापित बायोडाटा पहले ही जुड़ चुके हैं। ५०० स्थान पूरे होने से पहले अपना बायोडाटा प्रकाशित व सत्यापित करें और बिना किसी वार्षिक शुल्क के हमेशा के लिए प्रीमियम सदस्यता प्राप्त करें।'
            )}
          </p>

          <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs text-amber-100/95">
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{t('Unlimited contact number unlocks', 'असीमित संपर्क नंबर अनलॉक')}</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{t('Priority nearby biodata visibility', 'निकटवर्ती बायोडाटा में प्राथमिकता')}</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{t('Lifetime family chat & Kundali access', 'आजीवन परिवार चैट व कुंडली सुविधा')}</span>
            </li>
          </ul>
        </div>

        {/* Right Offer Box: Value Comparison, Live Counter & CTA */}
        <div className="lg:col-span-5 bg-white/8 backdrop-blur-xs border border-amber-300/35 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-baseline justify-between gap-3 border-b border-amber-400/20 pb-3.5">
            <div>
              <p className="text-[11px] font-medium text-amber-200/80">
                {t('Founding Member Plan', 'फाउंडिंग मेंबर प्लान')}
              </p>
              <div className="flex items-baseline gap-2.5 mt-0.5 tabular-nums">
                <span className="text-2xl sm:text-3xl font-serif font-bold text-amber-300">
                  {t('FREE', 'निःशुल्क')}
                </span>
                <span className="text-xs sm:text-sm text-stone-400 line-through">
                  ₹{config.lifetimePlanPrice}
                </span>
                <span className="text-xs font-semibold text-emerald-300">
                  {t('· Lifetime Access', '· आजीवन वैध')}
                </span>
              </div>
            </div>
            <Sparkles className="w-5 h-5 text-amber-300 shrink-0" />
          </div>

          {/* Claimed Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs tabular-nums">
              <span className="font-semibold text-amber-100">
                {lang === 'hi'
                  ? `${claimedCount} / ${FOUNDING_PROFILE_LIMIT} सत्यापित स्थान भरे`
                  : `${claimedCount} of ${FOUNDING_PROFILE_LIMIT} spots claimed`}
              </span>
              <span className="font-bold text-emerald-300">
                {isOfferActive
                  ? lang === 'hi'
                    ? `${remainingSpots} शेष`
                    : `${remainingSpots} left`
                  : t('Completed', 'पूर्ण')}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-black/40 overflow-hidden border border-amber-400/20">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-emerald-400 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {userQualified ? (
            <div className="bg-emerald-500/15 border border-emerald-400/40 rounded-xl p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-emerald-100 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>
                  {t(
                    'Founding Lifetime Premium active on your verified profile',
                    'आपकी सत्यापित प्रोफ़ाइल पर आजीवन प्रीमियम सक्रिय है'
                  )}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('dashboard')}
                className="text-[11px] font-bold text-amber-300 hover:underline shrink-0 cursor-pointer whitespace-nowrap"
              >
                {t('View', 'देखें')}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleClaimClick}
              className="w-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-bold py-3 px-4 rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>
                {!authSession
                  ? t('Sign Up & Claim Free Lifetime Access', 'साइन अप करें व मुफ्त आजीवन प्रीमियम पाएं')
                  : t('Create Verified Profile & Claim Offer', 'प्रोफ़ाइल बनाएं व मुफ्त प्रीमियम पाएं')}
              </span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
