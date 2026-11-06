import { Booking, Room, SystemSettings, Holiday, UserRole } from '../types';
import {
  isWeekend,
  isTimeOverlap,
  calculateDuration,
  timeToMinutes,
  getActualCurrentDate,
  formatTime12
} from '../utils/dateUtils';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  conflictBooking?: Booking;
}

export function validateBookingRequest({
  roomId,
  date,
  startTime,
  endTime,
  title,
  bookerName,
  employeeId,
  departmentId,
  rooms,
  existingBookings,
  settings,
  holidays,
  excludeBookingId,
  currentDate = getActualCurrentDate(),
  userRole = 'employee',
  targetStatus = 'confirmed'
}: {
  roomId: string;
  date: string;
  startTime: string;
  endTime: string;
  title: string;
  bookerName: string;
  employeeId: string;
  departmentId: string;
  rooms: Room[];
  existingBookings: Booking[];
  settings: SystemSettings;
  holidays: Holiday[];
  excludeBookingId?: string;
  currentDate?: string;
  userRole?: UserRole;
  targetStatus?: string;
}): ValidationResult {
  const errors: string[] = [];

  // 1. Required fields check
  if (!roomId) errors.push('يرجى تحديد القاعة المراد حجزها.');
  if (!date) errors.push('يرجى تحديد تاريخ الاجتماع.');
  if (!startTime) errors.push('يرجى تحديد وقت بداية الاجتماع.');
  if (!endTime) errors.push('يرجى تحديد وقت نهاية الاجتماع.');
  if (!title || !title.trim()) errors.push('يرجى إدخال موضوع أو عنوان الاجتماع.');
  if (!bookerName || !bookerName.trim()) errors.push('يرجى إدخال اسم مقدم الحجز.');
  if (!employeeId || !employeeId.trim()) errors.push('يرجى إدخال الرقم الوظيفي.');
  if (!departmentId) errors.push('يرجى اختيار الإدارة التابع لها الحجز.');

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  // If the booking is cancelled (and being saved as cancelled by Admin),
  // room occupancy and conflict rules do not apply as it doesn't occupy space.
  if (targetStatus === 'cancelled') {
    return { isValid: true, errors: [] };
  }

  // 2. Room existence and status check
  const targetRoom = rooms.find((r) => r.id === roomId);
  if (!targetRoom) {
    errors.push('القاعة المحددة غير موجودة في النظام.');
    return { isValid: false, errors };
  }

  if (targetRoom.status === 'maintenance') {
    errors.push(`قاعة "${targetRoom.nameAr}" مغلقة حالياً لأعمال الصيانة والتجهيز.`);
  } else if (targetRoom.status === 'disabled') {
    errors.push(`قاعة "${targetRoom.nameAr}" معطلة إدارياً وغير متاحة للحجز.`);
  }

  // 0. Role check: Viewer cannot book
  if (userRole === 'viewer') {
    errors.push('صلاحية "مستعرض فقط" مخصصة للاطلاع والمشاهدة فقط، ولا تملك صلاحية إنشاء حجوزات جديدة أو تعديل الحجوزات.');
    return { isValid: false, errors };
  }

  const isAdmin = userRole === 'super_admin' || userRole === 'admin';
  const exc = isAdmin ? settings.adminExceptions : undefined;
  const isMasterOverride = isAdmin && !!exc?.masterOverrideMode;

  // Helper to check active custom grant (strictly applicable ONLY if user is admin)
  const hasActiveGrant = (category: string, dateCheck?: string, roomCheck?: string) => {
    if (!isAdmin || !exc?.exceptionGrants) return false;
    return exc.exceptionGrants.some((g) => {
      if (!g.isActive) return false;
      const catMatch = g.category === category || g.category === 'all';
      const dateMatch = !g.specificDate || (dateCheck && g.specificDate === dateCheck);
      const roomMatch = g.targetRoomId === 'all' || (roomCheck && g.targetRoomId === roomCheck);
      return catMatch && dateMatch && roomMatch;
    });
  };

  // 3. Weekend check (Monday - Friday allowed, Sat & Sun strictly blocked for non-admins)
  // Admin exceptions and options apply ONLY to super_admin and admin roles
  const isWeekendAllowed =
    isAdmin && (isMasterOverride || !!exc?.allowWeekendBookings || hasActiveGrant('weekend', date, roomId));

  if (!isWeekendAllowed && isWeekend(date)) {
    errors.push(
      isAdmin
        ? 'لا يمكن إنشاء حجز في عطلة نهاية الأسبوع. أيام الحجز المعتمدة هي من الاثنين إلى الجمعة (يمكنك كمسؤول تفعيل استثناء من تبويب استثناءات الإدارة).'
        : 'لا يمكن إنشاء حجز في عطلة نهاية الأسبوع (السبت والأحد). أيام الحجز المعتمدة هي من الاثنين إلى الجمعة فقط، وحسابك لا يملك صلاحية الأدمن أو استثناءات الإدارة.'
    );
  }

  // 4. Official Holiday check
  const holiday = holidays.find((h) => h.date === date && h.status === 'active');
  if (holiday) {
    const isHolidayAllowed =
      isAdmin &&
      (isMasterOverride ||
        !!exc?.allowHolidayBookings ||
        (exc?.exemptedHolidays && exc.exemptedHolidays.includes(holiday.id)) ||
        hasActiveGrant('holiday', date, roomId));

    if (!isHolidayAllowed) {
      errors.push(
        isAdmin
          ? `تاريخ الحجز يصادف عطلة رسمية معتمدة: (${holiday.nameAr}). تم حظر الحجز مالم يتم تفعيل استثناء العطلة من تبويب استثناءات الإدارة.`
          : `تاريخ الحجز يصادف عطلة رسمية معتمدة: (${holiday.nameAr}). الحجز محظور في أيام العطلات الرسمية، وحسابك لا يملك صلاحية الأدمن أو استثناءات الإدارة لتجاوز العطلات.`
      );
    }
  }

  // 5. Past Date check (allowable strictly if admin past-date exception is active)
  const isPastDateAllowed = isAdmin && (isMasterOverride || !!exc?.allowPastDateBookings);
  if (!isPastDateAllowed && date < currentDate) {
    errors.push(
      isAdmin
        ? 'لا يمكن إنشاء حجز في تاريخ مضى مالم يتم تفعيل استثناء الحجز بأثر رجعي من استثناءات الإدارة.'
        : 'لا يمكن إنشاء حجز في تاريخ مضى. خيار واستثناء الحجز بأثر رجعي مخصص لمدير النظام فقط.'
    );
  }

  // 6. End Time > Start Time check
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);
  if (endMin <= startMin) {
    errors.push('وقت نهاية الاجتماع يجب أن يكون بعد وقت البداية.');
  }

  // 7. Duration limits check
  const duration = calculateDuration(startTime, endTime);
  const minBypassed = isAdmin && (isMasterOverride || !!exc?.bypassMinDuration);
  const minDuration = minBypassed ? 5 : (targetRoom.minDurationMinutes || settings.minMeetingMinutes || 30);

  let effectiveMaxDuration = targetRoom.maxDurationMinutes || settings.maxMeetingMinutes || 240;
  if (isAdmin) {
    if (isMasterOverride) {
      effectiveMaxDuration = 1440; // 24 hours
    } else if (exc?.allowExtendedDuration) {
      effectiveMaxDuration = Math.max(effectiveMaxDuration, exc.maxExtendedDurationMinutes || 720);
    } else if (hasActiveGrant('duration', date, roomId)) {
      const grant = exc?.exceptionGrants.find((g) => g.isActive && (g.category === 'duration' || g.category === 'all') && (g.targetRoomId === 'all' || g.targetRoomId === roomId));
      if (grant?.customMaxDurationMinutes) {
        effectiveMaxDuration = Math.max(effectiveMaxDuration, grant.customMaxDurationMinutes);
      }
    }
  }

  if (duration < minDuration) {
    errors.push(`الحد الأدنى لمدّة الاجتماع هو ${minDuration} دقيقة.`);
  }
  if (duration > effectiveMaxDuration) {
    errors.push(
      isAdmin
        ? `الحد الأقصى لمدّة الاجتماع هو ${effectiveMaxDuration} دقيقة (${Math.round(effectiveMaxDuration / 60)} ساعة). يمكن تمديد المدة عبر تبويب استثناءات الإدارة.`
        : `الحد الأقصى لمدّة الاجتماع هو ${effectiveMaxDuration} دقيقة (${Math.round(effectiveMaxDuration / 60)} ساعة). حسابك لا يملك صلاحية الأدمن أو استثناءات الإدارة لتمديد وقت الاجتماع.`
    );
  }

  // 8. Operating hours check
  const isAfterHoursAllowed =
    isAdmin &&
    (isMasterOverride ||
      !!exc?.allow24Hours ||
      !!exc?.allowAfterHoursBookings ||
      hasActiveGrant('after_hours', date, roomId));

  if (isAfterHoursAllowed) {
    // If 24h allowed, no restriction. If extended hours defined, check those
    if (!isMasterOverride && !exc?.allow24Hours && exc?.extendedHoursStart && exc?.extendedHoursEnd) {
      const extOpenMin = timeToMinutes(exc.extendedHoursStart);
      const extCloseMin = timeToMinutes(exc.extendedHoursEnd);
      if (startMin < extOpenMin || endMin > extCloseMin) {
        errors.push(`توقيت الحجز خارج نطاق ساعات العمل الاستثنائية المعتمدة (${exc.extendedHoursStart} إلى ${exc.extendedHoursEnd}).`);
      }
    }
  } else {
    const roomOpenMin = timeToMinutes(targetRoom.operatingHours?.start || settings.operatingHoursStart || '07:30');
    const roomCloseMin = timeToMinutes(targetRoom.operatingHours?.end || settings.operatingHoursEnd || '18:00');
    if (startMin < roomOpenMin || endMin > roomCloseMin) {
      errors.push(
        isAdmin
          ? `ساعات العمل الرسمية للقاعة هي من ${targetRoom.operatingHours?.start || '07:30'} إلى ${targetRoom.operatingHours?.end || '18:00'}. يمكن تفعيل استثناء خارج أوقات العمل من تبويب استثناءات الإدارة.`
          : `ساعات العمل الرسمية للقاعة هي من ${targetRoom.operatingHours?.start || '07:30'} إلى ${targetRoom.operatingHours?.end || '18:00'}. الحجز خارج وقت العمل غير مسموح لغير مسؤولي النظام.`
      );
    }
  }

  // 9. Overlapping Conflict check on the same room
  let conflictBooking: Booking | undefined;
  const sameDayRoomBookings = existingBookings.filter(
    (b) =>
      b.roomId === roomId &&
      b.date === date &&
      b.status !== 'cancelled' &&
      b.status !== 'rejected' &&
      b.id !== excludeBookingId
  );

  for (const existing of sameDayRoomBookings) {
    if (isTimeOverlap(startTime, endTime, existing.startTime, existing.endTime)) {
      conflictBooking = existing;
      errors.push(
        `يوجد تعارض مع حجز قائم: "${existing.title}" المحجوز من قبل (${existing.departmentNameAr}) بالفترة من ${formatTime12(existing.startTime)} إلى ${formatTime12(existing.endTime)}.`
      );
      break;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    conflictBooking
  };
}
