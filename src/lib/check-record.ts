import "server-only";

// P5 check a record: finds what a fingerprint (SHA-256) was recorded as. Every version of every
// record is in its collection's audit log with its dataHash; documents and sealed bids are
// fingerprints stored inside records (tender docHash, reveal docHash, bid commitment).
import type { VerificationResult } from "@/components/VerificationMark/VerificationMark";
import { describeAuditRows } from "@/lib/audit-log";
import { checkStoredDocument } from "@/lib/documents";
import { formatDateTime } from "@/lib/format";
import { auditResult } from "@/lib/tender-case";
import type { DocumentCheck, StoredRecord, Tender } from "@/lib/types";
import {
  auditedVersions,
  collectionAudit,
  COLLECTIONS,
  getUser,
  listBidsForTender,
  listRevealsForTender,
  listTenders,
  recordVersions,
  type AuditRow,
} from "@/services/amanadb";

const SEARCHED = [COLLECTIONS.tenders, COLLECTIONS.bids, COLLECTIONS.bidReveals, COLLECTIONS.evaluations, COLLECTIONS.awards];

const KIND: Record<string, string> = {
  [COLLECTIONS.tenders]: "tender record",
  [COLLECTIONS.bids]: "sealed bid record",
  [COLLECTIONS.bidReveals]: "bid reveal record",
  [COLLECTIONS.evaluations]: "evaluation record",
  [COLLECTIONS.awards]: "award record",
};

export type CheckResult =
  | { kind: "invalid"; input: string }
  | { kind: "none"; fingerprint: string }
  | {
      kind: "found";
      fingerprint: string;
      title: string;
      sentence: string;
      tender: { key: string; reference: string; entity: string };
      details: { label: string; value: string }[];
      /** The record as it stands now (records only), re-checked against its audit trail. */
      current?: VerificationResult;
      /** The procuring entity's stored copy (documents only). */
      storedCopy?: DocumentCheck;
    };

export function normaliseFingerprint(input: string): string | null {
  const value = input.trim().toLowerCase();
  return /^[0-9a-f]{64}$/.test(value) ? value : null;
}

export async function checkFingerprint(input: string): Promise<CheckResult> {
  const fingerprint = normaliseFingerprint(input);
  if (!fingerprint) return { kind: "invalid", input };
  const tenders = await listTenders();
  const tenderOf = (key: string) => tenders.find((t) => t.key === key);
  const about = (t: StoredRecord<Tender>) => ({ key: t.key, reference: t.data.reference, entity: t.data.entity });

  // 1. A version of a record: the latest audit entry with this dataHash.
  const audit = (await Promise.all(SEARCHED.map((c) => collectionAudit(c)))).flat();
  const hits = audit.filter((r) => r.dataHash === fingerprint && r.action !== "DELETE");
  if (hits.length > 0) {
    const row = hits.sort((a, b) => b.version - a.version)[0]!;
    return describeRecordVersion(fingerprint, row, audit, tenderOf, about);
  }

  // 2. A document or sealed bid fingerprint held inside a record.
  for (const t of tenders) {
    if (t.data.docHash === fingerprint) {
      const publisher = (await getUser(t.data.publishedBy))?.data.name ?? "the procuring entity";
      return {
        kind: "found",
        fingerprint,
        title: "Fingerprint matches a tender document",
        sentence: `It is the notice document of ${t.data.reference}, recorded when ${publisher} published the tender on ${formatDateTime(t.createdAt)}.`,
        tender: about(t),
        details: [{ label: "Document", value: t.data.docName ?? "Tender notice" }],
        storedCopy: await checkStoredDocument(fingerprint),
      };
    }
  }
  for (const t of tenders) {
    const [bids, reveals] = await Promise.all([listBidsForTender(t.key), listRevealsForTender(t.key)]);
    const sealed = bids.find((b) => b.data.commitment === fingerprint);
    if (sealed) {
      return {
        kind: "found",
        fingerprint,
        title: "Fingerprint matches a sealed bid",
        sentence: `It is the bid ${sealed.data.bidderName} sealed for ${t.data.reference} on ${formatDateTime(sealed.data.submittedAt)}. ${
          t.data.openedAt ? `The bids were opened on ${formatDateTime(t.data.openedAt)}.` : "The amount stays hidden until the bids are opened."
        }`,
        tender: about(t),
        details: [{ label: "Bidder", value: sealed.data.bidderName }],
      };
    }
    const document = reveals.find((r) => r.data.docHash === fingerprint);
    if (document) {
      const bidder = bids.find((b) => b.key === document.data.bidId)?.data.bidderName ?? "A bidder";
      return {
        kind: "found",
        fingerprint,
        title: "Fingerprint matches a bid document",
        sentence: `It is the document ${bidder} revealed for ${t.data.reference} on ${formatDateTime(document.data.revealedAt)}.`,
        tender: about(t),
        details: [{ label: "Bidder", value: bidder }],
        storedCopy: await checkStoredDocument(fingerprint),
      };
    }
  }
  return { kind: "none", fingerprint };
}

async function describeRecordVersion(
  fingerprint: string,
  row: AuditRow,
  audit: AuditRow[],
  tenderOf: (key: string) => StoredRecord<Tender> | undefined,
  about: (t: StoredRecord<Tender>) => { key: string; reference: string; entity: string },
): Promise<CheckResult> {
  const [described] = await describeAuditRows([row]);
  const sameRecord = audit.filter((r) => r.collection === row.collection && r.key === row.key);
  const latest = sameRecord.reduce((max, r) => (r.version > max.version ? r : max), row);
  const versions = await recordVersions<{ tenderId?: string }>(row.collection, row.key);
  const data = versions.get(row.version)?.data;
  const tender = tenderOf(row.collection === COLLECTIONS.tenders ? row.key : (data?.tenderId ?? ""));

  // The record as it stands now: same rule as the case file (re-hash plus audit trail).
  let current: VerificationResult | undefined;
  const now = versions.get(latest.version);
  if (latest.action !== "DELETE" && now) {
    const audited = await auditedVersions(row.collection, [row.key]);
    current = auditResult(now, new Map([...audited].map(([k, v]) => [`${row.collection}/${k}`, v])));
  }

  const kind = KIND[row.collection] ?? "record";
  const where = tender ? ` for ${tender.data.reference}` : "";
  const state =
    latest.action === "DELETE"
      ? " The record was later withdrawn; its versions remain in the audit history."
      : latest.version === row.version
        ? " It is the record's current version."
        : ` The record has since changed; its current version is ${latest.version}.`;
  return {
    kind: "found",
    fingerprint,
    title: "Fingerprint matches a recorded version",
    sentence: `It is version ${row.version} of the ${kind}${where}, recorded on ${formatDateTime(row.timestamp)}.${state}`,
    tender: tender ? about(tender) : { key: "", reference: "Not linked to a tender", entity: "Not set" },
    details: [
      { label: "Recorded by", value: described?.actor ?? "System" },
      { label: "Action", value: described?.action ?? row.action },
    ],
    current,
  };
}
