import { ButtonLink } from "../Button/Button";
import styles from "./AccessDenied.module.css";

/** Signed in, but with the wrong role (decided: one sentence and one action). */
export function AccessDenied({ who }: { who: string }) {
  return (
    <main className={styles.page}>
      <div className={styles.sheet} role="alert">
        <h1 className="text-section">This page is not available to your account</h1>
        <p className={styles.text}>Only {who} can use this page. Sign in with that account, or go back to the tenders.</p>
        <ButtonLink href="/" variant="secondary">
          Go to tenders
        </ButtonLink>
      </div>
    </main>
  );
}
