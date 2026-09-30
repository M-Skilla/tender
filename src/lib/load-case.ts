import "server-only";

// Reads everything the case file needs through the AmanaDB service and builds it. Shared by the
// public case file (P2) and bid opening (H3).
import { buildTenderCase, type TenderCase } from "@/lib/tender-case";
import type { AuditedVersion } from "@/lib/types";
import {
  auditedVersions,
  checkDocument,
  checkStoredDocument,
  COLLECTIONS,
  getTender,
  listAwardsForTender,
  listBidsForTender,
  listEvaluationsForTender,
  listRevealsForTender,
} from "@/services/amanadb";

export async function loadCase(key: string, now = new Date()): Promise<TenderCase | null> {
  const tender = await getTender(key);
  if (!tender) return null;

  const [bids, reveals, evaluations, awards] = await Promise.all([
    listBidsForTender(key),
    listRevealsForTender(key),
    listEvaluationsForTender(key),
    listAwardsForTender(key),
  ]);

  const [tenderAudit, bidAudit, revealAudit, evaluationAudit, awardAudit, documentCheck] = await Promise.all([
    auditedVersions(COLLECTIONS.tenders, [tender.key]),
    auditedVersions(COLLECTIONS.bids, bids.map((r) => r.key)),
    auditedVersions(COLLECTIONS.bidReveals, reveals.map((r) => r.key)),
    auditedVersions(COLLECTIONS.evaluations, evaluations.map((r) => r.key)),
    auditedVersions(COLLECTIONS.awards, awards.map((r) => r.key)),
    tender.data.docHash && tender.data.docName ? checkDocument(tender.data.docHash, tender.data.docName) : null,
  ]);

  const audited = new Map<string, AuditedVersion>();
  const add = (collection: string, map: Map<string, AuditedVersion>) =>
    map.forEach((value, recordKey) => audited.set(`${collection}/${recordKey}`, value));
  add(COLLECTIONS.tenders, tenderAudit);
  add(COLLECTIONS.bids, bidAudit);
  add(COLLECTIONS.bidReveals, revealAudit);
  add(COLLECTIONS.evaluations, evaluationAudit);
  add(COLLECTIONS.awards, awardAudit);

  // After opening, each revealed bid document is re-hashed from disk (A2's tamper check).
  const bidDocumentChecks = new Map<string, import("@/lib/types").DocumentCheck>();
  if (tender.data.openedAt) {
    await Promise.all(
      reveals.map(async (r) => bidDocumentChecks.set(r.data.docHash, await checkStoredDocument(r.data.docHash))),
    );
  }

  return buildTenderCase({ tender, bids, reveals, evaluations, awards, audited, documentCheck, bidDocumentChecks, now });
}

