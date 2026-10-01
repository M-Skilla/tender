import { AccessDenied } from "@/components/AccessDenied/AccessDenied";
import pageStyles from "@/components/CreateTender/CreateTenderPage.module.css";
import { MyBidsView } from "@/components/MyBids/MyBidsView";
import { SiteHeader } from "@/components/NavigationBar/SiteHeader";
import { requirePageUser } from "@/lib/auth";
import { myBids } from "@/lib/my-bids";

export const dynamic = "force-dynamic";
export const metadata = { title: "My bids" };

// B2 my bids: the signed-in bidder's sealed, opened and withdrawn bids.
export default async function MyBidsPage() {
  const user = await requirePageUser(["bidder"], "/bidder/bids");
  if (!user) {
    return (
      <>
        <SiteHeader />
        <AccessDenied who="registered bidders" />
      </>
    );
  }
  const rows = await myBids(user.userId);
  return (
    <>
      <SiteHeader active="bids" />
      <main className={pageStyles.page}>
        <MyBidsView rows={rows} />
      </main>
    </>
  );
}
