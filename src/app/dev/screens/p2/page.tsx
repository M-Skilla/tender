import { notFound } from "next/navigation";
import { NavigationBar } from "@/components/NavigationBar/NavigationBar";
import { TenderDetailView } from "@/components/TenderDetail/TenderDetailView";
import { buildTenderCase, type EventId } from "@/lib/tender-case";
import { sampleOpeningInput, sampleTenderInput, type Scenario } from "../sample-tender";

export const metadata = { title: "P2 review" };

const SCENARIOS: (Scenario | "tampered-bid-document")[] = ["default", "tampered-bid", "tampered-document", "no-bids", "tampered-bid-document"];

// Dev-only: P2 rendered from sample records through the real composer and view.
export default async function P2Review(props: PageProps<"/dev/screens/p2">) {
  if (process.env.NODE_ENV === "production") notFound();
  const { scenario, event } = await props.searchParams;
  const chosen = SCENARIOS.includes(scenario as Scenario) ? (scenario as Scenario | "tampered-bid-document") : "default";
  // A2 review: bids opened, and the first bid's stored document no longer matches.
  const input =
    chosen === "tampered-bid-document"
      ? await sampleOpeningInput("opened").then((i) => ({
          ...i,
          bidDocumentChecks: new Map(i.reveals.map((r, n) => [r.data.docHash, n === 0 ? ("does-not-match" as const) : ("matches" as const)])),
        }))
      : sampleTenderInput(chosen);
  const tenderCase = await buildTenderCase(input);
  const selected: EventId = event === "published" ? "published" : "bids";
  return <TenderDetailView tenderCase={tenderCase} selected={selected} header={<NavigationBar active="tenders" />} />;
}
