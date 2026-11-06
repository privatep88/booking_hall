import React from 'react';
import {
  AlertTriangle,
  Clock,
  Calendar,
  DoorOpen,
  X,
  ArrowRight,
  ShieldAlert,
  Info,
  CheckCircle2,
  CalendarX,
  Ban
} from 'lucide-react';
import { Booking } from '../types';
import { formatTime12, formatTimeRange12, formatDateAr } from '../utils/dateUtils';

interface BookingErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  errors: string[];
  conflictBooking?: Booking | null;
  roomName?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  onAdjustBooking?: () => void;
}

export const BookingErrorModal: React.FC<BookingErrorModalProps> = ({
  isOpen,
  onClose,
  errors,
  conflictBooking,
  roomName,
  date,
  startTime,
  endTime,
  onAdjustBooking
}) => {
  if (!isOpen || errors.length === 0) return null;

  // Categorize errors for rich visual display
  const hasConflict = errors.some(
    (e) =>
      e.includes('تعارض مع حجز قائم') ||
      e.includes('تعارض') ||
      e.includes('المحجوز من قبل')
  ) || !!conflictBooking;

  const hasOperatingHoursError = errors.some(
    (e) =>
      e.includes('ساعات العمل') ||
      e.includes('خارج نطاق ساعات العمل') ||
      e.includes('أوقات غير الأوقات المحددة') ||
      e.includes('خارج وقت العمل')
  );

  const hasWeekendOrHolidayError = errors.some(
    (e) =>
      e.includes('عطلة نهاية الأسبوع') ||
      e.includes('السبت والأحد') ||
      e.includes('عطلة رسمية') ||
      e.includes('إجازة')
  );

  const hasDurationError = errors.some(
    (e) =>
      e.includes('الحد الأدنى لمدّة الاجتماع') ||
      e.includes('الحد الأقصى لمدّة الاجتماع') ||
      e.includes('وقت نهاية الاجتماع يجب أن يكون بعد وقت البداية')
  );

  const hasPastDateError = errors.some(
    (e) => e.includes('تاريخ مضى') || e.includes('أثر رجعي')
  );

  const hasMaintenanceError = errors.some(
    (e) => e.includes('صيانة') || e.includes('معطلة')
  );

  const hasRoleRestriction = errors.some(
    (e) => e.includes('مستعرض فقط') || e.includes('غير مصرح') || e.includes('صلاحية')
  );

  const handleActionClick = () => {
    if (onAdjustBooking) {
      onAdjustBooking();
    }
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-error-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-3xl shadow-2xl border-2 border-rose-300 w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-linear-to-r from-rose-700 via-red-600 to-amber-700 text-white flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/15 rounded-2xl ring-2 ring-white/25 shadow-inner">
              <ShieldAlert className="w-6 h-6 text-amber-200" />
            </div>
            <div>
              <h2 id="booking-error-title" className="text-base sm:text-lg font-extrabold tracking-wide text-white">
                تعذر اعتماد الحجز — تنبيه تعارض وضوابط
              </h2>
              <p className="text-xs text-rose-100 font-medium">
                شركة ساعد للأنظمة المرورية • نظام حجز قاعات الاجتماعات
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/15 transition-colors"
            title="إغلاق التنبيه"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Scrollable Area */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          
          {/* Main Top Alert Banner */}
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3">
            <div className="p-2 bg-rose-500 text-white rounded-xl shrink-0 mt-0.5 shadow-sm">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-rose-950 text-sm">
                تم رصد مانع يمنع إتمام إضافة هذا الحجز
              </h3>
              <p className="text-xs text-rose-800 leading-relaxed font-medium">
                نظام إدارة القاعات يتحقق تلقائياً من توفر القاعة، ساعات العمل المعتمدة، وضوابط السياسات. يرجى مراجعة السبب الموضح أدناه:
              </p>
            </div>
          </div>

          {/* Requested Booking Quick Snapshot */}
          {(roomName || date || (startTime && endTime)) && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-2.5 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <DoorOpen className="w-4 h-4 text-blue-700 shrink-0" />
                <span>القاعة المطلوبة:</span>
                <strong className="text-slate-900 font-bold">{roomName || 'قاعة الاجتماع'}</strong>
              </div>
              {date && (
                <div className="flex items-center gap-1.5 text-slate-700">
                  <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>التاريخ:</span>
                  <strong className="text-slate-900 font-bold">{formatDateAr(date)} ({date})</strong>
                </div>
              )}
              {startTime && endTime && (
                <div className="flex items-center gap-1.5 text-slate-700">
                  <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>الوقت:</span>
                  <span className="font-mono font-bold text-blue-800 bg-blue-100/70 px-2 py-0.5 rounded-md border border-blue-200">
                    {formatTimeRange12(startTime, endTime, 'ar')}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Section: 1. Booking Conflict Spotlight (if conflict exists) */}
          {hasConflict && (
            <div className="rounded-2xl border-2 border-rose-300 bg-rose-50/70 p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-rose-200 pb-2">
                <div className="flex items-center gap-2 font-bold text-rose-950 text-sm">
                  <CalendarX className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>تعارض زمني مع حجز قائم في نفس القاعة</span>
                </div>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-rose-600 text-white shadow-xs">
                  تعارض حجز مؤكد
                </span>
              </div>

              {conflictBooking ? (
                <div className="bg-white rounded-xl p-3.5 border border-rose-200 shadow-2xs space-y-2">
                  <div className="text-xs text-slate-500 font-semibold">تفاصيل الحجز القائم والمتعارض:</div>
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <span className="text-rose-600">•</span>
                    <span>{conflictBooking.title}</span>
                    <span className="text-xs font-mono font-normal text-slate-500">({conflictBooking.bookingNumber})</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1 text-slate-700">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500">الإدارة المنظمة:</span>
                      <strong className="text-slate-900">{conflictBooking.departmentNameAr}</strong>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500">الفترة المحجوزة:</span>
                      <strong className="font-mono text-rose-800 bg-rose-100 px-2 py-0.5 rounded-md border border-rose-200">
                        {formatTimeRange12(conflictBooking.startTime, conflictBooking.endTime, 'ar')}
                      </strong>
                    </div>
                  </div>
                </div>
              ) : null}

              <p className="text-xs text-rose-900 font-medium leading-relaxed">
                لا يمكن حجز نفس القاعة لاجتماعين في نفس التوقيت لتفادي تداخل المواعيد.
              </p>
            </div>
          )}

          {/* Section: 2. Outside Operating Hours Spotlight */}
          {hasOperatingHoursError && (
            <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/70 p-4 space-y-2.5 shadow-xs">
              <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                <div className="flex items-center gap-2 font-bold text-amber-950 text-sm">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>توقيت الحجز خارج أوقات العمل المحددة للقاعة</span>
                </div>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-600 text-white shadow-xs">
                  خارج أوقات العمل
                </span>
              </div>
              <p className="text-xs text-amber-900 font-medium leading-relaxed">
                تم اختيار توقيت يقع قبل بداية أو بعد نهاية ساعات العمل الرسمية المعتمدة للقاعات (من الساعة 07:30 صباحاً إلى 06:00 مساءً).
              </p>
            </div>
          )}

          {/* Section: 3. Weekend or Holiday Spotlight */}
          {hasWeekendOrHolidayError && (
            <div className="rounded-2xl border-2 border-purple-300 bg-purple-50/70 p-4 space-y-2.5 shadow-xs">
              <div className="flex items-center justify-between border-b border-purple-200 pb-2">
                <div className="flex items-center gap-2 font-bold text-purple-950 text-sm">
                  <CalendarX className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>عطلة رسمية أو نهاية الأسبوع</span>
                </div>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-purple-600 text-white shadow-xs">
                  يوم غير متاح
                </span>
              </div>
              <p className="text-xs text-purple-900 font-medium leading-relaxed">
                أيام حجز القاعات المعتمدة في شركة ساعد هي أيام العمل الرسمية من الإثنين إلى الجمعة. لا يسمح بالنظام بحجز أيام العطلات الأسبوعية أو الإجازات الرسمية لغير المسؤولين.
              </p>
            </div>
          )}

          {/* Detailed List of all returned errors with clear bullets */}
          <div className="space-y-2 pt-1">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-blue-700" />
              <span>قائمة الأسباب والموانع المسجلة بالتفصيل:</span>
            </div>
            <div className="space-y-2">
              {errors.map((err, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold flex items-start gap-2.5"
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                  <span className="leading-relaxed">{err}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Guidance / Recommendation Box */}
          <div className="bg-sky-50 border border-sky-200 rounded-2xl p-3.5 text-xs text-sky-900 space-y-1.5">
            <div className="font-bold flex items-center gap-1.5 text-sky-950">
              <CheckCircle2 className="w-4 h-4 text-sky-600" />
              <span>كيف يمكنك معالجة هذا المانع وتأكيد الحجز؟</span>
            </div>
            <ul className="list-disc list-inside space-y-1 pr-1 text-sky-800 font-medium">
              <li>تعديل وقت البداية أو النهاية لاختيار فترة زمنية شاغرة تماماً.</li>
              <li>اختيار قاعة اجتماعات أخرى من القاعات المتاحة (مثل قاعة الدانة أو قاعة الواحة).</li>
              <li>التأكد من أن موعد الاجتماع يقع ضمن ساعات العمل الرسمية (07:30 ص إلى 06:00 م).</li>
              <li>في حال وجود حاجة إدارية استثنائية، يرجى التواصل مع مسؤول النظام أو إدارة المرافق.</li>
            </ul>
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-200 transition-colors text-xs sm:text-sm"
          >
            إغلاق
          </button>
          
          <button
            type="button"
            onClick={handleActionClick}
            className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold shadow-md transition-all flex items-center gap-2 text-xs sm:text-sm transform active:scale-95"
          >
            <span>تعديل بيانات الحجز الآن</span>
            <ArrowRight className="w-4 h-4 rotate-180" />
          </button>
        </div>

      </div>
    </div>
  );
};
