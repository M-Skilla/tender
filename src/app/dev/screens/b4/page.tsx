import { notFound } from "next/navigation";
import pageStyles from "@/components/CreateTender/CreateTenderPage.module.css";
import { NavigationBar } from "@/components/NavigationBar/NavigationBar";
import { BidReceipt } from "@/components/SubmitBid/SubmitBidFlow";

export const metadata = { title: "B4 review" };

// Dev-only: B4 with a sample receipt, so the receipt can be reviewed (desktop and b4-mobile)
// without sealing a real bid on the ledger.
export default function B4Review() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <>
      <NavigationBar active="tenders" user={{ name: "Amani Builders Ltd", role: "bidder" }} />
      <main className={pageStyles.page}>
        <BidReceipt
          receipt={{
            tender: "TND-2026-0142",
            tenderTitle: "Road rehabilitation, Dodoma to Mtera section",
            tenderKey: "sample",
            bidKey: "sample",
            bidReference: "BID-2026-0142-003",
            amount: 2310000000,
            docHash: "5a83f1c0e9d24b7a8c6e1f2d3b4a59687766554433221100ffeeddccbbaa4ff0",
            docName: "Amani-Builders-bid.pdf",
            salt: "00112233445566778899aabbccddeeff",
            commitment: "7be1e6e72a429ee8782107ad5c9b3f1e0d2a4c6b8e0f1a3c5e7d9b1f3a5c790d",
            submittedAt: "2026-10-02T08:40:00.000Z",
          }}
        />
      </main>
    </>
  );
}
