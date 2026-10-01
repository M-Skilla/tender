import { notFound } from "next/navigation";
import { AccessDenied } from "@/components/AccessDenied/AccessDenied";
import states from "@/components/AccessDenied/AccessDenied.module.css";
import { SiteHeader } from "@/components/NavigationBar/SiteHeader";
import { SubmitBidFlow } from "@/components/SubmitBid/SubmitBidFlow";
import pageStyles from "@/components/CreateTender/CreateTenderPage.module.css";
import { requirePageUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { ButtonLink } from "@/components/Button/Button";
import { getTender, listBidsForBidder } from "@/services/amanadb";

export const dynamic = "force-dynamic";
export const metadata = { title: "Submit bid" };

// B3 submit bid (and B4 receipt, shown in place after sealing). Bidders only, while open.
export default async function SubmitBidPage(props: PageProps<"/bidder/tenders/[id]/bid">) {
  const { id } = await props.params;
  const user = await requirePageUser(["bidder"], `/bidder/tenders/${id}/bid`);
  if (!user) {
    return (
      <>
        <SiteHeader />
        <AccessDenied who="registered bidders" />
      </>
    );
  }
  const tender = await getTender(id);
  if (!tender) notFound();
  const open = tender.data.status === "PUBLISHED" && Date.now() < new Date(tender.data.closeDate).getTime();
  // One sealed bid per bidder per tender: say so before the form, not after sealing.
  const already = open && (await listBidsForBidder(user.userId)).some((b) => b.data.tenderId === tender.key);
  if (already) {
    return (
      <>
        <SiteHeader active="tenders" />
        <main className={pageStyles.page}>
          <div className={states.sheet}>
            <h1 className="text-section">You have already bid on this tender</h1>
            <p className={states.text}>
              Your sealed bid for {tender.data.reference} is recorded. A sealed bid cannot be replaced; you can withdraw it from My
              bids before {formatDateTime(tender.data.closeDate)} and seal a new one.
            </p>
            <ButtonLink href="/bidder/bids" variant="secondary">
              Go to my bids
            </ButtonLink>
          </div>
        </main>
      </>
    );
  }
  return (
    <>
      <SiteHeader active="tenders" />
      <main className={pageStyles.page}>
        {open ? (
          <SubmitBidFlow
            tenderKey={tender.key}
            reference={tender.data.reference}
            title={tender.data.title}
            closes={formatDateTime(tender.data.closeDate)}
          />
        ) : (
          <div className={states.sheet}>
            <h1 className="text-section">This tender is not accepting bids</h1>
            <p className={states.text}>
              {tender.data.reference} closed {formatDateTime(tender.data.closeDate)}. Bids can no longer be submitted. Contact
              the procuring entity with any questions.
            </p>
          </div>
        )}
      </main>
    </>
  );
}
