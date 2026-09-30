import { notFound } from "next/navigation";
import { AccessDenied } from "@/components/AccessDenied/AccessDenied";
import { BidOpeningView } from "@/components/BidOpening/BidOpeningView";
import { SiteHeader } from "@/components/NavigationBar/SiteHeader";
import { requirePageUser } from "@/lib/auth";
import { loadCase } from "@/lib/load-case";
import { OpenBidsForm } from "./OpenBidsForm";

// Shows bid and verification state: never cached.
export const dynamic = "force-dynamic";
export const metadata = { title: "Open bids" };

// H3 bid opening: procuring entity admins only.
export default async function BidOpeningPage(props: PageProps<"/entity/tenders/[id]/open">) {
  const { id } = await props.params;
  const { opened } = await props.searchParams;
  const user = await requirePageUser(["pe_admin"], `/entity/tenders/${id}/open`);
  if (!user) {
    return (
      <>
        <SiteHeader />
        <AccessDenied who="procuring entity administrators" />
      </>
    );
  }

  const now = new Date();
  const tenderCase = await loadCase(id, now);
  if (!tenderCase) notFound();

  return (
    <BidOpeningView
      tenderCase={tenderCase}
      now={now}
      header={<SiteHeader active="tenders" />}
      openControl={<OpenBidsForm tenderKey={tenderCase.key} />}
      justOpened={opened === "1" && tenderCase.opened}
    />
  );
}
