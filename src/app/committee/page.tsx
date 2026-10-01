import { AccessDenied } from "@/components/AccessDenied/AccessDenied";
import pageStyles from "@/components/CreateTender/CreateTenderPage.module.css";
import { EvaluationQueueView } from "@/components/EvaluationQueue/EvaluationQueueView";
import { SiteHeader } from "@/components/NavigationBar/SiteHeader";
import { requirePageUser } from "@/lib/auth";
import { evaluationQueue } from "@/lib/evaluation-queue";

export const dynamic = "force-dynamic";
export const metadata = { title: "Evaluation queue" };

// C1 evaluation queue: committee members only.
export default async function EvaluationQueuePage() {
  const user = await requirePageUser(["evaluator"], "/committee");
  if (!user) {
    return (
      <>
        <SiteHeader />
        <AccessDenied who="evaluation committee members" />
      </>
    );
  }
  const rows = await evaluationQueue();
  return (
    <>
      <SiteHeader active="queue" />
      <main className={pageStyles.page}>
        <EvaluationQueueView rows={rows} />
      </main>
    </>
  );
}
