import React from 'react';

interface SaaedLogoProps {
  className?: string;
  showText?: boolean;
  variant?: 'full' | 'compact' | 'light';
}

export const SaaedLogo: React.FC<SaaedLogoProps> = ({
  className = 'h-10 w-auto'
}) => {
  const baseUrl = import.meta.env.BASE_URL || '/';
  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <img
        src={`${baseUrl}assets/aistudio/logo_1afd1154.png`}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          if (!target.src.endsWith('new-logo.png')) {
            target.src = `${baseUrl}new-logo.png`;
          }
        }}
        alt="شعار شركة ساعد للأنظمة المرورية - SAAED"
        referrerPolicy="no-referrer"
        className="h-full w-auto max-h-14 object-contain"
      />
    </div>
  );
};
