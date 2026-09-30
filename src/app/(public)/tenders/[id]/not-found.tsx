import { ButtonLink } from "@/components/Button/Button";
import { SiteHeader } from "@/components/NavigationBar/SiteHeader";
import styles from "./states.module.css";

// Not found (decided): one sentence and one action.
export default function TenderNotFound() {
  return (
    <>
      <SiteHeader active="tenders" />
      <main className={styles.page}>
        <div className={styles.sheet}>
          <h1 className="text-section">Tender not found</h1>
          <p className={styles.text}>No tender has this address. Check the link, or find the tender in the list.</p>
          <ButtonLink href="/" variant="secondary">
            Go to tenders
          </ButtonLink>
        </div>
      </main>
    </>
  );
}
