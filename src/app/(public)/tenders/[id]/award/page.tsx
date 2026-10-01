import { notFound } from "next/navigation";
import { AwardRecordView } from "@/components/AwardRecord/AwardRecordView";
import { SiteHeader } from "@/components/NavigationBar/SiteHeader";
import { formatDateTime, formatTzs } from "@/lib/format";
import { auditResult } from "@/lib/tender-case";
import { auditedVersions, COLLECTIONS, getBid, getTender, listAwardsForTender, listRevealsForTender } from "@/services/amanadb";

// Re-checks the award against AmanaDB on every load: never cached.
export const dynamic = "force-dynamic";
export const metadata = { title: "Award record" };

// P4 award record: public.
export default async function AwardRecordPage(props: PageProps<"/tenders/[id]/award">) {
  const { id } = await props.params;
  const { recorded } = await props.searchParams;
  const [tender, awards] = await Promise.all([getTender(id), listAwardsForTender(id)]);
  const award = awards[0];
  if (!tender || !award) notFound();
  const [bid, reveals, audited] = await Promise.all([
    getBid(award.data.winningBidId),
    listRevealsForTender(id),
    auditedVersions(COLLECTIONS.awards, [award.key]),
  ]);
  const reveal = reveals.find((r) => r.data.bidId === award.data.winningBidId);
  // auditResult looks entries up by "collection/key", as the case file builds them.
  const auditedByPath = new Map([...audited].map(([key, entry]) => [`${COLLECTIONS.awards}/${key}`, entry]));

  return (
    <AwardRecordView
      header={<SiteHeader active="awards" />}
      toast={recorded === "1" ? "Award recorded" : undefined}
      award={{
        tenderKey: tender.key,
        reference: tender.data.reference,
        title: tender.data.title,
        winner: bid?.data.bidderName ?? "Bid no longer available",
        amount: reveal ? formatTzs(reveal.data.amount) : "Not revealed",
        decidedBy: `Procuring entity, ${tender.data.entity}`,
        decidedAt: formatDateTime(award.data.decidedAt),
        result: auditResult(award, auditedByPath),
        fingerprint: award.dataHash,
        justification: award.data.justification,
      }}
    />
  );
}
