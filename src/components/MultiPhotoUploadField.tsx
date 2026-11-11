import React, { useRef, useState } from 'react';
import { Camera, Upload, Trash2, Link2, RefreshCw, AlertCircle, Star, Plus } from 'lucide-react';
import { compressAndReadImageFile } from '../utils/imageUpload';
import { useLanguage } from '../context/LanguageContext';

interface MultiPhotoUploadFieldProps {
  label: string;
  photos: string[];
  onChange: (photos: string[]) => void;
  maxPhotos?: number;
  maxDimension?: number;
  helperText?: string;
}

export const MultiPhotoUploadField: React.FC<MultiPhotoUploadFieldProps> = ({
  label,
  photos,
  onChange,
  maxPhotos = 6,
  maxDimension = 720,
  helperText,
}) => {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showUrlBox, setShowUrlBox] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  const handleFilesSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const files: File[] = Array.from(fileList);
    e.target.value = '';

    const remainingSlots = maxPhotos - photos.length;
    if (remainingSlots <= 0) {
      setUploadError(
        t(
          `Maximum ${maxPhotos} photos allowed per profile.`,
          `प्रति प्रोफ़ाइल अधिकतम ${maxPhotos} फ़ोटो जोड़ी जा सकती हैं।`
        )
      );
      return;
    }

    setUploadError(null);
    setIsProcessing(true);

    const filesToProcess = files.slice(0, remainingSlots);
    const newlyUploaded: string[] = [];
    let failedCount = 0;

    for (const file of filesToProcess) {
      try {
        const compressed = await compressAndReadImageFile(file, {
          maxDimension,
          quality: 0.8,
        });
        if (!photos.includes(compressed) && !newlyUploaded.includes(compressed)) {
          newlyUploaded.push(compressed);
        }
      } catch {
        failedCount++;
      }
    }

    if (newlyUploaded.length > 0) {
      onChange([...photos, ...newlyUploaded]);
    }

    if (files.length > remainingSlots) {
      setUploadError(
        t(
          `Added ${newlyUploaded.length} photo(s). Maximum ${maxPhotos} photos allowed.`,
          `${newlyUploaded.length} फ़ोटो जोड़ी गईं। अधिकतम ${maxPhotos} फ़ोटो की अनुमति है।`
        )
      );
    } else if (failedCount > 0) {
      setUploadError(
        t(
          `${failedCount} file(s) could not be read. Please choose valid JPG, PNG, or WEBP images.`,
          `${failedCount} फ़ाइल खोली नहीं जा सकी। कृपया मान्य JPG, PNG या WEBP फ़ोटो चुनें।`
        )
      );
    }

    setIsProcessing(false);
  };

  const handleRemovePhoto = (index: number) => {
    onChange(photos.filter((_, i) => i !== index));
  };

  const handleSetPrimary = (index: number) => {
    if (index <= 0 || index >= photos.length) return;
    const selected = photos[index];
    const rest = photos.filter((_, i) => i !== index);
    onChange([selected, ...rest]);
  };

  const handleAddUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (photos.length >= maxPhotos) {
      setUploadError(
        t(
          `Maximum ${maxPhotos} photos allowed per profile.`,
          `प्रति प्रोफ़ाइल अधिकतम ${maxPhotos} फ़ोटो जोड़ी जा सकती हैं।`
        )
      );
      return;
    }
    if (!photos.includes(trimmed)) {
      onChange([...photos, trimmed]);
    }
    setUrlInput('');
    setShowUrlBox(false);
    setUploadError(null);
  };

  return (
    <div className="space-y-2.5 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <label className="block font-bold text-slate-700">{label}</label>
          <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-200">
            {photos.length}/{maxPhotos}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowUrlBox((prev) => !prev)}
          className="text-[11px] font-semibold text-amber-800 hover:text-[#380812] flex items-center gap-1 cursor-pointer"
        >
          <Link2 className="w-3 h-3" />
          <span>
            {showUrlBox
              ? t('Hide URL input', 'लिंक बॉक्स छिपाएं')
              : t('Or add image URL', 'या इमेज लिंक जोड़ें')}
          </span>
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFilesSelect}
        className="sr-only"
      />

      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded-2xl border border-amber-200 bg-amber-50/35">
          {photos.map((photoUrl, idx) => (
            <div
              key={`${idx}-${photoUrl.slice(0, 24)}`}
              className={`relative rounded-xl overflow-hidden bg-white border shadow-2xs group ${
                idx === 0 ? 'border-amber-500 ring-2 ring-amber-400/40' : 'border-stone-200'
              }`}
            >
              <div className="aspect-square w-full overflow-hidden bg-stone-100">
                <img
                  src={photoUrl}
                  alt={`Profile photo ${idx + 1}`}
                  className="w-full h-full object-cover object-top"
                />
              </div>

              {/* Top-left Primary or Index Badge */}
              <div className="absolute top-1.5 left-1.5">
                {idx === 0 ? (
                  <span className="bg-[#380812]/90 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                    <Star className="w-2.5 h-2.5 fill-amber-300 text-amber-300" />
                    {t('Primary', 'मुख्य')}
                  </span>
                ) : (
                  <span className="bg-black/65 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-md">
                    #{idx + 1}
                  </span>
                )}
              </div>

              {/* Remove Button */}
              <button
                type="button"
                onClick={() => handleRemovePhoto(idx)}
                title={t('Remove photo', 'फ़ोटो हटाएं')}
                className="absolute top-1.5 right-1.5 bg-black/70 hover:bg-rose-600 text-white p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              {/* Set Primary CTA on Secondary Photos */}
              {idx > 0 && (
                <button
                  type="button"
                  onClick={() => handleSetPrimary(idx)}
                  className="w-full bg-white hover:bg-amber-50 text-[#380812] border-t border-stone-200 py-1.5 px-2 text-[10px] font-bold transition-colors cursor-pointer"
                >
                  {t('Set as Primary Photo', 'मुख्य फ़ोटो बनाएं')}
                </button>
              )}
            </div>
          ))}

          {/* Add More Tile inside grid if under limit */}
          {photos.length < maxPhotos && (
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-amber-300 hover:border-[#851834] bg-white/80 hover:bg-amber-50 flex flex-col items-center justify-center gap-1.5 p-2 text-center cursor-pointer transition-all"
            >
              {isProcessing ? (
                <RefreshCw className="w-5 h-5 animate-spin text-amber-700" />
              ) : (
                <Plus className="w-6 h-6 text-[#851834]" />
              )}
              <span className="font-bold text-[11px] text-stone-800">
                {t('Add More Photos', 'और फ़ोटो जोड़ें')}
              </span>
              <span className="text-[10px] text-stone-500">
                {t(`${maxPhotos - photos.length} left`, `${maxPhotos - photos.length} शेष`)}
              </span>
            </button>
          )}
        </div>
      )}

      {photos.length === 0 && (
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
          <span className="font-bold text-stone-800 text-xs flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-amber-700" />
            {isProcessing
              ? t('Optimizing photos...', 'फ़ोटो तैयार हो रही हैं...')
              : t(`Tap to Upload Multiple Photos (Up to ${maxPhotos})`, `एक या अधिक फ़ोटो अपलोड करने के लिए टैप करें (अधिकतम ${maxPhotos})`)}
          </span>
          <span className="text-[11px] text-stone-500">
            {helperText ||
              t(
                'Select multiple portrait/family photos from your gallery or camera',
                'गैलरी या कैमरे से एक से अधिक फ़ोटो चुनें'
              )}
          </span>
        </button>
      )}

      {showUrlBox && (
        <div className="flex flex-wrap gap-2 pt-1">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="flex-1 min-w-[180px] border border-amber-300 rounded-xl p-2.5 text-xs bg-white focus:ring-2 focus:ring-amber-500"
            placeholder={t('https://... (paste image URL)', 'https://... (फ़ोटो लिंक डालें)')}
          />
          <button
            type="button"
            onClick={handleAddUrl}
            className="bg-[#380812] text-amber-200 font-bold px-3.5 py-2 rounded-xl text-xs cursor-pointer shrink-0"
          >
            {t('Add Photo', 'फ़ोटो जोड़ें')}
          </button>
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
