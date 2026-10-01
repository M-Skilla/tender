import { notFound, redirect } from "next/navigation";
import { AccessDenied } from "@/components/AccessDenied/AccessDenied";
import states from "@/components/AccessDenied/AccessDenied.module.css";
import { AwardDecisionForm } from "@/components/Award/AwardDecisionForm";
import pageStyles from "@/components/CreateTender/CreateTenderPage.module.css";
import { ButtonLink } from "@/components/Button/Button";
import { SiteHeader } from "@/components/NavigationBar/SiteHeader";
import { awardReadiness } from "@/lib/award";
import { requirePageUser } from "@/lib/auth";
import { getTender, listAwardsForTender } from "@/services/amanadb";

export const dynamic = "force-dynamic";
export const metadata = { title: "Award decision" };

// H4 award decision: procuring entity admins only, once every scorable bid is scored.
export default async function AwardDecisionPage(props: PageProps<"/entity/tenders/[id]/award">) {
  const { id } = await props.params;
  const user = await requirePageUser(["pe_admin"], `/entity/tenders/${id}/award`);
  if (!user) {
    return (
      <>
        <SiteHeader />
        <AccessDenied who="procuring entity administrators" />
      </>
    );
  }
  const tender = await getTender(id);
  if (!tender) notFound();
  const awards = await listAwardsForTender(id);
  if (awards.length > 0) redirect(`/tenders/${id}/award`);
  const readiness = await awardReadiness(tender, false);

  if (!readiness.ready) {
    const [title, text] =
      readiness.reason === "not-opened"
        ? ["Bids are not opened yet", `${tender.data.reference} can be awarded after its bids are opened and scored.`]
        : readiness.reason === "closed-out"
          ? ["This tender is cancelled", `${tender.data.reference} was cancelled and cannot be awarded.`]
          : readiness.toScore === 0
            ? ["No bid can be awarded", `None of the bids for ${tender.data.reference} was revealed with a matching fingerprint, so none was scored.`]
            : [
                "Scoring is not finished",
                `The committee has scored ${readiness.scored} of ${readiness.toScore} bids for ${tender.data.reference}. The award can be recorded once every bid is scored.`,
              ];
    return (
      <>
        <SiteHeader active="worklist" />
        <main className={states.page}>
          <div className={states.sheet}>
            <h1 className="text-section">{title}</h1>
            <p className={states.text}>{text}</p>
            <ButtonLink href="/entity" variant="secondary">
              Back to worklist
            </ButtonLink>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <SiteHeader active="worklist" />
      <main className={pageStyles.page}>
        <AwardDecisionForm
          tenderKey={tender.key}
          version={tender.version}
          reference={tender.data.reference}
          title={tender.data.title}
          standings={readiness.standings}
        />
      </main>
    </>
  );
}
