import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Building2,
  BarChart3,
  CalendarDays,
  PlusCircle,
  ShieldCheck,
  Folder
} from 'lucide-react';

interface NavigationProps {
  activeView: string;
  setActiveView: (view: string) => void;
  onOpenNewBooking: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeView,
  setActiveView,
  onOpenNewBooking
}) => {
  const { language, currentUser } = useApp();
  const isAdmin = currentUser.role === 'super_admin' || currentUser.role === 'admin';

  const navItems = [
    {
      id: 'dana',
      labelAr: 'قاعة الدانة',
      labelEn: 'Al Dana Room',
      icon: Building2,
      code: 'DANA-01'
    },
    {
      id: 'waha',
      labelAr: 'قاعة الواحة',
      labelEn: 'Al Waha Room',
      icon: Building2,
      code: 'WAHA-02'
    },
    {
      id: 'bookings',
      labelAr: 'سجل الحجوزات',
      labelEn: 'Bookings Archive',
      icon: Folder
    },
    {
      id: 'analytics',
      labelAr: 'جميع الإحصائيات',
      labelEn: 'All Analytics',
      icon: BarChart3
    },
    {
      id: 'calendar',
      labelAr: 'التقويم',
      labelEn: 'Calendar',
      icon: CalendarDays
    },
    ...(isAdmin
      ? [
          {
            id: 'exceptions',
            labelAr: 'استثناءات الإدارة',
            labelEn: 'Admin Exceptions',
            icon: ShieldCheck
          }
        ]
      : [])
  ];

  return (
    <nav className="bg-white border-b border-slate-200/90 sticky top-16 sm:top-[70px] z-30 shadow-2xs transition-all">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-2 gap-3">
          
          {/* Main Navigation Tabs */}
          <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-0.5 w-full sm:w-auto touch-pan-x">
            {navItems.map((item, idx) => {
              const Icon = item.icon;
              const isActive =
                activeView === item.id ||
                (item.id === 'dana' && activeView === 'dashboard');
              return (
                <React.Fragment key={item.id}>
                  {idx > 0 && (
                    <div className="h-5 w-px bg-slate-200 mx-0.5 sm:mx-1 hidden sm:block shrink-0" />
                  )}
                  <button
                    onClick={() => setActiveView(item.id)}
                    className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-[13px] font-bold transition-all whitespace-nowrap shrink-0 focus:outline-hidden cursor-pointer ${
                      isActive
                        ? 'bg-[#0052cc] text-white shadow-xs'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-white' : 'text-[#0052cc]'
                      }`}
                    />
                    <span>{language === 'ar' ? item.labelAr : item.labelEn}</span>
                    {item.code && (
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold ${
                          isActive
                            ? 'bg-[#003d99] text-blue-100 border border-blue-400/30'
                            : 'bg-slate-100 text-slate-500 border border-slate-200/80'
                        }`}
                      >
                        {item.code}
                      </span>
                    )}
                  </button>
                </React.Fragment>
              );
            })}
          </div>

          {/* Quick Booking Button on the left side matching Reference Image */}
          <div className="hidden sm:flex items-center shrink-0">
            <button
              onClick={onOpenNewBooking}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0f1f38] hover:bg-[#162d4c] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>{language === 'ar' ? 'حجز قاعة جديد' : 'New Booking'}</span>
              <PlusCircle className="w-4 h-4 text-[#38bdf8] shrink-0" />
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
};
