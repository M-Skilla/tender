# GAPS

Things AmanaDB could not do cleanly for Tender Tracker, and what the app does about each. None is worked around with a second data store.

## Resolved in AmanaDB 1.1 (chaincode 1.1, `@amanadb/sdk` 1.1.0)

The first build of this app hit five gaps in chaincode 1.0 and SDK 1.0.3. They were fixed in AmanaDB itself (branch `feat/record-integrity` in the AmanaDB repository) and the app now uses the fixes:

| Gap in 1.0 | Fix in 1.1 | Used by the app |
|---|---|---|
| No lookup by field: "bids for this tender" meant listing the whole collection | `defineIndex(field)` and `findBy(field, value)`, maintained by the chaincode | `listByField` in `src/services/amanadb.ts`; indexes on `tenderId` are declared by `pnpm setup` and `pnpm seed` |
| No per-record audit log in the SDK, and the collection audit log is owner-only, so a project credential could not read audit data at all | `recordAudit(id)`, readable at the reader role | `auditedVersions` reads each record's own trail |
| No stored fingerprint: records had no content hash | `dataHash` (SHA-256 of the stored data) on every record and audit entry; the SDK re-hashes on read and reports `integrity` | Record fingerprints on the spine are AmanaDB's `dataHash` |
| No way to read earlier versions | `history(id)` from the ledger's history database | A1's changed fields and actors; C3's "version you started from" |
| The collection audit log was owner-only, so a project credential could not list a collection's history (chaincode 1.2, SDK 1.1.1) | `GetCollectionAuditLog` at the reader role | A1 reads each collection's log |

### What "matches" means on the tender page

A record matches when all of these hold:

1. Its data re-hashes to the `dataHash` AmanaDB stored with it (SDK `integrity` is `verified`).
2. Its last audited write has the same version and the same `dataHash`.
3. A document it points to (`docHash`) still re-hashes from `storage/documents/<docHash>/<docName>` (the tamper demo).
4. A bid reveal (task 4) recomputes to its sealed commitment (`verified` is true).

## Open

### 1. No reverse or time-range audit query

`audit()` returns a collection's entries oldest first and cannot filter by time. A1 shows newest first with date filters, so it reads each selected collection's whole log, then sorts, filters and pages in the app (`src/lib/audit-log.ts`). Fine for a demo; a large log needs a newest-first or time-range query in AmanaDB. (The collection log itself was owner-only until chaincode 1.2, which lets readers read it; see the table above.)

### 2. Soft-deleted records disappear from reads

`get`, `list` and `findBy` hide soft-deleted records. Their audit trail (`recordAudit`) and their versions (`history`) remain readable, so "remains visible in audit history" holds. Cancelling a tender is still an update to `status: CANCELLED`, so the tender stays readable.

### 3. One project credential, so no per-user identity in the ledger

Every write is made with the app's one project credential, so every audit entry has the same actor. Per-user attribution is written into record data instead (`publishedBy`, `openedBy`, `bidderName`, `evaluatorName`, `decidedBy`), and A1 reads the person from the record's data at each version (through `history`). This must be stated in the README.

### 4. No read restriction per collection

To confirm: whether a credential can be kept out of `users` while reading other collections. Until then the rule is enforced in app code only: the `users` collection is never returned by a public route and never read for audit views (`auditedVersions` refuses it).

### 5. No delayed visibility for reveals

Bidders submit their reveal data after the closing time (B5), and the procuring entity opens the bids later (H3). Between the two, the reveals are stored in `bid_reveals`, which any credential of the project can read. AmanaDB cannot hold a record back until an event, so the app hides revealed amounts until the tender's `openedAt` is set; the rule lives in app code only (`BidOpeningView`, the case file). A time-lock or per-record read restriction in AmanaDB would make it enforceable.

### 6. Indexes must be declared before lookups

`findBy` rejects a field that was never declared with `defineIndex`. Declaring is a write, so it runs from `pnpm setup` (and `pnpm seed`), not on page loads. A fresh project needs `pnpm setup` once before the app can list bids.

## Fields added to the spec's record shapes

Not AmanaDB gaps, but deviations from `docs/spec.md` section 3, recorded so they are not mistaken for accidents:

| Collection | Field | Why |
|---|---|---|
| tenders | `reference` | The design shows references such as "TND-2026-0142"; record keys are auto-generated. |
| tenders | `docName` | Needed to find the stored file and re-hash it. |
| tenders | `publishedBy` | Per-user attribution (open item 3). |
| bids | `bidderName` | Public pages show bidder names without reading the sensitive `users` collection. |
| evaluations | `evaluatorName`, `comment`, criterion `weight`, nullable `score` | C2 and C3 show who saved a version and compare an overall comment; weights keep each version self-describing; a criterion can be unscored. |
| tenders | `openedAt`, `openedBy` | When the bids were opened (H3) and by whom; amounts are shown only after `openedAt`. |
