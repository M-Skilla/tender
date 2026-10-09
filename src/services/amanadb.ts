import "server-only";

// The only module that imports @amanadb/sdk (CLAUDE.md rule 7), and every AmanaDB call the app
// makes. Server-only: the project credential and the SDK never reach a client bundle. Paging,
// mapping, configuration and key naming are in ./amanadb-helpers. Pattern follows ~/Desktop/crud.
import { AmanaDBClient, AmanaDBError, toCanonicalDerSignature, type EnsureIndexesResult } from "@amanadb/sdk";
import type { AuditedVersion, Award, Bid, BidReveal, Evaluation, StoredRecord, Tender, User } from "@/lib/types";
import {
  assertAuditable,
  awardKey,
  COLLECTIONS,
  evaluationKey,
  INDEXES,
  nodeSha256Signer,
  normalizeEmail,
  PAGE_SIZE,
  readAllPages,
  readCredentials,
  summarizeAudit,
  toAuditRow,
  toStored,
  VersionConflictError,
  type AuditRow,
} from "./amanadb-helpers";

export {
  awardKey,
  COLLECTIONS,
  evaluationKey,
  NotConfiguredError,
  VersionConflictError,
  type AuditRow,
} from "./amanadb-helpers";

// =============================================================================================
// Client

let client: AmanaDBClient | undefined;

/** Built on first use, so importing this module (for example during a build) needs no env. */
function db(): AmanaDBClient {
  if (client) return client;
  const { baseUrl, projectApiKey, certificatePem, privateKeyPem } = readCredentials();
  const sign = nodeSha256Signer(privateKeyPem);
  client = new AmanaDBClient({
    baseUrl,
    projectApiKey,
    wallet: {
      certificatePem,
      signer: { sign: async (message) => toCanonicalDerSignature(sign(message)) },
    },
  });
  return client;
}

function isStatus(err: unknown, statusCode: number): boolean {
  return err instanceof AmanaDBError && err.statusCode === statusCode;
}

let indexesReady: Promise<EnsureIndexesResult> | undefined;

/**
 * Makes sure every lookup index in INDEXES exists (SDK 1.3+ `ensureIndexes`): one read per
 * collection, a write only for a missing index. Shared by the whole process; a failure is
 * forgotten so the next call tries again. Returns the indexes this call created.
 */
export async function ensureIndexes(): Promise<EnsureIndexesResult["created"]> {
  const pending = (indexesReady ??= db().ensureIndexes(INDEXES).catch((err) => {
    indexesReady = undefined;
    throw err;
  }));
  return (await pending).created;
}

// =============================================================================================
// Read: get by key, list, find by indexed field

/** A record by key, or null when it does not exist or was soft-deleted. */
async function getOrNull<T>(collection: string, key: string): Promise<StoredRecord<T> | null> {
  try {
    const record = await db().collection<T>(collection).get(key);
    return record.deleted ? null : toStored(record);
  } catch (err) {
    if (isStatus(err, 404)) return null;
    throw err;
  }
}

/** Every live record in a collection whose indexed `field` equals `value`. Waits for the indexes. */
async function listByField<T>(collection: string, field: string, value: string): Promise<StoredRecord<T>[]> {
  await ensureIndexes();
  return readAllPages(
    (bookmark) => db().collection<T>(collection).findBy(field, value, { pageSize: PAGE_SIZE, bookmark }),
    (page) => page.records.map(toStored),
  );
}

/** Every live tender (the public list filters and sorts; AmanaDB has no query or sort here). */
export function listTenders(): Promise<StoredRecord<Tender>[]> {
  return readAllPages(
    (bookmark) => db().collection<Tender>(COLLECTIONS.tenders).list({ pageSize: PAGE_SIZE, bookmark }),
    (page) => page.records.filter((record) => !record.deleted).map(toStored),
  );
}

export function getUser(key: string): Promise<StoredRecord<User> | null> {
  return getOrNull<User>(COLLECTIONS.users, key);
}

/** A user by email (lower-cased), or null. Server-side only: the record holds the password hash. */
export async function findUserByEmail(email: string): Promise<StoredRecord<User> | null> {
  const [user] = await listByField<User>(COLLECTIONS.users, "email", normalizeEmail(email));
  return user ?? null;
}

export function getTender(key: string): Promise<StoredRecord<Tender> | null> {
  return getOrNull<Tender>(COLLECTIONS.tenders, key);
}

export async function findTenderByReference(reference: string): Promise<StoredRecord<Tender> | null> {
  const [tender] = await listByField<Tender>(COLLECTIONS.tenders, "reference", reference);
  return tender ?? null;
}

export function getBid(key: string): Promise<StoredRecord<Bid> | null> {
  return getOrNull<Bid>(COLLECTIONS.bids, key);
}

export function listBidsForTender(tenderId: string): Promise<StoredRecord<Bid>[]> {
  return listByField<Bid>(COLLECTIONS.bids, "tenderId", tenderId);
}

/** A bidder's live (not withdrawn) bids, through the `bidderId` index. */
export function listBidsForBidder(bidderId: string): Promise<StoredRecord<Bid>[]> {
  return listByField<Bid>(COLLECTIONS.bids, "bidderId", bidderId);
}

export function listRevealsForTender(tenderId: string): Promise<StoredRecord<BidReveal>[]> {
  return listByField<BidReveal>(COLLECTIONS.bidReveals, "tenderId", tenderId);
}

export function getEvaluation(key: string): Promise<StoredRecord<Evaluation> | null> {
  return getOrNull<Evaluation>(COLLECTIONS.evaluations, key);
}

export function listEvaluationsForTender(tenderId: string): Promise<StoredRecord<Evaluation>[]> {
  return listByField<Evaluation>(COLLECTIONS.evaluations, "tenderId", tenderId);
}

export function listAwardsForTender(tenderId: string): Promise<StoredRecord<Award>[]> {
  return listByField<Award>(COLLECTIONS.awards, "tenderId", tenderId);
}

// =============================================================================================
// Write: insert, update at a version, upsert under a fixed key, soft delete

export async function insertUser(data: User): Promise<string> {
  const { id } = await db().collection<User>(COLLECTIONS.users).insert({ ...data, email: normalizeEmail(data.email) });
  return id;
}

/** Publishes a tender record. Returns its generated key. */
export async function insertTender(data: Tender): Promise<string> {
  const { id } = await db().collection<Tender>(COLLECTIONS.tenders).insert(data);
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

/** Withdraws a bid by soft delete at its current version; its history stays (spec section 2). */
export async function withdrawBid(key: string, expectedVersion: number): Promise<void> {
  try {
    await db().collection<Bid>(COLLECTIONS.bids).delete(key, expectedVersion);
  } catch (err) {
    if (isStatus(err, 409)) throw new VersionConflictError();
    throw err;
  }
}

/** Stores a bidder's reveal with the result of recomputing its commitment. */
export async function insertReveal(data: BidReveal): Promise<string> {
  const { id } = await db().collection<BidReveal>(COLLECTIONS.bidReveals).insert(data);
  return id;
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
    if (isStatus(err, 409)) throw new VersionConflictError();
    throw err;
  }
}

/** Writes a tender's award (spec section 4, step 6). The caller then marks the tender AWARDED. */
export async function recordAward(data: Award): Promise<void> {
  await db().collection<Award>(COLLECTIONS.awards).upsert(awardKey(data.tenderId), data);
}

// =============================================================================================
// History and audit (never for `users`)

/** Every stored version of one record, by version number (AmanaDB history). */
export async function recordVersions<T>(collection: string, key: string): Promise<Map<number, StoredRecord<T>>> {
  assertAuditable(collection);
  const versions = await db().collection<T>(collection).history(key);
  return new Map(versions.map((v) => [v.record.version, toStored(v.record)]));
}

/** An earlier version of an evaluation, from AmanaDB's record history. */
export async function evaluationAtVersion(key: string, version: number): Promise<StoredRecord<Evaluation> | null> {
  const versions = await db().collection<Evaluation>(COLLECTIONS.evaluations).history(key);
  const match = versions.find((v) => v.record.version === version);
  return match ? toStored(match.record) : null;
}

/**
 * Every audit entry of one collection (readable by the app's credential from chaincode 1.2).
 * AmanaDB returns them oldest first with no time filter, so callers sort and filter
 * (GAPS.md: no reverse or time-range audit query).
 */
export function collectionAudit(collection: string): Promise<AuditRow[]> {
  assertAuditable(collection);
  return readAllPages(
    (bookmark) => db().collection(collection).audit({ pageSize: PAGE_SIZE, bookmark }),
    (page) => page.entries.map((entry) => toAuditRow(collection, entry)),
  );
}

/** One record's audit entries, oldest first (its per-record trail). */
export function recordAuditRows(collection: string, key: string): Promise<AuditRow[]> {
  assertAuditable(collection);
  return readAllPages(
    (bookmark) => db().collection(collection).recordAudit(key, { pageSize: PAGE_SIZE, bookmark }),
    (page) => page.entries.map((entry) => toAuditRow(collection, entry)),
  );
}

/** The last audited write for each of `keys`, from each record's own audit trail. */
export async function auditedVersions(collection: string, keys: string[]): Promise<Map<string, AuditedVersion>> {
  const out = new Map<string, AuditedVersion>();
  await Promise.all(
    keys.map(async (key) => {
      const summary = summarizeAudit(await recordAuditRows(collection, key));
      if (summary) out.set(key, summary);
    }),
  );
  return out;
}
