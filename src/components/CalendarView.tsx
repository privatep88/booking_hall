import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Booking } from '../types';
import {
  Calendar as CalendarIcon,
  ChevronRight,
  ChevronLeft,
  Clock,
  DoorOpen,
  PlusCircle,
  Filter,
  CheckCircle2,
  CalendarDays,
  CalendarRange,
  AlertCircle,
  Coffee
} from 'lucide-react';
import {
  formatDateAr,
  getDayOfWeekNumber,
  isWeekend,
  formatTime12,
  formatTimeRange12,
  getActualCurrentDate
} from '../utils/dateUtils';

interface CalendarViewProps {
  onSelectBooking: (booking: Booking) => void;
  onOpenNewBooking: (roomId?: string, date?: string, startTime?: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  onSelectBooking,
  onOpenNewBooking
}) => {
  const { bookings, rooms, currentDate, language, settings } = useApp();

  const [activeRoomTab, setActiveRoomTab] = useState<'all' | 'room-dana' | 'room-waha'>('all');
  const [calendarViewMode, setCalendarViewMode] = useState<'month' | 'week' | 'day' | 'agenda'>('month');

  // Base date for navigation dynamically parsed from actual currentDate
  const [initY, initM] = currentDate.split('-').map(Number);
  const [selectedMonth, setSelectedMonth] = useState<number>(initM ? initM - 1 : new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(initY || new Date().getFullYear());
  const [selectedDayDate, setSelectedDayDate] = useState<string>(currentDate);

  // Week navigation base date (Monday of the current week)
  const getMondayOfDate = (dateStr: string): string => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    const jsDay = date.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const distanceToMonday = (jsDay + 6) % 7; // Mon=0, Tue=1, ..., Sat=5, Sun=6
    date.setUTCDate(date.getUTCDate() - distanceToMonday);
    return date.toISOString().slice(0, 10);
  };

  const [selectedWeekMonday, setSelectedWeekMonday] = useState<string>(() => getMondayOfDate(currentDate));

  // Filter bookings by room tab and active status
  const filteredBookings = bookings.filter((b) => {
    if (activeRoomTab !== 'all' && b.roomId !== activeRoomTab) return false;
    if (b.status === 'cancelled' || b.status === 'rejected') return false;
    return true;
  });

  // Week headers: Week strictly starts on Monday (الاثنين) and ends on weekend Saturday & Sunday (السبت والأحد)
  const weekDaysConfig = [
    { id: 'mon', nameAr: 'الاثنين', nameEn: 'Monday', isWknd: false, sublabel: 'بداية الأسبوع' },
    { id: 'tue', nameAr: 'الثلاثاء', nameEn: 'Tuesday', isWknd: false, sublabel: 'يوم عمل' },
    { id: 'wed', nameAr: 'الأربعاء', nameEn: 'Wednesday', isWknd: false, sublabel: 'يوم عمل' },
    { id: 'thu', nameAr: 'الخميس', nameEn: 'Thursday', isWknd: false, sublabel: 'يوم عمل' },
    { id: 'fri', nameAr: 'الجمعة', nameEn: 'Friday', isWknd: false, sublabel: 'نهاية أيام العمل' },
    { id: 'sat', nameAr: 'السبت', nameEn: 'Saturday', isWknd: true, sublabel: 'عطلة نهاية الأسبوع' },
    { id: 'sun', nameAr: 'الأحد', nameEn: 'Sunday', isWknd: true, sublabel: 'عطلة نهاية الأسبوع' }
  ];

  // Month days generation with Monday as first day of week
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  
  // 1st day of month JS day: 0=Sun, 1=Mon, ..., 6=Sat
  const firstDayOfMonthDate = new Date(selectedYear, selectedMonth, 1);
  const firstDayJsDay = firstDayOfMonthDate.getDay();
  // Monday-first offset: Mon (1) -> 0, Tue (2) -> 1, ..., Sat (6) -> 5, Sun (0) -> 6
  const leadingBlankCount = (firstDayJsDay + 6) % 7;

  // Previous month trailing days
  const prevMonthTotalDays = new Date(selectedYear, selectedMonth, 0).getDate();
  const leadingDays = Array.from({ length: leadingBlankCount }, (_, i) => {
    const dayNum = prevMonthTotalDays - leadingBlankCount + 1 + i;
    const prevMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
    const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
    const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    return {
      dayNum,
      dateStr,
      isCurrentMonth: false,
      isWknd: isWeekend(dateStr)
    };
  });

  // Current month days
  const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => {
    const dayNum = i + 1;
    const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    return {
      dayNum,
      dateStr,
      isCurrentMonth: true,
      isWknd: isWeekend(dateStr)
    };
  });

  // Next month leading days to complete full 7-column rows
  const renderedCount = leadingDays.length + currentMonthDays.length;
  const trailingBlankCount = (7 - (renderedCount % 7)) % 7;
  const trailingDays = Array.from({ length: trailingBlankCount }, (_, i) => {
    const dayNum = i + 1;
    const nextMonth = selectedMonth === 11 ? 0 : selectedMonth + 1;
    const nextYear = selectedMonth === 11 ? selectedYear + 1 : selectedYear;
    const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    return {
      dayNum,
      dateStr,
      isCurrentMonth: false,
      isWknd: isWeekend(dateStr)
    };
  });

  const monthGridDays = [...leadingDays, ...currentMonthDays, ...trailingDays];

  // Week days generation for Week view (7 days from Monday to Sunday)
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const [y, m, d] = selectedWeekMonday.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    date.setUTCDate(date.getUTCDate() + i);
    const dateStr = date.toISOString().slice(0, 10);
    const cfg = weekDaysConfig[i];
    return {
      index: i,
      nameAr: cfg.nameAr,
      sublabel: cfg.sublabel,
      dateStr,
      dayNum: date.getUTCDate(),
      isWknd: cfg.isWknd
    };
  });

  const monthNamesAr = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const handlePrevWeek = () => {
    const [y, m, d] = selectedWeekMonday.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    date.setUTCDate(date.getUTCDate() - 7);
    setSelectedWeekMonday(date.toISOString().slice(0, 10));
  };

  const handleNextWeek = () => {
    const [y, m, d] = selectedWeekMonday.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    date.setUTCDate(date.getUTCDate() + 7);
    setSelectedWeekMonday(date.toISOString().slice(0, 10));
  };

  const handleResetToCurrent = () => {
    const [y, m] = currentDate.split('-').map(Number);
    setSelectedMonth(m ? m - 1 : new Date().getMonth());
    setSelectedYear(y || new Date().getFullYear());
    setSelectedDayDate(currentDate);
    setSelectedWeekMonday(getMondayOfDate(currentDate));
  };

  return (
    <div className="space-y-6 animate-in fade-in max-w-7xl mx-auto pb-12">
      
      {/* Top Header & Policy Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-800">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                التقويم المؤسسي لقاعات الاجتماعات
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                جدول الاجتماعات المعتمد: يبدأ الأسبوع يوم الاثنين، ونهاية الأسبوع والعطلة يومي السبت والأحد
              </p>
            </div>
          </div>

          {/* Room Filter Selector */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 self-start md:self-auto">
            <button
              onClick={() => setActiveRoomTab('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeRoomTab === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              جميع القاعات
            </button>
            <button
              onClick={() => setActiveRoomTab('room-dana')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeRoomTab === 'room-dana'
                  ? 'bg-blue-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              قاعة الدانة
            </button>
            <button
              onClick={() => setActiveRoomTab('room-waha')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeRoomTab === 'room-waha'
                  ? 'bg-indigo-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              قاعة الواحة
            </button>
          </div>
        </div>

        {/* Corporate Working Week Policy Banner */}
        <div className="p-3 bg-linear-to-r from-blue-50/80 via-slate-50 to-amber-50/80 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-blue-700 shrink-0" />
            <span className="text-slate-800 font-semibold">
              <strong>سياسة الأسبوع:</strong> يبدأ الأسبوع من يوم <strong>الاثنين</strong> • عطلة نهاية الأسبوع يومي <strong>السبت والأحد</strong>
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-bold">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-100/80 text-blue-900 border border-blue-200">
              <span className="w-2 h-2 rounded-full bg-blue-700"></span>
              <span>أيام العمل الرسمية: الاثنين - الجمعة</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100/80 text-amber-900 border border-amber-200">
              <Coffee className="w-3 h-3 text-amber-700" />
              <span>عطلة نهاية الأسبوع: السبت والأحد</span>
            </div>
          </div>
        </div>

      </div>

      {/* View Switcher & Navigation Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        
        {/* Navigation Controls */}
        <div className="flex items-center gap-3">
          {calendarViewMode === 'month' ? (
            <>
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                  title="الشهر السابق"
                >
                  <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                  title="الشهر القادم"
                >
                  <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                </button>
              </div>

              <h2 className="text-base font-bold text-slate-900">
                {monthNamesAr[selectedMonth]} {selectedYear}
              </h2>
            </>
          ) : calendarViewMode === 'week' ? (
            <>
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrevWeek}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                  title="الأسبوع السابق"
                >
                  <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                </button>
                <button
                  onClick={handleNextWeek}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                  title="الأسبوع القادم"
                >
                  <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                </button>
              </div>

              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                أسبوع {weekDays[0].dateStr} (الاثنين) إلى {weekDays[6].dateStr} (الأحد)
              </h2>
            </>
          ) : (
            <h2 className="text-base font-bold text-slate-900">
              {formatDateAr(selectedDayDate)}
            </h2>
          )}

          <button
            onClick={handleResetToCurrent}
            className="text-xs px-2.5 py-1 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold transition-colors"
          >
            اليوم الحالي ({currentDate})
          </button>
        </div>

        {/* View Mode Switcher (Month, Week, Day, Agenda) */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto text-xs font-bold">
          <button
            onClick={() => setCalendarViewMode('month')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              calendarViewMode === 'month' ? 'bg-white text-slate-900 shadow-2xs font-black' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            الشهر (Month)
          </button>
          <button
            onClick={() => setCalendarViewMode('week')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              calendarViewMode === 'week' ? 'bg-white text-slate-900 shadow-2xs font-black' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            الأسبوع (Week)
          </button>
          <button
            onClick={() => setCalendarViewMode('day')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              calendarViewMode === 'day' ? 'bg-white text-slate-900 shadow-2xs font-black' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            اليوم (Day)
          </button>
          <button
            onClick={() => setCalendarViewMode('agenda')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              calendarViewMode === 'agenda' ? 'bg-white text-slate-900 shadow-2xs font-black' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            الأجندة (Agenda)
          </button>
        </div>

      </div>

      {/* MONTH VIEW - STRICTLY STARTS FROM MONDAY TO SUNDAY */}
      {calendarViewMode === 'month' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[640px] sm:min-w-0">
              
              {/* Day of Week Headers (Monday to Sunday) */}
              <div className="grid grid-cols-7 border-b border-slate-200 text-center">
            {weekDaysConfig.map((col) => (
              <div
                key={col.id}
                className={`py-3 px-1 border-s first:border-s-0 border-slate-200 ${
                  col.isWknd
                    ? 'bg-amber-50/70 text-amber-900'
                    : 'bg-slate-100 text-slate-800'
                }`}
              >
                <div className="text-xs sm:text-sm font-bold flex items-center justify-center gap-1">
                  <span>{col.nameAr}</span>
                  {col.isWknd && (
                    <span className="hidden lg:inline text-[9px] px-1 py-0.2 rounded-sm bg-amber-200 text-amber-900 font-bold">
                      عطلة
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 font-medium hidden sm:block mt-0.5">
                  {col.sublabel}
                </div>
              </div>
            ))}
          </div>

          {/* Month Days Grid */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-200 rtl:divide-x-reverse min-h-[580px]">
            {monthGridDays.map((day, idx) => {
              const dayBookings = filteredBookings.filter((b) => b.date === day.dateStr);
              const isToday = day.dateStr === currentDate;

              return (
                <div
                  key={`${day.dateStr}-${idx}`}
                  onClick={() => onOpenNewBooking(activeRoomTab !== 'all' ? activeRoomTab : undefined, day.dateStr)}
                  className={`p-2 transition-colors relative flex flex-col justify-between min-h-[110px] cursor-pointer group ${
                    !day.isCurrentMonth
                      ? 'bg-slate-100/40 text-slate-400 opacity-60'
                      : day.isWknd
                      ? 'bg-amber-50/30 hover:bg-amber-50/60'
                      : isToday
                      ? 'bg-blue-50/40'
                      : 'hover:bg-slate-50/80 bg-white'
                  }`}
                >
                  {/* Top Bar of Day Cell */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center ${
                        isToday
                          ? 'bg-blue-700 text-white shadow-2xs'
                          : day.isWknd
                          ? 'text-amber-800 font-black'
                          : !day.isCurrentMonth
                          ? 'text-slate-400'
                          : 'text-slate-800'
                      }`}
                    >
                      {day.dayNum}
                    </span>

                    {day.isWknd && day.isCurrentMonth && (
                      <span className="text-[10px] text-amber-700 bg-amber-100/70 border border-amber-200/80 px-1.5 py-0.2 rounded font-bold">
                        عطلة نهاية الأسبوع
                      </span>
                    )}
                  </div>

                  {/* Booking Badges inside Day Cell */}
                  <div className="space-y-1 mt-1 overflow-y-auto max-h-20 no-scrollbar">
                    {dayBookings.slice(0, 3).map((b) => (
                      <div
                        key={b.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectBooking(b);
                        }}
                        className={`p-1 rounded-md text-[11px] leading-tight font-semibold truncate border transition-transform hover:scale-[1.02] shadow-2xs ${
                          b.status === 'completed'
                            ? 'bg-slate-100 text-slate-700 border-slate-300 opacity-90'
                            : b.roomId === 'room-dana'
                            ? 'bg-blue-100 text-blue-900 border-blue-200'
                            : 'bg-indigo-100 text-indigo-900 border-indigo-200'
                        }`}
                        title={`${formatTimeRange12(b.startTime, b.endTime, language as 'ar' | 'en')} - ${b.title} (${b.roomNameAr})${b.status === 'completed' ? ' [مكتمل]' : ''}`}
                      >
                        <span className="font-mono text-[10px] opacity-80">{formatTime12(b.startTime, language as 'ar' | 'en')}</span> {b.title} {b.status === 'completed' && <span className="text-[9px] font-bold text-slate-500">(مكتمل)</span>}
                      </div>
                    ))}
                    {dayBookings.length > 3 && (
                      <div className="text-[10px] text-blue-700 font-bold text-center">
                        +{dayBookings.length - 3} اجتماعات أخرى
                      </div>
                    )}
                  </div>

                  {/* Hover Quick Add indicator */}
                  <div className="opacity-0 group-hover:opacity-100 text-[10px] text-blue-600 font-bold text-start mt-1 transition-opacity">
                    + حجز اجتماع
                  </div>
                </div>
              );
            })}
          </div>

            </div>
          </div>
        </div>
      )}

      {/* WEEK VIEW - 7 DAYS STARTING MONDAY */}
      {calendarViewMode === 'week' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[700px] sm:min-w-0">
              
              {/* Week Header Row */}
              <div className="grid grid-cols-7 border-b border-slate-200 text-center">
            {weekDays.map((day) => {
              const isToday = day.dateStr === currentDate;
              return (
                <div
                  key={day.dateStr}
                  className={`py-3 px-2 border-s first:border-s-0 border-slate-200 ${
                    day.isWknd
                      ? 'bg-amber-50/70 text-amber-900'
                      : isToday
                      ? 'bg-blue-50 text-blue-900 font-black'
                      : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  <div className="text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5">
                    <span>{day.nameAr}</span>
                    <span
                      className={`font-mono text-xs px-1.5 py-0.5 rounded-full ${
                        isToday ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-800'
                      }`}
                    >
                      {day.dayNum}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                    {day.dateStr}
                  </div>
                  {day.isWknd && (
                    <div className="mt-1">
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-200/80 text-amber-900 font-bold">
                        عطلة نهاية الأسبوع
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Week Columns with Bookings */}
          <div className="grid grid-cols-7 divide-x divide-slate-200 rtl:divide-x-reverse min-h-[500px]">
            {weekDays.map((day) => {
              const dayBookings = filteredBookings.filter((b) => b.date === day.dateStr);

              return (
                <div
                  key={day.dateStr}
                  onClick={() => onOpenNewBooking(activeRoomTab !== 'all' ? activeRoomTab : undefined, day.dateStr)}
                  className={`p-2.5 flex flex-col justify-between cursor-pointer transition-colors group ${
                    day.isWknd
                      ? 'bg-amber-50/20 hover:bg-amber-50/50'
                      : 'hover:bg-slate-50/80 bg-white'
                  }`}
                >
                  <div className="space-y-2">
                    {dayBookings.length === 0 ? (
                      <div className="p-4 text-center text-[11px] text-slate-400">
                        {day.isWknd ? 'عطلة أسبوعية' : 'لا توجد اجتماعات'}
                      </div>
                    ) : (
                      dayBookings.map((b) => (
                        <div
                          key={b.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectBooking(b);
                          }}
                          className={`p-2 rounded-xl border text-xs cursor-pointer shadow-2xs hover:scale-[1.02] transition-all ${
                            b.status === 'completed'
                              ? 'bg-slate-50 border-slate-200 text-slate-800 opacity-90'
                              : b.roomId === 'room-dana'
                              ? 'bg-blue-50 border-blue-200 text-blue-950'
                              : 'bg-indigo-50 border-indigo-200 text-indigo-950'
                          }`}
                        >
                          <div className="font-mono font-bold text-[10px] text-blue-800 mb-0.5 flex items-center justify-between">
                            <span>{formatTimeRange12(b.startTime, b.endTime, language as 'ar' | 'en')}</span>
                            {b.status === 'completed' && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">مكتمل</span>
                            )}
                          </div>
                          <div className="font-bold text-slate-900 truncate">{b.title}</div>
                          <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
                            <span>{b.roomNameAr}</span>
                            <span className="font-mono">{b.bookingNumber}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="opacity-0 group-hover:opacity-100 text-[10px] text-blue-600 font-bold text-center py-2 transition-opacity">
                    + إضافة حجز لهذا اليوم
                  </div>
                </div>
              );
            })}
          </div>

            </div>
          </div>
        </div>
      )}

      {/* DAY VIEW */}
      {calendarViewMode === 'day' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  جدول الاجتماعات التفصيلي ليوم: {selectedDayDate}
                </h3>
                {isWeekend(selectedDayDate) && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-xs border border-amber-200 flex items-center gap-1">
                    <Coffee className="w-3.5 h-3.5" />
                    <span>عطلة نهاية الأسبوع (السبت / الأحد)</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{formatDateAr(selectedDayDate)}</p>
            </div>
            
            <input
              type="date"
              value={selectedDayDate}
              onChange={(e) => setSelectedDayDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold self-start sm:self-auto"
            />
          </div>

          {/* Time Slots 08:00 to 18:00 */}
          <div className="space-y-2">
            {[
              '08:00', '09:00', '10:00', '11:00', '12:00',
              '13:00', '14:00', '15:00', '16:00', '17:00'
            ].map((slot) => {
              const slotBookings = filteredBookings.filter(
                (b) => b.date === selectedDayDate && b.startTime.startsWith(slot.slice(0, 2))
              );

              return (
                <div
                  key={slot}
                  className="flex items-start gap-4 p-3 rounded-xl border border-slate-100 hover:bg-slate-50/80 transition-colors"
                >
                  <span className="w-20 font-mono font-bold text-slate-500 text-xs pt-1">
                    {formatTime12(slot, language as 'ar' | 'en')}
                  </span>
                  <div className="flex-1">
                    {slotBookings.length === 0 ? (
                      <button
                        onClick={() =>
                          onOpenNewBooking(
                            activeRoomTab !== 'all' ? activeRoomTab : undefined,
                            selectedDayDate,
                            slot
                          )
                        }
                        className="text-xs text-slate-400 hover:text-blue-700 hover:underline font-medium"
                      >
                        + فترة شاغرة، اضغط للحجز
                      </button>
                    ) : (
                      <div className="space-y-1.5">
                        {slotBookings.map((b) => (
                          <div
                            key={b.id}
                            onClick={() => onSelectBooking(b)}
                            className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer hover:shadow-xs transition-shadow ${
                              b.status === 'completed'
                                ? 'bg-slate-50 border-slate-200 text-slate-900 opacity-90'
                                : b.roomId === 'room-dana'
                                ? 'bg-blue-50 border-blue-200 text-blue-950'
                                : 'bg-indigo-50 border-indigo-200 text-indigo-950'
                            }`}
                          >
                            <div>
                              <div className="font-bold text-sm flex items-center gap-2">
                                <span>{b.title}</span>
                                {b.status === 'completed' && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold border border-slate-300">
                                    مكتمل
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-500 flex items-center gap-3 mt-1 flex-wrap">
                                <span className="font-semibold text-blue-800">{b.roomNameAr}</span>
                                <span className="font-mono font-bold text-blue-700">{formatTimeRange12(b.startTime, b.endTime, language as 'ar' | 'en')}</span>
                                <span>{b.departmentNameAr}</span>
                                <span>مقدم الحجز: {b.bookerName}</span>
                              </div>
                            </div>
                            <span className="text-xs px-2.5 py-1 rounded-full bg-white font-bold border">
                              {b.bookingNumber}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AGENDA VIEW */}
      {calendarViewMode === 'agenda' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="text-base font-bold text-slate-900">
              قائمة الأجندة لجميع الاجتماعات المجدولة
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              إجمالي الاجتماعات: {filteredBookings.length}
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredBookings.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                لا توجد اجتماعات مجدولة حالياً في الأجندة.
              </div>
            ) : (
              filteredBookings
                .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
                .map((b) => {
                  const bWknd = isWeekend(b.date);
                  return (
                    <div
                      key={b.id}
                      onClick={() => onSelectBooking(b)}
                      className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 px-3 rounded-xl transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`font-mono text-xs px-2.5 py-1 rounded-md font-bold ${
                          bWknd ? 'bg-amber-100 text-amber-900 border border-amber-200' : 'bg-slate-100 text-slate-800'
                        }`}>
                          {b.date}
                        </span>
                        <span className="font-mono text-xs font-bold text-blue-700">
                          {formatTimeRange12(b.startTime, b.endTime, language as 'ar' | 'en')}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-slate-900">{b.title}</h4>
                            {bWknd && (
                              <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded font-bold">
                                عطلة أسبوعية
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">{b.departmentNameAr} • {b.bookerName}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {b.status === 'completed' && (
                          <span className="text-xs px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold border border-slate-300">
                            مكتمل
                          </span>
                        )}
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-md font-bold ${
                            b.roomId === 'room-dana'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}
                        >
                          {b.roomNameAr}
                        </span>
                        <span className="font-mono text-[11px] text-slate-400">{b.bookingNumber}</span>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      )}

    </div>
  );
};
