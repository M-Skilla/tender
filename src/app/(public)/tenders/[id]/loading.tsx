import { NavigationBar } from "@/components/NavigationBar/NavigationBar";
import { VerificationBanner } from "@/components/VerificationMark/VerificationMark";
import styles from "./states.module.css";

// Loading (decided): the neutral "checking" banner, no skeleton shimmer.
export default function Loading() {
  return (
    <>
      <NavigationBar active="tenders" />
      <main className={styles.page}>
        <VerificationBanner result="checking">Checking the tender record.</VerificationBanner>
      </main>
    </>
  );
}
