import React, { useRef, useState } from 'react';
import { Camera, Upload, Trash2, Link2, RefreshCw, AlertCircle } from 'lucide-react';
import { compressAndReadImageFile } from '../utils/imageUpload';
import { useLanguage } from '../context/LanguageContext';

interface ImageUploadFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  variant?: 'avatar' | 'banner';
  maxDimension?: number;
  helperText?: string;
  urlPlaceholder?: string;
  allowUrlInput?: boolean;
}

export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  label,
  value,
  onChange,
  variant = 'avatar',
  maxDimension,
  helperText,
  urlPlaceholder = 'https://...',
  allowUrlInput = true,
}) => {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showUrlBox, setShowUrlBox] = useState(false);

  const isDataUrl = value.startsWith('data:image/');

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset input so choosing the same file again still triggers onChange
    e.target.value = '';
    if (!file) return;

    setUploadError(null);
    setIsProcessing(true);

    try {
      const compressedDataUrl = await compressAndReadImageFile(file, {
        maxDimension: maxDimension ?? (variant === 'banner' ? 960 : 720),
        quality: 0.82,
      });
      onChange(compressedDataUrl);
      setShowUrlBox(false);
    } catch (err: unknown) {
      const code = err instanceof Error ? err.message : '';
      if (code === 'INVALID_TYPE') {
        setUploadError(
          t(
            'Please choose a valid image file (JPG, PNG, or WEBP).',
            'कृपया एक मान्य फोटो फ़ाइल चुनें (JPG, PNG या WEBP)।'
          )
        );
      } else if (code === 'FILE_TOO_LARGE') {
        setUploadError(
          t(
            'Image file is too large (max 20 MB). Please pick a smaller photo.',
            'फ़ोटो का आकार बहुत बड़ा है (अधिकतम 20 MB)। कृपया दूसरी फ़ोटो चुनें।'
          )
        );
      } else {
        setUploadError(
          t(
            'Could not read this image. Please try another photo.',
            'यह फ़ोटो खोली नहीं जा सकी। कृपया कोई दूसरी फ़ोटो चुनें।'
          )
        );
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-2 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="block font-bold text-slate-700">{label}</label>
        {allowUrlInput && (
          <button
            type="button"
            onClick={() => setShowUrlBox((prev) => !prev)}
            className="text-[11px] font-semibold text-amber-800 hover:text-[#380812] flex items-center gap-1 cursor-pointer"
          >
            <Link2 className="w-3 h-3" />
            <span>
              {showUrlBox
                ? t('Hide URL field', 'लिंक बॉक्स छिपाएं')
                : t('Or paste image URL', 'या इमेज लिंक डालें')}
            </span>
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="sr-only"
      />

      {value ? (
        <div
          className={`p-3 rounded-2xl border border-amber-200 bg-amber-50/40 ${
            variant === 'banner' ? 'space-y-2.5' : 'flex flex-wrap items-center gap-3.5'
          }`}
        >
          <div
            className={
              variant === 'banner'
                ? 'w-full h-32 sm:h-36 rounded-xl overflow-hidden border border-stone-200 bg-white'
                : 'w-20 h-20 rounded-2xl overflow-hidden border-2 border-amber-300 bg-white shrink-0 shadow-xs'
            }
          >
            <img
              src={value}
              alt={label}
              className={`w-full h-full object-cover ${variant === 'avatar' ? 'object-top' : 'object-center'}`}
            />
          </div>

          <div className={`min-w-0 ${variant === 'banner' ? 'flex flex-wrap items-center justify-between gap-2' : 'flex-1 space-y-2'}`}>
            <p className="text-[11px] text-stone-600 font-medium truncate">
              {isDataUrl
                ? t('Photo uploaded from device', 'फ़ोटो डिवाइस से अपलोड की गई')
                : t('Image preview ready', 'फ़ोटो प्रीव्यू तैयार है')}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => fileInputRef.current?.click()}
                className="bg-white hover:bg-amber-100/70 text-[#380812] border border-amber-300 font-semibold px-3 py-1.5 rounded-xl text-[11px] flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                {isProcessing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-700" />
                ) : (
                  <Camera className="w-3.5 h-3.5 text-amber-700" />
                )}
                <span>{t('Change Photo', 'फोटो बदलें')}</span>
              </button>

              <button
                type="button"
                onClick={() => onChange('')}
                className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold px-2.5 py-1.5 rounded-xl text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t('Remove', 'हटाएं')}</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={isProcessing}
          onClick={() => fileInputRef.current?.click()}
          className="w-full border-2 border-dashed border-amber-300 hover:border-[#851834] bg-amber-50/40 hover:bg-amber-50/80 rounded-2xl p-4 sm:p-5 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 group"
        >
          <div className="w-10 h-10 rounded-xl bg-white border border-amber-200 shadow-2xs flex items-center justify-center text-[#851834] group-hover:scale-105 transition-transform">
            {isProcessing ? (
              <RefreshCw className="w-5 h-5 animate-spin text-amber-700" />
            ) : (
              <Upload className="w-5 h-5" />
            )}
          </div>
          <span className="font-bold text-stone-800 text-xs">
            {isProcessing
              ? t('Optimizing photo...', 'फोटो तैयार हो रही है...')
              : t('Tap to Upload Photo from Gallery / Camera', 'गैलरी या कैमरे से फोटो अपलोड करने के लिए टैप करें')}
          </span>
          <span className="text-[11px] text-stone-500">
            {helperText ||
              t(
                'Supports JPG, PNG, WEBP • Auto-resized for fast loading',
                'JPG, PNG, WEBP समर्थित • स्वतः ऑप्टिमाइज़ किया जाता है'
              )}
          </span>
        </button>
      )}

      {showUrlBox && (
        <div className="pt-1">
          <input
            type="url"
            value={isDataUrl ? '' : value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full border border-amber-300 rounded-xl p-2.5 text-xs bg-white focus:ring-2 focus:ring-amber-500"
            placeholder={urlPlaceholder}
          />
        </div>
      )}

      {uploadError && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-[11px] flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
          <span>{uploadError}</span>
        </div>
      )}
    </div>
  );
};
