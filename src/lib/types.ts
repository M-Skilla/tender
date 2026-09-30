// Record shapes stored in AmanaDB (spec section 3), plus the fields the design needs.
// Additions to the spec are marked; see GAPS.md for why each exists.

export type UserRole = "pe_admin" | "evaluator" | "bidder" | "auditor";

/** App users (spec section 3). Never returned by a public route; passwordHash never leaves the server. */
export type User = {
  email: string;
  name: string;
  role: UserRole;
  passwordHash: string;
  active: boolean;
  createdAt: string;
};

export type TenderStatus = "DRAFT" | "PUBLISHED" | "CLOSED" | "AWARDED" | "CANCELLED";

export type Tender = {
  /** Added: public reference such as "TND-2026-0142". Record keys are auto-generated. */
  reference: string;
  title: string;
  description: string;
  entity: string;
  category: string;
  budgetCeiling: number;
  openDate: string;
  closeDate: string;
  status: TenderStatus;
  /** SHA-256 of the tender document stored off-chain in storage/documents/. */
  docHash?: string;
  /** Added: the document's file name, so the stored copy can be found and re-hashed. */
  docName?: string;
  /** Added: app user id of the procuring entity admin who published (per-user attribution). */
  publishedBy: string;
  /** Added: when the bids were opened (H3). Revealed amounts are shown only after this. */
  openedAt?: string;
  /** Added: app user id of the admin who opened the bids. */
  openedBy?: string;
};

export type Bid = {
  tenderId: string;
  bidderId: string;
  /** Added: public display name, so public pages never read the users collection. */
  bidderName: string;
  /** sha256(canonicalJson({ amount, docHash, salt })), computed in the browser. */
  commitment: string;
  submittedAt: string;
};

export type BidReveal = {
  bidId: string;
  tenderId: string;
  amount: number;
  docHash: string;
  salt: string;
  revealedAt: string;
  verified: boolean;
};

export type Evaluation = {
  tenderId: string;
  bidId: string;
  evaluatorId: string;
  criteria: { name: string; score: number; comment: string }[];
  total: number;
};

export type Award = {
  tenderId: string;
  winningBidId: string;
  justification: string;
  decidedBy: string;
  decidedAt: string;
};

/**
 * SDK result of re-hashing a record's data against the dataHash AmanaDB stored with it:
 * verified, mismatch, unhashed (written before chaincode 1.1) or unchecked (no Web Crypto).
 */
export type RecordIntegrity = "verified" | "mismatch" | "unhashed" | "unchecked";

/** A record as the app sees it: AmanaDB's envelope without ACL internals. */
export type StoredRecord<T> = {
  collection: string;
  key: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  data: T;
  /** SHA-256 of the stored data, recorded by AmanaDB on every write: the record's fingerprint. */
  dataHash: string;
  integrity: RecordIntegrity;
};

/** The last audited write for one record key (from its per-record audit trail). */
export type AuditedVersion = {
  version: number;
  dataHash: string;
  firstWriteAt: string;
  lastWriteAt: string;
  lastTxId: string;
};

/** Result of re-hashing an off-chain document against its recorded SHA-256. */
export type DocumentCheck = "matches" | "does-not-match" | "missing";
