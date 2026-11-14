# Astra Vesper — Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants

1. **Identity Integrity**: Users may only create, read, or update `/users/{userId}` when `request.auth.uid == userId` and `request.auth.token.email_verified == true`.
2. **No Self-Assigned Roles**: On `/users/{userId}` creation, `role` MUST equal `'user'` and `status` MUST equal `'active'` (unless updated by a verified Super Administrator). Users cannot update `role`, `status`, or `uid`.
3. **Subcollection Master Gate**: Every subcollection under `/users/{userId}` (`activity`, `downloads`, `connectedApps`) verifies parent existence via `exists(/databases/$(database)/documents/users/$(userId))` and strict `userId == request.auth.uid` ownership.
4. **PII Isolation**: `/users/{userId}` and `/memberships/{membershipId}` NEVER permit blanket `isSignedIn()` reads or `list` scraping. Membership documents are keyed by sanitized email hash/id and readable only by owner or verified administrators.
5. **Admin Role Isolation**: Only verified Super Administrators (`mimoto3939@gmail.com` with verified email or `/admins/$(request.auth.uid)` with `role == 'super_admin'`) can assign, modify, or revoke `/admins/{userId}` documents.
6. **Public vs. Draft Products**: Public visitors can only `get` or `list` `/products/{productId}` where `published == true`. Unpublished/draft products are restricted to administrators with explicit permissions.
7. **Immutable Audit Trail**: `/auditLogs/{logId}` documents can only be created by verified administrators with `actorUid == request.auth.uid` and `createdAt == request.time`, and can NEVER be updated or deleted.
8. **Strict Schema & Bounds**: Every string validates `.size()` bounds, every array validates `.size() <= MAX`, and every document creation checks `keys().hasAll(...) && keys().hasOnly(...)`.

## 2. The "Dirty Dozen" Attack Payloads (All Must Yield PERMISSION_DENIED)

1. **Shadow Role Escalation on User Create**: `POST /users/attackerUid` with `{ uid: "attackerUid", role: "super_admin", ... }` -> Denied (`role != 'user'`).
2. **Ghost Field Injection on User Update**: `PATCH /users/userUid` adding `{ isAdmin: true, updatedAt: serverTimestamp() }` -> Denied (`affectedKeys().hasOnly(...)`).
3. **PII Read by Another Authenticated User**: `GET /users/victimUid` signed in as `attackerUid` -> Denied (`!isOwner && !isAdmin`).
4. **Email Spoofing Without Verification**: Write to `/users/uid` with `email_verified: false` -> Denied (`email_verified == true` required).
5. **Membership Email Scraping (`list`)**: `LIST /memberships` signed in as a normal user -> Denied (`!isAdmin`).
6. **Unauthorized Admin Assignment**: `SET /admins/attackerUid` signed in as `viewer` or `user` -> Denied (`!isSuperAdmin`).
7. **Unpublished Product Leak (`get`/`list`)**: `GET /products/secretDraft` where `published: false` as unauthenticated visitor -> Denied.
8. **Resource Exhaustion via Oversized ID**: `SET /products/<200-char-id>` -> Denied (`isValidId` `<= 128`).
9. **Resource Poisoning via Oversized Description**: `SET /products/validId` with 50KB `description` string -> Denied (`description.size() <= 2500`).
10. **Audit Log Tampering**: `UPDATE /auditLogs/log1` or `DELETE /auditLogs/log1` even by Super Admin -> Denied (`update, delete: if false`).
11. **Timestamp Forgery**: `CREATE /users/uid/activity/a1` with backdated `createdAt` -> Denied (`createdAt == request.time`).
12. **Orphaned Subcollection Write**: `CREATE /users/nonExistentUid/activity/a1` -> Denied (`exists(/users/nonExistentUid)` required).
