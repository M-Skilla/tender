import { AccessDenied } from "@/components/AccessDenied/AccessDenied";
import pageStyles from "@/components/CreateTender/CreateTenderPage.module.css";
import { SiteHeader } from "@/components/NavigationBar/SiteHeader";
import { WorklistView } from "@/components/Worklist/WorklistView";
import { requirePageUser } from "@/lib/auth";
import { worklist } from "@/lib/worklist";

export const dynamic = "force-dynamic";
export const metadata = { title: "Worklist" };

// H1 worklist: procuring entity admins only.
export default async function WorklistPage() {
  const user = await requirePageUser(["pe_admin"], "/entity");
  if (!user) {
    return (
      <>
        <SiteHeader />
        <AccessDenied who="procuring entity administrators" />
      </>
    );
  }
  const list = await worklist(user.userId);
  return (
    <>
      <SiteHeader active="worklist" />
      <main className={pageStyles.page}>
        <WorklistView list={list} />
      </main>
    </>
  );
}
