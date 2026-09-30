import { notFound } from "next/navigation";
import { AccessDenied } from "@/components/AccessDenied/AccessDenied";
import { EvaluationForm } from "@/components/Evaluation/EvaluationForm";
import { EvaluationView } from "@/components/Evaluation/EvaluationView";
import { SiteHeader } from "@/components/NavigationBar/SiteHeader";
import states from "@/components/AccessDenied/AccessDenied.module.css";
import { requirePageUser } from "@/lib/auth";
import { bidCommitment } from "@/lib/commitment";
import { CRITERIA } from "@/lib/evaluation";
import { formatDateTime } from "@/lib/format";
import { ensureEvaluation, getBid, getTender, listRevealsForTender } from "@/services/amanadb";
import { saveEvaluationAction } from "./actions";

// Evaluation state changes with every save: never cached.
export const dynamic = "force-dynamic";
export const metadata = { title: "Evaluate bid" };

// C2 evaluation form (host of C3). Committee members only, after the bids are opened.
export default async function EvaluationPage(props: PageProps<"/committee/tenders/[id]/bids/[bidId]">) {
  const { id, bidId } = await props.params;
  const { saved } = await props.searchParams;
  const path = `/committee/tenders/${id}/bids/${bidId}`;
  const user = await requirePageUser(["evaluator"], path);
  if (!user) {
    return (
      <>
        <SiteHeader />
        <AccessDenied who="evaluation committee members" />
      </>
    );
  }

  const [tender, bid] = await Promise.all([getTender(id), getBid(bidId)]);
  if (!tender || !bid || bid.data.tenderId !== tender.key) notFound();

  if (!tender.data.openedAt) {
    return (
      <>
        <SiteHeader active="queue" />
        <main className={states.page}>
          <div className={states.sheet}>
            <h1 className="text-section">Bids can be scored after they are opened</h1>
            <p className={states.text}>
              {tender.data.reference} closes {formatDateTime(tender.data.closeDate)}. The procuring entity opens the bids
              after that, and scoring starts then.
            </p>
          </div>
        </main>
      </>
    );
  }

  const reveals = await listRevealsForTender(tender.key);
  const reveal = reveals.find((r) => r.data.bidId === bid.key);
  const evaluation = await ensureEvaluation(bid.key, {
    tenderId: tender.key,
    bidId: bid.key,
    evaluatorId: "",
    evaluatorName: "",
    criteria: CRITERIA.map((c) => ({ name: c.name, weight: c.weight, score: null, comment: "" })),
    comment: "",
    total: 0,
  });
  const revealResult = reveal
    ? (await bidCommitment({ amount: reveal.data.amount, docHash: reveal.data.docHash, salt: reveal.data.salt })) === bid.data.commitment
      ? ("matches" as const)
      : ("does-not-match" as const)
    : undefined;

  const e = evaluation.data;
  const versionText = e.evaluatorName
    ? `Version ${evaluation.version}, last saved by ${e.evaluatorName} (${formatDateTime(evaluation.updatedAt)})`
    : `Version ${evaluation.version}, not scored yet`;

  return (
    <EvaluationView
      header={<SiteHeader active="queue" />}
      saved={saved === "1"}
      summary={{
        tenderTitle: tender.data.title,
        reference: tender.data.reference,
        bidderName: bid.data.bidderName,
        version: evaluation.version,
        versionText,
        bid: { fingerprint: bid.data.commitment, amount: reveal?.data.amount, revealResult, documentHash: reveal?.data.docHash },
      }}
      form={
        <EvaluationForm
          key={evaluation.version}
          action={saveEvaluationAction.bind(null, bid.key, path)}
          version={evaluation.version}
          initialScores={e.criteria.map((c) => c.score)}
          initialComment={e.comment}
        />
      }
    />
  );
}
