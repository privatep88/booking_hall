import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Room, Booking } from '../types';
import {
  DoorOpen,
  Users,
  MapPin,
  Layers,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Calendar,
  BarChart3,
  PlusCircle,
  Clock,
  Tv
} from 'lucide-react';
import { calculateRoomDetailedStats } from '../services/analyticsService';
import { formatTimeRange12 } from '../utils/dateUtils';

interface RoomsViewProps {
  onOpenNewBooking: (roomId: string) => void;
  onViewRoomStats: (roomId: string) => void;
  onSelectBooking: (booking: Booking) => void;
  onOpenKiosk: (roomId: string) => void;
}

export const RoomsView: React.FC<RoomsViewProps> = ({
  onOpenNewBooking,
  onViewRoomStats,
  onSelectBooking,
  onOpenKiosk
}) => {
  const {
    rooms,
    bookings,
    currentUser,
    toggleRoomMaintenance,
    addRoom,
    updateRoom,
    currentDate
  } = useApp();

  const [selectedRoom, setSelectedRoom] = useState<Room>(rooms[0]);
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [maintenanceReason, setMaintenanceReason] = useState('أعمال صيانة وتجهيز تقني دوري');

  const [showQrModal, setShowQrModal] = useState<Room | null>(null);

  // New room modal form state
  const [newRoomNameAr, setNewRoomNameAr] = useState('');
  const [newRoomNameEn, setNewRoomNameEn] = useState('');
  const [newRoomCode, setNewRoomCode] = useState('');
  const [newRoomLocation, setNewRoomLocation] = useState('المقر الرئيسي');
  const [newRoomFloor, setNewRoomFloor] = useState('الطابق 3');
  const [newRoomDescription, setNewRoomDescription] = useState('');

  const canManage =
    currentUser.role === 'super_admin' || currentUser.role === 'admin';

  // Room upcoming bookings
  const roomUpcomingBookings = bookings
    .filter((b) => b.roomId === selectedRoom.id && b.status === 'confirmed' && b.date >= currentDate)
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

  // Room statistics
  const roomStats = calculateRoomDetailedStats(selectedRoom.id, bookings, selectedRoom);

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomNameAr.trim()) return;

    addRoom({
      nameAr: newRoomNameAr,
      nameEn: newRoomNameEn || newRoomNameAr,
      code: newRoomCode || `ROOM-${rooms.length + 1}`,
      capacity: 'غير محدد',
      location: newRoomLocation,
      floor: newRoomFloor,
      description: newRoomDescription || 'قاعة اجتماعات جديدة',
      equipment: ['شاشة عرض', 'كراسي وطاولة اجتماعات', 'سبورة'],
      status: 'available',
      operatingHours: { start: '07:30', end: '18:00' },
      minDurationMinutes: 30,
      maxDurationMinutes: 240,
      checkInRequired: true,
      autoReleaseMinutes: 15
    });

    setShowAddRoomModal(false);
    setNewRoomNameAr('');
    setNewRoomNameEn('');
    setNewRoomCode('');
  };

  const handleMaintenanceToggle = () => {
    const isCurrentlyMaint = selectedRoom.status === 'maintenance';
    toggleRoomMaintenance(selectedRoom.id, !isCurrentlyMaint, maintenanceReason);
    setShowMaintenanceModal(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Header Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <DoorOpen className="w-6 h-6 text-blue-700" />
            <span>إدارة قاعات الاجتماعات (قاعة الدانة وقاعة الواحة)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            بنية تحتية مرنة وقابلة للتوسع لإضافة أي عدد من القاعات مستقبلاً دون إعادة تصميم النظام
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setShowAddRoomModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition-colors self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>إضافة قاعة جديدة</span>
          </button>
        )}
      </div>

      {/* Room Selection Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map((r) => {
          const isSelected = selectedRoom.id === r.id;
          const isMaint = r.status === 'maintenance';

          return (
            <div
              key={r.id}
              onClick={() => setSelectedRoom(r)}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/40 shadow-sm ring-2 ring-blue-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-slate-900">{r.nameAr}</h3>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-100 font-bold text-slate-700">
                      {r.code}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{r.nameEn} • {r.location}</p>
                </div>

                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                    isMaint
                      ? 'bg-rose-100 text-rose-800 border-rose-300'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}
                >
                  {isMaint ? 'مغلقة للصيانة' : 'متاحة'}
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-600">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>السعة: {r.capacity}</span>
                </span>
                <span className="flex items-center gap-1 font-semibold text-blue-700">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatTimeRange12(r.operatingHours?.start, r.operatingHours?.end)}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Room Full Details Card (Prompt #33: صفحة القاعة المستقلة) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-6">
        
        {/* Room Headline & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-2xl font-black text-slate-900">
                قاعة {selectedRoom.nameAr}
              </h2>
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold">
                {selectedRoom.code}
              </span>
              <span
                className={`px-3 py-0.5 rounded-full text-xs font-bold ${
                  selectedRoom.status === 'maintenance'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {selectedRoom.status === 'maintenance' ? 'مغلقة للصيانة' : 'متاحة للحجز الآن'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">{selectedRoom.description}</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onOpenNewBooking(selectedRoom.id)}
              disabled={selectedRoom.status === 'maintenance'}
              className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>حجز هذه القاعة</span>
            </button>

            <button
              onClick={() => onViewRoomStats(selectedRoom.id)}
              className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-1.5"
            >
              <BarChart3 className="w-4 h-4 text-blue-700" />
              <span>الإحصائيات المستقلة</span>
            </button>

            <button
              onClick={() => setShowQrModal(selectedRoom)}
              className="p-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 transition-colors"
              title="رمز QR للقاعة"
            >
              <QrCode className="w-4 h-4" />
            </button>

            <button
              onClick={() => onOpenKiosk(selectedRoom.id)}
              className="px-3 py-2 rounded-xl border border-blue-200 bg-blue-50 text-blue-800 font-bold text-xs hover:bg-blue-100 flex items-center gap-1.5"
              title="شاشة القاعة الرقمية للوحة الحائط"
            >
              <Tv className="w-4 h-4 text-blue-700" />
              <span>شاشة القاعة</span>
            </button>

            {canManage && (
              <button
                onClick={() => setShowMaintenanceModal(true)}
                className={`px-3 py-2 rounded-xl font-bold text-xs border flex items-center gap-1.5 ${
                  selectedRoom.status === 'maintenance'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                    : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>{selectedRoom.status === 'maintenance' ? 'إعادة الفتح' : 'إغلاق للصيانة'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Room Specifications Grid (Prompt #58: لا تخترع بيانات، سعة غير محددة) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <div>
            <span className="text-slate-500 font-semibold block text-[11px]">الموقع والمقر:</span>
            <span className="font-bold text-slate-800">{selectedRoom.location}</span>
          </div>
          <div>
            <span className="text-slate-500 font-semibold block text-[11px]">الطابق:</span>
            <span className="font-bold text-slate-800">{selectedRoom.floor}</span>
          </div>
          <div>
            <span className="text-slate-500 font-semibold block text-[11px]">السعة الاستيعابية:</span>
            <span className="font-bold text-slate-800">{selectedRoom.capacity}</span>
          </div>
          <div>
            <span className="text-slate-500 font-semibold block text-[11px]">ساعات العمل (12 ساعة):</span>
            <span className="font-mono font-bold text-blue-900">
              {formatTimeRange12(selectedRoom.operatingHours?.start, selectedRoom.operatingHours?.end)}
            </span>
          </div>
        </div>

        {/* Equipment Badges */}
        <div>
          <h4 className="text-xs font-bold text-slate-700 mb-2">تجهيزات وتقنيات القاعة المعتمدة:</h4>
          <div className="flex flex-wrap gap-2">
            {selectedRoom.equipment.map((eq, i) => (
              <span
                key={i}
                className="px-3 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold"
              >
                {eq}
              </span>
            ))}
          </div>
        </div>

        {/* Room Quick Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50">
            <span className="text-[11px] text-slate-500 font-bold block">إجمالي الحجوزات</span>
            <span className="text-xl font-black text-blue-950">{roomStats.totalBookings} حجز</span>
          </div>
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50">
            <span className="text-[11px] text-slate-500 font-bold block">إجمالي الساعات</span>
            <span className="text-xl font-black text-blue-950">{roomStats.totalHours} س</span>
          </div>
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50">
            <span className="text-[11px] text-slate-500 font-bold block">نسبة الاستخدام</span>
            <span className="text-xl font-black text-blue-950">{roomStats.utilizationRate}%</span>
          </div>
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50">
            <span className="text-[11px] text-slate-500 font-bold block">أكثر إدارة استخداماً</span>
            <span className="text-xs font-black text-blue-900 block truncate mt-1">
              {roomStats.topDepartment?.nameAr || 'لا توجد بيانات'}
            </span>
          </div>
        </div>

        {/* Upcoming Bookings in This Room */}
        <div className="space-y-3 pt-2">
          <h4 className="text-sm font-bold text-slate-900 flex items-center justify-between">
            <span>الحجوزات القادمة في قاعة {selectedRoom.nameAr}</span>
            <span className="text-xs text-slate-500 font-normal">
              ({roomUpcomingBookings.length} حجز مؤكد)
            </span>
          </h4>

          {roomUpcomingBookings.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-xl">
              لا توجد حجوزات مستقبلية مجدولة في هذه القاعة حالياً.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-start border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold">
                  <tr>
                    <th className="p-3 text-start">رقم الحجز</th>
                    <th className="p-3 text-start">التاريخ</th>
                    <th className="p-3 text-start">الوقت</th>
                    <th className="p-3 text-start">موضوع الاجتماع</th>
                    <th className="p-3 text-start">الإدارة</th>
                    <th className="p-3 text-start">مقدم الحجز</th>
                    <th className="p-3 text-center">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {roomUpcomingBookings.map((b) => (
                    <tr
                      key={b.id}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => onSelectBooking(b)}
                    >
                      <td className="p-3 font-mono font-bold text-blue-900">{b.bookingNumber}</td>
                      <td className="p-3 font-mono">{b.date}</td>
                      <td className="p-3 font-mono text-xs">{formatTimeRange12(b.startTime, b.endTime)}</td>
                      <td className="p-3 font-bold text-slate-900">{b.title}</td>
                      <td className="p-3 text-blue-800 font-semibold">{b.departmentNameAr}</td>
                      <td className="p-3 text-slate-600">{b.bookerName}</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectBooking(b);
                          }}
                          className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-[11px]"
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

      </div>

      {/* Maintenance Toggle Modal (Prompt #40) */}
      {showMaintenanceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900">
              {selectedRoom.status === 'maintenance'
                ? `إعادة فتح قاعة ${selectedRoom.nameAr}`
                : `إغلاق قاعة ${selectedRoom.nameAr} لأعمال الصيانة`}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {selectedRoom.status === 'maintenance'
                ? 'سيتم تفعيل القاعة مجدداً وإتاحتها لموظفي شركة ساعد لإنشاء الحجوزات.'
                : 'سيتم منع إنشاء أي حجوزات جديدة في القاعة طوال فترة الإغلاق لحين إنهاء الصيانة.'}
            </p>

            {selectedRoom.status !== 'maintenance' && (
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
                  selectedRoom.status === 'maintenance'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {selectedRoom.status === 'maintenance' ? 'تأكيد إعادة الفتح' : 'تأكيد الإغلاق للصيانة'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal (Prompt #44) */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4">
            <h3 className="font-black text-lg text-slate-900">
              رمز الاستجابة السريعة (QR Code)
            </h3>
            <p className="text-xs text-slate-500">
              قاعة {showQrModal.nameAr} • شركة ساعد للأنظمة المرورية
            </p>

            {/* Generated clean SVG QR Representation */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl inline-block mx-auto">
              <svg className="w-48 h-48 mx-auto" viewBox="0 0 100 100" fill="currentColor">
                {/* Simulated geometric QR pattern */}
                <rect x="10" y="10" width="24" height="24" rx="3" fill="#1e3a8a" />
                <rect x="14" y="14" width="16" height="16" fill="white" />
                <rect x="18" y="18" width="8" height="8" fill="#1e3a8a" />

                <rect x="66" y="10" width="24" height="24" rx="3" fill="#1e3a8a" />
                <rect x="70" y="14" width="16" height="16" fill="white" />
                <rect x="74" y="18" width="8" height="8" fill="#1e3a8a" />

                <rect x="10" y="66" width="24" height="24" rx="3" fill="#1e3a8a" />
                <rect x="14" y="70" width="16" height="16" fill="white" />
                <rect x="18" y="74" width="8" height="8" fill="#1e3a8a" />

                {/* Data modules */}
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
              عند مسح الرمز بجانب باب القاعة، يستطيع الموظف الاطلاع على جدول الاجتماعات وتسجيل الحضور الفوري (Check-in).
            </p>

            <button
              onClick={() => setShowQrModal(null)}
              className="w-full py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* Add Room Modal (Prompt #2: إمكانية التوسع المستقبلي) */}
      {showAddRoomModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <form
            onSubmit={handleCreateRoom}
            className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 text-xs"
          >
            <h3 className="font-bold text-base text-slate-900">
              إضافة قاعة اجتماعات جديدة في النظام
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم القاعة بالعربية *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: قاعة الابتكار"
                  value={newRoomNameAr}
                  onChange={(e) => setNewRoomNameAr(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">الاسم بالإنجليزية</label>
                <input
                  type="text"
                  placeholder="e.g. Innovation Hall"
                  value={newRoomNameEn}
                  onChange={(e) => setNewRoomNameEn(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">رمز القاعة</label>
                <input
                  type="text"
                  placeholder="e.g. INNO-03"
                  value={newRoomCode}
                  onChange={(e) => setNewRoomCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">الطابق</label>
                <input
                  type="text"
                  value={newRoomFloor}
                  onChange={(e) => setNewRoomFloor(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">الموقع والمبنى</label>
              <input
                type="text"
                value={newRoomLocation}
                onChange={(e) => setNewRoomLocation(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddRoomModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold"
              >
                إضافة القاعة
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
