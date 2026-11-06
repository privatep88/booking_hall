import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SaaedLogo } from './SaaedLogo';
import {
  Bell,
  Globe,
  User as UserIcon,
  Calendar,
  CalendarPlus,
  Clock,
  Shield,
  ChevronDown,
  PlusCircle,
  Menu,
  X,
  DoorOpen,
  BarChart3,
  CalendarDays,
  ShieldCheck,
  LogOut,
  FolderOpen,
  Trash2
} from 'lucide-react';
import { formatDateAr, formatDateEn, getActualCurrentTime, formatTime12, formatTimeRange12 } from '../utils/dateUtils';

interface HeaderProps {
  onOpenNewBooking: () => void;
  activeView: string;
  setActiveView: (view: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNewBooking,
  activeView,
  setActiveView
}) => {
  const {
    currentUser,
    users,
    setCurrentUser,
    language,
    setLanguage,
    bookings,
    currentDate,
    logout
  } = useApp();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [liveDubaiTime, setLiveDubaiTime] = React.useState<string>(() => getActualCurrentTime());

  const [readNotificationIds, setReadNotificationIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('saaed_read_notifications_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [clearedNotificationIds, setClearedNotificationIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('saaed_cleared_notifications_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  React.useEffect(() => {
    try {
      localStorage.setItem('saaed_read_notifications_v1', JSON.stringify(readNotificationIds));
    } catch {
      // ignore storage errors
    }
  }, [readNotificationIds]);

  React.useEffect(() => {
    try {
      localStorage.setItem('saaed_cleared_notifications_v1', JSON.stringify(clearedNotificationIds));
    } catch {
      // ignore storage errors
    }
  }, [clearedNotificationIds]);

  React.useEffect(() => {
    const t = setInterval(() => {
      setLiveDubaiTime(getActualCurrentTime());
    }, 10000);
    return () => clearInterval(t);
  }, []);

  // Filter today's upcoming meetings for notification center (excluding cleared notifications)
  const todayBookings = bookings.filter(
    (b) =>
      b.date === currentDate &&
      b.status === 'confirmed' &&
      !clearedNotificationIds.includes(b.id)
  );

  const unreadBookings = todayBookings.filter(
    (b) => !readNotificationIds.includes(b.id)
  );

  const handleToggleNotifications = () => {
    const nextOpen = !showNotifications;
    setShowNotifications(nextOpen);
    if (nextOpen && todayBookings.length > 0) {
      setReadNotificationIds((prev) => {
        const merged = new Set([...prev, ...todayBookings.map((b) => b.id)]);
        return Array.from(merged);
      });
    }
  };

  const handleClearSingleNotification = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setClearedNotificationIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const handleClearAllNotifications = (e: React.MouseEvent) => {
    e.stopPropagation();
    setClearedNotificationIds((prev) => {
      const merged = new Set([...prev, ...todayBookings.map((b) => b.id)]);
      return Array.from(merged);
    });
  };

  const roleLabels: Record<string, { ar: string; en: string; shortAr: string }> = {
    super_admin: { ar: 'مدير عام النظام (Super Admin)', en: 'Super Admin', shortAr: 'مشرف إداري' },
    admin: { ar: 'مدير النظام (Admin)', en: 'Administrator', shortAr: 'مشرف إداري' },
    coordinator: { ar: 'منسق الحجوزات (Coordinator)', en: 'Booking Coordinator', shortAr: 'منسق الحجوزات' },
    employee: { ar: 'موظف (Employee)', en: 'Employee', shortAr: 'موظف' },
    viewer: { ar: 'مستعرض فقط (Viewer)', en: 'Viewer', shortAr: 'مستعرض' }
  };

  const isAdmin = currentUser.role === 'super_admin' || currentUser.role === 'admin';

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-2xs transition-colors">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-[70px] gap-2">
          
          {/* Right side (in RTL): Original SAAED Logo & Bilingual System Title */}
          <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
            <button
              onClick={() => setActiveView('dana')}
              className="flex items-center gap-2.5 sm:gap-3.5 focus:outline-hidden hover:opacity-95 transition-opacity text-start cursor-pointer"
            >
              <SaaedLogo className="h-9 sm:h-11 w-auto shrink-0" />
              <div className="h-8 w-px bg-slate-200 hidden sm:block" />
              <div className="text-start">
                <h1 className="text-xs sm:text-[17px] font-extrabold text-[#0f296b] leading-tight tracking-tight whitespace-nowrap">
                  {language === 'ar' ? 'نظام إدارة وحجز قاعات الاجتماعات' : 'Meeting Room Management & Booking System'}
                </h1>
                <span className="block text-[9px] sm:text-[11px] font-semibold text-[#1e40af] tracking-tight leading-tight mt-0.5 whitespace-nowrap">
                  {language === 'ar' ? 'Meeting Room Management & Booking System' : 'نظام إدارة وحجز قاعات الاجتماعات — ساعد (SAAED)'}
                </span>
              </div>
            </button>
          </div>

          {/* Center: Live Date & Time Pill matching Reference Image */}
          <div className="hidden lg:flex items-center gap-3 px-4 py-1.5 rounded-full bg-[#f1f5f9] border border-slate-200/90 text-xs font-medium text-slate-700 shrink-0 shadow-2xs">
            <div className="flex items-center gap-1.5 text-slate-700 font-bold">
              <Calendar className="w-4 h-4 text-[#0052cc]" />
              <span>{language === 'ar' ? formatDateAr(currentDate) : formatDateEn(currentDate)}</span>
            </div>
            <span className="text-slate-300 font-light">|</span>
            <div className="flex items-center gap-1.5 text-slate-900">
              <span className="font-extrabold text-[#0f172a] tabular-nums text-[13px]">
                {formatTime12(liveDubaiTime, language as 'ar' | 'en')}
              </span>
            </div>
          </div>

          {/* Left side (in RTL): Action button, Notifications, Language, User Profile */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Primary New Booking Button */}
            <button
              onClick={onOpenNewBooking}
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-[#0052cc] hover:bg-[#0043a8] text-white font-bold text-xs sm:text-[13px] shadow-xs transition-all active:scale-95 cursor-pointer whitespace-nowrap"
              title="حجز قاعة جديد"
            >
              <CalendarPlus className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">
                {language === 'ar' ? 'حجز قاعة جديد' : 'New Booking'}
              </span>
            </button>

            {/* Notifications Menu */}
            <div className="relative">
              <button
                onClick={handleToggleNotifications}
                className="relative p-2 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-hidden cursor-pointer"
                aria-label="الإشعارات"
              >
                <Bell className="w-5 h-5" />
                {unreadBookings.length > 0 && (
                  <span className="absolute top-1 right-1 inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-[#e11d48] text-white text-[10px] font-extrabold leading-none ring-2 ring-white tabular-nums">
                    {unreadBookings.length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div
                  className="absolute left-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2"
                  onMouseLeave={() => setShowNotifications(false)}
                >
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">
                        {language === 'ar' ? 'إشعارات اليوم' : "Today's Alerts"}
                      </span>
                      {todayBookings.length > 0 && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-semibold tabular-nums">
                          {todayBookings.length}
                        </span>
                      )}
                    </div>
                    {todayBookings.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllNotifications}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-md transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>{language === 'ar' ? 'مسح الإشعارات' : 'Clear All'}</span>
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                    {todayBookings.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500">
                        {language === 'ar' ? 'لا توجد إشعارات حالياً' : 'No notifications currently'}
                      </div>
                    ) : (
                      todayBookings.map((tb) => (
                        <div
                          key={tb.id}
                          onClick={() => {
                            setReadNotificationIds((prev) =>
                              prev.includes(tb.id) ? prev : [...prev, tb.id]
                            );
                          }}
                          className="p-3 hover:bg-slate-50 text-xs flex items-start justify-between gap-2 group"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-slate-900 truncate">{tb.title}</p>
                            <div className="flex items-center justify-between text-slate-500 mt-1 gap-2">
                              <span className="text-blue-600 font-medium truncate">{tb.roomNameAr}</span>
                              <span className="font-mono tabular-nums shrink-0">
                                {formatTimeRange12(tb.startTime, tb.endTime, language as 'ar' | 'en')}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => handleClearSingleNotification(e, tb.id)}
                            title={language === 'ar' ? 'مسح هذا الإشعار' : 'Clear notification'}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="h-5 w-px bg-slate-200 hidden sm:block" />

            {/* Language Switch */}
            <button
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-extrabold text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer whitespace-nowrap"
              title="تغيير اللغة"
            >
              <Globe className="w-4 h-4 text-[#0052cc]" />
              <span>{language === 'ar' ? 'EN' : 'AR'}</span>
            </button>

            <div className="h-5 w-px bg-slate-200 hidden sm:block" />

            {/* User Profile & Role Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 transition-all focus:outline-hidden cursor-pointer"
              >
                <div className="w-9 h-9 rounded-full bg-[#0f296b] text-white flex items-center justify-center font-bold text-xs shadow-2xs overflow-hidden ring-2 ring-blue-100 shrink-0">
                  {currentUser.avatarUrl ? (
                    <img src={currentUser.avatarUrl} alt={currentUser.fullName} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  ) : (
                    <svg viewBox="0 0 40 40" className="w-full h-full">
                      <rect width="40" height="40" fill="#e2e8f0" />
                      <circle cx="20" cy="15" r="7" fill="#0f296b" />
                      <path d="M8 38 C8 27 32 27 32 38 Z" fill="#0f296b" />
                    </svg>
                  )}
                </div>
                <div className="hidden lg:block text-start leading-tight">
                  <div className="text-xs font-extrabold text-slate-900 truncate max-w-[125px]">
                    {currentUser.fullName}
                  </div>
                  <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
                    {language === 'ar'
                      ? roleLabels[currentUser.role]?.shortAr || currentUser.role
                      : roleLabels[currentUser.role]?.en || currentUser.role}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {showUserMenu && (
                <div
                  className="absolute left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 text-xs animate-in fade-in"
                  onMouseLeave={() => setShowUserMenu(false)}
                >
                  <div className="p-3 bg-slate-50 rounded-lg mb-2 flex items-start gap-3">
                    <div className="w-11 h-11 rounded-full bg-[#0f296b] text-white flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden ring-2 ring-blue-100 shadow-2xs">
                      {currentUser.avatarUrl ? (
                        <img src={currentUser.avatarUrl} alt={currentUser.fullName} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                      ) : (
                        currentUser.fullName.slice(0, 2)
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900 text-sm truncate">{currentUser.fullName}</p>
                      <p className="text-[11px] font-semibold text-blue-700 mt-0.5 line-clamp-1">
                        {currentUser.departmentNameAr || 'إدارة الخدمات العامة'}
                      </p>
                      <p className="text-slate-500 text-[11px] mt-0.5 truncate">{currentUser.email}</p>
                      <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-semibold text-[11px]">
                        <Shield className="w-3 h-3" />
                        <span>{roleLabels[currentUser.role]?.[language] || currentUser.role}</span>
                      </div>
                    </div>
                  </div>

                  {users.length > 1 && (
                    <>
                      <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        {language === 'ar' ? 'تبديل المستخدم (لاختبار الصلاحيات)' : 'Switch User / Role (RBAC Testing)'}
                      </div>

                      <div className="space-y-1">
                        {users.map((u) => (
                          <button
                            key={u.id}
                            onClick={() => {
                              setCurrentUser(u);
                              setShowUserMenu(false);
                            }}
                            className={`w-full flex items-center justify-between p-2 rounded-md text-start transition-colors ${
                              u.id === currentUser.id
                                ? 'bg-blue-50 text-blue-900 font-bold'
                                : 'hover:bg-slate-100 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-6 h-6 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-[10px] shrink-0 overflow-hidden ring-1 ring-slate-200">
                                {u.avatarUrl ? (
                                  <img src={u.avatarUrl} alt={u.fullName} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                                ) : (
                                  u.fullName.slice(0, 2)
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="font-medium truncate">{u.fullName}</div>
                                <div className="text-[10px] text-slate-500 truncate">{u.departmentNameAr || u.departmentId}</div>
                              </div>
                            </div>
                            <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-700">
                              {u.role}
                            </span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  <div className="mt-2 pt-2 border-t border-slate-100 space-y-1">
                    <button
                      onClick={() => {
                        setActiveView('profile');
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-slate-100 text-slate-700"
                    >
                      <UserIcon className="w-3.5 h-3.5 text-blue-600" />
                      <span>{language === 'ar' ? 'ملفي الشخصي (حسابي)' : 'My Profile'}</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveView('bookings');
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-slate-100 text-slate-700"
                    >
                      <FolderOpen className="w-3.5 h-3.5 text-blue-600" />
                      <span>{language === 'ar' ? 'سجل الحجوزات الشامل' : 'All Bookings List'}</span>
                    </button>

                    {/* Admin-only navigation options */}
                    {isAdmin ? (
                      <>
                        <button
                          onClick={() => {
                            setActiveView('exceptions');
                            setShowUserMenu(false);
                          }}
                          className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-slate-100 text-slate-700"
                        >
                          <Shield className="w-3.5 h-3.5 text-amber-600" />
                          <span className="font-bold text-amber-900">{language === 'ar' ? 'استثناءات الإدارة والسياسات' : 'Admin Exceptions'}</span>
                        </button>
                        <button
                          onClick={() => {
                            setActiveView('settings');
                            setShowUserMenu(false);
                          }}
                          className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-slate-100 text-slate-700"
                        >
                          <Shield className="w-3.5 h-3.5 text-slate-500" />
                          <span>{language === 'ar' ? 'إعدادات النظام والسياسات' : 'System Settings'}</span>
                        </button>
                        <button
                          onClick={() => {
                            setActiveView('audit');
                            setShowUserMenu(false);
                          }}
                          className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-slate-100 text-slate-700"
                        >
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>{language === 'ar' ? 'سجل العمليات والرقابة (Audit)' : 'Audit Log'}</span>
                        </button>
                      </>
                    ) : (
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-[10px] text-slate-600 space-y-0.5">
                        <div className="font-bold text-slate-800 flex items-center gap-1">
                          <Shield className="w-3 h-3 text-slate-400" />
                          <span>الحساب مقيد بالضوابط القياسية</span>
                        </div>
                        <p className="text-slate-500">لا تشمل حسابك خيارات واستثناءات الإدارة لحجز القاعات</p>
                      </div>
                    )}

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-red-50 text-red-600 font-bold transition-colors mt-1 border-t border-slate-100 pt-2"
                    >
                      <LogOut className="w-3.5 h-3.5 text-red-600" />
                      <span>{language === 'ar' ? 'تسجيل الخروج' : 'Logout'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Hamburger Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-hidden"
              aria-label={isMobileMenuOpen ? 'إغلاق القائمة' : 'فتح القائمة الرئيسية'}
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-slate-800" />
              ) : (
                <Menu className="w-5 h-5 text-slate-800" />
              )}
            </button>

          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer for Smartphones & Tablets */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white/98 backdrop-blur-md px-4 py-4 space-y-4 max-h-[85vh] overflow-y-auto shadow-xl animate-in slide-in-from-top-2">
          {/* Live Date & Time for Mobile */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div className="flex items-center gap-1.5 text-blue-900 font-semibold">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>{language === 'ar' ? formatDateAr(currentDate) : formatDateEn(currentDate)}</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-slate-700 font-bold tabular-nums">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>{formatTime12(liveDubaiTime, language as 'ar' | 'en')}</span>
            </div>
          </div>

          {/* Primary Navigation Options */}
          <div className="space-y-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 pb-1">
              {language === 'ar' ? 'التنقل بين الأقسام' : 'Navigation'}
            </div>
            {[
              { id: 'dana', label: 'قاعة الدانة', code: 'DANA-01', icon: DoorOpen },
              { id: 'waha', label: 'قاعة الواحة', code: 'WAHA-02', icon: DoorOpen },
              { id: 'bookings', label: 'سجل الحجوزات', icon: FolderOpen },
              { id: 'analytics', label: 'جميع الإحصائيات', icon: BarChart3 },
              { id: 'calendar', label: 'التقويم', icon: CalendarDays },
              ...(isAdmin ? [{ id: 'exceptions', label: 'استثناءات الإدارة', icon: ShieldCheck }] : [])
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveView(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all text-start cursor-pointer ${
                    isActive
                      ? 'bg-[#0052cc] text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.code && (
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      {item.code}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* User Details & Profile shortcut */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#0f296b] text-white flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden ring-2 ring-blue-100 shadow-2xs">
                {currentUser.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt={currentUser.fullName} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                ) : (
                  currentUser.fullName.slice(0, 2)
                )}
              </div>
              <div className="min-w-0 flex-1 text-start">
                <p className="font-bold text-slate-900 text-xs truncate">{currentUser.fullName}</p>
                <p className="text-[10px] text-slate-500 truncate">{currentUser.departmentNameAr || currentUser.departmentId}</p>
                <span className="inline-block mt-0.5 text-[10px] px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold">
                  {roleLabels[currentUser.role]?.[language] || currentUser.role}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex flex-wrap gap-1.5">
              <button
                onClick={() => {
                  setActiveView('profile');
                  setIsMobileMenuOpen(false);
                }}
                className="flex-1 py-1.5 px-2.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold text-center"
              >
                ملفي الشخصي
              </button>
              {isAdmin && (
                <>
                  <button
                    onClick={() => {
                      setActiveView('settings');
                      setIsMobileMenuOpen(false);
                    }}
                    className="py-1.5 px-2.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold"
                  >
                    الإعدادات
                  </button>
                  <button
                    onClick={() => {
                      setActiveView('audit');
                      setIsMobileMenuOpen(false);
                    }}
                    className="py-1.5 px-2.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold"
                  >
                    الرقابة
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  logout();
                }}
                className="py-1.5 px-2.5 rounded-lg bg-red-50 border border-red-200 hover:bg-red-100 text-red-600 text-xs font-bold flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>خروج</span>
              </button>
            </div>
          </div>

          {/* Primary CTA: New Booking */}
          <button
            onClick={() => {
              onOpenNewBooking();
              setIsMobileMenuOpen(false);
            }}
            className="w-full py-2.5 rounded-xl bg-[#0052cc] hover:bg-[#0043a8] text-white font-bold text-sm shadow-xs flex items-center justify-center gap-2 transition-transform active:scale-98"
          >
            <PlusCircle className="w-4 h-4" />
            <span>حجز قاعة جديد</span>
          </button>
        </div>
      )}
    </header>
  );
};
