import React, { useEffect, useState } from 'react';
import {
  MapPin,
  Navigation,
  RefreshCw,
  CheckCircle2,
  X,
  Crosshair,
  Compass,
  Clock,
  ShieldAlert
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import {
  isAndroidDevice,
  LocationAccuracyMode,
  LocationGrantMode,
  LocationPermissionStatus,
  UserLocationData
} from '../hooks/useUserLocation';
import { INDIAN_CITY_COORDS } from '../utils/locationMatcher';

interface LocationPermissionModalProps {
  isOpen: boolean;
  location: UserLocationData | null;
  status: LocationPermissionStatus;
  errorMessage: string | null;
  onAllowLocation: (grantMode: LocationGrantMode, accuracyMode: LocationAccuracyMode) => void;
  onSelectCity: (city: string) => boolean;
  onClose: () => void;
  onDeny: () => void;
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
  onClose,
  onDeny
}) => {
  const { t } = useLanguage();
  const [accuracyMode, setAccuracyMode] = useState<LocationAccuracyMode>('precise');
  const [showManualCities, setShowManualCities] = useState(false);
  const [grantedJustNow, setGrantedJustNow] = useState(false);
  const [wasRequesting, setWasRequesting] = useState(false);

  // Track when GPS finishes resolving inside the open modal so it auto-closes smoothly
  useEffect(() => {
    if (status === 'requesting') {
      setWasRequesting(true);
    } else if (wasRequesting && location && status === 'granted') {
      setGrantedJustNow(true);
      setWasRequesting(false);
    } else if (status === 'denied' || status === 'error' || status === 'unavailable') {
      setWasRequesting(false);
    }
  }, [status, location, wasRequesting]);

  useEffect(() => {
    if (!isOpen || !grantedJustNow || !location) return;
    const timer = window.setTimeout(() => {
      setGrantedJustNow(false);
      onClose();
    }, 950);
    return () => window.clearTimeout(timer);
  }, [isOpen, grantedJustNow, location, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setShowManualCities(false);
      setGrantedJustNow(false);
      setWasRequesting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isRequesting = status === 'requesting';
  const isBlocked = status === 'denied';
  const isAndroid = isAndroidDevice();
  const showFallbackCities =
    showManualCities || isBlocked || status === 'unavailable' || status === 'error';

  const handleCloseAction = () => {
    if (location) {
      onClose();
    } else {
      onDeny();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center sm:px-4 sm:py-6 animate-in fade-in duration-200"
      onClick={handleCloseAction}
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-permission-title"
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-amber-300/80 relative text-center space-y-4 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleCloseAction}
          aria-label={t('Close', 'बंद करें')}
          className="absolute top-3.5 right-3.5 text-stone-400 hover:text-stone-700 p-1.5 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {grantedJustNow && location ? (
          <div className="py-4 space-y-2.5">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 id="location-permission-title" className="text-lg font-serif font-bold text-stone-900">
              {t('Location Access Enabled', 'लोकेशन अनुमति सक्रिय हो गई')}
            </h3>
            <p className="text-xs text-stone-600">
              {t('Showing closest community matches near', 'आपके शहर के आसपास के रिश्ते पहले दिखाए जाएंगे:')}{' '}
              <strong className="text-stone-900">
                {location.city}, {location.state}
              </strong>
            </p>
          </div>
        ) : (
          <>
            {/* Standard Android-style Location Dialog Header */}
            <div className="w-13 h-13 mx-auto rounded-2xl bg-gradient-to-br from-[#380812] to-[#6e1628] text-amber-300 flex items-center justify-center shadow-md border border-amber-400/40">
              <MapPin className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 id="location-permission-title" className="text-base sm:text-lg font-serif font-bold text-stone-900 leading-snug px-2">
                {t(
                  'Allow Rathore Rishtey to access this device’s location?',
                  'क्या Rathore Rishtey को इस डिवाइस की लोकेशन एक्सेस करने दें?'
                )}
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                {t(
                  'Used to prioritize nearby verified Rathore Samaj biodatas and community businesses on both Android and Web.',
                  'Android और वेब पर आपके पास के सत्यापित राठौड़ समाज बायोडाटा व व्यापार पहले दिखाने के लिए उपयोग किया जाता है।'
                )}
              </p>
            </div>

            {/* Active location status if re-opened from Settings / Filter */}
            {location && !isBlocked && (
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl px-3 py-2 text-[11px] text-emerald-900 flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  {t('Current:', 'वर्तमान:')}{' '}
                  <strong>
                    {location.city}, {location.state}
                  </strong>{' '}
                  ({location.source === 'manual'
                    ? t('Manual City', 'मैनुअल शहर')
                    : location.grantMode === 'once'
                      ? t('Only this time', 'केवल इस बार')
                      : t('While using app', 'ऐप उपयोग के दौरान')})
                </span>
              </div>
            )}

            {/* Standard Android 12+ Precise vs Approximate Accuracy Selector */}
            {!isBlocked && (
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => setAccuracyMode('precise')}
                  className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    accuracyMode === 'precise'
                      ? 'border-[#6e1628] bg-rose-50/70 text-[#380812] shadow-xs'
                      : 'border-stone-200 bg-stone-50/60 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  <Crosshair className={`w-4 h-4 ${accuracyMode === 'precise' ? 'text-[#6e1628]' : 'text-stone-400'}`} />
                  <span className="text-xs font-bold">{t('Precise', 'सटीक')}</span>
                  <span className="text-[10px] text-stone-500 leading-tight">
                    {t('Exact GPS distance', 'सटीक GPS दूरी')}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setAccuracyMode('approximate')}
                  className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    accuracyMode === 'approximate'
                      ? 'border-[#6e1628] bg-rose-50/70 text-[#380812] shadow-xs'
                      : 'border-stone-200 bg-stone-50/60 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  <Compass className={`w-4 h-4 ${accuracyMode === 'approximate' ? 'text-[#6e1628]' : 'text-stone-400'}`} />
                  <span className="text-xs font-bold">{t('Approximate', 'अनुमानित')}</span>
                  <span className="text-[10px] text-stone-500 leading-tight">
                    {t('City / region level', 'केवल शहर स्तर')}
                  </span>
                </button>
              </div>
            )}

            {/* Error / OS Permission Recovery Notice */}
            {(errorMessage || isBlocked) && (
              <div className="text-[11px] text-rose-800 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2.5 text-left space-y-1.5 leading-relaxed">
                <div className="flex items-start gap-2 font-semibold">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>
                    {errorMessage ||
                      t(
                        'Location permission is currently blocked in device settings.',
                        'डिवाइस सेटिंग्स में लोकेशन अनुमति वर्तमान में बंद है।'
                      )}
                  </span>
                </div>
                {isBlocked && (
                  <p className="text-[10px] text-rose-700 pl-6">
                    {isAndroid
                      ? t(
                          'Android: Settings → Apps → Rathore Rishtey / Chrome → Permissions → Location → Allow while using the app, then tap Retry.',
                          'Android: Settings → Apps → Rathore Rishtey / Chrome → Permissions → Location → Allow चुनें और पुनः प्रयास करें।'
                        )
                      : t(
                          'Browser: Click the Lock / Site Settings icon in your address bar → Location → Allow, then tap Retry.',
                          'ब्राउज़र: एड्रेस बार में लॉक/सेटिंग्स आइकन खोलें → Location → Allow चुनें और पुनः प्रयास करें।'
                        )}
                  </p>
                )}
              </div>
            )}

            {/* Standard 3 Android Permission Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => onAllowLocation('while_using', accuracyMode)}
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
                    ? t('Requesting Device Permission...', 'अनुमति मांगी जा रही है...')
                    : isBlocked
                      ? t('Retry Location Permission', 'लोकेशन अनुमति पुनः जांचें')
                      : t('While using the app', 'जब ऐप उपयोग में हो')}
                </span>
              </button>

              {!isBlocked && (
                <button
                  type="button"
                  onClick={() => onAllowLocation('once', accuracyMode)}
                  disabled={isRequesting}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300/70 text-[#380812] font-semibold text-xs cursor-pointer transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  <Clock className="w-3.5 h-3.5 text-amber-800" />
                  <span>{t('Only this time', 'केवल इस बार')}</span>
                </button>
              )}

              <div className="flex items-center justify-between gap-2 pt-0.5">
                {!showFallbackCities ? (
                  <button
                    type="button"
                    onClick={() => setShowManualCities(true)}
                    className="flex-1 py-2 px-3 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 font-medium text-xs cursor-pointer transition-colors"
                  >
                    {t('Select City Manually', 'शहर स्वयं चुनें')}
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={handleCloseAction}
                  className={`${
                    showFallbackCities ? 'w-full' : 'flex-1'
                  } py-2 px-3 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 hover:text-stone-900 font-medium text-xs cursor-pointer transition-colors`}
                >
                  {t("Don't allow", 'अनुमति न दें')}
                </button>
              </div>
            </div>

            {showFallbackCities && (
              <div className="pt-3 border-t border-stone-100 text-left space-y-2">
                <p className="text-[11px] font-semibold text-stone-600">
                  {t('Or select your city directly:', 'या सीधे अपना शहर चुनें:')}
                </p>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                  {INDIAN_CITY_COORDS.filter((entry) => POPULAR_CITIES.includes(entry.city)).map((entry) => (
                    <button
                      key={entry.city}
                      type="button"
                      onClick={() => onSelectCity(entry.city)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium cursor-pointer transition-colors ${
                        location?.city === entry.city
                          ? 'bg-[#380812] text-amber-200'
                          : 'bg-stone-100 hover:bg-amber-100 text-stone-800'
                      }`}
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
