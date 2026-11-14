import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { useApp } from '../context/AppContext';
import { Booking, MeetingCompletionNotification } from '../types';
import {
  getActualCurrentDate,
  getActualCurrentTime
} from '../utils/dateUtils';
import {
  COMPLETION_CHANNEL_NAME,
  LifecycleSnapshotEntry,
  computeMeetingLifecycleState,
  evaluateCompletionCandidates,
  isUserAuthorizedForBookingNotification,
  loadUserNotificationState,
  saveUserNotificationState,
  sortCompletionEventsChronologically
} from '../services/meetingLifecycleService';
import { SmartMeetingCompletionModal } from './SmartMeetingCompletionModal';

interface MeetingNotificationContextType {
  completionNotifications: MeetingCompletionNotification[];
  unreadCompletionCount: number;
  markCompletionRead: (eventKey: string) => void;
  markAllCompletionsRead: () => void;
  clearCompletionNotification: (eventKey: string) => void;
  clearAllCompletionNotifications: () => void;
}

const MeetingNotificationContext = createContext<
  MeetingNotificationContextType | undefined
>(undefined);

interface GlobalMeetingNotificationProviderProps {
  children: React.ReactNode;
  isSensitiveModalOpen: boolean;
  onOpenBookingDetails: (booking: Booking) => void;
  onNavigateToBookingsArchive: (highlightBookingId: string) => void;
}

type SyncBroadcastMessage =
  | { type: 'ACK'; userId: string; eventKey: string }
  | { type: 'READ'; userId: string; eventKey: string }
  | { type: 'READ_ALL'; userId: string; eventKeys: string[] }
  | { type: 'CLEAR'; userId: string; eventKey: string }
  | { type: 'CLEAR_ALL'; userId: string; eventKeys: string[] };

export const GlobalMeetingNotificationProvider: React.FC<
  GlobalMeetingNotificationProviderProps
> = ({
  children,
  isSensitiveModalOpen,
  onOpenBookingDetails,
  onNavigateToBookingsArchive
}) => {
  const { bookings, currentUser, isAuthenticated, isOnline, language } = useApp();

  const [watermarkIso, setWatermarkIso] = useState<string>(() =>
    new Date().toISOString()
  );
  const [acknowledgedKeys, setAcknowledgedKeys] = useState<string[]>([]);
  const [readKeys, setReadKeys] = useState<string[]>([]);
  const [clearedKeys, setClearedKeys] = useState<string[]>([]);
  const [storedRecords, setStoredRecords] = useState<
    MeetingCompletionNotification[]
  >([]);
  const [modalQueue, setModalQueue] = useState<MeetingCompletionNotification[]>(
    []
  );
  const [clockTick, setClockTick] = useState<number>(0);

  const snapshotsRef = useRef<Map<string, LifecycleSnapshotEntry>>(new Map());
  const initializedForUserRef = useRef<string | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const bookingsRef = useRef<Booking[]>(bookings);

  useEffect(() => {
    bookingsRef.current = bookings;
  }, [bookings]);

  // 1. Initialize per-user persisted state & baseline snapshot when user logs in or switches user
  useEffect(() => {
    if (!isAuthenticated || !currentUser?.id) {
      initializedForUserRef.current = null;
      snapshotsRef.current = new Map();
      setModalQueue([]);
      return;
    }

    const today = getActualCurrentDate();
    const timeNow = getActualCurrentTime();
    const loaded = loadUserNotificationState(
      currentUser.id,
      bookingsRef.current,
      today,
      timeNow
    );

    setWatermarkIso(loaded.watermarkIso);
    setAcknowledgedKeys(loaded.acknowledgedKeys);
    setReadKeys(loaded.readKeys);
    setClearedKeys(loaded.clearedKeys);
    setStoredRecords(loaded.records);

    // Seed initial snapshot for live transition detection
    const initialMap = new Map<string, LifecycleSnapshotEntry>();
    bookingsRef.current.forEach((b) => {
      initialMap.set(b.id, {
        lifecycle: computeMeetingLifecycleState(b, today, timeNow),
        date: b.date,
        startTime: b.startTime,
        endTime: b.endTime,
        status: b.status
      });
    });
    snapshotsRef.current = initialMap;
    initializedForUserRef.current = currentUser.id;
    setModalQueue([]);
  }, [isAuthenticated, currentUser?.id]);

  // 2. Persist state to localStorage whenever user-scoped state updates
  useEffect(() => {
    if (!isAuthenticated || !currentUser?.id) return;
    if (initializedForUserRef.current !== currentUser.id) return;

    saveUserNotificationState(currentUser.id, {
      watermarkIso,
      acknowledgedKeys,
      readKeys,
      clearedKeys,
      records: storedRecords
    });
  }, [
    isAuthenticated,
    currentUser?.id,
    watermarkIso,
    acknowledgedKeys,
    readKeys,
    clearedKeys,
    storedRecords
  ]);

  // 3. Cross-tab synchronization via BroadcastChannel & Storage events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let channel: BroadcastChannel | null = null;
    if ('BroadcastChannel' in window) {
      channel = new BroadcastChannel(COMPLETION_CHANNEL_NAME);
      channelRef.current = channel;

      channel.onmessage = (event: MessageEvent<SyncBroadcastMessage>) => {
        const msg = event.data;
        if (!msg || msg.userId !== currentUser?.id) return;

        if (msg.type === 'ACK') {
          setAcknowledgedKeys((prev) =>
            prev.includes(msg.eventKey) ? prev : [...prev, msg.eventKey]
          );
          setModalQueue((prev) =>
            prev.filter((item) => item.eventKey !== msg.eventKey)
          );
        } else if (msg.type === 'READ') {
          setReadKeys((prev) =>
            prev.includes(msg.eventKey) ? prev : [...prev, msg.eventKey]
          );
        } else if (msg.type === 'READ_ALL') {
          setReadKeys((prev) => Array.from(new Set([...prev, ...msg.eventKeys])));
        } else if (msg.type === 'CLEAR') {
          setClearedKeys((prev) =>
            prev.includes(msg.eventKey) ? prev : [...prev, msg.eventKey]
          );
          setAcknowledgedKeys((prev) =>
            prev.includes(msg.eventKey) ? prev : [...prev, msg.eventKey]
          );
          setModalQueue((prev) =>
            prev.filter((item) => item.eventKey !== msg.eventKey)
          );
        } else if (msg.type === 'CLEAR_ALL') {
          setClearedKeys((prev) =>
            Array.from(new Set([...prev, ...msg.eventKeys]))
          );
          setAcknowledgedKeys((prev) =>
            Array.from(new Set([...prev, ...msg.eventKeys]))
          );
          setModalQueue((prev) =>
            prev.filter((item) => !msg.eventKeys.includes(item.eventKey))
          );
        }
      };
    }

    const handleStorageSync = (e: StorageEvent) => {
      if (!currentUser?.id) return;
      if (e.key === `saaed_smart_completion_v1_${currentUser.id}` && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed.acknowledgedKeys)) {
            setAcknowledgedKeys(parsed.acknowledgedKeys);
            const ackSet = new Set<string>(parsed.acknowledgedKeys);
            setModalQueue((prev) =>
              prev.filter((item) => !ackSet.has(item.eventKey))
            );
          }
          if (Array.isArray(parsed.readKeys)) {
            setReadKeys(parsed.readKeys);
          }
          if (Array.isArray(parsed.clearedKeys)) {
            setClearedKeys(parsed.clearedKeys);
          }
          if (Array.isArray(parsed.records)) {
            setStoredRecords(parsed.records);
          }
        } catch {
          // ignore malformed cross-tab storage
        }
      }
    };

    window.addEventListener('storage', handleStorageSync);

    return () => {
      if (channel) {
        channel.close();
      }
      channelRef.current = null;
      window.removeEventListener('storage', handleStorageSync);
    };
  }, [currentUser?.id]);

  const postSync = useCallback((msg: SyncBroadcastMessage) => {
    try {
      channelRef.current?.postMessage(msg);
    } catch {
      // ignore closed channel
    }
  }, []);

  // 4. Periodic clock ticker for real-time boundary detection (every 3 seconds + focus/visibility/online)
  useEffect(() => {
    if (!isAuthenticated) return;

    const triggerTick = () => setClockTick((n) => n + 1);
    const interval = window.setInterval(triggerTick, 3000);

    window.addEventListener('focus', triggerTick);
    window.addEventListener('online', triggerTick);
    document.addEventListener('visibilitychange', triggerTick);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', triggerTick);
      window.removeEventListener('online', triggerTick);
      document.removeEventListener('visibilitychange', triggerTick);
    };
  }, [isAuthenticated]);

  // 5. MeetingLifecycleMonitor: evaluate booking transitions and enqueue authentic completion events
  useEffect(() => {
    if (!isAuthenticated || !currentUser?.id) return;
    if (initializedForUserRef.current !== currentUser.id) return;

    const today = getActualCurrentDate();
    const timeNow = getActualCurrentTime();
    const ackSet = new Set(acknowledgedKeys);

    const { newlyCompletedEvents, invalidatedBookingIds, nextSnapshots } =
      evaluateCompletionCandidates({
        bookings,
        previousSnapshots: snapshotsRef.current,
        user: currentUser,
        currentDate: today,
        currentTime: timeNow,
        watermarkIso,
        acknowledgedKeys: ackSet,
        isOnline
      });

    snapshotsRef.current = nextSnapshots;

    if (invalidatedBookingIds.length > 0) {
      const invalidSet = new Set(invalidatedBookingIds);
      setModalQueue((prev) => prev.filter((item) => !invalidSet.has(item.bookingId)));
      // Remove pending unconfirmed/invalidated stored completion records if booking was cancelled or extended
      setStoredRecords((prev) =>
        prev.filter((rec) => {
          if (!invalidSet.has(rec.bookingId)) return true;
          const live = bookings.find((b) => b.id === rec.bookingId);
          if (!live) return false;
          const state = computeMeetingLifecycleState(live, today, timeNow);
          return state === 'completed' && live.endTime === rec.endTime && live.date === rec.date;
        })
      );
    }

    if (newlyCompletedEvents.length > 0) {
      setStoredRecords((prev) => {
        const existingKeys = new Set(prev.map((r) => r.eventKey));
        const additions = newlyCompletedEvents.filter(
          (ev) => !existingKeys.has(ev.eventKey)
        );
        if (additions.length === 0) return prev;
        return [...additions, ...prev];
      });

      setModalQueue((prev) => {
        const queuedOrAck = new Set([
          ...prev.map((p) => p.eventKey),
          ...acknowledgedKeys
        ]);
        const fresh = newlyCompletedEvents.filter(
          (ev) => !queuedOrAck.has(ev.eventKey)
        );
        if (fresh.length === 0) return prev;
        return sortCompletionEventsChronologically([...prev, ...fresh]);
      });
    }
  }, [
    bookings,
    clockTick,
    isAuthenticated,
    isOnline,
    currentUser,
    watermarkIso,
    acknowledgedKeys
  ]);

  // Helper actions
  const acknowledgeEvent = useCallback(
    (eventKey: string) => {
      if (!currentUser?.id) return;
      setAcknowledgedKeys((prev) =>
        prev.includes(eventKey) ? prev : [...prev, eventKey]
      );
      setModalQueue((prev) => prev.filter((item) => item.eventKey !== eventKey));
      postSync({ type: 'ACK', userId: currentUser.id, eventKey });
    },
    [currentUser?.id, postSync]
  );

  const markCompletionRead = useCallback(
    (eventKey: string) => {
      if (!currentUser?.id) return;
      setReadKeys((prev) =>
        prev.includes(eventKey) ? prev : [...prev, eventKey]
      );
      postSync({ type: 'READ', userId: currentUser.id, eventKey });
    },
    [currentUser?.id, postSync]
  );

  const markAllCompletionsRead = useCallback(() => {
    if (!currentUser?.id) return;
    const keys = storedRecords
      .filter((r) => !clearedKeys.includes(r.eventKey))
      .map((r) => r.eventKey);
    if (keys.length === 0) return;
    setReadKeys((prev) => Array.from(new Set([...prev, ...keys])));
    postSync({ type: 'READ_ALL', userId: currentUser.id, eventKeys: keys });
  }, [currentUser?.id, storedRecords, clearedKeys, postSync]);

  const clearCompletionNotification = useCallback(
    (eventKey: string) => {
      if (!currentUser?.id) return;
      setClearedKeys((prev) =>
        prev.includes(eventKey) ? prev : [...prev, eventKey]
      );
      setAcknowledgedKeys((prev) =>
        prev.includes(eventKey) ? prev : [...prev, eventKey]
      );
      setModalQueue((prev) => prev.filter((item) => item.eventKey !== eventKey));
      postSync({ type: 'CLEAR', userId: currentUser.id, eventKey });
    },
    [currentUser?.id, postSync]
  );

  const clearAllCompletionNotifications = useCallback(() => {
    if (!currentUser?.id) return;
    const keys = storedRecords.map((r) => r.eventKey);
    if (keys.length === 0) return;
    setClearedKeys((prev) => Array.from(new Set([...prev, ...keys])));
    setAcknowledgedKeys((prev) => Array.from(new Set([...prev, ...keys])));
    setModalQueue([]);
    postSync({ type: 'CLEAR_ALL', userId: currentUser.id, eventKeys: keys });
  }, [currentUser?.id, storedRecords, postSync]);

  // Modal CTA Handlers
  const handleCloseAcknowledge = useCallback(
    (notification: MeetingCompletionNotification) => {
      markCompletionRead(notification.eventKey);
      acknowledgeEvent(notification.eventKey);
    },
    [markCompletionRead, acknowledgeEvent]
  );

  const handleViewDetails = useCallback(
    (notification: MeetingCompletionNotification) => {
      markCompletionRead(notification.eventKey);
      acknowledgeEvent(notification.eventKey);
      const target = bookingsRef.current.find(
        (b) => b.id === notification.bookingId
      );
      if (target) {
        onOpenBookingDetails(target);
      } else {
        // Fallback booking shape if still syncing
        onOpenBookingDetails({
          id: notification.bookingId,
          bookingNumber: notification.bookingNumber,
          roomId: notification.roomId,
          roomNameAr: notification.roomNameAr,
          roomNameEn: notification.roomNameEn,
          userId: notification.userId,
          departmentId: notification.departmentId,
          departmentNameAr: notification.departmentNameAr,
          departmentNameEn: notification.departmentNameAr,
          title: notification.title,
          meetingType: 'administrative',
          date: notification.date,
          startTime: notification.startTime,
          endTime: notification.endTime,
          durationMinutes: notification.durationMinutes,
          bookerName: notification.bookerName,
          employeeId: notification.employeeId,
          bookerEmail: '',
          bookerPhone: '',
          attendeesCount: 1,
          confidential: notification.confidential,
          equipmentRequested: [],
          status: 'completed',
          createdAt: notification.createdAt,
          updatedAt: notification.completedAtActual,
          endedAt: notification.scheduledEndIso
        });
      }
    },
    [markCompletionRead, acknowledgeEvent, onOpenBookingDetails]
  );

  const handleViewArchive = useCallback(
    (notification: MeetingCompletionNotification) => {
      markCompletionRead(notification.eventKey);
      acknowledgeEvent(notification.eventKey);
      onNavigateToBookingsArchive(notification.bookingId);
    },
    [markCompletionRead, acknowledgeEvent, onNavigateToBookingsArchive]
  );

  // Derived notification center items filtered by RBAC & non-cleared state
  const completionNotifications = useMemo(() => {
    if (!isAuthenticated || !currentUser?.id) return [];
    const readSet = new Set(readKeys);
    const ackSet = new Set(acknowledgedKeys);
    const clearedSet = new Set(clearedKeys);

    return storedRecords
      .filter(
        (rec) =>
          !clearedSet.has(rec.eventKey) &&
          isUserAuthorizedForBookingNotification(rec, currentUser)
      )
      .map((rec) => ({
        ...rec,
        isRead: readSet.has(rec.eventKey),
        isAcknowledged: ackSet.has(rec.eventKey),
        isCleared: false
      }))
      .sort((a, b) => b.completedAtActual.localeCompare(a.completedAtActual));
  }, [
    isAuthenticated,
    currentUser,
    storedRecords,
    readKeys,
    acknowledgedKeys,
    clearedKeys
  ]);

  const unreadCompletionCount = useMemo(
    () => completionNotifications.filter((n) => !n.isRead).length,
    [completionNotifications]
  );

  // Determine active modal item (only when authenticated and no sensitive modal is open)
  const activeModalNotification = useMemo(() => {
    if (!isAuthenticated || isSensitiveModalOpen) return null;
    const ackSet = new Set(acknowledgedKeys);
    const clearedSet = new Set(clearedKeys);
    return (
      modalQueue.find(
        (item) =>
          !ackSet.has(item.eventKey) &&
          !clearedSet.has(item.eventKey) &&
          isUserAuthorizedForBookingNotification(item, currentUser)
      ) || null
    );
  }, [
    isAuthenticated,
    isSensitiveModalOpen,
    modalQueue,
    acknowledgedKeys,
    clearedKeys,
    currentUser
  ]);

  const activeLiveBooking = useMemo(() => {
    if (!activeModalNotification) return undefined;
    return bookings.find((b) => b.id === activeModalNotification.bookingId);
  }, [activeModalNotification, bookings]);

  const eligibleQueueCount = useMemo(() => {
    const ackSet = new Set(acknowledgedKeys);
    const clearedSet = new Set(clearedKeys);
    return modalQueue.filter(
      (item) =>
        !ackSet.has(item.eventKey) &&
        !clearedSet.has(item.eventKey) &&
        isUserAuthorizedForBookingNotification(item, currentUser)
    ).length;
  }, [modalQueue, acknowledgedKeys, clearedKeys, currentUser]);

  return (
    <MeetingNotificationContext.Provider
      value={{
        completionNotifications,
        unreadCompletionCount,
        markCompletionRead,
        markAllCompletionsRead,
        clearCompletionNotification,
        clearAllCompletionNotifications
      }}
    >
      {children}

      <SmartMeetingCompletionModal
        notification={activeModalNotification}
        liveBooking={activeLiveBooking}
        queueTotal={eligibleQueueCount}
        language={language}
        onCloseAcknowledge={handleCloseAcknowledge}
        onViewDetails={handleViewDetails}
        onViewArchive={handleViewArchive}
      />
    </MeetingNotificationContext.Provider>
  );
};

export const useMeetingNotifications = () => {
  const ctx = useContext(MeetingNotificationContext);
  if (!ctx) {
    throw new Error(
      'useMeetingNotifications must be used within a GlobalMeetingNotificationProvider'
    );
  }
  return ctx;
};
