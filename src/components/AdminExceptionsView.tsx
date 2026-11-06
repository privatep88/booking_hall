import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { AdminExceptionGrant, Department } from '../types';
import { formatDateAr, formatTime12 } from '../utils/dateUtils';
import {
  ShieldAlert,
  ShieldCheck,
  Calendar,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Lock,
  Unlock,
  Users,
  Sliders,
  CalendarDays,
  FileText,
  DoorOpen,
  X,
  Info,
  Zap,
  Check,
  RefreshCw,
  Building2,
  Search,
  Edit2,
  ExternalLink,
  ChevronRight,
  Filter
} from 'lucide-react';

interface AdminExceptionsViewProps {
  onOpenNewBooking?: (roomId?: string, deptId?: string) => void;
  onOpenDanaBooking?: (deptId?: string) => void;
  onOpenWahaBooking?: (deptId?: string) => void;
}

export const AdminExceptionsView: React.FC<AdminExceptionsViewProps> = ({
  onOpenNewBooking,
  onOpenDanaBooking,
  onOpenWahaBooking
}) => {
  const {
    settings,
    holidays,
    rooms,
    departments,
    updateAdminExceptions,
    addExceptionGrant,
    deleteExceptionGrant,
    toggleExceptionGrant,
    toggleHolidayExemption,
    addHoliday,
    addDepartment,
    updateDepartment,
    deleteDepartment
  } = useApp();

  const exc = settings.adminExceptions || {
    allowHolidayBookings: false,
    exemptedHolidays: [],
    allowAfterHoursBookings: false,
    extendedHoursStart: '06:00',
    extendedHoursEnd: '23:30',
    allow24Hours: false,
    allowExtendedDuration: false,
    maxExtendedDurationMinutes: 720,
    bypassMinDuration: false,
    allowWeekendBookings: false,
    allowCapacityOverflow: false,
    allowPastDateBookings: false,
    bypassCheckInRequirement: false,
    bypassMaxFutureDays: false,
    masterOverrideMode: false,
    exceptionGrants: []
  };

  // State for adding a new custom grant modal
  const [isGrantModalOpen, setIsGrantModalOpen] = useState(false);
  const [grantCategory, setGrantCategory] = useState<AdminExceptionGrant['category']>('holiday');
  const [grantTitle, setGrantTitle] = useState('');
  const [grantReason, setGrantReason] = useState('');
  const [grantTargetRoomId, setGrantTargetRoomId] = useState<'all' | string>('all');
  const [grantSpecificDate, setGrantSpecificDate] = useState('');
  const [grantCustomStartTime, setGrantCustomStartTime] = useState('18:00');
  const [grantCustomEndTime, setGrantCustomEndTime] = useState('22:00');
  const [grantCustomMaxDuration, setGrantCustomMaxDuration] = useState(480);
  const [grantApprovedBy, setGrantApprovedBy] = useState('إدارة الخدمات العامة');

  // State for adding a quick holiday
  const [isAddHolidayOpen, setIsAddHolidayOpen] = useState(false);
  const [newHolidayName, setNewHolidayName] = useState('');
  const [newHolidayDate, setNewHolidayDate] = useState('');

  // Success banner toast
  const [saveToast, setSaveToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 3500);
  };

  // Handle master override toggle
  const handleToggleMasterOverride = () => {
    const nextState = !exc.masterOverrideMode;
    updateAdminExceptions({ masterOverrideMode: nextState });
    showToast(
      nextState
        ? 'تم تفعيل وضع الاستثناء الشامل لجميع القيود بنجاح!'
        : 'تم تعطيل وضع الاستثناء الشامل والعودة للضوابط القياسية.'
    );
  };

  // Handle custom grant submission
  const handleAddGrantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!grantTitle.trim() || !grantReason.trim()) return;

    addExceptionGrant({
      category: grantCategory,
      title: grantTitle.trim(),
      reason: grantReason.trim(),
      targetRoomId: grantTargetRoomId,
      specificDate: grantSpecificDate || undefined,
      customStartTime: grantCategory === 'after_hours' ? grantCustomStartTime : undefined,
      customEndTime: grantCategory === 'after_hours' ? grantCustomEndTime : undefined,
      customMaxDurationMinutes: grantCategory === 'duration' ? Number(grantCustomMaxDuration) : undefined,
      approvedBy: grantApprovedBy.trim() || 'إدارة الخدمات العامة',
      isActive: true
    });

    setIsGrantModalOpen(false);
    setGrantTitle('');
    setGrantReason('');
    setGrantSpecificDate('');
    showToast('تم إصدار واعتماد تصريح الاستثناء الإداري الجديد بنجاح');
  };

  // Handle new holiday
  const handleAddHolidaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHolidayName.trim() || !newHolidayDate) return;
    addHoliday({
      nameAr: newHolidayName.trim(),
      nameEn: newHolidayName.trim(),
      date: newHolidayDate,
      status: 'active'
    });
    setIsAddHolidayOpen(false);
    setNewHolidayName('');
    setNewHolidayDate('');
    showToast('تمت إضافة العطلة الرسمية بنجاح إلى جدول النظام');
  };

  // Quick Department Suggestions
  const DEPARTMENT_SUGGESTIONS = [
    { nameAr: 'إدارة التحول الرقمي والذكاء الاصطناعي', nameEn: 'Digital Transformation & AI', code: 'DTI' },
    { nameAr: 'إدارة الاستراتيجية والمستقبل', nameEn: 'Strategy & Future', code: 'STRAT' },
    { nameAr: 'إدارة الاتصال المؤسسي والإعلام', nameEn: 'Corporate Communications', code: 'COMM' },
    { nameAr: 'إدارة الشؤون التنظيمية والامتثال', nameEn: 'Regulatory & Compliance', code: 'COMP' },
    { nameAr: 'إدارة إسعاد وخدمة المتعاملين', nameEn: 'Customer Happiness', code: 'CHD' },
    { nameAr: 'إدارة التدقيق الداخلي والحوكمة', nameEn: 'Internal Audit & Governance', code: 'AUD' },
    { nameAr: 'إدارة الابتكار والريادة', nameEn: 'Innovation & Leadership', code: 'INN' },
    { nameAr: 'إدارة سلاسل الإمداد والمشتريات', nameEn: 'Procurement & Supply Chain', code: 'PROC' }
  ];

  // State for adding official department modal
  const [isAddDeptModalOpen, setIsAddDeptModalOpen] = useState(false);
  const [newDeptNameAr, setNewDeptNameAr] = useState('');
  const [newDeptNameEn, setNewDeptNameEn] = useState('');
  const [newDeptCode, setNewDeptCode] = useState('');
  const [newDeptStatus, setNewDeptStatus] = useState<'active' | 'inactive'>('active');

  // State for editing department modal
  const [isEditDeptModalOpen, setIsEditDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [editDeptNameAr, setEditDeptNameAr] = useState('');
  const [editDeptNameEn, setEditDeptNameEn] = useState('');
  const [editDeptCode, setEditDeptCode] = useState('');
  const [editDeptStatus, setEditDeptStatus] = useState<'active' | 'inactive'>('active');

  // Department search & filter & delete confirmation
  const [deptSearchQuery, setDeptSearchQuery] = useState('');
  const [deptFilterStatus, setDeptFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [deleteConfirmDeptId, setDeleteConfirmDeptId] = useState<string | null>(null);

  // Handle adding new official department
  const handleAddDepartmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptNameAr.trim()) return;

    const trimmedAr = newDeptNameAr.trim();
    const code = (newDeptCode.trim() || `DEP-${String(departments.length + 1).padStart(2, '0')}`).toUpperCase();
    const nameEn = newDeptNameEn.trim() || trimmedAr;

    addDepartment({
      nameAr: trimmedAr,
      nameEn,
      code,
      status: newDeptStatus
    });

    setIsAddDeptModalOpen(false);
    setNewDeptNameAr('');
    setNewDeptNameEn('');
    setNewDeptCode('');
    setNewDeptStatus('active');

    showToast(`تمت إضافة إدارة «${trimmedAr}» بشكل رسمي بنجاح! تنعكس فوراً في خانة الإدارة الحاجزة لقاعتي الدانة والواحة.`);
  };

  // Open edit modal for department
  const handleOpenEditDept = (dept: Department) => {
    setEditingDept(dept);
    setEditDeptNameAr(dept.nameAr);
    setEditDeptNameEn(dept.nameEn || dept.nameAr);
    setEditDeptCode(dept.code || '');
    setEditDeptStatus(dept.status);
    setIsEditDeptModalOpen(true);
  };

  // Handle edit department submission
  const handleEditDepartmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept || !editDeptNameAr.trim()) return;

    updateDepartment(editingDept.id, {
      nameAr: editDeptNameAr.trim(),
      nameEn: editDeptNameEn.trim() || editDeptNameAr.trim(),
      code: editDeptCode.trim().toUpperCase() || editingDept.code,
      status: editDeptStatus
    });

    setIsEditDeptModalOpen(false);
    setEditingDept(null);
    showToast(`تم تحديث بيانات إدارة «${editDeptNameAr.trim()}» بنجاح في النظام!`);
  };

  // Toggle department active/inactive
  const handleToggleDeptStatus = (dept: Department) => {
    const nextStatus = dept.status === 'active' ? 'inactive' : 'active';
    updateDepartment(dept.id, { status: nextStatus });
    showToast(
      nextStatus === 'active'
        ? `تم تفعيل إدارة «${dept.nameAr}» وإدراجها في قائمة حجز قاعة الدانة والواحة`
        : `تم تعطيل إدارة «${dept.nameAr}» مؤقتاً من خيارات الحجز`
    );
  };

  // Handle delete department
  const handleDeleteDept = (deptId: string, deptName: string) => {
    deleteDepartment(deptId);
    setDeleteConfirmDeptId(null);
    showToast(`تم حذف إدارة «${deptName}» من قائمة الإدارات بنجاح.`);
  };

  // Filtered departments memo
  const filteredDepartments = useMemo(() => {
    return departments.filter((d) => {
      const q = deptSearchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        d.nameAr.toLowerCase().includes(q) ||
        (d.nameEn && d.nameEn.toLowerCase().includes(q)) ||
        (d.code && d.code.toLowerCase().includes(q));
      const matchesStatus =
        deptFilterStatus === 'all' ? true : d.status === deptFilterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [departments, deptSearchQuery, deptFilterStatus]);

  // Calculate active counts
  const totalGrants = exc.exceptionGrants?.length || 0;
  const activeGrants = exc.exceptionGrants?.filter((g) => g.isActive).length || 0;

  return (
    <div className="space-y-6 animate-in fade-in pb-16">
      
      {/* Toast Notification */}
      {saveToast && (
        <div className="fixed bottom-6 start-6 z-50 bg-emerald-900/90 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-emerald-500/40 backdrop-blur-md animate-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-semibold">{saveToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white p-6 sm:p-8 shadow-lg border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>صلاحيات المشرف والإدارة العليا • شركة ساعد</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              خيارات واستثناءات الإدارة لحجز القاعات
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              التحكم المركزي في استثناءات حجز قاعات الاجتماعات: السماح بالحجز في أيام العطلات الرسمية، خارج أوقات العمل الرسمية، إمكانية زيادة وتمديد مدة الاجتماعات، واستثناء كافة السياسات والقيود غير المسموح بها مسبقاً.
            </p>
          </div>

          {/* Master Override Mode Action */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 flex flex-col gap-3 min-w-[280px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                وضع الاستثناء الشامل الفوري
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  exc.masterOverrideMode
                    ? 'bg-amber-400 text-slate-950 animate-pulse'
                    : 'bg-white/10 text-slate-300'
                }`}
              >
                {exc.masterOverrideMode ? 'مفعّل وشامل' : 'معطّل'}
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              تجاوز جميع قيود الحجز فوراً لكافة القاعات والأوقات
            </p>
            <button
              onClick={handleToggleMasterOverride}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 shadow-md ${
                exc.masterOverrideMode
                  ? 'bg-amber-400 hover:bg-amber-300 text-amber-950'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              {exc.masterOverrideMode ? (
                <>
                  <Unlock className="w-4 h-4" />
                  <span>تعطيل الاستثناء الشامل (العودة للضوابط)</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>تفعيل الاستثناء الشامل لكافة القيود</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute -end-16 -bottom-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute end-1/3 -top-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Master Override Active Alert Notice */}
      {exc.masterOverrideMode && (
        <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl p-4 text-amber-950 flex items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500 text-slate-950 shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900">
                وضع الاستثناء الشامل الفوري مفعّل حالياً في النظام
              </h4>
              <p className="text-xs text-amber-800">
                يمكن الآن لأي موظف أو مسؤول حجز قاعات الاجتماعات في أي عطلة رسمية، وفي أي وقت (24 ساعة)، وبأي مدة مطلوبة، وفي عطلات نهاية الأسبوع بدون قيود.
              </p>
            </div>
          </div>
          <button
            onClick={handleToggleMasterOverride}
            className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 transition-colors"
          >
            إيقاف الوضع الشامل
          </button>
        </div>
      )}

      {/* Metric Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className={`p-3 rounded-xl ${exc.allowHolidayBookings || exc.masterOverrideMode ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-medium block">حجوزات العطلات الرسمية</span>
            <span className="text-sm sm:text-base font-extrabold text-slate-900">
              {exc.allowHolidayBookings || exc.masterOverrideMode ? 'مسموحة بالكامل' : `${exc.exemptedHolidays?.length || 0} عطلات مستثناة`}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className={`p-3 rounded-xl ${exc.allowAfterHoursBookings || exc.masterOverrideMode ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-medium block">خارج أوقات العمل الرسمية</span>
            <span className="text-sm sm:text-base font-extrabold text-slate-900">
              {exc.allow24Hours || exc.masterOverrideMode ? 'مفتوح 24 ساعة' : exc.allowAfterHoursBookings ? `${exc.extendedHoursStart} - ${exc.extendedHoursEnd}` : 'مقيد بالدوام'}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className={`p-3 rounded-xl ${exc.allowExtendedDuration || exc.masterOverrideMode ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-medium block">أقصى مدة للاجتماع</span>
            <span className="text-sm sm:text-base font-extrabold text-slate-900">
              {exc.masterOverrideMode ? '24 ساعة (غير محدود)' : exc.allowExtendedDuration ? `${Math.round((exc.maxExtendedDurationMinutes || 720) / 60)} ساعات` : '4 ساعات (افتراضي)'}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-purple-100 text-purple-700">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-medium block">تصاريح الاستثناء المعتمدة</span>
            <span className="text-sm sm:text-base font-extrabold text-slate-900">
              {activeGrants} نشط من أصل {totalGrants}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-blue-200 shadow-xs flex items-center gap-3.5 bg-gradient-to-br from-white to-blue-50/50">
          <div className="p-3 rounded-xl bg-blue-100 text-blue-700">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-medium block">الإدارات المعتمدة للحجز</span>
            <span className="text-sm sm:text-base font-extrabold text-blue-900">
              {departments.filter(d => d.status === 'active').length} نشطة (من {departments.length})
            </span>
          </div>
        </div>
      </div>

      {/* Main 4 Exception Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ============================================================== */}
        {/* SECTION 1: استثناء حجز الاجتماعات في أيام العطلات الرسمية */}
        {/* ============================================================== */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  1. استثناءات حجز الاجتماعات في أيام العطلات الرسمية
                </h2>
                <p className="text-xs text-slate-500">
                  السماح بإنشاء حجوزات أثناء العطلات الرسمية المعتمدة لشركة ساعد
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsAddHolidayOpen(true)}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة عطلة</span>
            </button>
          </div>

          <div className="p-5 space-y-5 flex-1">
            {/* Global Holiday Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-sm font-bold text-slate-900 block">
                  السماح الشامل بالحجز في كافة العطلات الرسمية
                </span>
                <span className="text-xs text-slate-500">
                  عند تفعيل هذا الخيار، لن يتم حظر أي حجز يصادف عطلة رسمية على مستوى النظام
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={exc.allowHolidayBookings}
                  onChange={(e) => {
                    updateAdminExceptions({ allowHolidayBookings: e.target.checked });
                    showToast(e.target.checked ? 'تم تفعيل السماح الشامل بالحجز في العطلات الرسمية' : 'تم تقييد الحجز في العطلات الرسمية');
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* Granular Per-Holiday Exceptions List */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-bold text-slate-700">
                  استثناءات العطلات الرسمية بالاسم والتاريخ:
                </span>
                <span className="text-[11px] text-slate-500">
                  انقر لتبديل استثناء عطلة محددة
                </span>
              </div>

              <div className="space-y-2">
                {holidays.map((h) => {
                  const isExempted = exc.allowHolidayBookings || (exc.exemptedHolidays && exc.exemptedHolidays.includes(h.id));
                  return (
                    <div
                      key={h.id}
                      className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                        isExempted
                          ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                          : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isExempted ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                          <CalendarDays className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold">{h.nameAr}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                              {h.date}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500">
                            {formatDateAr(h.date)}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          toggleHolidayExemption(h.id);
                          showToast(`تم تحديث استثناء عطلة: ${h.nameAr}`);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                          isExempted
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {isExempted ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>مستثناة ومتاحة</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5" />
                            <span>محظورة (انقر للاستثناء)</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* SECTION 2: استثناء التوقيت خارج وقت العمل */}
        {/* ============================================================== */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-800">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                2. استثناءات التوقيت خارج وقت العمل الرسمي
              </h2>
              <p className="text-xs text-slate-500">
                إتاحة حجز القاعات في الصباح الباكر أو الفترات المسائية المتأخرة
              </p>
            </div>
          </div>

          <div className="p-5 space-y-5 flex-1">
            {/* Global After-Hours Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-sm font-bold text-slate-900 block">
                  السماح بحجز الاجتماعات خارج أوقات العمل الرسمية
                </span>
                <span className="text-xs text-slate-500">
                  الدوام الرسمي الافتراضي: 07:30 ص حتى 06:00 م. التفعيل يفتح أوقات موسعة
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={exc.allowAfterHoursBookings}
                  onChange={(e) => {
                    updateAdminExceptions({ allowAfterHoursBookings: e.target.checked });
                    showToast(e.target.checked ? 'تم تفعيل استثناء الحجز خارج أوقات الدوام' : 'تم قفل الحجز ضمن الدوام الرسمي فقط');
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* 24-Hours Full Day Mode */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-blue-50/50 border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-600 text-white">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-blue-950 block">
                    فتح القاعات على مدار 24 ساعة (طوال اليوم والليل)
                  </span>
                  <span className="text-[11px] text-blue-800">
                    إلغاء قيود الساعة بالكامل للاجتماعات الطارئة وغرف العمليات الميدانية
                  </span>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={exc.allow24Hours}
                  onChange={(e) => {
                    updateAdminExceptions({ allow24Hours: e.target.checked, allowAfterHoursBookings: true });
                    showToast(e.target.checked ? 'تم فتح الحجز على مدار 24 ساعة بنجاح' : 'تم إلغاء وضع الـ 24 ساعة');
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Custom Hours Boundaries */}
            {!exc.allow24Hours && (
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    نطاق ساعات العمل الاستثنائي المعتمد:
                  </span>
                  <span className="text-[11px] text-blue-700 font-bold">
                    {formatTime12(exc.extendedHoursStart || '06:00')} إلى {formatTime12(exc.extendedHoursEnd || '23:30')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      وقت البدء الاستثنائي (صباحاً)
                    </label>
                    <input
                      type="time"
                      value={exc.extendedHoursStart || '06:00'}
                      onChange={(e) => updateAdminExceptions({ extendedHoursStart: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs text-slate-800 bg-slate-50 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      وقت الانتهاء الاستثنائي (مساءً)
                    </label>
                    <input
                      type="time"
                      value={exc.extendedHoursEnd || '23:30'}
                      onChange={(e) => updateAdminExceptions({ extendedHoursEnd: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs text-slate-800 bg-slate-50 focus:bg-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* SECTION 3: إمكانية زيادة مدة الاجتماع وتخطي الحدود */}
        {/* ============================================================== */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-800">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                3. استثناءات وزيادة مدة الاجتماع
              </h2>
              <p className="text-xs text-slate-500">
                رفع الحد الأقصى للمدة (الافتراضي 4 ساعات) وتخطي الحد الأدنى
              </p>
            </div>
          </div>

          <div className="p-5 space-y-5 flex-1">
            {/* Global Duration Extension Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-sm font-bold text-slate-900 block">
                  السماح بتمديد وزيادة مدة الاجتماع
                </span>
                <span className="text-xs text-slate-500">
                  تخطي سقف الـ 240 دقيقة (4 ساعات) لورش العمل والخلوات القيادية
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={exc.allowExtendedDuration}
                  onChange={(e) => {
                    updateAdminExceptions({ allowExtendedDuration: e.target.checked });
                    showToast(e.target.checked ? 'تم تفعيل استثناء تمديد مدة الاجتماعات' : 'تم ضبط الحد الأقصى الافتراضي');
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* Extended Max Duration Presets */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                اختر الحد الأقصى الاستثنائي لمدّة الاجتماع:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { mins: 360, label: '6 ساعات', sub: '360 دقيقة' },
                  { mins: 480, label: '8 ساعات', sub: 'يوم عمل كامل' },
                  { mins: 720, label: '12 ساعة', sub: 'خلوة مطولة' },
                  { mins: 1440, label: '24 ساعة', sub: 'يوم كامل مفتوح' }
                ].map((item) => {
                  const isSelected = (exc.maxExtendedDurationMinutes || 720) === item.mins;
                  return (
                    <button
                      key={item.mins}
                      type="button"
                      onClick={() => {
                        updateAdminExceptions({
                          allowExtendedDuration: true,
                          maxExtendedDurationMinutes: item.mins
                        });
                        showToast(`تم رفع الحد الأقصى لمدة الاجتماع إلى ${item.label}`);
                      }}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <span className="block text-xs font-bold">{item.label}</span>
                      <span className={`text-[10px] block mt-0.5 ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                        {item.sub}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bypass Min Duration Option */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-purple-50/40 border border-purple-200">
              <div>
                <span className="text-xs font-bold text-purple-950 block">
                  تخطي الحد الأدنى للاجتماع (أقل من 30 دقيقة)
                </span>
                <span className="text-[11px] text-purple-800">
                  إتاحة اجتماعات سريعة أو طارئة مدتها 10 أو 15 دقيقة
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={exc.bypassMinDuration}
                  onChange={(e) => {
                    updateAdminExceptions({ bypassMinDuration: e.target.checked });
                    showToast(e.target.checked ? 'تم تفعيل استثناء الاجتماعات السريعة القصيرة' : 'تم الالتزام بالحد الأدنى 30 دقيقة');
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* SECTION 4: استثناء جميع الأشياء غير المسموح بها الأخرى */}
        {/* ============================================================== */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                4. استثناء جميع الأشياء والسياسات غير المسموح بها
              </h2>
              <p className="text-xs text-slate-500">
                إلغاء قيود نهاية الأسبوع، السعة، الحجز الماضي، والتأكيد التلقائي
              </p>
            </div>
          </div>

          <div className="p-5 space-y-3.5 flex-1">
            {/* 1. Weekend Exception */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50">
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  استثناء عطلة نهاية الأسبوع (السبت والأحد)
                </span>
                <span className="text-[11px] text-slate-500">
                  السماح بإنشاء حجوزات رسمية في أيام السبت والأحد للفعاليات
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={exc.allowWeekendBookings}
                  onChange={(e) => {
                    updateAdminExceptions({ allowWeekendBookings: e.target.checked });
                    showToast(e.target.checked ? 'تم تفعيل استثناء حجز عطلة نهاية الأسبوع' : 'تم حظر حجز عطلة نهاية الأسبوع');
                  }}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>

            {/* 2. Capacity Overflow Exception */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50">
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  استثناء تجاوز سعة القاعة وعدد الحضور
                </span>
                <span className="text-[11px] text-slate-500">
                  السماح بالحجز حتى لو تجاوز عدد الحاضرين الطاقة الاستيعابية
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={exc.allowCapacityOverflow}
                  onChange={(e) => {
                    updateAdminExceptions({ allowCapacityOverflow: e.target.checked });
                    showToast(e.target.checked ? 'تم تفعيل استثناء تجاوز سعة القاعة' : 'تم الالتزام بسعة القاعة');
                  }}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>

            {/* 3. Past Date Booking Exception */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50">
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  استثناء الحجز بأثر رجعي (تواريخ سابقة)
                </span>
                <span className="text-[11px] text-slate-500">
                  السماح بتوثيق وإدراج اجتماعات عُقدت سابقاً في السجلات
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={exc.allowPastDateBookings}
                  onChange={(e) => {
                    updateAdminExceptions({ allowPastDateBookings: e.target.checked });
                    showToast(e.target.checked ? 'تم تفعيل استثناء الحجز بأثر رجعي' : 'تم قفل الحجز في التواريخ السابقة');
                  }}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>

            {/* 4. Bypass Check-in Auto Release */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50">
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  استثناء إلغاء الحجز لعدم تأكيد الحضور
                </span>
                <span className="text-[11px] text-slate-500">
                  تعطيل الإلغاء التلقائي بعد 15 دقيقة لضمان عدم فقدان الحجز
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={exc.bypassCheckInRequirement}
                  onChange={(e) => {
                    updateAdminExceptions({ bypassCheckInRequirement: e.target.checked });
                    showToast(e.target.checked ? 'تم تعطيل الإلغاء التلقائي للحجوزات' : 'تم تفعيل نظام تأكيد الحضور التلقائي');
                  }}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>

            {/* 5. Future Booking Horizon */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50">
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  استثناء أفق الحجز المستقبلي (تجاوز 90 يوماً)
                </span>
                <span className="text-[11px] text-slate-500">
                  إتاحة جدولة المؤتمرات السنوية حتى 365 يوماً مقدماً
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={exc.bypassMaxFutureDays}
                  onChange={(e) => {
                    updateAdminExceptions({ bypassMaxFutureDays: e.target.checked });
                    showToast(e.target.checked ? 'تم فتح الحجز المستقبلي لسنة كاملة' : 'تم الالتزام بحد الـ 90 يوماً');
                  }}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>

          </div>
        </div>

      </div>

      {/* ============================================================== */}
      {/* SECTION 5: إدارة واعتماد الإدارات بشكل رسمي (المعتمدة لحجز قاعة الدانة وقاعة الواحة) */}
      {/* ============================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-blue-900/10 via-slate-50 to-indigo-900/10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-blue-700 text-white shadow-md shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                  5. إدارة واعتماد الإدارات بشكل رسمي (المعتمدة لحجز قاعة الدانة وقاعة الواحة)
                </h2>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800 border border-blue-200">
                  انعكاس فوري في الحجز
                </span>
              </div>
              <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                إضافة وتعديل الإدارات والهيكل التنظيمي المعتمد في شركة ساعد؛ تنعكس هذه الإدارات فوراً وتلقائياً في خانة 
                <strong className="text-blue-900 font-bold mx-1">«الإدارة الحاجزة (Department ID) *»</strong> 
                عند إنشاء أو تعديل أي حجز في كل من قاعة الدانة وقاعة الواحة.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-start lg:self-auto">
            <button
              onClick={() => {
                setNewDeptNameAr('');
                setNewDeptNameEn('');
                setNewDeptCode(`DEP-${String(departments.length + 1).padStart(2, '0')}`);
                setNewDeptStatus('active');
                setIsAddDeptModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-xs flex items-center gap-2 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة إدارة جديدة بشكل رسمي</span>
            </button>

            {/* Test Booking in Dana Button */}
            <button
              onClick={() => {
                if (onOpenDanaBooking) {
                  onOpenDanaBooking();
                } else if (onOpenNewBooking) {
                  onOpenNewBooking('room-dana');
                }
              }}
              className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors"
              title="تجربة حجز قاعة الدانة والتحقق من انعكاس الإدارات"
            >
              <DoorOpen className="w-3.5 h-3.5 text-blue-300" />
              <span>تجربة حجز قاعة الدانة</span>
            </button>

            {/* Test Booking in Waha Button */}
            <button
              onClick={() => {
                if (onOpenWahaBooking) {
                  onOpenWahaBooking();
                } else if (onOpenNewBooking) {
                  onOpenNewBooking('room-waha');
                }
              }}
              className="px-3.5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors"
              title="تجربة حجز قاعة الواحة والتحقق من انعكاس الإدارات"
            >
              <DoorOpen className="w-3.5 h-3.5 text-emerald-300" />
              <span>تجربة حجز قاعة الواحة</span>
            </button>
          </div>
        </div>

        {/* Notice Strip */}
        <div className="p-4 bg-blue-50/70 border-b border-blue-100 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5 text-xs text-blue-950 font-medium">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              <strong>الانعكاس الفوري مفعل:</strong> الإدارات النشطة المسجلة أدناه تظهر تلقائياً في خانة <strong>«الإدارة الحاجزة (Department ID) *»</strong> لقاعتي الدانة والواحة وتُسجل في كافة إحصائيات النظام.
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <span className="bg-white px-2.5 py-1 rounded-lg border border-blue-200 text-blue-800">
              {departments.filter(d => d.status === 'active').length} إدارة نشطة
            </span>
            <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700">
              {departments.length} إجمالي الإدارات
            </span>
          </div>
        </div>

        {/* Search, Filter & Quick Suggestions Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 space-y-3 bg-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={deptSearchQuery}
                onChange={(e) => setDeptSearchQuery(e.target.value)}
                placeholder="البحث بالاسم العربي أو الإنجليزي أو كود الإدارة..."
                className="w-full ps-9 pe-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
              {deptSearchQuery && (
                <button
                  onClick={() => setDeptSearchQuery('')}
                  className="absolute end-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status Filter Buttons */}
            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              <button
                onClick={() => setDeptFilterStatus('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  deptFilterStatus === 'all'
                    ? 'bg-blue-700 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                الكل ({departments.length})
              </button>
              <button
                onClick={() => setDeptFilterStatus('active')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  deptFilterStatus === 'active'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                النشطة فقط ({departments.filter((d) => d.status === 'active').length})
              </button>
              <button
                onClick={() => setDeptFilterStatus('inactive')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  deptFilterStatus === 'inactive'
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                المعطلة ({departments.filter((d) => d.status === 'inactive').length})
              </button>
            </div>
          </div>

          {/* Quick Suggestions Chips */}
          <div className="pt-2 border-t border-slate-100 flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>اقتراحات إدارية رسمية سريعة:</span>
            </span>
            {DEPARTMENT_SUGGESTIONS.slice(0, 4).map((sug, i) => (
              <button
                key={i}
                onClick={() => {
                  setNewDeptNameAr(sug.nameAr);
                  setNewDeptNameEn(sug.nameEn);
                  setNewDeptCode(sug.code);
                  setNewDeptStatus('active');
                  setIsAddDeptModalOpen(true);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-800 border border-slate-200 hover:border-blue-300 text-[11px] font-semibold transition-all flex items-center gap-1"
              >
                <Plus className="w-3 h-3 text-blue-600" />
                <span>{sug.nameAr}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Departments List / Cards */}
        {filteredDepartments.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">لم يتم العثور على إدارات مطابقة للبحث</p>
            <p className="text-xs text-slate-400 mt-1">يمكنك إضافة إدارة جديدة أو تغيير معايير البحث والفلترة</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredDepartments.map((dept) => {
              const isActive = dept.status === 'active';
              return (
                <div
                  key={dept.id}
                  className={`p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors ${
                    isActive ? 'hover:bg-slate-50/70' : 'bg-slate-50/40 opacity-75'
                  }`}
                >
                  {/* Department Info */}
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div
                      className={`p-2.5 rounded-xl shrink-0 ${
                        isActive
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm sm:text-base font-extrabold text-slate-900">
                          {dept.nameAr}
                        </h4>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-bold">
                          {dept.code}
                        </span>
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {isActive ? 'نشطة ومعتمدة في الحجز' : 'معطلة مؤقتاً'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                        {dept.nameEn && <span>{dept.nameEn}</span>}
                        <span className="text-slate-300">•</span>
                        <span className="text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                          معتمدة لقاعتي (الدانة والواحة)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions for this department */}
                  <div className="flex items-center gap-2 flex-wrap self-end lg:self-auto">
                    {/* Book in Dana with this department */}
                    {isActive && (
                      <button
                        onClick={() => {
                          if (onOpenDanaBooking) {
                            onOpenDanaBooking(dept.id);
                          } else if (onOpenNewBooking) {
                            onOpenNewBooking('room-dana', dept.id);
                          }
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-bold transition-colors flex items-center gap-1"
                        title="إنشاء حجز في قاعة الدانة باسم هذه الإدارة"
                      >
                        <DoorOpen className="w-3.5 h-3.5 text-blue-600" />
                        <span>حجز بالدانة</span>
                      </button>
                    )}

                    {/* Book in Waha with this department */}
                    {isActive && (
                      <button
                        onClick={() => {
                          if (onOpenWahaBooking) {
                            onOpenWahaBooking(dept.id);
                          } else if (onOpenNewBooking) {
                            onOpenNewBooking('room-waha', dept.id);
                          }
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-colors flex items-center gap-1"
                        title="إنشاء حجز في قاعة الواحة باسم هذه الإدارة"
                      >
                        <DoorOpen className="w-3.5 h-3.5 text-emerald-600" />
                        <span>حجز بالواحة</span>
                      </button>
                    )}

                    {/* Toggle Active / Inactive Button */}
                    <button
                      onClick={() => handleToggleDeptStatus(dept)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors border ${
                        isActive
                          ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                      }`}
                      title={isActive ? 'تعطيل مؤقت من القائمة' : 'تفعيل في قائمة الحجز'}
                    >
                      {isActive ? 'تعطيل' : 'تفعيل'}
                    </button>

                    {/* Edit Department Button */}
                    <button
                      onClick={() => handleOpenEditDept(dept)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-colors"
                      title="تعديل بيانات الإدارة"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Delete Department Button */}
                    <button
                      onClick={() => setDeleteConfirmDeptId(dept.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors"
                      title="حذف الإدارة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* SECTION 6: سجل تصاريح واستثناءات الإدارة المعتمدة */}
      {/* ============================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-100 text-purple-800">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                6. سجل تصاريح واستثناءات الإدارة المعتمدة
              </h2>
              <p className="text-xs text-slate-500">
                قائمة بالاستثناءات المخصصة الصادرة لحالات أو قاعات أو تواريخ محددة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsGrantModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-xs flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة تصريح استثناء جديد</span>
            </button>
            {onOpenNewBooking && (
              <button
                onClick={() => onOpenNewBooking()}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <span>إنشاء حجز الآن</span>
              </button>
            )}
          </div>
        </div>

        {/* Grants Table / Cards */}
        {(!exc.exceptionGrants || exc.exceptionGrants.length === 0) ? (
          <div className="p-12 text-center text-slate-500">
            <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">لا توجد تصاريح استثناء مخصصة مسجلة</p>
            <p className="text-xs text-slate-400 mt-1">انقر على زر "إضافة تصريح استثناء جديد" لإصدار أول تصريح إداري</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {exc.exceptionGrants.map((grant) => {
              const targetRoomObj = rooms.find((r) => r.id === grant.targetRoomId);
              const roomDisplay = grant.targetRoomId === 'all' ? 'كافة القاعات' : targetRoomObj?.nameAr || grant.targetRoomId;

              const getCategoryBadge = (cat: string) => {
                switch (cat) {
                  case 'holiday':
                    return { label: 'عطلة رسمية', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
                  case 'after_hours':
                    return { label: 'خارج الدوام', bg: 'bg-blue-100 text-blue-800 border-blue-200' };
                  case 'duration':
                    return { label: 'تمديد مدة', bg: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
                  case 'weekend':
                    return { label: 'نهاية الأسبوع', bg: 'bg-amber-100 text-amber-800 border-amber-200' };
                  case 'capacity':
                    return { label: 'سعة فائقة', bg: 'bg-rose-100 text-rose-800 border-rose-200' };
                  default:
                    return { label: 'استثناء شامل', bg: 'bg-purple-100 text-purple-800 border-purple-200' };
                }
              };

              const badge = getCategoryBadge(grant.category);

              return (
                <div
                  key={grant.id}
                  className={`p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                    grant.isActive ? 'bg-white hover:bg-slate-50/70' : 'bg-slate-50/40 opacity-70'
                  }`}
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.bg}`}>
                        {badge.label}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">{grant.title}</h4>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.2 rounded-md ${
                          grant.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {grant.isActive ? 'مفعّل ونشط' : 'معطّل مؤقتاً'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {grant.reason}
                    </p>

                    <div className="flex items-center gap-4 text-[11px] text-slate-500 flex-wrap pt-1">
                      <span className="flex items-center gap-1 font-medium">
                        <DoorOpen className="w-3.5 h-3.5 text-blue-600" />
                        <span>القاعة المشمولة: {roomDisplay}</span>
                      </span>

                      {grant.specificDate && (
                        <span className="flex items-center gap-1 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                          <span>التاريخ: {grant.specificDate} ({formatDateAr(grant.specificDate)})</span>
                        </span>
                      )}

                      {grant.customStartTime && (
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="w-3.5 h-3.5 text-indigo-600" />
                          <span>التوقيت الاستثنائي: {formatTime12(grant.customStartTime)} إلى {formatTime12(grant.customEndTime)}</span>
                        </span>
                      )}

                      {grant.customMaxDurationMinutes && (
                        <span className="flex items-center gap-1 font-medium">
                          <Sliders className="w-3.5 h-3.5 text-purple-600" />
                          <span>المدة المصرح بها: {Math.round(grant.customMaxDurationMinutes / 60)} ساعات</span>
                        </span>
                      )}

                      <span className="flex items-center gap-1 text-slate-400">
                        <span>المعتمد: {grant.approvedBy}</span>
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center">
                    <button
                      type="button"
                      onClick={() => {
                        toggleExceptionGrant(grant.id);
                        showToast(`تم ${grant.isActive ? 'تعطيل' : 'تفعيل'} تصريح الاستثناء: ${grant.title}`);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        grant.isActive
                          ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {grant.isActive ? (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>تعطيل</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3.5 h-3.5" />
                          <span>تفعيل</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        deleteExceptionGrant(grant.id);
                        showToast('تم حذف تصريح الاستثناء بنجاح');
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="حذف التصريح"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* MODAL: إضافة تصريح استثناء جديد */}
      {/* ============================================================== */}
      {isGrantModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 bg-linear-to-r from-blue-900 via-blue-800 to-indigo-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-sky-300" />
                <h3 className="text-base font-bold">إصدار تصريح استثناء إداري جديد</h3>
              </div>
              <button
                onClick={() => setIsGrantModalOpen(false)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddGrantSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  نوع الاستثناء <span className="text-red-500">*</span>
                </label>
                <select
                  value={grantCategory}
                  onChange={(e) => setGrantCategory(e.target.value as AdminExceptionGrant['category'])}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold bg-white"
                >
                  <option value="holiday">استثناء حجز في عطلة رسمية (Holiday Exception)</option>
                  <option value="after_hours">استثناء توقيت خارج الدوام (After-Hours Exception)</option>
                  <option value="duration">استثناء تمديد مدة الاجتماع (Duration Exception)</option>
                  <option value="weekend">استثناء عطلة نهاية الأسبوع (Weekend Exception)</option>
                  <option value="capacity">استثناء سعة القاعة وعدد الحضور (Capacity Exception)</option>
                  <option value="all">استثناء إداري شامل لجميع القيود (All Restrictions)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  عنوان أو موضوع الاستثناء <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={grantTitle}
                  onChange={(e) => setGrantTitle(e.target.value)}
                  placeholder="مثال: استثناء ورشة مناوبات الدوريات خارج الدوام"
                  required
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  السبب ومبرر الاستثناء الإداري <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={grantReason}
                  onChange={(e) => setGrantReason(e.target.value)}
                  placeholder="يرجى كتابة سبب طلب الاستثناء وموافقة الإدارة..."
                  rows={2}
                  required
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    القاعة المشمولة بالاستثناء
                  </label>
                  <select
                    value={grantTargetRoomId}
                    onChange={(e) => setGrantTargetRoomId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold bg-white"
                  >
                    <option value="all">كافة القاعات (الدانة والواحة)</option>
                    <option value="room-dana">قاعة الدانة فقط</option>
                    <option value="room-waha">قاعة الواحة فقط</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    تاريخ محدد (اختياري)
                  </label>
                  <input
                    type="date"
                    value={grantSpecificDate}
                    onChange={(e) => setGrantSpecificDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-800"
                  />
                </div>
              </div>

              {grantCategory === 'after_hours' && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-blue-50/60 rounded-xl border border-blue-200">
                  <div>
                    <label className="block text-[11px] font-bold text-blue-900 mb-1">
                      وقت البداية المصرح
                    </label>
                    <input
                      type="time"
                      value={grantCustomStartTime}
                      onChange={(e) => setGrantCustomStartTime(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-blue-300 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-blue-900 mb-1">
                      وقت النهاية المصرح
                    </label>
                    <input
                      type="time"
                      value={grantCustomEndTime}
                      onChange={(e) => setGrantCustomEndTime(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-blue-300 text-xs"
                    />
                  </div>
                </div>
              )}

              {grantCategory === 'duration' && (
                <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-200">
                  <label className="block text-[11px] font-bold text-indigo-900 mb-1">
                    الحد الأقصى المصرح به (بالدقائق)
                  </label>
                  <select
                    value={grantCustomMaxDuration}
                    onChange={(e) => setGrantCustomMaxDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-indigo-300 text-xs font-semibold bg-white"
                  >
                    <option value={360}>6 ساعات (360 دقيقة)</option>
                    <option value={480}>8 ساعات (480 دقيقة - يوم عمل كامل)</option>
                    <option value={720}>12 ساعة (720 دقيقة)</option>
                    <option value={1440}>24 ساعة (1440 دقيقة - غير محدود)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  اسم المسؤول المصادق على الاستثناء
                </label>
                <input
                  type="text"
                  value={grantApprovedBy}
                  onChange={(e) => setGrantApprovedBy(e.target.value)}
                  placeholder="مثال: سعادة المدير التنفيذي / مدير إدارة العمليات"
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsGrantModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-xs"
                >
                  اعتماد وحفظ التصريح
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: إضافة عطلة رسمية جديدة */}
      {/* ============================================================== */}
      {isAddHolidayOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-300" />
                <h3 className="text-base font-bold">إضافة عطلة رسمية للنظام</h3>
              </div>
              <button
                onClick={() => setIsAddHolidayOpen(false)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddHolidaySubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  اسم العطلة الرسمية <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newHolidayName}
                  onChange={(e) => setNewHolidayName(e.target.value)}
                  placeholder="مثال: يوم الشهيد"
                  required
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  تاريخ العطلة <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={newHolidayDate}
                  onChange={(e) => setNewHolidayDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddHolidayOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs"
                >
                  إضافة العطلة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: إضافة إدارة جديدة بشكل رسمي */}
      {/* ============================================================== */}
      {isAddDeptModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-700/80 text-white">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">إضافة إدارة جديدة بشكل رسمي</h3>
                  <p className="text-[11px] text-blue-200">
                    تنعكس فوراً في خانة «الإدارة الحاجزة» لقاعتي الدانة والواحة
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddDeptModalOpen(false)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDepartmentSubmit} className="p-6 space-y-4">
              {/* Quick suggestions strip */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>اقتراحات شائعة للتعبئة السريعة:</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {DEPARTMENT_SUGGESTIONS.map((sug, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setNewDeptNameAr(sug.nameAr);
                        setNewDeptNameEn(sug.nameEn);
                        setNewDeptCode(sug.code);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-800 border border-slate-200 hover:border-blue-300 text-[11px] font-semibold transition-all"
                    >
                      {sug.nameAr}
                    </button>
                  ))}
                </div>
              </div>

              {/* Department Name AR */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  اسم الإدارة الرسمي باللغة العربية <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newDeptNameAr}
                  onChange={(e) => setNewDeptNameAr(e.target.value)}
                  placeholder="مثال: إدارة التحول الرقمي والذكاء الاصطناعي"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
              </div>

              {/* Department Name EN & Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    اسم الإدارة بالإنجليزية (اختياري)
                  </label>
                  <input
                    type="text"
                    value={newDeptNameEn}
                    onChange={(e) => setNewDeptNameEn(e.target.value)}
                    placeholder="مثال: Digital Transformation & AI"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    رمز الإدارة الكودي (Code)
                  </label>
                  <input
                    type="text"
                    value={newDeptCode}
                    onChange={(e) => setNewDeptCode(e.target.value)}
                    placeholder={`مثال: DEP-${String(departments.length + 1).padStart(2, '0')}`}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold text-slate-900 uppercase focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  />
                </div>
              </div>

              {/* Department Status */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  حالة التفعيل والاعتماد في النظام
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      newDeptStatus === 'active'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="deptStatus"
                      checked={newDeptStatus === 'active'}
                      onChange={() => setNewDeptStatus('active')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="text-xs font-bold block">نشطة ومعتمدة</span>
                      <span className="text-[10px] text-slate-500">تظهر فوراً في خيارات الحجز</span>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      newDeptStatus === 'inactive'
                        ? 'bg-slate-100 border-slate-400 text-slate-950 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="deptStatus"
                      checked={newDeptStatus === 'inactive'}
                      onChange={() => setNewDeptStatus('inactive')}
                      className="text-slate-600 focus:ring-slate-500"
                    />
                    <div>
                      <span className="text-xs font-bold block">معطلة مؤقتاً</span>
                      <span className="text-[10px] text-slate-500">مخفية من قائمة الحجز</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Guarantee Notice */}
              <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-200 text-xs text-blue-900 space-y-1">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0" />
                  <span>تأكيد اعتماد الانعكاس الفوري للقاعات:</span>
                </div>
                <p className="text-[11px] text-blue-800 leading-relaxed ps-6">
                  ستنعكس هذه الإدارة فوراً وبشكل تلقائي في خانة <strong>«الإدارة الحاجزة (Department ID) *»</strong> عند إضافة حجز جديد لقاعة الدانة أو قاعة الواحة، وستُحتسب في كافة إحصائيات النظام.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddDeptModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-xs flex items-center gap-2 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  <span>اعتماد وإضافة الإدارة إلى النظام فوراً</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: تعديل بيانات الإدارة الرسمية */}
      {/* ============================================================== */}
      {isEditDeptModalOpen && editingDept && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-600 text-white">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">تعديل بيانات الإدارة الرسمية</h3>
                  <p className="text-[11px] text-slate-300">
                    تعديل الاسم أو الكود أو حالة التفعيل في خيارات حجز القاعات
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsEditDeptModalOpen(false);
                  setEditingDept(null);
                }}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditDepartmentSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  اسم الإدارة باللغة العربية <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editDeptNameAr}
                  onChange={(e) => setEditDeptNameAr(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    اسم الإدارة بالإنجليزية
                  </label>
                  <input
                    type="text"
                    value={editDeptNameEn}
                    onChange={(e) => setEditDeptNameEn(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    رمز الإدارة الكودي (Code)
                  </label>
                  <input
                    type="text"
                    value={editDeptCode}
                    onChange={(e) => setEditDeptCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold text-slate-900 uppercase focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  حالة النشاط في خيارات الحجز
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      editDeptStatus === 'active'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="editDeptStatus"
                      checked={editDeptStatus === 'active'}
                      onChange={() => setEditDeptStatus('active')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-bold">نشطة ومعتمدة</span>
                  </label>

                  <label
                    className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      editDeptStatus === 'inactive'
                        ? 'bg-slate-100 border-slate-400 text-slate-950'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="editDeptStatus"
                      checked={editDeptStatus === 'inactive'}
                      onChange={() => setEditDeptStatus('inactive')}
                      className="text-slate-600 focus:ring-slate-500"
                    />
                    <span className="text-xs font-bold">معطلة مؤقتاً</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditDeptModalOpen(false);
                    setEditingDept(null);
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  حفظ التعديلات في النظام
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: تأكيد حذف الإدارة */}
      {/* ============================================================== */}
      {deleteConfirmDeptId && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">تأكيد حذف الإدارة</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                هل أنت متأكد من رغبتك في حذف إدارة «
                <strong>
                  {departments.find((d) => d.id === deleteConfirmDeptId)?.nameAr}
                </strong>
                » من قائمة الإدارات المعتمدة؟ لن تظهر هذه الإدارة بعد الحذف في قائمة الحجز الجديدة.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmDeptId(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetDept = departments.find((d) => d.id === deleteConfirmDeptId);
                  if (targetDept) {
                    handleDeleteDept(targetDept.id, targetDept.nameAr);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition-colors"
              >
                نعم، احذف الإدارة
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
