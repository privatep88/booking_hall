import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Mail,
  Phone,
  Building2,
  Calendar,
  Edit3,
  Check,
  X,
  CheckCircle2,
  AlertCircle,
  Hash,
  RotateCcw,
  UserPlus,
  Users,
  Trash2,
  UserCheck,
  KeyRound,
  Briefcase,
  Camera,
  Upload,
  Image as ImageIcon,
  Link as LinkIcon,
  Sparkles,
  LogOut
} from 'lucide-react';
import { Booking, User, UserRole } from '../types';
import { formatTimeRange12 } from '../utils/dateUtils';
import { AVATAR_PRESETS } from '../utils/avatarPresets';

interface ProfileViewProps {
  onSelectBooking: (b: Booking) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onSelectBooking }) => {
  const {
    currentUser,
    users,
    departments,
    bookings,
    updateUserProfile,
    addUser,
    updateUser,
    deleteUser,
    setCurrentUser,
    language,
    logout
  } = useApp();

  const myBookings = bookings.filter((b) => b.userId === currentUser.id);

  // Profile manual edit form state
  const [isEditing, setIsEditing] = useState(false);
  const [email, setEmail] = useState(currentUser.email);
  const [phone, setPhone] = useState(currentUser.phone);
  const [employeeId, setEmployeeId] = useState(currentUser.employeeId);
  const [departmentNameAr, setDepartmentNameAr] = useState(
    currentUser.departmentNameAr || 'إدارة الخدمات العامة'
  );

  // Profile photo manual edit states
  const [avatarUrl, setAvatarUrl] = useState<string>(currentUser.avatarUrl || '');
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [avatarTab, setAvatarTab] = useState<'preset' | 'upload' | 'url'>('preset');
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);

  // New user manual add form state
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmployeeId, setNewEmployeeId] = useState('');
  const [newDepartmentId, setNewDepartmentId] = useState(departments[0]?.id || 'dept-serv');
  const [newCustomDeptName, setNewCustomDeptName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('employee');

  // Edit existing user modal/state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserPhone, setEditUserPhone] = useState('');
  const [editUserEmpId, setEditUserEmpId] = useState('');
  const [editUserDeptId, setEditUserDeptId] = useState('');
  const [editUserDeptName, setEditUserDeptName] = useState('');
  const [editUserRole, setEditUserRole] = useState<UserRole>('employee');

  // Feedback states
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deletingUser, setDeletingUser] = useState<{ id: string; name: string } | null>(null);

  // Sync state if currentUser changes
  useEffect(() => {
    setEmail(currentUser.email);
    setPhone(currentUser.phone);
    setEmployeeId(currentUser.employeeId);
    setAvatarUrl(currentUser.avatarUrl || '');
    setDepartmentNameAr(
      currentUser.departmentNameAr || 'إدارة الخدمات العامة'
    );
  }, [currentUser]);

  const handleStartEdit = () => {
    setEmail(currentUser.email);
    setPhone(currentUser.phone);
    setEmployeeId(currentUser.employeeId);
    setAvatarUrl(currentUser.avatarUrl || '');
    setDepartmentNameAr(
      currentUser.departmentNameAr || 'إدارة الخدمات العامة'
    );
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEmail(currentUser.email);
    setPhone(currentUser.phone);
    setEmployeeId(currentUser.employeeId);
    setAvatarUrl(currentUser.avatarUrl || '');
    setDepartmentNameAr(
      currentUser.departmentNameAr || 'إدارة الخدمات العامة'
    );
    setErrorMessage(null);
    setIsEditing(false);
  };

  const handleResetToDefault = () => {
    setEmail('hall@hall.ae');
    setPhone('+971 50 123 4567');
    setEmployeeId('SD-1001');
    setDepartmentNameAr('إدارة الخدمات العامة');
    setAvatarUrl('');
  };

  // Direct Save/Remove Photo handlers
  const handleSaveAvatar = (targetUrl?: string) => {
    const finalUrl = targetUrl !== undefined ? targetUrl : avatarUrl;
    updateUserProfile({
      avatarUrl: finalUrl ? finalUrl : undefined
    });
    setIsAvatarModalOpen(false);
    setSuccessMessage('تم تحديث صورتك الشخصية بنجاح وتطبيقها في جميع أنحاء النظام!');
    setTimeout(() => {
      setSuccessMessage(null);
    }, 4500);
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl('');
    updateUserProfile({
      avatarUrl: undefined
    });
    setIsAvatarModalOpen(false);
    setSuccessMessage('تمت إزالة الصورة الشخصية والعودة إلى الحروف الأولية للاسم بنجاح.');
    setTimeout(() => {
      setSuccessMessage(null);
    }, 4500);
  };

  // Local File Upload with optimized canvas downscaling
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('يرجى اختيار ملف صورة صالح (JPEG, PNG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 5 ميجابايت.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const maxDim = 256;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const optimized = canvas.toDataURL('image/jpeg', 0.88);
            setAvatarUrl(optimized);
          } else {
            setAvatarUrl(rawDataUrl);
          }
        } catch {
          setAvatarUrl(rawDataUrl);
        }
      };
      img.onerror = () => {
        setUploadError('تعذر معالجة ملف الصورة المحدد.');
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    const cleanPhone = phone.trim();
    const cleanEmpId = employeeId.trim();
    const cleanDept = departmentNameAr.trim();

    if (!cleanDept) {
      setErrorMessage(
        language === 'ar'
          ? 'يرجى إدخال المسمى / الإدارة للمستخدم'
          : 'Please enter department / job title'
      );
      return;
    }

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage(
        language === 'ar'
          ? 'يرجى إدخال عنوان بريد إلكتروني صالح ومكتمل'
          : 'Please enter a valid email address'
      );
      return;
    }

    if (!cleanPhone) {
      setErrorMessage(
        language === 'ar'
          ? 'يرجى إدخال رقم الهاتف أو التحويلة الداخلية'
          : 'Please enter a valid phone number or extension'
      );
      return;
    }

    if (!cleanEmpId) {
      setErrorMessage(
        language === 'ar'
          ? 'يرجى إدخال الرقم الوظيفي الخاص بك'
          : 'Please enter your employee ID'
      );
      return;
    }

    updateUserProfile({
      departmentNameAr: cleanDept,
      email: cleanEmail,
      phone: cleanPhone,
      employeeId: cleanEmpId,
      avatarUrl: avatarUrl || undefined
    });

    setIsEditing(false);
    setSuccessMessage(
      language === 'ar'
        ? 'تم حفظ وتحديث المسمى، والبريد الإلكتروني، ورقم الهاتف، والرقم الوظيفي، والصورة الشخصية بنجاح!'
        : 'Profile details (Title, Email, Phone, Employee ID, Profile Photo) updated successfully!'
    );

    setTimeout(() => {
      setSuccessMessage(null);
    }, 4500);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanName = newFullName.trim();
    const cleanEmail = newEmail.trim();
    const cleanPhone = newPhone.trim();
    const cleanEmpId = newEmployeeId.trim();

    if (!cleanName) {
      setErrorMessage('يرجى كتابة الاسم الكامل للمستخدم الجديد.');
      return;
    }

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('يرجى إدخال عنوان بريد إلكتروني صالح.');
      return;
    }

    if (!cleanPhone) {
      setErrorMessage('يرجى إدخال رقم هاتف أو تحويلة صحيحة.');
      return;
    }

    if (!cleanEmpId) {
      setErrorMessage('يرجى تحديد الرقم الوظيفي للمستخدم.');
      return;
    }

    const selectedDept = departments.find((d) => d.id === newDepartmentId);
    const resolvedDeptName = newCustomDeptName.trim() || selectedDept?.nameAr || 'إدارة الخدمات العامة';

    addUser({
      fullName: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      employeeId: cleanEmpId.toUpperCase(),
      departmentId: newDepartmentId,
      departmentNameAr: resolvedDeptName,
      role: newRole,
      status: 'active'
    });

    // Reset form
    setNewFullName('');
    setNewEmail('');
    setNewPhone('');
    setNewEmployeeId('');
    setNewCustomDeptName('');
    setShowAddUserModal(false);

    setSuccessMessage(`تمت إضافة المستخدم "${cleanName}" إلى النظام بنجاح!`);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 4500);
  };

  const handleStartEditUser = (user: User) => {
    setEditingUserId(user.id);
    setEditUserName(user.fullName);
    setEditUserEmail(user.email);
    setEditUserPhone(user.phone);
    setEditUserEmpId(user.employeeId);
    setEditUserDeptId(user.departmentId);
    setEditUserDeptName(user.departmentNameAr || departments.find(d => d.id === user.departmentId)?.nameAr || 'إدارة الخدمات العامة');
    setEditUserRole(user.role);
  };

  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserId) return;

    const selectedDept = departments.find((d) => d.id === editUserDeptId);
    const resolvedDeptName = editUserDeptName.trim() || selectedDept?.nameAr || 'إدارة الخدمات العامة';

    updateUser(editingUserId, {
      fullName: editUserName.trim(),
      email: editUserEmail.trim(),
      phone: editUserPhone.trim(),
      employeeId: editUserEmpId.trim().toUpperCase(),
      departmentId: editUserDeptId,
      departmentNameAr: resolvedDeptName,
      role: editUserRole
    });

    setEditingUserId(null);
    setSuccessMessage(`تم تحديث بيانات المستخدم "${editUserName}" بنجاح!`);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    if (userId === 'user-1') {
      setErrorMessage('لا يمكن حذف حساب المسؤول الرئيسي خالد الهاشمي (Super Admin).');
      setTimeout(() => setErrorMessage(null), 4000);
      return;
    }
    setDeletingUser({ id: userId, name: userName });
  };

  const roleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'admin':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'coordinator':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'employee':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'viewer':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const roleLabelArabic = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return 'مدير عام النظام (Super Admin)';
      case 'admin':
        return 'مدير النظام (Admin)';
      case 'coordinator':
        return 'منسق الحجوزات (Coordinator)';
      case 'employee':
        return 'موظف (Employee)';
      case 'viewer':
        return 'مستعرض فقط (Viewer)';
      default:
        return role;
    }
  };

  const currentDisplayTitle = currentUser.departmentNameAr || 'إدارة الخدمات العامة';

  return (
    <div className="space-y-6 animate-in fade-in max-w-5xl mx-auto pb-12">
      
      {/* Toast / Notification Banners */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center justify-between gap-3 shadow-xs animate-in slide-in-from-top">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="p-1 hover:bg-emerald-100 rounded-lg text-emerald-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold flex items-center justify-between gap-3 shadow-xs animate-in slide-in-from-top">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="p-1 hover:bg-rose-100 rounded-lg text-rose-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6">
        
        {/* Top Header of Profile Card */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-5 text-center sm:text-start border-b border-slate-100 pb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Interactive User Avatar with Camera Badge */}
            <div className="relative group shrink-0">
              <div
                onClick={() => setIsAvatarModalOpen(true)}
                className="w-20 h-20 rounded-2xl bg-linear-to-br from-blue-700 to-indigo-800 text-white font-black text-2xl flex items-center justify-center shadow-md ring-4 ring-blue-50 overflow-hidden cursor-pointer transition-all group-hover:ring-blue-200"
                title="اضغط لتعديل الصورة الشخصية يدوياً"
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={currentUser.fullName}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <span className="font-black text-2xl">{currentUser.fullName.slice(0, 2)}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsAvatarModalOpen(true)}
                className="absolute -bottom-1 -left-1 p-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white shadow-md ring-2 ring-white transition-all transform hover:scale-110 active:scale-95"
                title="تعديل وتغيير الصورة الشخصية يدوياً"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  {currentUser.fullName}
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${roleBadgeStyle(currentUser.role)}`}>
                  {roleLabelArabic(currentUser.role)}
                </span>
              </div>
              
              {/* Designation / Department with Edit Trigger */}
              <p className="text-xs sm:text-sm text-blue-800 font-bold flex items-center justify-center sm:justify-start gap-1.5">
                <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{currentDisplayTitle}</span>
              </p>

              <div className="pt-1 flex flex-wrap justify-center sm:justify-start gap-2">
                <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-mono font-bold flex items-center gap-1.5 border border-slate-200">
                  <Hash className="w-3.5 h-3.5 text-slate-500" />
                  <span>الرقم الوظيفي:</span>
                  <span className="text-blue-900 font-black">{currentUser.employeeId}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons: Edit Photo, Edit Profile & Logout */}
          {!isEditing ? (
            <div className="flex flex-wrap items-center gap-2 self-center sm:self-start">
              <button
                type="button"
                onClick={() => setIsAvatarModalOpen(true)}
                className="px-3.5 py-2.5 rounded-xl border border-blue-200 bg-blue-50/80 hover:bg-blue-100/80 text-blue-800 text-xs font-bold transition-all flex items-center gap-2 shadow-2xs hover:scale-[1.02] active:scale-95 cursor-pointer"
                title="تعديل وتخصيص الصورة الشخصية يدوياً"
              >
                <Camera className="w-4 h-4 text-blue-700" />
                <span>تعديل الصورة الشخصية</span>
              </button>
              <button
                onClick={handleStartEdit}
                className="px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-95 cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
                <span>تعديل المسمى والبيانات يدوياً</span>
              </button>
              <button
                type="button"
                onClick={logout}
                className="px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-600 text-red-700 hover:text-white text-xs font-bold shadow-2xs transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-95 cursor-pointer"
                title="تسجيل الخروج من النظام"
              >
                <LogOut className="w-4 h-4" />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 self-center sm:self-start">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                <span>إلغاء</span>
              </button>
            </div>
          )}
        </div>

        {/* View Mode or Edit Form Mode */}
        {!isEditing ? (
          /* View Mode Info Cards (4 Cards Grid) */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">بيانات التوثيق والمسمى الوظيفي:</span>
              <button
                onClick={handleStartEdit}
                className="text-xs text-blue-700 hover:text-blue-800 font-bold hover:underline flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3" />
                <span>تعديل يدوي للمسمى والبيانات</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Designation / Department Card */}
              <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-200 text-xs hover:border-indigo-400 transition-colors">
                <div className="flex items-center gap-2 text-indigo-700 mb-1.5">
                  <Building2 className="w-4 h-4" />
                  <span className="font-bold">المسمى / الإدارة</span>
                </div>
                <div className="font-bold text-slate-900 text-xs leading-relaxed">
                  {currentDisplayTitle}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">المسمى المعتمد في ساعد</div>
              </div>

              {/* Email Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs hover:border-blue-300 transition-colors">
                <div className="flex items-center gap-2 text-slate-500 mb-1.5">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold">البريد الإلكتروني</span>
                </div>
                <div className="font-mono font-bold text-slate-900 text-xs truncate" dir="ltr">
                  {currentUser.email}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">تصل عليه إشعارات وتأكيدات الحجز</div>
              </div>

              {/* Phone Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs hover:border-blue-300 transition-colors">
                <div className="flex items-center gap-2 text-slate-500 mb-1.5">
                  <Phone className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold">رقم الهاتف / التحويلة</span>
                </div>
                <div className="font-mono font-bold text-slate-900 text-xs" dir="ltr">
                  {currentUser.phone}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">للتنسيق والتواصل المباشر</div>
              </div>

              {/* Employee ID Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs hover:border-blue-300 transition-colors">
                <div className="flex items-center gap-2 text-slate-500 mb-1.5">
                  <Hash className="w-4 h-4 text-indigo-600" />
                  <span className="font-semibold">الرقم الوظيفي</span>
                </div>
                <div className="font-mono font-black text-blue-900 text-xs">
                  {currentUser.employeeId}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">معرف الموظف في أنظمة ساعد</div>
              </div>

            </div>
          </div>
        ) : (
          /* Manual Edit Form Mode (Allows editing title, email, phone, employeeId) */
          <form onSubmit={handleSaveProfile} className="space-y-5 bg-blue-50/40 p-5 rounded-2xl border border-blue-200 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-blue-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-blue-600 text-white">
                  <Edit3 className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                    تعديل بيانات المستخدم والمسمى يدوياً
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    يمكنك تعديل المسمى / الإدارة، والبريد الإلكتروني، ورقم الهاتف، والرقم الوظيفي يدوياً وحفظها فوراً
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleResetToDefault}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 hover:underline"
                title="استعادة القيم الأولية"
              >
                <RotateCcw className="w-3 h-3" />
                <span>القيم الافتراضية</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Profile Photo Edit Field (Manual customization) */}
              <div className="sm:col-span-2 p-4 rounded-xl bg-white border border-blue-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="relative group shrink-0">
                    <div className="w-14 h-14 rounded-xl bg-blue-700 text-white flex items-center justify-center font-bold text-lg overflow-hidden shadow-xs ring-2 ring-blue-100">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={currentUser.fullName} className="w-full h-full object-cover" />
                      ) : (
                        currentUser.fullName.slice(0, 2)
                      )}
                    </div>
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-blue-600" />
                      <span>الصورة الشخصية (تعديل يدوي):</span>
                    </h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {avatarUrl ? 'تم تعيين صورة مخصصة لملفك الشخصي' : 'يتم استخدام الحروف الأولى للاسم حالياً'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAvatarModalOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>تعديل الصورة يدوياً</span>
                  </button>
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setAvatarUrl('')}
                      className="px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
                      title="إزالة الصورة والعودة للحروف الأولية"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>إزالة</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Field 1: Department Name / Designation (EDITABLE MANUALLY) */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>المسمى / الإدارة: <span className="text-rose-500">*</span></span>
                </label>
                <input
                  type="text"
                  value={departmentNameAr}
                  onChange={(e) => setDepartmentNameAr(e.target.value)}
                  placeholder="إدارة الخدمات العامة"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden bg-white text-slate-900 shadow-2xs"
                  required
                />
                <p className="text-[10px] text-slate-500">مثال: إدارة الخدمات العامة</p>
              </div>

              {/* Field 2: Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                  <span>البريد الإلكتروني: <span className="text-rose-500">*</span></span>
                </label>
                <input
                  type="email"
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@saaed.ae"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden bg-white text-slate-900 shadow-2xs"
                  required
                />
                <p className="text-[10px] text-slate-500">مثال: hall@hall.ae</p>
              </div>

              {/* Field 3: Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>رقم الهاتف / التحويلة: <span className="text-rose-500">*</span></span>
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+971 50 123 4567"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden bg-white text-slate-900 shadow-2xs"
                  required
                />
                <p className="text-[10px] text-slate-500">مثال: +971 50 123 4567 أو التحويلة</p>
              </div>

              {/* Field 4: Employee ID */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-indigo-600" />
                  <span>الرقم الوظيفي: <span className="text-rose-500">*</span></span>
                </label>
                <input
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="SD-1001"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden bg-white text-slate-900 shadow-2xs font-bold uppercase"
                  required
                />
                <p className="text-[10px] text-slate-500">مثال: SD-1001</p>
              </div>

            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-blue-100">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors"
              >
                إلغاء التعديل
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>حفظ التعديلات في النظام</span>
              </button>
            </div>
          </form>
        )}

      </div>

      {/* Manual Users Management Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  إدارة مستخدمي النظام والإضافة اليدوية
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono text-xs font-bold">
                  {users.length} مستخدم
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                يمكنك إضافة مستخدمين آخرين للنظام يدوياً وتحديد مسمياتهم وصلاحياتهم وإداراتهم، أو التبديل بينهم
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAddUserModal(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>إضافة مستخدم جديد يدوياً</span>
          </button>
        </div>

        {/* ============================================================== */}
        {/* MODAL: تعديل الصورة الشخصية يدوياً (Prompt Requirement #4) */}
        {/* ============================================================== */}
        {isAvatarModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                    <Camera className="w-5 h-5 text-blue-700" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">
                      تعديل وتخصيص الصورة الشخصية يدوياً
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      يمكنك اختيار أفاتار رسمي معتمد، أو رفع صورة خاصة، أو إضافة رابط صورة مباشر
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAvatarModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Live Preview Strip */}
              <div className="p-4 rounded-xl bg-linear-to-r from-blue-50/70 via-indigo-50/50 to-slate-50 border border-blue-100 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-blue-700 to-indigo-800 text-white font-black text-xl flex items-center justify-center shadow-md ring-4 ring-white overflow-hidden shrink-0">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={currentUser.fullName} className="w-full h-full object-cover" />
                    ) : (
                      currentUser.fullName.slice(0, 2)
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md inline-block mb-1">
                      المعاينة الفورية
                    </span>
                    <h5 className="font-bold text-xs text-slate-900">{currentUser.fullName}</h5>
                    <p className="text-[11px] text-slate-500">
                      {avatarUrl ? 'سيتم تطبيق هذه الصورة في كامل النظام والملف الشخصي' : 'سيتم استخدام الحروف الأولية في حال عدم تحديد صورة'}
                    </p>
                  </div>
                </div>

                {avatarUrl && (
                  <button
                    type="button"
                    onClick={() => setAvatarUrl('')}
                    className="px-3 py-1.5 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-rose-700 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs shrink-0"
                    title="الرجوع للأحرف الأولية"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف الصورة</span>
                  </button>
                )}
              </div>

              {/* Selection Mode Tabs */}
              <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setAvatarTab('preset')}
                  className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    avatarTab === 'preset'
                      ? 'bg-white text-blue-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>أفاتار رسمي معتمد</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAvatarTab('upload')}
                  className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    avatarTab === 'upload'
                      ? 'bg-white text-blue-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5 text-blue-600" />
                  <span>رفع صورة من جهازك</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAvatarTab('url')}
                  className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    avatarTab === 'url'
                      ? 'bg-white text-blue-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LinkIcon className="w-3.5 h-3.5 text-blue-600" />
                  <span>رابط مباشر (URL)</span>
                </button>
              </div>

              {/* Tab 1: Official Preset Avatars */}
              {avatarTab === 'preset' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">اختر أحد النماذج الرسمية المعتمدة:</span>
                    <span className="text-slate-400 text-[11px]">انقر للاختيار والمعاينة الفورية</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {AVATAR_PRESETS.map((preset) => {
                      const isSelected = avatarUrl === preset.dataUrl;
                      return (
                        <div
                          key={preset.id}
                          onClick={() => setAvatarUrl(preset.dataUrl)}
                          className={`p-3 rounded-xl border text-center cursor-pointer transition-all flex flex-col items-center gap-2 group ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20 shadow-2xs'
                              : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className="w-14 h-14 rounded-full overflow-hidden shadow-xs ring-2 ring-white group-hover:scale-105 transition-transform">
                            <img src={preset.dataUrl} alt={preset.nameAr} className="w-full h-full object-cover" />
                          </div>
                          <div className="text-[11px] font-bold text-slate-800 leading-tight">
                            {preset.nameAr}
                          </div>
                          {isSelected && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-blue-700 font-bold bg-blue-100/80 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3 text-blue-600" />
                              <span>محدد</span>
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tab 2: Upload File */}
              {avatarTab === 'upload' && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-6 text-center space-y-3 bg-slate-50/50 hover:bg-blue-50/20 transition-all">
                    <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 mx-auto flex items-center justify-center">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <label
                        htmlFor="manual-avatar-file"
                        className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition-all hover:scale-[1.02] active:scale-95"
                      >
                        <Camera className="w-4 h-4" />
                        <span>اختر صورة من الكمبيوتر أو الهاتف</span>
                      </label>
                      <input
                        id="manual-avatar-file"
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed max-w-sm mx-auto">
                      يدعم ملفات JPG، PNG، WebP حتى 5 ميجابايت.
                      يتم ضبط الأبعاد وضغط الصورة تلقائياً لحفظها بسلاسة وأمان.
                    </p>
                  </div>

                  {uploadError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{uploadError}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Direct URL */}
              {avatarTab === 'url' && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      رابط الصورة المباشر (URL):
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        dir="ltr"
                        value={customUrlInput}
                        onChange={(e) => setCustomUrlInput(e.target.value)}
                        placeholder="https://example.com/photo.jpg"
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden bg-white text-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (customUrlInput.trim()) {
                            setAvatarUrl(customUrlInput.trim());
                          }
                        }}
                        disabled={!customUrlInput.trim()}
                        className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:opacity-40 text-white text-xs font-bold transition-colors shrink-0"
                      >
                        معاينة
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      أدخل رابط صورة مباشر بصيغة https:// صالح ومتاح للعرض
                    </p>
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div>
                  {currentUser.avatarUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="text-xs text-rose-600 hover:text-rose-800 hover:underline font-bold flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>إزالة الصورة والعودة للحروف الأولية</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarUrl(currentUser.avatarUrl || '');
                      setIsAvatarModalOpen(false);
                    }}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveAvatar()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-xs transition-all hover:scale-[1.02] active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>حفظ الصورة الشخصية فوراً</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Modal: Add New User Manually */}
        {showAddUserModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2 text-indigo-700">
                  <UserPlus className="w-5 h-5" />
                  <h4 className="font-bold text-slate-900 text-base">
                    إضافة مستخدم جديد للنظام بشكل يدوي
                  </h4>
                </div>
                <button
                  onClick={() => setShowAddUserModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  
                  {/* Name */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700">
                      الاسم الكامل للمستخدم: <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newFullName}
                      onChange={(e) => setNewFullName(e.target.value)}
                      placeholder="مثال: أحمد عبد الله الشامسي"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-600 focus:outline-hidden bg-white text-slate-900"
                      required
                    />
                  </div>

                  {/* Employee ID */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      الرقم الوظيفي: <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newEmployeeId}
                      onChange={(e) => setNewEmployeeId(e.target.value)}
                      placeholder="مثال: SD-1045"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-indigo-600 focus:outline-hidden uppercase"
                      required
                    />
                  </div>

                  {/* Role */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>الدور والصلاحية:</span>
                      <span className="text-[10px] text-slate-500 font-normal">
                        تحديد مستوى الصلاحيات وخيارات الإدارة
                      </span>
                    </label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as UserRole)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-600 focus:outline-hidden bg-white font-bold text-slate-800"
                    >
                      <option value="employee">موظف (Employee) — ضوابط قياسية (لا يُمنح صلاحية الأدمن أو استثناءات الإدارة)</option>
                      <option value="coordinator">منسق الحجوزات (Coordinator) — ضوابط قياسية (لا يُمنح صلاحية الأدمن أو استثناءات الإدارة)</option>
                      <option value="viewer">مستعرض فقط (Viewer) — للاطلاع فقط (بدون صلاحيات إدارية أو إمكانية الحجز)</option>
                      <option value="admin">مدير النظام (Admin) — صلاحيات إدارية واستثناءات حجز القاعات</option>
                      <option value="super_admin">مدير عام النظام (Super Admin) — صلاحيات إدارية شاملة</option>
                    </select>

                    {/* Live Permission Scope Indicator */}
                    {newRole === 'employee' || newRole === 'coordinator' || newRole === 'viewer' ? (
                      <div className="mt-2 p-3 rounded-xl border border-amber-300 bg-amber-50/90 text-amber-950 space-y-1.5 animate-in fade-in">
                        <div className="flex items-center gap-1.5 font-bold text-xs text-amber-900">
                          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>ضوابط قياسية معتمدة: لا يُمنح هذا المستخدم صلاحية الأدمن أو استثناءات الإدارة</span>
                        </div>
                        <p className="text-[11px] text-slate-700 leading-relaxed">
                          {newRole === 'employee' && (
                            <>
                              المستخدم مسجل بدور <strong>(موظف)</strong>. يُسمح له بحجز القاعات وفق الضوابط والسياسات الرسمية القياسية فقط (أيام العمل من الاثنين إلى الجمعة، الساعات من 07:30 إلى 18:00، والحد الأقصى للمدة 4 ساعات). <strong>لا يملك صلاحية الأدمن ولا يُمنح خيارات أو استثناءات الإدارة لحجز القاعات.</strong>
                            </>
                          )}
                          {newRole === 'coordinator' && (
                            <>
                              المستخدم مسجل بدور <strong>(منسق الحجوزات)</strong>. يقتصر دوره على التنسيق ومتابعة الحجوزات القياسية. <strong>لا يملك صلاحية الأدمن ولا يُمنح خيارات واستثناءات الإدارة لحجز القاعات.</strong>
                            </>
                          )}
                          {newRole === 'viewer' && (
                            <>
                              المستخدم مسجل بدور <strong>(مستعرض فقط)</strong>. يقتصر دوره على الاطلاع والمشاهدة على جدول القاعات دون تعديل أو حجز. <strong>لا يملك أي صلاحيات إدارية أو استثناءات للإدارة.</strong>
                            </>
                          )}
                        </p>
                        <div className="text-[10px] text-rose-700 font-bold bg-white/80 p-2 rounded-lg border border-amber-200 flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span>حجب إداري: يتم حجب تبويب استثناءات الإدارة وخيارات تجاوز الأوقات والعطلات عن هذا الحساب بشكل كامل.</span>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 p-3 rounded-xl border border-purple-200 bg-purple-50/90 text-purple-950 space-y-1 animate-in fade-in">
                        <div className="flex items-center gap-1.5 font-bold text-xs text-purple-900">
                          <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
                          <span>صلاحية إدارية كاملة (Admin Privileges)</span>
                        </div>
                        <p className="text-[11px] text-slate-700 leading-relaxed">
                          {newRole === 'super_admin'
                            ? 'مدير عام النظام يملك كامل الصلاحيات الإدارية المطلقة، وإدارة المستخدمين، واستخدام استثناءات الإدارة لحجز القاعات.'
                            : 'مدير النظام يملك صلاحيات إدارة الحجوزات والقاعات واستخدام استثناءات الإدارة المعتمدة.'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      البريد الإلكتروني: <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      dir="ltr"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="user@saaed.ae"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
                      required
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      رقم الهاتف / التحويلة: <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="+971 50 000 0000"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
                      required
                    />
                  </div>

                  {/* Department & Custom Title */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700">
                      المسمى / الإدارة:
                    </label>
                    <input
                      type="text"
                      value={newCustomDeptName}
                      onChange={(e) => setNewCustomDeptName(e.target.value)}
                      placeholder="مثال: إدارة الخدمات العامة"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-600 focus:outline-hidden bg-white font-medium"
                    />
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-slate-400">أو اختر من القائمة:</span>
                      <select
                        value={newDepartmentId}
                        onChange={(e) => {
                          setNewDepartmentId(e.target.value);
                          const d = departments.find(dept => dept.id === e.target.value);
                          if (d) setNewCustomDeptName(d.nameAr);
                        }}
                        className="text-[11px] px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-700"
                      >
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.nameAr}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddUserModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>إضافة المستخدم للنظام</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit Existing User */}
        {editingUserId && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2 text-blue-700">
                  <Edit3 className="w-5 h-5" />
                  <h4 className="font-bold text-slate-900 text-base">
                    تعديل بيانات المستخدم والمسمى يدوياً
                  </h4>
                </div>
                <button
                  onClick={() => setEditingUserId(null)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEditUser} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  
                  <div className="space-y-1 sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700">
                      الاسم الكامل:
                    </label>
                    <input
                      type="text"
                      value={editUserName}
                      onChange={(e) => setEditUserName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      الرقم الوظيفي:
                    </label>
                    <input
                      type="text"
                      value={editUserEmpId}
                      onChange={(e) => setEditUserEmpId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden uppercase"
                      required
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>الدور والصلاحية:</span>
                      <span className="text-[10px] text-slate-500 font-normal">
                        تعديل مستوى الصلاحيات وخيارات الإدارة
                      </span>
                    </label>
                    <select
                      value={editUserRole}
                      onChange={(e) => setEditUserRole(e.target.value as UserRole)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden bg-white font-bold text-slate-800"
                    >
                      <option value="employee">موظف (Employee) — ضوابط قياسية (لا يُمنح صلاحية الأدمن أو استثناءات الإدارة)</option>
                      <option value="coordinator">منسق الحجوزات (Coordinator) — ضوابط قياسية (لا يُمنح صلاحية الأدمن أو استثناءات الإدارة)</option>
                      <option value="viewer">مستعرض فقط (Viewer) — للاطلاع فقط (بدون صلاحيات إدارية أو إمكانية الحجز)</option>
                      <option value="admin">مدير النظام (Admin) — صلاحيات إدارية واستثناءات حجز القاعات</option>
                      <option value="super_admin">مدير عام النظام (Super Admin) — صلاحيات إدارية شاملة</option>
                    </select>

                    {/* Live Permission Scope Indicator */}
                    {editUserRole === 'employee' || editUserRole === 'coordinator' || editUserRole === 'viewer' ? (
                      <div className="mt-2 p-3 rounded-xl border border-amber-300 bg-amber-50/90 text-amber-950 space-y-1.5 animate-in fade-in">
                        <div className="flex items-center gap-1.5 font-bold text-xs text-amber-900">
                          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>ضوابط قياسية معتمدة: لا يُمنح هذا المستخدم صلاحية الأدمن أو استثناءات الإدارة</span>
                        </div>
                        <p className="text-[11px] text-slate-700 leading-relaxed">
                          {editUserRole === 'employee' && (
                            <>
                              المستخدم مسجل بدور <strong>(موظف)</strong>. يخضع للضوابط الرسمية القياسية فقط. <strong>لا يملك صلاحية الأدمن ولا يُمنح خيارات واستثناءات الإدارة لحجز القاعات.</strong>
                            </>
                          )}
                          {editUserRole === 'coordinator' && (
                            <>
                              المستخدم مسجل بدور <strong>(منسق الحجوزات)</strong>. يقتصر على تنسيق ومتابعة الحجوزات القياسية. <strong>لا يملك صلاحية الأدمن ولا يُمنح استثناءات الإدارة لحجز القاعات.</strong>
                            </>
                          )}
                          {editUserRole === 'viewer' && (
                            <>
                              المستخدم مسجل بدور <strong>(مستعرض فقط)</strong>. يقتصر على المشاهدة فقط. <strong>لا يملك أي صلاحيات إدارية أو إمكانية الحجز.</strong>
                            </>
                          )}
                        </p>
                        <div className="text-[10px] text-rose-700 font-bold bg-white/80 p-2 rounded-lg border border-amber-200 flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span>حجب إداري: يتم حجب تبويب استثناءات الإدارة وخيارات التجاوز الاستثنائية لحجز القاعات عن هذا المستخدم.</span>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 p-3 rounded-xl border border-purple-200 bg-purple-50/90 text-purple-950 space-y-1 animate-in fade-in">
                        <div className="flex items-center gap-1.5 font-bold text-xs text-purple-900">
                          <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
                          <span>صلاحية إدارية معتمدة (Admin Privileges)</span>
                        </div>
                        <p className="text-[11px] text-slate-700 leading-relaxed">
                          {editUserRole === 'super_admin'
                            ? 'مدير عام النظام يملك كامل الصلاحيات الإدارية المطلقة واستخدام استثناءات الإدارة لحجز القاعات.'
                            : 'مدير النظام يملك صلاحيات إدارة الحجوزات واستخدام استثناءات الإدارة المعتمدة.'}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700">
                      المسمى / الإدارة:
                    </label>
                    <input
                      type="text"
                      value={editUserDeptName}
                      onChange={(e) => setEditUserDeptName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden font-bold"
                      placeholder="إدارة الخدمات العامة"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      البريد الإلكتروني:
                    </label>
                    <input
                      type="email"
                      dir="ltr"
                      value={editUserEmail}
                      onChange={(e) => setEditUserEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      رقم الهاتف / التحويلة:
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={editUserPhone}
                      onChange={(e) => setEditUserPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                      required
                    />
                  </div>

                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingUserId(null)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>حفظ التعديلات</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-xs text-start">
            <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
              <tr>
                <th className="p-3 text-start">المستخدم</th>
                <th className="p-3 text-start">الرقم الوظيفي</th>
                <th className="p-3 text-start">المسمى / الإدارة</th>
                <th className="p-3 text-start">البريد الإلكتروني</th>
                <th className="p-3 text-start">رقم الهاتف</th>
                <th className="p-3 text-center">الصلاحية</th>
                <th className="p-3 text-center">استثناءات وخيارات الإدارة</th>
                <th className="p-3 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {users.map((u) => {
                const isCurrent = u.id === currentUser.id;
                const isSuperAdminPrimary = u.id === 'user-1';
                const userDeptDisplay = u.departmentNameAr || departments.find(d => d.id === u.departmentId)?.nameAr || 'إدارة الخدمات العامة';
                const hasAdminPrivilege = u.role === 'super_admin' || u.role === 'admin';

                return (
                  <tr key={u.id} className={isCurrent ? 'bg-blue-50/50' : 'hover:bg-slate-50'}>
                    
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden ring-1 ring-slate-200">
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} alt={u.fullName} className="w-full h-full object-cover" />
                          ) : (
                            u.fullName.slice(0, 2)
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{u.fullName}</span>
                            {isCurrent && (
                              <span className="px-1.5 py-0.2 bg-blue-600 text-white text-[9px] rounded font-semibold">
                                الحساب النشط
                              </span>
                            )}
                          </div>
                          {isSuperAdminPrimary && (
                            <span className="text-[10px] text-purple-700 font-bold">
                              المسؤول الرئيسي للنظام
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="p-3 font-mono font-bold text-blue-900">
                      {u.employeeId}
                    </td>

                    <td className="p-3 font-semibold text-slate-800">
                      {userDeptDisplay}
                    </td>

                    <td className="p-3 font-mono text-slate-700" dir="ltr">
                      {u.email}
                    </td>

                    <td className="p-3 font-mono text-slate-700" dir="ltr">
                      {u.phone}
                    </td>

                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border inline-block ${roleBadgeStyle(u.role)}`}>
                        {roleLabelArabic(u.role)}
                      </span>
                    </td>

                    <td className="p-3 text-center whitespace-nowrap">
                      {hasAdminPrivilege ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
                          <ShieldCheck className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                          <span>مصرّح (استثناءات الإدارة)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>محظور (ضوابط قياسية)</span>
                        </span>
                      )}
                    </td>

                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {!isCurrent && (
                          <button
                            onClick={() => setCurrentUser(u)}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-[11px] border border-blue-200 transition-colors"
                            title="التبديل إلى هذا الحساب لتجربة صلاحياته"
                          >
                            تبديل
                          </button>
                        )}
                        <button
                          onClick={() => handleStartEditUser(u)}
                          className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-blue-700 transition-colors"
                          title="تعديل بيانات ومسمى المستخدم"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {!isSuperAdminPrimary && (
                          <button
                            onClick={() => handleDeleteUser(u.id, u.fullName)}
                            className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                            title="حذف المستخدم من النظام"
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
      </div>

      {/* My Bookings Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-700" />
            <span>حجوزاتي الخاصة ({myBookings.length})</span>
          </h3>
          <span className="text-xs text-slate-500">سجل الحجوزات المنشأة بواسطة حسابي الحالي</span>
        </div>

        {myBookings.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            لا توجد حجوزات مسجلة باسمك حالياً.
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-xs text-start">
              <thead className="bg-slate-100 font-bold text-slate-700">
                <tr>
                  <th className="p-3 text-start">رقم الحجز</th>
                  <th className="p-3 text-start">القاعة</th>
                  <th className="p-3 text-start">موضوع الاجتماع</th>
                  <th className="p-3 text-start">التاريخ والوقت</th>
                  <th className="p-3 text-center">الحالة</th>
                  <th className="p-3 text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {myBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-blue-900">{b.bookingNumber}</td>
                    <td className="p-3 font-semibold">{b.roomNameAr}</td>
                    <td className="p-3 font-bold text-slate-900">{b.title}</td>
                    <td className="p-3 font-mono text-xs">{b.date} • {formatTimeRange12(b.startTime, b.endTime)}</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        {b.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => onSelectBooking(b)}
                        className="text-blue-700 hover:underline font-bold text-xs"
                      >
                        عرض
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete User Modal */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-5 animate-in zoom-in-95 duration-200 text-right" dir="rtl">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-rose-100 text-rose-700 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">حذف المستخدم</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  هل أنت متأكد من حذف المستخدم <strong className="text-slate-800">"{deletingUser.name}"</strong> نهائياً من النظام؟
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteUser(deletingUser.id);
                  setSuccessMessage(`تم حذف المستخدم "${deletingUser.name}" بنجاح من النظام.`);
                  setDeletingUser(null);
                  setTimeout(() => setSuccessMessage(null), 4000);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
