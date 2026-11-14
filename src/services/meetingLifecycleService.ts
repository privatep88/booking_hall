import {
  Booking,
  MeetingCompletionNotification,
  MeetingLifecycleState,
  User
} from '../types';
import {
  SYSTEM_TIMEZONE,
  calculateDuration,
  formatTime12,
  timeToMinutes
} from '../utils/dateUtils';

export const COMPLETION_CHANNEL_NAME = 'saaed_meeting_completion_sync_v1';

export interface UserNotificationPersistenceState {
  watermarkIso: string;
  acknowledgedKeys: string[];
  readKeys: string[];
  clearedKeys: string[];
  records: MeetingCompletionNotification[];
}

export interface LifecycleSnapshotEntry {
  lifecycle: MeetingLifecycleState;
  date: string;
  startTime: string;
  endTime: string;
  status: Booking['status'];
}

const storageKeyForUser = (userId: string) => `saaed_smart_completion_v1_${userId}`;

/**
 * Computes the true lifecycle state of a booking based on Asia/Dubai date and time.
 */
export function computeMeetingLifecycleState(
  booking: Pick<Booking, 'status' | 'date' | 'startTime' | 'endTime'>,
  currentDate: string,
  currentTime: string
): MeetingLifecycleState {
  if (booking.status === 'cancelled' || booking.status === 'rejected') {
    return 'cancelled';
  }
  if (booking.status === 'completed') {
    return 'completed';
  }

  if (booking.date > currentDate) {
    return 'upcoming';
  }
  if (booking.date < currentDate) {
    return 'completed';
  }

  const nowMin = timeToMinutes(currentTime);
  const startMin = timeToMinutes(booking.startTime);
  const endMin = timeToMinutes(booking.endTime);

  if (nowMin < startMin) {
    return 'upcoming';
  }
  if (nowMin >= startMin && nowMin < endMin) {
    return 'ongoing';
  }
  return 'completed';
}

/**
 * Generates an idempotent event key unique to the booking and its scheduled end slot.
 * If the booking end time or date is extended, a new event key is naturally produced.
 */
export function buildCompletionEventKey(
  booking: Pick<Booking, 'id' | 'date' | 'endTime'>
): string {
  return `${booking.id}:meeting_completed:${booking.date}_${booking.endTime}`;
}

/**
 * Determines whether the currently signed-in user is authorized to view/receive
 * completion notifications for a given booking.
 */
export function isUserAuthorizedForBookingNotification(
  booking: Pick<Booking, 'userId' | 'employeeId' | 'departmentId' | 'confidential'>,
  user: Pick<User, 'id' | 'employeeId' | 'departmentId' | 'role'>
): boolean {
  if (user.role === 'super_admin' || user.role === 'admin') {
    return true;
  }

  const isOwner =
    (Boolean(booking.userId) && booking.userId === user.id) ||
    (Boolean(booking.employeeId) && booking.employeeId === user.employeeId);

  if (isOwner) {
    return true;
  }

  if (booking.confidential) {
    return false;
  }

  if (user.role === 'coordinator') {
    return true;
  }

  return Boolean(user.departmentId) && booking.departmentId === user.departmentId;
}

/**
 * Creates a MeetingCompletionNotification payload from a booking record.
 */
export function buildCompletionNotificationFromBooking(
  booking: Booking,
  completedAtActual: string = new Date().toISOString()
): MeetingCompletionNotification {
  const duration =
    booking.durationMinutes && booking.durationMinutes > 0
      ? booking.durationMinutes
      : calculateDuration(booking.startTime, booking.endTime);

  return {
    eventKey: buildCompletionEventKey(booking),
    bookingId: booking.id,
    bookingNumber: booking.bookingNumber,
    roomId: booking.roomId,
    roomNameAr: booking.roomNameAr,
    roomNameEn: booking.roomNameEn,
    title: booking.title,
    departmentId: booking.departmentId,
    departmentNameAr: booking.departmentNameAr,
    bookerName: booking.bookerName,
    employeeId: booking.employeeId,
    userId: booking.userId,
    confidential: Boolean(booking.confidential),
    date: booking.date,
    startTime: booking.startTime,
    endTime: booking.endTime,
    durationMinutes: duration,
    scheduledEndIso: `${booking.date}T${booking.endTime}:00`,
    completedAtActual,
    isRead: false,
    isAcknowledged: false,
    isCleared: false,
    createdAt: completedAtActual
  };
}

/**
 * Sorts completion notifications strictly chronologically (oldest completion first for queued modals).
 */
export function sortCompletionEventsChronologically(
  events: MeetingCompletionNotification[]
): MeetingCompletionNotification[] {
  return [...events].sort((a, b) => {
    const dateCmp = a.date.localeCompare(b.date);
    if (dateCmp !== 0) return dateCmp;

    const endCmp = a.endTime.localeCompare(b.endTime);
    if (endCmp !== 0) return endCmp;

    const startCmp = a.startTime.localeCompare(b.startTime);
    if (startCmp !== 0) return startCmp;

    return a.createdAt.localeCompare(b.createdAt);
  });
}

/**
 * Formats an ISO timestamp into Asia/Dubai 12-hour Arabic or English time string.
 */
export function formatActualTimestampDubai(
  isoTimestamp?: string,
  locale: 'ar' | 'en' = 'ar'
): string {
  if (!isoTimestamp) return '';
  try {
    const dt = new Date(isoTimestamp);
    if (isNaN(dt.getTime())) return '';

    const timePart = new Intl.DateTimeFormat('en-GB', {
      timeZone: SYSTEM_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(dt);

    const datePart = new Intl.DateTimeFormat('en-CA', {
      timeZone: SYSTEM_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(dt);

    return `${datePart} • ${formatTime12(timePart, locale)}`;
  } catch {
    return '';
  }
}

/**
 * Loads user-scoped completion notification state from localStorage.
 * If first activation for this user, establishes a watermark timestamp and
 * silently baselines existing historical completed bookings so no bulk popup spam occurs.
 */
export function loadUserNotificationState(
  userId: string,
  initialBookings: Booking[],
  currentDate: string,
  currentTime: string
): UserNotificationPersistenceState {
  const nowIso = new Date().toISOString();
  const emptyState: UserNotificationPersistenceState = {
    watermarkIso: nowIso,
    acknowledgedKeys: [],
    readKeys: [],
    clearedKeys: [],
    records: []
  };

  if (typeof window === 'undefined') {
    return emptyState;
  }

  try {
    const raw = localStorage.getItem(storageKeyForUser(userId));
    if (!raw) {
      // First activation: baseline all already-completed historical bookings so old records do not trigger popups
      const baselineAck = initialBookings
        .filter((b) => {
          const state = computeMeetingLifecycleState(b, currentDate, currentTime);
          return state === 'completed';
        })
        .map((b) => buildCompletionEventKey(b));

      const initialized: UserNotificationPersistenceState = {
        watermarkIso: nowIso,
        acknowledgedKeys: baselineAck,
        readKeys: [],
        clearedKeys: [],
        records: []
      };
      localStorage.setItem(storageKeyForUser(userId), JSON.stringify(initialized));
      return initialized;
    }

    const parsed = JSON.parse(raw) as Partial<UserNotificationPersistenceState>;
    return {
      watermarkIso: parsed.watermarkIso || nowIso,
      acknowledgedKeys: Array.isArray(parsed.acknowledgedKeys) ? parsed.acknowledgedKeys : [],
      readKeys: Array.isArray(parsed.readKeys) ? parsed.readKeys : [],
      clearedKeys: Array.isArray(parsed.clearedKeys) ? parsed.clearedKeys : [],
      records: Array.isArray(parsed.records) ? parsed.records : []
    };
  } catch {
    return emptyState;
  }
}

export function saveUserNotificationState(
  userId: string,
  state: UserNotificationPersistenceState
): void {
  if (typeof window === 'undefined') return;
  try {
    // Keep arrays bounded cleanly while preserving active history
    const trimmed: UserNotificationPersistenceState = {
      watermarkIso: state.watermarkIso,
      acknowledgedKeys: state.acknowledgedKeys.slice(-500),
      readKeys: state.readKeys.slice(-500),
      clearedKeys: state.clearedKeys.slice(-500),
      records: state.records.slice(-200)
    };
    localStorage.setItem(storageKeyForUser(userId), JSON.stringify(trimmed));
  } catch {
    // ignore quota errors
  }
}

/**
 * Pure detection helper: identifies genuine transitions to 'completed' between snapshots
 * or persisted server completions that occurred after the user's baseline watermark.
 */
export function evaluateCompletionCandidates(params: {
  bookings: Booking[];
  previousSnapshots: Map<string, LifecycleSnapshotEntry>;
  user: User;
  currentDate: string;
  currentTime: string;
  watermarkIso: string;
  acknowledgedKeys: Set<string>;
  isOnline: boolean;
}): {
  newlyCompletedEvents: MeetingCompletionNotification[];
  invalidatedBookingIds: string[];
  nextSnapshots: Map<string, LifecycleSnapshotEntry>;
} {
  const {
    bookings,
    previousSnapshots,
    user,
    currentDate,
    currentTime,
    watermarkIso,
    acknowledgedKeys,
    isOnline
  } = params;

  const nextSnapshots = new Map<string, LifecycleSnapshotEntry>();
  const newlyCompletedEvents: MeetingCompletionNotification[] = [];
  const invalidatedBookingIds: string[] = [];

  for (const b of bookings) {
    const lifecycle = computeMeetingLifecycleState(b, currentDate, currentTime);
    const prev = previousSnapshots.get(b.id);

    nextSnapshots.set(b.id, {
      lifecycle,
      date: b.date,
      startTime: b.startTime,
      endTime: b.endTime,
      status: b.status
    });

    // If booking was cancelled, deleted, or rescheduled/extended to upcoming or ongoing,
    // invalidate any queued unacknowledged notification for it.
    if (
      lifecycle === 'cancelled' ||
      lifecycle === 'upcoming' ||
      lifecycle === 'ongoing' ||
      (prev && (prev.date !== b.date || prev.endTime !== b.endTime) && lifecycle !== 'completed')
    ) {
      invalidatedBookingIds.push(b.id);
      continue;
    }

    if (lifecycle !== 'completed') {
      continue;
    }

    // Never emit completion for cancelled/rejected bookings
    if (b.status === 'cancelled' || b.status === 'rejected') {
      invalidatedBookingIds.push(b.id);
      continue;
    }

    // RBAC check
    if (!isUserAuthorizedForBookingNotification(b, user)) {
      continue;
    }

    const eventKey = buildCompletionEventKey(b);
    if (acknowledgedKeys.has(eventKey)) {
      continue;
    }

    // Do not emit unconfirmed/false completion notifications while completely offline
    // unless the record was already persisted as 'completed' by the server.
    if (!isOnline && b.status !== 'completed') {
      continue;
    }

    // Case A: Observed live transition from ongoing or upcoming (confirmed/pending) -> completed
    const transitionedLiveFromActive =
      prev !== undefined &&
      (prev.lifecycle === 'ongoing' || prev.lifecycle === 'upcoming') &&
      prev.status !== 'cancelled' &&
      prev.status !== 'rejected';

    // Case B: Persisted status transitioned to 'completed' after watermark timestamp (e.g. while user returned/reconnected)
    // and scheduled date is today (not ancient historical backfill)
    const transitionedSinceWatermark =
      b.status === 'completed' &&
      b.date === currentDate &&
      Boolean(b.updatedAt) &&
      b.updatedAt >= watermarkIso &&
      (!b.createdAt || b.createdAt < b.updatedAt || b.date === currentDate);

    // Prevent popping a notification for a booking that was created *already* in the past
    const createdAlreadyInPast =
      Boolean(b.createdAt) &&
      b.endedAt &&
      b.createdAt >= b.updatedAt &&
      b.status === 'completed' &&
      !transitionedLiveFromActive;

    if ((transitionedLiveFromActive || transitionedSinceWatermark) && !createdAlreadyInPast) {
      const actualTimestamp =
        b.status === 'completed' && b.updatedAt ? b.updatedAt : new Date().toISOString();
      newlyCompletedEvents.push(buildCompletionNotificationFromBooking(b, actualTimestamp));
    }
  }

  // Also invalidate any booking IDs that no longer exist in bookings (deleted)
  for (const prevId of previousSnapshots.keys()) {
    if (!nextSnapshots.has(prevId)) {
      invalidatedBookingIds.push(prevId);
    }
  }

  return {
    newlyCompletedEvents: sortCompletionEventsChronologically(newlyCompletedEvents),
    invalidatedBookingIds,
    nextSnapshots
  };
}
