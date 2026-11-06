import React from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck } from 'lucide-react';
import heroWahaImg from '../assets/images/hero_conference_room_waha_1793953314083.jpg';

export const Footer: React.FC = () => {
  const { language } = useApp();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden bg-[#071428] border-t border-blue-900/40 mt-10 py-5 text-xs text-slate-300 transition-colors">
      {/* Subtle architectural city skyline silhouette & dark corporate gradient */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none bg-cover bg-center"
        style={{
          backgroundImage: `url("${heroWahaImg}")`,
          filter: 'blur(2px) brightness(0.45) contrast(1.2)'
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#050f20]/95 via-[#091b38]/90 to-[#050f20]/95 pointer-events-none" />

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Right side (RTL): Company Name & System Name */}
          <div className="flex flex-col items-center md:items-start text-center md:text-start">
            <span className="font-extrabold text-white text-xs sm:text-[13px] tracking-tight">
              {language === 'ar' ? 'ساعد للأنظمة المرورية (SAAED)' : 'Saaed for Traffic Systems (SAAED)'}
            </span>
            <span className="text-[11px] font-medium text-blue-300/80 mt-0.5">
              {language === 'ar' ? 'نظام إدارة وحجز قاعات الاجتماعات' : 'Meeting Room Management & Booking System'}
            </span>
          </div>

          {/* Center / Left side (RTL): Copyright, Last Updated, Version Badge */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 text-slate-300/90 text-[11px] sm:text-xs">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-300 shrink-0" />
              <span className="font-medium">
                {language === 'ar'
                  ? `جميع الحقوق محفوظة © ${currentYear}`
                  : `All Rights Reserved © ${currentYear}`}
              </span>
            </div>

            <span className="text-slate-600 hidden sm:inline">|</span>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-300/85">
                {language === 'ar' ? 'آخر تحديث للنظام : أكتوبر 2026' : 'Last Updated: Oct 2026'}
              </span>
            </div>

            <span className="px-2.5 py-0.5 rounded-md bg-slate-800/90 border border-slate-600/80 font-mono text-[11px] font-semibold text-slate-200 tabular-nums shadow-2xs">
              Version 1.0
            </span>
          </div>

        </div>
      </div>
    </footer>
  );
};
