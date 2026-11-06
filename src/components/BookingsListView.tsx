import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Booking } from '../types';
import {
  CalendarCheck2,
  Search,
  Filter,
  FileSpreadsheet,
  Printer,
  ChevronDown,
  Eye,
  PlusCircle,
  Building2,
  DoorOpen,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Edit3,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { exportToExcelCsv } from '../services/analyticsService';
import { formatTimeRange12 } from '../utils/dateUtils';

interface BookingsListViewProps {
  onSelectBooking: (booking: Booking) => void;
  onOpenNewBooking: () => void;
  onEditBooking?: (booking: Booking) => void;
}

export const BookingsListView: React.FC<BookingsListViewProps> = ({
  onSelectBooking,
  onOpenNewBooking,
  onEditBooking
}) => {
  const {
    bookings,
    rooms,
    departments,
    currentUser,
    deleteCancelledBooking,
    deleteAllCancelledBookings,
    language
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [roomFilter, setRoomFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  type ListViewSortField = 'date' | 'time' | 'bookingNumber' | 'room' | 'title' | 'department' | 'booker' | 'status';
  const [sortField, setSortField] = useState<ListViewSortField>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleSortToggle = (field: ListViewSortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder(field === 'date' || field === 'bookingNumber' ? 'desc' : 'asc');
    }
  };

  const [deleteTarget, setDeleteTarget] = useState<Booking | null>(null);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const isAdmin = currentUser.role === 'super_admin' || currentUser.role === 'admin';
  const totalCancelledCount = useMemo(
    () => bookings.filter((b) => b.status === 'cancelled').length,
    [bookings]
  );

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      const res = deleteCancelledBooking(deleteTarget.id);
      setFeedbackMsg(res.message);
      setDeleteTarget(null);
      setTimeout(() => setFeedbackMsg(null), 3500);
    }
  };

  const handleConfirmDeleteAll = () => {
    const res = deleteAllCancelledBookings();
    setFeedbackMsg(res.message);
    setShowDeleteAllModal(false);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  // Filtered and sorted bookings
  const filteredBookings = bookings
    .filter((b) => {
      if (roomFilter !== 'all' && b.roomId !== roomFilter) return false;
      if (deptFilter !== 'all' && b.departmentId !== deptFilter) return false;
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesTitle = b.title.toLowerCase().includes(query);
        const matchesNumber = b.bookingNumber.toLowerCase().includes(query);
        const matchesBooker = b.bookerName.toLowerCase().includes(query);
        const matchesEmpId = b.employeeId.toLowerCase().includes(query);
        const matchesDept = b.departmentNameAr.toLowerCase().includes(query);
        if (!matchesTitle && !matchesNumber && !matchesBooker && !matchesEmpId && !matchesDept) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
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
        case 'room':
          cmp = (a.roomNameAr || '').localeCompare(b.roomNameAr || '', 'ar');
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
        default:
          cmp = a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime);
      }
      return sortOrder === 'desc' ? -cmp : cmp;
    });

  const handleExport = () => {
    const headers = [
      'رقم الحجز',
      'القاعة',
      'موضوع الاجتماع',
      'الإدارة الحاجزة',
      'مقدم الحجز',
      'الرقم الوظيفي',
      'التاريخ',
      'وقت البداية',
      'وقت النهاية',
      'المدة (دقيقة)',
      'الحالة'
    ];
    const rows = filteredBookings.map((b) => [
      b.bookingNumber,
      b.roomNameAr,
      b.title,
      b.departmentNameAr,
      b.bookerName,
      b.employeeId,
      b.date,
      b.startTime,
      b.endTime,
      b.durationMinutes,
      b.status
    ]);
    exportToExcelCsv('سجل_حجوزات_قاعات_ساعد', headers, rows);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'cancelled':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-800">
            <CalendarCheck2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              سجل جميع الحجوزات (Master Bookings List)
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              عرض شامل لكافة الحجوزات السابقة والحالية والمستقبلية مع البحث والتصفية
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isAdmin && totalCancelledCount > 0 && (
            <button
              onClick={() => setShowDeleteAllModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              title="حذف جميع الحجوزات الملغية في النظام بالكامل نهائياً"
            >
              <Trash2 className="w-4 h-4" />
              <span>حذف الملغيات ({totalCancelledCount})</span>
            </button>
          )}

          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>تصدير Excel</span>
          </button>
          <button
            onClick={onOpenNewBooking}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>حجز جديد</span>
          </button>
        </div>
      </div>

      {/* Action Feedback Message */}
      {feedbackMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 font-bold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          
          {/* Search Input */}
          <div className="relative">
            <label className="block text-slate-600 font-bold mb-1">بحث نصي:</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                placeholder="رقم الحجز، الموضوع، الموظف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-3 pr-9 py-2 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white text-xs"
              />
            </div>
          </div>

          {/* Room Filter */}
          <div>
            <label className="block text-slate-600 font-bold mb-1">القاعة:</label>
            <select
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-semibold"
            >
              <option value="all">جميع القاعات</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nameAr}
                </option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <label className="block text-slate-600 font-bold mb-1">الإدارة:</label>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-semibold"
            >
              <option value="all">جميع الإدارات</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nameAr}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-slate-600 font-bold mb-1">الحالة:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-semibold"
            >
              <option value="all">جميع الحالات</option>
              <option value="confirmed">مؤكد (Confirmed)</option>
              <option value="completed">مكتمل (Completed)</option>
              <option value="cancelled">ملغى (Cancelled)</option>
              <option value="pending">قيد الانتظار (Pending)</option>
            </select>
          </div>

          {/* Sort Selector */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-slate-600 font-bold">فرز حسب:</label>
              <button
                type="button"
                onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                className="text-[11px] font-bold text-blue-700 hover:underline flex items-center gap-0.5 cursor-pointer"
                title="تبديل اتجاه الترتيب (تصاعدي / تنازلي)"
              >
                {sortOrder === 'desc' ? (
                  <>
                    <ArrowDown className="w-3 h-3 text-blue-700" />
                    <span>تنازلي</span>
                  </>
                ) : (
                  <>
                    <ArrowUp className="w-3 h-3 text-emerald-700" />
                    <span>تصاعدي</span>
                  </>
                )}
              </button>
            </div>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-semibold"
            >
              <option value="date">التاريخ</option>
              <option value="time">وقت الاجتماع</option>
              <option value="bookingNumber">رقم الحجز</option>
              <option value="room">القاعة</option>
              <option value="title">موضوع الاجتماع</option>
              <option value="department">الإدارة</option>
              <option value="booker">مقدم الحجز</option>
              <option value="status">الحالة</option>
            </select>
          </div>

        </div>

        {/* Results Count & Quick Reset */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>عدد السجلات المطابقة: <strong className="text-slate-800">{filteredBookings.length}</strong></span>
          {(searchTerm || roomFilter !== 'all' || deptFilter !== 'all' || statusFilter !== 'all' || sortField !== 'date' || sortOrder !== 'desc') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setRoomFilter('all');
                setDeptFilter('all');
                setStatusFilter('all');
                setSortField('date');
                setSortOrder('desc');
              }}
              className="text-blue-700 hover:underline font-bold cursor-pointer"
            >
              إعادة ضبط الفلاتر والفرز
            </button>
          )}
        </div>
      </div>

      {/* Bookings Table (Prompt #42) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {filteredBookings.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            لا توجد نتائج تطابق معايير البحث والفلترة.
          </div>
        ) : (
          <>
            {/* Desktop / Tablet Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-xs text-start border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 select-none">
                    <th
                      onClick={() => handleSortToggle('bookingNumber')}
                      className={`p-3.5 text-start cursor-pointer hover:bg-slate-200/80 transition-colors ${
                        sortField === 'bookingNumber' ? 'bg-blue-100/70 text-blue-950 font-black' : ''
                      }`}
                      title="فرز حسب رقم الحجز"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>رقم الحجز</span>
                        {sortField === 'bookingNumber' ? (
                          sortOrder === 'desc' ? <ArrowDown className="w-3.5 h-3.5 text-blue-700" /> : <ArrowUp className="w-3.5 h-3.5 text-blue-700" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />
                        )}
                      </div>
                    </th>

                    <th
                      onClick={() => handleSortToggle('room')}
                      className={`p-3.5 text-start cursor-pointer hover:bg-slate-200/80 transition-colors ${
                        sortField === 'room' ? 'bg-blue-100/70 text-blue-950 font-black' : ''
                      }`}
                      title="فرز حسب القاعة"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>القاعة</span>
                        {sortField === 'room' ? (
                          sortOrder === 'desc' ? <ArrowDown className="w-3.5 h-3.5 text-blue-700" /> : <ArrowUp className="w-3.5 h-3.5 text-blue-700" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />
                        )}
                      </div>
                    </th>

                    <th
                      onClick={() => handleSortToggle('title')}
                      className={`p-3.5 text-start cursor-pointer hover:bg-slate-200/80 transition-colors ${
                        sortField === 'title' ? 'bg-blue-100/70 text-blue-950 font-black' : ''
                      }`}
                      title="فرز حسب موضوع الاجتماع"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>موضوع الاجتماع</span>
                        {sortField === 'title' ? (
                          sortOrder === 'desc' ? <ArrowDown className="w-3.5 h-3.5 text-blue-700" /> : <ArrowUp className="w-3.5 h-3.5 text-blue-700" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />
                        )}
                      </div>
                    </th>

                    <th
                      onClick={() => handleSortToggle('department')}
                      className={`p-3.5 text-start cursor-pointer hover:bg-slate-200/80 transition-colors ${
                        sortField === 'department' ? 'bg-blue-100/70 text-blue-950 font-black' : ''
                      }`}
                      title="فرز حسب الإدارة"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>الإدارة</span>
                        {sortField === 'department' ? (
                          sortOrder === 'desc' ? <ArrowDown className="w-3.5 h-3.5 text-blue-700" /> : <ArrowUp className="w-3.5 h-3.5 text-blue-700" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />
                        )}
                      </div>
                    </th>

                    <th
                      onClick={() => handleSortToggle('booker')}
                      className={`p-3.5 text-start cursor-pointer hover:bg-slate-200/80 transition-colors ${
                        sortField === 'booker' ? 'bg-blue-100/70 text-blue-950 font-black' : ''
                      }`}
                      title="فرز حسب مقدم الحجز"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>مقدم الحجز</span>
                        {sortField === 'booker' ? (
                          sortOrder === 'desc' ? <ArrowDown className="w-3.5 h-3.5 text-blue-700" /> : <ArrowUp className="w-3.5 h-3.5 text-blue-700" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />
                        )}
                      </div>
                    </th>

                    <th
                      onClick={() => handleSortToggle('date')}
                      className={`p-3.5 text-start cursor-pointer hover:bg-slate-200/80 transition-colors ${
                        sortField === 'date' ? 'bg-blue-100/70 text-blue-950 font-black' : ''
                      }`}
                      title="فرز حسب التاريخ"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>التاريخ</span>
                        {sortField === 'date' ? (
                          sortOrder === 'desc' ? <ArrowDown className="w-3.5 h-3.5 text-blue-700" /> : <ArrowUp className="w-3.5 h-3.5 text-blue-700" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />
                        )}
                      </div>
                    </th>

                    <th
                      onClick={() => handleSortToggle('time')}
                      className={`p-3.5 text-start cursor-pointer hover:bg-slate-200/80 transition-colors ${
                        sortField === 'time' ? 'bg-blue-100/70 text-blue-950 font-black' : ''
                      }`}
                      title="فرز حسب الوقت"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>الوقت</span>
                        {sortField === 'time' ? (
                          sortOrder === 'desc' ? <ArrowDown className="w-3.5 h-3.5 text-blue-700" /> : <ArrowUp className="w-3.5 h-3.5 text-blue-700" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />
                        )}
                      </div>
                    </th>

                    <th
                      onClick={() => handleSortToggle('status')}
                      className={`p-3.5 text-center cursor-pointer hover:bg-slate-200/80 transition-colors ${
                        sortField === 'status' ? 'bg-blue-100/70 text-blue-950 font-black' : ''
                      }`}
                      title="فرز حسب الحالة"
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <span>الحالة</span>
                        {sortField === 'status' ? (
                          sortOrder === 'desc' ? <ArrowDown className="w-3.5 h-3.5 text-blue-700" /> : <ArrowUp className="w-3.5 h-3.5 text-blue-700" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />
                        )}
                      </div>
                    </th>

                    <th className="p-3.5 text-center">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredBookings.map((b) => (
                    <tr
                      key={b.id}
                      className="hover:bg-blue-50/40 transition-colors cursor-pointer"
                      onClick={() => onSelectBooking(b)}
                    >
                      <td className="p-3.5 font-mono font-bold text-blue-900">{b.bookingNumber}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                            b.roomId === 'room-dana'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}
                        >
                          {b.roomNameAr}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-slate-900 max-w-xs truncate">{b.title}</td>
                      <td className="p-3.5 font-semibold text-slate-700">{b.departmentNameAr}</td>
                      <td className="p-3.5 text-slate-600">{b.bookerName}</td>
                      <td className="p-3.5 font-mono font-semibold text-slate-800">{b.date}</td>
                      <td className="p-3.5 font-mono text-slate-700 text-xs">{formatTimeRange12(b.startTime, b.endTime)}</td>
                      <td className="p-3.5 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadge(b.status)}`}>
                          {b.status === 'confirmed' ? 'مؤكد' : b.status === 'completed' ? 'مكتمل' : b.status === 'cancelled' ? 'ملغى' : b.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectBooking(b);
                            }}
                            className="inline-flex items-center gap-1 text-[11px] text-blue-700 font-bold hover:underline cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>تفاصيل</span>
                          </button>

                          {(isAdmin || (b.status !== 'cancelled' && (currentUser.id === b.userId || currentUser.role === 'coordinator'))) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onEditBooking) {
                                  onEditBooking(b);
                                } else {
                                  onSelectBooking(b);
                                }
                              }}
                              className={`p-1 rounded-md transition-colors cursor-pointer ${
                                b.status === 'cancelled'
                                  ? 'text-amber-700 hover:text-amber-900 hover:bg-amber-100/70 ring-1 ring-amber-300'
                                  : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50'
                              }`}
                              title={b.status === 'cancelled' ? "تعديل الحجز الملغي (إجراء المدير Admin)" : "تعديل الحجز"}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {b.status === 'cancelled' && isAdmin && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTarget(b);
                              }}
                              className="p-1 rounded-md text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="حذف الحجز الملغي نهائياً (خاص بالمسؤول Admin)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View (< sm) */}
            <div className="sm:hidden divide-y divide-slate-100 p-3 space-y-3">
              {filteredBookings.map((b) => (
                <div
                  key={b.id}
                  onClick={() => onSelectBooking(b)}
                  className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2.5 transition-all active:scale-[0.99] cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-xs text-blue-900 bg-blue-50 px-2 py-0.5 rounded-md">
                      {b.bookingNumber}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(b.status)}`}>
                      {b.status === 'confirmed' ? 'مؤكد' : b.status === 'completed' ? 'مكتمل' : b.status === 'cancelled' ? 'ملغى' : b.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-slate-900 leading-snug">{b.title}</h4>
                    <span className="inline-block mt-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-900">
                      {b.roomNameAr}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <div className="text-slate-700 font-semibold">{b.date}</div>
                    <div className="text-slate-700 font-mono text-[11px] font-bold">{formatTimeRange12(b.startTime, b.endTime)}</div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                    <span className="truncate max-w-[150px] font-medium">{b.departmentNameAr}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectBooking(b);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>تفاصيل</span>
                      </button>

                      {(isAdmin || (b.status !== 'cancelled' && (currentUser.id === b.userId || currentUser.role === 'coordinator'))) && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onEditBooking) {
                              onEditBooking(b);
                            } else {
                              onSelectBooking(b);
                            }
                          }}
                          className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                            b.status === 'cancelled'
                              ? 'bg-amber-50 text-amber-800 hover:bg-amber-100 ring-1 ring-amber-300'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                          title={b.status === 'cancelled' ? "تعديل الحجز الملغي (إجراء المدير Admin)" : "تعديل الحجز"}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>{b.status === 'cancelled' ? 'تعديل ملغي' : 'تعديل'}</span>
                        </button>
                      )}

                      {b.status === 'cancelled' && isAdmin && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(b);
                          }}
                          className="px-2 py-1 rounded-lg bg-rose-50 text-rose-700 text-xs font-bold flex items-center gap-1 hover:bg-rose-100 cursor-pointer"
                          title="حذف الحجز الملغي نهائياً"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Admin Delete Single Cancelled Booking Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-rose-200">
            <div className="flex items-center gap-2.5 text-rose-600">
              <div className="p-2 rounded-xl bg-rose-100">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  تأكيد حذف الحجز الملغي نهائياً
                </h3>
                <span className="text-[11px] text-rose-600 font-semibold">إجراء إداري لمدير النظام (Admin)</span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">رقم الحجز:</span>
                <span className="font-mono font-bold text-blue-900">{deleteTarget.bookingNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">موضوع الاجتماع:</span>
                <span className="font-bold text-slate-800">{deleteTarget.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">القاعة:</span>
                <span className="font-bold text-slate-800">{deleteTarget.roomNameAr}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">الإدارة:</span>
                <span className="font-bold text-slate-800">{deleteTarget.departmentNameAr}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">التاريخ:</span>
                <span className="font-semibold text-slate-700">{deleteTarget.date}</span>
              </div>
            </div>

            <p className="text-xs text-rose-700 leading-relaxed bg-rose-50 p-3 rounded-xl border border-rose-200">
              هل أنت متأكد من حذف هذا الحجز الملغي نهائياً من قاعدة بيانات النظام؟
              <br />
              <strong className="block mt-1 text-[11px] text-rose-900">
                تنبيه: سيتم مسح سجل الحجز نهائياً وتوثيق الإجراء في سجل التدقيق. لا يمكن التراجع عن هذا الإجراء.
              </strong>
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>تأكيد الحذف النهائي</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Delete All Cancelled Bookings Modal */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-rose-200">
            <div className="flex items-center gap-2.5 text-rose-600">
              <div className="p-2 rounded-xl bg-rose-100">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  حذف جميع الحجوزات الملغية في النظام
                </h3>
                <span className="text-[11px] text-rose-600 font-semibold">إجراء جماعي لمدير النظام (Admin)</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              أنت على وشك حذف كافة الحجوزات الملغية في النظام والبالغ عددها (<strong className="text-rose-600 font-mono text-sm">{totalCancelledCount}</strong>) حجز ملغي نهائياً من قاعدة البيانات.
            </p>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
              <span className="font-bold block">ملاحظات الحذف:</span>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-700">
                <li>الحجوزات المؤكدة والمكتملة لن تتأثر إطلاقاً.</li>
                <li>سيتم إزالة السجلات الملغية بالكامل من قاعدة البيانات.</li>
                <li>يتم توثيق عملية الحذف الجماعي في سجل التدقيق باسمك.</li>
              </ul>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteAllModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAll}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>تأكيد حذف {totalCancelledCount} حجز ملغي</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
