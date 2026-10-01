import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/Button/Button";
import { CancelTender } from "@/components/CancelTender/CancelTender";
import { SiteHeader } from "@/components/NavigationBar/SiteHeader";
import { RecordHistoryDrawer } from "@/components/RecordHistory/RecordHistoryDrawer";
import { TenderDetailView } from "@/components/TenderDetail/TenderDetailView";
import { currentUser } from "@/lib/auth";
import { loadCase } from "@/lib/load-case";
import { tenderHistory } from "@/lib/record-history";
import type { EventId } from "@/lib/tender-case";
import { getTender, getUser, listBidsForBidder } from "@/services/amanadb";

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
  const { event, published, cancelled, history } = await props.searchParams;

  const tenderCase = await loadCase(id);
  if (!tenderCase) notFound();

  // Default to the current event (P2 opens on "Bids received"); fall back to Published.
  const requested = typeof event === "string" && (EVENTS as string[]).includes(event) ? (event as EventId) : null;
  const current = tenderCase.events.find((e) => e.state === "current" || e.state === "mismatch");
  const fallback: EventId = current && EVENTS.includes(current.id) ? current.id : "published";

  // H5: the publishing entity's admins may cancel the tender until it is awarded.
  let cancel = null;
  const user = await currentUser();
  if (user?.role === "pe_admin" && tenderCase.status !== "awarded" && tenderCase.status !== "cancelled") {
    const [tender, account] = await Promise.all([getTender(id), getUser(user.userId)]);
    if (tender && (tender.data.publishedBy === user.userId || tender.data.entity === account?.data.entity)) {
      cancel = <CancelTender tenderKey={tender.key} version={tender.version} reference={tender.data.reference} title={tender.data.title} />;
    }
  }
  // B3 entry: while the tender is open, bidders get "Submit a bid" (or "View my bid" once they
  // have sealed one) and signed-out visitors get "Sign in to bid".
  let bid = null;
  const bidPath = `/bidder/tenders/${id}/bid`;
  if (tenderCase.status === "published" && !tenderCase.closed) {
    if (!user) {
      bid = (
        <ButtonLink href={`/sign-in?next=${encodeURIComponent(bidPath)}`} size="small">
          Sign in to bid
        </ButtonLink>
      );
    } else if (user.role === "bidder") {
      const mine = (await listBidsForBidder(user.userId)).some((b) => b.data.tenderId === id);
      bid = mine ? (
        <ButtonLink href="/bidder/bids" variant="secondary" size="small">
          View my bid
        </ButtonLink>
      ) : (
        <ButtonLink href={bidPath} size="small">
          Submit a bid
        </ButtonLink>
      );
    }
  }

  const toast = published === "1" ? "Tender published" : cancelled === "1" ? "Tender cancelled" : undefined;

  // P3: ?history=1 opens the tender record's history over the case file.
  const selectedEvent = requested ?? fallback;
  const overlay =
    history === "1" ? (
      <RecordHistoryDrawer reference={tenderCase.reference} versions={await tenderHistory(id)} closeHref={`/tenders/${id}?event=${selectedEvent}`} />
    ) : undefined;

  return (
    <TenderDetailView
      tenderCase={tenderCase}
      selected={selectedEvent}
      header={<SiteHeader active="tenders" />}
      toast={toast}
      headerActions={cancel ?? bid}
      overlay={overlay}
      sheetOpen={requested !== null && history !== "1"}
    />
  );
}
