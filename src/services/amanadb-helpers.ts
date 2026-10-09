import "server-only";

// Plumbing behind src/services/amanadb.ts: configuration, signing, paging, record mapping and
// key naming. Nothing here imports @amanadb/sdk (CLAUDE.md rule 7); the SDK calls themselves
// live in amanadb.ts so that file reads as the app's whole use of AmanaDB.
import { createPrivateKey, createSign } from "node:crypto";
import type { AuditedVersion, RecordIntegrity, StoredRecord } from "@/lib/types";

export const COLLECTIONS = {
  users: "users",
  tenders: "tenders",
  bids: "bids",
  bidReveals: "bid_reveals",
  evaluations: "evaluations",
  awards: "awards",
} as const;

export const PAGE_SIZE = 100;

/**
 * Every lookup field the app queries by, per collection (the SDK's `ensureIndexes` spec). An index
 * cannot be removed in AmanaDB, so review any change here.
 */
export const INDEXES: Record<string, readonly string[]> = {
  [COLLECTIONS.bids]: ["tenderId", "bidderId"],
  [COLLECTIONS.bidReveals]: ["tenderId"],
  [COLLECTIONS.evaluations]: ["tenderId"],
  [COLLECTIONS.awards]: ["tenderId"],
  [COLLECTIONS.users]: ["email"],
  [COLLECTIONS.tenders]: ["reference"],
};

// ---------------------------------------------------------------------------------------------
// Errors

/** Someone saved a newer version first; the caller's expectedVersion is stale (AmanaDB 409). */
export class VersionConflictError extends Error {
  constructor() {
    super("A newer version was saved first.");
    this.name = "VersionConflictError";
  }
}

/** Thrown when the app has no AmanaDB credential configured. */
export class NotConfiguredError extends Error {
  constructor() {
    super(
      "AmanaDB is not configured. Provision a wallet with `amanadb wallet-init --token <token>`, " +
        "then run the app through `sops exec-env .amanadb-wallet.enc.json -- <start command>`.",
    );
    this.name = "NotConfiguredError";
  }
}

// ---------------------------------------------------------------------------------------------
// Configuration and signing

function env(name: string): string | undefined {
  const value = process.env[name];
  return value && value.length > 0 ? value : undefined;
}

// .env files cannot hold real newlines, so a PEM stored there may be escaped as "\n".
function normalizePem(value: string): string {
  return value.replace(/\\n/g, "\n");
}

/** The project credential from the environment, or NotConfiguredError when any part is missing. */
export function readCredentials(): { baseUrl: string; projectApiKey: string; certificatePem: string; privateKeyPem: string } {
  const baseUrl = env("AMANADB_BASE_URL");
  const projectApiKey = env("AMANADB_PROJECT_API_KEY");
  const certificatePem = env("AMANADB_CERT_PEM");
  const privateKeyPem = env("AMANADB_KEY_PEM");
  if (!baseUrl || !projectApiKey || !certificatePem || !privateKeyPem) throw new NotConfiguredError();
  return { baseUrl, projectApiKey, certificatePem: normalizePem(certificatePem), privateKeyPem: normalizePem(privateKeyPem) };
}

/**
 * A SHA-256 ECDSA signing function over node:crypto (there is no browser, so no
 * createBrowserSigner). Returns raw DER; the caller canonicalises it with the SDK. The key is
 * parsed on first use so building the wallet never throws on a malformed key.
 */
export function nodeSha256Signer(privateKeyPem: string): (message: Uint8Array) => Uint8Array {
  let privateKey: ReturnType<typeof createPrivateKey> | undefined;
  return (message) => {
    if (!privateKey) privateKey = createPrivateKey(privateKeyPem);
    const sign = createSign("SHA256");
    sign.update(message);
    sign.end();
    return new Uint8Array(sign.sign(privateKey));
  };
}

// ---------------------------------------------------------------------------------------------
// Paging and mapping

type Page = { bookmark: string; fetchedRecordsCount: number };

/** Follows AmanaDB bookmarks until the last page and returns every item, in order. */
export async function readAllPages<P extends Page, R>(
  fetchPage: (bookmark: string) => Promise<P>,
  items: (page: P) => R[],
): Promise<R[]> {
  const out: R[] = [];
  let bookmark = "";
  do {
    const page = await fetchPage(bookmark);
    out.push(...items(page));
    bookmark = page.fetchedRecordsCount > 0 ? page.bookmark : "";
  } while (bookmark);
  return out;
}

/** The shape of an SDK storage record that the app keeps. */
type SdkRecord<T> = Omit<StoredRecord<T>, "dataHash" | "integrity"> & {
  dataHash?: string | null;
  integrity: RecordIntegrity;
};

export function toStored<T>(record: SdkRecord<T>): StoredRecord<T> {
  return {
    collection: record.collection,
    key: record.key,
    version: record.version,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    data: record.data,
    dataHash: record.dataHash ?? "",
    integrity: record.integrity,
  };
}

/** One entry of a collection's audit log, as the audit views use it. */
export type AuditRow = {
  collection: string;
  key: string;
  action: string;
  version: number;
  timestamp: string;
  txId: string;
  dataHash: string;
};

type SdkAuditEntry = { key: string; action: string; resultingVersion: number; timestamp: string; txId: string; dataHash?: string | null };

export function toAuditRow(collection: string, entry: SdkAuditEntry): AuditRow {
  return {
    collection,
    key: entry.key,
    action: entry.action,
    version: entry.resultingVersion,
    timestamp: entry.timestamp,
    txId: entry.txId,
    dataHash: entry.dataHash ?? "",
  };
}

/** The first write time and the last audited write of one record, from its audit rows. */
export function summarizeAudit(rows: AuditRow[]): AuditedVersion | undefined {
  let first: string | undefined;
  let last: AuditRow | undefined;
  for (const row of rows) {
    if (!first || row.timestamp < first) first = row.timestamp;
    if (!last || row.version >= last.version) last = row;
  }
  if (!first || !last) return undefined;
  return { version: last.version, dataHash: last.dataHash, firstWriteAt: first, lastWriteAt: last.timestamp, lastTxId: last.txId };
}

/** The users collection holds password hashes, so audit and history views never read it. */
export function assertAuditable(collection: string): void {
  if (collection === COLLECTIONS.users) throw new Error("The users collection is never read for audit views.");
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// ---------------------------------------------------------------------------------------------
// Fixed record keys

/** One award per tender, under a fixed key: a second award shows as a new version, never a second record. */
export function awardKey(tenderKey: string): string {
  return `award-${tenderKey}`;
}

/** One shared evaluation per bid, under a fixed key so every committee member edits the same record. */
export function evaluationKey(bidKey: string): string {
  return `eval-${bidKey}`;
}
