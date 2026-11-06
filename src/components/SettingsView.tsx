import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Settings,
  Building2,
  Calendar,
  Clock,
  Shield,
  PlusCircle,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Users,
  UserPlus,
  Mail,
  Phone,
  Hash
} from 'lucide-react';
import { formatTime12 } from '../utils/dateUtils';
import { UserRole } from '../types';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    departments,
    addDepartment,
    holidays,
    addHoliday,
    deleteHoliday,
    users,
    addUser,
    deleteUser,
    clearAllBookings,
    clearAllLogs,
    clearAllRecords,
    resetAllData,
    deleteAllCancelledBookings,
    bookings,
    currentUser
  } = useApp();

  const [activeTab, setActiveTab] = useState<'general' | 'departments' | 'holidays' | 'users'>('general');
  const [resetDoneMessage, setResetDoneMessage] = useState<string | null>(null);

  // Form states
  const [minMins, setMinMins] = useState(settings.minMeetingMinutes);
  const [maxMins, setMaxMins] = useState(settings.maxMeetingMinutes);
  const [allowWeekend, setAllowWeekend] = useState(settings.allowWeekendBookings);
  const [operatingStart, setOperatingStart] = useState(settings.operatingHoursStart);
  const [operatingEnd, setOperatingEnd] = useState(settings.operatingHoursEnd);
  const [autoRelease, setAutoRelease] = useState(settings.autoReleaseMinutes);

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Department modal state
  const [newDeptNameAr, setNewDeptNameAr] = useState('');
  const [newDeptNameEn, setNewDeptNameEn] = useState('');
  const [newDeptCode, setNewDeptCode] = useState('');

  // Holiday state
  const [newHolName, setNewHolName] = useState('');
  const [newHolDate, setNewHolDate] = useState('');

  // User management state
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserEmpId, setNewUserEmpId] = useState('');
  const [newUserDeptId, setNewUserDeptId] = useState(departments[0]?.id || 'dept-exec');
  const [newUserRole, setNewUserRole] = useState<UserRole>('employee');
  const [userActionMsg, setUserActionMsg] = useState<string | null>(null);

  // Modal confirm dialog state for destructive actions
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    actionText: string;
    dangerLevel?: 'rose' | 'amber';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    actionText: '',
    dangerLevel: 'rose',
    onConfirm: () => {}
  });

  const requestConfirm = (
    title: string,
    description: string,
    actionText: string,
    onConfirm: () => void,
    dangerLevel: 'rose' | 'amber' = 'rose'
  ) => {
    setConfirmDialog({
      isOpen: true,
      title,
      description,
      actionText,
      dangerLevel,
      onConfirm
    });
  };

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      minMeetingMinutes: minMins,
      maxMeetingMinutes: maxMins,
      allowWeekendBookings: allowWeekend,
      operatingHoursStart: operatingStart,
      operatingHoursEnd: operatingEnd,
      autoReleaseMinutes: autoRelease
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleAddDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptNameAr.trim()) return;
    addDepartment({
      nameAr: newDeptNameAr,
      nameEn: newDeptNameEn || newDeptNameAr,
      code: newDeptCode || `DEP-${departments.length + 1}`,
      status: 'active'
    });
    setNewDeptNameAr('');
    setNewDeptNameEn('');
    setNewDeptCode('');
  };

  const handleAddHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHolName.trim() || !newHolDate) return;
    addHoliday({
      nameAr: newHolName,
      nameEn: newHolName,
      date: newHolDate,
      status: 'active'
    });
    setNewHolName('');
    setNewHolDate('');
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserEmpId.trim() || !newUserPhone.trim()) {
      return;
    }
    const dept = departments.find((d) => d.id === newUserDeptId);
    addUser({
      fullName: newUserName.trim(),
      email: newUserEmail.trim(),
      phone: newUserPhone.trim(),
      employeeId: newUserEmpId.trim().toUpperCase(),
      departmentId: newUserDeptId,
      departmentNameAr: dept?.nameAr || 'إدارة الخدمات العامة',
      role: newUserRole,
      status: 'active'
    });
    setUserActionMsg(`تمت إضافة المستخدم "${newUserName.trim()}" إلى النظام بنجاح!`);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserPhone('');
    setNewUserEmpId('');
    setTimeout(() => setUserActionMsg(null), 4000);
  };

  const handleClearBookingsOnly = () => {
    requestConfirm(
      'تصفير سجل الحجوزات فقط',
      'هل أنت متأكد من رغبتك في حذف جميع الحجوزات وتصفير سجل الاجتماعات والقاعات بالكامل؟',
      'تصفير الحجوزات',
      () => {
        clearAllBookings();
        setResetDoneMessage('تم تصفير جميع الحجوزات بنجاح وإفراغ سجل القاعات.');
        setTimeout(() => setResetDoneMessage(null), 4000);
      },
      'amber'
    );
  };

  const handleFullReset = () => {
    requestConfirm(
      'إعادة ضبط وتصفير النظام بالكامل',
      'تحذير: سيتم حذف جميع الحجوزات وتصفير إعدادات وقاعات وسجلات النظام بالكامل وإعادته إلى الحالة الصفرية النظيفة.',
      'تصفير النظام بالكامل',
      () => {
        resetAllData();
        setResetDoneMessage('تم تصفير النظام بالكامل وإعادته إلى الحالة الصفرية النظيفة.');
        setTimeout(() => setResetDoneMessage(null), 4000);
      },
      'rose'
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-800">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              إعدادات النظام وسياسات الحجز (System Settings)
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              تهيئة أوقات العمل، سياسات عطلة نهاية الأسبوع، إدارة الإدارات والعطلات الرسمية
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleClearBookingsOnly}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 hover:bg-amber-100 text-xs font-bold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
            <span>تصفير الحجوزات فقط</span>
          </button>
          
          <button
            onClick={handleFullReset}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 hover:bg-rose-100 text-xs font-bold transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-700" />
            <span>تصفير النظام بالكامل</span>
          </button>
        </div>
      </div>

      {resetDoneMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 flex items-center gap-2 text-xs font-bold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{resetDoneMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="flex items-center gap-2 p-2 bg-slate-50 border-b border-slate-200 text-xs font-bold">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'general' ? 'bg-blue-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            سياسات الحجز وساعات التشغيل
          </button>
          <button
            onClick={() => setActiveTab('departments')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'departments' ? 'bg-blue-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            إدارة الإدارات (Departments)
          </button>
          <button
            onClick={() => setActiveTab('holidays')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'holidays' ? 'bg-blue-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            العطلات الرسمية والاستثنائية
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'users' ? 'bg-blue-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            إدارة المستخدمين والحسابات
          </button>
        </div>

        {/* Tab 1: General & Booking Policies */}
        {activeTab === 'general' && (
          <form onSubmit={handleSaveGeneral} className="p-6 space-y-6 text-xs sm:text-sm">
            
            {savedSuccess && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 flex items-center gap-2 text-xs font-bold animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>تم حفظ إعدادات النظام وسياسات الحجز بنجاح.</span>
              </div>
            )}

            {/* Operating Days Policy (#3) */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-700" />
                <span>أيام العمل المعتمدة والعطلة الأسبوعية</span>
              </h3>
              <p className="text-xs text-slate-600">
                النظام يعتمد رسمياً أيام العمل من <strong>الاثنين إلى الجمعة</strong>، والعطلة الأسبوعية يومي <strong>السبت والأحد</strong>.
              </p>
              
              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowWeekend}
                    onChange={(e) => setAllowWeekend(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded-sm focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-bold text-slate-800 text-xs">
                      السماح بالحجز الاستثنائي خلال عطلة نهاية الأسبوع (السبت والأحد)
                    </span>
                    <p className="text-[11px] text-slate-500">
                      عند التعطيل، يمنع النظام الحجز ويعرض الرسالة المعتمدة: "لا يمكن إنشاء حجز في عطلة نهاية الأسبوع. أيام الحجز المعتمدة هي من الاثنين إلى الجمعة."
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Hours and Durations */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700 text-xs">
                    بداية ساعات العمل التشغيلية (نظام 12 ساعة):
                  </label>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                    {formatTime12(operatingStart)}
                  </span>
                </div>
                <input
                  type="time"
                  value={operatingStart}
                  onChange={(e) => setOperatingStart(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700 text-xs">
                    نهاية ساعات العمل التشغيلية (نظام 12 ساعة):
                  </label>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800">
                    {formatTime12(operatingEnd)}
                  </span>
                </div>
                <input
                  type="time"
                  value={operatingEnd}
                  onChange={(e) => setOperatingEnd(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 text-xs mb-1">
                  الحد الأدنى لمدة الاجتماع (دقيقة):
                </label>
                <input
                  type="number"
                  step="15"
                  value={minMins}
                  onChange={(e) => setMinMins(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 text-xs mb-1">
                  الحد الأقصى لمدة الاجتماع (دقيقة):
                </label>
                <input
                  type="number"
                  step="30"
                  value={maxMins}
                  onChange={(e) => setMaxMins(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 text-xs mb-1">
                  الإخلاء التلقائي عند عدم الحضور Auto-Release (دقيقة):
                </label>
                <input
                  type="number"
                  value={autoRelease}
                  onChange={(e) => setAutoRelease(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>
            </div>

            {/* Danger Zone: Clear records */}
            <div className="p-4 bg-rose-50/70 rounded-xl border border-rose-200 space-y-3">
              <h3 className="font-bold text-rose-900 text-xs sm:text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>إفراغ وتصفير سجلات النظام</span>
              </h3>
              <p className="text-xs text-rose-800">
                يمكنك إفراغ النظام من جميع السجلات الحالية (الحجوزات، سجلات التدقيق، وسجلات الاستثناءات) بنقرة واحدة.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    requestConfirm(
                      'إفراغ جميع سجلات النظام بالكامل',
                      'هل أنت متأكد من رغبتك في إفراغ النظام من جميع السجلات بالكامل (الحجوزات، سجلات التدقيق، والاستثناءات)؟',
                      'إفراغ جميع السجلات',
                      () => {
                        clearAllRecords();
                        setResetDoneMessage('تم إفراغ النظام من جميع السجلات بنجاح');
                        setTimeout(() => setResetDoneMessage(null), 3500);
                      },
                      'rose'
                    );
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>إفراغ جميع سجلات النظام بالكامل</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    requestConfirm(
                      'إفراغ سجل الحجوزات فقط',
                      'هل أنت متأكد من رغبتك في إفراغ سجل الحجوزات فقط؟',
                      'إفراغ الحجوزات',
                      () => {
                        clearAllBookings();
                        setResetDoneMessage('تم إفراغ سجل الحجوزات بنجاح');
                        setTimeout(() => setResetDoneMessage(null), 3500);
                      },
                      'amber'
                    );
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 font-bold text-xs transition-colors cursor-pointer"
                >
                  إفراغ الحجوزات فقط
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const count = bookings.filter((b) => b.status === 'cancelled').length;
                    if (count === 0) {
                      setResetDoneMessage('لا توجد أي حجوزات ملغاة لحذفها في الوقت الحالي.');
                      setTimeout(() => setResetDoneMessage(null), 3500);
                      return;
                    }
                    requestConfirm(
                      'حذف الحجوزات الملغية فقط',
                      `هل أنت متأكد من حذف جميع الحجوزات الملغية في النظام (${count} حجز ملغي) نهائياً من قاعدة البيانات؟`,
                      'حذف الملغية فقط',
                      () => {
                        const res = deleteAllCancelledBookings();
                        setResetDoneMessage(res.message);
                        setTimeout(() => setResetDoneMessage(null), 3500);
                      },
                      'amber'
                    );
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="حذف الحجوزات الملغاة فقط مع الإبقاء الكامل على الحجوزات المؤكدة والمكتملة"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف الحجوزات الملغية فقط ({bookings.filter((b) => b.status === 'cancelled').length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    requestConfirm(
                      'إفراغ سجل التدقيق والعمليات',
                      'هل أنت متأكد من رغبتك في إفراغ وحذف جميع سجلات التدقيق والعمليات؟',
                      'إفراغ سجل التدقيق',
                      () => {
                        clearAllLogs();
                        setResetDoneMessage('تم إفراغ سجلات التدقيق بنجاح');
                        setTimeout(() => setResetDoneMessage(null), 3500);
                      },
                      'rose'
                    );
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 font-bold text-xs transition-colors cursor-pointer"
                >
                  إفراغ سجل التدقيق فقط
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-md transition-colors"
              >
                حفظ التغييرات
              </button>
            </div>

          </form>
        )}

        {/* Tab 2: Departments Management (#8) */}
        {activeTab === 'departments' && (
          <div className="p-6 space-y-6">
            
            {/* Add Department Form */}
            <form onSubmit={handleAddDept} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-blue-700" />
                <span>إضافة إدارة جديدة</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">اسم الإدارة بالعربية *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: إدارة الاتصال المؤسسي"
                    value={newDeptNameAr}
                    onChange={(e) => setNewDeptNameAr(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">الاسم بالإنجليزية</label>
                  <input
                    type="text"
                    placeholder="e.g. Corporate Communications"
                    value={newDeptNameEn}
                    onChange={(e) => setNewDeptNameEn(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">الرمز (Code)</label>
                  <input
                    type="text"
                    placeholder="e.g. CC"
                    value={newDeptCode}
                    onChange={(e) => setNewDeptCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white uppercase font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs"
                >
                  إضافة الإدارة
                </button>
              </div>
            </form>

            {/* Existing Departments Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-start border-collapse">
                <thead className="bg-slate-100 font-bold text-slate-700">
                  <tr>
                    <th className="p-3 text-start">معرّف الإدارة (ID)</th>
                    <th className="p-3 text-start">اسم الإدارة (بالعربية)</th>
                    <th className="p-3 text-start">الاسم بالإنجليزية</th>
                    <th className="p-3 text-center">الرمز</th>
                    <th className="p-3 text-center">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {departments.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-blue-900">{d.id}</td>
                      <td className="p-3 font-bold text-slate-900">{d.nameAr}</td>
                      <td className="p-3 text-slate-600">{d.nameEn}</td>
                      <td className="p-3 text-center font-mono font-semibold">{d.code}</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          نشطة
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* Tab 3: Holidays Management (#3) */}
        {activeTab === 'holidays' && (
          <div className="p-6 space-y-6">
            
            <form onSubmit={handleAddHoliday} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-blue-700" />
                <span>إضافة عطلة رسمية أو استثنائية</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">اسم العطلة *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: يوم الشهيد"
                    value={newHolName}
                    onChange={(e) => setNewHolName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">تاريخ العطلة *</label>
                  <input
                    type="date"
                    required
                    value={newHolDate}
                    onChange={(e) => setNewHolDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs"
                >
                  إضافة العطلة
                </button>
              </div>
            </form>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-start">
                <thead className="bg-slate-100 font-bold text-slate-700">
                  <tr>
                    <th className="p-3 text-start">اسم العطلة</th>
                    <th className="p-3 text-start">التاريخ</th>
                    <th className="p-3 text-center">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {holidays.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">{h.nameAr}</td>
                      <td className="p-3 font-mono font-semibold">{h.date}</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => deleteHoliday(h.id)}
                          className="text-rose-600 hover:text-rose-800 font-bold"
                          title="حذف العطلة"
                        >
                          <Trash2 className="w-4 h-4 mx-auto" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* Tab 4: Users Management */}
        {activeTab === 'users' && (
          <div className="p-6 space-y-6">
            
            {userActionMsg && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 flex items-center gap-2 text-xs font-bold animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{userActionMsg}</span>
              </div>
            )}

            {/* Add User Form */}
            <form onSubmit={handleAddUser} className="p-5 bg-indigo-50/40 rounded-xl border border-indigo-200 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-indigo-100">
                <UserPlus className="w-4 h-4 text-indigo-700" />
                <h3 className="font-bold text-slate-900 text-sm">
                  إضافة مستخدم جديد للنظام بشكل يدوي
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الاسم الكامل: *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: سعيد راشد الكعبي"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">الرقم الوظيفي: *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: SD-1033"
                    value={newUserEmpId}
                    onChange={(e) => setNewUserEmpId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono uppercase"
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="block font-bold text-slate-700 mb-1">الدور والصلاحية:</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-bold text-slate-800"
                  >
                    <option value="employee">موظف (Employee) — ضوابط قياسية (لا يُمنح صلاحية الأدمن أو استثناءات الإدارة)</option>
                    <option value="coordinator">منسق الحجوزات (Coordinator) — ضوابط قياسية (لا يُمنح صلاحية الأدمن أو استثناءات الإدارة)</option>
                    <option value="viewer">مستعرض فقط (Viewer) — للاطلاع فقط (بدون صلاحيات إدارية أو إمكانية الحجز)</option>
                    <option value="admin">مدير النظام (Admin) — صلاحيات إدارية واستثناءات حجز القاعات</option>
                    <option value="super_admin">مدير عام النظام (Super Admin) — صلاحيات إدارية شاملة</option>
                  </select>

                  {/* Permission scope notice */}
                  {newUserRole === 'employee' || newUserRole === 'coordinator' || newUserRole === 'viewer' ? (
                    <div className="p-2.5 rounded-lg border border-amber-300 bg-amber-50 text-[11px] text-amber-900 leading-relaxed">
                      <strong>⚠️ تنبيه الصلاحية:</strong> هذا الدور مقيد بالضوابط القياسية الرسمية لحجز القاعات. <strong>لن يتم منحه صلاحية الأدمن ولا يُسمح له باستخدام خيارات أو استثناءات الإدارة</strong> (محظور من حجز العطلات أو عطلة نهاية الأسبوع أو تجاوز المدة القصوى).
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-lg border border-purple-200 bg-purple-50 text-[11px] text-purple-900 leading-relaxed">
                      <strong>🛡️ صلاحية إدارية:</strong> يملك المستخدم صلاحيات مدير النظام للوصول إلى خيارات واستثناءات الإدارة لحجز القاعات.
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">البريد الإلكتروني: *</label>
                  <input
                    type="email"
                    dir="ltr"
                    required
                    placeholder="user@saaed.ae"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم الهاتف / التحويلة: *</label>
                  <input
                    type="text"
                    dir="ltr"
                    required
                    placeholder="+971 50 111 2233"
                    value={newUserPhone}
                    onChange={(e) => setNewUserPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">الإدارة:</label>
                  <select
                    value={newUserDeptId}
                    onChange={(e) => setNewUserDeptId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.nameAr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>إضافة المستخدم يدوياً</span>
                </button>
              </div>
            </form>

            {/* Users List Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-start">
                <thead className="bg-slate-100 font-bold text-slate-700">
                  <tr>
                    <th className="p-3 text-start">المستخدم</th>
                    <th className="p-3 text-start">الرقم الوظيفي</th>
                    <th className="p-3 text-start">الإدارة</th>
                    <th className="p-3 text-start">البريد الإلكتروني</th>
                    <th className="p-3 text-start">رقم الهاتف</th>
                    <th className="p-3 text-center">الصلاحية</th>
                    <th className="p-3 text-center">حذف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {users.map((u) => {
                    const isSuperAdminPrimary = u.id === 'user-1';
                    return (
                      <tr key={u.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900">
                          {u.fullName}
                          {isSuperAdminPrimary && (
                            <span className="mr-2 text-[10px] text-purple-700 font-semibold bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                              رئيسي
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-mono text-blue-900 font-bold">{u.employeeId}</td>
                        <td className="p-3 text-slate-600 font-medium">
                          {u.departmentNameAr || departments.find((d) => d.id === u.departmentId)?.nameAr || 'إدارة الخدمات العامة'}
                        </td>
                        <td className="p-3 font-mono text-slate-600" dir="ltr">{u.email}</td>
                        <td className="p-3 font-mono text-slate-600" dir="ltr">{u.phone}</td>
                        <td className="p-3 text-center font-bold text-[11px] text-indigo-700">
                          {u.role === 'super_admin' ? 'Super Admin' : u.role}
                        </td>
                        <td className="p-3 text-center">
                          {!isSuperAdminPrimary ? (
                            <button
                              onClick={() => {
                                requestConfirm(
                                  'حذف حساب مستخدم',
                                  `هل أنت متأكد من حذف المستخدم "${u.fullName}" نهائياً من النظام؟`,
                                  'حذف المستخدم',
                                  () => {
                                    deleteUser(u.id);
                                    setUserActionMsg(`تم حذف المستخدم ${u.fullName} بنجاح.`);
                                    setTimeout(() => setUserActionMsg(null), 3000);
                                  },
                                  'rose'
                                );
                              }}
                              className="text-rose-600 hover:text-rose-800 font-bold p-1 hover:bg-rose-50 rounded cursor-pointer"
                              title="حذف المستخدم"
                            >
                              <Trash2 className="w-4 h-4 mx-auto" />
                            </button>
                          ) : (
                            <span className="text-slate-300 text-[10px]">محمي</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>
        )}

      </div>

      {/* Confirmation Modal */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-5 animate-in zoom-in-95 duration-200 text-right" dir="rtl">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl shrink-0 ${confirmDialog.dangerLevel === 'amber' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{confirmDialog.title}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{confirmDialog.description}</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 leading-relaxed">
              تنبيه: هذا الإجراء سيتناول سجلات وقواعد البيانات مباشرة ولن يكون بالإمكان التراجع بعد إكماله.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                إلغاء الأمر
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
                }}
                className={`px-4 py-2 rounded-xl text-white text-xs font-bold transition-colors cursor-pointer shadow-xs ${
                  confirmDialog.dangerLevel === 'amber'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {confirmDialog.actionText}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
