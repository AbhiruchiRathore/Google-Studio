import React, { useEffect, useState } from 'react';
import { MapPin, Navigation, RefreshCw, CheckCircle2, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { LocationPermissionStatus, UserLocationData } from '../hooks/useUserLocation';
import { INDIAN_CITY_COORDS } from '../utils/locationMatcher';

interface LocationPermissionModalProps {
  isOpen: boolean;
  location: UserLocationData | null;
  status: LocationPermissionStatus;
  errorMessage: string | null;
  onAllowLocation: () => void;
  onSelectCity: (city: string) => boolean;
  onDismiss: () => void;
}

const POPULAR_CITIES = [
  'Indore',
  'Pune',
  'Mumbai',
  'Chhatrapati Sambhajinagar',
  'Nanded',
  'Akot',
  'Beed',
  'Jalna',
  'Ratlam',
  'Bangalore',
  'Bhopal',
  'Baran'
];

export const LocationPermissionModal: React.FC<LocationPermissionModalProps> = ({
  isOpen,
  location,
  status,
  errorMessage,
  onAllowLocation,
  onSelectCity,
  onDismiss
}) => {
  const { t } = useLanguage();
  const [showManualCities, setShowManualCities] = useState(false);

  // Auto-close briefly after location is freshly resolved inside the modal
  useEffect(() => {
    if (!isOpen || !location) return;
    const timer = window.setTimeout(() => {
      onDismiss();
    }, 900);
    return () => window.clearTimeout(timer);
  }, [isOpen, location, onDismiss]);

  useEffect(() => {
    if (!isOpen) {
      setShowManualCities(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isRequesting = status === 'requesting';
  const showFallbackCities = showManualCities || status === 'denied' || status === 'unavailable' || status === 'error';

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-950/65 backdrop-blur-xs flex items-center justify-center px-4 py-6 animate-in fade-in duration-200"
      onClick={onDismiss}
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-permission-title"
    >
      <div
        className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-amber-300/80 relative text-center space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onDismiss}
          aria-label={t('Close', 'बंद करें')}
          className="absolute top-3.5 right-3.5 text-stone-400 hover:text-stone-700 p-1 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {location ? (
          <div className="py-3 space-y-2.5">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 id="location-permission-title" className="text-lg font-serif font-bold text-stone-900">
              {t('Location Enabled', 'लोकेशन सक्षम हो गई')}
            </h3>
            <p className="text-xs text-stone-600">
              {t('Personalizing nearby matches around', 'आपके क्षेत्र के पास के रिश्ते दिखाए जाएंगे:')}{' '}
              <strong className="text-stone-900">
                {location.city}, {location.state}
              </strong>
            </p>
          </div>
        ) : (
          <>
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-[#380812] to-[#6e1628] text-amber-300 flex items-center justify-center shadow-md border border-amber-400/40">
              <MapPin className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h3 id="location-permission-title" className="text-lg font-serif font-bold text-stone-900">
                {t('Allow Location Access?', 'क्या लोकेशन अनुमति दें?')}
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                {t(
                  'Allow Rathore Rishtey to access your device location to suggest verified Rathore Samaj biodatas closest to your city.',
                  'अपने शहर और आसपास के सत्यापित राठौड़ समाज बायोडाटा पहले देखने के लिए कृपया लोकेशन की अनुमति दें।'
                )}
              </p>
            </div>

            {errorMessage && (
              <p className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 font-medium leading-relaxed">
                {errorMessage}
              </p>
            )}

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={onAllowLocation}
                disabled={isRequesting}
                className="w-full bg-[#6e1628] hover:bg-[#851834] text-white font-semibold py-2.5 px-4 rounded-xl text-xs sm:text-sm shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isRequesting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Navigation className="w-4 h-4 text-amber-300" />
                )}
                <span>
                  {isRequesting
                    ? t('Requesting Permission...', 'अनुमति मांगी जा रही है...')
                    : t('Allow While Using App', 'लोकेशन की अनुमति दें')}
                </span>
              </button>

              {!showFallbackCities && (
                <button
                  type="button"
                  onClick={() => setShowManualCities(true)}
                  className="w-full py-2 px-4 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 font-medium text-xs cursor-pointer transition-colors"
                >
                  {t('Select City Manually', 'शहर स्वयं चुनें')}
                </button>
              )}

              <button
                type="button"
                onClick={onDismiss}
                className="w-full py-2 text-xs text-stone-500 hover:text-stone-800 font-medium cursor-pointer transition-colors"
              >
                {t("Don't Allow", 'अभी नहीं')}
              </button>
            </div>

            {showFallbackCities && (
              <div className="pt-3 border-t border-stone-100 text-left space-y-2">
                <p className="text-[11px] font-semibold text-stone-600">
                  {t('Or select your city:', 'या अपना शहर चुनें:')}
                </p>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                  {INDIAN_CITY_COORDS.filter((entry) => POPULAR_CITIES.includes(entry.city)).map((entry) => (
                    <button
                      key={entry.city}
                      type="button"
                      onClick={() => onSelectCity(entry.city)}
                      className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-amber-100 text-stone-800 text-[11px] font-medium cursor-pointer transition-colors"
                    >
                      {entry.city}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
