import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TenderDetailView } from "@/components/TenderDetail/TenderDetailView";
import { buildTenderCase, type EventId } from "@/lib/tender-case";
import {
  auditedVersions,
  checkDocument,
  COLLECTIONS,
  getTender,
  listAwardsForTender,
  listBidsForTender,
  listEvaluationsForTender,
  listRevealsForTender,
} from "@/services/amanadb";

// Shows verification and bid state, so it is never cached (CLAUDE.md, spec section 6).
export const dynamic = "force-dynamic";

const EVENTS: EventId[] = ["published", "bids"];

async function loadCase(key: string) {
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

  const audited = new Map<string, import("@/lib/types").AuditedVersion>();
  const add = (collection: string, map: Map<string, import("@/lib/types").AuditedVersion>) =>
    map.forEach((value, recordKey) => audited.set(`${collection}/${recordKey}`, value));
  add(COLLECTIONS.tenders, tenderAudit);
  add(COLLECTIONS.bids, bidAudit);
  add(COLLECTIONS.bidReveals, revealAudit);
  add(COLLECTIONS.evaluations, evaluationAudit);
  add(COLLECTIONS.awards, awardAudit);

  return buildTenderCase({ tender, bids, reveals, evaluations, awards, audited, documentCheck, now: new Date() });
}

export async function generateMetadata(props: PageProps<"/tenders/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const tender = await getTender(id).catch(() => null);
  return { title: tender ? `${tender.data.title}, ${tender.data.reference}` : "Tender" };
}

export default async function TenderPage(props: PageProps<"/tenders/[id]">) {
  const { id } = await props.params;
  const { event } = await props.searchParams;

  const tenderCase = await loadCase(id);
  if (!tenderCase) notFound();

  // Default to the current event (P2 opens on "Bids received"); fall back to Published.
  const requested = typeof event === "string" && (EVENTS as string[]).includes(event) ? (event as EventId) : null;
  const current = tenderCase.events.find((e) => e.state === "current" || e.state === "mismatch");
  const fallback: EventId = current && EVENTS.includes(current.id) ? current.id : "published";

  return <TenderDetailView tenderCase={tenderCase} selected={requested ?? fallback} />;
}
