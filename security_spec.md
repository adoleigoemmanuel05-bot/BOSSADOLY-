# BossAdoly CMS Firestore Security Specification

## 1. Data Invariants
1. **Admin-Only Mutations**: Only an authenticated, email-verified admin (`request.auth.token.email_verified == true && request.auth.token.email == 'adoleigoemmanuel05@gmail.com'`) may create, update, or delete any CMS document.
2. **Public Website Read Isolation**: Website visitors can read only non-PII CMS documents where `resource.data.isPublic == true`. No admin secrets or passwords are stored in public Firestore collections.
3. **Strict Path ID Hygiene**: Every document ID (`settingId`, `entryId`, `slotId`, `itemId`, `memberId`, `serviceId`, `tierId`, `faqId`, `sectionId`) must match `^[a-zA-Z0-9_-]{1,128}$`.
4. **Strict Payload Schema & Size Caps**: Every string has bounded `.size()`, every array has `size() <= 30` with element-0 string validation, and every document enforces `keys().hasAll(...) && keys().hasOnly(...)`.
5. **Server Timestamp Integrity**: `updatedAt` must equal `request.time` on every create and update. `ownerId` must equal `request.auth.uid` on create and remain immutable on update.

## 2. The "Dirty Dozen" Attack Payloads
1. Unauthenticated create on `/cms_settings/main`.
2. Spoofed email claim with `email_verified: false` attempting `/cms_text_entries/home__hero__title`.
3. Non-admin authenticated user attempting to update `/cms_team/adole-emmanuel`.
4. Shadow field injection (`extraAdminFlag: true`) in `/cms_services/ads`.
5. Oversized ID poisoning (`> 128` chars or `/` / `$` characters) on `/cms_custom_sections/{sectionId}`.
6. Spoofed client timestamp (`updatedAt: "2020-01-01"`) instead of `request.time`.
7. Owner hijacking (`ownerId` mutated during `update`).
8. Unbounded array (`bullets` > 30 items or non-string element) on `/cms_custom_sections/{id}`.
9. Denial-of-wallet oversized payload (`> 850000` bytes image or `> 20000` chars text).
10. Private collection read (`isPublic: false`) attempted via `list` without `where('isPublic', '==', true)`.
11. Cross-collection path traversal or unknown field update outside `affectedKeys().hasOnly(...)`.
12. Creating `/test/connection` from a client to pollute connection check path.
