import React, { useState, useMemo, useEffect } from 'react';
import { 
  Sparkles, Heart, ShieldCheck, Share2, Printer, 
  ArrowRight, Users, CheckCircle2, AlertTriangle, Info,
  Flame, RefreshCw, Star, Compass, Award, Lock, UserPlus, Download, X
} from 'lucide-react';
import { MatrimonyProfile, TabType, AuthSession } from '../types';
import { 
  RASHIS, NAKSHATRAS, performKundaliMilan, inferRashiIndex, 
  KundaliMilanReport 
} from '../utils/kundaliMilan';
import { useLanguage } from '../context/LanguageContext';
import { shareViaWhatsApp, printHtmlDocument, downloadPrintableHtml, escapeHtml } from '../utils/shareAndPrint';

interface KundaliMilanTabProps {
  authSession: AuthSession | null;
  profiles: MatrimonyProfile[];
  onNavigateTab: (tab: TabType) => void;
  preselectedBoyId?: number | string | null;
  preselectedGirlId?: number | string | null;
}

export const KundaliMilanTab: React.FC<KundaliMilanTabProps> = ({
  authSession,
  profiles,
  onNavigateTab,
  preselectedBoyId,
  preselectedGirlId
}) => {
  const { lang, t } = useLanguage();
  const [matchMode, setMatchMode] = useState<'samaj' | 'custom'>('samaj');
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Grooms & Brides from Samaj Profiles
  const grooms = useMemo(() => profiles.filter(p => p.gender === 'Male'), [profiles]);
  const brides = useMemo(() => profiles.filter(p => p.gender === 'Female'), [profiles]);

  // Selected profile IDs
  const [selectedBoyId, setSelectedBoyId] = useState<number | string>(() => {
    if (preselectedBoyId) return preselectedBoyId;
    return grooms[0]?.id || 1;
  });

  const [selectedGirlId, setSelectedGirlId] = useState<number | string>(() => {
    if (preselectedGirlId) return preselectedGirlId;
    return brides[0]?.id || 8;
  });

  // Custom Form State
  const [customBoyName, setCustomBoyName] = useState('');
  const [customBoyDob, setCustomBoyDob] = useState('1996-05-15');
  const [customBoyTime, setCustomBoyTime] = useState('10:30');
  const [customBoyPlace, setCustomBoyPlace] = useState('Indore');
  const [customBoyRashi, setCustomBoyRashi] = useState<number>(0); // Aries
  const [customBoyNakshatra, setCustomBoyNakshatra] = useState<number>(0); // Ashwini
  const [customBoyManglik, setCustomBoyManglik] = useState(false);

  const [customGirlName, setCustomGirlName] = useState('');
  const [customGirlDob, setCustomGirlDob] = useState('1998-08-20');
  const [customGirlTime, setCustomGirlTime] = useState('14:15');
  const [customGirlPlace, setCustomGirlPlace] = useState('Nanded');
  const [customGirlRashi, setCustomGirlRashi] = useState<number>(4); // Leo
  const [customGirlNakshatra, setCustomGirlNakshatra] = useState<number>(9); // Magha
  const [customGirlManglik, setCustomGirlManglik] = useState(false);

  // Sync preselected candidates if provided
  useEffect(() => {
    if (preselectedBoyId) setSelectedBoyId(preselectedBoyId);
    if (preselectedGirlId) setSelectedGirlId(preselectedGirlId);
  }, [preselectedBoyId, preselectedGirlId]);

  // Get active groom and bride
  const activeGroom = useMemo(() => {
    return grooms.find(g => g.id.toString() === selectedBoyId.toString()) || grooms[0];
  }, [grooms, selectedBoyId]);

  const activeBride = useMemo(() => {
    return brides.find(b => b.id.toString() === selectedGirlId.toString()) || brides[0];
  }, [brides, selectedGirlId]);

  // Compute Report
  const report: KundaliMilanReport = useMemo(() => {
    if (matchMode === 'samaj' && activeGroom && activeBride) {
      const boyRashiIdx = inferRashiIndex(activeGroom.about || activeGroom.name);
      const girlRashiIdx = inferRashiIndex(activeBride.about || activeBride.name);

      const boyNakshatras = NAKSHATRAS.filter(n => n.rashiIndex === boyRashiIdx);
      const girlNakshatras = NAKSHATRAS.filter(n => n.rashiIndex === girlRashiIdx);

      const boyNakshatraIdx = (boyNakshatras[0] || NAKSHATRAS[0]).index;
      const girlNakshatraIdx = (girlNakshatras[0] || NAKSHATRAS[0]).index;

      const isBoyManglik = activeGroom.about?.toLowerCase().includes('manglik') || false;
      const isGirlManglik = activeBride.about?.toLowerCase().includes('manglik') || false;

      return performKundaliMilan(
        activeGroom.name,
        activeBride.name,
        boyRashiIdx,
        girlRashiIdx,
        boyNakshatraIdx,
        girlNakshatraIdx,
        isBoyManglik,
        isGirlManglik
      );
    } else {
      return performKundaliMilan(
        customBoyName.trim() || t('Groom Candidate', 'वर (प्रत्याशी)'),
        customGirlName.trim() || t('Bride Candidate', 'वधू (प्रत्याशी)'),
        customBoyRashi,
        customGirlRashi,
        customBoyNakshatra,
        customGirlNakshatra,
        customBoyManglik,
        customGirlManglik
      );
    }
  }, [
    matchMode, 
    activeGroom, 
    activeBride, 
    customBoyName, 
    customGirlName, 
    customBoyRashi, 
    customGirlRashi, 
    customBoyNakshatra, 
    customGirlNakshatra, 
    customBoyManglik, 
    customGirlManglik,
    lang
  ]);

  const handleShareWhatsApp = () => {
    const text = lang === 'hi'
      ? `🚩 *वैदिक कुंडली मिलान रिपोर्ट* 🚩
*राठौर रिश्ते मैट्रिमोनियल नेटवर्क*

🤵 *वर:* ${report.boyName} (${report.boyRashi.hindiName})
👰 *वधू:* ${report.girlName} (${report.girlRashi.hindiName})

✨ *कुल गुण मिलान:* *${report.totalGunas} / 36 गुण* (${report.percentage}%)
🏆 *परिणाम:* ${report.verdict.hindiTitle}
📜 *श्रेणी:* ${report.verdict.grade}

📊 *अष्टकूट गुण विवरण:*
• वर्ण: ${report.kootas.varna.obtainedPoints}/1
• वश्य: ${report.kootas.vashya.obtainedPoints}/2
• तारा: ${report.kootas.tara.obtainedPoints}/3
• योनि: ${report.kootas.yoni.obtainedPoints}/4
• ग्रह मैत्री: ${report.kootas.grahaMaitri.obtainedPoints}/5
• गण: ${report.kootas.gana.obtainedPoints}/6
• भकूट: ${report.kootas.bhakoot.obtainedPoints}/7
• नाड़ी: ${report.kootas.nadi.obtainedPoints}/8

${report.doshaSummary.nadiDosha ? '⚠️ नाड़ी दोष उपस्थित' : '✅ नाड़ी अनुकूलता: उत्तम'}
${report.doshaSummary.bhakootDosha ? '⚠️ भकूट दोष उपस्थित' : '✅ भकूट अनुकूलता: शुभ'}
${report.doshaSummary.manglikCheck.isCompatible ? '✅ मांगलिक मिलान: अनुकूल' : 'ℹ️ मांगलिक जाँच: ज्योतिषी परामर्श लें'}

🌐 *राठौर रिश्ते पोर्टल पर लाइव कुंडली मिलान एवं सत्यापित बायोडाटा देखें*`
      : `🚩 *Vedic Kundali Milan Report* 🚩
*Rathore Rishtey Matrimonial Network*

🤵 *Groom:* ${report.boyName} (${report.boyRashi.name})
👰 *Bride:* ${report.girlName} (${report.girlRashi.name})

✨ *Total Gun Milan:* *${report.totalGunas} / 36 Gunas* (${report.percentage}%)
🏆 *Verdict:* ${report.verdict.title}
📜 *Grade:* ${report.verdict.grade}

📊 *Ashtakoot Guna Breakdown:*
• Varna: ${report.kootas.varna.obtainedPoints}/1
• Vashya: ${report.kootas.vashya.obtainedPoints}/2
• Tara: ${report.kootas.tara.obtainedPoints}/3
• Yoni: ${report.kootas.yoni.obtainedPoints}/4
• Graha Maitri: ${report.kootas.grahaMaitri.obtainedPoints}/5
• Gana: ${report.kootas.gana.obtainedPoints}/6
• Bhakoot: ${report.kootas.bhakoot.obtainedPoints}/7
• Nadi: ${report.kootas.nadi.obtainedPoints}/8

${report.doshaSummary.nadiDosha ? '⚠️ Nadi Dosha detected' : '✅ Nadi Compatibility: Perfect'}
${report.doshaSummary.bhakootDosha ? '⚠️ Bhakoot Dosha detected' : '✅ Bhakoot Compatibility: Auspicious'}
${report.doshaSummary.manglikCheck.isCompatible ? '✅ Manglik Compatibility: Favorable' : 'ℹ️ Manglik Check: Consult astrologer'}

🌐 *Check live Kundali Milan & verified Rathore Samaj profiles on Rathore Rishtey Portal*`;

    shareViaWhatsApp(text);
  };

  const buildCertificatePrintOptions = () => {
    const kootaRows = Object.values(report.kootas)
      .map(
        (k) => `
        <tr>
          <td><strong>${escapeHtml(lang === 'hi' ? k.hindiName : k.name)}</strong></td>
          <td>${k.obtainedPoints} / ${k.maxPoints}</td>
          <td>${escapeHtml(lang === 'hi' ? k.hindiDescription : k.description)}</td>
        </tr>`
      )
      .join('');

    const bodyHtml = `
      <div class="meta-grid">
        <div class="meta-box">
          <span class="meta-label">${escapeHtml(t('Groom', 'वर'))}</span>
          <span class="meta-value">${escapeHtml(report.boyName)} (${escapeHtml(lang === 'hi' ? report.boyRashi.hindiName : report.boyRashi.name)})</span>
        </div>
        <div class="meta-box">
          <span class="meta-label">${escapeHtml(t('Bride', 'वधू'))}</span>
          <span class="meta-value">${escapeHtml(report.girlName)} (${escapeHtml(lang === 'hi' ? report.girlRashi.hindiName : report.girlRashi.name)})</span>
        </div>
        <div class="meta-box">
          <span class="meta-label">${escapeHtml(t('Total Score', 'कुल गुण'))}</span>
          <span class="meta-value">${report.totalGunas} / 36 (${report.percentage}%)</span>
        </div>
        <div class="meta-box">
          <span class="meta-label">${escapeHtml(t('Verdict', 'निष्कर्ष'))}</span>
          <span class="meta-value">${escapeHtml(report.verdict.grade)} - ${escapeHtml(lang === 'hi' ? report.verdict.hindiTitle : report.verdict.title)}</span>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>${escapeHtml(t('Ashtakoot', 'अष्टकूट'))}</th>
            <th>${escapeHtml(t('Gunas', 'गुण'))}</th>
            <th>${escapeHtml(t('Analysis', 'विश्लेषण'))}</th>
          </tr>
        </thead>
        <tbody>${kootaRows}</tbody>
      </table>
      <div style="margin-top: 16px; padding: 12px; border: 1px solid #d6d3d1; border-radius: 8px; background: #faf8f5; font-size: 12px;">
        <strong>${escapeHtml(t('Dosha Summary:', 'दोष विवरण:'))}</strong>
        <ul style="margin: 6px 0 0 18px; padding: 0;">
          <li>${escapeHtml(report.doshaSummary.nadiDosha ? t('Nadi Dosha Present', 'नाड़ी दोष उपस्थित') : t('Nadi Compatible (No Dosha)', 'नाड़ी अनुकूल (कोई दोष नहीं)'))}</li>
          <li>${escapeHtml(report.doshaSummary.bhakootDosha ? t('Bhakoot Dosha Present', 'भकूट दोष उपस्थित') : t('Bhakoot Auspicious (No Dosha)', 'भकूट शुभ (कोई दोष नहीं)'))}</li>
          <li>${escapeHtml(lang === 'hi' ? report.doshaSummary.manglikCheck.hindiStatus : report.doshaSummary.manglikCheck.status)}</li>
        </ul>
      </div>
    `;

    return {
      title: `${report.boyName} & ${report.girlName} - Vedic Kundali Milan`,
      subtitle: t('Vedic Ashtakoot 36-Guna Matching Certificate', 'वैदिक अष्टकूट 36-गुण मिलान प्रमाणपत्र'),
      bodyHtml,
      filename: `kundali-milan-${report.boyName.replace(/\s+/g, '-').toLowerCase()}-${report.girlName.replace(/\s+/g, '-').toLowerCase()}`
    };
  };

  const handlePrint = () => {
    setShowPrintModal(true);
    printHtmlDocument(buildCertificatePrintOptions());
  };

  if (!authSession) {
    return (
      <div className="max-w-4xl mx-auto py-4">
        <div className="bg-white rounded-3xl shadow-xl border border-stone-200/90 overflow-hidden">
          <div className="bg-gradient-to-r from-[#24050b] via-[#380812] to-[#24050b] p-8 sm:p-10 text-white flex flex-col md:flex-row justify-between items-center gap-6 border-b border-amber-500/30">
            <div className="space-y-3 max-w-xl text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-semibold">
                <Lock className="w-3.5 h-3.5" />
                <span>{t('Sign Up Required for Kundali Milan', 'कुंडली मिलान हेतु पंजीकरण आवश्यक')}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-amber-50">
                {t('Sign Up / Sign In to Access Kundali Milan', 'कुंडली मिलान देखने के लिए साइन अप / लॉग इन करें')}
              </h2>
              <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-light">
                {t(
                  'Register or sign in to calculate authentic 36-Guna Vedic Ashtakoot compatibility, check Manglik Dosha, and print or share Kundali reports.',
                  'प्रामाणिक 36-गुण वैदिक अष्टकूट मिलान, मांगलिक दोष जाँच और कुंडली रिपोर्ट प्रिंट या शेयर करने के लिए साइन अप या लॉग इन करें।'
                )}
              </p>
            </div>

            <button
              onClick={() => onNavigateTab('signup')}
              className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-bold px-6 py-3.5 rounded-xl shadow-lg transition-all text-xs sm:text-sm shrink-0 flex items-center gap-2 cursor-pointer hover:scale-102"
            >
              <UserPlus className="w-4 h-4 text-stone-950" />
              <span>{t('Sign Up / Log In Now', 'साइन अप / लॉग इन करें')}</span>
            </button>
          </div>

          <div className="p-6 md:p-8 bg-[#FAF8F5] grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-900 border border-amber-200/60 flex items-center justify-center">
                <Compass className="w-5 h-5 text-amber-800" />
              </div>
              <h4 className="font-serif font-bold text-sm text-stone-900">{t('36-Guna Ashtakoot', '36-गुण अष्टकूट मिलान')}</h4>
              <p className="text-stone-600 leading-relaxed">
                {t('Varna, Vashya, Tara, Yoni, Graha Maitri, Gana, Bhakoot & Nadi analysis.', 'वर्ण, वश्य, तारा, योनि, ग्रह मैत्री, गण, भकूट व नाड़ी का पूर्ण विश्लेषण।')}
              </p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-900 border border-amber-200/60 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-amber-800" />
              </div>
              <h4 className="font-serif font-bold text-sm text-stone-900">{t('Manglik & Dosha Check', 'मांगलिक एवं दोष जाँच')}</h4>
              <p className="text-stone-600 leading-relaxed">
                {t('Instant Nadi, Bhakoot & Kuja Dosha evaluation with traditional safeguards.', 'नाड़ी, भकूट और मंगल दोष की तुरंत जाँच व शास्त्रीय मार्गदर्शन।')}
              </p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-900 border border-amber-200/60 flex items-center justify-center">
                <Printer className="w-5 h-5 text-amber-800" />
              </div>
              <h4 className="font-serif font-bold text-sm text-stone-900">{t('Print & WhatsApp Share', 'प्रिंट व व्हाट्सऐप शेयर')}</h4>
              <p className="text-stone-600 leading-relaxed">
                {t('Download formatted Kundali Milan certificates or share directly with family.', 'पारिवारिक चर्चा हेतु कुंडली रिपोर्ट डाउनलोड करें या व्हाट्सऐप पर भेजें।')}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-2">
      {/* SACRED HEADER BANNER */}
      <div className="bg-gradient-to-r from-[#24050b] via-[#380812] to-[#24050b] rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-amber-500/30 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('Authentic Vedic Ashtakoot 36-Guna Matching', 'प्रामाणिक वैदिक अष्टकूट 36-गुण मिलान')}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-amber-50">
              {t('Vedic Kundali Milan', 'वैदिक कुंडली मिलान (गुण मिलान)')}
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 max-w-xl font-light leading-relaxed">
              {t(
                'Calculate authentic 36-Guna matching across all 8 Vedic Kootas (Varna, Vashya, Tara, Yoni, Graha Maitri, Gana, Bhakoot, Nadi) with Manglik Dosha analysis.',
                'सभी 8 वैदिक कूटों (वर्ण, वश्य, तारा, योनि, ग्रह मैत्री, गण, भकूट, नाड़ी) के साथ प्रामाणिक 36-गुण मिलान और मांगलिक दोष विश्लेषण की तुरंत गणना करें।'
              )}
            </p>
          </div>

          {/* VEDIC SEAL BADGE */}
          <div className="flex flex-col items-center md:items-end gap-1.5 shrink-0">
            <div className="bg-amber-400/15 border border-amber-400/40 text-amber-200 px-4 py-2 rounded-2xl text-xs flex items-center gap-2 shadow-sm font-serif">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{t('100% Authentic Vedic Methodology', '100% प्रामाणिक वैदिक पद्धति')}</span>
            </div>
            <span className="text-[10px] text-amber-300/70 font-mono">
              {t('Sage Parashara Ashtakoot', 'महर्षि पराशर अष्टकूट')}
            </span>
          </div>
        </div>
      </div>

      {/* MODE SELECTOR */}
      <div className="flex justify-center">
        <div className="bg-stone-200/80 p-1.5 rounded-2xl flex items-center gap-1 shadow-inner max-w-md w-full">
          <button
            onClick={() => setMatchMode('samaj')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              matchMode === 'samaj'
                ? 'bg-[#380812] text-amber-200 shadow-sm'
                : 'text-stone-700 hover:text-stone-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{t('Select from Samaj Profiles', 'समाज प्रोफ़ाइल से चुनें')}</span>
          </button>
          <button
            onClick={() => setMatchMode('custom')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              matchMode === 'custom'
                ? 'bg-[#380812] text-amber-200 shadow-sm'
                : 'text-stone-700 hover:text-stone-900'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>{t('Enter Custom Birth Details', 'जन्म विवरण स्वयं दर्ज करें')}</span>
          </button>
        </div>
      </div>

      {/* SELECTION PANELS */}
      {matchMode === 'samaj' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 sm:p-7 rounded-3xl border border-stone-200 shadow-sm">
          {/* GROOM SELECTION */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="font-serif font-bold text-stone-900 text-sm flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center">1</span>
                <span>{t('Select Groom', 'वर चुनें')}</span>
              </h3>
              <span className="text-[11px] font-semibold text-stone-500">
                {grooms.length} {t('Verified Grooms', 'सत्यापित वर')}
              </span>
            </div>

            <select
              value={selectedBoyId}
              onChange={(e) => setSelectedBoyId(e.target.value)}
              className="w-full p-3 rounded-xl border border-stone-300 text-xs font-semibold text-stone-800 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none bg-stone-50"
            >
              {grooms.map(g => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.age} {t('Yrs', 'वर्ष')} · {g.city} · {t('Gotra', 'गोत्र')}: {g.gotra})
                </option>
              ))}
            </select>

            {activeGroom && (
              <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/80 flex items-center gap-4">
                <img
                  src={activeGroom.photo || "/KiranKumar.png"}
                  alt={activeGroom.name}
                  className="w-16 h-16 rounded-xl object-cover object-top border border-stone-300 shrink-0 shadow-xs"
                />
                <div className="min-w-0 flex-1 text-xs space-y-0.5">
                  <p className="font-bold text-stone-900 text-sm truncate">{activeGroom.name}</p>
                  <p className="text-stone-600">{activeGroom.age} {t('Yrs', 'वर्ष')} · {activeGroom.height || "5' 6\""} · {activeGroom.city}</p>
                  <p className="text-amber-900 font-semibold text-[11px]">{t('Gotra', 'गोत्र')}: {activeGroom.gotra}</p>
                  <p className="text-stone-500 text-[11px]">
                    {t('Rashi', 'राशि')}: <strong className="text-stone-800">{lang === 'hi' ? report.boyRashi.hindiName : report.boyRashi.name}</strong>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* BRIDE SELECTION */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="font-serif font-bold text-stone-900 text-sm flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-800 text-xs font-bold flex items-center justify-center">2</span>
                <span>{t('Select Bride', 'वधू चुनें')}</span>
              </h3>
              <span className="text-[11px] font-semibold text-stone-500">
                {brides.length} {t('Verified Brides', 'सत्यापित वधुएं')}
              </span>
            </div>

            <select
              value={selectedGirlId}
              onChange={(e) => setSelectedGirlId(e.target.value)}
              className="w-full p-3 rounded-xl border border-stone-300 text-xs font-semibold text-stone-800 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none bg-stone-50"
            >
              {brides.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.age} {t('Yrs', 'वर्ष')} · {b.city} · {t('Gotra', 'गोत्र')}: {b.gotra})
                </option>
              ))}
            </select>

            {activeBride && (
              <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/80 flex items-center gap-4">
                <img
                  src={activeBride.photo || "/IshikaRathore.png"}
                  alt={activeBride.name}
                  className="w-16 h-16 rounded-xl object-cover object-top border border-stone-300 shrink-0 shadow-xs"
                />
                <div className="min-w-0 flex-1 text-xs space-y-0.5">
                  <p className="font-bold text-stone-900 text-sm truncate">{activeBride.name}</p>
                  <p className="text-stone-600">{activeBride.age} {t('Yrs', 'वर्ष')} · {activeBride.height || "5' 5\""} · {activeBride.city}</p>
                  <p className="text-amber-900 font-semibold text-[11px]">{t('Gotra', 'गोत्र')}: {activeBride.gotra}</p>
                  <p className="text-stone-500 text-[11px]">
                    {t('Rashi', 'राशि')}: <strong className="text-stone-800">{lang === 'hi' ? report.girlRashi.hindiName : report.girlRashi.name}</strong>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* CUSTOM BIRTH DETAILS FORM */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 sm:p-7 rounded-3xl border border-stone-200 shadow-sm text-xs">
          {/* BOY FORM */}
          <div className="space-y-3">
            <h3 className="font-serif font-bold text-stone-900 text-sm pb-2 border-b border-stone-100 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">1</span>
              <span>{t('Groom Details', 'वर का विवरण')}</span>
            </h3>

            <div>
              <label className="font-bold text-stone-700 block mb-1">{t('Groom Name', 'वर का नाम')}</label>
              <input
                type="text"
                value={customBoyName}
                onChange={(e) => setCustomBoyName(e.target.value)}
                placeholder={t('Enter groom name', 'वर का नाम दर्ज करें')}
                className="w-full p-2.5 rounded-xl border border-stone-300 bg-stone-50"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-stone-700 block mb-1">{t('Date of Birth', 'जन्म तिथि')}</label>
                <input
                  type="date"
                  value={customBoyDob}
                  onChange={(e) => setCustomBoyDob(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 bg-stone-50"
                />
              </div>
              <div>
                <label className="font-bold text-stone-700 block mb-1">{t('Birth Time', 'जन्म समय')}</label>
                <input
                  type="time"
                  value={customBoyTime}
                  onChange={(e) => setCustomBoyTime(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 bg-stone-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-stone-700 block mb-1">{t('Rashi (Zodiac)', 'राशि')}</label>
                <select
                  value={customBoyRashi}
                  onChange={(e) => setCustomBoyRashi(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-stone-300 bg-stone-50 font-medium"
                >
                  {RASHIS.map(r => (
                    <option key={r.index} value={r.index}>
                      {lang === 'hi' ? r.hindiName : `${r.name} (Lord: ${r.lord})`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-bold text-stone-700 block mb-1">{t('Nakshatra', 'नक्षत्र')}</label>
                <select
                  value={customBoyNakshatra}
                  onChange={(e) => setCustomBoyNakshatra(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-stone-300 bg-stone-50 font-medium"
                >
                  {NAKSHATRAS.map(n => (
                    <option key={n.index} value={n.index}>{lang === 'hi' ? n.hindiName : n.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 p-2.5 bg-stone-50 rounded-xl border border-stone-200 cursor-pointer">
              <input
                type="checkbox"
                checked={customBoyManglik}
                onChange={(e) => setCustomBoyManglik(e.target.checked)}
                className="rounded border-stone-300 text-amber-700 focus:ring-amber-500"
              />
              <span className="font-bold text-stone-800">{t('Boy is Manglik (Kuja Dosha)', 'वर मांगलिक है (मंगल दोष)')}</span>
            </label>
          </div>

          {/* GIRL FORM */}
          <div className="space-y-3">
            <h3 className="font-serif font-bold text-stone-900 text-sm pb-2 border-b border-stone-100 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center font-bold text-xs">2</span>
              <span>{t('Bride Details', 'वधू का विवरण')}</span>
            </h3>

            <div>
              <label className="font-bold text-stone-700 block mb-1">{t('Bride Name', 'वधू का नाम')}</label>
              <input
                type="text"
                value={customGirlName}
                onChange={(e) => setCustomGirlName(e.target.value)}
                placeholder={t('Enter bride name', 'वधू का नाम दर्ज करें')}
                className="w-full p-2.5 rounded-xl border border-stone-300 bg-stone-50"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-stone-700 block mb-1">{t('Date of Birth', 'जन्म तिथि')}</label>
                <input
                  type="date"
                  value={customGirlDob}
                  onChange={(e) => setCustomGirlDob(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 bg-stone-50"
                />
              </div>
              <div>
                <label className="font-bold text-stone-700 block mb-1">{t('Birth Time', 'जन्म समय')}</label>
                <input
                  type="time"
                  value={customGirlTime}
                  onChange={(e) => setCustomGirlTime(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 bg-stone-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-stone-700 block mb-1">{t('Rashi (Zodiac)', 'राशि')}</label>
                <select
                  value={customGirlRashi}
                  onChange={(e) => setCustomGirlRashi(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-stone-300 bg-stone-50 font-medium"
                >
                  {RASHIS.map(r => (
                    <option key={r.index} value={r.index}>
                      {lang === 'hi' ? r.hindiName : `${r.name} (Lord: ${r.lord})`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-bold text-stone-700 block mb-1">{t('Nakshatra', 'नक्षत्र')}</label>
                <select
                  value={customGirlNakshatra}
                  onChange={(e) => setCustomGirlNakshatra(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-stone-300 bg-stone-50 font-medium"
                >
                  {NAKSHATRAS.map(n => (
                    <option key={n.index} value={n.index}>{lang === 'hi' ? n.hindiName : n.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 p-2.5 bg-stone-50 rounded-xl border border-stone-200 cursor-pointer">
              <input
                type="checkbox"
                checked={customGirlManglik}
                onChange={(e) => setCustomGirlManglik(e.target.checked)}
                className="rounded border-stone-300 text-amber-700 focus:ring-amber-500"
              />
              <span className="font-bold text-stone-800">{t('Girl is Manglik (Kuja Dosha)', 'वधू मांगलिक है (मंगल दोष)')}</span>
            </label>
          </div>
        </div>
      )}

      {/* KUNDALI MILAN SCORECARD REPORT */}
      <div className="bg-white rounded-3xl border-2 border-amber-300/80 shadow-xl overflow-hidden print:border-none print:shadow-none">
        {/* Certificate Top Banner */}
        <div className="bg-gradient-to-r from-[#4c0d1b] via-[#631024] to-[#4c0d1b] p-6 sm:p-8 text-white text-center border-b border-amber-400/40 relative">
          <p className="text-amber-300 font-serif tracking-widest text-xs font-semibold mb-1">
            {t('Shubh Vivah • Vedic Ashtakoot 36-Guna Matching Report', 'शुभ विवाह • वैदिक अष्टकूट 36-गुण मिलान रिपोर्ट')}
          </p>
          <h3 className="text-2xl sm:text-3xl font-serif font-bold text-amber-100">
            {report.boyName} & {report.girlName}
          </h3>
          <p className="text-xs text-amber-200/90 mt-1 font-medium">
            {t('Groom Rashi', 'वर राशि')}: {lang === 'hi' ? report.boyRashi.hindiName : report.boyRashi.name} ({lang === 'hi' ? report.boyNakshatra.hindiName : report.boyNakshatra.name}) · {t('Bride Rashi', 'वधू राशि')}: {lang === 'hi' ? report.girlRashi.hindiName : report.girlRashi.name} ({lang === 'hi' ? report.girlNakshatra.hindiName : report.girlNakshatra.name})
          </p>

          {/* Large Score Indicator */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-6">
            <div className="w-32 h-32 rounded-3xl bg-white/10 backdrop-blur-md border-2 border-amber-300 flex flex-col items-center justify-center text-center shadow-lg">
              <span className="text-4xl font-extrabold text-amber-300 font-serif leading-none">
                {report.totalGunas}
              </span>
              <span className="text-xs uppercase tracking-wider text-stone-300 font-semibold mt-1">
                {t('out of 36 Gunas', '36 गुणों में से')}
              </span>
              <span className="text-[11px] text-amber-200 font-bold mt-0.5">
                {report.percentage}% {t('Match', 'मिलान')}
              </span>
            </div>

            <div className="text-center sm:text-left max-w-md space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-xs font-bold">
                <Award className="w-3.5 h-3.5" />
                <span>{report.verdict.grade}: {lang === 'hi' ? report.verdict.hindiTitle : report.verdict.title}</span>
              </div>
              <p className="font-serif text-amber-50 font-bold text-base leading-snug">
                {lang === 'hi' ? report.verdict.hindiTitle : report.verdict.title}
              </p>
              <p className="text-xs text-stone-300 leading-relaxed font-light">
                {lang === 'hi' ? report.verdict.hindiRecommendation : report.verdict.recommendation}
              </p>
            </div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="bg-[#FAF8F5] px-6 py-3.5 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-stone-700">
            <span className="font-bold text-stone-900">{t('Scorecard Actions:', 'रिपोर्ट विकल्प:')}</span>
            <span className="text-stone-500 hidden sm:inline">
              {t('Share with families or print authentic report', 'परिवारजनों के साथ साझा करें या प्रमाणपत्र प्रिंट करें')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShareWhatsApp}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{t('Share on WhatsApp', 'व्हाट्सएप पर साझा करें')}</span>
            </button>
            <button
              onClick={handlePrint}
              className="bg-stone-200 hover:bg-stone-300 text-stone-800 font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t('Print Certificate', 'प्रिंट करें')}</span>
            </button>
          </div>
        </div>

        {/* 8 KOOTAS DETAILED BREAKDOWN TABLE */}
        <div className="p-6 sm:p-8 space-y-6">
          <div>
            <h4 className="text-base font-serif font-bold text-stone-900 mb-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-700" />
              <span>{t('Detailed Ashtakoot (8 Kootas) Analysis', 'विस्तृत अष्टकूट (8 कूट) विश्लेषण')}</span>
            </h4>
            <p className="text-xs text-stone-500">
              {t(
                'Each Koota analyzes an essential pillar of marital compatibility according to ancient Vedic scriptures.',
                'प्रत्येक कूट प्राचीन वैदिक शास्त्रों के अनुसार वैवाहिक अनुकूलता के एक प्रमुख आधार का विश्लेषण करता है।'
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.values(report.kootas).map((koota) => {
              const isFull = koota.obtainedPoints === koota.maxPoints;
              const isZero = koota.obtainedPoints === 0;

              return (
                <div 
                  key={koota.name}
                  className={`p-4 rounded-2xl border transition-all text-xs flex flex-col justify-between ${
                    isFull 
                      ? 'bg-emerald-50/60 border-emerald-200' 
                      : isZero 
                        ? 'bg-rose-50/60 border-rose-200' 
                        : 'bg-amber-50/60 border-amber-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5 gap-2">
                      <span className="font-bold text-stone-900 text-sm font-serif">
                        {lang === 'hi' ? koota.hindiName : koota.name}
                      </span>
                      <span className={`font-mono font-bold px-2 py-0.5 rounded-lg text-xs shrink-0 ${
                        isFull 
                          ? 'bg-emerald-200/70 text-emerald-900' 
                          : isZero 
                            ? 'bg-rose-200/70 text-rose-900' 
                            : 'bg-amber-200/70 text-amber-900'
                      }`}>
                        {koota.obtainedPoints} / {koota.maxPoints}
                      </span>
                    </div>

                    <p className="text-stone-600 text-[11px] leading-relaxed">
                      {lang === 'hi' ? koota.hindiDescription : koota.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-stone-200/60 flex items-center justify-between text-[10px] text-stone-500">
                    <span>{t('Vedic Weight:', 'अधिकतम अंक:')} {koota.maxPoints} {t('Gunas', 'गुण')}</span>
                    {isFull ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3" /> {t('Full Match', 'पूर्ण मिलान')}
                      </span>
                    ) : isZero ? (
                      <span className="text-rose-700 font-bold flex items-center gap-0.5">
                        <AlertTriangle className="w-3 h-3" /> {t('Dosha / 0 Pts', 'दोष / 0 अंक')}
                      </span>
                    ) : (
                      <span className="text-amber-800 font-bold">{t('Partial Match', 'आंशिक मिलान')}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* DOSHAS & REMEDIES CARD */}
          <div className="bg-[#FAF8F5] p-5 sm:p-6 rounded-2xl border border-stone-200 space-y-4 text-xs">
            <h5 className="font-serif font-bold text-sm text-stone-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-800" />
              <span>{t('Dosha Examination & Astrological Safeguards', 'दोष परीक्षण एवं ज्योतिषीय उपाय')}</span>
            </h5>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Nadi Dosha */}
              <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-1">
                <span className="text-[10px] font-bold uppercase text-stone-400">{t('1. Nadi Balance:', '1. नाड़ी संतुलन:')}</span>
                <p className="font-bold text-stone-800 text-xs">
                  {report.doshaSummary.nadiDosha 
                    ? t('⚠️ Nadi Dosha Present', '⚠️ नाड़ी दोष उपस्थित') 
                    : t('✅ Nadi Compatible (No Dosha)', '✅ नाड़ी अनुकूल (कोई दोष नहीं)')}
                </p>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  {lang === 'hi' ? report.kootas.nadi.hindiDescription : report.kootas.nadi.description}
                </p>
              </div>

              {/* Bhakoot Dosha */}
              <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-1">
                <span className="text-[10px] font-bold uppercase text-stone-400">{t('2. Bhakoot Alignment:', '2. भकूट मिलान:')}</span>
                <p className="font-bold text-stone-800 text-xs">
                  {report.doshaSummary.bhakootDosha 
                    ? t('⚠️ Bhakoot Dosha Present', '⚠️ भकूट दोष उपस्थित') 
                    : t('✅ Bhakoot Auspicious (No Dosha)', '✅ भकूट शुभ (कोई दोष नहीं)')}
                </p>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  {lang === 'hi' ? report.kootas.bhakoot.hindiDescription : report.kootas.bhakoot.description}
                </p>
              </div>

              {/* Manglik Check */}
              <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-1">
                <span className="text-[10px] font-bold uppercase text-stone-400">{t('3. Manglik (Kuja) Analysis:', '3. मांगलिक (मंगल) विश्लेषण:')}</span>
                <p className="font-bold text-stone-800 text-xs">
                  {report.doshaSummary.manglikCheck.isCompatible 
                    ? t('✅ Auspicious Manglik Harmony', '✅ शुभ मांगलिक सामंजस्य') 
                    : t('ℹ️ Manglik Consultation Required', 'ℹ️ ज्योतिषीय परामर्श आवश्यक')}
                </p>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  {lang === 'hi' ? report.doshaSummary.manglikCheck.hindiStatus : report.doshaSummary.manglikCheck.status}
                </p>
              </div>
            </div>

            {/* Classical astrological attribution */}
            <div className="pt-3 border-t border-stone-200 flex flex-col sm:flex-row justify-between items-center text-[11px] text-stone-500 gap-2">
              <span>
                {t('Based on classical Sage Parashara Vedic Jyotish Ashtakoot guidelines.', 'प्राचीन महर्षि पराशर वैदिक ज्योतिष अष्टकूट नियमों पर आधारित।')}
              </span>
              <span className="text-stone-400 font-medium">
                {t('Rathore Rishtey Astrological Consultation', 'राठौर रिश्ते ज्योतिष परामर्श')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* PRINT & DOWNLOAD CERTIFICATE MODAL */}
      {showPrintModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowPrintModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-amber-300 relative space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowPrintModal(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-serif font-bold text-stone-900 flex items-center gap-2">
              <Printer className="w-5 h-5 text-amber-800" />
              <span>{t('Print / Save Kundali Certificate', 'कुंडली प्रमाणपत्र प्रिंट / सेव करें')}</span>
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              {t(
                'Print directly or download a clean printable sheet for offline viewing and PDF export.',
                'सीधे प्रिंट करें या ऑफलाइन देखने व PDF सेव करने के लिए प्रिंट योग्य फ़ाइल डाउनलोड करें।'
              )}
            </p>

            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 text-xs space-y-1">
              <p className="font-bold text-stone-900">{report.boyName} &amp; {report.girlName}</p>
              <p className="text-amber-900 font-semibold">{report.totalGunas} / 36 {t('Gunas', 'गुण')} ({report.percentage}%)</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => printHtmlDocument(buildCertificatePrintOptions())}
                className="flex-1 bg-[#380812] hover:bg-[#24050b] text-amber-200 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>{t('Print Now', 'अभी प्रिंट करें')}</span>
              </button>
              <button
                type="button"
                onClick={() => downloadPrintableHtml(buildCertificatePrintOptions())}
                className="flex-1 bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{t('Download Sheet (.html)', 'शीट डाउनलोड (.html)')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

