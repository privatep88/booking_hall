/**
 * Date and Time utilities for Saaed Meeting Room System
 * Asia/Dubai timezone (UTC+4), 24-Hour clock, Monday-Friday working days.
 */

export const SYSTEM_TIMEZONE = 'Asia/Dubai';

/**
 * Returns the actual real-time current date formatted as YYYY-MM-DD
 * strictly according to the UAE (Asia/Dubai) timezone.
 */
export function getActualCurrentDate(): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: SYSTEM_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return formatter.format(new Date()); // Returns "YYYY-MM-DD"
  } catch {
    // Fallback in environments without timezone support
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}

/**
 * Returns the actual real-time current time formatted as HH:mm (24-Hour)
 * in Asia/Dubai timezone.
 */
export function getActualCurrentTime(): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: SYSTEM_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    return formatter.format(new Date()); // Returns "HH:mm"
  } catch {
    const d = new Date();
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }
}

/**
 * Returns the next available rounded time slot (e.g. 09:00, 09:30, 10:00)
 */
export function getNextRoundedTimeSlot(minOperatingTime: string = '08:00'): string {
  const current = getActualCurrentTime();
  const [h, m] = current.split(':').map(Number);
  
  let targetHour = h;
  let targetMin = 0;

  if (m < 30) {
    targetMin = 30;
  } else {
    targetHour += 1;
    targetMin = 0;
  }

  // If outside operating hours, clamp to minOperatingTime
  const computed = `${String(targetHour).padStart(2, '0')}:${String(targetMin).padStart(2, '0')}`;
  return computed < minOperatingTime ? minOperatingTime : computed;
}

export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function minutesToTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function isTimeOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);

  // Exact conflict rule: (StartA < EndB) and (EndA > StartB)
  return s1 < e2 && e1 > s2;
}

export function getDayOfWeekNumber(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return dt.getUTCDay();
}

export function isWeekend(dateStr: string): boolean {
  const day = getDayOfWeekNumber(dateStr);
  // Saturday is 6, Sunday is 0
  return day === 0 || day === 6;
}

export function isDateInPast(dateStr: string, currentDateStr: string = getActualCurrentDate()): boolean {
  return dateStr < currentDateStr;
}

export function calculateDuration(startTime: string, endTime: string): number {
  const s = timeToMinutes(startTime);
  const e = timeToMinutes(endTime);
  return Math.max(0, e - s);
}

export function formatTime24(timeStr: string): string {
  return timeStr || '00:00';
}

/**
 * Formats a 24-hour time string ("HH:mm") into a 12-hour format with Arabic (ص / م) or English (AM / PM) period.
 * Examples:
 *  "08:30" -> "08:30 ص"
 *  "12:00" -> "12:00 م"
 *  "13:45" -> "01:45 م"
 *  "00:00" -> "12:00 ص"
 */
export function formatTime12(timeStr?: string, locale: 'ar' | 'en' = 'ar'): string {
  if (!timeStr) return '';
  const clean = timeStr.trim();
  const parts = clean.split(':');
  if (parts.length < 2) return timeStr;

  let hours = parseInt(parts[0], 10);
  const minutes = parts[1].slice(0, 2);

  if (isNaN(hours)) return timeStr;

  const isPM = hours >= 12;
  const period = locale === 'ar' ? (isPM ? 'م' : 'ص') : (isPM ? 'PM' : 'AM');

  // Convert to 12-hour clock (0 -> 12, 13 -> 1, 12 -> 12)
  hours = hours % 12;
  if (hours === 0) hours = 12;

  const formattedHours = String(hours).padStart(2, '0');
  return `${formattedHours}:${minutes} ${period}`;
}

/**
 * Formats a time range into 12-hour format (e.g. "09:00 ص - 10:30 ص")
 */
export function formatTimeRange12(startTime?: string, endTime?: string, locale: 'ar' | 'en' = 'ar'): string {
  if (!startTime && !endTime) return '';
  if (!endTime) return formatTime12(startTime, locale);
  if (!startTime) return formatTime12(endTime, locale);
  return `${formatTime12(startTime, locale)} - ${formatTime12(endTime, locale)}`;
}

/**
 * Returns current real-time in 12-hour format
 */
export function getActualCurrentTime12(locale: 'ar' | 'en' = 'ar'): string {
  return formatTime12(getActualCurrentTime(), locale);
}

/**
 * Generates selectable 12-hour time options from startHour to endHour
 */
export function getTimeOptions12(stepMinutes: number = 15, startH: number = 7, endH: number = 19) {
  const options: { value: string; labelAr: string; labelEn: string }[] = [];
  for (let h = startH; h <= endH; h++) {
    for (let m = 0; m < 60; m += stepMinutes) {
      if (h === endH && m > 0) break;
      const val = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      options.push({
        value: val,
        labelAr: formatTime12(val, 'ar'),
        labelEn: formatTime12(val, 'en')
      });
    }
  }
  return options;
}

export function formatDateAr(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return new Intl.DateTimeFormat('ar-AE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC'
  }).format(date);
}

export function formatDateEn(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC'
  }).format(date);
}

export function getDayNameAr(dateStr: string): string {
  const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  return days[getDayOfWeekNumber(dateStr)] || '';
}

export function generateBookingNumber(existingCount: number, year?: number): string {
  const actualYear = year || new Date().getFullYear();
  const nextNum = existingCount + 1;
  return `MR-${actualYear}-${String(nextNum).padStart(6, '0')}`;
}
