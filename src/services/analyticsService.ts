import { Booking, Room, Department } from '../types';
import { calculateDuration, getDayNameAr, formatTime12, formatTimeRange12 } from '../utils/dateUtils';

export interface DepartmentDateStat {
  departmentId: string;
  departmentNameAr: string;
  departmentNameEn: string;
  roomId: string;
  roomNameAr: string;
  date: string;
  dayNameAr: string;
  bookingCount: number;
  totalDurationMinutes: number;
  totalHours: number;
  bookings: Booking[];
}

export interface DepartmentSummaryStat {
  departmentId: string;
  departmentNameAr: string;
  departmentNameEn: string;
  roomId?: string;
  roomNameAr?: string;
  bookingCount: number;
  totalHours: number;
  firstBookingDate: string;
  lastBookingDate: string;
  confirmedCount: number;
  cancelledCount: number;
  averageDurationMinutes: number;
  utilizationRatePercentage: number;
}

export interface RoomDetailedStats {
  roomId: string;
  roomNameAr: string;
  roomNameEn: string;
  totalBookings: number;
  totalHours: number;
  departmentsCount: number;
  topDepartment: { nameAr: string; count: number } | null;
  lowestDepartment: { nameAr: string; count: number } | null;
  peakDay: { dayNameAr: string; date: string; count: number } | null;
  peakTimeSlot: { slot: string; count: number } | null;
  confirmedCount: number;
  cancelledCount: number;
  avgDurationMinutes: number;
  utilizationRate: number;
  byDepartment: { departmentNameAr: string; count: number; hours: number }[];
  byMonth: { monthKey: string; monthNameAr: string; count: number; hours: number }[];
  byDateLog: {
    date: string;
    dayNameAr: string;
    departmentNameAr: string;
    count: number;
    hours: number;
    confirmed: number;
    cancelled: number;
    bookings: Booking[];
  }[];
}

export interface RoomComparisonData {
  metricAr: string;
  metricEn: string;
  danaValue: string | number;
  wahaValue: string | number;
  difference?: string;
}

export function filterBookingsByPeriodAndStatus(
  bookings: Booking[],
  {
    startDate,
    endDate,
    roomId,
    departmentId,
    statusFilter = 'confirmed_completed', // 'confirmed_completed' | 'all' | 'specific'
    specificStatus
  }: {
    startDate?: string;
    endDate?: string;
    roomId?: string;
    departmentId?: string;
    statusFilter?: 'confirmed_completed' | 'all' | 'specific';
    specificStatus?: string;
  }
): Booking[] {
  return bookings.filter((b) => {
    // Room filter
    if (roomId && roomId !== 'all' && b.roomId !== roomId) return false;

    // Department filter
    if (departmentId && departmentId !== 'all' && b.departmentId !== departmentId) return false;

    // Date range filter
    if (startDate && b.date < startDate) return false;
    if (endDate && b.date > endDate) return false;

    // Status filter
    if (statusFilter === 'confirmed_completed') {
      return b.status === 'confirmed' || b.status === 'completed';
    } else if (statusFilter === 'specific' && specificStatus) {
      return b.status === specificStatus;
    }
    // 'all' includes all statuses
    return true;
  });
}

/**
 * 14 & 51: Core requirement:
 * [اسم الإدارة التي حجزت القاعة + التاريخ + عدد مرات الحجز]
 */
export function getDepartmentDateStatistics(
  bookings: Booking[],
  roomId?: string
): DepartmentDateStat[] {
  const filtered = roomId && roomId !== 'all' 
    ? bookings.filter((b) => b.roomId === roomId)
    : bookings;

  // Group by: departmentId + date + roomId
  const map = new Map<string, DepartmentDateStat>();

  for (const b of filtered) {
    const key = `${b.departmentId}_${b.date}_${b.roomId}`;
    const dur = b.durationMinutes || calculateDuration(b.startTime, b.endTime);

    if (!map.has(key)) {
      map.set(key, {
        departmentId: b.departmentId,
        departmentNameAr: b.departmentNameAr,
        departmentNameEn: b.departmentNameEn,
        roomId: b.roomId,
        roomNameAr: b.roomNameAr,
        date: b.date,
        dayNameAr: getDayNameAr(b.date),
        bookingCount: 1,
        totalDurationMinutes: dur,
        totalHours: Number((dur / 60).toFixed(1)),
        bookings: [b]
      });
    } else {
      const item = map.get(key)!;
      item.bookingCount += 1;
      item.totalDurationMinutes += dur;
      item.totalHours = Number((item.totalDurationMinutes / 60).toFixed(1));
      item.bookings.push(b);
    }
  }

  // Sort descending by date, then department
  return Array.from(map.values()).sort((a, b) => {
    if (b.date !== a.date) return b.date.localeCompare(a.date);
    return a.departmentNameAr.localeCompare(b.departmentNameAr);
  });
}

/**
 * Matrix table for All Rooms:
 * [الإدارة | الدانة | الواحة | الإجمالي]
 */
export function getDepartmentMatrixStatistics(
  bookings: Booking[],
  rooms: Room[],
  departments: Department[]
): {
  departmentId: string;
  departmentNameAr: string;
  danaCount: number;
  wahaCount: number;
  otherRoomsCount: number;
  totalCount: number;
  totalHours: number;
}[] {
  const results = departments.map((dept) => {
    const deptBookings = bookings.filter((b) => b.departmentId === dept.id);
    const danaBookings = deptBookings.filter((b) => b.roomId === 'room-dana');
    const wahaBookings = deptBookings.filter((b) => b.roomId === 'room-waha');
    const otherBookings = deptBookings.filter((b) => b.roomId !== 'room-dana' && b.roomId !== 'room-waha');

    const totalMinutes = deptBookings.reduce((sum, b) => sum + (b.durationMinutes || 0), 0);

    return {
      departmentId: dept.id,
      departmentNameAr: dept.nameAr,
      danaCount: danaBookings.length,
      wahaCount: wahaBookings.length,
      otherRoomsCount: otherBookings.length,
      totalCount: deptBookings.length,
      totalHours: Number((totalMinutes / 60).toFixed(1))
    };
  });

  // Filter out departments with 0 bookings and sort by totalCount desc
  return results
    .filter((r) => r.totalCount > 0)
    .sort((a, b) => b.totalCount - a.totalCount);
}

/**
 * Detailed Room Statistics for a specific room (Al Dana or Al Waha)
 */
export function calculateRoomDetailedStats(
  roomId: string,
  bookings: Booking[],
  room: Room,
  operatingHoursPerDay = 8
): RoomDetailedStats {
  const roomBookings = bookings.filter((b) => b.roomId === roomId);
  const totalMinutes = roomBookings.reduce((sum, b) => sum + (b.durationMinutes || 0), 0);
  const totalHours = Number((totalMinutes / 60).toFixed(1));

  // Distinct departments
  const deptMap = new Map<string, { count: number; minutes: number; nameAr: string }>();
  for (const b of roomBookings) {
    if (!deptMap.has(b.departmentNameAr)) {
      deptMap.set(b.departmentNameAr, { count: 1, minutes: b.durationMinutes || 0, nameAr: b.departmentNameAr });
    } else {
      const cur = deptMap.get(b.departmentNameAr)!;
      cur.count += 1;
      cur.minutes += b.durationMinutes || 0;
    }
  }

  const deptList = Array.from(deptMap.values()).sort((a, b) => b.count - a.count);
  const topDepartment = deptList.length > 0 ? { nameAr: deptList[0].nameAr, count: deptList[0].count } : null;
  const lowestDepartment = deptList.length > 0 ? { nameAr: deptList[deptList.length - 1].nameAr, count: deptList[deptList.length - 1].count } : null;

  // Peak Day
  const dateMap = new Map<string, number>();
  for (const b of roomBookings) {
    dateMap.set(b.date, (dateMap.get(b.date) || 0) + 1);
  }
  let peakDate = '';
  let peakDateCount = 0;
  for (const [d, count] of dateMap.entries()) {
    if (count > peakDateCount) {
      peakDateCount = count;
      peakDate = d;
    }
  }
  const peakDay = peakDate ? { dayNameAr: getDayNameAr(peakDate), date: peakDate, count: peakDateCount } : null;

  // Peak Time Slot (morning 08-10, 10-12, 12-14, 14-16, 16-18)
  const slotMap = new Map<string, number>();
  for (const b of roomBookings) {
    const sHour = `${b.startTime.slice(0, 2)}:00`;
    const eHour = `${b.endTime.slice(0, 2)}:00`;
    const slot = formatTimeRange12(sHour, eHour);
    slotMap.set(slot, (slotMap.get(slot) || 0) + 1);
  }
  let peakSlot = '';
  let peakSlotCount = 0;
  for (const [slot, count] of slotMap.entries()) {
    if (count > peakSlotCount) {
      peakSlotCount = count;
      peakSlot = slot;
    }
  }
  const peakTimeSlot = peakSlot ? { slot: peakSlot, count: peakSlotCount } : { slot: '09:00 ص – 11:00 ص', count: 0 };

  // Monthly breakdown
  const monthNamesAr = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  const monthMap = new Map<number, { count: number; minutes: number }>();
  for (let m = 0; m < 12; m++) monthMap.set(m, { count: 0, minutes: 0 });

  for (const b of roomBookings) {
    const [_, monthStr] = b.date.split('-');
    const mIdx = parseInt(monthStr, 10) - 1;
    if (monthMap.has(mIdx)) {
      const cur = monthMap.get(mIdx)!;
      cur.count += 1;
      cur.minutes += b.durationMinutes || 0;
    }
  }

  const byMonth = Array.from(monthMap.entries()).map(([mIdx, val]) => ({
    monthKey: String(mIdx + 1).padStart(2, '0'),
    monthNameAr: monthNamesAr[mIdx],
    count: val.count,
    hours: Number((val.minutes / 60).toFixed(1))
  }));

  // Date usage log
  const dateLogMap = new Map<string, {
    date: string;
    dayNameAr: string;
    departmentNameAr: string;
    count: number;
    minutes: number;
    confirmed: number;
    cancelled: number;
    bookings: Booking[];
  }>();

  for (const b of roomBookings) {
    const key = `${b.date}_${b.departmentId}`;
    if (!dateLogMap.has(key)) {
      dateLogMap.set(key, {
        date: b.date,
        dayNameAr: getDayNameAr(b.date),
        departmentNameAr: b.departmentNameAr,
        count: 1,
        minutes: b.durationMinutes || 0,
        confirmed: b.status === 'confirmed' || b.status === 'completed' ? 1 : 0,
        cancelled: b.status === 'cancelled' ? 1 : 0,
        bookings: [b]
      });
    } else {
      const cur = dateLogMap.get(key)!;
      cur.count += 1;
      cur.minutes += b.durationMinutes || 0;
      if (b.status === 'confirmed' || b.status === 'completed') cur.confirmed += 1;
      if (b.status === 'cancelled') cur.cancelled += 1;
      cur.bookings.push(b);
    }
  }

  const byDateLog = Array.from(dateLogMap.values())
    .map((item) => ({
      ...item,
      hours: Number((item.minutes / 60).toFixed(1))
    }))
    .sort((a, b) => b.date.localeCompare(a.date));

  const confirmedCount = roomBookings.filter((b) => b.status === 'confirmed' || b.status === 'completed').length;
  const cancelledCount = roomBookings.filter((b) => b.status === 'cancelled').length;
  const avgDurationMinutes = roomBookings.length > 0 ? Math.round(totalMinutes / roomBookings.length) : 0;

  // Utilization calculation
  // Distinct active days in bookings * operating hours per day
  const distinctDays = new Set(roomBookings.map((b) => b.date)).size || 1;
  const availableCapacityHours = distinctDays * operatingHoursPerDay;
  const utilizationRate = Math.min(100, Math.round((totalHours / (availableCapacityHours || 1)) * 100));

  return {
    roomId,
    roomNameAr: room.nameAr,
    roomNameEn: room.nameEn,
    totalBookings: roomBookings.length,
    totalHours,
    departmentsCount: deptMap.size,
    topDepartment,
    lowestDepartment,
    peakDay,
    peakTimeSlot,
    confirmedCount,
    cancelledCount,
    avgDurationMinutes,
    utilizationRate,
    byDepartment: deptList.map((d) => ({
      departmentNameAr: d.nameAr,
      count: d.count,
      hours: Number((d.minutes / 60).toFixed(1))
    })),
    byMonth,
    byDateLog
  };
}

/**
 * Direct Comparison: Al Dana vs Al Waha
 */
export function getRoomComparisonMetrics(
  bookings: Booking[],
  danaRoom: Room,
  wahaRoom: Room
): RoomComparisonData[] {
  const danaStats = calculateRoomDetailedStats('room-dana', bookings, danaRoom);
  const wahaStats = calculateRoomDetailedStats('room-waha', bookings, wahaRoom);

  return [
    {
      metricAr: 'إجمالي الحجوزات',
      metricEn: 'Total Bookings',
      danaValue: `${danaStats.totalBookings} حجز`,
      wahaValue: `${wahaStats.totalBookings} حجز`
    },
    {
      metricAr: 'إجمالي ساعات الاستخدام',
      metricEn: 'Total Booking Hours',
      danaValue: `${danaStats.totalHours} ساعة`,
      wahaValue: `${wahaStats.totalHours} ساعة`
    },
    {
      metricAr: 'عدد الإدارات المستخدمة',
      metricEn: 'Departments Count',
      danaValue: `${danaStats.departmentsCount} إدارات`,
      wahaValue: `${wahaStats.departmentsCount} إدارات`
    },
    {
      metricAr: 'الحجوزات المؤكدة / المكتملة',
      metricEn: 'Confirmed Bookings',
      danaValue: danaStats.confirmedCount,
      wahaValue: wahaStats.confirmedCount
    },
    {
      metricAr: 'الحجوزات الملغاة',
      metricEn: 'Cancelled Bookings',
      danaValue: danaStats.cancelledCount,
      wahaValue: wahaStats.cancelledCount
    },
    {
      metricAr: 'متوسط مدة الاجتماع',
      metricEn: 'Average Meeting Duration',
      danaValue: `${danaStats.avgDurationMinutes} دقيقة`,
      wahaValue: `${wahaStats.avgDurationMinutes} دقيقة`
    },
    {
      metricAr: 'نسبة الاستخدام (Utilization Rate)',
      metricEn: 'Room Utilization Rate',
      danaValue: `${danaStats.utilizationRate}%`,
      wahaValue: `${wahaStats.utilizationRate}%`
    }
  ];
}

/**
 * Export data to CSV with UTF-8 BOM so Arabic displays correctly in Excel
 */
export function exportToExcelCsv(
  filename: string,
  headers: string[],
  rows: (string | number)[][]
): void {
  // UTF-8 BOM: \uFEFF ensures Excel displays Arabic letters correctly without garbling
  const csvContent = '\uFEFF' + [
    headers.join(','),
    ...rows.map((row) =>
      row
        .map((cell) => {
          const val = String(cell ?? '').replace(/"/g, '""');
          return `"${val}"`;
        })
        .join(',')
    )
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export interface MonthDepartmentStatItem {
  departmentId: string;
  departmentNameAr: string;
  departmentNameEn: string;
  danaCount: number;
  wahaCount: number;
  totalCount: number;
  totalHours: number;
  percentageOfMonth: number;
  bookings: Booking[];
}

export interface MonthSummaryStat {
  monthIndex: number; // 1 to 12
  monthKey: string; // '01' to '12'
  monthNameAr: string;
  monthNameEn: string;
  departments: MonthDepartmentStatItem[];
  totalDana: number;
  totalWaha: number;
  totalAllDepartments: number;
  totalHours: number;
  activeDepartmentsCount: number;
}

export interface YearlyExecutiveStats {
  year: number;
  months: MonthSummaryStat[];
  departmentYearlyTotals: {
    departmentId: string;
    departmentNameAr: string;
    departmentNameEn: string;
    danaTotalYear: number;
    wahaTotalYear: number;
    grandTotalYear: number;
    totalHoursYear: number;
    byMonth: {
      [monthNum: number]: {
        dana: number;
        waha: number;
        total: number;
        hours: number;
      };
    };
  }[];
  grandTotalDanaYear: number;
  grandTotalWahaYear: number;
  grandTotalAllDepartmentsYear: number;
  grandTotalHoursYear: number;
  peakMonth: {
    monthIndex: number;
    monthNameAr: string;
    totalCount: number;
  } | null;
  topDepartmentYear: {
    nameAr: string;
    count: number;
  } | null;
}

/**
 * Calculates bookings made throughout the months of the year,
 * detailing all 12 months with separate bookings for Al Dana Hall
 * and Al Waha Hall per department, along with grand totals.
 */
export function getYearlyMonthlyDepartmentStats(
  bookings: Booking[],
  year: number,
  departments: Department[]
): YearlyExecutiveStats {
  const monthNamesAr = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  const monthNamesEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const yearPrefix = `${year}-`;
  const yearBookings = bookings.filter((b) => {
    if (!b.date.startsWith(yearPrefix)) return false;
    if (b.status === 'cancelled' || b.status === 'rejected') return false;
    return true;
  });

  const months: MonthSummaryStat[] = [];
  const deptYearMap = new Map<
    string,
    {
      departmentId: string;
      departmentNameAr: string;
      departmentNameEn: string;
      danaTotalYear: number;
      wahaTotalYear: number;
      grandTotalYear: number;
      totalHoursYear: number;
      byMonth: {
        [monthNum: number]: {
          dana: number;
          waha: number;
          total: number;
          hours: number;
        };
      };
    }
  >();

  // Initialize department yearly totals
  departments.forEach((dept) => {
    const byMonthInit: { [monthNum: number]: { dana: number; waha: number; total: number; hours: number } } = {};
    for (let m = 1; m <= 12; m++) {
      byMonthInit[m] = { dana: 0, waha: 0, total: 0, hours: 0 };
    }
    deptYearMap.set(dept.id, {
      departmentId: dept.id,
      departmentNameAr: dept.nameAr,
      departmentNameEn: dept.nameEn,
      danaTotalYear: 0,
      wahaTotalYear: 0,
      grandTotalYear: 0,
      totalHoursYear: 0,
      byMonth: byMonthInit
    });
  });

  let grandTotalDanaYear = 0;
  let grandTotalWahaYear = 0;
  let grandTotalAllDepartmentsYear = 0;
  let grandTotalHoursYear = 0;

  for (let m = 1; m <= 12; m++) {
    const monthKey = String(m).padStart(2, '0');
    const monthPrefix = `${year}-${monthKey}-`;
    const monthBookings = yearBookings.filter((b) => b.date.startsWith(monthPrefix));

    const monthDeptStats: MonthDepartmentStatItem[] = [];
    let monthTotalDana = 0;
    let monthTotalWaha = 0;
    let monthTotalHours = 0;

    departments.forEach((dept) => {
      const deptMonthBookings = monthBookings.filter((b) => b.departmentId === dept.id);
      const danaCount = deptMonthBookings.filter((b) => b.roomId === 'room-dana').length;
      const wahaCount = deptMonthBookings.filter((b) => b.roomId === 'room-waha').length;
      const totalCount = danaCount + wahaCount;
      const totalMinutes = deptMonthBookings.reduce((sum, b) => sum + (b.durationMinutes || 0), 0);
      const hours = Number((totalMinutes / 60).toFixed(1));

      monthTotalDana += danaCount;
      monthTotalWaha += wahaCount;
      monthTotalHours += hours;

      // Update yearly map
      const deptYear = deptYearMap.get(dept.id)!;
      deptYear.danaTotalYear += danaCount;
      deptYear.wahaTotalYear += wahaCount;
      deptYear.grandTotalYear += totalCount;
      deptYear.totalHoursYear = Number((deptYear.totalHoursYear + hours).toFixed(1));
      deptYear.byMonth[m] = {
        dana: danaCount,
        waha: wahaCount,
        total: totalCount,
        hours
      };

      if (totalCount > 0) {
        monthDeptStats.push({
          departmentId: dept.id,
          departmentNameAr: dept.nameAr,
          departmentNameEn: dept.nameEn,
          danaCount,
          wahaCount,
          totalCount,
          totalHours: hours,
          percentageOfMonth: 0,
          bookings: deptMonthBookings
        });
      }
    });

    const monthTotalAll = monthTotalDana + monthTotalWaha;
    monthDeptStats.forEach((d) => {
      d.percentageOfMonth = monthTotalAll > 0 ? Math.round((d.totalCount / monthTotalAll) * 100) : 0;
    });

    monthDeptStats.sort((a, b) => b.totalCount - a.totalCount);

    months.push({
      monthIndex: m,
      monthKey,
      monthNameAr: monthNamesAr[m - 1],
      monthNameEn: monthNamesEn[m - 1],
      departments: monthDeptStats,
      totalDana: monthTotalDana,
      totalWaha: monthTotalWaha,
      totalAllDepartments: monthTotalAll,
      totalHours: Number(monthTotalHours.toFixed(1)),
      activeDepartmentsCount: monthDeptStats.length
    });

    grandTotalDanaYear += monthTotalDana;
    grandTotalWahaYear += monthTotalWaha;
    grandTotalAllDepartmentsYear += monthTotalAll;
    grandTotalHoursYear = Number((grandTotalHoursYear + monthTotalHours).toFixed(1));
  }

  // Find peak month
  let peakMonth: { monthIndex: number; monthNameAr: string; totalCount: number } | null = null;
  months.forEach((m) => {
    if (m.totalAllDepartments > 0 && (!peakMonth || m.totalAllDepartments > peakMonth.totalCount)) {
      peakMonth = {
        monthIndex: m.monthIndex,
        monthNameAr: m.monthNameAr,
        totalCount: m.totalAllDepartments
      };
    }
  });

  const departmentYearlyTotals = Array.from(deptYearMap.values()).sort(
    (a, b) => b.grandTotalYear - a.grandTotalYear || a.departmentNameAr.localeCompare(b.departmentNameAr)
  );

  const topDepartmentYear =
    departmentYearlyTotals.length > 0 && departmentYearlyTotals[0].grandTotalYear > 0
      ? {
          nameAr: departmentYearlyTotals[0].departmentNameAr,
          count: departmentYearlyTotals[0].grandTotalYear
        }
      : null;

  return {
    year,
    months,
    departmentYearlyTotals,
    grandTotalDanaYear,
    grandTotalWahaYear,
    grandTotalAllDepartmentsYear,
    grandTotalHoursYear,
    peakMonth,
    topDepartmentYear
  };
}

export function exportYearlyMonthlyToExcelCsv(
  stats: YearlyExecutiveStats
): void {
  const headers = [
    'الإدارة',
    'إجمالي قاعة الدانة',
    'إجمالي قاعة الواحة',
    'المجموع الإجمالي السنوي',
    ...stats.months.map((m) => `${m.monthNameAr} - الدانة`),
    ...stats.months.map((m) => `${m.monthNameAr} - الواحة`),
    ...stats.months.map((m) => `${m.monthNameAr} - الإجمالي`)
  ];

  const activeDepts = stats.departmentYearlyTotals.filter((d) => d.grandTotalYear > 0);
  const rows: (string | number)[][] = (activeDepts.length > 0 ? activeDepts : stats.departmentYearlyTotals).map((d) => [
    d.departmentNameAr,
    d.danaTotalYear,
    d.wahaTotalYear,
    d.grandTotalYear,
    ...stats.months.map((m) => d.byMonth[m.monthIndex].dana),
    ...stats.months.map((m) => d.byMonth[m.monthIndex].waha),
    ...stats.months.map((m) => d.byMonth[m.monthIndex].total)
  ]);

  // Grand Total Row for All Departments
  rows.push([
    'المجموع الإجمالي لكافة الإدارات',
    stats.grandTotalDanaYear,
    stats.grandTotalWahaYear,
    stats.grandTotalAllDepartmentsYear,
    ...stats.months.map((m) => m.totalDana),
    ...stats.months.map((m) => m.totalWaha),
    ...stats.months.map((m) => m.totalAllDepartments)
  ]);

  exportToExcelCsv(`تقرير_الحجوزات_السنوية_الشهرية_للإدارات_${stats.year}`, headers, rows);
}
