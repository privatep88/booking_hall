# Security Specification (Phase 0: Payload-First Security TDD)

## 1. Data Invariants
1. **Default-Deny Catch-All**: Any path not explicitly matched is unconditionally denied (`allow read, write: if false;`).
2. **Verified Identity**: All mutations require `isSignedIn()` and `request.auth.token.email_verified == true`.
3. **Booking Ownership & Immutability**: A `/bookings/{bookingId}` document can only be created if `incoming().ownerId == request.auth.uid`, `incoming().createdAt == request.time`, and `incoming().updatedAt == request.time`. During updates, `ownerId`, `bookingNumber`, and `createdAt` are strictly immutable.
4. **Terminal State Locking**: Once a booking reaches a terminal status (`status == 'completed'` or `status == 'cancelled'`), non-admin users cannot mutate it further.
5. **Secure List Queries**: `allow list` on `/bookings/{bookingId}` never uses blanket `isSignedIn()`; it strictly enforces `resource.data.ownerId == request.auth.uid || isAdmin()`.
6. **Admin-Only Configuration**: Only verified administrators (`isAdmin()`) can create, update, or delete `/rooms/{roomId}`, `/departments/{departmentId}`, and `/admins/{adminId}`.

## 2. The "Dirty Dozen" Payloads
1. **Shadow Field Injection**: Booking creation payload containing an undeclared field `{"isSuperAdmin": true}` -> Rejected by `hasOnly()`.
2. **Identity Spoofing on Create**: Booking creation with `ownerId: "victim-uid"` when authenticated as `"attacker-uid"` -> Rejected by `data.ownerId == request.auth.uid`.
3. **Unverified Email Admin Spoof**: Request with `email: "mr.aljefre@gmail.com"` but `email_verified: false` -> Rejected by `request.auth.token.email_verified == true`.
4. **Timestamp Forgery**: Booking create/update with client-supplied past/future `createdAt` or `updatedAt` != `request.time` -> Rejected by `request.time` equality check.
5. **Immutable Owner Mutation**: Update attempting to change `ownerId` or `createdAt` on an existing booking -> Rejected by immutability gate and `affectedKeys().hasOnly(...)`.
6. **Terminal State Re-opening**: Non-admin user attempting to update a booking whose existing `status` is `'completed'` or `'cancelled'` -> Rejected by terminal state lock.
7. **ID Poisoning Attack**: Creating a booking or room with a 500-character or special-character document ID (`bookingId`) -> Rejected by `isValidId()`.
8. **Value Poisoning (Oversized String)**: Updating `title` with a 5,000-character string -> Rejected by `isValidBooking(incoming())` (`title.size() <= 200`).
9. **Unauthorized Room Mutation**: Standard signed-in user attempting to update `/rooms/room-dana` -> Rejected by `isAdmin()`.
10. **Unauthorized Department Creation**: Standard signed-in user attempting to create `/departments/dept-hack` -> Rejected by `isAdmin()`.
11. **Privilege Escalation via `/admins`**: User attempting to write their own UID into `/admins/{uid}` -> Rejected by `isAdmin()`.
12. **Blanket List Scraping on `/bookings`**: Signed-in user querying `/bookings` without filtering `ownerId == request.auth.uid` -> Rejected by `resource.data.ownerId == request.auth.uid || isAdmin()`.
