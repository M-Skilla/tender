import { SiteHeader } from "@/components/NavigationBar/SiteHeader";
import { SignInForm } from "./SignInForm";
import styles from "./page.module.css";

export const metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

// B1: one form on a plain page.
export default async function SignInPage(props: PageProps<"/sign-in">) {
  const { next } = await props.searchParams;
  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <section className={styles.card} aria-labelledby="sign-in-title">
          <div className={styles.header}>
            <h1 id="sign-in-title" className="text-title">
              Sign in
            </h1>
            <p className={styles.intro}>Access your submitted bids and receipts.</p>
          </div>
          <SignInForm next={typeof next === "string" ? next : "/"} />
        </section>
      </main>
    </>
  );
}
