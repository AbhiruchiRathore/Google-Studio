import React, { useState } from 'react';
import {
  Trash2,
  ArrowLeft,
  ShieldAlert,
  Smartphone,
  Mail,
  Database,
  CheckCircle2,
  Copy,
  Check,
  Lock,
  ExternalLink,
  FileText,
  Clock
} from 'lucide-react';
import { AuthSession, TabType } from '../types';
import { useLanguage } from '../context/LanguageContext';

export const SUPPORT_EMAIL = 'abhiruchirathore97@gmail.com';

interface DeleteAccountTabProps {
  authSession: AuthSession | null;
  onNavigateTab: (tab: TabType) => void;
  onOpenAccountSettings: () => void;
}

export const DeleteAccountTab: React.FC<DeleteAccountTabProps> = ({
  authSession,
  onNavigateTab,
  onOpenAccountSettings
}) => {
  const { t } = useLanguage();
  const [copiedField, setCopiedField] = useState<'url' | 'email' | 'subject' | null>(null);

  const deletionPageUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/delete-account`
      : '/delete-account';

  const mailtoSubject = encodeURIComponent('Delete Account Request');
  const mailtoBody = encodeURIComponent(
    [
      'Hello Rathore Rishtey Support Team,',
      '',
      'Please permanently delete my Rathore Rishtey account and all associated personal data (profile, messages, and photos).',
      '',
      'Registered Email Address: ',
      'Username ID (if known): ',
      'Mobile Number (if linked): ',
      '',
      'Thank you.'
    ].join('\n')
  );
  const mailtoHref = `mailto:${SUPPORT_EMAIL}?subject=${mailtoSubject}&body=${mailtoBody}`;

  const handleCopy = async (value: string, field: 'url' | 'email' | 'subject') => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      window.setTimeout(() => {
        setCopiedField((prev) => (prev === field ? null : prev));
      }, 2200);
    } catch {
      // Fallback for restricted WebViews
      const textarea = document.createElement('textarea');
      textarea.value = value;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        setCopiedField(field);
        window.setTimeout(() => {
          setCopiedField((prev) => (prev === field ? null : prev));
        }, 2200);
      } finally {
        document.body.removeChild(textarea);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onNavigateTab('matrimony')}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-bold text-stone-700 shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t('Back to Home', 'होम पर वापस जाएं')}</span>
        </button>

        <div className="flex items-center gap-3 text-[11px] text-stone-500 font-medium">
          <a
            href="/privacy-policy"
            onClick={(e) => {
              e.preventDefault();
              onNavigateTab('privacy-policy');
            }}
            className="text-[#6e1628] hover:text-[#851834] font-semibold underline"
          >
            {t('Privacy Policy', 'गोपनीयता नीति')}
          </a>
          <span>•</span>
          <span>{t('Updated: November 18, 2026', 'अद्यतन: १८ नवंबर २०२६')}</span>
        </div>
      </div>

      {/* Main Play Store Account Deletion Article */}
      <article className="bg-white rounded-3xl border border-stone-200/90 shadow-sm p-6 sm:p-10 space-y-8 text-stone-700">
        {/* Header */}
        <header className="border-b border-stone-100 pb-6 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-[#6e1628] text-xs font-bold">
            <Trash2 className="w-4 h-4" />
            <span>{t('Account & Data Deletion', 'खाता एवं डेटा विलोपन')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
            {t('Rathore Rishtey — Delete Your Account', 'राठौड़ रिश्ते — अपना खाता हटाएं')}
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            {t(
              'You are in full control of your personal data on Rathore Rishtey. Follow either the instant In-App Method or the Email Request Method below to permanently delete your account, matrimonial profile, messages, and uploaded photos.',
              'राठौड़ रिश्ते पर आपके व्यक्तिगत डेटा का पूरा नियंत्रण आपके पास है। अपना खाता, वैवाहिक प्रोफ़ाइल, संदेश और फोटो स्थायी रूप से हटाने के लिए नीचे दिए गए इन-ऐप या ईमेल तरीके का उपयोग करें।'
            )}
          </p>

          {/* Shareable Public URL Bar for Play Console */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-stone-50 border border-stone-200 rounded-2xl px-4 py-2.5 text-xs">
            <div className="min-w-0">
              <span className="text-[10px] uppercase tracking-wider font-bold text-stone-400 block">
                {t('Official Account Deletion Page URL', 'आधिकारिक खाता विलोपन वेब लिंक')}
              </span>
              <span className="font-mono text-stone-800 break-all">{deletionPageUrl}</span>
            </div>
            <button
              type="button"
              onClick={() => void handleCopy(deletionPageUrl, 'url')}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-amber-50 border border-stone-300 text-stone-700 font-semibold text-xs shrink-0 cursor-pointer transition-colors"
            >
              {copiedField === 'url' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">{t('Copied', 'कॉपी हुआ')}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{t('Copy Link', 'लिंक कॉपी करें')}</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* 1. In-App Method */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-rose-50 border border-rose-200 text-[#851834] flex items-center justify-center shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-900">
                {t('1. In-App Method (Instant Deletion)', '१. ऐप के भीतर से (तुरंत हटाएं)')}
              </h2>
              <p className="text-[11px] text-emerald-700 font-semibold">
                {t('Recommended • Deletes data immediately', 'अनुशंसित • डेटा तुरंत हट जाता है')}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-rose-200/80 bg-rose-50/40 p-4 sm:p-5 space-y-4">
            <p className="text-xs sm:text-sm font-medium text-stone-800 leading-relaxed">
              {t(
                'Log in to the Rathore Rishtey app, go to Settings > Account > Delete Account to permanently delete your data instantly.',
                'Rathore Rishtey ऐप में लॉग इन करें, Settings > Account > Delete Account पर जाएं और अपना डेटा तुरंत व स्थायी रूप से हटाएं।'
              )}
            </p>

            <ol className="list-decimal pl-5 space-y-1.5 text-xs sm:text-sm text-stone-600">
              <li>{t('Sign in to your Rathore Rishtey account.', 'अपने राठौड़ रिश्ते खाते में लॉग इन करें।')}</li>
              <li>{t('Open Dashboard and select Settings from the menu.', 'डैशबोर्ड खोलें और मेनू से Settings चुनें।')}</li>
              <li>{t('Open the Account section inside Settings.', 'Settings के अंदर Account अनुभाग खोलें।')}</li>
              <li>{t('Tap Delete Account and confirm permanent deletion.', 'Delete Account पर टैप करें और स्थायी विलोपन की पुष्टि करें।')}</li>
            </ol>

            <div className="pt-1 flex flex-wrap gap-2.5">
              {authSession ? (
                <button
                  type="button"
                  onClick={onOpenAccountSettings}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#6e1628] to-[#851834] text-amber-100 font-bold text-xs shadow-sm hover:opacity-95 cursor-pointer transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t('Open Settings > Account > Delete Account', 'Settings > Account > Delete Account खोलें')}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onNavigateTab('signup')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#6e1628] to-[#851834] text-amber-100 font-bold text-xs shadow-sm hover:opacity-95 cursor-pointer transition-opacity"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{t('Log In to Delete Account', 'खाता हटाने के लिए लॉग इन करें')}</span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* 2. Email Request Method */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-900">
                {t('2. Email Request Method (Without App Access)', '२. ईमेल अनुरोध विधि (यदि ऐप उपलब्ध न हो)')}
              </h2>
              <p className="text-[11px] text-amber-800 font-semibold flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{t('Processed within 7 days', '७ दिनों के भीतर प्रक्रिया पूरी की जाती है')}</span>
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-4 sm:p-5 space-y-4">
            <p className="text-xs sm:text-sm font-medium text-stone-800 leading-relaxed">
              {t(
                `If you cannot access the app, email our support team at ${SUPPORT_EMAIL} with the subject 'Delete Account Request', and we will process your deletion within 7 days.`,
                `यदि आप ऐप का उपयोग नहीं कर पा रहे हैं, तो हमारी सहायता टीम को ${SUPPORT_EMAIL} पर विषय 'Delete Account Request' के साथ ईमेल भेजें, और हम ७ दिनों के भीतर आपका खाता हटा देंगे।`
              )}
            </p>

            <div className="bg-white rounded-xl border border-stone-200 p-3.5 space-y-2 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-stone-400 font-medium">{t('Support Email:', 'सहायता ईमेल:')} </span>
                  <a href={`mailto:${SUPPORT_EMAIL}`} className="font-mono font-bold text-[#6e1628] underline">
                    {SUPPORT_EMAIL}
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => void handleCopy(SUPPORT_EMAIL, 'email')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-[11px] cursor-pointer"
                >
                  {copiedField === 'email' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedField === 'email' ? t('Copied', 'कॉपी हुआ') : t('Copy Email', 'ईमेल कॉपी करें')}</span>
                </button>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-stone-400 font-medium">{t('Required Subject:', 'आवश्यक विषय:')} </span>
                  <span className="font-mono font-bold text-stone-900">Delete Account Request</span>
                </div>
                <button
                  type="button"
                  onClick={() => void handleCopy('Delete Account Request', 'subject')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-[11px] cursor-pointer"
                >
                  {copiedField === 'subject' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedField === 'subject' ? t('Copied', 'कॉपी हुआ') : t('Copy Subject', 'विषय कॉपी करें')}</span>
                </button>
              </div>
              <p className="text-[11px] text-stone-500 pt-1">
                {t(
                  'Please send the email from your registered email address (or mention your username and linked mobile number) so we can verify ownership before removing your data.',
                  'कृपया अपने पंजीकृत ईमेल पते से ईमेल भेजें (या अपना यूज़रनेम व लिंक किया गया मोबाइल नंबर लिखें) ताकि डेटा हटाने से पहले पहचान सत्यापित की जा सके।'
                )}
              </p>
            </div>

            <div>
              <a
                href={mailtoHref}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 border border-amber-300 text-[#380812] font-bold text-xs transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>{t('Send Delete Account Request Email', 'Delete Account Request ईमेल भेजें')}</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>
            </div>
          </div>
        </section>

        {/* 3. What Gets Deleted & Retention */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-stone-100 border border-stone-200 text-stone-800 flex items-center justify-center shrink-0">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-900">
                {t('3. What Gets Deleted & Data Retention', '३. कौन सा डेटा हटाया जाता है और संग्रहण अवधि')}
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Removed Data */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 sm:p-5 space-y-2.5">
              <h3 className="text-xs sm:text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{t('Data Permanently Removed', 'स्थायी रूप से हटाया जाने वाला डेटा')}</span>
              </h3>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-stone-700 leading-relaxed">
                <li>
                  <strong>{t('Profile & Biodata:', 'प्रोफ़ाइल और बायोडाटा:')}</strong>{' '}
                  {t(
                    'Your candidate biodata, gotra, family details, Kundali birth details, education/career info, and any published business listings.',
                    'आपका उम्मीदवार बायोडाटा, गोत्र, पारिवारिक विवरण, कुंडली विवरण, शिक्षा/व्यवसाय और प्रकाशित व्यापार विज्ञापन।'
                  )}
                </li>
                <li>
                  <strong>{t('Messages & Chats:', 'संदेश और चैट:')}</strong>{' '}
                  {t(
                    'All in-app chat conversations, liked profiles, admirer/interest records, blocked profiles list, and notifications.',
                    'सभी इन-ऐप चैट संदेश, पसंद की गई प्रोफ़ाइल, प्रशंसक रिकॉर्ड, ब्लॉक सूची और सूचनाएं।'
                  )}
                </li>
                <li>
                  <strong>{t('Photos & Media:', 'फोटो और मीडिया:')}</strong>{' '}
                  {t(
                    'Profile photo, cover photo, gallery images, and uploaded documents or media assets.',
                    'प्रोफ़ाइल फोटो, कवर फोटो, गैलरी चित्र और अपलोड की गई मीडिया फ़ाइलें।'
                  )}
                </li>
                <li>
                  <strong>{t('Account & Preferences:', 'खाता और प्राथमिकताएं:')}</strong>{' '}
                  {t(
                    'Email address, username, phone number, Firebase Authentication credentials, and saved device location preferences.',
                    'ईमेल पता, यूज़रनेम, मोबाइल नंबर, Firebase लॉगिन क्रेडेंशियल और सहेजी गई लोकेशन प्राथमिकताएं।'
                  )}
                </li>
              </ul>
            </div>

            {/* Retention / Legal Compliance */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 sm:p-5 space-y-2.5">
              <h3 className="text-xs sm:text-sm font-bold text-amber-950 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
                <span>{t('Retention & Legal / Compliance Exceptions', 'डेटा संग्रहण एवं कानूनी अपवाद')}</span>
              </h3>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-stone-700 leading-relaxed">
                <li>
                  <strong>{t('Immediate Public Removal:', 'तुरंत सार्वजनिक निष्कासन:')}</strong>{' '}
                  {t(
                    'Once deleted, your profile, photos, and messages are immediately removed from public search and cannot be recovered.',
                    'हटाने के बाद आपकी प्रोफ़ाइल, फोटो और संदेश तुरंत सार्वजनिक खोज से हट जाते हैं और पुनर्प्राप्त नहीं किए जा सकते।'
                  )}
                </li>
                <li>
                  <strong>{t('Legal & Tax Compliance:', 'कानूनी एवं कर अनुपालन:')}</strong>{' '}
                  {t(
                    'If you completed a paid advertisement or membership transaction, minimal invoice/transaction records (excluding your personal photos or chats) may be retained as required by applicable Indian tax and financial audit laws.',
                    'यदि आपने कोई सशुल्क विज्ञापन या सदस्यता लेनदेन किया है, तो केवल लागू भारतीय कर एवं लेखा कानूनों के अनुसार आवश्यक न्यूनतम चालान/लेनदेन रिकॉर्ड रखे जा सकते हैं।'
                  )}
                </li>
                <li>
                  <strong>{t('Security & Fraud Prevention Logs:', 'सुरक्षा एवं धोखाधड़ी रोकथाम लॉग:')}</strong>{' '}
                  {t(
                    'Limited technical security or abuse-prevention logs may be kept in restricted storage for up to 90 days before automatic purge.',
                    'सुरक्षा और दुरुपयोग रोकथाम से जुड़े सीमित तकनीकी लॉग स्वचालित विलोपन से पहले अधिकतम ९० दिनों तक सुरक्षित रखे जा सकते हैं।'
                  )}
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Bottom Cross-link */}
        <footer className="pt-4 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#851834]" />
            <span>
              {t('Need to review how your information is protected?', 'जानकारी सुरक्षा के नियम देखने के लिए:')}
            </span>
          </div>
          <a
            href="/privacy-policy"
            onClick={(e) => {
              e.preventDefault();
              onNavigateTab('privacy-policy');
            }}
            className="text-[#6e1628] hover:text-[#851834] font-bold underline"
          >
            {t('Read Rathore Rishtey Privacy Policy →', 'राठौड़ रिश्ते गोपनीयता नीति पढ़ें →')}
          </a>
        </footer>
      </article>
    </div>
  );
};
