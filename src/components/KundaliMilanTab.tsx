import React, { useState, useMemo, useEffect } from 'react';
import { 
  Sparkles, Heart, ShieldCheck, Share2, Printer, 
  ArrowRight, Users, CheckCircle2, AlertTriangle, Info,
  Flame, RefreshCw, Star, Compass, Award, Lock, UserPlus, Download, FileText, X, Search
} from 'lucide-react';
import { MatrimonyProfile, TabType, AuthSession } from '../types';
import { 
  RASHIS, NAKSHATRAS, performKundaliMilan, inferRashiIndex, deriveBirthChartIndices,
  KundaliMilanReport 
} from '../utils/kundaliMilan';
import { useLanguage } from '../context/LanguageContext';
import { useAdminConfig } from '../context/AdminConfigContext';
import { buildAppShareUrl, shareContent, printHtmlDocument, downloadPrintableHtml, escapeHtml } from '../utils/shareAndPrint';
import { generateAndDownloadKundaliPdf } from '../utils/bookletPdfGenerator';

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
  const { config } = useAdminConfig();
  const [matchMode, setMatchMode] = useState<'samaj' | 'custom'>('samaj');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printFallbackNotice, setPrintFallbackNotice] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadStatusMsg, setDownloadStatusMsg] = useState<string | null>(null);

  // Grooms & Brides from Samaj Profiles
  const grooms = useMemo(() => profiles.filter(p => p.gender === 'Male'), [profiles]);
  const brides = useMemo(() => profiles.filter(p => p.gender === 'Female'), [profiles]);

  // Search filters alongside Select dropdowns
  const [boySearch, setBoySearch] = useState('');
  const [girlSearch, setGirlSearch] = useState('');

  const filteredGrooms = useMemo(() => {
    const q = boySearch.toLowerCase().trim();
    if (!q) return grooms;
    return grooms.filter(g =>
      g.name.toLowerCase().includes(q) ||
      g.gotra.toLowerCase().includes(q) ||
      g.city.toLowerCase().includes(q) ||
      (g.education && g.education.toLowerCase().includes(q)) ||
      (g.profession && g.profession.toLowerCase().includes(q))
    );
  }, [grooms, boySearch]);

  const filteredBrides = useMemo(() => {
    const q = girlSearch.toLowerCase().trim();
    if (!q) return brides;
    return brides.filter(b =>
      b.name.toLowerCase().includes(q) ||
      b.gotra.toLowerCase().includes(q) ||
      b.city.toLowerCase().includes(q) ||
      (b.education && b.education.toLowerCase().includes(q)) ||
      (b.profession && b.profession.toLowerCase().includes(q))
    );
  }, [brides, girlSearch]);

  // Selected profile IDs (empty until user selects or deep-linked from a profile)
  const [selectedBoyId, setSelectedBoyId] = useState<number | string | null>(() => {
    return preselectedBoyId ?? null;
  });

  const [selectedGirlId, setSelectedGirlId] = useState<number | string | null>(() => {
    return preselectedGirlId ?? null;
  });

  // Custom Form State (Name, DOB, Birth Time, Birth Place) — empty by default
  const [customBoyName, setCustomBoyName] = useState('');
  const [customBoyDob, setCustomBoyDob] = useState('');
  const [customBoyTime, setCustomBoyTime] = useState('');
  const [customBoyPlace, setCustomBoyPlace] = useState('');

  const [customGirlName, setCustomGirlName] = useState('');
  const [customGirlDob, setCustomGirlDob] = useState('');
  const [customGirlTime, setCustomGirlTime] = useState('');
  const [customGirlPlace, setCustomGirlPlace] = useState('');

  // Sync preselected candidates if provided
  useEffect(() => {
    if (preselectedBoyId) setSelectedBoyId(preselectedBoyId);
    if (preselectedGirlId) setSelectedGirlId(preselectedGirlId);
  }, [preselectedBoyId, preselectedGirlId]);

  // Get active groom and bride (no automatic fallback selection)
  const activeGroom = useMemo(() => {
    if (selectedBoyId === null || selectedBoyId === undefined || selectedBoyId === '') return null;
    return grooms.find(g => g.id.toString() === selectedBoyId.toString()) || null;
  }, [grooms, selectedBoyId]);

  const activeBride = useMemo(() => {
    if (selectedGirlId === null || selectedGirlId === undefined || selectedGirlId === '') return null;
    return brides.find(b => b.id.toString() === selectedGirlId.toString()) || null;
  }, [brides, selectedGirlId]);

  const activeGroomRashi = useMemo(() => {
    if (!activeGroom) return null;
    return RASHIS[inferRashiIndex(activeGroom.about || activeGroom.name) % 12];
  }, [activeGroom]);

  const activeBrideRashi = useMemo(() => {
    if (!activeBride) return null;
    return RASHIS[inferRashiIndex(activeBride.about || activeBride.name) % 12];
  }, [activeBride]);

  const isCustomBoyComplete = Boolean(
    customBoyName.trim() && customBoyDob.trim() && customBoyTime.trim() && customBoyPlace.trim()
  );
  const isCustomGirlComplete = Boolean(
    customGirlName.trim() && customGirlDob.trim() && customGirlTime.trim() && customGirlPlace.trim()
  );
  const isCustomReady = isCustomBoyComplete && isCustomGirlComplete;
  const hasAnyCustomInput = Boolean(
    customBoyName.trim() || customBoyDob.trim() || customBoyTime.trim() || customBoyPlace.trim() ||
    customGirlName.trim() || customGirlDob.trim() || customGirlTime.trim() || customGirlPlace.trim()
  );

  // Compute Report ONLY when user has provided required details for both Groom & Bride
  const report: KundaliMilanReport | null = useMemo(() => {
    if (matchMode === 'samaj') {
      if (!activeGroom || !activeBride) return null;

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
      if (!isCustomReady) return null;

      const boyChart = deriveBirthChartIndices(
        customBoyName,
        customBoyDob,
        customBoyTime,
        customBoyPlace
      );
      const girlChart = deriveBirthChartIndices(
        customGirlName,
        customGirlDob,
        customGirlTime,
        customGirlPlace
      );

      return performKundaliMilan(
        customBoyName.trim(),
        customGirlName.trim(),
        boyChart.rashiIndex,
        girlChart.rashiIndex,
        boyChart.nakshatraIndex,
        girlChart.nakshatraIndex,
        false,
        false
      );
    }
  }, [
    matchMode,
    activeGroom,
    activeBride,
    isCustomReady,
    customBoyName,
    customBoyDob,
    customBoyTime,
    customBoyPlace,
    customGirlName,
    customGirlDob,
    customGirlTime,
    customGirlPlace
  ]);

  const handleResetCustomDetails = () => {
    setCustomBoyName('');
    setCustomBoyDob('');
    setCustomBoyTime('');
    setCustomBoyPlace('');
    setCustomGirlName('');
    setCustomGirlDob('');
    setCustomGirlTime('');
    setCustomGirlPlace('');
  };

  const handleShareWhatsApp = () => {
    if (!report) return;
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

    void shareContent({
      title: `${report.boyName} & ${report.girlName} — ${report.totalGunas}/36 Gunas Kundali Milan`,
      text,
      url: buildAppShareUrl('kundali')
    });
  };

  const buildCertificatePrintOptions = (targetReport: KundaliMilanReport) => {
    const kootaRows = Object.values(targetReport.kootas)
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
          <span class="meta-value">${escapeHtml(targetReport.boyName)} (${escapeHtml(lang === 'hi' ? targetReport.boyRashi.hindiName : targetReport.boyRashi.name)})</span>
        </div>
        <div class="meta-box">
          <span class="meta-label">${escapeHtml(t('Bride', 'वधू'))}</span>
          <span class="meta-value">${escapeHtml(targetReport.girlName)} (${escapeHtml(lang === 'hi' ? targetReport.girlRashi.hindiName : targetReport.girlRashi.name)})</span>
        </div>
        <div class="meta-box">
          <span class="meta-label">${escapeHtml(t('Total Score', 'कुल गुण'))}</span>
          <span class="meta-value">${targetReport.totalGunas} / 36 (${targetReport.percentage}%)</span>
        </div>
        <div class="meta-box">
          <span class="meta-label">${escapeHtml(t('Verdict', 'निष्कर्ष'))}</span>
          <span class="meta-value">${escapeHtml(targetReport.verdict.grade)} - ${escapeHtml(lang === 'hi' ? targetReport.verdict.hindiTitle : targetReport.verdict.title)}</span>
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
          <li>${escapeHtml(targetReport.doshaSummary.nadiDosha ? t('Nadi Dosha Present', 'नाड़ी दोष उपस्थित') : t('Nadi Compatible (No Dosha)', 'नाड़ी अनुकूल (कोई दोष नहीं)'))}</li>
          <li>${escapeHtml(targetReport.doshaSummary.bhakootDosha ? t('Bhakoot Dosha Present', 'भकूट दोष उपस्थित') : t('Bhakoot Auspicious (No Dosha)', 'भकूट शुभ (कोई दोष नहीं)'))}</li>
          <li>${escapeHtml(lang === 'hi' ? targetReport.doshaSummary.manglikCheck.hindiStatus : targetReport.doshaSummary.manglikCheck.status)}</li>
        </ul>
      </div>
    `;

    const sanitizeSlug = (val: string) =>
      val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 24);
    const boySlug = sanitizeSlug(targetReport.boyName) || 'groom';
    const girlSlug = sanitizeSlug(targetReport.girlName) || 'bride';

    return {
      title: `${targetReport.boyName} & ${targetReport.girlName} - Vedic Kundali Milan`,
      subtitle: t('Vedic Ashtakoot 36-Guna Matching Certificate', 'वैदिक अष्टकूट 36-गुण मिलान प्रमाणपत्र'),
      bodyHtml,
      filename: `kundali-milan-${boySlug}-${girlSlug}`
    };
  };

  const handlePrint = () => {
    if (!report) return;
    setDownloadStatusMsg(null);
    setShowPrintModal(true);
    const printed = printHtmlDocument(buildCertificatePrintOptions(report));
    setPrintFallbackNotice(!printed);
  };

  const handleDownloadKundaliPdf = async () => {
    if (!report || downloadingPdf) return;
    setDownloadingPdf(true);
    setDownloadStatusMsg(null);
    try {
      const opts = buildCertificatePrintOptions(report);
      const res = await generateAndDownloadKundaliPdf(report, lang, opts.filename);
      if (res === 'shared') {
        setDownloadStatusMsg(t('PDF shared / saved!', 'PDF साझा / सेव हो गई!'));
      } else if (res === 'downloaded') {
        setDownloadStatusMsg(t('PDF downloaded!', 'PDF डाउनलोड हो गई!'));
      }
    } catch {
      setDownloadStatusMsg(t('Could not create PDF. Please try Download Sheet.', 'PDF नहीं बन सकी। कृपया शीट डाउनलोड करें।'));
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadKundaliHtml = async () => {
    if (!report) return;
    setDownloadStatusMsg(null);
    const res = await downloadPrintableHtml(buildCertificatePrintOptions(report));
    if (res !== 'cancelled') {
      setDownloadStatusMsg(t('Printable sheet saved!', 'प्रिंट शीट सेव हो गई!'));
    }
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-5 sm:p-7 rounded-3xl border border-stone-200 shadow-sm">
          {/* GROOM SELECTION */}
          <div className="space-y-3.5 min-w-0">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100 gap-2">
              <h3 className="font-serif font-bold text-stone-900 text-sm flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center shrink-0">1</span>
                <span>{t('Search & Select Groom', 'वर खोजें एवं चुनें')}</span>
              </h3>
              <span className="text-[11px] font-semibold text-stone-500 shrink-0">
                {boySearch.trim()
                  ? t(`${filteredGrooms.length} of ${grooms.length}`, `${filteredGrooms.length} / ${grooms.length}`)
                  : `${grooms.length} ${t('Verified Grooms', 'सत्यापित वर')}`}
              </span>
            </div>

            {/* Search Groom Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={boySearch}
                onChange={(e) => setBoySearch(e.target.value)}
                placeholder={t('Search groom by name, gotra, city...', 'नाम, गोत्र या शहर से वर खोजें...')}
                className="w-full pl-8 pr-8 py-2.5 rounded-xl border border-stone-200 text-xs text-stone-800 focus:ring-2 focus:ring-amber-500/60 focus:border-amber-500 outline-none bg-white"
              />
              {boySearch && (
                <button
                  type="button"
                  onClick={() => setBoySearch('')}
                  aria-label={t('Clear groom search', 'खोज साफ़ करें')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div
              role="listbox"
              aria-label={t('Select Groom', 'वर चुनें')}
              className="max-h-56 overflow-y-auto rounded-xl border border-stone-200 divide-y divide-stone-100 bg-white"
            >
              {filteredGrooms.length === 0 ? (
                <div className="p-4 text-center text-xs text-stone-500">
                  {t('No matching grooms found', 'कोई वर नहीं मिला')}
                </div>
              ) : (
                filteredGrooms.map((g) => {
                  const isSelected = selectedBoyId !== null && g.id.toString() === selectedBoyId.toString();
                  return (
                    <button
                      key={g.id}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => setSelectedBoyId(g.id)}
                      className={`w-full text-left px-3 py-2.5 flex items-center gap-3 transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-amber-50/90 text-[#380812]'
                          : 'hover:bg-stone-50 text-stone-800'
                      }`}
                    >
                      <img
                        src={g.photo || '/KiranKumar.png'}
                        alt={g.name}
                        className="w-9 h-9 rounded-lg object-cover object-top border border-stone-200 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs truncate ${isSelected ? 'font-bold text-[#380812]' : 'font-semibold text-stone-900'}`}>
                          {g.name}
                        </p>
                        <p className="text-[11px] text-stone-500 truncate">
                          {g.age} {t('Yrs', 'वर्ष')} · {g.city} · {t('Gotra', 'गोत्र')}: {g.gotra}
                        </p>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-[#851834] shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {boySearch.trim() && filteredGrooms.length === 0 && (
              <div className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 flex items-center justify-between gap-2">
                <span>{t('No groom matched your search.', 'खोज से कोई वर नहीं मिला।')}</span>
                <button
                  type="button"
                  onClick={() => setBoySearch('')}
                  className="font-bold underline cursor-pointer shrink-0"
                >
                  {t('Reset', 'रीसेट')}
                </button>
              </div>
            )}

            {activeGroom && activeGroomRashi && (
              <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/80 flex items-center gap-4">
                <img
                  src={activeGroom.photo || "/KiranKumar.png"}
                  alt={activeGroom.name}
                  className="w-16 h-16 rounded-xl object-cover object-top border border-stone-300 shrink-0 shadow-xs"
                />
                <div className="min-w-0 flex-1 text-xs space-y-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-stone-900 text-sm truncate">{activeGroom.name}</p>
                    <button
                      type="button"
                      onClick={() => setSelectedBoyId(null)}
                      className="text-[11px] font-semibold text-stone-500 hover:text-rose-700 shrink-0 cursor-pointer"
                    >
                      {t('Clear', 'हटाएं')}
                    </button>
                  </div>
                  <p className="text-stone-600">{activeGroom.age} {t('Yrs', 'वर्ष')} · {activeGroom.height || "5' 6\""} · {activeGroom.city}</p>
                  <p className="text-amber-900 font-semibold text-[11px]">{t('Gotra', 'गोत्र')}: {activeGroom.gotra}</p>
                  <p className="text-stone-500 text-[11px]">
                    {t('Rashi', 'राशि')}: <strong className="text-stone-800">{lang === 'hi' ? activeGroomRashi.hindiName : activeGroomRashi.name}</strong>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* BRIDE SELECTION */}
          <div className="space-y-3.5 min-w-0">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100 gap-2">
              <h3 className="font-serif font-bold text-stone-900 text-sm flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-800 text-xs font-bold flex items-center justify-center shrink-0">2</span>
                <span>{t('Search & Select Bride', 'वधू खोजें एवं चुनें')}</span>
              </h3>
              <span className="text-[11px] font-semibold text-stone-500 shrink-0">
                {girlSearch.trim()
                  ? t(`${filteredBrides.length} of ${brides.length}`, `${filteredBrides.length} / ${brides.length}`)
                  : `${brides.length} ${t('Verified Brides', 'सत्यापित वधुएं')}`}
              </span>
            </div>

            {/* Search Bride Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={girlSearch}
                onChange={(e) => setGirlSearch(e.target.value)}
                placeholder={t('Search bride by name, gotra, city...', 'नाम, गोत्र या शहर से वधू खोजें...')}
                className="w-full pl-8 pr-8 py-2.5 rounded-xl border border-stone-200 text-xs text-stone-800 focus:ring-2 focus:ring-amber-500/60 focus:border-amber-500 outline-none bg-white"
              />
              {girlSearch && (
                <button
                  type="button"
                  onClick={() => setGirlSearch('')}
                  aria-label={t('Clear bride search', 'खोज साफ़ करें')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div
              role="listbox"
              aria-label={t('Select Bride', 'वधू चुनें')}
              className="max-h-56 overflow-y-auto rounded-xl border border-stone-200 divide-y divide-stone-100 bg-white"
            >
              {filteredBrides.length === 0 ? (
                <div className="p-4 text-center text-xs text-stone-500">
                  {t('No matching brides found', 'कोई वधू नहीं मिली')}
                </div>
              ) : (
                filteredBrides.map((b) => {
                  const isSelected = selectedGirlId !== null && b.id.toString() === selectedGirlId.toString();
                  return (
                    <button
                      key={b.id}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => setSelectedGirlId(b.id)}
                      className={`w-full text-left px-3 py-2.5 flex items-center gap-3 transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-rose-50/90 text-[#380812]'
                          : 'hover:bg-stone-50 text-stone-800'
                      }`}
                    >
                      <img
                        src={b.photo || '/IshikaRathore.png'}
                        alt={b.name}
                        className="w-9 h-9 rounded-lg object-cover object-top border border-stone-200 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs truncate ${isSelected ? 'font-bold text-[#380812]' : 'font-semibold text-stone-900'}`}>
                          {b.name}
                        </p>
                        <p className="text-[11px] text-stone-500 truncate">
                          {b.age} {t('Yrs', 'वर्ष')} · {b.city} · {t('Gotra', 'गोत्र')}: {b.gotra}
                        </p>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-[#851834] shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {girlSearch.trim() && filteredBrides.length === 0 && (
              <div className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 flex items-center justify-between gap-2">
                <span>{t('No bride matched your search.', 'खोज से कोई वधू नहीं मिली।')}</span>
                <button
                  type="button"
                  onClick={() => setGirlSearch('')}
                  className="font-bold underline cursor-pointer shrink-0"
                >
                  {t('Reset', 'रीसेट')}
                </button>
              </div>
            )}

            {activeBride && activeBrideRashi && (
              <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/80 flex items-center gap-4">
                <img
                  src={activeBride.photo || "/IshikaRathore.png"}
                  alt={activeBride.name}
                  className="w-16 h-16 rounded-xl object-cover object-top border border-stone-300 shrink-0 shadow-xs"
                />
                <div className="min-w-0 flex-1 text-xs space-y-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-stone-900 text-sm truncate">{activeBride.name}</p>
                    <button
                      type="button"
                      onClick={() => setSelectedGirlId(null)}
                      className="text-[11px] font-semibold text-stone-500 hover:text-rose-700 shrink-0 cursor-pointer"
                    >
                      {t('Clear', 'हटाएं')}
                    </button>
                  </div>
                  <p className="text-stone-600">{activeBride.age} {t('Yrs', 'वर्ष')} · {activeBride.height || "5' 5\""} · {activeBride.city}</p>
                  <p className="text-amber-900 font-semibold text-[11px]">{t('Gotra', 'गोत्र')}: {activeBride.gotra}</p>
                  <p className="text-stone-500 text-[11px]">
                    {t('Rashi', 'राशि')}: <strong className="text-stone-800">{lang === 'hi' ? activeBrideRashi.hindiName : activeBrideRashi.name}</strong>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* CUSTOM BIRTH DETAILS FORM — Name, DOB, Birth Time, Birth Place only */
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-stone-200 shadow-sm text-xs space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* BOY FORM */}
            <div className="space-y-3.5">
              <h3 className="font-serif font-bold text-stone-900 text-sm pb-2 border-b border-stone-100 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">1</span>
                <span>{t('Groom Details', 'वर का विवरण')}</span>
              </h3>

              <div>
                <label className="font-bold text-stone-700 block mb-1">{t('Name', 'नाम')} *</label>
                <input
                  type="text"
                  value={customBoyName}
                  onChange={(e) => setCustomBoyName(e.target.value)}
                  placeholder={t('Enter groom name', 'वर का नाम दर्ज करें')}
                  className="w-full p-2.5 rounded-xl border border-stone-300 bg-stone-50 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">{t('DOB (Date of Birth)', 'जन्म तिथि')} *</label>
                  <input
                    type="date"
                    value={customBoyDob}
                    onChange={(e) => setCustomBoyDob(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 bg-stone-50 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">{t('Birth Time', 'जन्म समय')} *</label>
                  <input
                    type="time"
                    value={customBoyTime}
                    onChange={(e) => setCustomBoyTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 bg-stone-50 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">{t('Birth Place', 'जन्म स्थान')} *</label>
                <input
                  type="text"
                  value={customBoyPlace}
                  onChange={(e) => setCustomBoyPlace(e.target.value)}
                  placeholder={t('Enter birth city / place (e.g., Indore)', 'जन्म स्थान दर्ज करें (जैसे: इंदौर)')}
                  className="w-full p-2.5 rounded-xl border border-stone-300 bg-stone-50 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none"
                />
              </div>
            </div>

            {/* GIRL FORM */}
            <div className="space-y-3.5">
              <h3 className="font-serif font-bold text-stone-900 text-sm pb-2 border-b border-stone-100 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center font-bold text-xs">2</span>
                <span>{t('Bride Details', 'वधू का विवरण')}</span>
              </h3>

              <div>
                <label className="font-bold text-stone-700 block mb-1">{t('Name', 'नाम')} *</label>
                <input
                  type="text"
                  value={customGirlName}
                  onChange={(e) => setCustomGirlName(e.target.value)}
                  placeholder={t('Enter bride name', 'वधू का नाम दर्ज करें')}
                  className="w-full p-2.5 rounded-xl border border-stone-300 bg-stone-50 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">{t('DOB (Date of Birth)', 'जन्म तिथि')} *</label>
                  <input
                    type="date"
                    value={customGirlDob}
                    onChange={(e) => setCustomGirlDob(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 bg-stone-50 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">{t('Birth Time', 'जन्म समय')} *</label>
                  <input
                    type="time"
                    value={customGirlTime}
                    onChange={(e) => setCustomGirlTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 bg-stone-50 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">{t('Birth Place', 'जन्म स्थान')} *</label>
                <input
                  type="text"
                  value={customGirlPlace}
                  onChange={(e) => setCustomGirlPlace(e.target.value)}
                  placeholder={t('Enter birth city / place (e.g., Nanded)', 'जन्म स्थान दर्ज करें (जैसे: नांदेड़)')}
                  className="w-full p-2.5 rounded-xl border border-stone-300 bg-stone-50 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none"
                />
              </div>
            </div>
          </div>

          {hasAnyCustomInput && (
            <div className="pt-3 border-t border-stone-100 flex justify-end">
              <button
                type="button"
                onClick={handleResetCustomDetails}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-600 font-semibold text-xs cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{t('Clear Details', 'विवरण साफ़ करें')}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* KUNDALI MILAN SCORECARD REPORT — Shown ONLY after details are filled */}
      {report ? (
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
            {config.featureWhatsAppShareEnabled && (
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{t('Share Report', 'रिपोर्ट साझा करें')}</span>
              </button>
            )}
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

            {config.kundaliAstrologerServiceEnabled && (
              <div className="mt-3 bg-gradient-to-r from-amber-50 to-rose-50/60 border border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-serif font-bold text-stone-900 text-xs flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-600 fill-amber-500" />
                    <span>{t('Pandit & Vedic Astrologer Patrika Verification', 'पंडित जी द्वारा वैदिक पत्रिका एवं दोष निवारण परामर्श')}</span>
                  </p>
                  <p className="text-[11px] text-stone-600 leading-relaxed">
                    {t(
                      'For detailed Manglik, Nadi Dosha Puja, and Shubh Muhurat guidance, share this 36-Guna scorecard with your family Samaj Pandit.',
                      'मांगलिक, नाड़ी दोष निवारण एवं शुभ विवाह मुहूर्त हेतु यह 36-गुण मिलान रिपोर्ट अपने कुलगुरु / समाज पंडित जी को दिखाएँ।'
                    )}
                  </p>
                </div>
                {config.featureWhatsAppShareEnabled && (
                  <button
                    type="button"
                    onClick={handleShareWhatsApp}
                    className="bg-[#380812] hover:bg-[#24050b] text-amber-200 font-bold px-3.5 py-2 rounded-xl text-[11px] shrink-0 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5 text-amber-300" />
                    <span>{t('Send to Pandit / Family', 'पंडित जी को भेजें')}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      ) : (
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-7 sm:p-10 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center mx-auto">
            <Compass className="w-6 h-6" />
          </div>
          <div className="space-y-1.5 max-w-lg mx-auto">
            <h3 className="text-lg font-serif font-bold text-stone-900">
              {matchMode === 'samaj'
                ? t('Select Both Groom & Bride to Calculate Gunas', 'गुण मिलान देखने के लिए वर और वधू दोनों चुनें')
                : t('Enter All Birth Details to Calculate Gunas', 'गुण मिलान गणना के लिए सभी जन्म विवरण दर्ज करें')}
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              {matchMode === 'samaj'
                ? t(
                    'Please select one Groom and one Bride from the verified Samaj lists above to generate the 36-Guna Ashtakoot report.',
                    '36-गुण अष्टकूट रिपोर्ट देखने के लिए ऊपर दी गई सूचियों में से एक वर और एक वधू का चयन करें।'
                  )
                : t(
                    'Fill in Name, Date of Birth, Birth Time, and Birth Place for both Groom and Bride above. The 36-Guna Ashtakoot score will be calculated automatically once all details are entered.',
                    'ऊपर वर और वधू दोनों के नाम, जन्म तिथि, जन्म समय और जन्म स्थान भरें। सभी विवरण भरते ही 36-गुण अष्टकूट मिलान रिपोर्ट स्वतः प्रदर्शित होगी।'
                  )}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1 text-xs">
            {matchMode === 'samaj' ? (
              <>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-semibold ${
                  activeGroom
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-stone-50 border-stone-200 text-stone-600'
                }`}>
                  {activeGroom ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Users className="w-3.5 h-3.5 text-stone-400" />}
                  <span>{activeGroom ? `${t('Groom:', 'वर:')} ${activeGroom.name}` : t('1. Groom not selected', '1. वर चयन शेष')}</span>
                </span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-semibold ${
                  activeBride
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-stone-50 border-stone-200 text-stone-600'
                }`}>
                  {activeBride ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Users className="w-3.5 h-3.5 text-stone-400" />}
                  <span>{activeBride ? `${t('Bride:', 'वधू:')} ${activeBride.name}` : t('2. Bride not selected', '2. वधू चयन शेष')}</span>
                </span>
              </>
            ) : (
              <>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-semibold ${
                  isCustomBoyComplete
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-stone-50 border-stone-200 text-stone-600'
                }`}>
                  {isCustomBoyComplete ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Info className="w-3.5 h-3.5 text-stone-400" />}
                  <span>{isCustomBoyComplete ? t('Groom details complete', 'वर विवरण पूर्ण') : t('1. Groom details pending', '1. वर विवरण शेष')}</span>
                </span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-semibold ${
                  isCustomGirlComplete
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-stone-50 border-stone-200 text-stone-600'
                }`}>
                  {isCustomGirlComplete ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Info className="w-3.5 h-3.5 text-stone-400" />}
                  <span>{isCustomGirlComplete ? t('Bride details complete', 'वधू विवरण पूर्ण') : t('2. Bride details pending', '2. वधू विवरण शेष')}</span>
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* PRINT & DOWNLOAD CERTIFICATE MODAL */}
      {showPrintModal && report && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start sm:items-center justify-center px-3 sm:px-4 pt-[calc(0.75rem+var(--sat))] pb-[calc(1rem+var(--sab))] overflow-y-auto"
          onClick={() => setShowPrintModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-amber-300 relative space-y-4 my-auto"
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

            {printFallbackNotice && (
              <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3 text-xs text-amber-950 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  {t(
                    'System print dialog is unavailable in this Android app view. Tap Download PDF or Download Sheet below to save or print.',
                    'इस ऐप व्यू में सीधा प्रिंटर डायलॉग उपलब्ध नहीं है। सेव या प्रिंट करने के लिए नीचे Download PDF या शीट डाउनलोड पर टैप करें।'
                  )}
                </span>
              </div>
            )}

            {downloadStatusMsg && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-xs text-emerald-900 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{downloadStatusMsg}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row flex-wrap gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  const ok = printHtmlDocument(buildCertificatePrintOptions(report));
                  setPrintFallbackNotice(!ok);
                }}
                className="flex-1 min-w-[130px] bg-[#380812] hover:bg-[#24050b] text-amber-200 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>{t('Print Now', 'अभी प्रिंट करें')}</span>
              </button>
              <button
                type="button"
                onClick={() => void handleDownloadKundaliPdf()}
                disabled={downloadingPdf}
                className="flex-1 min-w-[130px] bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 disabled:opacity-60 text-stone-950 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>{downloadingPdf ? t('Creating PDF...', 'PDF बन रही है...') : t('Download PDF', 'PDF डाउनलोड')}</span>
              </button>
              <button
                type="button"
                onClick={() => void handleDownloadKundaliHtml()}
                className="flex-1 min-w-[140px] bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
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

