import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/NavigationBar/SiteHeader";
import { TenderDetailView } from "@/components/TenderDetail/TenderDetailView";
import { loadCase } from "@/lib/load-case";
import type { EventId } from "@/lib/tender-case";
import { getTender } from "@/services/amanadb";

// Shows verification and bid state, so it is never cached (CLAUDE.md, spec section 6).
export const dynamic = "force-dynamic";

const EVENTS: EventId[] = ["published", "bids"];

export async function generateMetadata(props: PageProps<"/tenders/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const tender = await getTender(id).catch(() => null);
  return { title: tender ? `${tender.data.title}, ${tender.data.reference}` : "Tender" };
}

export default async function TenderPage(props: PageProps<"/tenders/[id]">) {
  const { id } = await props.params;
  const { event, published } = await props.searchParams;

  const tenderCase = await loadCase(id);
  if (!tenderCase) notFound();

  // Default to the current event (P2 opens on "Bids received"); fall back to Published.
  const requested = typeof event === "string" && (EVENTS as string[]).includes(event) ? (event as EventId) : null;
  const current = tenderCase.events.find((e) => e.state === "current" || e.state === "mismatch");
  const fallback: EventId = current && EVENTS.includes(current.id) ? current.id : "published";

  return <TenderDetailView tenderCase={tenderCase} selected={requested ?? fallback} header={<SiteHeader active="tenders" />} toast={published === "1" ? "Tender published" : undefined} />;
}
