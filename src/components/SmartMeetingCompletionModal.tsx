import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Booking,
  MeetingCompletionNotification
} from '../types';
import {
  CheckCircle2,
  X,
  DoorOpen,
  Building2,
  User as UserIcon,
  Calendar,
  Clock,
  Timer,
  Eye,
  FolderOpen,
  Layers
} from 'lucide-react';
import { formatDateAr, formatDateEn, formatTime12 } from '../utils/dateUtils';
import { formatActualTimestampDubai } from '../services/meetingLifecycleService';

interface SmartMeetingCompletionModalProps {
  notification: MeetingCompletionNotification | null;
  liveBooking?: Booking;
  queueTotal: number;
  language: 'ar' | 'en';
  onCloseAcknowledge: (notification: MeetingCompletionNotification) => void;
  onViewDetails: (notification: MeetingCompletionNotification) => void;
  onViewArchive: (notification: MeetingCompletionNotification) => void;
}

export const SmartMeetingCompletionModal: React.FC<SmartMeetingCompletionModalProps> = ({
  notification,
  liveBooking,
  queueTotal,
  language,
  onCloseAcknowledge,
  onViewDetails,
  onViewArchive
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const primaryButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const isAr = language === 'ar';

  // Manage body scroll lock, focus restoration, Escape key, and Tab focus trap
  useEffect(() => {
    if (!notification) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTimer = window.setTimeout(() => {
      if (primaryButtonRef.current) {
        primaryButtonRef.current.focus();
      } else {
        dialogRef.current?.focus();
      }
    }, 10);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onCloseAcknowledge(notification);
        return;
      }

      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first || !dialogRef.current.contains(document.activeElement)) {
            e.preventDefault();
            last.focus();
          }
        } else if (document.activeElement === last || !dialogRef.current.contains(document.activeElement)) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKeyDown, true);
      document.body.style.overflow = prevOverflow;
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus();
      }
    };
  }, [notification, onCloseAcknowledge]);

  if (!notification || typeof document === 'undefined') {
    return null;
  }

  // Prefer freshest booking metadata if available while keeping immutable event identity
  const bookingNumber = liveBooking?.bookingNumber || notification.bookingNumber;
  const roomName = isAr
    ? liveBooking?.roomNameAr || notification.roomNameAr
    : liveBooking?.roomNameEn || notification.roomNameEn;
  const title = liveBooking?.title || notification.title;
  const departmentName = isAr
    ? liveBooking?.departmentNameAr || notification.departmentNameAr
    : liveBooking?.departmentNameEn || notification.departmentNameAr;
  const bookerName = liveBooking?.bookerName || notification.bookerName;
  const dateStr = liveBooking?.date || notification.date;
  const startTime = liveBooking?.startTime || notification.startTime;
  const endTime = liveBooking?.endTime || notification.endTime;
  const durationMinutes = liveBooking?.durationMinutes || notification.durationMinutes;

  const formattedScheduledEnd = formatTime12(endTime, isAr ? 'ar' : 'en');
  const formattedTechnicalUpdate = formatActualTimestampDubai(
    notification.completedAtActual,
    isAr ? 'ar' : 'en'
  );

  const modalContent = (
    <div
      className="fixed inset-0 z-[120] overflow-y-auto bg-[#0b192e]/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in motion-reduce:animate-none"
      dir={isAr ? 'rtl' : 'ltr'}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onCloseAcknowledge(notification);
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="smart-completion-title"
        aria-describedby="smart-completion-desc"
        tabIndex={-1}
        className="w-full max-w-xl bg-white rounded-2xl border border-[#E1E9F3] shadow-2xl overflow-hidden focus:outline-hidden animate-in zoom-in-95 duration-200 motion-reduce:animate-none motion-reduce:transition-none"
      >
        {/* Top Emerald Corporate Accent Line */}
        <div className="h-1.5 w-full bg-linear-to-r from-[#10A67A] via-[#0052cc] to-[#0f296b]" />

        {/* Header */}
        <div className="px-5 sm:px-6 pt-5 pb-4 bg-[#F5F8FC] border-b border-[#E1E9F3] flex items-start justify-between gap-3">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0 shadow-2xs">
              <div className="w-9 h-9 rounded-full bg-[#10A67A] text-white flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2
                  id="smart-completion-title"
                  className="text-base sm:text-lg font-extrabold text-[#101F3D] leading-snug"
                >
                  {isAr ? 'اكتمل الاجتماع بنجاح' : 'Meeting Completed Successfully'}
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10A67A]" />
                  <span>{isAr ? 'مكتمل' : 'Completed'}</span>
                </span>
              </div>

              <p
                id="smart-completion-desc"
                className="text-xs sm:text-[13px] text-slate-600 font-medium leading-relaxed"
              >
                {isAr
                  ? 'تم انتهاء الوقت المحدد للاجتماع وتحديث حالة الحجز تلقائيًا إلى مكتمل.'
                  : 'The scheduled meeting time has ended and the booking status was automatically updated to Completed.'}
              </p>

              {queueTotal > 1 && (
                <div className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-[#0f296b] text-[11px] font-bold tabular-nums">
                  <Layers className="w-3.5 h-3.5 text-[#0052cc]" />
                  <span>
                    {isAr
                      ? `يوجد ${queueTotal - 1} ${queueTotal - 1 === 1 ? 'اجتماع مكتمل آخر' : 'اجتماعات مكتملة أخرى'} في قائمة الانتظار`
                      : `${queueTotal - 1} more completed meeting${queueTotal - 1 === 1 ? '' : 's'} queued`}
                  </span>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onCloseAcknowledge(notification)}
            aria-label={isAr ? 'إغلاق الإشعار' : 'Close notification'}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 transition-colors cursor-pointer shrink-0 focus:outline-hidden focus:ring-2 focus:ring-[#0052cc]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Booking Number & Room + Meeting Title */}
          <div className="p-4 rounded-xl bg-white border border-[#E1E9F3] space-y-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-[#eef5ff] border border-blue-200 font-mono text-xs font-extrabold text-[#0f296b] tabular-nums">
                {bookingNumber}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-[#101F3D] text-xs font-bold">
                <DoorOpen className="w-3.5 h-3.5 text-[#0052cc]" />
                <span>{roomName}</span>
              </span>
            </div>

            <div>
              <span className="block text-[11px] font-semibold text-slate-500 mb-0.5">
                {isAr ? 'موضوع الاجتماع' : 'Meeting Title'}
              </span>
              <h3 className="text-sm sm:text-base font-extrabold text-[#101F3D] leading-snug break-words">
                {title}
              </h3>
            </div>
          </div>

          {/* Department & Booker Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-[#F5F8FC] border border-[#E1E9F3] flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-white border border-[#E1E9F3] text-[#0052cc] flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="block text-[11px] font-semibold text-slate-500">
                  {isAr ? 'الإدارة الحاجزة' : 'Department'}
                </span>
                <span className="block text-xs font-bold text-[#101F3D] truncate">
                  {departmentName}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#F5F8FC] border border-[#E1E9F3] flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-white border border-[#E1E9F3] text-[#0f296b] flex items-center justify-center shrink-0">
                <UserIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="block text-[11px] font-semibold text-slate-500">
                  {isAr ? 'مقدم الحجز' : 'Booked By'}
                </span>
                <span className="block text-xs font-bold text-[#101F3D] truncate">
                  {bookerName}
                </span>
              </div>
            </div>
          </div>

          {/* Dedicated Date, Start Time, End Time Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="p-3 rounded-xl bg-[#F5F8FC] border border-[#E1E9F3]">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 mb-1">
                <Calendar className="w-3.5 h-3.5 text-[#0052cc]" />
                <span>{isAr ? 'تاريخ الاجتماع' : 'Meeting Date'}</span>
              </div>
              <div className="text-xs font-extrabold text-[#101F3D] tabular-nums">
                {dateStr}
              </div>
              <div className="text-[11px] font-medium text-slate-600 mt-0.5 truncate">
                {isAr ? formatDateAr(dateStr) : formatDateEn(dateStr)}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#F5F8FC] border border-[#E1E9F3]">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 mb-1">
                <Clock className="w-3.5 h-3.5 text-[#0052cc]" />
                <span>{isAr ? 'وقت البداية' : 'Start Time'}</span>
              </div>
              <div className="text-sm font-extrabold text-[#101F3D] font-mono tabular-nums">
                {formatTime12(startTime, isAr ? 'ar' : 'en')}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 mb-1">
                <Clock className="w-3.5 h-3.5 text-[#10A67A]" />
                <span>{isAr ? 'وقت النهاية المجدول' : 'Scheduled End Time'}</span>
              </div>
              <div className="text-sm font-extrabold text-emerald-900 font-mono tabular-nums">
                {formattedScheduledEnd}
              </div>
            </div>
          </div>

          {/* Compact Cards: Duration, Status, and Scheduled vs Actual Update Time */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div className="p-2.5 rounded-xl bg-white border border-[#E1E9F3] flex items-center gap-2">
              <Timer className="w-4 h-4 text-[#0052cc] shrink-0" />
              <div className="min-w-0">
                <span className="block text-[10px] font-semibold text-slate-500">
                  {isAr ? 'مدة الاجتماع' : 'Duration'}
                </span>
                <span className="text-xs font-extrabold text-[#101F3D] tabular-nums">
                  {durationMinutes} {isAr ? 'دقيقة' : 'min'}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white border border-[#E1E9F3] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#10A67A] shrink-0" />
              <div className="min-w-0">
                <span className="block text-[10px] font-semibold text-slate-500">
                  {isAr ? 'الحالة النهائية' : 'Final Status'}
                </span>
                <span className="text-xs font-extrabold text-[#10A67A]">
                  {isAr ? 'مكتمل' : 'Completed'}
                </span>
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 p-2.5 rounded-xl bg-white border border-[#E1E9F3]">
              <span className="block text-[10px] font-semibold text-slate-500">
                {isAr ? 'وقت التحديث التلقائي' : 'Auto-Updated At'}
              </span>
              <span
                className="block text-[11px] font-bold text-slate-700 font-mono tabular-nums mt-0.5 truncate"
                title={formattedTechnicalUpdate}
              >
                {formattedTechnicalUpdate || formattedScheduledEnd}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 sm:px-6 py-4 bg-[#F5F8FC] border-t border-[#E1E9F3] flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={() => onCloseAcknowledge(notification)}
            className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-slate-400"
          >
            {isAr ? 'تم، إغلاق' : 'Done, Close'}
          </button>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              type="button"
              onClick={() => onViewArchive(notification)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#0f296b]/25 bg-white hover:bg-blue-50 text-[#0f296b] font-bold text-xs transition-colors cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[#0f296b]"
            >
              <FolderOpen className="w-4 h-4 text-[#0052cc]" />
              <span>{isAr ? 'عرض سجل الحجوزات' : 'View Bookings Log'}</span>
            </button>

            <button
              ref={primaryButtonRef}
              type="button"
              onClick={() => onViewDetails(notification)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0052cc] hover:bg-[#0043a8] text-white font-bold text-xs shadow-xs transition-colors cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[#0052cc] focus:ring-offset-1"
            >
              <Eye className="w-4 h-4" />
              <span>{isAr ? 'عرض تفاصيل الحجز' : 'View Booking Details'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
