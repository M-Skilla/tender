"use client";

import { useActionState } from "react";
import { Button } from "@/components/Button/Button";
import { IconAlertTriangle16 } from "@/components/icons";
import { openBidsAction, type OpenBidsState } from "./actions";
import styles from "./page.module.css";

export function OpenBidsForm({ tenderKey }: { tenderKey: string }) {
  const [state, action, pending] = useActionState<OpenBidsState>(openBidsAction.bind(null, tenderKey), {});
  return (
    <form action={action} className={styles.form}>
      {state.error ? (
        <p className={styles.error} role="alert">
          <IconAlertTriangle16 />
          <span>{state.error}</span>
        </p>
      ) : null}
      <Button type="submit" loading={pending} loadingLabel="Opening bids">
        Open all bids
      </Button>
    </form>
  );
}
