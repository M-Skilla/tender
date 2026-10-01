import { AccessDenied } from "@/components/AccessDenied/AccessDenied";
import { CreateTenderForm } from "@/components/CreateTender/CreateTenderForm";
import { SiteHeader } from "@/components/NavigationBar/SiteHeader";
import styles from "@/components/CreateTender/CreateTenderPage.module.css";
import { requirePageUser } from "@/lib/auth";
import { getUser, listTenders, nextTenderReference } from "@/services/amanadb";

export const dynamic = "force-dynamic";
export const metadata = { title: "Create tender notice" };

// H2 create tender: procuring entity admins only.
export default async function CreateTenderPage() {
  const user = await requirePageUser(["pe_admin"], "/entity/tenders/new");
  if (!user) {
    return (
      <>
        <SiteHeader />
        <AccessDenied who="procuring entity administrators" />
      </>
    );
  }
  const now = new Date();
  const [record, tenders, reference] = await Promise.all([
    getUser(user.userId),
    listTenders(),
    nextTenderReference(Number(new Date(now.getTime() + 3 * 3_600_000).toISOString().slice(0, 4))),
  ]);
  const entity = record?.data.entity ?? tenders.find((t) => t.data.publishedBy === user.userId)?.data.entity ?? "Not set";
  return (
    <>
      <SiteHeader active="worklist" />
      <main className={styles.page}>
        <div className={styles.heading}>
          <h1 className="text-title">Create tender notice</h1>
          <p className={styles.subtitle}>Publish a new public procurement notice.</p>
        </div>
        <CreateTenderForm reference={reference} entity={entity} />
      </main>
    </>
  );
}
