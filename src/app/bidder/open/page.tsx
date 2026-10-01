import { AccessDenied } from "@/components/AccessDenied/AccessDenied";
import pageStyles from "@/components/CreateTender/CreateTenderPage.module.css";
import { SiteHeader } from "@/components/NavigationBar/SiteHeader";
import { OpenBidFlow } from "@/components/OpenBid/OpenBidFlow";
import { requirePageUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Open your bid" };

// B5 open your bid: bidders only; the tender must have closed.
export default async function OpenBidPage() {
  const user = await requirePageUser(["bidder"], "/bidder/open");
  if (!user) {
    return (
      <>
        <SiteHeader />
        <AccessDenied who="registered bidders" />
      </>
    );
  }
  return (
    <>
      <SiteHeader active="tenders" />
      <main className={pageStyles.page}>
        <OpenBidFlow />
      </main>
    </>
  );
}
