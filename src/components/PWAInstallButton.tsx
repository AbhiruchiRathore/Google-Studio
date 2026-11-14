import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useLanguage } from '../context/LanguageContext';

interface PWAInstallButtonProps {
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const { t } = useLanguage();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        className={`flex items-center justify-center gap-1.5 rounded-xl bg-amber-300 hover:bg-amber-200 text-[#4c0d1b] font-bold shadow-xs transition-colors cursor-pointer ${
          compact ? 'w-full py-2.5 text-xs' : 'px-3 py-2 text-xs'
        }`}
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        <span>{t('Install App', 'ऐप इंस्टॉल करें')}</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center justify-center gap-1.5 rounded-xl border border-amber-300/50 text-amber-100 hover:bg-white/10 font-semibold transition-colors cursor-pointer ${
            compact ? 'w-full py-2.5 text-xs' : 'px-2.5 py-2 text-xs'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5 shrink-0 text-amber-300" />
          <span>{t('Install App', 'ऐप इंस्टॉल करें')}</span>
        </button>

        {showIOSGuide && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
            onClick={() => setShowIOSGuide(false)}
          >
            <div
              className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl text-stone-800 space-y-3 text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#6e1628]">
                  {t('Install on iPhone / iPad', 'iPhone / iPad पर इंस्टॉल करें')}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
                  aria-label={t('Close', 'बंद करें')}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                {t(
                  '1. Tap the Share button in Safari toolbar.\n2. Scroll down and tap "Add to Home Screen".',
                  '1. Safari टूलबार में Share बटन दबाएं।\n2. नीचे स्क्रॉल करें और "Add to Home Screen" चुनें।'
                ).split('\n').map((line, i) => (
                  <React.Fragment key={i}>
                    {line}
                    {i === 0 && <br />}
                  </React.Fragment>
                ))}
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full rounded-xl bg-[#6e1628] text-amber-100 py-2.5 text-xs font-bold cursor-pointer"
              >
                {t('Got it', 'ठीक है')}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
