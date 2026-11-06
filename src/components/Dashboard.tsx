import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Booking, Room } from '../types';
import {
  DoorOpen,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  BarChart3,
  Search,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  QrCode,
  Tv
} from 'lucide-react';
import {
  isTimeOverlap,
  timeToMinutes,
  minutesToTime,
  getActualCurrentTime,
  getNextRoundedTimeSlot,
  formatTime12,
  formatTimeRange12
} from '../utils/dateUtils';

interface DashboardProps {
  onOpenNewBooking: (roomId?: string) => void;
  onViewRoomStats: (roomId: string) => void;
  onSelectBooking: (booking: Booking) => void;
  onNavigate: (view: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onOpenNewBooking,
  onViewRoomStats,
  onSelectBooking,
  onNavigate
}) => {
  const { rooms, bookings, currentDate, language } = useApp();

  // Search available room widget state based on actual current date and next available slot
  const [searchDate, setSearchDate] = useState<string>(currentDate);
  const initialNextSlot = getNextRoundedTimeSlot();
  const [searchStartTime, setSearchStartTime] = useState<string>(initialNextSlot);
  const [searchEndTime, setSearchEndTime] = useState<string>(
    minutesToTime(timeToMinutes(initialNextSlot) + 60)
  );
  const [searchAttendees, setSearchAttendees] = useState<number>(6);
  const [searched, setSearched] = useState(false);

  // Today's bookings
  const todayBookings = bookings.filter(
    (b) => b.date === currentDate && b.status !== 'cancelled' && b.status !== 'rejected'
  );

  // Time now in Dubai from actual system clock
  const currentTimeMinutes = timeToMinutes(getActualCurrentTime());

  // Calculate live room states for Dana and Waha
  const getRoomLiveState = (room: Room) => {
    if (room.status === 'maintenance') {
      return {
        status: 'maintenance' as const,
        statusLabel: 'مغلقة للصيانة',
        badgeClass: 'bg-red-100 text-red-800 border-red-300',
        currentMeeting: null,
        nextMeeting: null,
        todayCount: 0
      };
    }

    const roomTodayBookings = todayBookings
      .filter((b) => b.roomId === room.id)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    // Find current meeting
    const currentMeeting = roomTodayBookings.find((b) => {
      const sMin = timeToMinutes(b.startTime);
      const eMin = timeToMinutes(b.endTime);
      return currentTimeMinutes >= sMin && currentTimeMinutes < eMin;
    });

    // Find next upcoming meeting today
    const nextMeeting = roomTodayBookings.find((b) => {
      const sMin = timeToMinutes(b.startTime);
      return sMin > currentTimeMinutes;
    });

    const isOccupied = Boolean(currentMeeting);

    return {
      status: isOccupied ? ('occupied' as const) : ('available' as const),
      statusLabel: isOccupied ? 'محجوزة الآن (Occupied)' : 'متاحة الآن (Available)',
      badgeClass: isOccupied
        ? 'bg-rose-100 text-rose-800 border-rose-300'
        : 'bg-emerald-100 text-emerald-800 border-emerald-300',
      currentMeeting,
      nextMeeting,
      todayCount: roomTodayBookings.length
    };
  };

  const danaRoom = rooms.find((r) => r.id === 'room-dana') || rooms[0];
  const wahaRoom = rooms.find((r) => r.id === 'room-waha') || rooms[1] || rooms[0];

  const danaLive = getRoomLiveState(danaRoom);
  const wahaLive = getRoomLiveState(wahaRoom);

  // KPI calculations
  const totalBookingsAll = bookings.length;
  const totalHoursAll = Number(
    (bookings.reduce((sum, b) => sum + (b.durationMinutes || 0), 0) / 60).toFixed(1)
  );
  const occupiedCount = (danaLive.status === 'occupied' ? 1 : 0) + (wahaLive.status === 'occupied' ? 1 : 0);
  const availableCount = (danaLive.status === 'available' ? 1 : 0) + (wahaLive.status === 'available' ? 1 : 0);
  const upcomingCount = bookings.filter((b) => b.date >= currentDate && b.status === 'confirmed').length;

  // Search Results
  const availableRoomsForSearch = searched
    ? rooms.filter((r) => {
        if (r.status === 'maintenance' || r.status === 'disabled') return false;
        // check conflict
        const hasConflict = bookings.some(
          (b) =>
            b.roomId === r.id &&
            b.date === searchDate &&
            b.status !== 'cancelled' &&
            b.status !== 'rejected' &&
            isTimeOverlap(searchStartTime, searchEndTime, b.startTime, b.endTime)
        );
        return !hasConflict;
      })
    : [];

  return (
    <div className="space-y-8 animate-in fade-in">
      
      {/* Top Banner */}
      <div className="bg-linear-to-r from-blue-900 via-blue-800 to-indigo-900 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-sky-200 text-xs font-semibold mb-3 border border-white/10">
            <Sparkles className="w-3.5 h-3.5" />
            نظام شركة ساعد للأنظمة المرورية المعتمد
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            حجز قاعات الاجتماعات
          </h1>
          <p className="mt-2 text-sm text-sky-100 leading-relaxed">
            المنصة المركزية لإدارة وحجز وتحليل استخدام قاعتي <strong>الدانة</strong> و<strong>الواحة</strong> مع ضمان منع التعارض بنسبة 100% والتقارير التنفيذية الفورية.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => onOpenNewBooking()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-blue-900 font-bold text-xs sm:text-sm shadow-md hover:bg-sky-50 transition-all transform active:scale-95"
            >
              <PlusCircle className="w-4 h-4 text-blue-700" />
              <span>حجز قاعة جديد</span>
            </button>
            <button
              onClick={() => onNavigate('analytics')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-700/60 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm border border-white/20 transition-all"
            >
              <BarChart3 className="w-4 h-4" />
              <span>عرض الإحصائيات الشاملة</span>
            </button>
          </div>
        </div>

        {/* Decorative background shape */}
        <div className="absolute -left-12 -bottom-12 w-80 h-80 rounded-full bg-sky-500/10 blur-2xl pointer-events-none" />
      </div>

      {/* KPI Cards Strip (Prompt #12) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold">حجوزات اليوم</span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{todayBookings.length}</div>
          <span className="text-[10px] text-slate-500">اجتماعات مجدولة</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold">القاعات المتاحة الآن</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">{availableCount}</div>
          <span className="text-[10px] text-slate-500">جاهزة للاستخدام</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-rose-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold">القاعات المحجوزة الآن</span>
            <Clock className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-700">{occupiedCount}</div>
          <span className="text-[10px] text-slate-500">اجتماع جاري</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold">الحجوزات القادمة</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-800">{upcomingCount}</div>
          <span className="text-[10px] text-slate-500">حجز مستقبلي</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-purple-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold">إجمالي الحجوزات</span>
            <BarChart3 className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-900">{totalBookingsAll}</div>
          <span className="text-[10px] text-slate-500">سجل تراكمي</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold">ساعات الاستخدام</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-800">{totalHoursAll}</div>
          <span className="text-[10px] text-slate-500">ساعة تشغيلية</span>
        </div>

      </div>

      {/* Room Status Cards (Prompt #12: حالة القاعات الآن - الدانة والواحة) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <DoorOpen className="w-5 h-5 text-blue-700" />
            <span>حالة القاعات الآن (Live Status)</span>
          </h2>
          <span className="text-xs text-slate-500">تحديث فوري ومباشر</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Al Dana Card */}
          <div className="bg-white rounded-2xl border-2 border-blue-200 shadow-xs p-6 space-y-5 hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-blue-900">{danaRoom.nameAr}</h3>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold">
                    {danaRoom.code}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{danaRoom.location}</p>
              </div>

              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${danaLive.badgeClass}`}>
                {danaLive.statusLabel}
              </span>
            </div>

            {/* Current & Next Meeting Info */}
            <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              
              {danaLive.currentMeeting ? (
                <div className="space-y-1">
                  <span className="text-slate-500 font-semibold block text-[11px]">الحجز الحالي:</span>
                  <div className="font-bold text-slate-900 text-sm">
                    {danaLive.currentMeeting.title}
                  </div>
                  <div className="flex items-center justify-between text-slate-600 pt-1">
                    <span className="text-blue-700 font-semibold">
                      {danaLive.currentMeeting.departmentNameAr}
                    </span>
                    <span className="font-mono font-bold text-slate-800">
                      ينتهي الساعة: {formatTime12(danaLive.currentMeeting.endTime)}
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <span className="text-slate-500 font-semibold block text-[11px]">الحجز الحالي:</span>
                  <div className="text-emerald-700 font-bold text-sm">لا يوجد اجتماع جاري الآن</div>
                </div>
              )}

              <div className="border-t border-slate-200 pt-2.5">
                <span className="text-slate-500 font-semibold block text-[11px]">الحجز القادم اليوم:</span>
                {danaLive.nextMeeting ? (
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="font-bold text-slate-800">{danaLive.nextMeeting.title}</span>
                    <span className="font-mono text-blue-800 font-bold text-xs">
                      {formatTimeRange12(danaLive.nextMeeting.startTime, danaLive.nextMeeting.endTime)}
                    </span>
                  </div>
                ) : (
                  <span className="text-slate-500">لا توجد حجوزات أخرى مجدولة اليوم</span>
                )}
              </div>

              <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-slate-600">
                <span>عدد حجوزات اليوم:</span>
                <span className="font-bold text-blue-900">{danaLive.todayCount} اجتماعات</span>
              </div>

            </div>

            {/* Actions for Al Dana */}
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={() => onOpenNewBooking('room-dana')}
                className="flex-1 py-2.5 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition-colors text-center"
              >
                احجز قاعة الدانة
              </button>
              <button
                onClick={() => onViewRoomStats('room-dana')}
                className="py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-1.5"
              >
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span>عرض الإحصائيات</span>
              </button>
            </div>
          </div>

          {/* Al Waha Card */}
          <div className="bg-white rounded-2xl border-2 border-indigo-200 shadow-xs p-6 space-y-5 hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-indigo-900">{wahaRoom.nameAr}</h3>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 font-bold">
                    {wahaRoom.code}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{wahaRoom.location}</p>
              </div>

              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${wahaLive.badgeClass}`}>
                {wahaLive.statusLabel}
              </span>
            </div>

            {/* Current & Next Meeting Info */}
            <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              
              {wahaLive.currentMeeting ? (
                <div className="space-y-1">
                  <span className="text-slate-500 font-semibold block text-[11px]">الحجز الحالي:</span>
                  <div className="font-bold text-slate-900 text-sm">
                    {wahaLive.currentMeeting.title}
                  </div>
                  <div className="flex items-center justify-between text-slate-600 pt-1">
                    <span className="text-indigo-700 font-semibold">
                      {wahaLive.currentMeeting.departmentNameAr}
                    </span>
                    <span className="font-mono font-bold text-slate-800">
                      ينتهي الساعة: {formatTime12(wahaLive.currentMeeting.endTime)}
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <span className="text-slate-500 font-semibold block text-[11px]">الحجز الحالي:</span>
                  <div className="text-emerald-700 font-bold text-sm">لا يوجد اجتماع جاري الآن</div>
                </div>
              )}

              <div className="border-t border-slate-200 pt-2.5">
                <span className="text-slate-500 font-semibold block text-[11px]">الحجز القادم اليوم:</span>
                {wahaLive.nextMeeting ? (
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="font-bold text-slate-800">{wahaLive.nextMeeting.title}</span>
                    <span className="font-mono text-indigo-800 font-bold text-xs">
                      {formatTimeRange12(wahaLive.nextMeeting.startTime, wahaLive.nextMeeting.endTime)}
                    </span>
                  </div>
                ) : (
                  <span className="text-slate-500">لا توجد حجوزات أخرى مجدولة اليوم</span>
                )}
              </div>

              <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-slate-600">
                <span>عدد حجوزات اليوم:</span>
                <span className="font-bold text-indigo-900">{wahaLive.todayCount} اجتماعات</span>
              </div>

            </div>

            {/* Actions for Al Waha */}
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={() => onOpenNewBooking('room-waha')}
                className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs shadow-xs transition-colors text-center"
              >
                احجز قاعة الواحة
              </button>
              <button
                onClick={() => onViewRoomStats('room-waha')}
                className="py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-1.5"
              >
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                <span>عرض الإحصائيات</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Quick Search Available Rooms Widget (Prompt #34) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-blue-50 text-blue-700">
              <Search className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-slate-900">
              البحث عن قاعة متاحة (Instant Room Finder)
            </h3>
          </div>
          <span className="text-xs text-slate-500">حدد الوقت وتحقق من الشواغر دون تعارض</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-slate-600 font-semibold mb-1">التاريخ:</label>
            <input
              type="date"
              min={currentDate}
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">وقت البداية:</label>
            <input
              type="time"
              value={searchStartTime}
              onChange={(e) => setSearchStartTime(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">وقت النهاية:</label>
            <input
              type="time"
              value={searchEndTime}
              onChange={(e) => setSearchEndTime(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setSearched(true)}
              className="w-full py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold flex items-center justify-center gap-2 shadow-xs"
            >
              <Search className="w-4 h-4" />
              <span>فحص الإتاحة</span>
            </button>
          </div>
        </div>

        {searched && (
          <div className="pt-3 border-t border-slate-100 animate-in fade-in">
            {availableRoomsForSearch.length === 0 ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
                لا توجد قاعات شاغرة في هذه الفترة المحددة. يرجى تجربة وقت آخر أو قاعة بديلة.
              </div>
            ) : (
              <div className="space-y-2">
                <span className="text-xs font-bold text-emerald-800 block">
                  القاعات المتاحة للحجز ({availableRoomsForSearch.length}):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {availableRoomsForSearch.map((r) => (
                    <div
                      key={r.id}
                      className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{r.nameAr}</div>
                        <div className="text-[11px] text-slate-500">{r.location}</div>
                      </div>
                      <button
                        onClick={() => onOpenNewBooking(r.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                      >
                        حجز الآن
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Today's Schedule Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-700" />
            <h3 className="text-base font-bold text-slate-900">
              جدول اجتماعات اليوم ({todayBookings.length})
            </h3>
          </div>
          <button
            onClick={() => onNavigate('calendar')}
            className="text-xs text-blue-700 hover:underline font-bold flex items-center gap-1"
          >
            <span>عرض التقويم الكامل</span>
            <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
          </button>
        </div>

        {todayBookings.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            لا توجد اجتماعات متبقية لهذا اليوم.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="p-3 text-start">رقم الحجز</th>
                  <th className="p-3 text-start">القاعة</th>
                  <th className="p-3 text-start">موضوع الاجتماع</th>
                  <th className="p-3 text-start">الوقت</th>
                  <th className="p-3 text-start">الإدارة الحاجزة</th>
                  <th className="p-3 text-start">مقدم الحجز</th>
                  <th className="p-3 text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {todayBookings.map((b) => (
                  <tr
                    key={b.id}
                    className="hover:bg-blue-50/40 transition-colors cursor-pointer"
                    onClick={() => onSelectBooking(b)}
                  >
                    <td className="p-3 font-mono font-bold text-blue-900">{b.bookingNumber}</td>
                    <td className="p-3 font-semibold text-slate-800">{b.roomNameAr}</td>
                    <td className="p-3 font-bold text-slate-900">{b.title}</td>
                    <td className="p-3 font-mono text-slate-700 text-xs">{formatTimeRange12(b.startTime, b.endTime)}</td>
                    <td className="p-3 text-blue-800 font-semibold">{b.departmentNameAr}</td>
                    <td className="p-3 text-slate-600">{b.bookerName}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectBooking(b);
                        }}
                        className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-[11px]"
                      >
                        عرض
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
