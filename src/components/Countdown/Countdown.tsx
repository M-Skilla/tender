import { IconLock14 } from "../icons";
import styles from "./Countdown.module.css";

/** Time left until a deadline in days and hours (brief section 7), or "Closed". */
export function countdownText(deadline: Date, now: Date): string {
  const ms = deadline.getTime() - now.getTime();
  if (ms <= 0) return "Closed";
  const hoursTotal = Math.floor(ms / 3_600_000);
  const days = Math.floor(hoursTotal / 24);
  const hours = hoursTotal % 24;
  if (days === 0 && hours === 0) return "Less than 1 hour left";
  const parts = [];
  if (days > 0) parts.push(`${days} ${days === 1 ? "day" : "days"}`);
  if (hours > 0) parts.push(`${hours} ${hours === 1 ? "hour" : "hours"}`);
  return `${parts.join(", ")} left`;
}

/** Sealed-until countdown: lock icon and the time left (static; the page is dynamic). */
export function Countdown({ deadline, now }: { deadline: Date; now: Date }) {
  const text = countdownText(deadline, now);
  return (
    <p className={styles.countdown} data-closed={text === "Closed" || undefined}>
      <IconLock14 className={styles.icon} />
      <span>{text}</span>
    </p>
  );
}
