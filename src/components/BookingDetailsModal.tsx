import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Booking } from '../types';
import {
  X,
  Calendar,
  Clock,
  DoorOpen,
  User,
  Users,
  Building2,
  CheckCircle2,
  XCircle,
  Clock4,
  Printer,
  Copy,
  Edit3,
  Trash2,
  ShieldCheck,
  Check,
  AlertCircle
} from 'lucide-react';
import { formatDateAr, formatTimeRange12 } from '../utils/dateUtils';
import { SaaedLogo } from './SaaedLogo';

interface BookingDetailsModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (booking: Booking) => void;
}

export const BookingDetailsModal: React.FC<BookingDetailsModalProps> = ({
  booking,
  isOpen,
  onClose,
  onEdit
}) => {
  const {
    currentUser,
    cancelBooking,
    deleteCancelledBooking,
    checkInBooking,
    checkOutBooking,
    language
  } = useApp();

  const [copied, setCopied] = useState(false);
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showDeletePrompt, setShowDeletePrompt] = useState(false);
  const [deleteStatusMessage, setDeleteStatusMessage] = useState<string | null>(null);

  if (!isOpen || !booking) return null;

  const canManage =
    currentUser.role === 'super_admin' ||
    currentUser.role === 'admin' ||
    currentUser.role === 'coordinator' ||
    currentUser.id === booking.userId;

  const handleCopy = () => {
    const text = `
تفاصيل حجز قاعة اجتماع - شركة ساعد للأنظمة المرورية
رقم الحجز: ${booking.bookingNumber}
القاعة: ${booking.roomNameAr}
الموضوع: ${booking.title}
التاريخ: ${booking.date}
الوقت (12 ساعة): ${formatTimeRange12(booking.startTime, booking.endTime)} (${booking.durationMinutes} دقيقة)
الإدارة الحاجزة: ${booking.departmentNameAr}
مقدم الحجز: ${booking.bookerName} (${booking.employeeId})
الحالة: ${booking.status}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleConfirmCancel = () => {
    cancelBooking(booking.id, cancelReason || 'تم الإلغاء بواسطة المستخدم');
    setShowCancelPrompt(false);
    onClose();
  };

  const handleConfirmDelete = () => {
    const res = deleteCancelledBooking(booking.id);
    if (res.success) {
      setDeleteStatusMessage(res.message);
      setTimeout(() => {
        setShowDeletePrompt(false);
        onClose();
      }, 600);
    } else {
      setDeleteStatusMessage(res.message);
    }
  };

  const statusBadges: Record<string, { bg: string; text: string; labelAr: string }> = {
    confirmed: { bg: 'bg-emerald-100 border-emerald-300 text-emerald-800', labelAr: 'مؤكد (Confirmed)', text: 'text-emerald-700' },
    completed: { bg: 'bg-blue-100 border-blue-300 text-blue-800', labelAr: 'مكتمل (Completed)', text: 'text-blue-700' },
    cancelled: { bg: 'bg-rose-100 border-rose-300 text-rose-800', labelAr: 'ملغى (Cancelled)', text: 'text-rose-700' },
    pending: { bg: 'bg-amber-100 border-amber-300 text-amber-800', labelAr: 'قيد الانتظار (Pending)', text: 'text-amber-700' },
    rejected: { bg: 'bg-slate-200 border-slate-300 text-slate-700', labelAr: 'مرفوض (Rejected)', text: 'text-slate-700' },
    available: { bg: 'bg-green-100 border-green-300 text-green-800', labelAr: 'متاح (Available)', text: 'text-green-700' }
  };

  const currentBadge = statusBadges[booking.status] || statusBadges.confirmed;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden print-card">
        
        {/* Header */}
        <div className="p-6 bg-linear-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm px-2.5 py-0.5 rounded-md bg-blue-600/40 border border-blue-400 text-sky-200 font-bold">
                {booking.bookingNumber}
              </span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full border font-bold ${currentBadge.bg}`}>
                {currentBadge.labelAr}
              </span>
            </div>
            <h2 className="text-xl font-bold pt-1">{booking.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors no-print"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 text-xs sm:text-sm">
          
          {/* Printable Header - only visible when printing */}
          <div className="hidden print-only mb-4 border-b pb-4">
            <SaaedLogo className="h-10 w-auto mb-2" />
            <h3 className="text-lg font-bold">إشعار حجز قاعة اجتماع رسمي</h3>
            <p className="text-xs text-slate-500">شركة ساعد للأنظمة المرورية</p>
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <span className="text-slate-500 block text-[11px] font-semibold">القاعة</span>
              <span className="font-bold text-blue-900 text-base">{booking.roomNameAr}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px] font-semibold">التاريخ</span>
              <span className="font-bold text-slate-800">{booking.date}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px] font-semibold">الوقت (12 ساعة)</span>
              <span className="font-bold text-slate-800 font-mono text-sm">
                {formatTimeRange12(booking.startTime, booking.endTime)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px] font-semibold">المدة</span>
              <span className="font-bold text-slate-800">{booking.durationMinutes} دقيقة</span>
            </div>
          </div>

          {/* Detailed Info Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Right: Booker Details */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
                <User className="w-4 h-4 text-blue-700" />
                <span>بيانات مقدم الحجز والإدارة</span>
              </h4>
              <div className="space-y-2 text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">اسم الموظف:</span>
                  <span className="font-bold">{booking.bookerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">الرقم الوظيفي:</span>
                  <span className="font-mono font-semibold">{booking.employeeId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">الإدارة الحاجزة:</span>
                  <span className="font-bold text-blue-800">{booking.departmentNameAr}</span>
                </div>
                {booking.section && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">القسم:</span>
                    <span>{booking.section}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">البريد الإلكتروني:</span>
                  <span>{booking.bookerEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">رقم الهاتف:</span>
                  <span>{booking.bookerPhone}</span>
                </div>
              </div>
            </div>

            {/* Left: Meeting Specifications */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-700" />
                <span>تفاصيل الاجتماع والتجهيزات</span>
              </h4>
              <div className="space-y-2 text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">نوع الاجتماع:</span>
                  <span className="font-semibold">{booking.meetingType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">عدد الحضور:</span>
                  <span className="font-bold">{booking.attendeesCount} شخص</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">السرية:</span>
                  <span className="font-semibold">
                    {booking.confidential ? 'نعم (سري)' : 'عادي'}
                  </span>
                </div>
                {booking.externalOrganization && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">الجهة الخارجية:</span>
                    <span className="font-semibold text-blue-800">{booking.externalOrganization}</span>
                  </div>
                )}
                {booking.checkedInAt && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>وقت تسجيل الحضور (Check-in):</span>
                    <span>{new Date(booking.checkedInAt).toLocaleTimeString('ar-AE')}</span>
                  </div>
                )}
                {booking.endedAt && (
                  <div className="flex justify-between text-blue-700 font-semibold">
                    <span>وقت انتهاء الاجتماع:</span>
                    <span>{new Date(booking.endedAt).toLocaleTimeString('ar-AE')}</span>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Requested Equipment */}
          {booking.equipmentRequested && booking.equipmentRequested.length > 0 && (
            <div>
              <span className="block text-xs font-bold text-slate-700 mb-2">التجهيزات المطلوبة:</span>
              <div className="flex flex-wrap gap-2">
                {booking.equipmentRequested.map((eq, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold"
                  >
                    {eq}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {booking.notes && (
            <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg text-xs text-amber-900">
              <span className="font-bold block mb-1">ملاحظات:</span>
              <p>{booking.notes}</p>
            </div>
          )}

          {/* Cancellation reason if cancelled */}
          {booking.status === 'cancelled' && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold block">سبب إلغاء الحجز:</span>
                {(currentUser.role === 'admin' || currentUser.role === 'super_admin') && (
                  <span className="text-[11px] bg-rose-100 text-rose-800 font-semibold px-2 py-0.5 rounded-full border border-rose-200">
                    متاح للمسؤول (Admin): التعديل أو إعادة التنشيط أو الحذف النهائي
                  </span>
                )}
              </div>
              <p className="text-slate-800">{booking.cancellationReason || 'لم يتم تحديد سبب'}</p>
            </div>
          )}

          {/* Cancel Confirmation Dialog */}
          {showCancelPrompt && (
            <div className="p-4 bg-rose-50 border border-rose-300 rounded-xl space-y-3 animate-in fade-in">
              <div className="font-bold text-rose-900 text-sm">
                هل أنت متأكد من رغبتك في إلغاء هذا الحجز؟
              </div>
              <p className="text-xs text-rose-700">
                سيتم تحديث سجل الحجز وإتاحته في الإحصائيات مع الاحتفاظ بالسجل التاريخي للأغراض الرقابية.
              </p>
              <input
                type="text"
                placeholder="سبب الإلغاء (اختياري)..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-rose-300 bg-white text-xs"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowCancelPrompt(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-semibold text-xs"
                >
                  تراجع
                </button>
                <button
                  onClick={handleConfirmCancel}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
                >
                  تأكيد الإلغاء
                </button>
              </div>
            </div>
          )}

          {/* Permanent Delete Confirmation Dialog for Admin */}
          {showDeletePrompt && (
            <div className="p-4 bg-rose-50 border border-rose-300 rounded-xl space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2 font-bold text-rose-900 text-sm">
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>تأكيد الحذف النهائي للحجز الملغي (خاص بالمسؤول Admin)</span>
              </div>
              <p className="text-xs text-rose-700 leading-relaxed">
                هل أنت متأكد من رغبتك في حذف هذا الحجز الملغي رقم (<strong className="font-mono text-rose-950 font-bold">{booking.bookingNumber}</strong>) نهائياً من قاعدة البيانات؟
                <br />
                <span className="text-[11px] text-rose-600 font-semibold block mt-1">
                  تنبيه: سيتم مسح سجل هذا الحجز تماماً، وتوثيق العملية في سجل التدقيق الإداري. لا يمكن التراجع عن هذا الإجراء.
                </span>
              </p>
              {deleteStatusMessage && (
                <div className="p-2 rounded-lg bg-rose-100 text-rose-800 text-xs font-bold">
                  {deleteStatusMessage}
                </div>
              )}
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowDeletePrompt(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-semibold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  تراجع
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>تأكيد الحذف النهائي</span>
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 no-print">
            
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة / PDF</span>
              </button>

              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'تم النسخ' : 'نسخ التفاصيل'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* Check-in button */}
              {booking.status === 'confirmed' && !booking.checkedInAt && canManage && (
                <button
                  onClick={() => checkInBooking(booking.id)}
                  className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>تسجيل الحضور (Check-in)</span>
                </button>
              )}

              {/* End Meeting button */}
              {booking.status === 'confirmed' && booking.checkedInAt && canManage && (
                <button
                  onClick={() => checkOutBooking(booking.id)}
                  className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>إنهاء الاجتماع وتفريغ القاعة</span>
                </button>
              )}

              {/* Edit Button */}
              {canManage && (booking.status !== 'cancelled' || currentUser.role === 'super_admin' || currentUser.role === 'admin') && (
                <button
                  onClick={() => {
                    onClose();
                    onEdit(booking);
                  }}
                  className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                  title={booking.status === 'cancelled' ? "تعديل الحجز الملغي (إجراء المدير Admin)" : "تعديل الحجز"}
                >
                  <Edit3 className="w-3.5 h-3.5 text-blue-700" />
                  <span>{booking.status === 'cancelled' ? 'تعديل الحجز الملغي' : 'تعديل'}</span>
                </button>
              )}

              {/* Cancel Button */}
              {canManage && booking.status === 'confirmed' && !showCancelPrompt && (
                <button
                  onClick={() => setShowCancelPrompt(true)}
                  className="px-3 py-2 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-bold text-xs flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>إلغاء الحجز</span>
                </button>
              )}

              {/* Permanent Delete Button for Admin on Cancelled Bookings */}
              {(currentUser.role === 'super_admin' || currentUser.role === 'admin') &&
                booking.status === 'cancelled' &&
                !showDeletePrompt && (
                  <button
                    type="button"
                    onClick={() => setShowDeletePrompt(true)}
                    className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                    title="حذف الحجز الملغي نهائياً من قاعدة البيانات (صلاحية المشرف / Admin)"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>حذف الحجز الملغي نهائياً</span>
                  </button>
                )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
