import { IconCheckCircle16 } from "../icons";
import styles from "./Toast.module.css";

/**
 * Confirmation after an action, repeating its verb ("Bids opened"). Decided: fixed at the
 * bottom right, the overlay shadow and radius, a pine check and the words; no slide-in.
 * `aboveFooter` lifts it over a sticky footer (C2) so it never covers the footer's buttons.
 */
export function Toast({ children, aboveFooter = false }: { children: string; aboveFooter?: boolean }) {
  return (
    <div role="status" className={styles.toast} data-above-footer={aboveFooter || undefined}>
      <IconCheckCircle16 className={styles.icon} />
      <span>{children}</span>
    </div>
  );
}
