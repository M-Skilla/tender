"use client";

import { Button } from "@/components/Button/Button";
import { NavigationBar } from "@/components/NavigationBar/NavigationBar";
import styles from "./states.module.css";

// Error (decided): says what happened and what to do, without apologising (brief section 8).
export default function TenderError({ reset }: { error: Error; reset: () => void }) {
  return (
    <>
      <NavigationBar active="tenders" />
      <main className={styles.page}>
        <div className={styles.sheet} role="alert">
          <h1 className="text-section">The tender record could not be loaded</h1>
          <p className={styles.text}>The record service did not respond. Try again in a few minutes.</p>
          <Button variant="secondary" onClick={reset}>
            Try again
          </Button>
        </div>
      </main>
    </>
  );
}
