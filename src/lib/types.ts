// Record shapes stored in AmanaDB (spec section 3), plus the fields the design needs.
// Additions to the spec are marked; see GAPS.md for why each exists.

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

/** A record as the app sees it: AmanaDB's envelope without ACL internals. */
export type StoredRecord<T> = {
  collection: string;
  key: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  data: T;
};

/** The last audited write for one record key. */
export type AuditedVersion = {
  version: number;
  firstWriteAt: string;
  lastWriteAt: string;
  lastTxId: string;
};

/** Result of re-hashing an off-chain document against its recorded SHA-256. */
export type DocumentCheck = "matches" | "does-not-match" | "missing";
