import { Room, Department, Booking, User, Holiday, SystemSettings, AuditLog } from '../types';

export const INITIAL_ROOMS: Room[] = [
  {
    id: 'room-dana',
    nameAr: 'الدانة',
    nameEn: 'Al Dana',
    code: 'DANA-01',
    capacity: 'غير محدد',
    location: 'المقر الرئيسي - الطابق الثالث',
    floor: 'الطابق 3',
    description: 'قاعة الاجتماعات الرئيسية لكبار المسؤولين ومجالس الإدارة',
    equipment: ['شاشة عرض', 'كراسي وطاولة اجتماعات', 'سبورة'],
    status: 'available',
    operatingHours: {
      start: '07:30',
      end: '18:00'
    },
    minDurationMinutes: 30,
    maxDurationMinutes: 240,
    checkInRequired: true,
    autoReleaseMinutes: 15
  },
  {
    id: 'room-waha',
    nameAr: 'الواحة',
    nameEn: 'Al Waha',
    code: 'WAHA-02',
    capacity: 'غير محدد',
    location: 'المقر الرئيسي - الطابق الثالث',
    floor: 'الطابق 3',
    description: 'قاعة اجتماعات متعددة الأغراض لفرق المشاريع والتدريب الداخلي',
    equipment: ['شاشة عرض', 'كراسي وطاولة اجتماعات', 'سبورة'],
    status: 'available',
    operatingHours: {
      start: '07:30',
      end: '18:00'
    },
    minDurationMinutes: 30,
    maxDurationMinutes: 240,
    checkInRequired: true,
    autoReleaseMinutes: 15
  }
];

export const INITIAL_DEPARTMENTS: Department[] = [
  { id: 'dept-exec', nameAr: 'الإدارة العليا', nameEn: 'Executive Management', code: 'EXEC', status: 'active' },
  { id: 'dept-pm', nameAr: 'إدارة المشاريع', nameEn: 'Projects Department', code: 'PMO', status: 'active' },
  { id: 'dept-hr', nameAr: 'إدارة الموارد البشرية', nameEn: 'Human Resources', code: 'HR', status: 'active' },
  { id: 'dept-fin', nameAr: 'إدارة المالية', nameEn: 'Finance Department', code: 'FIN', status: 'active' },
  { id: 'dept-it', nameAr: 'إدارة تقنية المعلومات', nameEn: 'IT Department', code: 'IT', status: 'active' },
  { id: 'dept-ops', nameAr: 'الإدارة التشغيلية', nameEn: 'Operations Department', code: 'OPS', status: 'active' },
  { id: 'dept-traffic', nameAr: 'إدارة السلامة المرورية', nameEn: 'Traffic Safety Department', code: 'TSD', status: 'active' },
  { id: 'dept-legal', nameAr: 'الإدارة القانونية', nameEn: 'Legal Department', code: 'LEG', status: 'active' },
  { id: 'dept-serv', nameAr: 'إدارة الخدمات العامة', nameEn: 'General Services', code: 'GS', status: 'active' },
  { id: 'dept-fac', nameAr: 'إدارة المرافق', nameEn: 'Facilities Department', code: 'FAC', status: 'active' },
  { id: 'dept-dti', nameAr: 'إدارة التحول الرقمي والذكاء الاصطناعي', nameEn: 'Digital Transformation & AI', code: 'DTI', status: 'active' },
  { id: 'dept-strat', nameAr: 'إدارة الاستراتيجية والمستقبل', nameEn: 'Strategy & Future', code: 'STRAT', status: 'active' },
  { id: 'dept-comm', nameAr: 'إدارة الاتصال المؤسسي والإعلام', nameEn: 'Corporate Communications', code: 'COMM', status: 'active' },
  { id: 'dept-comp', nameAr: 'إدارة الشؤون التنظيمية والامتثال', nameEn: 'Regulatory & Compliance', code: 'COMP', status: 'active' },
  { id: 'dept-chd', nameAr: 'إدارة إسعاد وخدمة المتعاملين', nameEn: 'Customer Happiness', code: 'CHD', status: 'active' },
  { id: 'dept-aud', nameAr: 'إدارة التدقيق الداخلي والحوكمة', nameEn: 'Internal Audit & Governance', code: 'AUD', status: 'active' },
  { id: 'dept-inn', nameAr: 'إدارة الابتكار والريادة', nameEn: 'Innovation & Leadership', code: 'INN', status: 'active' },
  { id: 'dept-proc', nameAr: 'إدارة سلاسل الإمداد والمشتريات', nameEn: 'Procurement & Supply Chain', code: 'PROC', status: 'active' },
  { id: 'dept-other', nameAr: 'أخرى', nameEn: 'Other Departments', code: 'OTH', status: 'active' }
];

export const INITIAL_USERS: User[] = [
  {
    id: 'user-1',
    employeeId: 'SD-1001',
    fullName: 'خالد الهاشمي',
    email: 'hall@hall.ae',
    phone: '+971 50 123 4567',
    departmentId: 'dept-serv',
    departmentNameAr: 'إدارة الخدمات العامة',
    role: 'super_admin',
    status: 'active',
    createdAt: '2026-01-01T08:00:00Z',
    updatedAt: '2026-10-06T08:00:00Z'
  }
];

export const INITIAL_SETTINGS: SystemSettings = {
  companyNameAr: 'شركة ساعد للأنظمة المرورية',
  companyNameEn: 'Saaed for Traffic Systems',
  systemNameAr: 'نظام إدارة وحجز قاعات الاجتماعات',
  systemNameEn: 'Meeting Rooms Management System',
  workingDays: [1, 2, 3, 4, 5], // Monday to Friday (1=Mon, 5=Fri)
  timezone: 'Asia/Dubai',
  operatingHoursStart: '07:30',
  operatingHoursEnd: '18:00',
  minMeetingMinutes: 30,
  maxMeetingMinutes: 240,
  maxFutureBookingDays: 90,
  autoReleaseMinutes: 15,
  allowWeekendBookings: false,
  requireCheckIn: true,
  adminExceptions: {
    allowHolidayBookings: false,
    exemptedHolidays: [],
    allowAfterHoursBookings: false,
    extendedHoursStart: '06:00',
    extendedHoursEnd: '23:30',
    allow24Hours: false,
    allowExtendedDuration: false,
    maxExtendedDurationMinutes: 720, // 12 hours
    bypassMinDuration: false,
    allowWeekendBookings: false,
    allowCapacityOverflow: false,
    allowPastDateBookings: false,
    bypassCheckInRequirement: false,
    bypassMaxFutureDays: false,
    masterOverrideMode: false,
    exceptionGrants: []
  }
};

export const INITIAL_HOLIDAYS: Holiday[] = [
  { id: 'hol-1', nameAr: 'رأس السنة الميلادية', nameEn: 'New Year Day', date: '2026-01-01', status: 'active' },
  { id: 'hol-2', nameAr: 'عيد الفطر المبارك', nameEn: 'Eid Al Fitr', date: '2026-03-20', status: 'active' },
  { id: 'hol-3', nameAr: 'عيد الأضحى المبارك', nameEn: 'Eid Al Adha', date: '2026-05-27', status: 'active' },
  { id: 'hol-4', nameAr: 'اليوم الوطني الإماراتي', nameEn: 'UAE National Day', date: '2026-12-02', status: 'active' }
];

// Completely zeroed out and empty bookings
export const INITIAL_BOOKINGS: Booking[] = [];

// Completely zeroed out and empty audit logs
export const INITIAL_AUDIT_LOGS: AuditLog[] = [];


