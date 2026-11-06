import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Booking, Room } from '../types';
import {
  BarChart3,
  Calendar,
  Building2,
  DoorOpen,
  Filter,
  Download,
  Printer,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Award,
  Layers,
  FileSpreadsheet,
  FileText,
  PieChart,
  ArrowUpDown,
  Edit3,
  Upload,
  PenTool,
  Trash2,
  FileSignature,
  Check,
  X,
  Sparkles,
  Camera
} from 'lucide-react';
import { SIGNATURE_PRESETS, DEFAULT_EXECUTIVE_SIGNATURES } from '../utils/signaturePresets';
import {
  filterBookingsByPeriodAndStatus,
  getDepartmentDateStatistics,
  getDepartmentMatrixStatistics,
  calculateRoomDetailedStats,
  getRoomComparisonMetrics,
  exportToExcelCsv,
  getYearlyMonthlyDepartmentStats,
  exportYearlyMonthlyToExcelCsv,
  DepartmentDateStat,
  RoomDetailedStats,
  YearlyExecutiveStats
} from '../services/analyticsService';
import { SaaedLogo } from './SaaedLogo';
import { formatTimeRange12 } from '../utils/dateUtils';

interface AnalyticsViewProps {
  onSelectBooking?: (booking: Booking) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ onSelectBooking }) => {
  const { bookings, rooms, departments, settings, currentDate, language } = useApp();

  // Filters state
  const [selectedRoomId, setSelectedRoomId] = useState<string>('all'); // 'all' | 'room-dana' | 'room-waha'
  const [selectedDeptId, setSelectedDeptId] = useState<string>('all');
  const [statusMode, setStatusMode] = useState<'confirmed_completed' | 'all'>('confirmed_completed');
  const [periodPreset, setPeriodPreset] = useState<string>('month'); // 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all' | 'custom'
  
  // Dynamic month start & end based on actual currentDate
  const [currYearNum, currMonthNum] = currentDate.split('-').map(Number);
  const dynamicFirstDay = `${currYearNum}-${String(currMonthNum).padStart(2, '0')}-01`;
  const daysInCurMonth = new Date(currYearNum, currMonthNum, 0).getDate();
  const dynamicLastDay = `${currYearNum}-${String(currMonthNum).padStart(2, '0')}-${String(daysInCurMonth).padStart(2, '0')}`;

  const [startDate, setStartDate] = useState<string>(dynamicFirstDay);
  const [endDate, setEndDate] = useState<string>(dynamicLastDay);

  // Sub-tab navigation
  const [activeTab, setActiveTab] = useState<
    'primary_dept_date' | 'comprehensive_all' | 'dana_stats' | 'waha_stats' | 'comparison' | 'ranking' | 'executive'
  >('primary_dept_date');

  // Drill-down modal state
  const [drillDownTitle, setDrillDownTitle] = useState<string>('');
  const [drillDownBookings, setDrillDownBookings] = useState<Booking[] | null>(null);

  // Executive yearly & monthly stats state
  const [executiveYear, setExecutiveYear] = useState<number>(() => currYearNum || new Date().getFullYear());
  const [executiveViewMode, setExecutiveViewMode] = useState<'matrix' | 'monthly_detail'>('matrix');
  const [selectedExecutiveMonth, setSelectedExecutiveMonth] = useState<number>(() => currMonthNum || 1);
  const [executiveHallDisplayMode, setExecutiveHallDisplayMode] = useState<'split' | 'dana' | 'waha' | 'combined'>('split');

  // Professional list of years from current year through 2050
  const executiveYears = useMemo(() => {
    const startYear = currYearNum || new Date().getFullYear();
    const endYear = 2050;
    const years: number[] = [];
    for (let y = startYear; y <= endYear; y++) {
      years.push(y);
    }
    return years;
  }, [currYearNum]);

  const yearlyExecutiveStats = useMemo(() => {
    return getYearlyMonthlyDepartmentStats(bookings, executiveYear, departments);
  }, [bookings, executiveYear, departments]);

  // ==============================================================
  // Executive Signatures State & Persistence (Prompt Requirement)
  // ==============================================================
  const SIGNATURES_STORAGE_KEY = 'saaed_executive_signatures_v1';

  const [sigConfig, setSigConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('saaed_executive_signatures_v1');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_EXECUTIVE_SIGNATURES;
  });

  const [isSigModalOpen, setIsSigModalOpen] = useState(false);
  const [activeSigTab, setActiveSigTab] = useState<'both' | 'preparer' | 'approver'>('both');

  // Modal form fields
  const [modalPreparerTitle, setModalPreparerTitle] = useState(sigConfig.preparer.title);
  const [modalPreparerName, setModalPreparerName] = useState(sigConfig.preparer.name);
  const [modalPreparerRole, setModalPreparerRole] = useState(sigConfig.preparer.roleTitle || '');
  const [modalPreparerSig, setModalPreparerSig] = useState(sigConfig.preparer.signatureUrl || '');
  const [modalPreparerDate, setModalPreparerDate] = useState(sigConfig.preparer.date || currentDate);

  const [modalApproverTitle, setModalApproverTitle] = useState(sigConfig.approver.title);
  const [modalApproverName, setModalApproverName] = useState(sigConfig.approver.name);
  const [modalApproverRole, setModalApproverRole] = useState(sigConfig.approver.roleTitle || '');
  const [modalApproverSig, setModalApproverSig] = useState(sigConfig.approver.signatureUrl || '');
  const [modalApproverDate, setModalApproverDate] = useState(sigConfig.approver.date || currentDate);

  const [sigDrawTarget, setSigDrawTarget] = useState<'preparer' | 'approver' | null>(null);
  const [sigFeedbackToast, setSigFeedbackToast] = useState<string | null>(null);

  // Canvas drawing ref and state
  const sigCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawingSig, setIsDrawingSig] = useState(false);
  const [hasDrawnOnCanvas, setHasDrawnOnCanvas] = useState(false);

  // Open modal with synced fields
  const handleOpenSigModal = (targetTab: 'both' | 'preparer' | 'approver' = 'both') => {
    setModalPreparerTitle(sigConfig.preparer.title);
    setModalPreparerName(sigConfig.preparer.name);
    setModalPreparerRole(sigConfig.preparer.roleTitle || 'رئيس قسم إدارة المرافق والأنظمة');
    setModalPreparerSig(sigConfig.preparer.signatureUrl || '');
    setModalPreparerDate(sigConfig.preparer.date || currentDate);

    setModalApproverTitle(sigConfig.approver.title);
    setModalApproverName(sigConfig.approver.name);
    setModalApproverRole(sigConfig.approver.roleTitle || 'الرئيس التنفيذي للعمليات');
    setModalApproverSig(sigConfig.approver.signatureUrl || '');
    setModalApproverDate(sigConfig.approver.date || currentDate);

    setActiveSigTab(targetTab);
    setSigDrawTarget(null);
    setIsSigModalOpen(true);
  };

  // Save all modal edits
  const handleSaveSignatures = () => {
    const updated = {
      preparer: {
        title: modalPreparerTitle.trim() || 'إدارة تقنية المعلومات والخدمات',
        name: modalPreparerName.trim() || 'خالد الهاشمي',
        roleTitle: modalPreparerRole.trim(),
        signatureUrl: modalPreparerSig,
        date: modalPreparerDate.trim() || currentDate
      },
      approver: {
        title: modalApproverTitle.trim() || 'الإدارة التنفيذية',
        name: modalApproverName.trim() || 'سعادة المهندس / المدير التنفيذي',
        roleTitle: modalApproverRole.trim(),
        signatureUrl: modalApproverSig,
        date: modalApproverDate.trim() || currentDate
      }
    };
    setSigConfig(updated);
    try {
      localStorage.setItem('saaed_executive_signatures_v1', JSON.stringify(updated));
    } catch {
      // ignore
    }
    setIsSigModalOpen(false);
    setSigFeedbackToast('تم حفظ وتحديث بيانات الإعداد والاعتماد والتواقيع بنجاح!');
    setTimeout(() => setSigFeedbackToast(null), 4000);
  };

  // Reset to system defaults
  const handleResetSignatures = () => {
    setSigConfig(DEFAULT_EXECUTIVE_SIGNATURES);
    try {
      localStorage.setItem('saaed_executive_signatures_v1', JSON.stringify(DEFAULT_EXECUTIVE_SIGNATURES));
    } catch {
      // ignore
    }
    setSigFeedbackToast('تمت استعادة بيانات الإعداد والاعتماد والتواقيع الافتراضية بنجاح.');
    setTimeout(() => setSigFeedbackToast(null), 4000);
  };

  // File upload for signature image
  const handleUploadSignatureFile = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'preparer' | 'approver',
    inModal = false
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const maxW = 400;
          const maxH = 160;
          let w = img.width;
          let h = img.height;
          const ratio = Math.min(maxW / w, maxH / h, 1);
          canvas.width = Math.round(w * ratio);
          canvas.height = Math.round(h * ratio);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const optimized = canvas.toDataURL('image/png');
            if (inModal) {
              if (target === 'preparer') setModalPreparerSig(optimized);
              else setModalApproverSig(optimized);
            } else {
              const updated = {
                ...sigConfig,
                [target]: {
                  ...sigConfig[target],
                  signatureUrl: optimized
                }
              };
              setSigConfig(updated);
              localStorage.setItem('saaed_executive_signatures_v1', JSON.stringify(updated));
              setSigFeedbackToast(`تم رفع وتحديث صورة توقيع ${target === 'preparer' ? 'الإعداد' : 'الاعتماد'} بنجاح!`);
              setTimeout(() => setSigFeedbackToast(null), 4000);
            }
          }
        } catch {
          if (inModal) {
            if (target === 'preparer') setModalPreparerSig(dataUrl);
            else setModalApproverSig(dataUrl);
          } else {
            const updated = {
              ...sigConfig,
              [target]: {
                ...sigConfig[target],
                signatureUrl: dataUrl
              }
            };
            setSigConfig(updated);
            localStorage.setItem('saaed_executive_signatures_v1', JSON.stringify(updated));
            setSigFeedbackToast(`تم رفع وتحديث صورة توقيع ${target === 'preparer' ? 'الإعداد' : 'الاعتماد'} بنجاح!`);
            setTimeout(() => setSigFeedbackToast(null), 4000);
          }
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  // Canvas Drawing Handlers
  const startDrawingSig = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setIsDrawingSig(true);
    setHasDrawnOnCanvas(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const drawSig = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingSig) return;
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.lineWidth = 2.8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawingSig = () => {
    setIsDrawingSig(false);
  };

  const clearSigCanvas = () => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawnOnCanvas(false);
  };

  const applyDrawnSig = (target: 'preparer' | 'approver') => {
    const canvas = sigCanvasRef.current;
    if (!canvas || !hasDrawnOnCanvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    if (target === 'preparer') {
      setModalPreparerSig(dataUrl);
    } else {
      setModalApproverSig(dataUrl);
    }
    setSigDrawTarget(null);
    clearSigCanvas();
  };

  // Quick period presets logic calculated dynamically from currentDate
  const handlePeriodChange = (preset: string) => {
    setPeriodPreset(preset);
    const [y, m, d] = currentDate.split('-').map(Number);

    if (preset === 'today') {
      setStartDate(currentDate);
      setEndDate(currentDate);
    } else if (preset === 'week') {
      // Calculate Monday of current week
      const currentDt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
      const dayOfWeek = currentDt.getUTCDay(); // 0 is Sun, 1 is Mon, 5 is Fri
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monDt = new Date(currentDt);
      monDt.setUTCDate(currentDt.getUTCDate() + mondayOffset);
      const friDt = new Date(monDt);
      friDt.setUTCDate(monDt.getUTCDate() + 4);
      setStartDate(monDt.toISOString().slice(0, 10));
      setEndDate(friDt.toISOString().slice(0, 10));
    } else if (preset === 'month') {
      setStartDate(dynamicFirstDay);
      setEndDate(dynamicLastDay);
    } else if (preset === 'quarter') {
      const q = Math.floor((m - 1) / 3);
      const qStartM = q * 3 + 1;
      const qEndM = qStartM + 2;
      const qDays = new Date(y, qEndM, 0).getDate();
      setStartDate(`${y}-${String(qStartM).padStart(2, '0')}-01`);
      setEndDate(`${y}-${String(qEndM).padStart(2, '0')}-${String(qDays).padStart(2, '0')}`);
    } else if (preset === 'year') {
      setStartDate(`${y}-01-01`);
      setEndDate(`${y}-12-31`);
    } else if (preset === 'all') {
      setStartDate(`${y}-01-01`);
      setEndDate(`${y}-12-31`);
    }
  };

  // Filtered dataset
  const filteredBookings = useMemo(() => {
    return filterBookingsByPeriodAndStatus(bookings, {
      startDate,
      endDate,
      roomId: selectedRoomId,
      departmentId: selectedDeptId,
      statusFilter: statusMode
    });
  }, [bookings, startDate, endDate, selectedRoomId, selectedDeptId, statusMode]);

  // Specific room stats (for Dana and Waha tabs)
  const danaRoom = rooms.find((r) => r.id === 'room-dana') || rooms[0];
  const wahaRoom = rooms.find((r) => r.id === 'room-waha') || rooms[1] || rooms[0];

  const danaStats = useMemo(() => {
    return calculateRoomDetailedStats('room-dana', filteredBookings, danaRoom);
  }, [filteredBookings, danaRoom]);

  const wahaStats = useMemo(() => {
    return calculateRoomDetailedStats('room-waha', filteredBookings, wahaRoom);
  }, [filteredBookings, wahaRoom]);

  // Primary Department + Date + Booking Count
  const deptDateStats = useMemo(() => {
    return getDepartmentDateStatistics(filteredBookings, selectedRoomId);
  }, [filteredBookings, selectedRoomId]);

  // Comprehensive Matrix for All Rooms
  const matrixStats = useMemo(() => {
    return getDepartmentMatrixStatistics(filteredBookings, rooms, departments);
  }, [filteredBookings, rooms, departments]);

  // Comparison metrics
  const comparisonMetrics = useMemo(() => {
    return getRoomComparisonMetrics(filteredBookings, danaRoom, wahaRoom);
  }, [filteredBookings, danaRoom, wahaRoom]);

  // KPI Calculations
  const totalBookingsCount = filteredBookings.length;
  const totalDurationMinutes = filteredBookings.reduce((sum, b) => sum + (b.durationMinutes || 0), 0);
  const totalHoursCount = Number((totalDurationMinutes / 60).toFixed(1));
  const distinctDeptsCount = new Set(filteredBookings.map((b) => b.departmentId)).size;
  const danaBookingsCount = filteredBookings.filter((b) => b.roomId === 'room-dana').length;
  const wahaBookingsCount = filteredBookings.filter((b) => b.roomId === 'room-waha').length;

  // Export handlers
  const handleExportExcel = () => {
    if (activeTab === 'primary_dept_date') {
      const headers = ['الإدارة', 'القاعة', 'التاريخ', 'اليوم', 'عدد مرات الحجز', 'إجمالي الساعات'];
      const rows = deptDateStats.map((item) => [
        item.departmentNameAr,
        item.roomNameAr,
        item.date,
        item.dayNameAr,
        item.bookingCount,
        item.totalHours
      ]);
      exportToExcelCsv('تقرير_حجوزات_الإدارات_والتواريخ_ساعد', headers, rows);
    } else if (activeTab === 'comprehensive_all') {
      const headers = ['الإدارة', 'حجوزات قاعة الدانة', 'حجوزات قاعة الواحة', 'إجمالي الحجوزات', 'إجمالي الساعات'];
      const rows = matrixStats.map((item) => [
        item.departmentNameAr,
        item.danaCount,
        item.wahaCount,
        item.totalCount,
        item.totalHours
      ]);
      exportToExcelCsv('الإحصائية_الشاملة_لجميع_القاعات_ساعد', headers, rows);
    } else if (activeTab === 'dana_stats') {
      const headers = ['الإدارة', 'عدد الحجوزات', 'إجمالي الساعات'];
      const rows = danaStats.byDepartment.map((d) => [d.departmentNameAr, d.count, d.hours]);
      exportToExcelCsv('إحصائيات_قاعة_الدانة_ساعد', headers, rows);
    } else if (activeTab === 'waha_stats') {
      const headers = ['الإدارة', 'عدد الحجوزات', 'إجمالي الساعات'];
      const rows = wahaStats.byDepartment.map((d) => [d.departmentNameAr, d.count, d.hours]);
      exportToExcelCsv('إحصائيات_قاعة_الواحة_ساعد', headers, rows);
    } else {
      const headers = ['المؤشر', 'قاعة الدانة', 'قاعة الواحة'];
      const rows = comparisonMetrics.map((m) => [m.metricAr, m.danaValue, m.wahaValue]);
      exportToExcelCsv('مقارنة_القاعات_الدانة_والواحة_ساعد', headers, rows);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const renderOfficialSignaturesBlock = (sectionTitle: string) => (
    <div className="pt-8 border-t border-slate-200 mt-6 space-y-4">
      {/* Controls bar (Hidden during printing) */}
      <div className="flex flex-wrap items-center justify-between gap-3 no-print bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
        <div className="flex items-center gap-2 text-slate-800 font-bold">
          <FileSignature className="w-4 h-4 text-blue-700 shrink-0" />
          <span>{sectionTitle}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => handleOpenSigModal('both')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-2xs transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
            title="تعديل المسميات والأسماء والتواقيع بالصورة"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>تعديل الإعداد والاعتماد والتواقيع</span>
          </button>
          <button
            type="button"
            onClick={handleResetSignatures}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-600 font-bold text-xs transition-colors cursor-pointer"
            title="استعادة القيم الافتراضية"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>الافتراضي</span>
          </button>
        </div>
      </div>

      {/* Feedback toast */}
      {sigFeedbackToast && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center justify-between no-print animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{sigFeedbackToast}</span>
          </div>
          <button onClick={() => setSigFeedbackToast(null)} className="p-0.5 text-emerald-600 hover:text-emerald-900 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2-Column Official Signatures Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs print:border-none print:p-2 print:shadow-none">
        
        {/* 1. الإعداد (Preparation) */}
        <div className="flex flex-col items-center text-center space-y-2 p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 print:bg-transparent print:border-none">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-100 text-blue-950 text-xs font-black tracking-wide print:bg-transparent print:text-slate-900 print:p-0">
            <span>إعداد / {sigConfig.preparer.title}</span>
          </div>

          <div className="space-y-0.5 pt-1">
            <div className="text-xs font-bold text-slate-900 flex items-center justify-center gap-1.5">
              <span className="text-slate-500 font-semibold text-[11px]">الاسم:</span>
              <span className="font-black text-slate-900 text-sm">{sigConfig.preparer.name}</span>
            </div>
            {sigConfig.preparer.roleTitle && (
              <div className="text-[11px] text-slate-500 font-medium">
                {sigConfig.preparer.roleTitle}
              </div>
            )}
          </div>

          {/* Signature Display (Image or Placeholder) */}
          <div className="relative group w-full py-2 flex flex-col items-center justify-center min-h-[80px]">
            {sigConfig.preparer.signatureUrl ? (
              <div className="h-18 flex items-center justify-center">
                <img
                  src={sigConfig.preparer.signatureUrl}
                  alt="توقيع الإعداد"
                  className="max-h-18 max-w-[220px] object-contain transition-transform group-hover:scale-105"
                />
              </div>
            ) : (
              <div className="h-16 border-b-2 border-dashed border-slate-400 w-48 flex items-center justify-center text-[10px] text-slate-400">
                التوقيع اليدوي المعتمد
              </div>
            )}

            {/* Quick Action Badges (no-print) */}
            <div className="no-print mt-2 flex flex-wrap items-center justify-center gap-1.5">
              <button
                type="button"
                onClick={() => handleOpenSigModal('preparer')}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-[10px] font-bold text-blue-700 flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
              >
                <PenTool className="w-3 h-3" />
                <span>تعديل التوقيع والبيانات</span>
              </button>
              <label className="cursor-pointer px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-[10px] font-bold text-slate-700 flex items-center gap-1 transition-colors shadow-2xs">
                <Upload className="w-3 h-3 text-slate-500" />
                <span>رفع صورة التوقيع</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleUploadSignatureFile(e, 'preparer')}
                  className="hidden"
                />
              </label>
              {sigConfig.preparer.signatureUrl && (
                <button
                  type="button"
                  onClick={() => {
                    const updated = {
                      ...sigConfig,
                      preparer: { ...sigConfig.preparer, signatureUrl: '' }
                    };
                    setSigConfig(updated);
                    localStorage.setItem(SIGNATURES_STORAGE_KEY, JSON.stringify(updated));
                    setSigFeedbackToast('تمت إزالة توقيع الإعداد بنجاح.');
                    setTimeout(() => setSigFeedbackToast(null), 3000);
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="حذف التوقيع"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="text-[11px] text-slate-400 font-mono pt-1">
            التاريخ: {sigConfig.preparer.date || currentDate}
          </div>
        </div>

        {/* 2. الاعتماد (Approval) */}
        <div className="flex flex-col items-center text-center space-y-2 p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 print:bg-transparent print:border-none">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-100 text-emerald-950 text-xs font-black tracking-wide print:bg-transparent print:text-slate-900 print:p-0">
            <span>اعتماد / {sigConfig.approver.title}</span>
          </div>

          <div className="space-y-0.5 pt-1">
            <div className="text-xs font-bold text-slate-900 flex items-center justify-center gap-1.5">
              <span className="text-slate-500 font-semibold text-[11px]">الاسم:</span>
              <span className="font-black text-slate-900 text-sm">{sigConfig.approver.name}</span>
            </div>
            {sigConfig.approver.roleTitle && (
              <div className="text-[11px] text-slate-500 font-medium">
                {sigConfig.approver.roleTitle}
              </div>
            )}
          </div>

          {/* Signature Display (Image or Placeholder) */}
          <div className="relative group w-full py-2 flex flex-col items-center justify-center min-h-[80px]">
            {sigConfig.approver.signatureUrl ? (
              <div className="h-18 flex items-center justify-center">
                <img
                  src={sigConfig.approver.signatureUrl}
                  alt="توقيع الاعتماد"
                  className="max-h-18 max-w-[220px] object-contain transition-transform group-hover:scale-105"
                />
              </div>
            ) : (
              <div className="h-16 border-b-2 border-dashed border-slate-400 w-48 flex items-center justify-center text-[10px] text-slate-400">
                التوقيع والاعتماد الرسمي
              </div>
            )}

            {/* Quick Action Badges (no-print) */}
            <div className="no-print mt-2 flex flex-wrap items-center justify-center gap-1.5">
              <button
                type="button"
                onClick={() => handleOpenSigModal('approver')}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 text-[10px] font-bold text-emerald-800 flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
              >
                <PenTool className="w-3 h-3" />
                <span>تعديل التوقيع والبيانات</span>
              </button>
              <label className="cursor-pointer px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 text-[10px] font-bold text-slate-700 flex items-center gap-1 transition-colors shadow-2xs">
                <Upload className="w-3 h-3 text-slate-500" />
                <span>رفع صورة التوقيع</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleUploadSignatureFile(e, 'approver')}
                  className="hidden"
                />
              </label>
              {sigConfig.approver.signatureUrl && (
                <button
                  type="button"
                  onClick={() => {
                    const updated = {
                      ...sigConfig,
                      approver: { ...sigConfig.approver, signatureUrl: '' }
                    };
                    setSigConfig(updated);
                    localStorage.setItem(SIGNATURES_STORAGE_KEY, JSON.stringify(updated));
                    setSigFeedbackToast('تمت إزالة توقيع الاعتماد بنجاح.');
                    setTimeout(() => setSigFeedbackToast(null), 3000);
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="حذف التوقيع"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="text-[11px] text-slate-400 font-mono pt-1">
            التاريخ: {sigConfig.approver.date || currentDate}
          </div>
        </div>

      </div>

    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Title & Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-800">
              <BarChart3 className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                إحصائيات وتحليلات حجز قاعات الاجتماعات
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                شركة ساعد للأنظمة المرورية • لوحة القياس والتحليلات المؤسسية
              </p>
            </div>
          </div>
        </div>

        {/* Global Export & Print Buttons */}
        <div className="flex items-center gap-2 no-print">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>تصدير Excel (CSV)</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة / PDF</span>
          </button>
        </div>
      </div>

      {/* Filter Control Bar (Prompt #50) */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4 no-print">
        
        {/* Quick Period Presets */}
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Calendar className="w-4 h-4 text-blue-700" />
            <span>الفترة الزمنية:</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'today', label: 'اليوم' },
              { id: 'week', label: 'هذا الأسبوع' },
              { id: 'month', label: 'هذا الشهر' },
              { id: 'quarter', label: 'هذا الربع' },
              { id: 'year', label: 'هذه السنة' },
              { id: 'all', label: 'جميع الفترات' }
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => handlePeriodChange(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  periodPreset === p.id
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Detailed Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          
          {/* Start Date */}
          <div>
            <label className="block text-slate-600 font-bold mb-1">من تاريخ:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPeriodPreset('custom');
              }}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 font-medium"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-slate-600 font-bold mb-1">إلى تاريخ:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPeriodPreset('custom');
              }}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 font-medium"
            />
          </div>

          {/* Room Filter */}
          <div>
            <label className="block text-slate-600 font-bold mb-1">القاعة:</label>
            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-semibold text-blue-900"
            >
              <option value="all">جميع القاعات</option>
              <option value="room-dana">قاعة الدانة فقط</option>
              <option value="room-waha">قاعة الواحة فقط</option>
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <label className="block text-slate-600 font-bold mb-1">الإدارة:</label>
            <select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-semibold text-slate-800"
            >
              <option value="all">جميع الإدارات</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nameAr}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter (Prompt #26) */}
          <div>
            <label className="block text-slate-600 font-bold mb-1">نوع الاحتساب:</label>
            <select
              value={statusMode}
              onChange={(e) => setStatusMode(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-semibold text-slate-800"
            >
              <option value="confirmed_completed">المؤكدة والمكتملة فقط (موصى به)</option>
              <option value="all">عرض جميع الحجوزات (بما فيها الملغاة)</option>
            </select>
          </div>

        </div>

      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold">إجمالي الحجوزات</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalBookingsCount}</div>
          <span className="text-[10px] text-slate-500">خلال الفترة المحددة</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold">ساعات الاستخدام</span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-800">{totalHoursCount}</div>
          <span className="text-[10px] text-slate-500">ساعة تشغيلية</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold">حجوزات الدانة</span>
            <DoorOpen className="w-4 h-4 text-blue-700" />
          </div>
          <div className="text-2xl font-black text-blue-900">{danaBookingsCount}</div>
          <span className="text-[10px] text-blue-600 font-semibold">{danaStats.totalHours} ساعة</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold">حجوزات الواحة</span>
            <DoorOpen className="w-4 h-4 text-indigo-700" />
          </div>
          <div className="text-2xl font-black text-indigo-900">{wahaBookingsCount}</div>
          <span className="text-[10px] text-indigo-600 font-semibold">{wahaStats.totalHours} ساعة</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold">الإدارات المستفيدة</span>
            <Building2 className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{distinctDeptsCount}</div>
          <span className="text-[10px] text-slate-500">إدارة نشطة</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold">نسبة الاستخدام</span>
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-900">
            {Math.round(((danaStats.utilizationRate + wahaStats.utilizationRate) / 2) || 0)}%
          </div>
          <span className="text-[10px] text-slate-500">معدل الإشغال العام</span>
        </div>

      </div>

      {/* Analytics Sub-Tabs (Prompt Requirements #14 to #21) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        
        {/* Navigation Tabs Header */}
        <div className="border-b border-slate-200 bg-slate-50/70 p-2 overflow-x-auto no-scrollbar flex items-center gap-1.5">
          {[
            { id: 'primary_dept_date', label: 'الإحصائية الأساسية (الإدارة + التاريخ)' },
            { id: 'comprehensive_all', label: 'الإحصائية الشاملة لجميع القاعات' },
            { id: 'dana_stats', label: 'إحصائيات قاعة الدانة' },
            { id: 'waha_stats', label: 'إحصائيات قاعة الواحة' },
            { id: 'comparison', label: 'مقارنة القاعات (الدانة VS الواحة)' },
            { id: 'ranking', label: 'ترتيب الإدارات الأكثر استخداماً' },
            { id: 'executive', label: 'التقرير التنفيذي للإدارة العليا' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap focus:outline-hidden ${
                activeTab === tab.id
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: الإحصائية الأساسية حسب الإدارة (Prompt #14 & #51) */}
        {activeTab === 'primary_dept_date' && (
          <div className="p-5 space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  إحصائية استخدام القاعات حسب الإدارة والتاريخ
                </h3>
                <p className="text-xs text-slate-500">
                  توضح اسم الإدارة التي حجزت القاعة + التاريخ + عدد مرات الحجز • انقر على أي سطر لعرض تفاصيل الحجوزات (Drill-down)
                </p>
              </div>
              <div className="text-xs bg-blue-50 text-blue-900 px-3 py-1.5 rounded-lg border border-blue-200 font-semibold self-start sm:self-auto">
                إجمالي السجلات: {deptDateStats.length}
              </div>
            </div>

            {deptDateStats.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                لا توجد حجوزات مسجلة تطابق معايير الفلترة المحددة.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-start border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="p-3 text-start">الإدارة الحاجزة</th>
                      <th className="p-3 text-start">القاعة</th>
                      <th className="p-3 text-start">التاريخ</th>
                      <th className="p-3 text-start">اليوم</th>
                      <th className="p-3 text-center">عدد مرات الحجز</th>
                      <th className="p-3 text-center">إجمالي الساعات</th>
                      <th className="p-3 text-center no-print">التفاصيل (Drill-down)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {deptDateStats.map((item, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                        onClick={() => {
                          setDrillDownTitle(`حجوزات ${item.departmentNameAr} في ${item.roomNameAr} بتاريخ ${item.date}`);
                          setDrillDownBookings(item.bookings);
                        }}
                      >
                        <td className="p-3 font-bold text-blue-950">
                          {item.departmentNameAr}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                            item.roomId === 'room-dana'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}>
                            {item.roomNameAr}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-semibold text-slate-800">
                          {item.date}
                        </td>
                        <td className="p-3 text-slate-600">
                          {item.dayNameAr}
                        </td>
                        <td className="p-3 text-center">
                          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-blue-100 text-blue-900 font-black text-xs group-hover:scale-110 transition-transform">
                            {item.bookingCount}
                          </span>
                        </td>
                        <td className="p-3 text-center font-bold text-slate-800">
                          {item.totalHours} س
                        </td>
                        <td className="p-3 text-center no-print">
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 text-[11px] text-blue-700 font-semibold hover:underline"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>عرض ({item.bookingCount})</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        )}

        {/* Tab 2: الإحصائية الشاملة لجميع القاعات (Prompt #15 & #51) */}
        {activeTab === 'comprehensive_all' && (
          <div className="p-5 space-y-4">
            
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                الإحصائية الشاملة لجميع القاعات (جدول موحد)
              </h3>
              <p className="text-xs text-slate-500">
                مصفوفة استخدام القاعات [ الإدارة | الدانة | الواحة | الإجمالي | الساعات ]
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-start border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="p-3 text-start">الإدارة</th>
                    <th className="p-3 text-center">حجوزات قاعة الدانة</th>
                    <th className="p-3 text-center">حجوزات قاعة الواحة</th>
                    <th className="p-3 text-center bg-blue-100/60 text-blue-900">إجمالي الحجوزات</th>
                    <th className="p-3 text-center">إجمالي الساعات</th>
                    <th className="p-3 text-center no-print">التفاصيل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {matrixStats.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-bold text-slate-900 text-sm">
                        {item.departmentNameAr}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => {
                            const bks = filteredBookings.filter(
                              (b) => b.departmentId === item.departmentId && b.roomId === 'room-dana'
                            );
                            setDrillDownTitle(`حجوزات ${item.departmentNameAr} في قاعة الدانة`);
                            setDrillDownBookings(bks);
                          }}
                          className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 font-bold hover:bg-blue-100"
                        >
                          {item.danaCount}
                        </button>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => {
                            const bks = filteredBookings.filter(
                              (b) => b.departmentId === item.departmentId && b.roomId === 'room-waha'
                            );
                            setDrillDownTitle(`حجوزات ${item.departmentNameAr} في قاعة الواحة`);
                            setDrillDownBookings(bks);
                          }}
                          className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-800 font-bold hover:bg-indigo-100"
                        >
                          {item.wahaCount}
                        </button>
                      </td>
                      <td className="p-3 text-center bg-blue-50/50 font-black text-sm text-blue-950">
                        {item.totalCount}
                      </td>
                      <td className="p-3 text-center font-bold text-slate-800">
                        {item.totalHours} ساعة
                      </td>
                      <td className="p-3 text-center no-print">
                        <button
                          onClick={() => {
                            const bks = filteredBookings.filter((b) => b.departmentId === item.departmentId);
                            setDrillDownTitle(`جميع حجوزات ${item.departmentNameAr}`);
                            setDrillDownBookings(bks);
                          }}
                          className="text-blue-700 hover:underline font-semibold"
                        >
                          عرض الكل
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Official Signatures Block (Preparation, Approval, and Image Signatures) */}
            {renderOfficialSignaturesBlock('بيانات الإعداد والاعتماد والتواقيع المعتمدة للإحصائية الشاملة (جميع الإحصائيات):')}

          </div>
        )}

        {/* Tab 3: إحصائيات قاعة الدانة المستقلة (Prompt #16, #17, #18) */}
        {activeTab === 'dana_stats' && (
          <div className="p-5 space-y-6">
            
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-blue-900 flex items-center gap-2">
                  <DoorOpen className="w-5 h-5 text-blue-700" />
                  <span>إحصائيات وتحليلات قاعة الدانة</span>
                </h3>
                <p className="text-xs text-slate-500">
                  تحليل كامل ومستقل لقاعة الدانة لكبار المسؤولين ومجالس الإدارة
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
                DANA-01
              </span>
            </div>

            {/* Dana KPI Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200">
                <span className="text-slate-500 text-[11px] font-bold block">إجمالي عدد الحجوزات</span>
                <span className="text-2xl font-black text-blue-900">{danaStats.totalBookings} حجز</span>
              </div>
              <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200">
                <span className="text-slate-500 text-[11px] font-bold block">إجمالي ساعات الاستخدام</span>
                <span className="text-2xl font-black text-blue-900">{danaStats.totalHours} ساعة</span>
              </div>
              <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200">
                <span className="text-slate-500 text-[11px] font-bold block">أكثر إدارة استخداماً</span>
                <span className="text-sm font-black text-blue-950 block truncate mt-1">
                  {danaStats.topDepartment?.nameAr || 'لا توجد بيانات'}
                </span>
                <span className="text-[10px] text-blue-700 font-bold">({danaStats.topDepartment?.count || 0} حجز)</span>
              </div>
              <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200">
                <span className="text-slate-500 text-[11px] font-bold block">أكثر فترة ازدحاماً</span>
                <span className="text-sm font-black text-blue-900 block mt-1">
                  {danaStats.peakTimeSlot?.slot || '09:00 ص – 11:00 ص'}
                </span>
                <span className="text-[10px] text-slate-500">نسبة الاستخدام: {danaStats.utilizationRate}%</span>
              </div>
            </div>

            {/* Table 1: استخدام الدانة حسب الإدارة (Prompt #17) */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                جدول إحصائيات قاعة الدانة حسب الإدارة
              </h4>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-xs text-start">
                  <thead className="bg-slate-100 font-bold text-slate-700">
                    <tr>
                      <th className="p-3 text-start">الإدارة</th>
                      <th className="p-3 text-center">عدد مرات الحجز</th>
                      <th className="p-3 text-center">إجمالي ساعات الحجز</th>
                      <th className="p-3 text-center">نسبة الاستخدام من القاعة</th>
                      <th className="p-3 text-center no-print">التفاصيل</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {danaStats.byDepartment.map((d, i) => (
                      <tr key={i} className="hover:bg-blue-50/40">
                        <td className="p-3 font-bold text-slate-900">{d.departmentNameAr}</td>
                        <td className="p-3 text-center font-bold text-blue-900">{d.count}</td>
                        <td className="p-3 text-center font-semibold">{d.hours} س</td>
                        <td className="p-3 text-center font-semibold text-slate-700">
                          {danaStats.totalBookings > 0 ? Math.round((d.count / danaStats.totalBookings) * 100) : 0}%
                        </td>
                        <td className="p-3 text-center no-print">
                          <button
                            onClick={() => {
                              const bks = filteredBookings.filter(
                                (b) => b.roomId === 'room-dana' && b.departmentNameAr === d.departmentNameAr
                              );
                              setDrillDownTitle(`حجوزات ${d.departmentNameAr} في قاعة الدانة`);
                              setDrillDownBookings(bks);
                            }}
                            className="text-blue-700 hover:underline font-bold"
                          >
                            عرض الحجوزات
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Table 2: سجل قاعة الدانة حسب التاريخ (Prompt #18) */}
            <div className="space-y-2 pt-2">
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                سجل استخدام قاعة الدانة حسب التاريخ
              </h4>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-xs text-start">
                  <thead className="bg-slate-100 font-bold text-slate-700">
                    <tr>
                      <th className="p-3 text-start">التاريخ</th>
                      <th className="p-3 text-start">الإدارة</th>
                      <th className="p-3 text-center">عدد الحجوزات</th>
                      <th className="p-3 text-center">إجمالي الساعات</th>
                      <th className="p-3 text-center text-emerald-800">الحجوزات المؤكدة</th>
                      <th className="p-3 text-center text-rose-800">الحجوزات الملغاة</th>
                      <th className="p-3 text-center no-print">التفاصيل</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {danaStats.byDateLog.map((log, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-slate-800">{log.date}</td>
                        <td className="p-3 font-semibold text-slate-900">{log.departmentNameAr}</td>
                        <td className="p-3 text-center font-bold text-blue-900">{log.count}</td>
                        <td className="p-3 text-center font-semibold">{log.hours} س</td>
                        <td className="p-3 text-center font-bold text-emerald-700">{log.confirmed}</td>
                        <td className="p-3 text-center font-bold text-rose-700">{log.cancelled}</td>
                        <td className="p-3 text-center no-print">
                          <button
                            onClick={() => {
                              setDrillDownTitle(`حجوزات ${log.departmentNameAr} في الدانة بتاريخ ${log.date}`);
                              setDrillDownBookings(log.bookings);
                            }}
                            className="text-blue-700 hover:underline font-bold"
                          >
                            عرض ({log.count})
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* Tab 4: إحصائيات قاعة الواحة المستقلة (Prompt #19) */}
        {activeTab === 'waha_stats' && (
          <div className="p-5 space-y-6">
            
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-indigo-900 flex items-center gap-2">
                  <DoorOpen className="w-5 h-5 text-indigo-700" />
                  <span>إحصائيات وتحليلات قاعة الواحة</span>
                </h3>
                <p className="text-xs text-slate-500">
                  تحليل كامل ومستقل لقاعة الواحة متعددة الأغراض لفرق المشاريع والتدريب
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold">
                WAHA-02
              </span>
            </div>

            {/* Waha KPI Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-indigo-50/80 border border-indigo-200">
                <span className="text-slate-500 text-[11px] font-bold block">إجمالي عدد الحجوزات</span>
                <span className="text-2xl font-black text-indigo-900">{wahaStats.totalBookings} حجز</span>
              </div>
              <div className="p-4 rounded-xl bg-indigo-50/80 border border-indigo-200">
                <span className="text-slate-500 text-[11px] font-bold block">إجمالي ساعات الاستخدام</span>
                <span className="text-2xl font-black text-indigo-900">{wahaStats.totalHours} ساعة</span>
              </div>
              <div className="p-4 rounded-xl bg-indigo-50/80 border border-indigo-200">
                <span className="text-slate-500 text-[11px] font-bold block">أكثر إدارة استخداماً</span>
                <span className="text-sm font-black text-indigo-950 block truncate mt-1">
                  {wahaStats.topDepartment?.nameAr || 'لا توجد بيانات'}
                </span>
                <span className="text-[10px] text-indigo-700 font-bold">({wahaStats.topDepartment?.count || 0} حجز)</span>
              </div>
              <div className="p-4 rounded-xl bg-indigo-50/80 border border-indigo-200">
                <span className="text-slate-500 text-[11px] font-bold block">أكثر فترة ازدحاماً</span>
                <span className="text-sm font-black text-indigo-900 block mt-1">
                  {wahaStats.peakTimeSlot?.slot || '10:00 ص – 12:00 م'}
                </span>
                <span className="text-[10px] text-slate-500">نسبة الاستخدام: {wahaStats.utilizationRate}%</span>
              </div>
            </div>

            {/* Table 1: استخدام الواحة حسب الإدارة */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                جدول إحصائيات قاعة الواحة حسب الإدارة
              </h4>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-xs text-start">
                  <thead className="bg-slate-100 font-bold text-slate-700">
                    <tr>
                      <th className="p-3 text-start">الإدارة</th>
                      <th className="p-3 text-center">عدد مرات الحجز</th>
                      <th className="p-3 text-center">إجمالي ساعات الحجز</th>
                      <th className="p-3 text-center">نسبة الاستخدام من القاعة</th>
                      <th className="p-3 text-center no-print">التفاصيل</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {wahaStats.byDepartment.map((d, i) => (
                      <tr key={i} className="hover:bg-indigo-50/40">
                        <td className="p-3 font-bold text-slate-900">{d.departmentNameAr}</td>
                        <td className="p-3 text-center font-bold text-indigo-900">{d.count}</td>
                        <td className="p-3 text-center font-semibold">{d.hours} س</td>
                        <td className="p-3 text-center font-semibold text-slate-700">
                          {wahaStats.totalBookings > 0 ? Math.round((d.count / wahaStats.totalBookings) * 100) : 0}%
                        </td>
                        <td className="p-3 text-center no-print">
                          <button
                            onClick={() => {
                              const bks = filteredBookings.filter(
                                (b) => b.roomId === 'room-waha' && b.departmentNameAr === d.departmentNameAr
                              );
                              setDrillDownTitle(`حجوزات ${d.departmentNameAr} في قاعة الواحة`);
                              setDrillDownBookings(bks);
                            }}
                            className="text-indigo-700 hover:underline font-bold"
                          >
                            عرض الحجوزات
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Table 2: سجل استخدام قاعة الواحة حسب التاريخ */}
            <div className="space-y-2 pt-2">
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                سجل استخدام قاعة الواحة حسب التاريخ
              </h4>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-xs text-start">
                  <thead className="bg-slate-100 font-bold text-slate-700">
                    <tr>
                      <th className="p-3 text-start">التاريخ</th>
                      <th className="p-3 text-start">الإدارة</th>
                      <th className="p-3 text-center">عدد الحجوزات</th>
                      <th className="p-3 text-center">إجمالي الساعات</th>
                      <th className="p-3 text-center text-emerald-800">الحجوزات المؤكدة</th>
                      <th className="p-3 text-center text-rose-800">الحجوزات الملغاة</th>
                      <th className="p-3 text-center no-print">التفاصيل</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {wahaStats.byDateLog.map((log, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-slate-800">{log.date}</td>
                        <td className="p-3 font-semibold text-slate-900">{log.departmentNameAr}</td>
                        <td className="p-3 text-center font-bold text-indigo-900">{log.count}</td>
                        <td className="p-3 text-center font-semibold">{log.hours} س</td>
                        <td className="p-3 text-center font-bold text-emerald-700">{log.confirmed}</td>
                        <td className="p-3 text-center font-bold text-rose-700">{log.cancelled}</td>
                        <td className="p-3 text-center no-print">
                          <button
                            onClick={() => {
                              setDrillDownTitle(`حجوزات ${log.departmentNameAr} في الواحة بتاريخ ${log.date}`);
                              setDrillDownBookings(log.bookings);
                            }}
                            className="text-indigo-700 hover:underline font-bold"
                          >
                            عرض ({log.count})
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* Tab 5: مقارنة استخدام القاعات (الدانة VS الواحة) (Prompt #20) */}
        {activeTab === 'comparison' && (
          <div className="p-5 space-y-6">
            
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                مقارنة استخدام القاعات: قاعة الدانة مقابل قاعة الواحة
              </h3>
              <p className="text-xs text-slate-500">
                مقارنة مباشرة للمؤشرات التشغيلية ونسب الاستخدام ومتوسط مدد الاجتماعات
              </p>
            </div>

            {/* Direct Comparison Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-start">
                <thead className="bg-slate-100 font-bold text-slate-700">
                  <tr>
                    <th className="p-3.5 text-start">المؤشر التشغيلي</th>
                    <th className="p-3.5 text-center bg-blue-50 text-blue-900 font-black text-sm">
                      قاعة الدانة (Al Dana)
                    </th>
                    <th className="p-3.5 text-center bg-indigo-50 text-indigo-900 font-black text-sm">
                      قاعة الواحة (Al Waha)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {comparisonMetrics.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-3.5 font-bold text-slate-900">
                        {item.metricAr}
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {item.metricEn}
                        </span>
                      </td>
                      <td className="p-3.5 text-center font-bold text-blue-950 bg-blue-50/20 text-sm">
                        {item.danaValue}
                      </td>
                      <td className="p-3.5 text-center font-bold text-indigo-950 bg-indigo-50/20 text-sm">
                        {item.wahaValue}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Visual Progress Comparison Bar */}
            <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
              <h4 className="font-bold text-xs text-slate-700">
                توزيع الحجوزات الكلي بين القاعتين:
              </h4>
              <div className="h-6 w-full rounded-full overflow-hidden flex bg-slate-200 shadow-inner">
                <div
                  style={{
                    width: `${
                      totalBookingsCount > 0
                        ? (danaBookingsCount / totalBookingsCount) * 100
                        : 50
                    }%`
                  }}
                  className="bg-blue-600 flex items-center justify-center text-[10px] text-white font-bold"
                >
                  الدانة ({danaBookingsCount})
                </div>
                <div
                  style={{
                    width: `${
                      totalBookingsCount > 0
                        ? (wahaBookingsCount / totalBookingsCount) * 100
                        : 50
                    }%`
                  }}
                  className="bg-indigo-600 flex items-center justify-center text-[10px] text-white font-bold"
                >
                  الواحة ({wahaBookingsCount})
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Tab 6: ترتيب الإدارات حسب الاستخدام (Prompt #21) */}
        {activeTab === 'ranking' && (
          <div className="p-5 space-y-4">
            
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                ترتيب الإدارات حسب استخدام قاعات الاجتماعات (Ranking)
              </h3>
              <p className="text-xs text-slate-500">
                الإدارات الأكثر طلباً وتنظيماً للاجتماعات داخل شركة ساعد
              </p>
            </div>

            <div className="space-y-3">
              {matrixStats.map((item, idx) => {
                const maxCount = matrixStats[0]?.totalCount || 1;
                const percentage = Math.round((item.totalCount / maxCount) * 100);

                return (
                  <div
                    key={item.departmentId}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-all shadow-2xs space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs ${
                            idx === 0
                              ? 'bg-amber-400 text-amber-950 ring-2 ring-amber-300'
                              : idx === 1
                              ? 'bg-slate-300 text-slate-900'
                              : idx === 2
                              ? 'bg-amber-700 text-white'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <span className="font-bold text-slate-900 text-sm">
                          {item.departmentNameAr}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-bold">
                        <span className="text-blue-900 font-black">
                          {item.totalCount} حجز
                        </span>
                        <span className="text-slate-500 font-semibold">
                          ({item.totalHours} ساعة)
                        </span>
                        <button
                          onClick={() => {
                            const bks = filteredBookings.filter((b) => b.departmentId === item.departmentId);
                            setDrillDownTitle(`حجوزات ${item.departmentNameAr}`);
                            setDrillDownBookings(bks);
                          }}
                          className="text-blue-600 hover:underline text-xs"
                        >
                          عرض الحجوزات
                        </button>
                      </div>
                    </div>

                    {/* Usage Progress Bar */}
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* Tab 7: التقرير التنفيذي للإدارة العليا (Prompt #31) */}
        {activeTab === 'executive' && (
          <div className="p-6 space-y-6 print-page-break">
            
            {/* Header for Executive Report */}
            <div className="border-b-2 border-blue-900 pb-4 flex items-center justify-between">
              <div>
                <SaaedLogo className="h-10 w-auto mb-2" />
                <h2 className="text-xl font-black text-slate-900">
                  التقرير التنفيذي لاستخدام قاعات الاجتماعات
                </h2>
                <p className="text-xs text-slate-500">
                  شركة ساعد للأنظمة المرورية • الفترة: من {startDate} إلى {endDate}
                </p>
              </div>
              <div className="text-end text-xs text-slate-500">
                <span className="font-bold text-slate-800 block">نظام إدارة وحجز القاعات</span>
                <span>تاريخ التقرير: {currentDate}</span>
              </div>
            </div>

            {/* Executive Highlights Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-300">
              <div>
                <span className="text-xs text-slate-500 block">إجمالي الحجوزات</span>
                <span className="text-2xl font-black text-blue-900">{totalBookingsCount}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">إجمالي الساعات</span>
                <span className="text-2xl font-black text-emerald-800">{totalHoursCount} س</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">أكثر إدارة نشاطاً</span>
                <span className="text-sm font-bold text-slate-900 block truncate">
                  {matrixStats[0]?.departmentNameAr || 'لا يوجد'}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">معدل الإشغال الكلي</span>
                <span className="text-2xl font-black text-purple-900">
                  {Math.round(((danaStats.utilizationRate + wahaStats.utilizationRate) / 2) || 0)}%
                </span>
              </div>
            </div>

            {/* Executive Summary Points */}
            <div className="space-y-2 text-xs text-slate-700 leading-relaxed bg-white p-4 rounded-xl border border-slate-200">
              <h4 className="font-bold text-slate-900 text-sm mb-2">أهم المؤشرات والاستنتاجات:</h4>
              <ul className="list-disc list-inside space-y-1.5">
                <li>
                  استقبلت قاعة <strong>الدانة</strong> ما مجموعه {danaBookingsCount} حجزاً بإجمالي {danaStats.totalHours} ساعة، وكانت أكثر إدارة استخداماً لها هي ({danaStats.topDepartment?.nameAr || 'غير محدد'}).
                </li>
                <li>
                  استقبلت قاعة <strong>الواحة</strong> ما مجموعه {wahaBookingsCount} حجزاً بإجمالي {wahaStats.totalHours} ساعة تشغيلية.
                </li>
                <li>
                  بلغ عدد الإدارات التي استفادت من القاعات خلال الفترة {distinctDeptsCount} إدارات مختلفة، وتصدرت ({matrixStats[0]?.departmentNameAr}) قائمة الإدارات الأكثر استخداماً.
                </li>
                <li>
                  تم الالتزام التام بنظام منع التعارض الآلي والعمل خلال أيام الدوام الرسمي (الاثنين - الجمعة).
                </li>
              </ul>
            </div>

            {/* New Executive Section: Yearly Monthly Statistics for Al Dana and Al Waha by Department */}
            <div className="bg-white rounded-2xl border border-slate-300 p-5 sm:p-6 shadow-xs space-y-5 print:border-slate-400">
              
              {/* Section Header & Interactive Controls */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-blue-900 font-black text-base sm:text-lg">
                    <Calendar className="w-5 h-5 text-blue-700" />
                    <span>إحصائية الحجوزات السنوية الشهرية للإدارات (قاعة الدانة وقاعة الواحة)</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    توزيع حجوزات قاعتي الدانة والواحة عبر جميع أشهر السنة ({executiveYear}) لكل إدارة بشكل منفصل، مع المجموع الإجمالي لكافة الإدارات
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 no-print">
                  {/* Professional Year Selector: Current Year to 2050 */}
                  <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-300 shadow-2xs hover:border-blue-400 transition-colors">
                    <Calendar className="w-4 h-4 text-blue-700 shrink-0" />
                    <span className="text-xs font-bold text-slate-700 whitespace-nowrap">سنة التقرير:</span>

                    {/* Stepper Down (Previous Year) in RTL: button to decrease year if > minYear */}
                    <button
                      type="button"
                      disabled={executiveYear <= (currYearNum || new Date().getFullYear())}
                      onClick={() => setExecutiveYear((prev) => Math.max((currYearNum || new Date().getFullYear()), prev - 1))}
                      className="p-1 rounded-lg hover:bg-slate-100 disabled:opacity-25 disabled:pointer-events-none text-slate-500 hover:text-slate-800 transition-colors"
                      title="السنة السابقة"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <div className="relative">
                      <select
                        value={executiveYear}
                        onChange={(e) => setExecutiveYear(Number(e.target.value))}
                        className="appearance-none bg-blue-50/80 hover:bg-blue-100/70 border border-blue-200 text-blue-950 font-black font-mono text-xs rounded-lg px-2.5 py-1 pe-7 focus:ring-2 focus:ring-blue-600 focus:outline-hidden cursor-pointer transition-colors"
                      >
                        {executiveYears.map((yr) => (
                          <option key={yr} value={yr} className="text-slate-900 font-bold font-mono">
                            {yr} {yr === currYearNum ? ' (السنة الحالية)' : ''}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-blue-700 absolute end-1.5 top-2 pointer-events-none" />
                    </div>

                    {/* Stepper Up (Next Year) in RTL: button to increase year up to 2050 */}
                    <button
                      type="button"
                      disabled={executiveYear >= 2050}
                      onClick={() => setExecutiveYear((prev) => Math.min(2050, prev + 1))}
                      className="p-1 rounded-lg hover:bg-slate-100 disabled:opacity-25 disabled:pointer-events-none text-slate-500 hover:text-slate-800 transition-colors"
                      title="السنة القادمة (حتى 2050)"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>

                    {/* Quick reset to current year if a future year is chosen */}
                    {executiveYear !== currYearNum && (
                      <button
                        type="button"
                        onClick={() => setExecutiveYear(currYearNum)}
                        className="px-2 py-0.5 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold flex items-center gap-1 transition-colors"
                        title={`العودة للسنة الحالية (${currYearNum})`}
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>السنة الحالية ({currYearNum})</span>
                      </button>
                    )}
                  </div>

                  {/* View mode toggle */}
                  <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setExecutiveViewMode('matrix')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        executiveViewMode === 'matrix'
                          ? 'bg-blue-700 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      المصفوفة السنوية (12 شهراً)
                    </button>
                    <button
                      type="button"
                      onClick={() => setExecutiveViewMode('monthly_detail')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        executiveViewMode === 'monthly_detail'
                          ? 'bg-blue-700 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      التفصيل الشهري (شهر بشهر)
                    </button>
                  </div>

                  {/* Export button */}
                  <button
                    type="button"
                    onClick={() => exportYearlyMonthlyToExcelCsv(yearlyExecutiveStats)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors"
                    title="تصدير هذه الإحصائية إلى ملف Excel / CSV"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>تصدير Excel</span>
                  </button>
                </div>
              </div>

              {/* 4 Annual KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 text-xs">
                <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-950">
                  <span className="text-[11px] font-semibold text-blue-700 block mb-1">
                    المجموع الإجمالي لكافة الإدارات ({executiveYear})
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-blue-900">
                      {yearlyExecutiveStats.grandTotalAllDepartmentsYear}
                    </span>
                    <span className="text-xs font-bold text-blue-700">حجز معتمد</span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    إجمالي الساعات: {yearlyExecutiveStats.grandTotalHoursYear} ساعة
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200 text-indigo-950">
                  <span className="text-[11px] font-semibold text-indigo-700 block mb-1">
                    إجمالي حجوزات قاعة الدانة
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-indigo-900">
                      {yearlyExecutiveStats.grandTotalDanaYear}
                    </span>
                    <span className="text-xs font-bold text-indigo-700">حجز</span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    النسبة: {yearlyExecutiveStats.grandTotalAllDepartmentsYear > 0 ? Math.round((yearlyExecutiveStats.grandTotalDanaYear / yearlyExecutiveStats.grandTotalAllDepartmentsYear) * 100) : 0}% من إجمالي القاعات
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-950">
                  <span className="text-[11px] font-semibold text-emerald-700 block mb-1">
                    إجمالي حجوزات قاعة الواحة
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-emerald-900">
                      {yearlyExecutiveStats.grandTotalWahaYear}
                    </span>
                    <span className="text-xs font-bold text-emerald-700">حجز</span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    النسبة: {yearlyExecutiveStats.grandTotalAllDepartmentsYear > 0 ? Math.round((yearlyExecutiveStats.grandTotalWahaYear / yearlyExecutiveStats.grandTotalAllDepartmentsYear) * 100) : 0}% من إجمالي القاعات
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-950">
                  <span className="text-[11px] font-semibold text-amber-700 block mb-1">
                    الشهر الأكثر نشاطاً في السنة
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-base sm:text-lg font-black text-amber-900 truncate">
                      {yearlyExecutiveStats.peakMonth?.monthNameAr || 'لا توجد حجوزات'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-600 mt-1 block">
                    {yearlyExecutiveStats.peakMonth ? `${yearlyExecutiveStats.peakMonth.totalCount} حجز خلال الشهر` : 'في انتظار تسجيل الحجوزات'}
                  </span>
                </div>
              </div>

              {/* View 1: 12-Month Matrix View */}
              {executiveViewMode === 'matrix' && (
                <div className="space-y-3">
                  {/* Matrix Hall Display Mode Buttons */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs no-print">
                    <div className="flex items-center gap-1.5 font-bold text-slate-700">
                      <span>نمط عرض القاعات في المصفوفة:</span>
                    </div>
                    <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-[11px] font-bold">
                      <button
                        type="button"
                        onClick={() => setExecutiveHallDisplayMode('split')}
                        className={`px-2.5 py-1 rounded-md transition-all ${
                          executiveHallDisplayMode === 'split'
                            ? 'bg-white text-blue-900 shadow-2xs font-black'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        تفصيل القاعتين (الدانة + الواحة)
                      </button>
                      <button
                        type="button"
                        onClick={() => setExecutiveHallDisplayMode('dana')}
                        className={`px-2.5 py-1 rounded-md transition-all ${
                          executiveHallDisplayMode === 'dana'
                            ? 'bg-blue-700 text-white shadow-2xs font-black'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        قاعة الدانة فقط
                      </button>
                      <button
                        type="button"
                        onClick={() => setExecutiveHallDisplayMode('waha')}
                        className={`px-2.5 py-1 rounded-md transition-all ${
                          executiveHallDisplayMode === 'waha'
                            ? 'bg-emerald-700 text-white shadow-2xs font-black'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        قاعة الواحة فقط
                      </button>
                      <button
                        type="button"
                        onClick={() => setExecutiveHallDisplayMode('combined')}
                        className={`px-2.5 py-1 rounded-md transition-all ${
                          executiveHallDisplayMode === 'combined'
                            ? 'bg-slate-800 text-white shadow-2xs font-black'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        المجموع المدمج
                      </button>
                    </div>
                  </div>

                  {/* Horizontal Matrix Table */}
                  <div className="border border-slate-300 rounded-xl overflow-x-auto shadow-2xs">
                    <table className="w-full text-xs text-start border-collapse min-w-[950px]">
                      <thead>
                        <tr className="bg-slate-800 text-white font-bold border-b border-slate-700">
                          <th className="p-3 text-start sticky right-0 bg-slate-800 z-10 w-48 shadow-xs">
                            الإدارة / القسم
                          </th>
                          {yearlyExecutiveStats.months.map((m) => (
                            <th key={m.monthIndex} className="p-2.5 text-center whitespace-nowrap min-w-[62px]">
                              <div>{m.monthNameAr}</div>
                              <div className="text-[9px] font-normal text-slate-300 font-mono">شهر {m.monthIndex}</div>
                            </th>
                          ))}
                          <th className="p-2.5 text-center bg-indigo-900/90 text-indigo-100 whitespace-nowrap min-w-[70px]">
                            الدانة
                          </th>
                          <th className="p-2.5 text-center bg-emerald-900/90 text-emerald-100 whitespace-nowrap min-w-[70px]">
                            الواحة
                          </th>
                          <th className="p-2.5 text-center bg-blue-950 text-white whitespace-nowrap min-w-[85px]">
                            المجموع الإجمالي
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {yearlyExecutiveStats.departmentYearlyTotals.map((dept, idx) => {
                          const isEven = idx % 2 === 0;
                          return (
                            <tr key={dept.departmentId} className={isEven ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/50 hover:bg-slate-100/60'}>
                              {/* Department Name (sticky right in RTL) */}
                              <td className="p-2.5 font-bold text-slate-900 sticky right-0 bg-inherit z-10 border-l border-slate-200">
                                <div className="flex items-center gap-1.5">
                                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span className="truncate max-w-[180px]">{dept.departmentNameAr}</span>
                                </div>
                              </td>

                              {/* 12 Months Cells */}
                              {yearlyExecutiveStats.months.map((m) => {
                                const mData = dept.byMonth[m.monthIndex];
                                const hasData = mData && mData.total > 0;

                                return (
                                  <td key={m.monthIndex} className="p-2 text-center text-[11px] border-l border-slate-100">
                                    {hasData ? (
                                      executiveHallDisplayMode === 'split' ? (
                                        <div className="flex flex-col items-center gap-0.5 font-mono">
                                          <div className="flex items-center justify-center gap-1 text-[10px]">
                                            <span className="px-1 py-0.2 rounded bg-indigo-100 text-indigo-800 font-bold" title="حجوزات قاعة الدانة">
                                              د:{mData.dana}
                                            </span>
                                            <span className="px-1 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold" title="حجوزات قاعة الواحة">
                                              و:{mData.waha}
                                            </span>
                                          </div>
                                          <span className="text-[11px] font-black text-slate-900">
                                            {mData.total}
                                          </span>
                                        </div>
                                      ) : executiveHallDisplayMode === 'dana' ? (
                                        <span className={`font-mono font-bold ${mData.dana > 0 ? 'text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded' : 'text-slate-300'}`}>
                                          {mData.dana}
                                        </span>
                                      ) : executiveHallDisplayMode === 'waha' ? (
                                        <span className={`font-mono font-bold ${mData.waha > 0 ? 'text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded' : 'text-slate-300'}`}>
                                          {mData.waha}
                                        </span>
                                      ) : (
                                        <span className="font-mono font-black text-blue-900 bg-blue-50 px-1.5 py-0.5 rounded">
                                          {mData.total}
                                        </span>
                                      )
                                    ) : (
                                      <span className="text-slate-300 font-mono text-[10px]">-</span>
                                    )}
                                  </td>
                                );
                              })}

                              {/* Department Annual Totals: Dana, Waha, Grand Total */}
                              <td className="p-2 text-center font-mono font-bold text-indigo-900 bg-indigo-50/40 border-l border-slate-200">
                                {dept.danaTotalYear}
                              </td>
                              <td className="p-2 text-center font-mono font-bold text-emerald-900 bg-emerald-50/40 border-l border-slate-200">
                                {dept.wahaTotalYear}
                              </td>
                              <td className="p-2 text-center font-mono font-black text-blue-950 bg-blue-100/60 text-xs">
                                {dept.grandTotalYear}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>

                      {/* Footer Row: Grand Total for All Departments across each month and whole year */}
                      <tfoot>
                        <tr className="bg-slate-900 text-white font-black text-xs border-t-2 border-slate-800">
                          <td className="p-3 text-start sticky right-0 bg-slate-900 z-10 border-l border-slate-700">
                            <div className="flex items-center gap-1.5">
                              <Award className="w-4 h-4 text-amber-400 shrink-0" />
                              <span>المجموع الإجمالي لكافة الإدارات</span>
                            </div>
                          </td>

                          {/* Month totals for all departments */}
                          {yearlyExecutiveStats.months.map((m) => (
                            <td key={m.monthIndex} className="p-2 text-center font-mono border-l border-slate-800 text-[11px]">
                              {m.totalAllDepartments > 0 ? (
                                executiveHallDisplayMode === 'split' ? (
                                  <div className="flex flex-col items-center gap-0.5">
                                    <div className="flex items-center justify-center gap-1 text-[9px]">
                                      <span className="text-indigo-300 font-mono" title="إجمالي الدانة لكافة الإدارات">
                                        د:{m.totalDana}
                                      </span>
                                      <span className="text-emerald-300 font-mono" title="إجمالي الواحة لكافة الإدارات">
                                        و:{m.totalWaha}
                                      </span>
                                    </div>
                                    <span className="text-amber-300 font-black text-xs">
                                      {m.totalAllDepartments}
                                    </span>
                                  </div>
                                ) : executiveHallDisplayMode === 'dana' ? (
                                  <span className="text-indigo-300 font-bold">
                                    {m.totalDana}
                                  </span>
                                ) : executiveHallDisplayMode === 'waha' ? (
                                  <span className="text-emerald-300 font-bold">
                                    {m.totalWaha}
                                  </span>
                                ) : (
                                  <span className="text-amber-300 font-black text-xs">
                                    {m.totalAllDepartments}
                                  </span>
                                )
                              ) : (
                                <span className="text-slate-500 font-mono text-[10px]">-</span>
                              )}
                            </td>
                          ))}

                          {/* Grand Totals */}
                          <td className="p-2.5 text-center font-mono font-bold text-indigo-300 bg-slate-950 border-l border-slate-800">
                            {yearlyExecutiveStats.grandTotalDanaYear}
                          </td>
                          <td className="p-2.5 text-center font-mono font-bold text-emerald-300 bg-slate-950 border-l border-slate-800">
                            {yearlyExecutiveStats.grandTotalWahaYear}
                          </td>
                          <td className="p-2.5 text-center font-mono font-black text-amber-300 bg-slate-950 text-sm">
                            {yearlyExecutiveStats.grandTotalAllDepartmentsYear}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Legend */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 pt-1">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block"></span>
                        <span>قاعة الدانة (رمز: د)</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span>
                        <span>قاعة الواحة (رمز: و)</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                        <span>المجموع الإجمالي</span>
                      </span>
                    </div>
                    <span>* يتم حساب الحجوزات المؤكدة والمكتملة لجميع إدارات الشركة خلال أشهر السنة المحددة</span>
                  </div>
                </div>
              )}

              {/* View 2: Month-by-Month Department Breakdown */}
              {executiveViewMode === 'monthly_detail' && (
                <div className="space-y-4">
                  {/* Month Buttons Selector */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-12 gap-1.5 no-print">
                    {yearlyExecutiveStats.months.map((m) => {
                      const isSelected = selectedExecutiveMonth === m.monthIndex;
                      return (
                        <button
                          type="button"
                          key={m.monthIndex}
                          onClick={() => setSelectedExecutiveMonth(m.monthIndex)}
                          className={`p-2 rounded-xl text-center border transition-all text-xs ${
                            isSelected
                              ? 'bg-blue-700 text-white border-blue-700 shadow-xs ring-2 ring-blue-500/20 font-black'
                              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <div className="truncate font-bold">{m.monthNameAr}</div>
                          <div className={`text-[10px] font-mono mt-0.5 ${isSelected ? 'text-blue-100 font-bold' : 'text-slate-400'}`}>
                            {m.totalAllDepartments} حجز
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected Month Details */}
                  {(() => {
                    const activeM = yearlyExecutiveStats.months.find((m) => m.monthIndex === selectedExecutiveMonth) || yearlyExecutiveStats.months[0];
                    return (
                      <div className="space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
                        {/* Month Sub-header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-lg bg-blue-700 text-white font-bold text-xs">
                              شهر {activeM.monthNameAr} ({executiveYear})
                            </span>
                            <span className="text-xs text-slate-600 font-semibold">
                              إجمالي حجوزات الشهر: <strong className="text-blue-900 font-black">{activeM.totalAllDepartments} حجز</strong> ({activeM.totalHours} ساعة)
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs font-mono font-bold">
                            <span className="text-indigo-800">قاعة الدانة: {activeM.totalDana}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-emerald-800">قاعة الواحة: {activeM.totalWaha}</span>
                          </div>
                        </div>

                        {/* Month Department Table */}
                        {activeM.departments.length === 0 ? (
                          <div className="p-8 text-center text-slate-400 text-xs bg-white rounded-xl border border-slate-200">
                            لا توجد حجوزات مسجلة في شهر {activeM.monthNameAr} لسنة {executiveYear}.
                          </div>
                        ) : (
                          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                            <table className="w-full text-xs text-start">
                              <thead className="bg-slate-100 font-bold text-slate-800 border-b border-slate-200">
                                <tr>
                                  <th className="p-2.5 text-start">اسم الإدارة</th>
                                  <th className="p-2.5 text-center text-indigo-900">حجوزات قاعة الدانة</th>
                                  <th className="p-2.5 text-center text-emerald-900">حجوزات قاعة الواحة</th>
                                  <th className="p-2.5 text-center text-blue-900 font-black">المجموع الإجمالي للإدارة</th>
                                  <th className="p-2.5 text-center">إجمالي الساعات</th>
                                  <th className="p-2.5 text-center">نسبة الحجوزات</th>
                                  <th className="p-2.5 text-center no-print">التفاصيل</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {activeM.departments.map((d) => (
                                  <tr key={d.departmentId} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-2.5 font-bold text-slate-900">
                                      <div className="flex items-center gap-2">
                                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                        <span>{d.departmentNameAr}</span>
                                      </div>
                                    </td>
                                    <td className="p-2.5 text-center font-mono font-bold text-indigo-700 bg-indigo-50/20">
                                      {d.danaCount}
                                    </td>
                                    <td className="p-2.5 text-center font-mono font-bold text-emerald-700 bg-emerald-50/20">
                                      {d.wahaCount}
                                    </td>
                                    <td className="p-2.5 text-center font-mono font-black text-blue-900 bg-blue-50/40">
                                      {d.totalCount}
                                    </td>
                                    <td className="p-2.5 text-center font-mono font-semibold text-slate-700">
                                      {d.totalHours} س
                                    </td>
                                    <td className="p-2.5 text-center">
                                      <div className="flex items-center justify-center gap-1.5">
                                        <span className="font-mono font-bold text-slate-800 text-[11px]">{d.percentageOfMonth}%</span>
                                        <div className="w-12 bg-slate-200 h-1.5 rounded-full overflow-hidden hidden sm:block">
                                          <div className="bg-blue-600 h-full rounded-full" style={{ width: `${Math.min(d.percentageOfMonth, 100)}%` }}></div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="p-2.5 text-center no-print">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setDrillDownTitle(`حجوزات ${d.departmentNameAr} - شهر ${activeM.monthNameAr} ${executiveYear}`);
                                          setDrillDownBookings(d.bookings);
                                        }}
                                        className="text-blue-700 hover:text-blue-900 font-bold hover:underline text-[11px]"
                                      >
                                        عرض
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>

                              {/* Month Footer Total Row */}
                              <tfoot>
                                <tr className="bg-blue-900 text-white font-black text-xs border-t-2 border-blue-950">
                                  <td className="p-3 text-start">
                                    <div className="flex items-center gap-1.5">
                                      <Award className="w-4 h-4 text-amber-300" />
                                      <span>المجموع الإجمالي لكافة الإدارات في شهر {activeM.monthNameAr}</span>
                                    </div>
                                  </td>
                                  <td className="p-3 text-center font-mono text-indigo-200 font-bold">
                                    {activeM.totalDana}
                                  </td>
                                  <td className="p-3 text-center font-mono text-emerald-200 font-bold">
                                    {activeM.totalWaha}
                                  </td>
                                  <td className="p-3 text-center font-mono text-amber-300 font-black text-sm">
                                    {activeM.totalAllDepartments}
                                  </td>
                                  <td className="p-3 text-center font-mono font-bold">
                                    {activeM.totalHours} س
                                  </td>
                                  <td className="p-3 text-center font-mono font-bold">
                                    100%
                                  </td>
                                  <td className="p-3 text-center no-print">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setDrillDownTitle(`جميع حجوزات شهر ${activeM.monthNameAr} ${executiveYear}`);
                                        setDrillDownBookings(activeM.departments.flatMap(d => d.bookings));
                                      }}
                                      className="text-amber-300 hover:text-white font-bold hover:underline text-[11px]"
                                    >
                                      عرض الكل
                                    </button>
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

            </div>

            {/* Summary Table */}
            <div className="border border-slate-300 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-start">
                <thead className="bg-slate-100 font-bold text-slate-800">
                  <tr>
                    <th className="p-3 text-start">الإدارة</th>
                    <th className="p-3 text-center">الدانة</th>
                    <th className="p-3 text-center">الواحة</th>
                    <th className="p-3 text-center">إجمالي الحجوزات</th>
                    <th className="p-3 text-center">إجمالي الساعات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {matrixStats.slice(0, 7).map((item, i) => (
                    <tr key={i}>
                      <td className="p-2.5 font-bold text-slate-900">{item.departmentNameAr}</td>
                      <td className="p-2.5 text-center">{item.danaCount}</td>
                      <td className="p-2.5 text-center">{item.wahaCount}</td>
                      <td className="p-2.5 text-center font-bold text-blue-900">{item.totalCount}</td>
                      <td className="p-2.5 text-center font-semibold">{item.totalHours} س</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Official Signatures Block for Executive Report */}
            {renderOfficialSignaturesBlock('بيانات الإعداد والاعتماد والتواقيع المعتمدة للتقرير التنفيذي للإدارة العليا:')}

          </div>
        )}

      </div>

      {/* ============================================================== */}
      {/* MODAL: تعديل بيانات الإعداد والاعتماد والتواقيع (User Request) */}
      {/* ============================================================== */}
      {isSigModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-700/80 text-white shadow-2xs">
                  <FileSignature className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">
                    تعديل بيانات الإعداد والاعتماد والتواقيع الرسمية
                  </h3>
                  <p className="text-xs text-blue-200 mt-0.5">
                    التقرير التنفيذي للإدارة العليا • شركة ساعد للأنظمة المرورية
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSigModalOpen(false)}
                className="p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              
              {/* Tab Selector */}
              <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold max-w-md mx-auto">
                <button
                  type="button"
                  onClick={() => setActiveSigTab('both')}
                  className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                    activeSigTab === 'both'
                      ? 'bg-white text-blue-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  كلا الطرفين (الإعداد والاعتماد)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSigTab('preparer')}
                  className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                    activeSigTab === 'preparer'
                      ? 'bg-white text-blue-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  بيانات الإعداد فقط
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSigTab('approver')}
                  className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                    activeSigTab === 'approver'
                      ? 'bg-white text-blue-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  بيانات الاعتماد فقط
                </button>
              </div>

              {/* Canvas Drawing Panel (If open) */}
              {sigDrawTarget && (
                <div className="p-5 rounded-2xl bg-blue-50/70 border-2 border-blue-300 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PenTool className="w-4 h-4 text-blue-700" />
                      <span className="font-bold text-xs sm:text-sm text-blue-950">
                        رسم التوقيع الإلكتروني المباشر — {sigDrawTarget === 'preparer' ? 'قسم الإعداد' : 'قسم الاعتماد'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSigDrawTarget(null)}
                      className="text-xs text-slate-500 hover:text-slate-800 font-bold"
                    >
                      إلغاء الرسم
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    استخدم الماوس أو الشاشة اللمسية للتوقيع داخل اللوحة البيضاء أدناه:
                  </p>

                  <div className="flex justify-center">
                    <canvas
                      ref={sigCanvasRef}
                      width={420}
                      height={150}
                      onMouseDown={startDrawingSig}
                      onMouseMove={drawSig}
                      onMouseUp={stopDrawingSig}
                      onMouseLeave={stopDrawingSig}
                      onTouchStart={startDrawingSig}
                      onTouchMove={drawSig}
                      onTouchEnd={stopDrawingSig}
                      className="bg-white rounded-xl border border-slate-300 shadow-2xs cursor-crosshair touch-none"
                    />
                  </div>

                  <div className="flex items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={clearSigCanvas}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                    >
                      مسح اللوحة
                    </button>
                    <button
                      type="button"
                      disabled={!hasDrawnOnCanvas}
                      onClick={() => applyDrawnSig(sigDrawTarget)}
                      className="px-4 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 disabled:opacity-40 text-white font-bold text-xs transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>اعتماد هذا التوقيع</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Form Cards Grid */}
              <div className={`grid gap-6 ${activeSigTab === 'both' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                
                {/* 1. قسم الإعداد (Preparer) */}
                {(activeSigTab === 'both' || activeSigTab === 'preparer') && (
                  <div className="space-y-4 p-5 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                        <h4 className="font-bold text-slate-900 text-sm">بيانات وتوقيع الإعداد (Prepared By)</h4>
                      </div>
                      <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                        قسم الإعداد
                      </span>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          الإدارة / جهة الإعداد: <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={modalPreparerTitle}
                          onChange={(e) => setModalPreparerTitle(e.target.value)}
                          placeholder="مثال: إدارة تقنية المعلومات والخدمات"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-xs bg-white text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          اسم المُعِدّ الكامل: <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={modalPreparerName}
                          onChange={(e) => setModalPreparerName(e.target.value)}
                          placeholder="مثال: خالد الهاشمي"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-xs bg-white text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          المسمى الوظيفي للمُعِدّ (اختياري):
                        </label>
                        <input
                          type="text"
                          value={modalPreparerRole}
                          onChange={(e) => setModalPreparerRole(e.target.value)}
                          placeholder="مثال: رئيس قسم إدارة المرافق والأنظمة"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          تاريخ الإعداد:
                        </label>
                        <input
                          type="text"
                          value={modalPreparerDate}
                          onChange={(e) => setModalPreparerDate(e.target.value)}
                          placeholder={currentDate}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs bg-white text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                        />
                      </div>

                      {/* Preparer Signature Image Controls */}
                      <div className="pt-2 border-t border-slate-200 space-y-2">
                        <label className="block font-bold text-slate-700">
                          صورة توقيع الإعداد:
                        </label>

                        {/* Signature Preview */}
                        <div className="h-20 bg-white rounded-xl border border-slate-200 flex items-center justify-center p-2 relative group">
                          {modalPreparerSig ? (
                            <img
                              src={modalPreparerSig}
                              alt="معاينة توقيع الإعداد"
                              className="max-h-16 max-w-full object-contain"
                            />
                          ) : (
                            <span className="text-[11px] text-slate-400">لم يتم تحديد صورة توقيع بعد</span>
                          )}

                          {modalPreparerSig && (
                            <button
                              type="button"
                              onClick={() => setModalPreparerSig('')}
                              className="absolute top-1.5 end-1.5 p-1 rounded-md bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                              title="حذف التوقيع"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Signature Action Buttons */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <label className="cursor-pointer px-2.5 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold text-[11px] flex items-center gap-1 transition-colors shadow-2xs">
                            <Upload className="w-3.5 h-3.5" />
                            <span>رفع صورة</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleUploadSignatureFile(e, 'preparer', true)}
                              className="hidden"
                            />
                          </label>

                          <button
                            type="button"
                            onClick={() => {
                              setSigDrawTarget('preparer');
                              clearSigCanvas();
                            }}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-[11px] flex items-center gap-1 transition-colors"
                          >
                            <PenTool className="w-3.5 h-3.5 text-blue-600" />
                            <span>رسم توقيع</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setModalPreparerSig(SIGNATURE_PRESETS[0].dataUrl)}
                            className="px-2 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-blue-50 text-blue-700 text-[10px] font-bold"
                            title="استخدام نموذج توقيع إلكتروني جاهز"
                          >
                            نموذج خطي 1
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. قسم الاعتماد (Approver) */}
                {(activeSigTab === 'both' || activeSigTab === 'approver') && (
                  <div className="space-y-4 p-5 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                        <h4 className="font-bold text-slate-900 text-sm">بيانات وتوقيع الاعتماد (Approved By)</h4>
                      </div>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                        قسم الاعتماد
                      </span>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          الإدارة / جهة الاعتماد: <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={modalApproverTitle}
                          onChange={(e) => setModalApproverTitle(e.target.value)}
                          placeholder="مثال: الإدارة التنفيذية"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-xs bg-white text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          اسم المُعتمِد الكامل: <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={modalApproverName}
                          onChange={(e) => setModalApproverName(e.target.value)}
                          placeholder="مثال: سعادة المهندس / المدير التنفيذي"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-xs bg-white text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          المسمى الوظيفي للمُعتمِد (اختياري):
                        </label>
                        <input
                          type="text"
                          value={modalApproverRole}
                          onChange={(e) => setModalApproverRole(e.target.value)}
                          placeholder="مثال: الرئيس التنفيذي للعمليات"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          تاريخ الاعتماد:
                        </label>
                        <input
                          type="text"
                          value={modalApproverDate}
                          onChange={(e) => setModalApproverDate(e.target.value)}
                          placeholder={currentDate}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs bg-white text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                        />
                      </div>

                      {/* Approver Signature Image Controls */}
                      <div className="pt-2 border-t border-slate-200 space-y-2">
                        <label className="block font-bold text-slate-700">
                          صورة توقيع واعتماد الإدارة:
                        </label>

                        {/* Signature Preview */}
                        <div className="h-20 bg-white rounded-xl border border-slate-200 flex items-center justify-center p-2 relative group">
                          {modalApproverSig ? (
                            <img
                              src={modalApproverSig}
                              alt="معاينة توقيع الاعتماد"
                              className="max-h-16 max-w-full object-contain"
                            />
                          ) : (
                            <span className="text-[11px] text-slate-400">لم يتم تحديد صورة توقيع بعد</span>
                          )}

                          {modalApproverSig && (
                            <button
                              type="button"
                              onClick={() => setModalApproverSig('')}
                              className="absolute top-1.5 end-1.5 p-1 rounded-md bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                              title="حذف التوقيع"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Signature Action Buttons */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <label className="cursor-pointer px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] flex items-center gap-1 transition-colors shadow-2xs">
                            <Upload className="w-3.5 h-3.5" />
                            <span>رفع صورة</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleUploadSignatureFile(e, 'approver', true)}
                              className="hidden"
                            />
                          </label>

                          <button
                            type="button"
                            onClick={() => {
                              setSigDrawTarget('approver');
                              clearSigCanvas();
                            }}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-[11px] flex items-center gap-1 transition-colors"
                          >
                            <PenTool className="w-3.5 h-3.5 text-emerald-600" />
                            <span>رسم توقيع</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setModalApproverSig(SIGNATURE_PRESETS[1].dataUrl)}
                            className="px-2 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-emerald-50 text-emerald-800 text-[10px] font-bold"
                            title="توقيع رسمي مع ختم معتمد"
                          >
                            توقيع مع ختم
                          </button>

                          <button
                            type="button"
                            onClick={() => setModalApproverSig(SIGNATURE_PRESETS[2].dataUrl)}
                            className="px-2 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-amber-50 text-amber-800 text-[10px] font-bold"
                            title="توقيع تنفيذي مذهب"
                          >
                            نموذج 2
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={handleResetSignatures}
                className="text-xs text-slate-500 hover:text-slate-800 hover:underline font-bold flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>استعادة البيانات الافتراضية</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSigModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSaveSignatures}
                  className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-xs transition-all hover:scale-[1.02] active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>حفظ التعديلات والتواقيع فوراً</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Interactive Drill-down Modal (Prompt #29) */}
      {drillDownBookings && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
            
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">{drillDownTitle}</h3>
                <span className="text-xs text-slate-400">
                  تفاصيل السجلات الفردية للتدقيق والتحقق ({drillDownBookings.length} حجز)
                </span>
              </div>
              <button
                onClick={() => setDrillDownBookings(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto p-4">
              {drillDownBookings.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  لا توجد تفاصيل لهذا السطر.
                </div>
              ) : (
                <table className="w-full text-xs text-start border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="p-2.5 text-start">رقم الحجز</th>
                      <th className="p-2.5 text-start">القاعة</th>
                      <th className="p-2.5 text-start">الموضوع</th>
                      <th className="p-2.5 text-start">التاريخ</th>
                      <th className="p-2.5 text-start">الوقت</th>
                      <th className="p-2.5 text-start">مقدم الحجز</th>
                      <th className="p-2.5 text-center">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {drillDownBookings.map((b) => (
                      <tr
                        key={b.id}
                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                        onClick={() => {
                          if (onSelectBooking) onSelectBooking(b);
                          setDrillDownBookings(null);
                        }}
                      >
                        <td className="p-2.5 font-mono font-bold text-blue-900">{b.bookingNumber}</td>
                        <td className="p-2.5 font-semibold">{b.roomNameAr}</td>
                        <td className="p-2.5 font-bold text-slate-900">{b.title}</td>
                        <td className="p-2.5 font-mono">{b.date}</td>
                        <td className="p-2.5 font-mono text-xs">{formatTimeRange12(b.startTime, b.endTime, language as 'ar' | 'en')}</td>
                        <td className="p-2.5 text-slate-600">{b.bookerName}</td>
                        <td className="p-2.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              b.status === 'confirmed' || b.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : b.status === 'cancelled'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setDrillDownBookings(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-900"
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
