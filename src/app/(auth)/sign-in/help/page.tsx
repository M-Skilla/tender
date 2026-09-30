import { ButtonLink } from "@/components/Button/Button";
import { SiteHeader } from "@/components/NavigationBar/SiteHeader";
import styles from "../page.module.css";

export const metadata = { title: "Forgot password" };

// Not in the design: the spec has no reset flow, so this says who can reset a password.
export default function SignInHelpPage() {
  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <section className={styles.card}>
          <div className={styles.header}>
            <h1 className="text-title">Forgot password</h1>
            <p className={styles.intro}>
              Ask the procuring entity&rsquo;s system administrator to reset your password, then sign in again.
            </p>
          </div>
          <ButtonLink href="/sign-in" variant="secondary">
            Back to sign in
          </ButtonLink>
        </section>
      </main>
    </>
  );
}
