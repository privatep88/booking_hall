import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Booking } from '../types';
import {
  DoorOpen,
  Users,
  Clock,
  Calendar,
  CalendarDays,
  CalendarPlus,
  PlusCircle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Wrench,
  Tv,
  QrCode,
  Search,
  Eye,
  Edit3,
  Building2,
  TrendingUp,
  Lock,
  X,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Wifi,
  Monitor,
  Volume2,
  Video,
  Settings,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
  Layers,
  Check,
  BarChart3,
  Square
} from 'lucide-react';
import { calculateRoomDetailedStats } from '../services/analyticsService';
import {
  formatDateAr,
  getActualCurrentTime,
  formatTimeRange12,
  timeToMinutes
} from '../utils/dateUtils';
import heroWahaImg from '../assets/images/hero_conference_room_waha_1793953314083.jpg';
import heroCleanImg from '../assets/images/hero_conference_room_clean_1793953313123.jpg';

interface SingleRoomViewProps {
  roomId: string;
  onOpenNewBooking: (roomId: string, date?: string, startTime?: string) => void;
  onSelectBooking: (booking: Booking) => void;
  onEditBooking: (booking: Booking) => void;
  onViewStats: (roomId: string) => void;
  onOpenKiosk: (roomId: string) => void;
  onNavigateToCalendar: () => void;
}

const HERO_SLIDES = [
  {
    image: heroWahaImg,
    tvBox: { x: 606, y: 277, width: 191, height: 114 },
    logoBox: { x: 626, y: 293, width: 151, height: 82 }
  },
  {
    image: heroCleanImg,
    tvBox: { x: 578, y: 265, width: 224, height: 130 },
    logoBox: { x: 604, y: 283, width: 172, height: 94 }
  },
  {
    image: heroWahaImg,
    tvBox: { x: 606, y: 277, width: 191, height: 114 },
    logoBox: { x: 626, y: 293, width: 151, height: 82 }
  }
];

export const SingleRoomView: React.FC<SingleRoomViewProps> = ({
  roomId,
  onOpenNewBooking,
  onSelectBooking,
  onEditBooking,
  onViewStats,
  onOpenKiosk,
  onNavigateToCalendar
}) => {
  const {
    rooms,
    bookings,
    currentUser,
    toggleRoomMaintenance,
    updateRoom,
    cancelBooking,
    deleteCancelledBooking,
    deleteAllCancelledBookings,
    checkInBooking,
    checkOutBooking,
    currentDate,
    language
  } = useApp();

  // Find target room (defaults to first room if not found)
  const room = rooms.find((r) => r.id === roomId) || rooms[0];

  // Hero slide index
  const [heroSlideIdx, setHeroSlideIdx] = useState<number>(roomId === 'room-waha' ? 1 : 0);

  useEffect(() => {
    setHeroSlideIdx(roomId === 'room-waha' ? 1 : 0);
  }, [roomId]);

  const activeSlide = HERO_SLIDES[heroSlideIdx % HERO_SLIDES.length];

  // Modals state
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [maintenanceReason, setMaintenanceReason] = useState('أعمال صيانة وتجهيز تقني دوري');
  const [showQrModal, setShowQrModal] = useState(false);
  const [cancelModalBooking, setCancelModalBooking] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState('إلغاء بناءً على طلب الإدارة المنظمة');
  const [deleteModalBooking, setDeleteModalBooking] = useState<Booking | null>(null);
  const [showDeleteAllCancelledModal, setShowDeleteAllCancelledModal] = useState(false);
  const [actionFeedbackMsg, setActionFeedbackMsg] = useState<string | null>(null);

  // Bookings list filters
  const [filterTab, setFilterTab] = useState<'all' | 'today' | 'upcoming' | 'past' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDateFilter, setSelectedDateFilter] = useState('');

  // Bookings list sorting
  const [sortField, setSortField] = useState<
    'date' | 'time' | 'bookingNumber' | 'title' | 'department' | 'booker' | 'status' | 'duration'
  >('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSortToggle = (
    field: 'date' | 'time' | 'bookingNumber' | 'title' | 'department' | 'booker' | 'status' | 'duration'
  ) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'date' || field === 'bookingNumber' ? 'desc' : 'asc');
    }
  };

  const canManage =
    currentUser.role === 'super_admin' || currentUser.role === 'admin';

  // Manual Room Specifications Editing (strictly for Super Admin and Admin / General Manager)
  const canEditSpecs =
    currentUser.role === 'super_admin' || currentUser.role === 'admin';

  const parseRoomTechItems = (
    eqList?: string[]
  ): { name: string; available: boolean }[] => {
    const raw = (eqList || []).filter(
      (item) =>
        !['كراسي وطاولة اجتماعات', 'سبورة', 'لوحة بيضاء'].includes(item)
    );
    const defaultFour = ['شبكة إنترنت', 'شاشة عرض', 'نظام صوتي', 'كاميرا فيديو'];

    const isUnmodifiedInitial =
      !eqList ||
      eqList.length === 0 ||
      (eqList.length === 3 &&
        eqList.includes('شاشة عرض') &&
        eqList.includes('كراسي وطاولة اجتماعات') &&
        eqList.includes('سبورة'));

    if (isUnmodifiedInitial) {
      return defaultFour.map((name) => ({ name, available: true }));
    }

    const hasEncodedPrefix = raw.some(
      (item) => item.startsWith('!') || item.startsWith('+')
    );

    if (hasEncodedPrefix) {
      return raw.map((item) => {
        if (item.startsWith('!')) {
          return { name: item.slice(1), available: false };
        }
        if (item.startsWith('+')) {
          return { name: item.slice(1), available: true };
        }
        return { name: item, available: true };
      });
    }

    // Legacy customized array without prefix markers
    const result: { name: string; available: boolean }[] = defaultFour.map(
      (stdName) => ({
        name: stdName,
        available: raw.includes(stdName)
      })
    );

    raw.forEach((customItem) => {
      if (!defaultFour.includes(customItem)) {
        result.push({ name: customItem, available: true });
      }
    });

    return result;
  };

  const serializeTechItems = (
    items: { name: string; available: boolean }[]
  ): string[] => {
    return items
      .filter((item) => item.name.trim() !== '')
      .map((item) =>
        item.available ? `+${item.name.trim()}` : `!${item.name.trim()}`
      );
  };

  const getTechItemIcon = (name: string, index: number) => {
    const lower = name.toLowerCase();
    if (
      lower.includes('إنترنت') ||
      lower.includes('انترنت') ||
      lower.includes('واي فاي') ||
      lower.includes('wifi') ||
      lower.includes('شبكة')
    ) {
      return Wifi;
    }
    if (
      lower.includes('شاشة') ||
      lower.includes('عرض') ||
      lower.includes('تلفاز') ||
      lower.includes('screen') ||
      lower.includes('monitor')
    ) {
      return Monitor;
    }
    if (
      lower.includes('صوت') ||
      lower.includes('سماعات') ||
      lower.includes('ميكروفون') ||
      lower.includes('مايك') ||
      lower.includes('audio') ||
      lower.includes('sound')
    ) {
      return Volume2;
    }
    if (
      lower.includes('كاميرا') ||
      lower.includes('فيديو') ||
      lower.includes('مرئي') ||
      lower.includes('video') ||
      lower.includes('camera')
    ) {
      return Video;
    }
    const fallbackIcons = [Wifi, Monitor, Volume2, Video];
    return index < 4 ? fallbackIcons[index] : CheckCircle2;
  };

  const techItems = useMemo(
    () => parseRoomTechItems(room.equipment),
    [room.equipment]
  );

  const [isEditingSpecs, setIsEditingSpecs] = useState(false);
  const [editLocation, setEditLocation] = useState(room.location);
  const [editFloor, setEditFloor] = useState(room.floor);
  const [editCapacity, setEditCapacity] = useState(
    room.capacity === 'غير محدد' ? '20' : String(room.capacity)
  );
  const [editOperatingStart, setEditOperatingStart] = useState(room.operatingHours?.start || '07:30');
  const [editOperatingEnd, setEditOperatingEnd] = useState(room.operatingHours?.end || '18:00');
  const [editTechItems, setEditTechItems] = useState<
    { name: string; available: boolean }[]
  >(() => parseRoomTechItems(room.equipment));
  const [newEquipmentInput, setNewEquipmentInput] = useState('');
  const [specsSaveSuccess, setSpecsSaveSuccess] = useState(false);
  const [specsValidationError, setSpecsValidationError] = useState<string | null>(null);

  // Sync edit state when room changes (e.g. switching between Al Dana and Al Waha)
  useEffect(() => {
    setIsEditingSpecs(false);
    setSpecsValidationError(null);
    setEditLocation(room.location);
    setEditFloor(room.floor);
    setEditCapacity(room.capacity === 'غير محدد' ? '20' : String(room.capacity));
    setEditOperatingStart(room.operatingHours?.start || '07:30');
    setEditOperatingEnd(room.operatingHours?.end || '18:00');
    setEditTechItems(parseRoomTechItems(room.equipment));
    setNewEquipmentInput('');
  }, [room.id, room.location, room.floor, room.capacity, room.operatingHours?.start, room.operatingHours?.end, room.equipment]);

  const handleStartEditSpecs = () => {
    if (!canEditSpecs) return;
    setSpecsValidationError(null);
    setEditLocation(room.location);
    setEditFloor(room.floor);
    setEditCapacity(room.capacity === 'غير محدد' ? '20' : String(room.capacity));
    setEditOperatingStart(room.operatingHours?.start || '07:30');
    setEditOperatingEnd(room.operatingHours?.end || '18:00');
    setEditTechItems(parseRoomTechItems(room.equipment).map((i) => ({ ...i })));
    setNewEquipmentInput('');
    setIsEditingSpecs(true);
  };

  const handleCancelEditSpecs = () => {
    setIsEditingSpecs(false);
    setSpecsValidationError(null);
    setEditLocation(room.location);
    setEditFloor(room.floor);
    setEditCapacity(room.capacity === 'غير محدد' ? '20' : String(room.capacity));
    setEditOperatingStart(room.operatingHours?.start || '07:30');
    setEditOperatingEnd(room.operatingHours?.end || '18:00');
    setEditTechItems(parseRoomTechItems(room.equipment).map((i) => ({ ...i })));
    setNewEquipmentInput('');
  };

  const handleTechItemNameChange = (index: number, newName: string) => {
    setEditTechItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, name: newName } : item))
    );
  };

  const handleTechItemToggleAvailable = (index: number) => {
    setEditTechItems((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, available: !item.available } : item
      )
    );
  };

  const handleQuickToggleTechCard = (index: number) => {
    if (!canEditSpecs) return;
    const updated = techItems.map((item, idx) =>
      idx === index ? { ...item, available: !item.available } : item
    );
    updateRoom(room.id, {
      equipment: serializeTechItems(updated)
    });
  };

  const handleAddEquipment = () => {
    const trimmed = newEquipmentInput.trim();
    if (trimmed) {
      setEditTechItems((prev) => [...prev, { name: trimmed, available: true }]);
      setNewEquipmentInput('');
    } else {
      setEditTechItems((prev) => [
        ...prev,
        {
          name: language === 'ar' ? `تجهيز تقني ${prev.length + 1}` : `Equipment ${prev.length + 1}`,
          available: true
        }
      ]);
    }
  };

  const handleRemoveEquipment = (indexToRemove: number) => {
    setEditTechItems((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSaveSpecs = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!canEditSpecs) return;

    if (!editCapacity.trim()) {
      setSpecsValidationError('يرجى إدخال السعة الاستيعابية للقاعة.');
      return;
    }
    if (!editFloor.trim()) {
      setSpecsValidationError('يرجى إدخال رقم أو اسم الطابق.');
      return;
    }
    if (timeToMinutes(editOperatingEnd) <= timeToMinutes(editOperatingStart)) {
      setSpecsValidationError('يجب أن يكون وقت انتهاء العمل الرسمي بعد وقت البداية.');
      return;
    }

    const validTechItems = editTechItems.filter((item) => item.name.trim() !== '');
    if (validTechItems.length === 0) {
      setSpecsValidationError('يرجى الإبقاء على تجهيز تقني واحد على الأقل.');
      return;
    }

    setSpecsValidationError(null);

    let parsedCapacity: number | 'غير محدد' = 'غير محدد';
    const num = Number(editCapacity.trim());
    if (!isNaN(num) && num > 0) {
      parsedCapacity = num;
    } else if (editCapacity.trim() !== '') {
      parsedCapacity = editCapacity.trim() as any;
    }

    updateRoom(room.id, {
      location: editLocation.trim() || room.location,
      floor: editFloor.trim() || room.floor,
      capacity: parsedCapacity,
      operatingHours: {
        start: editOperatingStart || '07:30',
        end: editOperatingEnd || '18:00'
      },
      equipment: serializeTechItems(validTechItems)
    });

    setIsEditingSpecs(false);
    setSpecsSaveSuccess(true);
    setTimeout(() => setSpecsSaveSuccess(false), 3500);
  };

  // Current real-time clock in Dubai
  const liveDubaiTime = getActualCurrentTime();
  const currentMinutes = timeToMinutes(liveDubaiTime);

  // All bookings for THIS specific room
  const roomAllBookings = useMemo(() => {
    return bookings
      .filter((b) => b.roomId === room.id)
      .sort((a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime));
  }, [bookings, room.id]);

  // Check if room is currently in an active meeting today
  const activeMeetingNow = useMemo(() => {
    if (room.status === 'maintenance') return null;
    return roomAllBookings.find((b) => {
      if (b.date !== currentDate) return false;
      if (b.status === 'cancelled' || b.status === 'rejected') return false;
      const sMin = timeToMinutes(b.startTime);
      const eMin = timeToMinutes(b.endTime);
      return currentMinutes >= sMin && currentMinutes < eMin;
    });
  }, [roomAllBookings, room.status, currentDate, currentMinutes]);

  // Room statistics calculated dynamically
  const roomStats = useMemo(() => {
    return calculateRoomDetailedStats(room.id, bookings, room);
  }, [room.id, bookings, room]);

  // Past/completed count in this room
  const pastCountInRoom = useMemo(() => {
    return roomAllBookings.filter((b) => {
      if (b.status === 'cancelled') return false;
      return (
        b.status === 'completed' ||
        b.date < currentDate ||
        (b.date === currentDate && timeToMinutes(b.endTime) <= currentMinutes)
      );
    }).length;
  }, [roomAllBookings, currentDate, currentMinutes]);

  const cancelledCountInRoom = useMemo(() => {
    return roomAllBookings.filter((b) => b.status === 'cancelled').length;
  }, [roomAllBookings]);

  // Filtered and sorted bookings according to UI controls
  const displayedBookings = useMemo(() => {
    const filtered = roomAllBookings.filter((b) => {
      // Tab filter
      if (filterTab === 'today') {
        if (b.date !== currentDate) return false;
      } else if (filterTab === 'upcoming') {
        if (
          b.date < currentDate ||
          b.status === 'cancelled' ||
          b.status === 'completed' ||
          (b.date === currentDate && timeToMinutes(b.endTime) <= currentMinutes)
        )
          return false;
      } else if (filterTab === 'past') {
        if (b.status === 'cancelled') return false;
        if (
          b.status !== 'completed' &&
          (b.date > currentDate || (b.date === currentDate && timeToMinutes(b.endTime) > currentMinutes))
        )
          return false;
      } else if (filterTab === 'cancelled') {
        if (b.status !== 'cancelled') return false;
      }

      // Date picker filter
      if (selectedDateFilter && b.date !== selectedDateFilter) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = b.title?.toLowerCase().includes(q);
        const matchNumber = b.bookingNumber?.toLowerCase().includes(q);
        const matchDept = b.departmentNameAr?.toLowerCase().includes(q);
        const matchBooker = b.bookerName?.toLowerCase().includes(q);
        if (!matchTitle && !matchNumber && !matchDept && !matchBooker) {
          return false;
        }
      }

      return true;
    });

    return filtered.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'date':
          cmp = a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime);
          break;
        case 'time':
          cmp = a.startTime.localeCompare(b.startTime) || a.date.localeCompare(b.date);
          break;
        case 'bookingNumber':
          cmp = a.bookingNumber.localeCompare(b.bookingNumber);
          break;
        case 'title':
          cmp = (a.title || '').localeCompare(b.title || '', 'ar');
          break;
        case 'department':
          cmp = (a.departmentNameAr || '').localeCompare(b.departmentNameAr || '', 'ar');
          break;
        case 'booker':
          cmp = (a.bookerName || '').localeCompare(b.bookerName || '', 'ar');
          break;
        case 'status':
          cmp = (a.status || '').localeCompare(b.status || '');
          break;
        case 'duration':
          cmp = (a.durationMinutes || 0) - (b.durationMinutes || 0);
          break;
        default:
          cmp = a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime);
      }
      return sortDirection === 'desc' ? -cmp : cmp;
    });
  }, [roomAllBookings, filterTab, selectedDateFilter, searchQuery, sortField, sortDirection, currentDate, currentMinutes]);

  const handleMaintenanceToggle = () => {
    const isCurrentlyMaint = room.status === 'maintenance';
    toggleRoomMaintenance(room.id, !isCurrentlyMaint, maintenanceReason);
    setShowMaintenanceModal(false);
  };

  const handleConfirmCancel = () => {
    if (cancelModalBooking) {
      cancelBooking(cancelModalBooking.id, cancelReason);
      setCancelModalBooking(null);
    }
  };

  const handleConfirmDeleteSingle = () => {
    if (deleteModalBooking) {
      const res = deleteCancelledBooking(deleteModalBooking.id);
      setActionFeedbackMsg(res.message);
      setDeleteModalBooking(null);
      setTimeout(() => setActionFeedbackMsg(null), 3500);
    }
  };

  const handleConfirmDeleteAllCancelled = () => {
    const res = deleteAllCancelledBookings(room.id);
    setActionFeedbackMsg(res.message);
    setShowDeleteAllCancelledModal(false);
    setTimeout(() => setActionFeedbackMsg(null), 3500);
  };

  const displayCapacityNumber =
    typeof room.capacity === 'number'
      ? room.capacity
      : room.capacity === 'غير محدد'
      ? 20
      : room.capacity;

  const displayFloorNumber = room.floor.replace('الطابق', '').trim() || '3';

  return (
    <div className="animate-in fade-in pb-6">
      
      {/* =====================================================================
          1. CINEMATIC MEETING ROOM HERO BANNER (Full-Width Reference Match)
         ===================================================================== */}
      <section className="relative w-full h-[270px] sm:h-[300px] lg:h-[320px] bg-[#081529] overflow-hidden border-b border-slate-300/70 select-none">
        
        {/* SVG Coordinate-Locked Room Photo + Television Screen with Original SAAED Logo */}
        <svg
          viewBox="0 190 1376 365"
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 w-full h-full pointer-events-none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="tvScreenBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#081a3e" />
              <stop offset="50%" stopColor="#06132c" />
              <stop offset="100%" stopColor="#040d21" />
            </linearGradient>
            <linearGradient id="tvGlassSheen" x1="0%" y1="0%" x2="70%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.09" />
              <stop offset="45%" stopColor="#38bdf8" stopOpacity="0.03" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* High-Resolution Executive Conference Room Photograph */}
          <image
            href={activeSlide.image}
            x="0"
            y="0"
            width="1376"
            height="768"
            preserveAspectRatio="xMidYMid slice"
          />

          {/* Television Screen Dark Navy Surface inside the TV Bezel */}
          <rect
            x={activeSlide.tvBox.x}
            y={activeSlide.tvBox.y}
            width={activeSlide.tvBox.width}
            height={activeSlide.tvBox.height}
            rx="2"
            fill="url(#tvScreenBg)"
            stroke="#0f2342"
            strokeWidth="1.5"
          />

          {/* Original Attached SAAED Logo Centered Inside the Television Screen */}
          <image
            href={`${import.meta.env.BASE_URL || '/'}assets/aistudio/logo_1afd1154.png`}
            x={activeSlide.logoBox.x}
            y={activeSlide.logoBox.y}
            width={activeSlide.logoBox.width}
            height={activeSlide.logoBox.height}
            preserveAspectRatio="xMidYMid meet"
          />

          {/* Realistic Television Screen Glass Reflection Overlay */}
          <rect
            x={activeSlide.tvBox.x}
            y={activeSlide.tvBox.y}
            width={activeSlide.tvBox.width}
            height={activeSlide.tvBox.height}
            rx="2"
            fill="url(#tvGlassSheen)"
          />
        </svg>

        {/* Left-Side Dark Navy Gradient Scrim for Maximum Text Legibility */}
        <div
          className="absolute inset-y-0 left-0 w-full sm:w-[68%] lg:w-[52%] pointer-events-none"
          style={{
            background:
              'linear-gradient(90deg, rgba(6, 17, 38, 0.92) 0%, rgba(8, 22, 48, 0.78) 55%, rgba(8, 22, 48, 0.25) 82%, rgba(8, 22, 48, 0) 100%)'
          }}
        />

        {/* Subtle Bottom Vignette */}
        <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#061126]/55 to-transparent pointer-events-none" />

        {/* Hero Foreground Container */}
        <div className="relative z-10 max-w-[1400px] mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-between py-5 sm:py-6">
          
          {/* Top Bar inside Hero: Auxiliary Room Tools on Right (RTL) & Code Pill on Left */}
          <div className="w-full flex items-start justify-between gap-4" dir="ltr">
            
            {/* Left Side Hero Content Block (matches Reference Image position on the left of the hero banner) */}
            <div className="flex flex-col items-start text-left max-w-md space-y-2 select-text">
              
              {/* Room Code Pill */}
              <span className="inline-flex items-center px-3 py-0.5 rounded-full bg-[#1e3a8a]/85 border border-blue-400/40 text-blue-100 font-mono text-[11px] font-bold tracking-wider shadow-xs backdrop-blur-xs">
                {room.code}
              </span>

              {/* Room Title (Arabic & English) */}
              <div className="space-y-0.5">
                <h2 className="text-2xl sm:text-[34px] font-black text-white leading-tight tracking-tight drop-shadow-xs" dir="rtl">
                  {language === 'ar' ? `قاعة ${room.nameAr}` : `${room.nameEn} Hall`}
                </h2>
                <p className="text-sm sm:text-[19px] font-extrabold text-white/95 tracking-tight leading-snug">
                  {room.id === 'room-dana' ? 'Al Dana Meeting Room' : 'Al Waha Meeting Room'}
                </p>
              </div>

              {/* Room Description */}
              <p className="text-xs sm:text-[13px] text-slate-200/95 font-medium leading-relaxed line-clamp-2 pt-0.5" dir="rtl">
                {room.description || 'قاعة الاجتماعات الرئيسية المخصصة للاجتماعات الرسمية والإدارية.'}
              </p>

              {/* Status Badge & Floor Pill Row */}
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                {room.status === 'maintenance' ? (
                  <span
                    dir="rtl"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-600 text-white shadow-xs"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>مغلقة للصيانة</span>
                  </span>
                ) : activeMeetingNow ? (
                  <span
                    dir="rtl"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-slate-950 shadow-xs"
                  >
                    <span className="w-2 h-2 rounded-full bg-slate-950" />
                    <span>مشغولة حالياً</span>
                  </span>
                ) : (
                  <span
                    dir="rtl"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-[#10b981] text-white shadow-xs"
                  >
                    <span className="w-2 h-2 rounded-full bg-white" />
                    <span>{language === 'ar' ? 'متاحة الآن' : 'Available Now'}</span>
                  </span>
                )}

                <span
                  dir="rtl"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#0f172a]/75 border border-white/25 text-white backdrop-blur-xs"
                >
                  <Building2 className="w-3.5 h-3.5 text-blue-300" />
                  <span>{room.floor}</span>
                </span>
              </div>

              {/* Action Buttons Row: Book Room + View Calendar */}
              <div className="flex items-center gap-2.5 pt-2 flex-wrap">
                <button
                  onClick={() => onOpenNewBooking(room.id, currentDate)}
                  disabled={room.status === 'maintenance'}
                  dir="rtl"
                  className="px-5 py-2.5 rounded-xl bg-[#0052cc] hover:bg-[#0043a8] disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  <span>{language === 'ar' ? 'حجز القاعة' : 'Book Room'}</span>
                </button>

                <button
                  onClick={onNavigateToCalendar}
                  dir="rtl"
                  className="px-5 py-2.5 rounded-xl bg-[#0b192e]/80 hover:bg-[#0b192e] border border-white/35 text-white font-bold text-xs sm:text-sm backdrop-blur-xs transition-all flex items-center gap-2 cursor-pointer"
                >
                  <CalendarDays className="w-4 h-4 text-blue-200" />
                  <span>{language === 'ar' ? 'عرض التقويم' : 'View Calendar'}</span>
                </button>
              </div>
            </div>

            {/* Right Side of Hero: Quick Room Utility Buttons + Bottom Carousel Controls */}
            <div className="hidden sm:flex flex-col items-end justify-between h-full">
              {/* Top-Right Quick Utility Buttons (Kiosk, QR, Maintenance) */}
              <div className="flex items-center gap-1.5" dir="rtl">
                <button
                  onClick={() => onOpenKiosk(room.id)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#0b192e]/70 hover:bg-[#0b192e]/90 border border-white/20 text-white text-[11px] font-bold backdrop-blur-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="شاشة العرض الرقمية"
                >
                  <Tv className="w-3.5 h-3.5 text-sky-300" />
                  <span className="hidden md:inline">شاشة العرض</span>
                </button>

                <button
                  onClick={() => setShowQrModal(true)}
                  className="p-1.5 rounded-lg bg-[#0b192e]/70 hover:bg-[#0b192e]/90 border border-white/20 text-white backdrop-blur-xs transition-colors cursor-pointer"
                  title="رمز QR للقاعة"
                >
                  <QrCode className="w-3.5 h-3.5 text-sky-300" />
                </button>

                {canManage && (
                  <button
                    onClick={() => setShowMaintenanceModal(true)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border backdrop-blur-xs flex items-center gap-1 transition-colors cursor-pointer ${
                      room.status === 'maintenance'
                        ? 'bg-emerald-600/90 text-white border-emerald-400'
                        : 'bg-[#0b192e]/70 hover:bg-rose-950/80 text-rose-200 border-white/20'
                    }`}
                    title={room.status === 'maintenance' ? 'إعادة فتح القاعة' : 'إغلاق القاعة للصيانة'}
                  >
                    <Wrench className="w-3 h-3" />
                    <span className="hidden lg:inline">
                      {room.status === 'maintenance' ? 'إعادة الفتح' : 'الصيانة'}
                    </span>
                  </button>
                )}
              </div>

              {/* Bottom-Right Carousel Controls matching Reference Image */}
              <div className="flex items-center gap-2 mt-auto">
                <button
                  type="button"
                  onClick={() =>
                    setHeroSlideIdx((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)
                  }
                  className="w-7 h-7 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow-sm transition-transform active:scale-95 cursor-pointer"
                  aria-label="الصورة السابقة"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1.5 px-1">
                  {HERO_SLIDES.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setHeroSlideIdx(idx)}
                      className={`h-2 rounded-full transition-all cursor-pointer ${
                        heroSlideIdx % HERO_SLIDES.length === idx
                          ? 'w-2 bg-white shadow-xs'
                          : 'w-2 bg-white/50 hover:bg-white/80'
                      }`}
                      aria-label={`عرض زاوية ${idx + 1}`}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setHeroSlideIdx((prev) => (prev + 1) % HERO_SLIDES.length)}
                  className="w-7 h-7 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow-sm transition-transform active:scale-95 cursor-pointer"
                  aria-label="الصورة التالية"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =====================================================================
          2. MAIN DASHBOARD CONTAINER (KPI Cards + 2-Column Lower Dashboard)
         ===================================================================== */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        
        {/* 4 KPI Cards Row matching Reference Image */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* KPI Card 1 (Rightmost in RTL): إجمالي الحجوزات */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 flex items-center justify-between">
            <div className="space-y-1 text-start">
              <span className="text-xs sm:text-[13px] font-bold text-[#0f296b] block">
                {language === 'ar' ? 'إجمالي الحجوزات' : 'Total Bookings'}
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums">
                  {roomStats.totalBookings}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {language === 'ar' ? 'حجز' : 'bookings'}
                </span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-full bg-[#eef5ff] text-[#0052cc] flex items-center justify-center shrink-0">
              <CalendarDays className="w-5 h-5" />
            </div>
          </div>

          {/* KPI Card 2: إجمالي الساعات */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 flex items-center justify-between">
            <div className="space-y-1 text-start">
              <span className="text-xs sm:text-[13px] font-bold text-[#0f296b] block">
                {language === 'ar' ? 'إجمالي الساعات' : 'Total Hours'}
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums">
                  {roomStats.totalHours}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {language === 'ar' ? 'ساعة' : 'hours'}
                </span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-full bg-[#eef5ff] text-[#0052cc] flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          {/* KPI Card 3: نسبة إشغال القاعة */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="space-y-1 text-start">
                <span className="text-xs sm:text-[13px] font-bold text-[#0f296b] block">
                  {language === 'ar' ? 'نسبة إشغال القاعة' : 'Occupancy Rate'}
                </span>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums">
                  {roomStats.utilizationRate}%
                </div>
              </div>
              <div className="w-12 h-12 rounded-full bg-[#eef5ff] text-[#0052cc] flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 -rotate-90" viewBox="0 0 36 36">
                  <circle
                    cx="18"
                    cy="18"
                    r="13"
                    fill="none"
                    stroke="#dbeafe"
                    strokeWidth="4.5"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="13"
                    fill="none"
                    stroke="#0052cc"
                    strokeWidth="4.5"
                    strokeDasharray="81.68"
                    strokeDashoffset={81.68 - (81.68 * Math.max(18, roomStats.utilizationRate)) / 100}
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-3">
              <div
                className="h-full bg-[#0052cc] rounded-full transition-all"
                style={{ width: `${Math.min(100, roomStats.utilizationRate)}%` }}
              />
            </div>
          </div>

          {/* KPI Card 4 (Leftmost in RTL): أكثر إدارة حجزًا */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 flex items-center justify-between">
            <div className="space-y-1.5 text-start min-w-0">
              <span className="text-xs sm:text-[13px] font-bold text-[#0f296b] block">
                {language === 'ar' ? 'أكثر إدارة حجزًا' : 'Top Booking Dept'}
              </span>
              <div className="text-xs sm:text-sm font-bold text-slate-500 truncate">
                {roomStats.topDepartment?.nameAr ||
                  (language === 'ar' ? 'لا توجد حجوزات بعد' : 'No bookings yet')}
              </div>
            </div>
            <div className="flex items-end gap-1 shrink-0">
              <TrendingUp className="w-4 h-4 text-amber-500/80 mb-1" />
              <div className="w-12 h-12 rounded-full bg-[#eef5ff] text-[#0052cc] flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
          </div>

        </div>

        {/* =====================================================================
            3. LOWER DASHBOARD (Room Info on Top, Bookings Log Below)
           ===================================================================== */}
        <div className="space-y-5">

          {/* TOP SECTION: معلومات القاعة وتجهيزاتها (Premium Compact Enterprise UI) */}
          <div className="bg-white rounded-[14px] border border-[#E1E9F3] shadow-xs p-3 sm:p-3.5 space-y-2.5">
            
            {/* Card Header Row matching Reference Image */}
            <div className="flex items-center justify-between gap-2 pb-0.5">
              <div className="flex items-center gap-2">
                <DoorOpen className="w-5 h-5 text-[#F28C28] shrink-0" />
                <h3 className="text-[18px] font-extrabold text-[#101F3D] leading-tight">
                  {language === 'ar' ? 'معلومات القاعة وتجهيزاتها' : 'Room Info & Equipment'}
                </h3>
              </div>

              {canEditSpecs ? (
                !isEditingSpecs ? (
                  <button
                    type="button"
                    onClick={handleStartEditSpecs}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border border-[#1749E8] bg-white text-[#1749E8] hover:bg-[#EEF5FF] font-bold text-[12px] transition-colors cursor-pointer shrink-0"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#1749E8]" />
                    <span>{language === 'ar' ? 'تعديل المواصفات والتجهيزات' : 'Edit Specs & Equipment'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleCancelEditSpecs}
                    className="px-3 py-1 rounded-full border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 font-bold text-[12px] cursor-pointer"
                  >
                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                  </button>
                )
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F5F8FC] border border-[#E1E9F3] text-slate-500 text-[11px] font-semibold">
                  <Lock className="w-3 h-3" />
                  <span>{language === 'ar' ? 'للعرض فقط' : 'View Only'}</span>
                </span>
              )}
            </div>

            {specsSaveSuccess && (
              <div className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-[10px] flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-[#10A67A] shrink-0" />
                <span>
                  {language === 'ar'
                    ? 'تم حفظ مواصفات وتجهيزات القاعة بنجاح'
                    : 'Room specifications and equipment saved successfully'}
                </span>
              </div>
            )}

            {/* Inline Edit Form (When Authorized User clicks Edit Specifications) */}
            {isEditingSpecs && canEditSpecs ? (
              <form
                onSubmit={handleSaveSpecs}
                className="space-y-3 bg-[#F5F8FC] p-3 rounded-[12px] border border-[#E1E9F3] text-xs animate-in fade-in"
              >
                {specsValidationError && (
                  <div className="p-2 rounded-[10px] bg-rose-50 border border-rose-200 text-rose-700 font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{specsValidationError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  <div className="space-y-1">
                    <label className="font-bold text-[#101F3D] block">
                      {language === 'ar' ? 'السعة الاستيعابية (عدد الأشخاص):' : 'Capacity (Persons):'}
                    </label>
                    <input
                      type="text"
                      value={editCapacity}
                      onChange={(e) => setEditCapacity(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-[10px] border border-[#E1E9F3] bg-white text-[#101F3D] font-bold focus:ring-2 focus:ring-[#1749E8] focus:outline-hidden"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-[#101F3D] block">
                      {language === 'ar' ? 'الطابق:' : 'Floor:'}
                    </label>
                    <input
                      type="text"
                      value={editFloor}
                      onChange={(e) => setEditFloor(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-[10px] border border-[#E1E9F3] bg-white text-[#101F3D] font-bold focus:ring-2 focus:ring-[#1749E8] focus:outline-hidden"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-[#101F3D] block">
                      {language === 'ar' ? 'ساعات العمل الرسمية:' : 'Working Hours:'}
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <input
                        type="time"
                        value={editOperatingStart}
                        onChange={(e) => setEditOperatingStart(e.target.value)}
                        className="w-full px-2 py-1.5 rounded-[10px] border border-[#E1E9F3] bg-white font-mono text-xs text-[#101F3D] font-bold"
                        required
                      />
                      <input
                        type="time"
                        value={editOperatingEnd}
                        onChange={(e) => setEditOperatingEnd(e.target.value)}
                        className="w-full px-2 py-1.5 rounded-[10px] border border-[#E1E9F3] bg-white font-mono text-xs text-[#101F3D] font-bold"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-[#101F3D] block">
                      {language === 'ar' ? 'الموقع والمقر:' : 'Location:'}
                    </label>
                    <input
                      type="text"
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-[10px] border border-[#E1E9F3] bg-white text-[#101F3D] font-medium focus:ring-2 focus:ring-[#1749E8] focus:outline-hidden"
                      required
                    />
                  </div>
                </div>

                {/* Editable Technical Equipment Section */}
                <div className="space-y-2 pt-2 border-t border-[#E1E9F3]">
                  <div className="flex items-center justify-between gap-2">
                    <label className="font-bold text-[#101F3D] block">
                      {language === 'ar'
                        ? 'التجهيزات التقنية (تعديل الاسم، تفعيل/تعطيل التوافر، الحذف، أو إضافة عدد غير محدود):'
                        : 'Technical Equipment (Edit name, toggle availability, remove, or add unlimited items):'}
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setEditTechItems((prev) => [
                          ...prev,
                          {
                            name:
                              language === 'ar'
                                ? `تجهيز تقني ${prev.length + 1}`
                                : `Equipment ${prev.length + 1}`,
                            available: true
                          }
                        ])
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[8px] bg-[#E5EEFF] hover:bg-[#1749E8] text-[#1749E8] hover:text-white font-bold text-[11px] cursor-pointer transition-colors shrink-0"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>{language === 'ar' ? 'إضافة تجهيز جديد' : 'Add Equipment'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    {editTechItems.map((item, idx) => {
                      const ItemIcon = getTechItemIcon(item.name, idx);
                      return (
                        <div
                          key={idx}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-[10px] border transition-all ${
                            item.available
                              ? 'bg-white border-[#1749E8]/50'
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <ItemIcon
                            className={`w-4 h-4 shrink-0 ${
                              item.available ? 'text-[#1749E8]' : 'text-[#94A3B8]'
                            }`}
                          />
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleTechItemNameChange(idx, e.target.value)}
                            className={`w-full min-w-0 bg-transparent text-[12px] font-bold focus:outline-hidden ${
                              item.available ? 'text-[#101F3D]' : 'text-[#8A97A8]'
                            }`}
                            placeholder={language === 'ar' ? 'اسم التجهيز...' : 'Equipment name...'}
                          />
                          <button
                            type="button"
                            onClick={() => handleTechItemToggleAvailable(idx)}
                            title={
                              item.available
                                ? 'متوفر (انقر لتحويله إلى غير متوفر)'
                                : 'غير متوفر (انقر لتحويله إلى متوفر)'
                            }
                            className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                              item.available
                                ? 'bg-[#10A67A] text-white'
                                : 'bg-[#CBD5E1] text-[#64748B]'
                            }`}
                          >
                            {item.available ? (
                              <Check className="w-3 h-3 stroke-[3]" />
                            ) : (
                              <X className="w-3 h-3 stroke-[2.5]" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveEquipment(idx)}
                            title="حذف هذا التجهيز"
                            className="p-0.5 text-slate-400 hover:text-rose-600 cursor-pointer shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={newEquipmentInput}
                      onChange={(e) => setNewEquipmentInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddEquipment();
                        }
                      }}
                      placeholder={language === 'ar' ? 'إضافة تجهيز تقني جديد...' : 'Add new technical equipment...'}
                      className="flex-1 px-2.5 py-1.5 rounded-[10px] border border-[#E1E9F3] bg-white text-xs focus:ring-2 focus:ring-[#1749E8] focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={handleAddEquipment}
                      className="px-3 py-1.5 rounded-[10px] bg-[#1749E8] hover:bg-blue-700 text-white font-bold text-xs cursor-pointer transition-colors flex items-center gap-1"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>{language === 'ar' ? 'إضافة' : 'Add'}</span>
                    </button>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-[#E1E9F3]">
                  <button
                    type="button"
                    onClick={handleCancelEditSpecs}
                    className="px-3.5 py-1.5 rounded-[10px] border border-slate-300 bg-white text-slate-700 font-bold text-xs cursor-pointer hover:bg-slate-50"
                  >
                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 rounded-[10px] bg-[#10A67A] hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{language === 'ar' ? 'حفظ التعديلات' : 'Save Changes'}</span>
                  </button>
                </div>
              </form>
            ) : (
              /* Read-Only Display Mode matching Reference Image (Ultra-Compact Layout) */
              <div className="space-y-2.5">
                
                {/* =========================================================
                    ROW 1: معلومات القاعة الأساسية (3 Equal Horizontal Cards)
                    Height: 72-80px | Card Title: 13px | Value: 16px bold | Main Icon: 20px
                    Order RTL: السعة الاستيعابية | الطابق | ساعات العمل الرسمية
                   ========================================================= */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  
                  {/* Card 1 (Rightmost in RTL): السعة الاستيعابية */}
                  <div className="bg-[#F5F8FC] border border-[#E1E9F3] rounded-[12px] h-[72px] px-3.5 py-2.5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[10px] bg-[#E5EEFF] text-[#1749E8] flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5" />
                    </div>
                    <div className="text-start min-w-0">
                      <span className="text-[13px] font-medium text-[#101F3D] block leading-tight">
                        {language === 'ar' ? 'السعة الاستيعابية' : 'Room Capacity'}
                      </span>
                      <span className="text-[16px] font-extrabold text-[#101F3D] mt-0.5 block leading-snug tabular-nums">
                        {typeof displayCapacityNumber === 'number' ||
                        /^\d+$/.test(String(displayCapacityNumber).trim())
                          ? `${displayCapacityNumber} ${language === 'ar' ? 'شخصاً' : 'Persons'}`
                          : displayCapacityNumber}
                      </span>
                    </div>
                  </div>

                  {/* Card 2 (Center): الطابق */}
                  <div className="bg-[#F5F8FC] border border-[#E1E9F3] rounded-[12px] h-[72px] px-3.5 py-2.5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[10px] bg-[#E5EEFF] text-[#1749E8] flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="text-start min-w-0">
                      <span className="text-[13px] font-medium text-[#101F3D] block leading-tight">
                        {language === 'ar' ? 'الطابق' : 'Floor'}
                      </span>
                      <span className="text-[16px] font-extrabold text-[#101F3D] mt-0.5 block leading-snug tabular-nums">
                        {displayFloorNumber}
                      </span>
                    </div>
                  </div>

                  {/* Card 3 (Leftmost in RTL): ساعات العمل الرسمية */}
                  <div className="bg-[#F5F8FC] border border-[#E1E9F3] rounded-[12px] h-[72px] px-3.5 py-2.5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[10px] bg-[#E5EEFF] text-[#1749E8] flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div className="text-start min-w-0">
                      <span className="text-[13px] font-medium text-[#101F3D] block leading-tight">
                        {language === 'ar' ? 'ساعات العمل الرسمية' : 'Official Working Hours'}
                      </span>
                      <span className="text-[16px] font-extrabold text-[#101F3D] mt-0.5 block leading-snug tabular-nums">
                        {formatTimeRange12(
                          room.operatingHours?.start || '07:30',
                          room.operatingHours?.end || '18:00',
                          language as 'ar' | 'en'
                        )}
                      </span>
                    </div>
                  </div>

                </div>

                {/* =========================================================
                    ROW 2: التجهيزات التقنية (Editable Cards in CSS Grid)
                    Sub-title: 15px | Card height: 40-44px | Text: 13px | Icon: 16-18px
                   ========================================================= */}
                <div className="bg-white border border-[#E1E9F3] rounded-[12px] p-2.5 sm:p-3 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-[18px] h-[18px] text-[#1749E8] shrink-0" />
                    <h4 className="text-[15px] font-extrabold text-[#101F3D] leading-tight">
                      {language === 'ar' ? 'التجهيزات التقنية' : 'Technical Equipment'}
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    {techItems.map((techItem, idx) => {
                      const TechIcon = getTechItemIcon(techItem.name, idx);
                      const isAvailable = techItem.available;
                      return (
                        <div
                          key={`${techItem.name}-${idx}`}
                          onClick={canEditSpecs ? () => handleQuickToggleTechCard(idx) : undefined}
                          title={
                            canEditSpecs
                              ? isAvailable
                                ? 'متوفر (انقر لتغيير الحالة أو استخدم زر تعديل المواصفات والتجهيزات)'
                                : 'غير متوفر (انقر لتغيير الحالة أو استخدم زر تعديل المواصفات والتجهيزات)'
                              : undefined
                          }
                          className={`rounded-[10px] h-[42px] px-3 py-1.5 flex items-center justify-between gap-2 border transition-all ${
                            isAvailable
                              ? 'bg-[#F2F6FC] border-[#E1E9F3]'
                              : 'bg-[#F8FAFC] border-[#E5ECF4]'
                          } ${canEditSpecs ? 'cursor-pointer hover:border-[#1749E8]/50' : ''}`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <TechIcon
                              className={`w-[18px] h-[18px] shrink-0 ${
                                isAvailable ? 'text-[#1749E8]' : 'text-[#94A3B8]'
                              }`}
                            />
                            <span
                              className={`text-[13px] font-bold truncate ${
                                isAvailable ? 'text-[#101F3D]' : 'text-[#8A97A8]'
                              }`}
                            >
                              {techItem.name}
                            </span>
                          </div>
                          {isAvailable ? (
                            <span
                              className="w-4 h-4 rounded-full bg-[#10A67A] text-white flex items-center justify-center shrink-0"
                              title={language === 'ar' ? 'متوفر' : 'Available'}
                            >
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </span>
                          ) : (
                            <span
                              className="w-4 h-4 rounded-full bg-[#CBD5E1] text-[#64748B] flex items-center justify-center shrink-0"
                              title={language === 'ar' ? 'غير متوفر' : 'Unavailable'}
                            >
                              <X className="w-2.5 h-2.5 stroke-[2.5]" />
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}

          </div>

          {/* BOTTOM SECTION: سجل حجوزات القاعة */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-4">
            
            {/* Header of Bookings Section */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#0052cc] shrink-0" />
                  <span>سجل حجوزات قاعة {room.nameAr}</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  قائمة مفصلة بجميع الحجوزات المسجلة حصرياً في قاعة {room.nameAr} مع إمكانية الفلترة والإدارة الفورية.
                </p>
              </div>

              {roomAllBookings.length > 0 && (
                <button
                  onClick={() => onOpenNewBooking(room.id, currentDate)}
                  disabled={room.status === 'maintenance'}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0052cc] hover:bg-[#0043a8] disabled:opacity-50 text-white font-bold text-xs shadow-xs transition-colors self-start sm:self-auto cursor-pointer shrink-0"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>إضافة حجز</span>
                </button>
              )}
            </div>

            {/* Filter Pills & Sort Controls Row */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              
              {/* Quick Filter Tabs matching Reference Image */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 flex-wrap">
                {[
                  { id: 'all', label: 'جميع الحجوزات' },
                  { id: 'today', label: 'اليوم' },
                  { id: 'upcoming', label: 'القادمة' },
                  { id: 'past', label: `المكتملة والسابقة (${pastCountInRoom})` },
                  { id: 'cancelled', label: `الملغاة (${cancelledCountInRoom})` }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setFilterTab(tab.id as any)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      filterTab === tab.id
                        ? 'bg-[#0052cc] text-white shadow-2xs'
                        : 'bg-[#f1f5f9] text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Sort Pill matching Reference Image */}
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs shadow-2xs">
                <span className="text-slate-500 font-semibold whitespace-nowrap text-[11px]">
                  الفرز حسب :
                </span>
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value as any)}
                  className="bg-transparent text-slate-800 font-bold text-xs focus:outline-hidden cursor-pointer"
                  title="تحديد معيار الفرز"
                >
                  <option value="date">التاريخ</option>
                  <option value="time">وقت الاجتماع</option>
                  <option value="bookingNumber">رقم الحجز</option>
                  <option value="title">موضوع الاجتماع</option>
                  <option value="department">الإدارة</option>
                  <option value="booker">مقدم الحجز</option>
                  <option value="status">الحالة</option>
                  <option value="duration">مدة الاجتماع</option>
                </select>
                <button
                  type="button"
                  onClick={() => setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                  className="p-0.5 rounded hover:bg-slate-100 text-[#0052cc] transition-colors cursor-pointer"
                  title={
                    sortDirection === 'desc'
                      ? 'الترتيب الحالي: تنازلي (الأحدث أولاً)'
                      : 'الترتيب الحالي: تصاعدي (الأقدم أولاً)'
                  }
                >
                  <Calendar className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Search & Date Filter Input Row */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative flex-1 min-w-[200px] sm:max-w-xs">
                <input
                  type="text"
                  placeholder="بحث في الحجوزات.."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full ps-3 pe-9 py-2 rounded-xl border border-slate-200 bg-[#f8fafc] text-xs focus:bg-white focus:ring-2 focus:ring-[#0052cc] focus:outline-hidden"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute end-3 top-2.5 pointer-events-none" />
              </div>

              <input
                type="date"
                value={selectedDateFilter}
                onChange={(e) => setSelectedDateFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-[#f8fafc] text-xs font-mono text-slate-600 focus:bg-white focus:ring-2 focus:ring-[#0052cc] focus:outline-hidden tabular-nums"
                title="فلترة حسب تاريخ محدد"
              />

              {filterTab === 'cancelled' && canManage && cancelledCountInRoom > 0 && (
                <button
                  type="button"
                  onClick={() => setShowDeleteAllCancelledModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف كافة الملغاة ({cancelledCountInRoom})</span>
                </button>
              )}

              {(searchQuery || selectedDateFilter || sortField !== 'date' || sortDirection !== 'desc') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedDateFilter('');
                    setSortField('date');
                    setSortDirection('desc');
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition-colors cursor-pointer"
                >
                  إعادة ضبط
                </button>
              )}
            </div>

            {/* Action Feedback Message (Toast) */}
            {actionFeedbackMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 font-bold flex items-center justify-between animate-in fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{actionFeedbackMsg}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActionFeedbackMsg(null)}
                  className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Bookings Table or Reference Empty State */}
            {displayedBookings.length === 0 ? (
              <div className="py-12 px-6 text-center bg-[#f8fafc] border border-slate-200/75 rounded-2xl space-y-3.5">
                <div className="w-12 h-12 rounded-full bg-[#e0ecff] text-[#0052cc] flex items-center justify-center mx-auto shadow-2xs">
                  <CalendarDays className="w-6 h-6" />
                </div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                  لا توجد حجوزات مطابقة في قاعة {room.nameAr}
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  {roomAllBookings.length === 0
                    ? `النظام حالياً في وضع التشغيل الفعلي والصافي بدون أي حجوزات مسبقة، يمكنك بدء تسجيل حجز جديد لقاعة ${room.nameAr} من خلال الزر أدناه.`
                    : 'لم يتم العثور على أي حجز يطابق معايير الفلترة أو البحث المحددة.'}
                </p>
                {room.status !== 'maintenance' && (
                  <div className="pt-1">
                    <button
                      onClick={() => onOpenNewBooking(room.id, currentDate)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0052cc] hover:bg-[#0043a8] text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                    >
                      <CalendarPlus className="w-4 h-4" />
                      <span>حجز قاعة جديدة</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Desktop & Tablet Table View */}
                <div className="hidden sm:block overflow-x-auto border border-slate-200 rounded-xl shadow-2xs">
                  <table className="w-full text-xs text-start border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 select-none">
                      <tr>
                        <th
                          onClick={() => handleSortToggle('bookingNumber')}
                          className={`p-3 text-start cursor-pointer hover:bg-slate-200/80 transition-colors ${
                            sortField === 'bookingNumber' ? 'bg-blue-100/70 text-blue-950 font-black' : ''
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span>رقم الحجز</span>
                            {sortField === 'bookingNumber' ? (
                              sortDirection === 'desc' ? (
                                <ArrowDown className="w-3.5 h-3.5 text-blue-700" />
                              ) : (
                                <ArrowUp className="w-3.5 h-3.5 text-blue-700" />
                              )
                            ) : (
                              <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />
                            )}
                          </div>
                        </th>

                        <th
                          onClick={() => handleSortToggle('date')}
                          className={`p-3 text-start cursor-pointer hover:bg-slate-200/80 transition-colors ${
                            sortField === 'date' ? 'bg-blue-100/70 text-blue-950 font-black' : ''
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span>التاريخ</span>
                            {sortField === 'date' ? (
                              sortDirection === 'desc' ? (
                                <ArrowDown className="w-3.5 h-3.5 text-blue-700" />
                              ) : (
                                <ArrowUp className="w-3.5 h-3.5 text-blue-700" />
                              )
                            ) : (
                              <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />
                            )}
                          </div>
                        </th>

                        <th
                          onClick={() => handleSortToggle('time')}
                          className={`p-3 text-start cursor-pointer hover:bg-slate-200/80 transition-colors ${
                            sortField === 'time' ? 'bg-blue-100/70 text-blue-950 font-black' : ''
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span>الوقت</span>
                            {sortField === 'time' ? (
                              sortDirection === 'desc' ? (
                                <ArrowDown className="w-3.5 h-3.5 text-blue-700" />
                              ) : (
                                <ArrowUp className="w-3.5 h-3.5 text-blue-700" />
                              )
                            ) : (
                              <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />
                            )}
                          </div>
                        </th>

                        <th
                          onClick={() => handleSortToggle('title')}
                          className={`p-3 text-start cursor-pointer hover:bg-slate-200/80 transition-colors ${
                            sortField === 'title' ? 'bg-blue-100/70 text-blue-950 font-black' : ''
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span>موضوع الاجتماع</span>
                            {sortField === 'title' ? (
                              sortDirection === 'desc' ? (
                                <ArrowDown className="w-3.5 h-3.5 text-blue-700" />
                              ) : (
                                <ArrowUp className="w-3.5 h-3.5 text-blue-700" />
                              )
                            ) : (
                              <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />
                            )}
                          </div>
                        </th>

                        <th
                          onClick={() => handleSortToggle('department')}
                          className={`p-3 text-start cursor-pointer hover:bg-slate-200/80 transition-colors ${
                            sortField === 'department' ? 'bg-blue-100/70 text-blue-950 font-black' : ''
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span>الإدارة</span>
                            {sortField === 'department' ? (
                              sortDirection === 'desc' ? (
                                <ArrowDown className="w-3.5 h-3.5 text-blue-700" />
                              ) : (
                                <ArrowUp className="w-3.5 h-3.5 text-blue-700" />
                              )
                            ) : (
                              <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />
                            )}
                          </div>
                        </th>

                        <th
                          onClick={() => handleSortToggle('status')}
                          className={`p-3 text-center cursor-pointer hover:bg-slate-200/80 transition-colors ${
                            sortField === 'status' ? 'bg-blue-100/70 text-blue-950 font-black' : ''
                          }`}
                        >
                          <div className="flex items-center justify-center gap-1.5">
                            <span>الحالة</span>
                          </div>
                        </th>
                        <th className="p-3 text-center">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {displayedBookings.map((b) => {
                        const isToday = b.date === currentDate;
                        const isCancelled = b.status === 'cancelled';
                        const canEdit =
                          (!isCancelled && (canManage || currentUser.id === b.userId)) ||
                          (isCancelled && canManage);
                        const canCancel =
                          !isCancelled && (canManage || currentUser.id === b.userId);

                        return (
                          <tr
                            key={b.id}
                            onClick={() => onSelectBooking(b)}
                            className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                              isCancelled ? 'opacity-60 bg-slate-50/50' : ''
                            }`}
                          >
                            <td className="p-3 font-mono font-bold text-blue-900 tabular-nums">
                              {b.bookingNumber}
                            </td>
                            <td className="p-3 font-mono text-slate-800 tabular-nums">
                              <div className="font-semibold">{b.date}</div>
                              <div className="text-[10px] text-slate-500 font-sans">
                                {formatDateAr(b.date).split(' ').slice(0, 2).join(' ')}
                              </div>
                            </td>
                            <td className="p-3 font-mono font-bold text-slate-700 text-xs tabular-nums">
                              {formatTimeRange12(b.startTime, b.endTime, language as 'ar' | 'en')}
                            </td>
                            <td className="p-3">
                              <div className="font-bold text-slate-900">{b.title}</div>
                              <div className="text-[10px] text-slate-500">{b.bookerName}</div>
                            </td>
                            <td className="p-3">
                              <span className="text-blue-800 font-semibold">{b.departmentNameAr}</span>
                            </td>
                            <td className="p-3 text-center">
                              {(() => {
                                const isOngoing =
                                  b.status === 'confirmed' &&
                                  isToday &&
                                  currentMinutes >= timeToMinutes(b.startTime) &&
                                  currentMinutes < timeToMinutes(b.endTime);

                                return (
                                  <span
                                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                      b.status === 'confirmed'
                                        ? isOngoing
                                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                          : 'bg-emerald-100 text-emerald-800'
                                        : b.status === 'completed'
                                        ? 'bg-slate-100 text-slate-700'
                                        : 'bg-rose-100 text-rose-800'
                                    }`}
                                  >
                                    {b.status === 'confirmed'
                                      ? isOngoing
                                        ? 'جاري الآن'
                                        : 'مؤكد'
                                      : b.status === 'completed'
                                      ? 'مكتمل'
                                      : 'ملغي'}
                                  </span>
                                );
                              })()}
                            </td>
                            <td className="p-3 text-center">
                              <div
                                className="flex items-center justify-center gap-1.5"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  onClick={() => onSelectBooking(b)}
                                  className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                                  title="عرض التفاصيل الكاملة"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>

                                {canEdit && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onEditBooking(b);
                                    }}
                                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                      isCancelled
                                        ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 ring-1 ring-amber-300'
                                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                                    }`}
                                    title={isCancelled ? 'تعديل الحجز الملغي (إجراء المدير Admin)' : 'تعديل الحجز'}
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {isToday && b.status === 'confirmed' && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      checkInBooking(b.id);
                                    }}
                                    className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[10px] font-bold"
                                    title="تسجيل حضور الاجتماع"
                                  >
                                    حضور
                                  </button>
                                )}

                                {isToday &&
                                  b.status === 'confirmed' &&
                                  currentMinutes >= timeToMinutes(b.startTime) && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        checkOutBooking(b.id);
                                      }}
                                      className="px-2 py-1 rounded-lg bg-slate-800 text-white hover:bg-slate-900 text-[10px] font-bold"
                                      title="إنهاء الاجتماع"
                                    >
                                      إنهاء
                                    </button>
                                  )}

                                {canCancel && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setCancelModalBooking(b);
                                    }}
                                    className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                                    title="إلغاء الحجز"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {b.status === 'cancelled' && canManage && (
                                  <button
                                    onClick={() => setDeleteModalBooking(b)}
                                    className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 transition-colors cursor-pointer"
                                    title="حذف الحجز الملغي نهائياً (صلاحية المسؤول Admin)"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards View for Smartphones (< sm) */}
                <div className="sm:hidden space-y-3">
                  {displayedBookings.map((b) => {
                    const isToday = b.date === currentDate;
                    const isCancelled = b.status === 'cancelled';
                    const canEdit =
                      (!isCancelled && (canManage || currentUser.id === b.userId)) ||
                      (isCancelled && canManage);
                    const canCancel =
                      !isCancelled && (canManage || currentUser.id === b.userId);

                    const isOngoing =
                      b.status === 'confirmed' &&
                      isToday &&
                      currentMinutes >= timeToMinutes(b.startTime) &&
                      currentMinutes < timeToMinutes(b.endTime);

                    return (
                      <div
                        key={b.id}
                        onClick={() => onSelectBooking(b)}
                        className={`p-4 rounded-xl border bg-white shadow-2xs space-y-3 transition-all active:scale-[0.99] cursor-pointer ${
                          isCancelled
                            ? 'border-slate-200 opacity-60 bg-slate-50/50'
                            : isOngoing
                            ? 'border-amber-300 ring-2 ring-amber-100'
                            : 'border-slate-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-bold text-xs text-blue-900 bg-blue-50 px-2 py-0.5 rounded-md tabular-nums">
                            {b.bookingNumber}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              b.status === 'confirmed'
                                ? isOngoing
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : 'bg-emerald-100 text-emerald-800'
                                : b.status === 'completed'
                                ? 'bg-slate-100 text-slate-700'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {b.status === 'confirmed'
                              ? isOngoing
                                ? 'جاري الآن'
                                : 'مؤكد'
                              : b.status === 'completed'
                              ? 'مكتمل'
                              : 'ملغي'}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-bold text-sm text-slate-900 leading-snug">{b.title}</h4>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          <div className="flex items-center gap-1.5 text-slate-700 tabular-nums">
                            <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span className="font-semibold">{b.date}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-700 font-mono text-[11px] tabular-nums">
                            <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span className="font-bold">
                              {formatTimeRange12(b.startTime, b.endTime, language as 'ar' | 'en')}
                            </span>
                          </div>
                        </div>

                        <div
                          className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => onSelectBooking(b)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>عرض</span>
                          </button>

                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => onEditBooking(b)}
                              className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>تعديل</span>
                            </button>
                          )}

                          {canCancel && (
                            <button
                              type="button"
                              onClick={() => setCancelModalBooking(b)}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>إلغاء</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

          </div>

        </div>

      </div>

      {/* Cancel Booking Confirmation Modal */}
      {cancelModalBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600" />
              <span>تأكيد إلغاء الحجز رقم {cancelModalBooking.bookingNumber}</span>
            </h3>
            <p className="text-xs text-slate-600">
              أنت على وشك إلغاء حجز اجتماع &quot;{cancelModalBooking.title}&quot; في قاعة {room.nameAr}. سيتم تحرير القاعة فوراً وعكس الإلغاء في التقويم والإحصائيات.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">سبب الإلغاء:</label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setCancelModalBooking(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold"
              >
                تراجع
              </button>
              <button
                onClick={handleConfirmCancel}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
              >
                تأكيد إلغاء الحجز
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Delete Cancelled Booking Confirmation Modal */}
      {deleteModalBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-rose-200">
            <div className="flex items-center gap-2.5 text-rose-600">
              <div className="p-2 rounded-xl bg-rose-100">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  تأكيد الحذف النهائي للحجز الملغي
                </h3>
                <span className="text-[11px] text-rose-600 font-semibold">إجراء إداري لمدير النظام (Admin)</span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">رقم الحجز:</span>
                <span className="font-mono font-bold text-blue-900">{deleteModalBooking.bookingNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">موضوع الاجتماع:</span>
                <span className="font-bold text-slate-800">{deleteModalBooking.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">القاعة:</span>
                <span className="font-bold text-slate-800">{deleteModalBooking.roomNameAr}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">الإدارة الحاجزة:</span>
                <span className="font-bold text-slate-800">{deleteModalBooking.departmentNameAr}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">التاريخ والوقت:</span>
                <span className="font-semibold text-slate-700">
                  {deleteModalBooking.date} ({deleteModalBooking.startTime} - {deleteModalBooking.endTime})
                </span>
              </div>
            </div>

            <p className="text-xs text-rose-700 leading-relaxed bg-rose-50 p-3 rounded-xl border border-rose-200">
              هل أنت متأكد من حذف هذا الحجز الملغي نهائياً من قاعدة البيانات؟
              <br />
              <strong className="block mt-1 text-[11px] text-rose-900">
                تنبيه: سيتم مسح سجل الحجز بالكامل وتوثيق العملية في سجل التدقيق الإداري. لا يمكن التراجع عن هذا الإجراء.
              </strong>
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalBooking(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteSingle}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>تأكيد الحذف النهائي</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Delete All Cancelled Bookings in Room Modal */}
      {showDeleteAllCancelledModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-rose-200">
            <div className="flex items-center gap-2.5 text-rose-600">
              <div className="p-2 rounded-xl bg-rose-100">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  حذف كافة الحجوزات الملغاة في قاعة {room.nameAr}
                </h3>
                <span className="text-[11px] text-rose-600 font-semibold">إجراء جماعي لمدير النظام (Admin)</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              أنت على وشك حذف جميع الحجوزات الملغية في <strong>قاعة {room.nameAr}</strong> والبالغ عددها (
              <strong className="text-rose-600 font-mono text-sm">{cancelledCountInRoom}</strong>) حجز ملغي نهائياً من قاعدة البيانات.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteAllCancelledModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAllCancelled}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>تأكيد حذف {cancelledCountInRoom} حجز ملغي</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Maintenance Toggle Modal */}
      {showMaintenanceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900">
              {room.status === 'maintenance'
                ? `إعادة فتح قاعة ${room.nameAr}`
                : `إغلاق قاعة ${room.nameAr} لأعمال الصيانة`}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {room.status === 'maintenance'
                ? 'سيتم تفعيل القاعة مجدداً وإتاحتها لموظفي شركة ساعد لإنشاء الحجوزات في التقويم.'
                : 'سيتم منع إنشاء أي حجوزات جديدة في القاعة طوال فترة الإغلاق لحين إنهاء الصيانة.'}
            </p>

            {room.status !== 'maintenance' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">سبب الصيانة:</label>
                <input
                  type="text"
                  value={maintenanceReason}
                  onChange={(e) => setMaintenanceReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowMaintenanceModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold"
              >
                إلغاء
              </button>
              <button
                onClick={handleMaintenanceToggle}
                className={`px-4 py-2 rounded-xl text-white font-bold text-xs ${
                  room.status === 'maintenance'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {room.status === 'maintenance' ? 'تأكيد إعادة الفتح' : 'تأكيد الإغلاق للصيانة'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4">
            <h3 className="font-black text-lg text-slate-900">رمز الاستجابة السريعة (QR Code)</h3>
            <p className="text-xs text-slate-500">
              قاعة {room.nameAr} ({room.code}) • شركة ساعد للأنظمة المرورية
            </p>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl inline-block mx-auto">
              <svg className="w-48 h-48 mx-auto" viewBox="0 0 100 100" fill="currentColor">
                <rect x="10" y="10" width="24" height="24" rx="3" fill="#1e3a8a" />
                <rect x="14" y="14" width="16" height="16" fill="white" />
                <rect x="18" y="18" width="8" height="8" fill="#1e3a8a" />

                <rect x="66" y="10" width="24" height="24" rx="3" fill="#1e3a8a" />
                <rect x="70" y="14" width="16" height="16" fill="white" />
                <rect x="74" y="18" width="8" height="8" fill="#1e3a8a" />

                <rect x="10" y="66" width="24" height="24" rx="3" fill="#1e3a8a" />
                <rect x="14" y="70" width="16" height="16" fill="white" />
                <rect x="18" y="74" width="8" height="8" fill="#1e3a8a" />

                <rect x="42" y="14" width="8" height="8" fill="#0284c7" />
                <rect x="52" y="24" width="6" height="6" fill="#1e3a8a" />
                <rect x="40" y="40" width="20" height="20" rx="2" fill="#c24128" />
                <rect x="68" y="44" width="8" height="8" fill="#1e3a8a" />
                <rect x="20" y="44" width="8" height="8" fill="#0284c7" />
                <rect x="42" y="68" width="8" height="8" fill="#1e3a8a" />
                <rect x="54" y="76" width="12" height="6" fill="#0284c7" />
                <rect x="74" y="68" width="8" height="8" fill="#1e3a8a" />
              </svg>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              عند مسح الرمز بجانب باب قاعة {room.nameAr}، يستطيع الموظف الاطلاع على جدول الاجتماعات وتسجيل الحضور الفوري (Check-in).
            </p>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
