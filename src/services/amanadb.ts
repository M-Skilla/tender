import "server-only";

// The only module that imports @amanadb/sdk (CLAUDE.md rule 7). Server-only: the project
// credential and the SDK never reach a client bundle. Pattern follows ~/Desktop/crud.
import { createHash, createPrivateKey, createSign } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  AmanaDBClient,
  AmanaDBError,
  toCanonicalDerSignature,
  type StorageRecord,
  type Wallet,
  type WalletSigner,
} from "@amanadb/sdk";
import type {
  AuditedVersion,
  Award,
  Bid,
  BidReveal,
  DocumentCheck,
  Evaluation,
  StoredRecord,
  Tender,
} from "@/lib/types";

export const COLLECTIONS = {
  users: "users",
  tenders: "tenders",
  bids: "bids",
  bidReveals: "bid_reveals",
  evaluations: "evaluations",
  awards: "awards",
} as const;

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

function env(name: string): string | undefined {
  const value = process.env[name];
  return value && value.length > 0 ? value : undefined;
}

// .env files cannot hold real newlines, so a PEM stored there may be escaped as "\n".
function normalizePem(value: string): string {
  return value.replace(/\\n/g, "\n");
}

// node:crypto signer (there is no browser, so no createBrowserSigner). The private key is
// parsed on first use so building the wallet never throws on a malformed key.
function createNodeWallet(certificatePem: string, privateKeyPem: string): Wallet {
  let privateKey: ReturnType<typeof createPrivateKey> | undefined;
  const signer: WalletSigner = {
    async sign(message) {
      if (!privateKey) privateKey = createPrivateKey(privateKeyPem);
      const sign = createSign("SHA256");
      sign.update(message);
      sign.end();
      return toCanonicalDerSignature(new Uint8Array(sign.sign(privateKey)));
    },
  };
  return { certificatePem, signer };
}

let client: AmanaDBClient | undefined;

/** Built on first use, so importing this module (for example during a build) needs no env. */
function db(): AmanaDBClient {
  if (client) return client;
  const baseUrl = env("AMANADB_BASE_URL");
  const projectApiKey = env("AMANADB_PROJECT_API_KEY");
  const certificatePem = env("AMANADB_CERT_PEM");
  const privateKeyPem = env("AMANADB_KEY_PEM");
  if (!baseUrl || !projectApiKey || !certificatePem || !privateKeyPem) throw new NotConfiguredError();
  client = new AmanaDBClient({
    baseUrl,
    projectApiKey,
    wallet: createNodeWallet(normalizePem(certificatePem), normalizePem(privateKeyPem)),
  });
  return client;
}

function toStored<T>(record: StorageRecord<T>): StoredRecord<T> {
  return {
    collection: record.collection,
    key: record.key,
    version: record.version,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    data: record.data,
  };
}

const PAGE_SIZE = 100;

/**
 * Every live record in a collection that passes `keep`. The SDK has no query by field, so
 * this pages through the whole collection and filters here (GAPS.md: lookup by field).
 */
async function listWhere<T>(collection: string, keep: (data: T) => boolean): Promise<StoredRecord<T>[]> {
  const out: StoredRecord<T>[] = [];
  let bookmark = "";
  do {
    const page = await db().collection<T>(collection).list({ pageSize: PAGE_SIZE, bookmark });
    for (const record of page.records) if (!record.deleted && keep(record.data)) out.push(toStored(record));
    bookmark = page.fetchedRecordsCount > 0 ? page.bookmark : "";
  } while (bookmark);
  return out;
}

/** A record by key, or null when it does not exist or was soft-deleted. */
async function getOrNull<T>(collection: string, key: string): Promise<StoredRecord<T> | null> {
  try {
    const record = await db().collection<T>(collection).get(key);
    return record.deleted ? null : toStored(record);
  } catch (err) {
    if (err instanceof AmanaDBError && err.statusCode === 404) return null;
    throw err;
  }
}

export function getTender(key: string): Promise<StoredRecord<Tender> | null> {
  return getOrNull<Tender>(COLLECTIONS.tenders, key);
}

export function listBidsForTender(tenderId: string): Promise<StoredRecord<Bid>[]> {
  return listWhere<Bid>(COLLECTIONS.bids, (bid) => bid.tenderId === tenderId);
}

export function listRevealsForTender(tenderId: string): Promise<StoredRecord<BidReveal>[]> {
  return listWhere<BidReveal>(COLLECTIONS.bidReveals, (reveal) => reveal.tenderId === tenderId);
}

export function listEvaluationsForTender(tenderId: string): Promise<StoredRecord<Evaluation>[]> {
  return listWhere<Evaluation>(COLLECTIONS.evaluations, (evaluation) => evaluation.tenderId === tenderId);
}

export function listAwardsForTender(tenderId: string): Promise<StoredRecord<Award>[]> {
  return listWhere<Award>(COLLECTIONS.awards, (award) => award.tenderId === tenderId);
}

/**
 * The last audited write for each of `keys` in a collection. The SDK exposes only the
 * whole-collection audit log (the chaincode's per-record GetAuditLog is not in SDK 1.0.3), so
 * this scans the collection's log (GAPS.md: per-record audit). Never called for `users`.
 */
export async function auditedVersions(collection: string, keys: string[]): Promise<Map<string, AuditedVersion>> {
  if (collection === COLLECTIONS.users) throw new Error("The users collection is never read for audit views.");
  const wanted = new Set(keys);
  const out = new Map<string, AuditedVersion>();
  if (wanted.size === 0) return out;
  let bookmark = "";
  do {
    const page = await db().collection(collection).audit({ pageSize: PAGE_SIZE, bookmark });
    for (const entry of page.entries) {
      if (!wanted.has(entry.key)) continue;
      const seen = out.get(entry.key);
      if (!seen) {
        out.set(entry.key, {
          version: entry.resultingVersion,
          firstWriteAt: entry.timestamp,
          lastWriteAt: entry.timestamp,
          lastTxId: entry.txId,
        });
        continue;
      }
      if (entry.timestamp < seen.firstWriteAt) seen.firstWriteAt = entry.timestamp;
      if (entry.resultingVersion >= seen.version) {
        seen.version = entry.resultingVersion;
        seen.lastWriteAt = entry.timestamp;
        seen.lastTxId = entry.txId;
      }
    }
    bookmark = page.fetchedRecordsCount > 0 ? page.bookmark : "";
  } while (bookmark);
  return out;
}

const DOCUMENTS_DIR = path.join(process.cwd(), "storage", "documents");

/**
 * Re-hashes an off-chain document (storage/documents/<docHash>/<docName>) and compares it with
 * the SHA-256 recorded in AmanaDB. The file is plain disk storage, not a database.
 */
export async function checkDocument(docHash: string, docName: string): Promise<DocumentCheck> {
  const file = path.join(DOCUMENTS_DIR, docHash, path.basename(docName));
  try {
    const bytes = await readFile(file);
    const actual = createHash("sha256").update(bytes).digest("hex");
    return actual === docHash ? "matches" : "does-not-match";
  } catch {
    return "missing";
  }
}

/** Publishes a tender record. Returns its generated key. */
export async function insertTender(data: Tender): Promise<string> {
  const { id } = await db().collection<Tender>(COLLECTIONS.tenders).insert(data);
  return id;
}

/** Stores a sealed bid: only the commitment, never the amount or salt (spec section 5). */
export async function insertBid(data: Bid): Promise<string> {
  const { id } = await db().collection<Bid>(COLLECTIONS.bids).insert(data);
  return id;
}
