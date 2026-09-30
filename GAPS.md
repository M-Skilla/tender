# GAPS

Things AmanaDB (gateway, chaincode and `@amanadb/sdk` 1.0.3) could not do cleanly for Tender Tracker. Each entry says what the app does instead. None is worked around with a second data store.

## 1. No lookup by field

`collection.list()` pages through a whole collection; there is no query by a data field. "Bids for this tender" (and reveals, evaluations and awards) therefore lists the collection and filters on the server (`listWhere` in `src/services/amanadb.ts`). Acceptable for a demo; for real volumes it needs a field index or a query endpoint. Sign-in by email will hit the same gap; `upsert(customKey, …)` allows a caller-chosen key, which may cover users (to confirm in the sign-in task).

## 2. No per-record audit log in the SDK

The chaincode has `GetAuditLog(collection, key)` (owner-only), but SDK 1.0.3 exposes only the whole-collection `audit()`. To find a record's last audited write, the app scans the collection's audit log (`auditedVersions`). Cost grows with the collection's whole history.

## 3. No stored fingerprint and no old versions

A `StorageRecord` has `version`, `createdAt` and `updatedAt`, but no content hash, and there is no call to read an earlier version's data. Consequences:

- **Record fingerprint** is computed by the app: SHA-256 of canonical JSON of `{ collection, key, version, data }` (`recordFingerprint` in `src/lib/tender-case.ts`). It identifies the current content; it is not something AmanaDB stored and can be compared against.
- **Version diffs** (P3 history drawer, A1 changed fields) cannot be rebuilt from AmanaDB. To be decided when those screens are built: either AmanaDB gains a history read, or the app records the changed fields inside each new version's data.

### What "matches" means on the tender page

Because nothing stores a record hash, the spine's "Matches" is defined from what AmanaDB can answer:

1. A record matches when its current `version` equals the `resultingVersion` of its last audited write in the collection audit log.
2. A record that carries a document hash (`docHash`) also needs the file in `storage/documents/<docHash>/<docName>` to re-hash to it (the tamper demo).
3. Bid reveals (task 4) also need `verified` to be true: the reveal recomputes the sealed commitment.

Rule 1 can only fail if a record changes without an audited write, which the chaincode prevents; it is kept because it is the check AmanaDB makes possible. Rules 2 and 3 are the real tamper checks.

## 4. Soft-deleted records disappear from reads

`get` and `list` both hide soft-deleted records (`get` returns "does not exist", deliberately indistinguishable from never existed). Only the audit log keeps them. So:

- Cancelling a tender sets `status: CANCELLED` with an update (the record stays readable), rather than a delete.
- Withdrawn bids and deactivated users stay visible only as audit entries, with no data. The spec's "remain visible in audit history" holds; "remain visible" with their content does not.

## 5. One project credential, so no per-user identity in the ledger

Every write is made with the app's one project credential, so every audit entry has the same `actorId`. Per-user attribution is written into record data instead (`publishedBy`, `bidderId`, `evaluatorId`, `decidedBy`). This must be stated in the README.

## 6. No read restriction per collection

To confirm: whether a reader credential can be kept out of `users` while reading other collections. Until then the rule is enforced in app code only: the `users` collection is never returned by a public route and never read for audit views (`auditedVersions` refuses it).

## 7. Fields added to the spec's record shapes

Not AmanaDB gaps, but deviations from `docs/spec.md` section 3, recorded here so they are not mistaken for accidents:

| Collection | Field | Why |
|---|---|---|
| tenders | `reference` | The design shows references such as "TND-2026-0142"; record keys are auto-generated. |
| tenders | `docName` | Needed to find the stored file and re-hash it. |
| tenders | `publishedBy` | Per-user attribution (gap 5). |
| bids | `bidderName` | Public pages show bidder names without reading the sensitive `users` collection. |

## Tooling note

The package registry (`102.223.8.140:9000`) was unreachable while this was set up (`EHOSTUNREACH`). `@amanadb/sdk` 1.0.3 is installed from `vendor/amanadb-sdk-1.0.3.tgz`, packed from `packages/sdk` in the AmanaDB repository and byte-identical to the registry build. When the registry is back: `pnpm add @amanadb/sdk@^1.0.3` and delete `vendor/`.
