import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export type BrandLogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface BrandLogoProps {
  size?: BrandLogoSize;
  showText?: boolean;
  tone?: 'gold' | 'crimson';
  asHeading?: boolean;
  className?: string;
}

export const BRAND_LOGO_SRC = '/assets/aistudio/Gemini_Generated_Image_b1djv5b1djv5b1dj_a886674d.png';

const LOGO_FRAME_SIZES: Record<BrandLogoSize, string> = {
  xs: 'h-6 w-8 rounded-md',
  sm: 'h-8 w-10 rounded-lg',
  md: 'h-10 w-12 sm:h-11 sm:w-14 rounded-xl',
  lg: 'h-14 w-[4.5rem] rounded-2xl',
  xl: 'h-16 w-20 rounded-2xl',
};

const TEXT_SIZES: Record<BrandLogoSize, string> = {
  xs: 'text-lg',
  sm: 'text-xl sm:text-2xl',
  md: 'text-[22px] sm:text-[27px] lg:text-[30px]',
  lg: 'text-3xl',
  xl: 'text-4xl',
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showText = true,
  tone = 'gold',
  asHeading = false,
  className = '',
}) => {
  const { t } = useLanguage();
  const textColor =
    tone === 'gold'
      ? 'text-gold-gradient drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)]'
      : 'text-[#6e1628]';

  const frameBorder =
    tone === 'gold'
      ? 'border border-amber-300/60 shadow-sm'
      : 'border border-rose-200/90 shadow-xs';

  const TextTag = asHeading ? 'h1' : 'span';

  return (
    <div className={`inline-flex items-center gap-2.5 sm:gap-3 min-w-0 select-none ${className}`}>
      <div
        className={`relative shrink-0 overflow-hidden bg-[#f7f4ec] ${LOGO_FRAME_SIZES[size]} ${frameBorder}`}
      >
        <img
          src={BRAND_LOGO_SRC}
          alt={t('Rathore Rishtey Logo', 'राठौड़ रिश्ते लोगो')}
          className="w-full h-full object-cover object-center scale-[1.9] pointer-events-none"
        />
      </div>
      {showText && (
        <TextTag
          className={`font-logo font-bold tracking-wide leading-tight truncate py-0.5 ${TEXT_SIZES[size]} ${textColor}`}
        >
          {t('Rathore Rishtey', 'राठौड़ रिश्ते')}
        </TextTag>
      )}
    </div>
  );
};
