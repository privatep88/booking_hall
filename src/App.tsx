import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { Footer } from './components/Footer';
import { Dashboard } from './components/Dashboard';
import { AnalyticsView } from './components/AnalyticsView';
import { CalendarView } from './components/CalendarView';
import { RoomsView } from './components/RoomsView';
import { SingleRoomView } from './components/SingleRoomView';
import { BookingsListView } from './components/BookingsListView';
import { RoomDisplayKiosk } from './components/RoomDisplayKiosk';
import { AuditLogView } from './components/AuditLogView';
import { SettingsView } from './components/SettingsView';
import { ProfileView } from './components/ProfileView';
import { AdminExceptionsView } from './components/AdminExceptionsView';
import { BookingForm } from './components/BookingForm';
import { BookingDetailsModal } from './components/BookingDetailsModal';
import { LoginView } from './components/LoginView';
import { GlobalMeetingNotificationProvider } from './components/GlobalMeetingNotificationProvider';
import { Booking } from './types';
import { ShieldAlert } from 'lucide-react';

const MainApp: React.FC = () => {
  const { currentUser, isAuthenticated, rooms } = useApp();
  const isAdmin = currentUser.role === 'super_admin' || currentUser.role === 'admin';
  const [activeView, setActiveView] = useState<string>('dana');

  const activeSingleRoom = rooms.find(
    (r) =>
      (r.id === 'room-dana' && (activeView === 'dana' || activeView === 'dashboard')) ||
      (r.id === 'room-waha' && activeView === 'waha') ||
      r.id === activeView
  );
  
  // Modals state
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [preselectedRoomId, setPreselectedRoomId] = useState<string | undefined>(undefined);
  const [preselectedDate, setPreselectedDate] = useState<string | undefined>(undefined);
  const [preselectedStartTime, setPreselectedStartTime] = useState<string | undefined>(undefined);
  const [preselectedDepartmentId, setPreselectedDepartmentId] = useState<string | undefined>(undefined);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);

  // Details modal
  const [detailsBooking, setDetailsBooking] = useState<Booking | null>(null);
  const [highlightedBookingId, setHighlightedBookingId] = useState<string | null>(null);

  // Kiosk mode room ID
  const [kioskRoomId, setKioskRoomId] = useState<string>('room-dana');

  const handleOpenNewBooking = (
    roomId?: string,
    date?: string,
    startTime?: string,
    departmentId?: string
  ) => {
    setEditingBooking(null);
    setPreselectedRoomId(roomId);
    setPreselectedDate(date);
    setPreselectedStartTime(startTime);
    setPreselectedDepartmentId(departmentId);
    setIsBookingModalOpen(true);
  };

  const handleEditBooking = (booking: Booking) => {
    setDetailsBooking(null);
    setEditingBooking(booking);
    setIsBookingModalOpen(true);
  };

  const handleViewRoomStats = (roomId: string) => {
    setActiveView('analytics');
  };

  const handleOpenKiosk = (roomId: string) => {
    setKioskRoomId(roomId);
    setActiveView('kiosk');
  };

  const handleNavigateToBookingsArchive = (bookingId: string) => {
    setActiveView('bookings');
    setHighlightedBookingId(bookingId);
    window.setTimeout(() => {
      setHighlightedBookingId((current) => (current === bookingId ? null : current));
    }, 10000);
  };

  if (!isAuthenticated) {
    return <LoginView />;
  }

  return (
    <GlobalMeetingNotificationProvider
      isSensitiveModalOpen={isBookingModalOpen || Boolean(detailsBooking)}
      onOpenBookingDetails={(b) => setDetailsBooking(b)}
      onNavigateToBookingsArchive={handleNavigateToBookingsArchive}
    >
      <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
        
        {/* Top Header */}
        <Header
          activeView={activeView}
          setActiveView={setActiveView}
          onOpenNewBooking={() => handleOpenNewBooking()}
          onSelectBooking={(b) => setDetailsBooking(b)}
        />

      {/* Navigation Bar (hidden in kiosk mode for authentic display feel) */}
      {activeView !== 'kiosk' && (
        <Navigation
          activeView={activeView}
          setActiveView={setActiveView}
          onOpenNewBooking={() => handleOpenNewBooking()}
        />
      )}

      {/* Main Container */}
      <main className="w-full flex-1">
        
        {/* Single Room View (Al Dana, Al Waha, or any dynamically added Room) */}
        {activeSingleRoom && (
          <SingleRoomView
            roomId={activeSingleRoom.id}
            onOpenNewBooking={(roomId, date, startTime) => handleOpenNewBooking(roomId, date, startTime)}
            onSelectBooking={(b) => setDetailsBooking(b)}
            onEditBooking={(b) => handleEditBooking(b)}
            onViewStats={() => setActiveView('analytics')}
            onOpenKiosk={(roomId) => handleOpenKiosk(roomId)}
            onNavigateToCalendar={() => setActiveView('calendar')}
          />
        )}

        {/* Other Tabs inside centered container */}
        {!activeSingleRoom && (
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Tab 3: All Analytics / Comprehensive Statistics */}
            {activeView === 'analytics' && (
              <AnalyticsView
                onSelectBooking={(b) => setDetailsBooking(b)}
              />
            )}

            {/* Tab 4: Calendar Only */}
            {activeView === 'calendar' && (
              <CalendarView
                onSelectBooking={(b) => setDetailsBooking(b)}
                onOpenNewBooking={handleOpenNewBooking}
              />
            )}

            {/* Tab 5: Admin Exceptions & Restrictions Policies (Strictly Admin Only) */}
            {activeView === 'exceptions' && (
              isAdmin ? (
                <AdminExceptionsView
                  onOpenNewBooking={(roomId?: string, deptId?: string) => handleOpenNewBooking(roomId, undefined, undefined, deptId)}
                  onOpenDanaBooking={(deptId?: string) => handleOpenNewBooking('room-dana', undefined, undefined, deptId)}
                  onOpenWahaBooking={(deptId?: string) => handleOpenNewBooking('room-waha', undefined, undefined, deptId)}
                  onNavigateToRoom={(roomId: string) =>
                    setActiveView(
                      roomId === 'room-dana'
                        ? 'dana'
                        : roomId === 'room-waha'
                        ? 'waha'
                        : roomId
                    )
                  }
                />
              ) : (
                <div className="max-w-xl mx-auto my-12 bg-white rounded-2xl border border-amber-200 p-8 text-center space-y-4 shadow-sm animate-in fade-in">
                  <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-xs">
                    <ShieldAlert className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    غير مصرّح لك بالوصول إلى خيارات واستثناءات الإدارة
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
                    حسابك الحالي مسجل بالصلاحية (
                    <span className="font-bold text-slate-800">
                      {currentUser.role === 'employee'
                        ? 'موظف'
                        : currentUser.role === 'coordinator'
                        ? 'منسق الحجوزات'
                        : currentUser.role === 'viewer'
                        ? 'مستعرض فقط'
                        : currentUser.role}
                    </span>
                    ). لا تملك صلاحية الأدمن أو خيارات واستثناءات الإدارة لحجز القاعات. هذا القسم مخصص لمدراء النظام فقط.
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={() => setActiveView('dana')}
                      className="px-5 py-2.5 rounded-xl bg-blue-700 text-white text-xs font-bold hover:bg-blue-800 transition-colors shadow-xs"
                    >
                      العودة إلى حجز القاعات
                    </button>
                  </div>
                </div>
              )
            )}

            {activeView === 'rooms' && (
              <RoomsView
                onOpenNewBooking={handleOpenNewBooking}
                onViewRoomStats={handleViewRoomStats}
                onSelectBooking={(b) => setDetailsBooking(b)}
                onOpenKiosk={handleOpenKiosk}
              />
            )}

            {/* Master Bookings List */}
            {activeView === 'bookings' && (
              <BookingsListView
                onSelectBooking={(b) => setDetailsBooking(b)}
                onOpenNewBooking={() => handleOpenNewBooking()}
                onEditBooking={(b) => handleEditBooking(b)}
                highlightedBookingId={highlightedBookingId}
              />
            )}

            {/* Digital Signage / Kiosk Outside Room */}
            {activeView === 'kiosk' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between no-print">
                  <button
                    onClick={() => setActiveView('dana')}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-white font-bold text-xs hover:bg-slate-900 transition-colors"
                  >
                    ← العودة إلى قاعة الدانة
                  </button>
                  <span className="text-xs text-slate-500">وضع شاشة العرض الرقمية للممرات والقاعات</span>
                </div>
                <RoomDisplayKiosk
                  initialRoomId={kioskRoomId}
                  onExit={() => setActiveView('dana')}
                  onOpenNewBooking={handleOpenNewBooking}
                />
              </div>
            )}

            {/* Audit Log */}
            {activeView === 'audit' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setActiveView('dana')}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
                  >
                    ← العودة إلى القاعات
                  </button>
                </div>
                <AuditLogView />
              </div>
            )}

            {/* Settings */}
            {activeView === 'settings' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setActiveView('dana')}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
                  >
                    ← العودة إلى القاعات
                  </button>
                </div>
                <SettingsView />
              </div>
            )}

            {/* User Profile */}
            {activeView === 'profile' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setActiveView('dana')}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
                  >
                    ← العودة إلى القاعات
                  </button>
                </div>
                <ProfileView onSelectBooking={(b) => setDetailsBooking(b)} />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Corporate Footer */}
      {activeView !== 'kiosk' && <Footer />}

      {/* Booking Form Modal */}
      <BookingForm
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        preselectedRoomId={preselectedRoomId}
        preselectedDate={preselectedDate}
        preselectedStartTime={preselectedStartTime}
        preselectedDepartmentId={preselectedDepartmentId}
        editingBooking={editingBooking}
      />

      {/* Booking Details Modal */}
      <BookingDetailsModal
        isOpen={Boolean(detailsBooking)}
        booking={detailsBooking}
        onClose={() => setDetailsBooking(null)}
        onEdit={handleEditBooking}
      />

      </div>
    </GlobalMeetingNotificationProvider>
  );
};

export function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}

export default App;
