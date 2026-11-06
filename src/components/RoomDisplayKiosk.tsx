import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Room, Booking } from '../types';
import {
  Clock,
  DoorOpen,
  Calendar,
  Users,
  CheckCircle2,
  AlertCircle,
  QrCode,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { SaaedLogo } from './SaaedLogo';
import { formatDateAr, timeToMinutes, getActualCurrentTime, formatTime12, formatTimeRange12 } from '../utils/dateUtils';

interface RoomDisplayKioskProps {
  initialRoomId?: string;
  onExit?: () => void;
  onOpenNewBooking: (roomId: string) => void;
}

export const RoomDisplayKiosk: React.FC<RoomDisplayKioskProps> = ({
  initialRoomId = 'room-dana',
  onExit,
  onOpenNewBooking
}) => {
  const { rooms, bookings, currentDate, checkInBooking } = useApp();

  const [activeRoomId, setActiveRoomId] = useState<string>(initialRoomId);
  const [timeNow, setTimeNow] = useState<string>(() => getActualCurrentTime());

  const selectedRoom = rooms.find((r) => r.id === activeRoomId) || rooms[0];

  // Live timer according to actual Dubai time
  useEffect(() => {
    const update = () => {
      setTimeNow(getActualCurrentTime());
    };
    update();
    const timer = setInterval(update, 5000);
    return () => clearInterval(timer);
  }, []);

  const timeMinutes = timeToMinutes(timeNow);

  // Today's bookings for this room
  const todayRoomBookings = bookings
    .filter(
      (b) =>
        b.roomId === activeRoomId &&
        b.date === currentDate &&
        b.status !== 'cancelled' &&
        b.status !== 'rejected'
    )
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const currentMeeting = todayRoomBookings.find((b) => {
    const s = timeToMinutes(b.startTime);
    const e = timeToMinutes(b.endTime);
    return timeMinutes >= s && timeMinutes < e;
  });

  const nextMeeting = todayRoomBookings.find((b) => {
    const s = timeToMinutes(b.startTime);
    return s > timeMinutes;
  });

  const isOccupied = Boolean(currentMeeting);

  return (
    <div className="min-h-[85vh] rounded-3xl bg-slate-950 text-white p-6 sm:p-10 flex flex-col justify-between shadow-2xl relative overflow-hidden border border-slate-800">
      
      {/* Background Glow */}
      <div
        className={`absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-30 ${
          isOccupied ? 'bg-rose-600' : 'bg-emerald-500'
        }`}
      />

      {/* Top Kiosk Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-6 relative z-10">
        <div className="flex items-center gap-4">
          <SaaedLogo className="h-12 w-auto bg-white/95 px-3 py-1.5 rounded-xl" />
          <div className="border-r border-slate-700 pr-4">
            <span className="text-xs uppercase tracking-widest text-slate-400 block font-semibold">
              شاشة القاعة الرقمية • Digital Door Signage
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <h2 className="text-2xl font-black text-white">قاعة {selectedRoom.nameAr}</h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-blue-900/60 text-sky-300 font-bold border border-blue-700">
                {selectedRoom.code}
              </span>
            </div>
          </div>
        </div>

        {/* Room Switcher & Clock */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 bg-slate-900 p-1.5 rounded-xl border border-slate-800 text-xs font-bold">
            {rooms.map((r) => (
              <button
                key={r.id}
                onClick={() => setActiveRoomId(r.id)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  r.id === activeRoomId
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {r.nameAr}
              </button>
            ))}
          </div>

          <div className="text-end">
            <span className="text-3xl font-mono font-black tracking-tight text-white block">
              {formatTime12(timeNow)}
            </span>
            <span className="text-[11px] text-slate-400 block">Asia/Dubai • {currentDate}</span>
          </div>
        </div>
      </div>

      {/* Main Status Display Area */}
      <div className="my-8 relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
        
        {/* Left 2 Cols: Main Status Banner */}
        <div className="lg:col-span-2 space-y-6">
          <div
            className={`p-8 rounded-3xl border-2 flex flex-col justify-between transition-all ${
              isOccupied
                ? 'bg-rose-950/40 border-rose-500/50 shadow-rose-950/30'
                : 'bg-emerald-950/40 border-emerald-500/50 shadow-emerald-950/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className={`w-5 h-5 rounded-full animate-ping ${
                    isOccupied ? 'bg-rose-500' : 'bg-emerald-500'
                  }`}
                />
                <span className="text-3xl sm:text-4xl font-black tracking-tight">
                  {isOccupied ? 'القاعة محجوزة الآن (OCCUPIED)' : 'القاعة متاحة الآن (AVAILABLE)'}
                </span>
              </div>
            </div>

            {/* If occupied, show ongoing meeting details */}
            {isOccupied && currentMeeting ? (
              <div className="mt-8 space-y-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between text-xs text-rose-300 font-bold">
                  <span>الاجتماع الجاري حالياً:</span>
                  <span className="font-mono text-sm">
                    {formatTimeRange12(currentMeeting.startTime, currentMeeting.endTime)}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-white">{currentMeeting.title}</h3>
                <div className="grid grid-cols-2 gap-4 text-xs text-slate-300 pt-2 border-t border-slate-800">
                  <div>
                    <span className="text-slate-500 block">الإدارة المنظمة:</span>
                    <strong className="text-sky-300 text-sm">{currentMeeting.departmentNameAr}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">مقدم الحجز:</span>
                    <strong className="text-white text-sm">{currentMeeting.bookerName}</strong>
                  </div>
                </div>

                {!currentMeeting.checkedInAt && (
                  <div className="pt-2">
                    <button
                      onClick={() => checkInBooking(currentMeeting.id)}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>تسجيل الحضور الفوري (Check-in Now)</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-8 p-6 bg-slate-900/60 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-bold text-emerald-400">القاعة شاغرة وجاهزة</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    يمكنك الحجز الفوري أو استخدام القاعة للاجتماعات السريعة
                  </p>
                </div>
                <button
                  onClick={() => onOpenNewBooking(selectedRoom.id)}
                  className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-sm shadow-lg transition-transform active:scale-95"
                >
                  حجز فوري للقاعة
                </button>
              </div>
            )}
          </div>

          {/* Next Meeting Banner */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-semibold block">الحجز القادم اليوم:</span>
              {nextMeeting ? (
                <div className="text-sm font-bold text-white mt-1">
                  {nextMeeting.title} • <span className="text-sky-400 font-mono">{formatTimeRange12(nextMeeting.startTime, nextMeeting.endTime)}</span>
                  <span className="text-slate-400 text-xs block mt-0.5">({nextMeeting.departmentNameAr})</span>
                </div>
              ) : (
                <div className="text-xs text-slate-500 mt-1">لا توجد اجتماعات أخرى مجدولة لهذا اليوم</div>
              )}
            </div>

            <span className="text-xs px-3 py-1 rounded-full bg-slate-800 text-slate-300 font-mono">
              إجمالي اليوم: {todayRoomBookings.length}
            </span>
          </div>
        </div>

        {/* Right Col: QR Scan & Mobile Check-in */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4">
          <h4 className="font-bold text-sm text-white flex items-center justify-center gap-2">
            <QrCode className="w-4 h-4 text-sky-400" />
            <span>مسح الرمز للحجز والتسجيل</span>
          </h4>
          
          <div className="p-4 bg-white rounded-2xl inline-block mx-auto shadow-inner">
            <svg className="w-36 h-36 mx-auto" viewBox="0 0 100 100" fill="currentColor">
              <rect x="10" y="10" width="24" height="24" rx="3" fill="#1e3a8a" />
              <rect x="14" y="14" width="16" height="16" fill="white" />
              <rect x="18" y="18" width="8" height="8" fill="#1e3a8a" />
              <rect x="66" y="10" width="24" height="24" rx="3" fill="#1e3a8a" />
              <rect x="70" y="14" width="16" height="16" fill="white" />
              <rect x="74" y="18" width="8" height="8" fill="#1e3a8a" />
              <rect x="10" y="66" width="24" height="24" rx="3" fill="#1e3a8a" />
              <rect x="14" y="70" width="16" height="16" fill="white" />
              <rect x="18" y="74" width="8" height="8" fill="#1e3a8a" />
              <rect x="42" y="14" width="8" height="8" fill="#0284c7" />
              <rect x="40" y="40" width="20" height="20" rx="2" fill="#c24128" />
              <rect x="68" y="44" width="8" height="8" fill="#1e3a8a" />
              <rect x="42" y="68" width="8" height="8" fill="#1e3a8a" />
            </svg>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            امسح الرمز بكاميرا هاتفك لتأكيد الحضور أو الاطلاع على التجهيزات والمواعيد الشاغرة
          </p>

          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-500">
            {selectedRoom.location} • {selectedRoom.floor}
          </div>
        </div>

      </div>

      {/* Kiosk Footer */}
      <div className="pt-6 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500 relative z-10">
        <div>
          نظام إدارة وحجز قاعات الاجتماعات • <strong>شركة ساعد للأنظمة المرورية</strong>
        </div>
        <div className="flex items-center gap-3">
          <span>التحديث التلقائي مفعّل</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
        </div>
      </div>

    </div>
  );
};
