# GAPS

Things AmanaDB could not do cleanly for Tender Tracker, and what the app does about each. None is worked around with a second data store.

## Resolved in AmanaDB 1.1 (chaincode 1.1, `@amanadb/sdk` 1.1.0)

The first build of this app hit four gaps in chaincode 1.0 and SDK 1.0.3. They were fixed in AmanaDB itself (branch `feat/record-integrity` in the AmanaDB repository) and the app now uses the fixes:

| Gap in 1.0 | Fix in 1.1 | Used by the app |
|---|---|---|
| No lookup by field: "bids for this tender" meant listing the whole collection | `defineIndex(field)` and `findBy(field, value)`, maintained by the chaincode | `listByField` in `src/services/amanadb.ts`; indexes on `tenderId` are declared by `pnpm setup` and `pnpm seed` |
| No per-record audit log in the SDK, and the collection audit log is owner-only, so a project credential could not read audit data at all | `recordAudit(id)`, readable at the reader role | `auditedVersions` reads each record's own trail |
| No stored fingerprint: records had no content hash | `dataHash` (SHA-256 of the stored data) on every record and audit entry; the SDK re-hashes on read and reports `integrity` | Record fingerprints on the spine are AmanaDB's `dataHash` |
| No way to read earlier versions | `history(id)` from the ledger's history database | For P3 and A1 version diffs (later tasks) |

### What "matches" means on the tender page

A record matches when all of these hold:

1. Its data re-hashes to the `dataHash` AmanaDB stored with it (SDK `integrity` is `verified`).
2. Its last audited write has the same version and the same `dataHash`.
3. A document it points to (`docHash`) still re-hashes from `storage/documents/<docHash>/<docName>` (the tamper demo).
4. A bid reveal (task 4) recomputes to its sealed commitment (`verified` is true).

## Open

### 1. The collection-wide audit log is owner-only

`GetCollectionAuditLog` requires the owner role, which a project credential can never hold. The A1 audit log screen lists a collection's history, so it cannot be built from the app's credential as things stand. To decide in task 4: read per-record trails for the records in view, or give readers a collection audit read in AmanaDB.

### 2. Soft-deleted records disappear from reads

`get`, `list` and `findBy` hide soft-deleted records. Their audit trail (`recordAudit`) and their versions (`history`) remain readable, so "remains visible in audit history" holds. Cancelling a tender is still an update to `status: CANCELLED`, so the tender stays readable.

### 3. One project credential, so no per-user identity in the ledger

Every write is made with the app's one project credential, so every audit entry has the same actor. Per-user attribution is written into record data instead (`publishedBy`, `bidderId`, `evaluatorId`, `decidedBy`). This must be stated in the README.

### 4. No read restriction per collection

To confirm: whether a credential can be kept out of `users` while reading other collections. Until then the rule is enforced in app code only: the `users` collection is never returned by a public route and never read for audit views (`auditedVersions` refuses it).

### 5. Indexes must be declared before lookups

`findBy` rejects a field that was never declared with `defineIndex`. Declaring is a write, so it runs from `pnpm setup` (and `pnpm seed`), not on page loads. A fresh project needs `pnpm setup` once before the app can list bids.

## Fields added to the spec's record shapes

Not AmanaDB gaps, but deviations from `docs/spec.md` section 3, recorded so they are not mistaken for accidents:

| Collection | Field | Why |
|---|---|---|
| tenders | `reference` | The design shows references such as "TND-2026-0142"; record keys are auto-generated. |
| tenders | `docName` | Needed to find the stored file and re-hash it. |
| tenders | `publishedBy` | Per-user attribution (open item 3). |
| bids | `bidderName` | Public pages show bidder names without reading the sensitive `users` collection. |
