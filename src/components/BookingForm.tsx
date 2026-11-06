import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { MeetingType, Booking, BookingStatus } from '../types';
import {
  X,
  Calendar,
  Clock,
  DoorOpen,
  User,
  Users,
  Briefcase,
  AlertTriangle,
  CheckCircle,
  CheckCircle2,
  Shield,
  ShieldCheck,
  FileText,
  Sparkles,
  Repeat
} from 'lucide-react';
import {
  calculateDuration,
  isWeekend,
  formatDateAr,
  minutesToTime,
  timeToMinutes,
  getActualCurrentDate,
  getNextRoundedTimeSlot,
  formatTime12,
  formatTimeRange12,
  getTimeOptions12
} from '../utils/dateUtils';
import { validateBookingRequest } from '../services/bookingEngine';
import { BookingErrorModal } from './BookingErrorModal';

interface BookingFormProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedRoomId?: string;
  preselectedDate?: string;
  preselectedStartTime?: string;
  preselectedDepartmentId?: string;
  editingBooking?: Booking | null;
}

export const BookingForm: React.FC<BookingFormProps> = ({
  isOpen,
  onClose,
  preselectedRoomId,
  preselectedDate,
  preselectedStartTime,
  preselectedDepartmentId,
  editingBooking
}) => {
  const {
    currentUser,
    rooms,
    departments,
    bookings,
    settings,
    holidays,
    createBooking,
    updateBooking,
    language,
    currentDate
  } = useApp();

  const isAdmin = currentUser.role === 'super_admin' || currentUser.role === 'admin';

  // Form states
  const [roomId, setRoomId] = useState<string>(preselectedRoomId || 'room-dana');
  const [date, setDate] = useState<string>(preselectedDate || currentDate);
  const [startTime, setStartTime] = useState<string>(preselectedStartTime || '09:00');
  const [endTime, setEndTime] = useState<string>('10:00');
  const [title, setTitle] = useState<string>('');
  const [meetingType, setMeetingType] = useState<MeetingType>('internal');
  
  // Booker information
  const [bookerName, setBookerName] = useState<string>(currentUser.fullName);
  const [employeeId, setEmployeeId] = useState<string>(currentUser.employeeId);
  const [departmentId, setDepartmentId] = useState<string>(currentUser.departmentId || 'dept-pm');
  const [section, setSection] = useState<string>('');
  const [bookerEmail, setBookerEmail] = useState<string>(currentUser.email);
  const [bookerPhone, setBookerPhone] = useState<string>(currentUser.phone);

  // Meeting specific data
  const [attendeesCount, setAttendeesCount] = useState<number>(4);
  const [attendeeNames, setAttendeeNames] = useState<string>('');
  const [externalOrganization, setExternalOrganization] = useState<string>('');
  const [confidential, setConfidential] = useState<boolean>(false);
  const [equipmentRequested, setEquipmentRequested] = useState<string[]>([
    'شاشة عرض'
  ]);
  const [notes, setNotes] = useState<string>('');

  // Recurrence
  const [recurrenceType, setRecurrenceType] = useState<'none' | 'daily' | 'weekly'>('none');
  const [recurrenceCount, setRecurrenceCount] = useState<number>(3);

  // Status management (specifically for Admin editing cancelled bookings)
  const [bookingStatus, setBookingStatus] = useState<BookingStatus>('confirmed');
  const [cancellationReason, setCancellationReason] = useState<string>('');

  // UI feedback
  const [errors, setErrors] = useState<string[]>([]);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [showErrorModal, setShowErrorModal] = useState<boolean>(false);
  const [conflictBookingData, setConflictBookingData] = useState<Booking | null>(null);

  // Equipment options defined in requirements
  const equipmentOptions = [
    'شاشة عرض',
    'كراسي وطاولة اجتماعات',
    'سبورة',
    'جهاز عرض (بروجكتور)',
    'مكبر صوت (Speakers)',
    'ضيافة ومشروبات',
    'تجهيزات أخرى'
  ];

  // Preset quick durations: 30, 60, 90, 120 mins
  const setQuickDuration = (minutes: number) => {
    const sMin = timeToMinutes(startTime);
    const newEndMin = sMin + minutes;
    setEndTime(minutesToTime(newEndMin));
  };

  // Active official departments reflected directly from Admin Exceptions / Section 5
  const activeDepartmentsList = useMemo(() => {
    const active = departments.filter((d) => d.status === 'active');
    if (departmentId) {
      const current = departments.find((d) => d.id === departmentId);
      if (current && !active.some((d) => d.id === current.id)) {
        active.push(current);
      }
    }
    return active;
  }, [departments, departmentId]);

  // Generate 12-hour time options with 15-minute intervals, expanding if admin exceptions are active
  const timeOptions = useMemo(() => {
    const exc = settings.adminExceptions;
    const isMaster = !!exc?.masterOverrideMode;
    const allow24 = isMaster || !!exc?.allow24Hours;
    const allowAfter = isMaster || allow24 || !!exc?.allowAfterHoursBookings;

    let startHour = 7;
    let endHour = 19;

    if (allow24) {
      startHour = 0;
      endHour = 23;
    } else if (allowAfter) {
      if (exc?.extendedHoursStart) {
        startHour = parseInt(exc.extendedHoursStart.split(':')[0], 10) || 5;
      } else {
        startHour = 6;
      }
      if (exc?.extendedHoursEnd) {
        endHour = Math.min(23, (parseInt(exc.extendedHoursEnd.split(':')[0], 10) || 23) + 1);
      } else {
        endHour = 23;
      }
    }

    const base = getTimeOptions12(15, startHour, endHour);
    const existingValues = new Set(base.map((o) => o.value));
    const result = [...base];
    if (startTime && !existingValues.has(startTime)) {
      result.push({
        value: startTime,
        labelAr: formatTime12(startTime, 'ar'),
        labelEn: formatTime12(startTime, 'en')
      });
    }
    if (endTime && !existingValues.has(endTime)) {
      result.push({
        value: endTime,
        labelAr: formatTime12(endTime, 'ar'),
        labelEn: formatTime12(endTime, 'en')
      });
    }
    return result.sort((a, b) => a.value.localeCompare(b.value));
  }, [startTime, endTime, settings.adminExceptions]);

  // Sync when editing an existing booking
  useEffect(() => {
    setShowErrorModal(false);
    setConflictBookingData(null);
    setErrors([]);
    if (editingBooking) {
      setRoomId(editingBooking.roomId);
      setDate(editingBooking.date);
      setStartTime(editingBooking.startTime);
      setEndTime(editingBooking.endTime);
      setTitle(editingBooking.title);
      setMeetingType(editingBooking.meetingType);
      setBookerName(editingBooking.bookerName);
      setEmployeeId(editingBooking.employeeId);
      setDepartmentId(editingBooking.departmentId);
      setSection(editingBooking.section || '');
      setBookerEmail(editingBooking.bookerEmail);
      setBookerPhone(editingBooking.bookerPhone);
      setAttendeesCount(editingBooking.attendeesCount);
      setAttendeeNames(editingBooking.attendeeNames || '');
      setExternalOrganization(editingBooking.externalOrganization || '');
      setConfidential(editingBooking.confidential);
      setEquipmentRequested(editingBooking.equipmentRequested || []);
      setNotes(editingBooking.notes || '');
      setBookingStatus(editingBooking.status || 'confirmed');
      setCancellationReason(editingBooking.cancellationReason || '');
    } else {
      setBookingStatus('confirmed');
      setCancellationReason('');
      if (preselectedRoomId) setRoomId(preselectedRoomId);
      const targetDate = preselectedDate || currentDate || getActualCurrentDate();
      setDate(targetDate);
      if (preselectedStartTime) {
        setStartTime(preselectedStartTime);
        const sMin = timeToMinutes(preselectedStartTime);
        setEndTime(minutesToTime(sMin + 60));
      } else {
        const nextSlot = getNextRoundedTimeSlot();
        setStartTime(nextSlot);
        const sMin = timeToMinutes(nextSlot);
        setEndTime(minutesToTime(sMin + 60));
      }
      if (preselectedDepartmentId) {
        setDepartmentId(preselectedDepartmentId);
      } else if (!departmentId || !departments.some(d => d.id === departmentId)) {
        setDepartmentId(currentUser.departmentId || departments[0]?.id || 'dept-serv');
      }
    }
  }, [isOpen, editingBooking, preselectedRoomId, preselectedDate, preselectedStartTime, preselectedDepartmentId, currentDate, departments]);

  // Live conflict warning as user types
  useEffect(() => {
    setWarningMessage(null);
    if (!date || !startTime || !endTime || !roomId) return;

    if (isWeekend(date) && !settings.allowWeekendBookings) {
      setWarningMessage(
        'لا يمكن إنشاء حجز في عطلة نهاية الأسبوع. أيام الحجز المعتمدة هي من الاثنين إلى الجمعة.'
      );
      return;
    }

    const testVal = validateBookingRequest({
      roomId,
      date,
      startTime,
      endTime,
      title: title || 'اختبار',
      bookerName: bookerName || 'اختبار',
      employeeId: employeeId || '0000',
      departmentId,
      rooms,
      existingBookings: bookings,
      settings,
      holidays,
      excludeBookingId: editingBooking?.id,
      currentDate,
      userRole: currentUser.role,
      targetStatus: editingBooking ? bookingStatus : 'confirmed'
    });

    if (!testVal.isValid && testVal.errors.length > 0) {
      setWarningMessage(testVal.errors[0]);
      if (testVal.conflictBooking) {
        setConflictBookingData(testVal.conflictBooking);
      }
    }
  }, [roomId, date, startTime, endTime, departmentId, bookings, bookingStatus]);

  if (!isOpen) return null;

  const durationMinutes = calculateDuration(startTime, endTime);
  const selectedRoom = rooms.find((r) => r.id === roomId);
  const selectedDepartment = departments.find((d) => d.id === departmentId);

  const toggleEquipment = (item: string) => {
    if (equipmentRequested.includes(item)) {
      setEquipmentRequested(equipmentRequested.filter((e) => e !== item));
    } else {
      setEquipmentRequested([...equipmentRequested, item]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setConflictBookingData(null);

    // 1. Explicit validation check for conflicts, operating hours, and room policies
    const clientValidation = validateBookingRequest({
      roomId,
      date,
      startTime,
      endTime,
      title,
      bookerName,
      employeeId,
      departmentId,
      rooms,
      existingBookings: bookings,
      settings,
      holidays,
      excludeBookingId: editingBooking?.id,
      currentDate,
      userRole: currentUser.role,
      targetStatus: editingBooking ? bookingStatus : 'confirmed'
    });

    if (!clientValidation.isValid) {
      setErrors(clientValidation.errors);
      setConflictBookingData(clientValidation.conflictBooking || null);
      setShowErrorModal(true);
      return;
    }

    const deptObj = departments.find((d) => d.id === departmentId);
    const roomObj = rooms.find((r) => r.id === roomId);

    const bookingPayload = {
      roomId,
      roomNameAr: roomObj?.nameAr || 'الدانة',
      roomNameEn: roomObj?.nameEn || 'Al Dana',
      userId: currentUser.id,
      departmentId,
      departmentNameAr: deptObj?.nameAr || 'إدارة غير محددة',
      departmentNameEn: deptObj?.nameEn || 'Department',
      title,
      meetingType,
      date,
      startTime,
      endTime,
      durationMinutes,
      bookerName,
      employeeId,
      bookerEmail,
      bookerPhone,
      section,
      attendeesCount,
      attendeeNames,
      externalOrganization,
      confidential,
      equipmentRequested,
      notes,
      recurrenceType,
      recurrenceCount,
      status: editingBooking ? bookingStatus : 'confirmed',
      cancellationReason:
        bookingStatus === 'cancelled'
          ? (cancellationReason || editingBooking?.cancellationReason || 'ملغي إدارياً')
          : undefined
    };

    if (editingBooking) {
      const res = updateBooking(editingBooking.id, bookingPayload);
      if (res.success) {
        setShowErrorModal(false);
        onClose();
      } else if (res.errors) {
        setErrors(res.errors);
        setConflictBookingData(res.conflictBooking || null);
        setShowErrorModal(true);
      }
    } else {
      const res = createBooking(bookingPayload);
      if (res.success) {
        setShowErrorModal(false);
        onClose();
      } else if (res.errors) {
        setErrors(res.errors);
        setConflictBookingData(res.conflictBooking || null);
        setShowErrorModal(true);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-linear-to-r from-blue-900 via-blue-800 to-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <Calendar className="w-5 h-5 text-sky-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">
                  {editingBooking
                    ? editingBooking.status === 'cancelled'
                      ? 'تعديل الحجز الملغي'
                      : 'تعديل حجز قاعة اجتماع'
                    : 'حجز قاعة اجتماع جديد'}
                </h2>
                {editingBooking?.status === 'cancelled' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-200 border border-rose-400">
                    حجز ملغي (إدارة المشرف Admin)
                  </span>
                )}
              </div>
              <p className="text-xs text-sky-200">
                شركة ساعد للأنظمة المرورية • تدقيق فوري لمنع التعارض
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Exceptions Banner (strictly for Admins) vs Standard Policy Note for Non-Admins */}
        {isAdmin &&
        (settings.adminExceptions?.masterOverrideMode ||
          settings.adminExceptions?.allowHolidayBookings ||
          settings.adminExceptions?.allowAfterHoursBookings ||
          settings.adminExceptions?.allowExtendedDuration ||
          settings.adminExceptions?.allowWeekendBookings ||
          settings.adminExceptions?.allowPastDateBookings) ? (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 text-xs flex items-center justify-between text-emerald-900 font-medium">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong className="font-bold text-emerald-950">استثناءات الإدارة مفعّلة لحساب الأدمن: </strong>
                {settings.adminExceptions.masterOverrideMode
                  ? 'وضع الاستثناء الشامل مفعّل (كافة الضوابط ملغاة)'
                  : [
                      settings.adminExceptions.allowHolidayBookings && 'العطلات الرسمية متاحة',
                      settings.adminExceptions.allowAfterHoursBookings && 'خارج أوقات العمل متاح',
                      settings.adminExceptions.allowExtendedDuration && `المدة حتى ${Math.round((settings.adminExceptions.maxExtendedDurationMinutes || 720) / 60)} ساعات`,
                      settings.adminExceptions.allowWeekendBookings && 'عطلة نهاية الأسبوع متاحة',
                      settings.adminExceptions.allowPastDateBookings && 'الحجز بأثر رجعي متاح'
                    ]
                      .filter(Boolean)
                      .join(' • ')}
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800">
              مصادق إدارياً
            </span>
          </div>
        ) : (
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-2 text-xs flex items-center justify-between text-slate-700 font-medium">
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>
                <strong className="font-bold text-slate-900">
                  حسابك الحالي ({currentUser.role === 'employee' ? 'موظف' : currentUser.role === 'coordinator' ? 'منسق الحجوزات' : currentUser.role === 'viewer' ? 'مستعرض فقط' : currentUser.role}):
                </strong>{' '}
                يخضع للضوابط والسياسات الرسمية القياسية (لا تشمل حسابك صلاحيات الأدمن أو استثناءات الإدارة).
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
              ضوابط قياسية
            </span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 text-xs sm:text-sm">
          
          {/* Real-time Warning or Error Box */}
          {warningMessage && (
            <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 flex items-start justify-between gap-2.5">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs font-semibold leading-relaxed">
                  {warningMessage}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setErrors([warningMessage]);
                  setShowErrorModal(true);
                }}
                className="shrink-0 px-2.5 py-1 text-[11px] font-bold bg-amber-200/90 hover:bg-amber-300 text-amber-950 rounded-lg transition-colors shadow-2xs"
              >
                عرض سبب التعارض
              </button>
            </div>
          )}

          {errors.length > 0 && (
            <div className="p-4 bg-red-50 border border-red-300 rounded-xl text-red-900 space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-bold flex items-center gap-2 text-sm text-red-800">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  تعذر حفظ الحجز للأسباب التالية:
                </div>
                <button
                  type="button"
                  onClick={() => setShowErrorModal(true)}
                  className="px-2.5 py-1 text-[11px] font-bold bg-red-100 hover:bg-red-200 text-red-900 rounded-lg transition-colors border border-red-300 shadow-2xs"
                >
                  فتح الإشعار المنبثق
                </button>
              </div>
              <ul className="list-disc list-inside text-xs space-y-1 pr-2">
                {errors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Admin Status & Reactivation Section for Cancelled Booking */}
          {isAdmin && editingBooking?.status === 'cancelled' && (
            <div className="p-4 rounded-xl border border-rose-300 bg-rose-50/70 space-y-3.5 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-rose-200/80 pb-2.5 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-rose-100 text-rose-700">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-rose-950">
                      إدارة وتعديل الحجز الملغي رقم ({editingBooking.bookingNumber})
                    </h3>
                    <p className="text-[11px] text-rose-700">
                      بصفتك مدير النظام (Admin)، يمكنك تعديل تفاصيل الاجتماع أو توثيق سبب الإلغاء أو إعادة تنشيطه ليصبح مؤكداً مجدداً.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-rose-200 text-rose-900 border border-rose-300">
                  صلاحية مدير النظام
                </span>
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  تحديد الحالة بعد الحفظ:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <label className={`p-3 rounded-xl border cursor-pointer flex items-start gap-2.5 transition-all ${
                    bookingStatus === 'cancelled'
                      ? 'bg-white border-rose-400 shadow-2xs ring-2 ring-rose-300'
                      : 'bg-white/60 border-slate-200 hover:bg-white text-slate-600'
                  }`}>
                    <input
                      type="radio"
                      name="bookingStatusOption"
                      checked={bookingStatus === 'cancelled'}
                      onChange={() => setBookingStatus('cancelled')}
                      className="mt-0.5 text-rose-600 focus:ring-rose-500 cursor-pointer"
                    />
                    <div>
                      <span className="font-bold block text-xs text-rose-950">
                        الإبقاء على الحجز كـ «ملغي»
                      </span>
                      <span className="text-[11px] text-slate-600 block mt-0.5 leading-snug">
                        تحديث معلومات الاجتماع أو سبب الإلغاء دون حجز القاعة في التقويم.
                      </span>
                    </div>
                  </label>

                  <label className={`p-3 rounded-xl border cursor-pointer flex items-start gap-2.5 transition-all ${
                    bookingStatus === 'confirmed'
                      ? 'bg-white border-emerald-400 shadow-2xs ring-2 ring-emerald-300'
                      : 'bg-white/60 border-slate-200 hover:bg-white text-slate-600'
                  }`}>
                    <input
                      type="radio"
                      name="bookingStatusOption"
                      checked={bookingStatus === 'confirmed'}
                      onChange={() => setBookingStatus('confirmed')}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <div>
                      <span className="font-bold block text-xs text-emerald-950">
                        إعادة تنشيط وتأكيد الحجز («مؤكد»)
                      </span>
                      <span className="text-[11px] text-slate-600 block mt-0.5 leading-snug">
                        إلغاء حالة الإلغاء، وحجز القاعة رسمياً في التقويم والإحصائيات.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Cancellation Reason Editor if keeping it cancelled */}
              {bookingStatus === 'cancelled' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    سبب إلغاء الحجز المعتمد:
                  </label>
                  <input
                    type="text"
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    placeholder="أدخل أو عدّل سبب الإلغاء..."
                    className="w-full px-3 py-2 rounded-lg border border-rose-300 bg-white text-xs text-slate-800 focus:ring-2 focus:ring-rose-400 focus:outline-hidden"
                  />
                </div>
              )}
            </div>
          )}

          {/* Section 1: معلومات الحجز */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-blue-900 font-bold text-sm">
              <DoorOpen className="w-4 h-4 text-blue-700" />
              <span>معلومات القاعة والوقت</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Room Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  القاعة <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {rooms.map((r) => {
                    const isSelected = roomId === r.id;
                    const isMaintenance = r.status === 'maintenance';
                    return (
                      <button
                        type="button"
                        key={r.id}
                        disabled={isMaintenance}
                        onClick={() => setRoomId(r.id)}
                        className={`p-3 rounded-xl border text-start transition-all relative ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-500/20'
                            : isMaintenance
                            ? 'border-slate-200 bg-slate-100 opacity-60 cursor-not-allowed'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="font-bold text-slate-900 text-sm">{r.nameAr}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{r.location}</div>
                        {isMaintenance ? (
                          <span className="text-[10px] text-red-600 font-bold mt-1 block">
                            مغلقة للصيانة
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">
                            متاحة للحجز
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Date Selection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    تاريخ الاجتماع <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                    يبدأ من اليوم الفعلي: {currentDate}
                  </span>
                </div>
                <input
                  type="date"
                  min={isAdmin && (settings.adminExceptions?.allowPastDateBookings || settings.adminExceptions?.masterOverrideMode) ? undefined : currentDate}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-medium text-slate-800"
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                  <span>{formatDateAr(date)}</span>
                  <span className="text-blue-700 font-semibold">أيام العمل: الإثنين - الجمعة</span>
                </p>
              </div>

            </div>

            {/* Time Controls (12-Hour System) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    وقت البداية (12 ساعة) <span className="text-red-500">*</span>
                  </label>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                    {formatTime12(startTime, 'ar')}
                  </span>
                </div>
                <select
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-sm focus:ring-2 focus:ring-blue-500 bg-white"
                  required
                >
                  {timeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.labelAr}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    وقت النهاية (12 ساعة) <span className="text-red-500">*</span>
                  </label>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800">
                    {formatTime12(endTime, 'ar')}
                  </span>
                </div>
                <select
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-sm focus:ring-2 focus:ring-blue-500 bg-white"
                  required
                >
                  {timeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.labelAr}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  مدة الاجتماع (الفترة الإجمالية)
                </label>
                <div className="px-3 py-2 rounded-lg bg-blue-100/70 border border-blue-200 text-blue-900 font-bold flex items-center justify-between">
                  <span>{durationMinutes} دقيقة</span>
                  <span className="text-xs text-blue-700 font-mono">
                    {formatTimeRange12(startTime, endTime)}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Duration Buttons (strictly standard for employees/coordinators, extended only if admin has exception) */}
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <span className="text-xs text-slate-500 font-medium">المدة السريعة:</span>
              {isAdmin && (settings.adminExceptions?.masterOverrideMode || settings.adminExceptions?.bypassMinDuration) && (
                <button
                  type="button"
                  onClick={() => setQuickDuration(15)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-all ${
                    durationMinutes === 15
                      ? 'bg-purple-700 text-white border-purple-700'
                      : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                  }`}
                >
                  15 دقيقة (سريع)
                </button>
              )}
              {[30, 60, 90, 120].map((mins) => (
                <button
                  type="button"
                  key={mins}
                  onClick={() => setQuickDuration(mins)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-all ${
                    durationMinutes === mins
                      ? 'bg-blue-700 text-white border-blue-700'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {mins} دقيقة
                </button>
              ))}
              {isAdmin && (settings.adminExceptions?.masterOverrideMode || settings.adminExceptions?.allowExtendedDuration) && (
                <>
                  <button
                    type="button"
                    onClick={() => setQuickDuration(240)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-all ${
                      durationMinutes === 240
                        ? 'bg-indigo-700 text-white border-indigo-700'
                        : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                    }`}
                  >
                    4 ساعات
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDuration(360)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-all ${
                      durationMinutes === 360
                        ? 'bg-indigo-700 text-white border-indigo-700'
                        : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                    }`}
                  >
                    6 ساعات (استثنائي)
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDuration(480)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-all ${
                      durationMinutes === 480
                        ? 'bg-indigo-700 text-white border-indigo-700'
                        : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                    }`}
                  >
                    8 ساعات (يوم كامل)
                  </button>
                </>
              )}
            </div>

            {/* Meeting Title & Type */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  عنوان الاجتماع / موضوع الاجتماع <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: اجتماع تدشين نظام الدوريات الذكية"
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 bg-white text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  نوع الاجتماع <span className="text-red-500">*</span>
                </label>
                <select
                  value={meetingType}
                  onChange={(e) => setMeetingType(e.target.value as MeetingType)}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 bg-white text-slate-900"
                >
                  <option value="administrative">اجتماع إداري</option>
                  <option value="internal">اجتماع داخلي</option>
                  <option value="external">اجتماع مع جهة خارجية</option>
                  <option value="project">اجتماع مشروع</option>
                  <option value="emergency">اجتماع طارئ</option>
                  <option value="training">تدريب</option>
                  <option value="presentation">عرض تقديمي</option>
                  <option value="other">أخرى</option>
                </select>
              </div>
            </div>

          </div>

          {/* Section 2: بيانات الحاجز */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-blue-900 font-bold text-sm">
              <User className="w-4 h-4 text-blue-700" />
              <span>بيانات مقدم الحجز</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  اسم الموظف <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={bookerName}
                  onChange={(e) => setBookerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الرقم الوظيفي <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 font-mono"
                  required
                />
              </div>

              {/* Dynamic Department Selection (Reflecting Section 5 in AdminExceptionsView) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    الإدارة الحاجزة (Department ID) <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                    <span>معتمدة رسمياً ({activeDepartmentsList.length} إدارة)</span>
                  </span>
                </div>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all text-xs sm:text-sm"
                  required
                >
                  {activeDepartmentsList.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nameAr} {d.code ? `• [${d.code}]` : ''} {d.status === 'inactive' ? ' (معطلة مؤقتاً)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  القسم التابع له (اختياري)
                </label>
                <input
                  type="text"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  placeholder="مثال: قسم الحلول الرقمية"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  value={bookerEmail}
                  onChange={(e) => setBookerEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  رقم الهاتف / التحويلة
                </label>
                <input
                  type="text"
                  value={bookerPhone}
                  onChange={(e) => setBookerPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Section 3: بيانات الاجتماع والمتطلبات */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-blue-900 font-bold text-sm">
              <Users className="w-4 h-4 text-blue-700" />
              <span>تفاصيل الحضور والتجهيزات التقنية</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  عدد الحضور المتوقع <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={attendeesCount}
                  onChange={(e) => setAttendeesCount(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الجهة الخارجية (إن وجدت)
                </label>
                <input
                  type="text"
                  value={externalOrganization}
                  onChange={(e) => setExternalOrganization(e.target.value)}
                  placeholder="مثال: وزارة الداخلية، شرطة أبوظبي"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  سرية الاجتماع
                </label>
                <div className="flex items-center gap-4 mt-2">
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="confidential"
                      checked={confidential === true}
                      onChange={() => setConfidential(true)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-semibold text-slate-800">نعم (سري)</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="confidential"
                      checked={confidential === false}
                      onChange={() => setConfidential(false)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-semibold text-slate-800">لا (عادي)</span>
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                أسماء الحضور الرئيسية (اختياري)
              </label>
              <input
                type="text"
                value={attendeeNames}
                onChange={(e) => setAttendeeNames(e.target.value)}
                placeholder="مثال: د. سلطان، م. ناصر، أ. ريم"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900"
              />
            </div>

            {/* Equipment checkboxes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                متطلبات وتجهيزات الاجتماع:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {equipmentOptions.map((eq) => {
                  const isChecked = equipmentRequested.includes(eq);
                  return (
                    <button
                      type="button"
                      key={eq}
                      onClick={() => toggleEquipment(eq)}
                      className={`px-3 py-2 rounded-lg border text-start flex items-center justify-between transition-colors ${
                        isChecked
                          ? 'border-blue-600 bg-blue-50 text-blue-900 font-semibold'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-xs">{eq}</span>
                      {isChecked && <CheckCircle className="w-3.5 h-3.5 text-blue-700" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ملاحظات أو طلبات إضافية
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="أي ملاحظات موجهة لفريق إدارة المرافق أو تقنية المعلومات..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900"
              />
            </div>
          </div>

          {/* Section 4: الحجز المتكرر (Recurrence) */}
          {!editingBooking && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-xs sm:text-sm">
                  <Repeat className="w-4 h-4 text-blue-700" />
                  <span>تكرار الحجز (اجتماع دوري)</span>
                </div>
                <select
                  value={recurrenceType}
                  onChange={(e) => setRecurrenceType(e.target.value as any)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold text-xs"
                >
                  <option value="none">بدون تكرار (مرة واحدة)</option>
                  <option value="daily">يومي (أيام العمل فقط)</option>
                  <option value="weekly">أسبوعي (نفس اليوم من كل أسبوع)</option>
                </select>
              </div>

              {recurrenceType !== 'none' && (
                <div className="mt-3 flex items-center gap-3 text-xs">
                  <span className="text-slate-600">عدد مرات التكرار:</span>
                  <input
                    type="number"
                    min="2"
                    max="10"
                    value={recurrenceCount}
                    onChange={(e) => setRecurrenceCount(parseInt(e.target.value, 10) || 2)}
                    className="w-20 px-2 py-1 rounded-md border border-slate-300 bg-white font-bold"
                  />
                  <span className="text-slate-500">اجتماعات (سيتم فحص التعارض لجميع التواريخ)</span>
                </div>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={currentUser.role === 'viewer'}
              className={`px-6 py-2.5 rounded-xl font-bold shadow-md transition-all flex items-center gap-2 ${
                currentUser.role === 'viewer'
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-blue-700 hover:bg-blue-800 text-white transform active:scale-95'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>
                {currentUser.role === 'viewer'
                  ? 'غير مصرح بالحجز (مستعرض فقط)'
                  : editingBooking
                  ? editingBooking.status === 'cancelled'
                    ? bookingStatus === 'confirmed'
                      ? 'حفظ وإعادة تنشيط الحجز (مؤكد)'
                      : 'حفظ تعديلات الحجز الملغي'
                    : 'حفظ التعديلات'
                  : 'تأكيد الحجز'}
              </span>
            </button>
          </div>

        </form>
      </div>

      {/* Centered Popup Notification Modal in the Middle of the Page for Conflicts and Errors */}
      <BookingErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        errors={errors.length > 0 ? errors : warningMessage ? [warningMessage] : []}
        conflictBooking={conflictBookingData}
        roomName={selectedRoom?.nameAr}
        date={date}
        startTime={startTime}
        endTime={endTime}
        onAdjustBooking={() => {
          setShowErrorModal(false);
        }}
      />
    </div>
  );
};
