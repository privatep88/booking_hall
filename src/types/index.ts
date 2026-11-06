export type UserRole = 
  | 'super_admin' 
  | 'admin' 
  | 'coordinator' 
  | 'employee' 
  | 'viewer';

export interface User {
  id: string;
  employeeId: string;
  fullName: string;
  email: string;
  phone: string;
  departmentId: string;
  departmentNameAr?: string;
  role: UserRole;
  status: 'active' | 'inactive';
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  nameAr: string;
  nameEn: string;
  code: string;
  status: 'active' | 'inactive';
}

export type RoomStatus = 'available' | 'occupied' | 'maintenance' | 'disabled';

export interface Room {
  id: string;
  nameAr: string; // 'الدانة', 'الواحة'
  nameEn: string; // 'Al Dana', 'Al Waha'
  code: string;
  capacity: number | 'غير محدد';
  location: string;
  floor: string;
  description: string;
  equipment: string[];
  image?: string;
  status: RoomStatus;
  operatingHours: {
    start: string; // "07:00"
    end: string;   // "19:00"
  };
  minDurationMinutes: number;
  maxDurationMinutes: number;
  checkInRequired: boolean;
  autoReleaseMinutes: number;
  maintenanceReason?: string;
  maintenanceUntil?: string;
}

export type MeetingType = 
  | 'administrative' 
  | 'internal' 
  | 'external' 
  | 'project' 
  | 'emergency' 
  | 'training' 
  | 'presentation' 
  | 'other';

export type BookingStatus = 
  | 'available' 
  | 'pending' 
  | 'confirmed' 
  | 'cancelled' 
  | 'completed' 
  | 'rejected';

export interface Booking {
  id: string;
  bookingNumber: string; // MR-2026-000001
  roomId: string;
  roomNameAr: string;
  roomNameEn: string;
  userId: string;
  departmentId: string;
  departmentNameAr: string;
  departmentNameEn: string;
  title: string;
  meetingType: MeetingType;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm (24-hour)
  endTime: string;   // HH:mm (24-hour)
  durationMinutes: number;
  bookerName: string;
  employeeId: string;
  bookerEmail: string;
  bookerPhone: string;
  section?: string;
  attendeesCount: number;
  attendeeNames?: string;
  externalOrganization?: string;
  confidential: boolean;
  equipmentRequested: string[];
  notes?: string;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
  checkedInAt?: string;
  endedAt?: string;
  cancellationReason?: string;
  recurrenceId?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'CANCEL' | 'CHECK_IN' | 'CHECK_OUT' | 'MAINTENANCE_TOGGLE' | 'SETTINGS_UPDATE' | 'EXCEPTION_UPDATE';
  entity: 'BOOKING' | 'ROOM' | 'DEPARTMENT' | 'SETTING' | 'USER';
  entityId: string;
  details: string;
  oldValue?: string;
  newValue?: string;
  timestamp: string;
}

export interface Holiday {
  id: string;
  nameAr: string;
  nameEn: string;
  date: string; // YYYY-MM-DD
  status: 'active' | 'inactive';
}

export interface AdminExceptionGrant {
  id: string;
  category: 'holiday' | 'after_hours' | 'duration' | 'weekend' | 'capacity' | 'all';
  title: string;
  reason: string;
  targetRoomId: 'all' | string;
  specificDate?: string;
  customStartTime?: string;
  customEndTime?: string;
  customMaxDurationMinutes?: number;
  approvedBy: string;
  isActive: boolean;
  createdAt: string;
}

export interface AdminExceptionsConfig {
  // 1. Holiday booking exceptions
  allowHolidayBookings: boolean;
  exemptedHolidays: string[]; // Holiday IDs allowed

  // 2. Outside operating hours exceptions
  allowAfterHoursBookings: boolean;
  extendedHoursStart: string; // e.g. "05:00"
  extendedHoursEnd: string; // e.g. "23:45"
  allow24Hours: boolean; // Full 24/7 booking allowed

  // 3. Meeting duration exceptions
  allowExtendedDuration: boolean;
  maxExtendedDurationMinutes: number; // e.g. 720 (12 hours) or 1440 (24 hours)
  bypassMinDuration: boolean; // Allow quick/emergency meetings < 30 mins

  // 4. All other disallowed exceptions
  allowWeekendBookings: boolean; // Allow bookings on Saturday and Sunday
  allowCapacityOverflow: boolean; // Allow bookings exceeding room seat capacity
  allowPastDateBookings: boolean; // Allow administrative documentation of past meetings
  bypassCheckInRequirement: boolean; // Disable auto-release for missed check-ins
  bypassMaxFutureDays: boolean; // Bypass 90-day booking horizon
  masterOverrideMode: boolean; // One-click master override: bypass ALL restrictions

  // Registered granular exception records
  exceptionGrants: AdminExceptionGrant[];
}

export interface SystemSettings {
  companyNameAr: string;
  companyNameEn: string;
  systemNameAr: string;
  systemNameEn: string;
  workingDays: number[]; // 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri (0=Sun, 6=Sat)
  timezone: string; // "Asia/Dubai"
  operatingHoursStart: string; // "07:30"
  operatingHoursEnd: string; // "18:00"
  minMeetingMinutes: number;
  maxMeetingMinutes: number;
  maxFutureBookingDays: number;
  autoReleaseMinutes: number;
  allowWeekendBookings: boolean;
  requireCheckIn: boolean;
  adminExceptions?: AdminExceptionsConfig;
}
