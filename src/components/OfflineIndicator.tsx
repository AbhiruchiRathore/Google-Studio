import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useLanguage } from '../context/LanguageContext';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const { t } = useLanguage();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-[calc(1rem+var(--sab))] left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg border border-amber-300/40">
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span>{t('Offline Mode — Cached data is being used.', 'ऑफ़लाइन मोड — कैश डेटा उपयोग किया जा रहा है।')}</span>
    </div>
  );
};
