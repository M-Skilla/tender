import { notFound } from "next/navigation";
import { TenderDetailView } from "@/components/TenderDetail/TenderDetailView";
import { buildTenderCase, type EventId } from "@/lib/tender-case";
import { sampleTenderInput, type Scenario } from "../sample-tender";

export const metadata = { title: "P2 review" };

const SCENARIOS: Scenario[] = ["default", "tampered-bid", "tampered-document", "no-bids"];

// Dev-only: P2 rendered from sample records through the real composer and view.
export default async function P2Review(props: PageProps<"/dev/screens/p2">) {
  if (process.env.NODE_ENV === "production") notFound();
  const { scenario, event } = await props.searchParams;
  const chosen = SCENARIOS.includes(scenario as Scenario) ? (scenario as Scenario) : "default";
  const tenderCase = await buildTenderCase(sampleTenderInput(chosen));
  const selected: EventId = event === "published" ? "published" : "bids";
  return <TenderDetailView tenderCase={tenderCase} selected={selected} />;
}
