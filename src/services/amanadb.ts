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
  User,
} from "@/lib/types";

export const COLLECTIONS = {
  users: "users",
  tenders: "tenders",
  bids: "bids",
  bidReveals: "bid_reveals",
  evaluations: "evaluations",
  awards: "awards",
} as const;

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
    dataHash: record.dataHash ?? "",
    integrity: record.integrity,
  };
}

const PAGE_SIZE = 100;

/** Every lookup field the app queries by (AmanaDB field indexes, declared by `defineIndexes`). */
const INDEXES: [string, string][] = [
  [COLLECTIONS.bids, "tenderId"],
  [COLLECTIONS.bidReveals, "tenderId"],
  [COLLECTIONS.evaluations, "tenderId"],
  [COLLECTIONS.awards, "tenderId"],
  [COLLECTIONS.users, "email"],
  [COLLECTIONS.tenders, "reference"],
];

/**
 * Declares the lookup fields the app queries by. A write, so it runs from setup and the seed
 * script, never on page loads. Idempotent.
 */
export async function defineIndexes(): Promise<void> {
  for (const [collection, field] of INDEXES) await db().collection(collection).defineIndex(field);
}

/** Every live record in a collection whose indexed `field` equals `value`. */
async function listByField<T>(collection: string, field: string, value: string): Promise<StoredRecord<T>[]> {
  const out: StoredRecord<T>[] = [];
  let bookmark = "";
  do {
    const page = await db().collection<T>(collection).findBy(field, value, { pageSize: PAGE_SIZE, bookmark });
    for (const record of page.records) out.push(toStored(record));
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

/** A user by email (lower-cased), or null. Server-side only: the record holds the password hash. */
export async function findUserByEmail(email: string): Promise<StoredRecord<User> | null> {
  const [user] = await listByField<User>(COLLECTIONS.users, "email", email.trim().toLowerCase());
  return user ?? null;
}

export function getUser(key: string): Promise<StoredRecord<User> | null> {
  return getOrNull<User>(COLLECTIONS.users, key);
}

export async function insertUser(data: User): Promise<string> {
  const { id } = await db().collection<User>(COLLECTIONS.users).insert({ ...data, email: data.email.trim().toLowerCase() });
  return id;
}

export async function findTenderByReference(reference: string): Promise<StoredRecord<Tender> | null> {
  const [tender] = await listByField<Tender>(COLLECTIONS.tenders, "reference", reference);
  return tender ?? null;
}

export function getTender(key: string): Promise<StoredRecord<Tender> | null> {
  return getOrNull<Tender>(COLLECTIONS.tenders, key);
}

export function listBidsForTender(tenderId: string): Promise<StoredRecord<Bid>[]> {
  return listByField<Bid>(COLLECTIONS.bids, "tenderId", tenderId);
}

export function listRevealsForTender(tenderId: string): Promise<StoredRecord<BidReveal>[]> {
  return listByField<BidReveal>(COLLECTIONS.bidReveals, "tenderId", tenderId);
}

export function listEvaluationsForTender(tenderId: string): Promise<StoredRecord<Evaluation>[]> {
  return listByField<Evaluation>(COLLECTIONS.evaluations, "tenderId", tenderId);
}

export function listAwardsForTender(tenderId: string): Promise<StoredRecord<Award>[]> {
  return listByField<Award>(COLLECTIONS.awards, "tenderId", tenderId);
}

/**
 * The last audited write for each of `keys`, from each record's own audit trail (readable with
 * the app's reader or writer credential). Never called for `users`.
 */
export async function auditedVersions(collection: string, keys: string[]): Promise<Map<string, AuditedVersion>> {
  if (collection === COLLECTIONS.users) throw new Error("The users collection is never read for audit views.");
  const out = new Map<string, AuditedVersion>();
  await Promise.all(
    keys.map(async (key) => {
      let bookmark = "";
      let first: string | undefined;
      let last: { version: number; dataHash: string; at: string; txId: string } | undefined;
      do {
        const page = await db().collection(collection).recordAudit(key, { pageSize: PAGE_SIZE, bookmark });
        for (const entry of page.entries) {
          if (!first || entry.timestamp < first) first = entry.timestamp;
          if (!last || entry.resultingVersion >= last.version) {
            last = { version: entry.resultingVersion, dataHash: entry.dataHash ?? "", at: entry.timestamp, txId: entry.txId };
          }
        }
        bookmark = page.fetchedRecordsCount > 0 ? page.bookmark : "";
      } while (bookmark);
      if (first && last) {
        out.set(key, { version: last.version, dataHash: last.dataHash, firstWriteAt: first, lastWriteAt: last.at, lastTxId: last.txId });
      }
    }),
  );
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

export function getBid(key: string): Promise<StoredRecord<Bid> | null> {
  return getOrNull<Bid>(COLLECTIONS.bids, key);
}

/** Stores a bidder's reveal with the result of recomputing its commitment. */
export async function insertReveal(data: BidReveal): Promise<string> {
  const { id } = await db().collection<BidReveal>(COLLECTIONS.bidReveals).insert(data);
  return id;
}

/** Updates a tender at its current version; a version conflict surfaces as an AmanaDBError (409). */
export async function updateTender(key: string, data: Tender, expectedVersion: number): Promise<void> {
  await db().collection<Tender>(COLLECTIONS.tenders).update(key, data, expectedVersion);
}

/** Stores a sealed bid: only the commitment, never the amount or salt (spec section 5). */
export async function insertBid(data: Bid): Promise<string> {
  const { id } = await db().collection<Bid>(COLLECTIONS.bids).insert(data);
  return id;
}

/** One shared evaluation per bid, under a fixed key so every committee member edits the same record. */
export function evaluationKey(bidKey: string): string {
  return `eval-${bidKey}`;
}

export function getEvaluation(key: string): Promise<StoredRecord<Evaluation> | null> {
  return getOrNull<Evaluation>(COLLECTIONS.evaluations, key);
}

/** The bid's evaluation, created empty (version 1) the first time anyone opens it. */
export async function ensureEvaluation(bidKey: string, empty: Evaluation): Promise<StoredRecord<Evaluation>> {
  const key = evaluationKey(bidKey);
  const existing = await getEvaluation(key);
  if (existing) return existing;
  await db().collection<Evaluation>(COLLECTIONS.evaluations).upsert(key, empty);
  const created = await getEvaluation(key);
  if (!created) throw new Error(`Evaluation ${key} could not be created.`);
  return created;
}

/**
 * Saves an evaluation at the version the editor started from. AmanaDB rejects a stale version
 * (409); that surfaces as VersionConflictError, never as a silent overwrite.
 */
export async function saveEvaluation(key: string, data: Evaluation, expectedVersion: number): Promise<void> {
  try {
    await db().collection<Evaluation>(COLLECTIONS.evaluations).update(key, data, expectedVersion);
  } catch (err) {
    if (err instanceof AmanaDBError && err.statusCode === 409) throw new VersionConflictError();
    throw err;
  }
}

/** An earlier version of an evaluation, from AmanaDB's record history. */
export async function evaluationAtVersion(key: string, version: number): Promise<StoredRecord<Evaluation> | null> {
  const versions = await db().collection<Evaluation>(COLLECTIONS.evaluations).history(key);
  const match = versions.find((v) => v.record.version === version);
  return match ? toStored(match.record) : null;
}
