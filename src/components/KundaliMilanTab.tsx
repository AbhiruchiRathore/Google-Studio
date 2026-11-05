import React, { useState, useMemo, useEffect } from 'react';
import { 
  Sparkles, Heart, ShieldCheck, Share2, Printer, 
  ArrowRight, Users, CheckCircle2, AlertTriangle, Info,
  Flame, RefreshCw, Star, Compass, Award
} from 'lucide-react';
import { MatrimonyProfile, TabType } from '../types';
import { 
  RASHIS, NAKSHATRAS, performKundaliMilan, inferRashiIndex, 
  KundaliMilanReport 
} from '../utils/kundaliMilan';

interface KundaliMilanTabProps {
  profiles: MatrimonyProfile[];
  onNavigateTab: (tab: TabType) => void;
  preselectedBoyId?: number | string | null;
  preselectedGirlId?: number | string | null;
}

export const KundaliMilanTab: React.FC<KundaliMilanTabProps> = ({
  profiles,
  onNavigateTab,
  preselectedBoyId,
  preselectedGirlId
}) => {
  const [matchMode, setMatchMode] = useState<'samaj' | 'custom'>('samaj');

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
  const [customBoyName, setCustomBoyName] = useState('Groom Candidate');
  const [customBoyDob, setCustomBoyDob] = useState('1996-05-15');
  const [customBoyTime, setCustomBoyTime] = useState('10:30');
  const [customBoyPlace, setCustomBoyPlace] = useState('Indore');
  const [customBoyRashi, setCustomBoyRashi] = useState<number>(0); // Aries
  const [customBoyNakshatra, setCustomBoyNakshatra] = useState<number>(0); // Ashwini
  const [customBoyManglik, setCustomBoyManglik] = useState(false);

  const [customGirlName, setCustomGirlName] = useState('Bride Candidate');
  const [customGirlDob, setCustomGirlDob] = useState('1998-08-20');
  const [customGirlTime, setCustomGirlTime] = useState('14:15');
  const [customGirlPlace, setCustomGirlPlace] = useState('Nanded');
  const [customGirlRashi, setCustomGirlRashi] = useState<number>(4); // Leo
  const [customGirlNakshatra, setCustomGirlNakshatra] = useState<number>(9); // Magha
  const [customGirlManglik, setCustomGirlManglik] = useState(false);

  const [copiedShare, setCopiedShare] = useState(false);

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
      // Infer Rashi from profile text or deterministic hash from name
      const boyRashiIdx = inferRashiIndex(activeGroom.about || activeGroom.name);
      const girlRashiIdx = inferRashiIndex(activeBride.about || activeBride.name);

      // Select suitable nakshatra aligned with Rashi
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
        customBoyName || 'Groom Candidate',
        customGirlName || 'Bride Candidate',
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
    customGirlManglik
  ]);

  const handleShareWhatsApp = () => {
    const text = `🚩 *Vedic Kundali Milan Report* 🚩
*Rathore Rishtey • राठौड़ रिश्ते*

🤵 *Groom:* ${report.boyName} (${report.boyRashi.hindiName})
👰 *Bride:* ${report.girlName} (${report.girlRashi.hindiName})

✨ *Total Gun Milan:* *${report.totalGunas} / 36 Gunas* (${report.percentage}%)
🏆 *Verdict:* ${report.verdict.title}
📜 *Auspiciousness:* ${report.verdict.hindiTitle}

📊 *Ashtakoot Guna Breakdown:*
• वर्ण (Varna): ${report.kootas.varna.obtainedPoints}/1
• वश्य (Vashya): ${report.kootas.vashya.obtainedPoints}/2
• तारा (Tara): ${report.kootas.tara.obtainedPoints}/3
• योनि (Yoni): ${report.kootas.yoni.obtainedPoints}/4
• ग्रह मैत्री (Graha Maitri): ${report.kootas.grahaMaitri.obtainedPoints}/5
• गण (Gana): ${report.kootas.gana.obtainedPoints}/6
• भकूट (Bhakoot): ${report.kootas.bhakoot.obtainedPoints}/7
• नाड़ी (Nadi): ${report.kootas.nadi.obtainedPoints}/8

${report.doshaSummary.nadiDosha ? '⚠️ Nadi Dosha detected' : '✅ Nadi Compatibility: Perfect'}
${report.doshaSummary.bhakootDosha ? '⚠️ Bhakoot Dosha detected' : '✅ Bhakoot Compatibility: Auspicious'}
${report.doshaSummary.manglikCheck.isCompatible ? '✅ Manglik Compatibility: Favorable' : 'ℹ️ Manglik Check: Consult astrologer'}

🌐 *Check live Kundali Milan & verified Rathore Samaj profiles on Rathore Rishtey Portal*`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-2">
      {/* SACRED HEADER BANNER */}
      <div className="bg-gradient-to-r from-[#24050b] via-[#380812] to-[#24050b] rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-amber-500/30 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>॥ वैदिक अष्टकूट ३६ गुण मिलान ॥</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-amber-50">
              Vedic Kundali Milan (कुंडली मिलान)
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 max-w-xl font-light leading-relaxed">
              Calculate authentic 36-Guna matching across all 8 Vedic Kootas (Varna, Vashya, Tara, Yoni, Graha Maitri, Gana, Bhakoot, Nadi) with Manglik Dosha analysis.
            </p>
          </div>

          {/* VEDIC SEAL BADGE */}
          <div className="flex flex-col items-center md:items-end gap-1.5 shrink-0">
            <div className="bg-amber-400/15 border border-amber-400/40 text-amber-200 px-4 py-2 rounded-2xl text-xs flex items-center gap-2 shadow-sm font-serif">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>१००% प्रामाणिक वैदिक पद्धति</span>
            </div>
            <span className="text-[10px] text-amber-300/70 font-mono">
              Sage Parashara Ashtakoot
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
            <span>Select from Samaj Profiles</span>
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
            <span>Enter Custom Birth Details</span>
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
                <span>Select Groom (वर चुनें)</span>
              </h3>
              <span className="text-[11px] font-semibold text-stone-500">{grooms.length} Verified Grooms</span>
            </div>

            <select
              value={selectedBoyId}
              onChange={(e) => setSelectedBoyId(e.target.value)}
              className="w-full p-3 rounded-xl border border-stone-300 text-xs font-semibold text-stone-800 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none bg-stone-50"
            >
              {grooms.map(g => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.age} Yrs · {g.city} · Gotra: {g.gotra})
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
                  <p className="text-stone-600">{activeGroom.age} Yrs · {activeGroom.height || "5' 6\""} · {activeGroom.city}</p>
                  <p className="text-amber-900 font-semibold text-[11px]">Gotra: {activeGroom.gotra}</p>
                  <p className="text-stone-500 text-[11px]">Rashi: <strong className="text-stone-800">{report.boyRashi.hindiName}</strong></p>
                </div>
              </div>
            )}
          </div>

          {/* BRIDE SELECTION */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="font-serif font-bold text-stone-900 text-sm flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-800 text-xs font-bold flex items-center justify-center">2</span>
                <span>Select Bride (वधु चुनें)</span>
              </h3>
              <span className="text-[11px] font-semibold text-stone-500">{brides.length} Verified Brides</span>
            </div>

            <select
              value={selectedGirlId}
              onChange={(e) => setSelectedGirlId(e.target.value)}
              className="w-full p-3 rounded-xl border border-stone-300 text-xs font-semibold text-stone-800 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none bg-stone-50"
            >
              {brides.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.age} Yrs · {b.city} · Gotra: {b.gotra})
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
                  <p className="text-stone-600">{activeBride.age} Yrs · {activeBride.height || "5' 5\""} · {activeBride.city}</p>
                  <p className="text-amber-900 font-semibold text-[11px]">Gotra: {activeBride.gotra}</p>
                  <p className="text-stone-500 text-[11px]">Rashi: <strong className="text-stone-800">{report.girlRashi.hindiName}</strong></p>
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
              <span>Groom Details (वर का विवरण)</span>
            </h3>

            <div>
              <label className="font-bold text-stone-700 block mb-1">Groom Name</label>
              <input
                type="text"
                value={customBoyName}
                onChange={(e) => setCustomBoyName(e.target.value)}
                placeholder="Enter boy name"
                className="w-full p-2.5 rounded-xl border border-stone-300 bg-stone-50"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={customBoyDob}
                  onChange={(e) => setCustomBoyDob(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 bg-stone-50"
                />
              </div>
              <div>
                <label className="font-bold text-stone-700 block mb-1">Birth Time</label>
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
                <label className="font-bold text-stone-700 block mb-1">Rashi (राशि)</label>
                <select
                  value={customBoyRashi}
                  onChange={(e) => setCustomBoyRashi(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-stone-300 bg-stone-50 font-medium"
                >
                  {RASHIS.map(r => (
                    <option key={r.index} value={r.index}>{r.hindiName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-bold text-stone-700 block mb-1">Nakshatra (नक्षत्र)</label>
                <select
                  value={customBoyNakshatra}
                  onChange={(e) => setCustomBoyNakshatra(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-stone-300 bg-stone-50 font-medium"
                >
                  {NAKSHATRAS.map(n => (
                    <option key={n.index} value={n.index}>{n.name} ({n.hindiName})</option>
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
              <span className="font-bold text-stone-800">Boy is Manglik (मांगलिक दोष)</span>
            </label>
          </div>

          {/* GIRL FORM */}
          <div className="space-y-3">
            <h3 className="font-serif font-bold text-stone-900 text-sm pb-2 border-b border-stone-100 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center font-bold text-xs">2</span>
              <span>Bride Details (वधु का विवरण)</span>
            </h3>

            <div>
              <label className="font-bold text-stone-700 block mb-1">Bride Name</label>
              <input
                type="text"
                value={customGirlName}
                onChange={(e) => setCustomGirlName(e.target.value)}
                placeholder="Enter girl name"
                className="w-full p-2.5 rounded-xl border border-stone-300 bg-stone-50"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={customGirlDob}
                  onChange={(e) => setCustomGirlDob(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 bg-stone-50"
                />
              </div>
              <div>
                <label className="font-bold text-stone-700 block mb-1">Birth Time</label>
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
                <label className="font-bold text-stone-700 block mb-1">Rashi (राशि)</label>
                <select
                  value={customGirlRashi}
                  onChange={(e) => setCustomGirlRashi(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-stone-300 bg-stone-50 font-medium"
                >
                  {RASHIS.map(r => (
                    <option key={r.index} value={r.index}>{r.hindiName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-bold text-stone-700 block mb-1">Nakshatra (नक्षत्र)</label>
                <select
                  value={customGirlNakshatra}
                  onChange={(e) => setCustomGirlNakshatra(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-stone-300 bg-stone-50 font-medium"
                >
                  {NAKSHATRAS.map(n => (
                    <option key={n.index} value={n.index}>{n.name} ({n.hindiName})</option>
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
              <span className="font-bold text-stone-800">Girl is Manglik (मांगलिक दोष)</span>
            </label>
          </div>
        </div>
      )}

      {/* KUNDALI MILAN SCORECARD REPORT */}
      <div className="bg-white rounded-3xl border-2 border-amber-300/80 shadow-xl overflow-hidden print:border-none print:shadow-none">
        {/* Certificate Top Banner */}
        <div className="bg-gradient-to-r from-[#4c0d1b] via-[#631024] to-[#4c0d1b] p-6 sm:p-8 text-white text-center border-b border-amber-400/40 relative">
          <p className="text-amber-300 font-serif tracking-widest text-xs font-semibold mb-1">
            ॥ शुभ विवाह • अष्टकूट गुण मिलान पत्रक ॥
          </p>
          <h3 className="text-2xl sm:text-3xl font-serif font-bold text-amber-100">
            {report.boyName} & {report.girlName}
          </h3>
          <p className="text-xs text-amber-200/90 mt-1 font-medium">
            Groom Rashi: {report.boyRashi.hindiName} ({report.boyNakshatra.name}) · Bride Rashi: {report.girlRashi.hindiName} ({report.girlNakshatra.name})
          </p>

          {/* Large Score Indicator */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-6">
            <div className="w-32 h-32 rounded-3xl bg-white/10 backdrop-blur-md border-2 border-amber-300 flex flex-col items-center justify-center text-center shadow-lg">
              <span className="text-4xl font-extrabold text-amber-300 font-serif leading-none">
                {report.totalGunas}
              </span>
              <span className="text-xs uppercase tracking-wider text-stone-300 font-semibold mt-1">
                out of 36 Gunas
              </span>
              <span className="text-[11px] text-amber-200 font-bold mt-0.5">
                {report.percentage}% Match
              </span>
            </div>

            <div className="text-center sm:text-left max-w-md space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-xs font-bold">
                <Award className="w-3.5 h-3.5" />
                <span>{report.verdict.grade}: {report.verdict.title}</span>
              </div>
              <p className="font-serif text-amber-50 font-bold text-base leading-snug">
                {report.verdict.hindiTitle}
              </p>
              <p className="text-xs text-stone-300 leading-relaxed font-light">
                {report.verdict.recommendation}
              </p>
            </div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="bg-[#FAF8F5] px-6 py-3.5 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-stone-700">
            <span className="font-bold text-stone-900">Scorecard Actions:</span>
            <span className="text-stone-500 hidden sm:inline">Share with families or print authentic report</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShareWhatsApp}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share on WhatsApp</span>
            </button>
            <button
              onClick={handlePrint}
              className="bg-stone-200 hover:bg-stone-300 text-stone-800 font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Certificate</span>
            </button>
          </div>
        </div>

        {/* 8 KOOTAS DETAILED BREAKDOWN TABLE */}
        <div className="p-6 sm:p-8 space-y-6">
          <div>
            <h4 className="text-base font-serif font-bold text-stone-900 mb-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-700" />
              <span>Detailed Ashtakoot (8 Kootas) Analysis (अष्टकूट विवरण)</span>
            </h4>
            <p className="text-xs text-stone-500">
              Each Koota analyzes an essential pillar of marital compatibility according to ancient Vedic scriptures.
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
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-stone-900 text-sm font-serif">
                        {koota.name}
                      </span>
                      <span className={`font-mono font-bold px-2 py-0.5 rounded-lg text-xs ${
                        isFull 
                          ? 'bg-emerald-200/70 text-emerald-900' 
                          : isZero 
                            ? 'bg-rose-200/70 text-rose-900' 
                            : 'bg-amber-200/70 text-amber-900'
                      }`}>
                        {koota.obtainedPoints} / {koota.maxPoints}
                      </span>
                    </div>

                    <p className="text-[11px] font-semibold text-stone-600 mb-2">
                      {koota.hindiName}
                    </p>

                    <p className="text-stone-600 text-[11px] leading-relaxed">
                      {koota.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-stone-200/60 flex items-center justify-between text-[10px] text-stone-500">
                    <span>Vedic Weight: {koota.maxPoints} Gunas</span>
                    {isFull ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3" /> Full Match
                      </span>
                    ) : isZero ? (
                      <span className="text-rose-700 font-bold flex items-center gap-0.5">
                        <AlertTriangle className="w-3 h-3" /> Dosha / 0 Pts
                      </span>
                    ) : (
                      <span className="text-amber-800 font-bold">Partial Match</span>
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
              <span>Dosha Examination & Astrological Safeguards (दोष विचार)</span>
            </h5>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Nadi Dosha */}
              <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-1">
                <span className="text-[10px] font-bold uppercase text-stone-400">1. Nadi Balance:</span>
                <p className="font-bold text-stone-800 text-xs">
                  {report.doshaSummary.nadiDosha ? '⚠️ Nadi Dosha Present' : '✅ Nadi Compatible (No Dosha)'}
                </p>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  {report.kootas.nadi.description}
                </p>
              </div>

              {/* Bhakoot Dosha */}
              <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-1">
                <span className="text-[10px] font-bold uppercase text-stone-400">2. Bhakoot Alignment:</span>
                <p className="font-bold text-stone-800 text-xs">
                  {report.doshaSummary.bhakootDosha ? '⚠️ Bhakoot Dosha Present' : '✅ Bhakoot Auspicious (No Dosha)'}
                </p>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  {report.kootas.bhakoot.description}
                </p>
              </div>

              {/* Manglik Check */}
              <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-1">
                <span className="text-[10px] font-bold uppercase text-stone-400">3. Manglik (Kuja) Analysis:</span>
                <p className="font-bold text-stone-800 text-xs">
                  {report.doshaSummary.manglikCheck.isCompatible ? '✅ Auspicious Manglik Harmony' : 'ℹ️ Manglik Consultation Required'}
                </p>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  {report.doshaSummary.manglikCheck.status}
                </p>
              </div>
            </div>

            {/* Classical astrological attribution */}
            <div className="pt-3 border-t border-stone-200 flex flex-col sm:flex-row justify-between items-center text-[11px] text-stone-500 gap-2">
              <span>
                Based on classical Sage Parashara Vedic Jyotish Ashtakoot guidelines.
              </span>
              <span className="text-stone-400 font-medium">
                Rathore Rishtey Astrological Consultation
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
