import { IconCheckCircle16 } from "../icons";
import styles from "./Toast.module.css";

/**
 * Confirmation after an action, repeating its verb ("Bids opened"). Decided: fixed at the
 * bottom right, the overlay shadow and radius, a pine check and the words; no slide-in.
 */
export function Toast({ children }: { children: string }) {
  return (
    <div role="status" className={styles.toast}>
      <IconCheckCircle16 className={styles.icon} />
      <span>{children}</span>
    </div>
  );
}
