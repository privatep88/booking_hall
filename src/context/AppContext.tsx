import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  User,
  Department,
  Room,
  Booking,
  BookingStatus,
  SystemSettings,
  Holiday,
  AuditLog,
  UserRole,
  AdminExceptionsConfig,
  AdminExceptionGrant
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_DEPARTMENTS,
  INITIAL_ROOMS,
  INITIAL_BOOKINGS,
  INITIAL_SETTINGS,
  INITIAL_HOLIDAYS,
  INITIAL_AUDIT_LOGS
} from '../data/initialData';
import { validateBookingRequest } from '../services/bookingEngine';
import {
  generateBookingNumber,
  getActualCurrentDate,
  getActualCurrentTime,
  timeToMinutes,
  formatTimeRange12
} from '../utils/dateUtils';

function sanitizeForFirestore<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function persistToFirestore(
  collectionName: string,
  docId: string,
  data: unknown,
  op: OperationType = OperationType.WRITE
) {
  const path = `${collectionName}/${docId}`;
  setDoc(doc(db, collectionName, docId), sanitizeForFirestore(data)).catch((err) => {
    try {
      handleFirestoreError(err, op, path);
    } catch {
      // Logged by handleFirestoreError
    }
  });
}

function removeFromFirestore(collectionName: string, docId: string) {
  const path = `${collectionName}/${docId}`;
  deleteDoc(doc(db, collectionName, docId)).catch((err) => {
    try {
      handleFirestoreError(err, OperationType.DELETE, path);
    } catch {
      // Logged by handleFirestoreError
    }
  });
}

interface AppContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  currentUser: User;
  users: User[];
  departments: Department[];
  rooms: Room[];
  bookings: Booking[];
  settings: SystemSettings;
  holidays: Holiday[];
  auditLogs: AuditLog[];
  language: 'ar' | 'en';
  theme: 'light' | 'dark';
  currentDate: string;
  setCurrentUser: (user: User) => void;
  setLanguage: (lang: 'ar' | 'en') => void;
  setTheme: (theme: 'light' | 'dark') => void;
  createBooking: (
    data: Omit<Booking, 'id' | 'bookingNumber' | 'createdAt' | 'updatedAt' | 'status'> & {
      recurrenceType?: 'none' | 'daily' | 'weekly';
      recurrenceCount?: number;
    }
  ) => { success: boolean; booking?: Booking; errors?: string[]; conflictBooking?: Booking };
  updateBooking: (
    id: string,
    data: Partial<Booking>
  ) => { success: boolean; errors?: string[]; conflictBooking?: Booking };
  cancelBooking: (id: string, reason?: string) => void;
  deleteCancelledBooking: (id: string) => { success: boolean; message: string };
  deleteAllCancelledBookings: (roomId?: string) => { success: boolean; count: number; message: string };
  checkInBooking: (id: string) => void;
  checkOutBooking: (id: string) => void;
  toggleRoomMaintenance: (roomId: string, isMaintenance: boolean, reason?: string) => void;
  addRoom: (roomData: Omit<Room, 'id'>) => void;
  updateRoom: (roomId: string, data: Partial<Room>) => void;
  addDepartment: (deptData: Omit<Department, 'id'>) => void;
  updateDepartment: (deptId: string, data: Partial<Department>) => void;
  deleteDepartment: (deptId: string) => void;
  updateUserProfile: (data: Partial<Pick<User, 'email' | 'phone' | 'employeeId' | 'fullName' | 'departmentNameAr' | 'avatarUrl'>>) => void;
  addUser: (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateUser: (userId: string, data: Partial<User>) => void;
  deleteUser: (userId: string) => void;
  updateSettings: (newSettings: Partial<SystemSettings>) => void;
  addHoliday: (holiday: Omit<Holiday, 'id'>) => void;
  deleteHoliday: (id: string) => void;
  updateAdminExceptions: (updates: Partial<AdminExceptionsConfig>) => void;
  addExceptionGrant: (grant: Omit<AdminExceptionGrant, 'id' | 'createdAt'>) => void;
  deleteExceptionGrant: (id: string) => void;
  toggleExceptionGrant: (id: string) => void;
  toggleHolidayExemption: (holidayId: string) => void;
  clearAllBookings: () => void;
  clearAllLogs: () => void;
  clearAllRecords: () => void;
  resetAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  BOOKINGS: 'saaed_mr_bookings_v6_cleared_all',
  ROOMS: 'saaed_mr_rooms_v8_waha_equip',
  DEPARTMENTS: 'saaed_mr_departments_v6_facilities',
  USERS: 'saaed_mr_users_v8_hashemi_title',
  SETTINGS: 'saaed_mr_settings_v6_exceptions',
  LOGS: 'saaed_mr_logs_v6_cleared_all',
  HOLIDAYS: 'saaed_mr_holidays_v5_clean',
  LANG: 'saaed_mr_lang_v4_zeroed',
  THEME: 'saaed_mr_theme_v4_zeroed',
  AUTH: 'saaed_mr_auth_session_v1'
};

// Purge all old storage keys once on load to ensure completely clean system
if (typeof window !== 'undefined') {
  [
    'saaed_mr_bookings_v5_cleared_zero',
    'saaed_mr_bookings_v4_zeroed',
    'saaed_mr_bookings_v3',
    'saaed_mr_bookings_v2',
    'saaed_mr_bookings_v1',
    'saaed_mr_logs_v5_cleared_zero',
    'saaed_mr_logs_v4_zeroed',
    'saaed_mr_logs_v3',
    'saaed_mr_logs_v2',
    'saaed_mr_logs_v1',
    'saaed_mr_rooms_v7_equipment',
    'saaed_mr_rooms_v6_floor3',
    'saaed_mr_rooms_v5_clean',
    'saaed_mr_users_v7_manual_users',
    'saaed_mr_users_v6_only_hashemi',
    'saaed_mr_users_v5_hashemi',
    'saaed_mr_departments_v5_clean'
  ].forEach((k) => {
    localStorage.removeItem(k);
  });
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentDate, setCurrentDate] = useState<string>(() => getActualCurrentDate());

  const seededRef = useRef({
    rooms: false,
    departments: false,
    users: false,
    settings: false,
    holidays: false,
    bookings: false,
    logs: false
  });

  // Keep currentDate in sync with actual Dubai timezone clock
  useEffect(() => {
    const checkDate = () => {
      const today = getActualCurrentDate();
      if (today !== currentDate) {
        setCurrentDate(today);
      }
    };
    const interval = setInterval(checkDate, 60000);
    return () => clearInterval(interval);
  }, [currentDate]);

  // State with LocalStorage fallbacks - Khalid Al-Hashemi (Super Admin) + manually added users
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!saved) return INITIAL_USERS;
    try {
      const parsed: User[] = JSON.parse(saved);
      if (!Array.isArray(parsed) || parsed.length === 0) return INITIAL_USERS;
      const hashemi = parsed.find((u) => u.id === 'user-1');
      const otherUsers = parsed.filter((u) => u.id !== 'user-1');
      const activeHashemi: User = hashemi
        ? {
            ...hashemi,
            fullName: 'خالد الهاشمي',
            email: hashemi.email || 'hall@hall.ae',
            phone: hashemi.phone || '+971 50 123 4567',
            employeeId: hashemi.employeeId || 'SD-1001',
            departmentId: hashemi.departmentId || 'dept-serv',
            departmentNameAr: (!hashemi.departmentNameAr || hashemi.departmentNameAr === 'الإدارة العليا' || hashemi.departmentNameAr === 'إدارة الخدمات العامة - قسم إدارة المرافق')
              ? 'إدارة الخدمات العامة'
              : hashemi.departmentNameAr,
            role: 'super_admin' as UserRole
          }
        : INITIAL_USERS[0];
      return [activeHashemi, ...otherUsers];
    } catch {
      return INITIAL_USERS;
    }
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const found = users.find((u) => u.id === 'user-1');
    return found || users[0] || INITIAL_USERS[0];
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(STORAGE_KEYS.AUTH) === 'true';
  });

  const [departments, setDepartments] = useState<Department[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DEPARTMENTS);
    if (!saved) return INITIAL_DEPARTMENTS;
    try {
      const parsed: Department[] = JSON.parse(saved);
      const normalized = parsed.map((d) => {
        if (d.id === 'dept-serv' || d.nameAr === 'إدارة الخدمات العامة - قسم إدارة المرافق') {
          return {
            ...d,
            nameAr: 'إدارة الخدمات العامة',
            nameEn: 'General Services',
            code: d.code === 'GS-FM' ? 'GS' : (d.code || 'GS')
          };
        }
        return d;
      });
      const existingNames = new Set(normalized.map((d) => d.nameAr.trim()));
      const existingIds = new Set(normalized.map((d) => d.id));
      const missingInitial = INITIAL_DEPARTMENTS.filter(
        (initDept) => !existingIds.has(initDept.id) && !existingNames.has(initDept.nameAr.trim())
      );
      if (missingInitial.length > 0) {
        const otherIndex = normalized.findIndex((d) => d.id === 'dept-other');
        if (otherIndex !== -1) {
          const copy = [...normalized];
          copy.splice(otherIndex, 0, ...missingInitial);
          return copy;
        }
        return [...normalized, ...missingInitial];
      }
      return normalized;
    } catch {
      return INITIAL_DEPARTMENTS;
    }
  });

  const [rooms, setRooms] = useState<Room[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ROOMS);
    if (!saved) return INITIAL_ROOMS;
    try {
      const parsed: Room[] = JSON.parse(saved);
      return parsed.map((r) => {
        if (r.id === 'room-dana' || r.id === 'room-waha') {
          return {
            ...r,
            location: r.location || 'المقر الرئيسي - الطابق الثالث',
            floor: r.floor || 'الطابق 3',
            equipment:
              r.equipment && r.equipment.length > 0
                ? r.equipment
                : ['شاشة عرض', 'كراسي وطاولة اجتماعات', 'سبورة']
          };
        }
        return r;
      });
    } catch {
      return INITIAL_ROOMS;
    }
  });

  const [bookings, setBookings] = useState<Booking[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
    const rawBookings: Booking[] = saved ? JSON.parse(saved) : INITIAL_BOOKINGS;

    const today = getActualCurrentDate();
    const timeNow = getActualCurrentTime();
    const timeNowMin = timeToMinutes(timeNow);
    let hasChanges = false;

    const processed = rawBookings.map((b) => {
      if (b.status === 'confirmed' || b.status === 'pending') {
        const isPast =
          b.date < today ||
          (b.date === today && timeToMinutes(b.endTime) <= timeNowMin);
        if (isPast) {
          hasChanges = true;
          return {
            ...b,
            status: 'completed' as BookingStatus,
            endedAt: b.endedAt || `${b.date}T${b.endTime}:00`,
            updatedAt: b.updatedAt || new Date().toISOString()
          };
        }
      }
      return b;
    });

    if (hasChanges && saved) {
      try {
        localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(processed));
      } catch {
        // ignore
      }
    }

    return processed;
  });

  const [settings, setSettings] = useState<SystemSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!saved) return INITIAL_SETTINGS;
    try {
      const parsed = JSON.parse(saved);
      return {
        ...INITIAL_SETTINGS,
        ...parsed,
        adminExceptions: {
          ...INITIAL_SETTINGS.adminExceptions!,
          ...(parsed.adminExceptions || {})
        }
      };
    } catch {
      return INITIAL_SETTINGS;
    }
  });

  const [holidays, setHolidays] = useState<Holiday[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.HOLIDAYS);
    return saved ? JSON.parse(saved) : INITIAL_HOLIDAYS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LOGS);
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  const [language, setLanguageState] = useState<'ar' | 'en'>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LANG);
    return (saved as 'ar' | 'en') || 'ar';
  });

  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    return (saved as 'light' | 'dark') || 'light';
  });

  // Real-time Firebase Firestore Synchronization
  useEffect(() => {
    // 1. Rooms listener
    const unsubRooms = onSnapshot(
      collection(db, 'rooms'),
      (snapshot) => {
        if (snapshot.empty) {
          if (!seededRef.current.rooms) {
            seededRef.current.rooms = true;
            INITIAL_ROOMS.forEach((r) => {
              persistToFirestore('rooms', r.id, r, OperationType.CREATE);
            });
          }
          return;
        }
        seededRef.current.rooms = true;
        const loadedRooms = snapshot.docs.map((d) => d.data() as Room);
        // Sort so room-dana is first, room-waha is second, then others
        loadedRooms.sort((a, b) => {
          if (a.id === 'room-dana') return -1;
          if (b.id === 'room-dana') return 1;
          if (a.id === 'room-waha') return -1;
          if (b.id === 'room-waha') return 1;
          return a.id.localeCompare(b.id);
        });
        setRooms(loadedRooms);
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.LIST, 'rooms');
        } catch {
          // Handled
        }
      }
    );

    // 2. Departments listener
    const unsubDepts = onSnapshot(
      collection(db, 'departments'),
      (snapshot) => {
        if (snapshot.empty) {
          if (!seededRef.current.departments) {
            seededRef.current.departments = true;
            INITIAL_DEPARTMENTS.forEach((d) => {
              persistToFirestore('departments', d.id, d, OperationType.CREATE);
            });
          }
          return;
        }
        seededRef.current.departments = true;
        const loadedDepts = snapshot.docs.map((d) => d.data() as Department);
        const orderMap = new Map(INITIAL_DEPARTMENTS.map((d, idx) => [d.id, idx]));
        loadedDepts.sort((a, b) => {
          if (a.id === 'dept-other') return 1;
          if (b.id === 'dept-other') return -1;
          const idxA = orderMap.has(a.id) ? orderMap.get(a.id)! : 500;
          const idxB = orderMap.has(b.id) ? orderMap.get(b.id)! : 500;
          return idxA - idxB;
        });
        setDepartments(loadedDepts);
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.LIST, 'departments');
        } catch {
          // Handled
        }
      }
    );

    // 3. Users listener
    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        if (snapshot.empty) {
          if (!seededRef.current.users) {
            seededRef.current.users = true;
            users.forEach((u) => {
              persistToFirestore('users', u.id, u, OperationType.CREATE);
            });
          }
          return;
        }
        seededRef.current.users = true;
        const loadedUsers = snapshot.docs.map((d) => d.data() as User);
        const hashemi = loadedUsers.find((u) => u.id === 'user-1') || INITIAL_USERS[0];
        const others = loadedUsers.filter((u) => u.id !== 'user-1');
        const ordered = [hashemi, ...others];
        setUsers(ordered);
        setCurrentUser((prev) => {
          const updatedSelf = ordered.find((u) => u.id === prev.id);
          return updatedSelf || ordered[0];
        });
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.LIST, 'users');
        } catch {
          // Handled
        }
      }
    );

    // 4. Settings listener
    const unsubSettings = onSnapshot(
      doc(db, 'settings', 'global'),
      (docSnap) => {
        if (!docSnap.exists()) {
          if (!seededRef.current.settings) {
            seededRef.current.settings = true;
            persistToFirestore('settings', 'global', settings, OperationType.CREATE);
          }
          return;
        }
        seededRef.current.settings = true;
        const data = docSnap.data() as SystemSettings;
        setSettings({
          ...INITIAL_SETTINGS,
          ...data,
          adminExceptions: {
            ...INITIAL_SETTINGS.adminExceptions!,
            ...(data.adminExceptions || {})
          }
        });
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.GET, 'settings/global');
        } catch {
          // Handled
        }
      }
    );

    // 5. Holidays listener
    const unsubHolidays = onSnapshot(
      collection(db, 'holidays'),
      (snapshot) => {
        if (snapshot.empty) {
          if (!seededRef.current.holidays) {
            seededRef.current.holidays = true;
            INITIAL_HOLIDAYS.forEach((h) => {
              persistToFirestore('holidays', h.id, h, OperationType.CREATE);
            });
          }
          return;
        }
        seededRef.current.holidays = true;
        const loadedHolidays = snapshot.docs.map((d) => d.data() as Holiday);
        loadedHolidays.sort((a, b) => a.date.localeCompare(b.date));
        setHolidays(loadedHolidays);
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.LIST, 'holidays');
        } catch {
          // Handled
        }
      }
    );

    // 6. Bookings listener
    const unsubBookings = onSnapshot(
      collection(db, 'bookings'),
      (snapshot) => {
        seededRef.current.bookings = true;
        const loadedBookings = snapshot.docs.map((d) => d.data() as Booking);
        loadedBookings.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        setBookings(loadedBookings);
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.LIST, 'bookings');
        } catch {
          // Handled
        }
      }
    );

    // 7. AuditLogs listener
    const unsubLogs = onSnapshot(
      collection(db, 'auditLogs'),
      (snapshot) => {
        seededRef.current.logs = true;
        const loadedLogs = snapshot.docs.map((d) => d.data() as AuditLog);
        loadedLogs.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
        setAuditLogs(loadedLogs);
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.LIST, 'auditLogs');
        } catch {
          // Handled
        }
      }
    );

    return () => {
      unsubRooms();
      unsubDepts();
      unsubUsers();
      unsubSettings();
      unsubHolidays();
      unsubBookings();
      unsubLogs();
    };
  }, []);

  // Save changes to localStorage as local cache
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));
  }, [rooms]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(departments));
  }, [departments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HOLIDAYS, JSON.stringify(holidays));
  }, [holidays]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(auditLogs));
  }, [auditLogs]);

  const setLanguage = (lang: 'ar' | 'en') => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEYS.LANG, lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  };

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEYS.THEME, newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const logAudit = (
    action: AuditLog['action'],
    entity: AuditLog['entity'],
    entityId: string,
    details: string,
    oldValue?: string,
    newValue?: string
  ) => {
    const log: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId: currentUser.id,
      userName: currentUser.fullName,
      action,
      entity,
      entityId,
      details,
      oldValue,
      newValue,
      timestamp: new Date().toISOString()
    };
    setAuditLogs((prev) => [log, ...prev]);
    persistToFirestore('auditLogs', log.id, log, OperationType.CREATE);
  };

  // Auto-complete bookings when their actual scheduled end time has passed
  useEffect(() => {
    const checkAndCompletePastBookings = () => {
      const today = getActualCurrentDate();
      const timeNow = getActualCurrentTime();
      const timeNowMin = timeToMinutes(timeNow);
      const nowIso = new Date().toISOString();

      setBookings((prev) => {
        let hasChanges = false;
        const newlyCompleted: Booking[] = [];

        const updated = prev.map((b) => {
          if (b.status === 'confirmed' || b.status === 'pending') {
            const isPast =
              b.date < today ||
              (b.date === today && timeToMinutes(b.endTime) <= timeNowMin);

            if (isPast) {
              hasChanges = true;
              const completedBooking: Booking = {
                ...b,
                status: 'completed' as BookingStatus,
                endedAt: b.endedAt || `${b.date}T${b.endTime}:00`,
                updatedAt: nowIso
              };
              newlyCompleted.push(completedBooking);
              return completedBooking;
            }
          }
          return b;
        });

        if (hasChanges) {
          setTimeout(() => {
            newlyCompleted.forEach((cb) => {
              persistToFirestore('bookings', cb.id, cb, OperationType.UPDATE);
              logAudit(
                'CHECK_OUT',
                'BOOKING',
                cb.id,
                `تحول الحجز رقم (${cb.bookingNumber}) لقاعة "${cb.roomNameAr}" تلقائياً إلى حالة «مكتمل» لانتهاء وقت الحجز الفعلي (${formatTimeRange12(cb.startTime, cb.endTime, 'ar')})`
              );
            });
          }, 0);

          return updated;
        }

        return prev;
      });
    };

    checkAndCompletePastBookings();
    const interval = setInterval(checkAndCompletePastBookings, 10000);

    const handleVisibilityOrFocus = () => {
      checkAndCompletePastBookings();
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, [currentDate]);

  const createBooking = (
    data: Omit<Booking, 'id' | 'bookingNumber' | 'createdAt' | 'updatedAt' | 'status'> & {
      recurrenceType?: 'none' | 'daily' | 'weekly';
      recurrenceCount?: number;
    }
  ) => {
    const recurrenceType = data.recurrenceType || 'none';
    const recurrenceCount = data.recurrenceCount || 1;

    const targetDates: string[] = [data.date];
    if (recurrenceType !== 'none' && recurrenceCount > 1) {
      const [y, m, d] = data.date.split('-').map(Number);
      const baseDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));

      for (let i = 1; i < recurrenceCount; i++) {
        const nextDt = new Date(baseDate);
        if (recurrenceType === 'daily') {
          nextDt.setUTCDate(baseDate.getUTCDate() + i);
        } else if (recurrenceType === 'weekly') {
          nextDt.setUTCDate(baseDate.getUTCDate() + i * 7);
        }
        const isoStr = nextDt.toISOString().slice(0, 10);
        targetDates.push(isoStr);
      }
    }

    const allErrors: string[] = [];
    let conflictBooking: Booking | undefined;

    for (const dt of targetDates) {
      const validation = validateBookingRequest({
        roomId: data.roomId,
        date: dt,
        startTime: data.startTime,
        endTime: data.endTime,
        title: data.title,
        bookerName: data.bookerName,
        employeeId: data.employeeId,
        departmentId: data.departmentId,
        rooms,
        existingBookings: bookings,
        settings,
        holidays,
        currentDate,
        userRole: currentUser.role
      });

      if (!validation.isValid) {
        allErrors.push(
          targetDates.length > 1
            ? `[بتاريخ ${dt}]: ` + validation.errors.join(' | ')
            : validation.errors.join(' | ')
        );
        if (validation.conflictBooking && !conflictBooking) {
          conflictBooking = validation.conflictBooking;
        }
      }
    }

    if (allErrors.length > 0) {
      return { success: false, errors: allErrors, conflictBooking };
    }

    const newBookings: Booking[] = [];
    const recurrenceId = targetDates.length > 1 ? `rec-${Date.now()}` : undefined;
    const nowIso = new Date().toISOString();
    const today = getActualCurrentDate();
    const timeNow = getActualCurrentTime();
    const timeNowMin = timeToMinutes(timeNow);

    let countTracker = bookings.length;

    for (const dt of targetDates) {
      countTracker += 1;
      const bNumber = generateBookingNumber(countTracker, 2026);
      const room = rooms.find((r) => r.id === data.roomId);
      const dept = departments.find((d) => d.id === data.departmentId);

      const isPast =
        dt < today ||
        (dt === today && timeToMinutes(data.endTime) <= timeNowMin);

      const newBooking: Booking = {
        ...data,
        id: `b-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        bookingNumber: bNumber,
        roomId: data.roomId,
        roomNameAr: room ? room.nameAr : data.roomNameAr,
        roomNameEn: room ? room.nameEn : data.roomNameEn,
        departmentId: data.departmentId,
        departmentNameAr: dept ? dept.nameAr : data.departmentNameAr,
        departmentNameEn: dept ? dept.nameEn : data.departmentNameEn,
        date: dt,
        status: isPast ? 'completed' : 'confirmed',
        endedAt: isPast ? `${dt}T${data.endTime}:00` : undefined,
        createdAt: nowIso,
        updatedAt: nowIso,
        recurrenceId
      };

      newBookings.push(newBooking);
    }

    setBookings((prev) => [...newBookings, ...prev]);
    newBookings.forEach((nb) => {
      persistToFirestore('bookings', nb.id, nb, OperationType.CREATE);
    });

    logAudit(
      'CREATE',
      'BOOKING',
      newBookings[0].id,
      `تم إنشاء حجز جديد (${newBookings[0].bookingNumber}) لقاعة ${newBookings[0].roomNameAr}: "${data.title}" بواسطة ${data.bookerName} (${data.departmentNameAr})`
    );

    return { success: true, booking: newBookings[0] };
  };

  const updateBooking = (id: string, data: Partial<Booking>) => {
    const existing = bookings.find((b) => b.id === id);
    if (!existing) {
      return { success: false, errors: ['الحجز غير موجود.'] };
    }

    const merged = { ...existing, ...data };
    const validation = validateBookingRequest({
      roomId: merged.roomId,
      date: merged.date,
      startTime: merged.startTime,
      endTime: merged.endTime,
      title: merged.title,
      bookerName: merged.bookerName,
      employeeId: merged.employeeId,
      departmentId: merged.departmentId,
      rooms,
      existingBookings: bookings,
      settings,
      holidays,
      excludeBookingId: id,
      currentDate,
      userRole: currentUser.role,
      targetStatus: merged.status
    });

    if (!validation.isValid) {
      return { success: false, errors: validation.errors, conflictBooking: validation.conflictBooking };
    }

    const today = getActualCurrentDate();
    const timeNow = getActualCurrentTime();
    const isPast =
      merged.date < today ||
      (merged.date === today && timeToMinutes(merged.endTime) <= timeToMinutes(timeNow));

    let finalStatus = merged.status;
    if (merged.status === 'confirmed' && isPast) {
      finalStatus = 'completed';
    }

    const updatedBooking: Booking = {
      ...merged,
      status: finalStatus,
      endedAt:
        finalStatus === 'completed'
          ? merged.endedAt || `${merged.date}T${merged.endTime}:00`
          : merged.endedAt,
      updatedAt: new Date().toISOString()
    };

    setBookings((prev) => prev.map((b) => (b.id === id ? updatedBooking : b)));
    persistToFirestore('bookings', id, updatedBooking, OperationType.UPDATE);

    const wasCancelled = existing.status === 'cancelled';
    const isNowReactivated = wasCancelled && merged.status === 'confirmed';

    let auditMessage = `تم تحديث تفاصيل الحجز (${existing.bookingNumber}): "${existing.title}"`;
    if (isNowReactivated) {
      auditMessage = `قام مدير النظام (${currentUser.fullName}) بإعادة تنشيط وتأكيد الحجز الملغي رقم (${existing.bookingNumber}) لقاعة "${existing.roomNameAr}" وتحديث بياناته.`;
    } else if (wasCancelled) {
      auditMessage = `قام مدير النظام (${currentUser.fullName}) بتعديل بيانات الحجز الملغي رقم (${existing.bookingNumber}) مع الإبقاء على حالة الإلغاء.`;
    }

    logAudit('UPDATE', 'BOOKING', id, auditMessage);

    return { success: true };
  };

  const cancelBooking = (id: string, reason: string = 'تم الإلغاء من قبل المستخدم') => {
    const nowIso = new Date().toISOString();
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === id) {
          const cancelled: Booking = {
            ...b,
            status: 'cancelled',
            cancellationReason: reason,
            updatedAt: nowIso
          };
          persistToFirestore('bookings', id, cancelled, OperationType.UPDATE);
          return cancelled;
        }
        return b;
      })
    );

    const b = bookings.find((item) => item.id === id);
    if (b) {
      logAudit(
        'CANCEL',
        'BOOKING',
        id,
        `تم إلغاء الحجز (${b.bookingNumber}): "${b.title}" - سبب الإلغاء: ${reason}`
      );
    }
  };

  const deleteCancelledBooking = (id: string): { success: boolean; message: string } => {
    if (currentUser.role !== 'super_admin' && currentUser.role !== 'admin') {
      return {
        success: false,
        message: 'غير مصرح لك بحذف الحجوزات. هذه الصلاحية مخصصة لمدير عام النظام ومدير النظام (Admin) فقط.'
      };
    }

    const b = bookings.find((item) => item.id === id);
    if (!b) {
      return { success: false, message: 'الحجز المطلوب غير موجود في النظام.' };
    }

    if (b.status !== 'cancelled') {
      return {
        success: false,
        message: 'يمكن حذف الحجوزات الملغاة فقط. إذا كان الحجز نشطاً يجب إلغاؤه أولاً.'
      };
    }

    setBookings((prev) => prev.filter((item) => item.id !== id));
    removeFromFirestore('bookings', id);

    logAudit(
      'DELETE',
      'BOOKING',
      id,
      `قام مدير النظام (${currentUser.fullName}) بحذف الحجز الملغي رقم (${b.bookingNumber}) لقاعة "${b.roomNameAr}" موضوع "${b.title}" نهائياً من قاعدة البيانات.`
    );

    return {
      success: true,
      message: `تم حذف الحجز الملغي رقم (${b.bookingNumber}) نهائياً بنجاح.`
    };
  };

  const deleteAllCancelledBookings = (roomId?: string): { success: boolean; count: number; message: string } => {
    if (currentUser.role !== 'super_admin' && currentUser.role !== 'admin') {
      return {
        success: false,
        count: 0,
        message: 'غير مصرح لك بهذه العملية، مخصصة لمدير النظام (Admin).'
      };
    }

    const toDelete = bookings.filter(
      (b) => b.status === 'cancelled' && (!roomId || b.roomId === roomId)
    );

    if (toDelete.length === 0) {
      return {
        success: true,
        count: 0,
        message: 'لا توجد أي حجوزات ملغاة لحذفها في الوقت الحالي.'
      };
    }

    const idsToDelete = new Set(toDelete.map((b) => b.id));
    setBookings((prev) => prev.filter((b) => !idsToDelete.has(b.id)));
    toDelete.forEach((b) => removeFromFirestore('bookings', b.id));

    logAudit(
      'DELETE',
      'BOOKING',
      'BATCH',
      `قام مدير النظام (${currentUser.fullName}) بحذف جماعي لجميع الحجوزات الملغاة (${toDelete.length} حجز) ${roomId ? `في قاعة ${roomId === 'room-dana' ? 'الدانة' : 'الواحة'}` : 'في كامل النظام'} نهائياً.`
    );

    return {
      success: true,
      count: toDelete.length,
      message: `تم حذف جميع الحجوزات الملغاة (${toDelete.length} حجز) نهائياً بنجاح.`
    };
  };

  const checkInBooking = (id: string) => {
    const nowIso = new Date().toISOString();
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === id) {
          const updated = { ...b, checkedInAt: nowIso, updatedAt: nowIso };
          persistToFirestore('bookings', id, updated, OperationType.UPDATE);
          return updated;
        }
        return b;
      })
    );
    const b = bookings.find((item) => item.id === id);
    if (b) {
      logAudit(
        'CHECK_IN',
        'BOOKING',
        id,
        `تم تسجيل حضور الاجتماع (${b.bookingNumber}) في قاعة ${b.roomNameAr}`
      );
    }
  };

  const checkOutBooking = (id: string) => {
    const nowIso = new Date().toISOString();
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === id) {
          const updated: Booking = { ...b, endedAt: nowIso, status: 'completed', updatedAt: nowIso };
          persistToFirestore('bookings', id, updated, OperationType.UPDATE);
          return updated;
        }
        return b;
      })
    );
    const b = bookings.find((item) => item.id === id);
    if (b) {
      logAudit(
        'CHECK_OUT',
        'BOOKING',
        id,
        `تم إنهاء الاجتماع (${b.bookingNumber}) وإخلاء قاعة ${b.roomNameAr}`
      );
    }
  };

  const toggleRoomMaintenance = (roomId: string, isMaintenance: boolean, reason?: string) => {
    setRooms((prev) =>
      prev.map((r) => {
        if (r.id === roomId) {
          const updated: Room = {
            ...r,
            status: isMaintenance ? 'maintenance' : 'available',
            maintenanceReason: isMaintenance ? reason || 'أعمال صيانة دورية وتجهيز' : undefined
          };
          persistToFirestore('rooms', roomId, updated, OperationType.UPDATE);
          return updated;
        }
        return r;
      })
    );

    const target = rooms.find((r) => r.id === roomId);
    logAudit(
      'MAINTENANCE_TOGGLE',
      'ROOM',
      roomId,
      isMaintenance
        ? `تم إغلاق قاعة ${target?.nameAr} للصيانة: ${reason || 'صيانة دورية'}`
        : `تم إعادة فتح قاعة ${target?.nameAr} واستئناف الإتاحة للحجوزات`
    );
  };

  const addRoom = (roomData: Omit<Room, 'id'>) => {
    const newRoom: Room = {
      ...roomData,
      id: `room-${Date.now()}`
    };
    setRooms((prev) => [...prev, newRoom]);
    persistToFirestore('rooms', newRoom.id, newRoom, OperationType.CREATE);
    logAudit('CREATE', 'ROOM', newRoom.id, `تم إضافة قاعة جديدة في النظام: "${newRoom.nameAr}"`);
  };

  const updateRoom = (roomId: string, data: Partial<Room>) => {
    setRooms((prev) =>
      prev.map((r) => {
        if (r.id === roomId) {
          const updated = { ...r, ...data };
          persistToFirestore('rooms', roomId, updated, OperationType.UPDATE);
          return updated;
        }
        return r;
      })
    );
    logAudit('UPDATE', 'ROOM', roomId, `تم تحديث بيانات القاعة (${roomId})`);
  };

  const addDepartment = (deptData: Omit<Department, 'id'>) => {
    const newDept: Department = {
      ...deptData,
      id: `dept-${Date.now()}`
    };
    setDepartments((prev) => [...prev, newDept]);
    persistToFirestore('departments', newDept.id, newDept, OperationType.CREATE);
    logAudit('CREATE', 'DEPARTMENT', newDept.id, `تمت إضافة إدارة جديدة رسمياً في النظام: "${newDept.nameAr}" (${newDept.code})`);
  };

  const updateDepartment = (deptId: string, data: Partial<Department>) => {
    setDepartments((prev) =>
      prev.map((d) => {
        if (d.id === deptId) {
          const updated = { ...d, ...data };
          persistToFirestore('departments', deptId, updated, OperationType.UPDATE);
          return updated;
        }
        return d;
      })
    );
    const targetDept = departments.find((d) => d.id === deptId);
    if (targetDept) {
      logAudit('UPDATE', 'DEPARTMENT', deptId, `تم تحديث بيانات الإدارة: "${targetDept.nameAr}"`);
    }
  };

  const deleteDepartment = (deptId: string) => {
    const targetDept = departments.find((d) => d.id === deptId);
    setDepartments((prev) => prev.filter((d) => d.id !== deptId));
    removeFromFirestore('departments', deptId);
    if (targetDept) {
      logAudit('SETTINGS_UPDATE', 'DEPARTMENT', deptId, `تم حذف الإدارة من النظام: "${targetDept.nameAr}"`);
    }
  };

  const updateUserProfile = (data: Partial<Pick<User, 'email' | 'phone' | 'employeeId' | 'fullName' | 'departmentNameAr' | 'avatarUrl'>>) => {
    setCurrentUser((prev) => {
      const updated: User = {
        ...prev,
        ...data,
        updatedAt: new Date().toISOString()
      };
      persistToFirestore('users', updated.id, updated, OperationType.UPDATE);
      setUsers((prevUsers) => {
        const nextUsers = prevUsers.map((u) => (u.id === prev.id ? updated : u));
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(nextUsers));
        return nextUsers;
      });
      const photoNote = data.avatarUrl !== undefined ? ' (تم تعديل الصورة الشخصية يدوياً)' : '';
      logAudit(
        'SETTINGS_UPDATE',
        'USER',
        prev.id,
        `تم تحديث بيانات الملف الشخصي للمستخدم: ${updated.fullName}${photoNote} (المسمى: ${updated.departmentNameAr || ''}، البريد: ${updated.email}، الهاتف: ${updated.phone}، الرقم الوظيفي: ${updated.employeeId})`
      );
      return updated;
    });
  };

  const addUser = (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: now,
      updatedAt: now
    };
    persistToFirestore('users', newUser.id, newUser, OperationType.CREATE);
    setUsers((prev) => {
      const next = [...prev, newUser];
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(next));
      return next;
    });
    logAudit(
      'CREATE',
      'USER',
      newUser.id,
      `تمت إضافة مستخدم جديد يدوياً إلى النظام: "${newUser.fullName}" (${newUser.role}) برقم وظيفي: ${newUser.employeeId}`
    );
  };

  const updateUser = (userId: string, data: Partial<User>) => {
    const now = new Date().toISOString();
    setUsers((prev) => {
      const next = prev.map((u) => {
        if (u.id === userId) {
          const updated = { ...u, ...data, updatedAt: now };
          persistToFirestore('users', userId, updated, OperationType.UPDATE);
          return updated;
        }
        return u;
      });
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(next));
      return next;
    });
    if (currentUser.id === userId) {
      setCurrentUser((prev) => ({ ...prev, ...data, updatedAt: now }));
    }
    logAudit(
      'SETTINGS_UPDATE',
      'USER',
      userId,
      `تم تعديل بيانات المستخدم (${userId}) يدوياً`
    );
  };

  const deleteUser = (userId: string) => {
    if (userId === 'user-1') {
      return;
    }
    const target = users.find((u) => u.id === userId);
    removeFromFirestore('users', userId);
    setUsers((prev) => {
      const next = prev.filter((u) => u.id !== userId);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(next));
      return next;
    });
    if (currentUser.id === userId) {
      const fallback = users.find((u) => u.id === 'user-1') || INITIAL_USERS[0];
      setCurrentUser(fallback);
    }
    logAudit(
      'UPDATE',
      'USER',
      userId,
      `تم حذف المستخدم: "${target?.fullName || userId}" من النظام`
    );
  };

  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      persistToFirestore('settings', 'global', updated, OperationType.UPDATE);
      return updated;
    });
    logAudit('SETTINGS_UPDATE', 'SETTING', 'global', 'تم تحديث إعدادات النظام وسياسات الحجز');
  };

  const addHoliday = (hol: Omit<Holiday, 'id'>) => {
    const newHoliday: Holiday = {
      ...hol,
      id: `hol-${Date.now()}`
    };
    setHolidays((prev) => [...prev, newHoliday]);
    persistToFirestore('holidays', newHoliday.id, newHoliday, OperationType.CREATE);
  };

  const deleteHoliday = (id: string) => {
    setHolidays((prev) => prev.filter((h) => h.id !== id));
    removeFromFirestore('holidays', id);
  };

  const updateAdminExceptions = (updates: Partial<AdminExceptionsConfig>) => {
    setSettings((prev) => {
      const currentExc = prev.adminExceptions || INITIAL_SETTINGS.adminExceptions!;
      const updatedExc: AdminExceptionsConfig = {
        ...currentExc,
        ...updates
      };
      const updatedSettings: SystemSettings = {
        ...prev,
        adminExceptions: updatedExc
      };
      persistToFirestore('settings', 'global', updatedSettings, OperationType.UPDATE);
      return updatedSettings;
    });
    logAudit('EXCEPTION_UPDATE', 'SETTING', 'admin-exceptions', 'تم تعديل استثناءات وصلاحيات الإدارة لحجز القاعات');
  };

  const addExceptionGrant = (grant: Omit<AdminExceptionGrant, 'id' | 'createdAt'>) => {
    const newGrant: AdminExceptionGrant = {
      ...grant,
      id: `exc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString()
    };
    setSettings((prev) => {
      const currentExc = prev.adminExceptions || INITIAL_SETTINGS.adminExceptions!;
      const updatedSettings: SystemSettings = {
        ...prev,
        adminExceptions: {
          ...currentExc,
          exceptionGrants: [newGrant, ...(currentExc.exceptionGrants || [])]
        }
      };
      persistToFirestore('settings', 'global', updatedSettings, OperationType.UPDATE);
      return updatedSettings;
    });
    logAudit('EXCEPTION_UPDATE', 'SETTING', newGrant.id, `تم إضافة استثناء إداري جديد: "${newGrant.title}"`);
  };

  const deleteExceptionGrant = (id: string) => {
    setSettings((prev) => {
      const currentExc = prev.adminExceptions || INITIAL_SETTINGS.adminExceptions!;
      const updatedSettings: SystemSettings = {
        ...prev,
        adminExceptions: {
          ...currentExc,
          exceptionGrants: (currentExc.exceptionGrants || []).filter((g) => g.id !== id)
        }
      };
      persistToFirestore('settings', 'global', updatedSettings, OperationType.UPDATE);
      return updatedSettings;
    });
    logAudit('EXCEPTION_UPDATE', 'SETTING', id, `تم حذف الاستثناء الإداري (${id})`);
  };

  const toggleExceptionGrant = (id: string) => {
    setSettings((prev) => {
      const currentExc = prev.adminExceptions || INITIAL_SETTINGS.adminExceptions!;
      const updatedSettings: SystemSettings = {
        ...prev,
        adminExceptions: {
          ...currentExc,
          exceptionGrants: (currentExc.exceptionGrants || []).map((g) =>
            g.id === id ? { ...g, isActive: !g.isActive } : g
          )
        }
      };
      persistToFirestore('settings', 'global', updatedSettings, OperationType.UPDATE);
      return updatedSettings;
    });
  };

  const toggleHolidayExemption = (holidayId: string) => {
    setSettings((prev) => {
      const currentExc = prev.adminExceptions || INITIAL_SETTINGS.adminExceptions!;
      const currentList = currentExc.exemptedHolidays || [];
      const updatedList = currentList.includes(holidayId)
        ? currentList.filter((h) => h !== holidayId)
        : [...currentList, holidayId];
      const updatedSettings: SystemSettings = {
        ...prev,
        adminExceptions: {
          ...currentExc,
          exemptedHolidays: updatedList
        }
      };
      persistToFirestore('settings', 'global', updatedSettings, OperationType.UPDATE);
      return updatedSettings;
    });
  };

  const clearAllBookings = () => {
    const currentIds = bookings.map((b) => b.id);
    setBookings([]);
    localStorage.removeItem(STORAGE_KEYS.BOOKINGS);
    currentIds.forEach((id) => removeFromFirestore('bookings', id));
  };

  const clearAllLogs = () => {
    const currentIds = auditLogs.map((l) => l.id);
    setAuditLogs([]);
    localStorage.removeItem(STORAGE_KEYS.LOGS);
    currentIds.forEach((id) => removeFromFirestore('auditLogs', id));
  };

  const clearAllRecords = () => {
    const bookingIds = bookings.map((b) => b.id);
    const logIds = auditLogs.map((l) => l.id);
    setBookings([]);
    setAuditLogs([]);
    setSettings((prev) => {
      const updatedSettings: SystemSettings = {
        ...prev,
        adminExceptions: prev.adminExceptions
          ? {
              ...prev.adminExceptions,
              exceptionGrants: []
            }
          : undefined
      };
      persistToFirestore('settings', 'global', updatedSettings, OperationType.UPDATE);
      return updatedSettings;
    });
    localStorage.removeItem(STORAGE_KEYS.BOOKINGS);
    localStorage.removeItem(STORAGE_KEYS.LOGS);
    bookingIds.forEach((id) => removeFromFirestore('bookings', id));
    logIds.forEach((id) => removeFromFirestore('auditLogs', id));
  };

  const resetAllData = () => {
    const bookingIds = bookings.map((b) => b.id);
    const logIds = auditLogs.map((l) => l.id);

    setBookings([]);
    setRooms(INITIAL_ROOMS);
    setDepartments(INITIAL_DEPARTMENTS);
    setSettings(INITIAL_SETTINGS);
    setHolidays(INITIAL_HOLIDAYS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    localStorage.clear();

    const batch = writeBatch(db);
    bookingIds.forEach((id) => batch.delete(doc(db, 'bookings', id)));
    logIds.forEach((id) => batch.delete(doc(db, 'auditLogs', id)));
    INITIAL_ROOMS.forEach((r) => batch.set(doc(db, 'rooms', r.id), sanitizeForFirestore(r)));
    INITIAL_DEPARTMENTS.forEach((d) => batch.set(doc(db, 'departments', d.id), sanitizeForFirestore(d)));
    INITIAL_HOLIDAYS.forEach((h) => batch.set(doc(db, 'holidays', h.id), sanitizeForFirestore(h)));
    batch.set(doc(db, 'settings', 'global'), sanitizeForFirestore(INITIAL_SETTINGS));
    batch.commit().catch((err) => {
      try {
        handleFirestoreError(err, OperationType.WRITE, 'batch-reset');
      } catch {
        // Handled
      }
    });
  };

  const login = (usernameInput: string, passwordInput: string): { success: boolean; error?: string } => {
    const cleanUser = usernameInput.trim();
    const cleanPass = passwordInput.trim();

    if (!cleanUser || !cleanPass) {
      return {
        success: false,
        error: 'يرجى إدخال اسم المستخدم وكلمة المرور للمتابعة.'
      };
    }

    if (cleanUser !== 'user' || cleanPass !== 'user') {
      return {
        success: false,
        error: 'اسم المستخدم أو كلمة المرور غير صحيحة. يرجى التحقق والمحاولة مرة أخرى.'
      };
    }

    const targetUser = users.find((u) => u.id === 'user-1') || users[0] || INITIAL_USERS[0];
    setCurrentUser(targetUser);
    setIsAuthenticated(true);
    sessionStorage.setItem(STORAGE_KEYS.AUTH, 'true');

    return { success: true };
  };

  const logout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem(STORAGE_KEYS.AUTH);
  };

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        login,
        logout,
        currentUser,
        users,
        departments,
        rooms,
        bookings,
        settings,
        holidays,
        auditLogs,
        language,
        theme,
        currentDate,
        setCurrentUser,
        setLanguage,
        setTheme,
        createBooking,
        updateBooking,
        cancelBooking,
        deleteCancelledBooking,
        deleteAllCancelledBookings,
        checkInBooking,
        checkOutBooking,
        toggleRoomMaintenance,
        addRoom,
        updateRoom,
        addDepartment,
        updateDepartment,
        deleteDepartment,
        updateUserProfile,
        addUser,
        updateUser,
        deleteUser,
        updateSettings,
        addHoliday,
        deleteHoliday,
        updateAdminExceptions,
        addExceptionGrant,
        deleteExceptionGrant,
        toggleExceptionGrant,
        toggleHolidayExemption,
        clearAllBookings,
        clearAllLogs,
        clearAllRecords,
        resetAllData
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
