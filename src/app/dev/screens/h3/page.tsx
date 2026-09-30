import { notFound } from "next/navigation";
import { BidOpeningView } from "@/components/BidOpening/BidOpeningView";
import { Button } from "@/components/Button/Button";
import { NavigationBar } from "@/components/NavigationBar/NavigationBar";
import { buildTenderCase } from "@/lib/tender-case";
import { sampleOpeningInput, type OpeningState } from "../sample-tender";

export const metadata = { title: "H3 review" };

// Dev-only: H3 in each state from sample records, through the real composer and view.
export default async function H3Review(props: PageProps<"/dev/screens/h3">) {
  if (process.env.NODE_ENV === "production") notFound();
  const { state, toast } = await props.searchParams;
  const chosen: OpeningState = state === "sealed" || state === "closed" ? state : "opened";
  const input = await sampleOpeningInput(chosen);
  const tenderCase = await buildTenderCase(input);
  return (
    <BidOpeningView
      tenderCase={tenderCase}
      now={input.now}
      header={<NavigationBar active="tenders" user={{ name: "Joseph Mwangi", role: "pe_admin" }} />}
      openControl={<Button>Open all bids</Button>}
      justOpened={chosen === "opened" && toast === "1"}
    />
  );
}
