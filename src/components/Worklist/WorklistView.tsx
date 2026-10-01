import type { ReactNode } from "react";
import type { WorkItem, Worklist } from "@/lib/worklist";
import { ButtonLink } from "../Button/Button";
import styles from "./WorklistView.module.css";

function Section({
  title,
  items,
  empty,
  action,
  tone,
}: {
  title: string;
  items: WorkItem[];
  empty: string;
  action: (item: WorkItem) => ReactNode;
  tone?: "amber";
}) {
  return (
    <section className={styles.section} aria-label={title}>
      <h2 className="text-section" data-tone={tone}>
        {title}
      </h2>
      <ul className={styles.list}>
        {items.length === 0 ? (
          <li className={`${styles.row} ${styles.empty}`}>{empty}</li>
        ) : (
          items.map((item) => (
            <li key={item.key} className={styles.row}>
              <div className={styles.meta}>
                <span className={styles.title}>{item.title}</span>
                <span className={styles.detail}>{item.meta.join(" · ")}</span>
              </div>
              {action(item)}
            </li>
          ))
        )}
      </ul>
    </section>
  );
}

/** H1: what the procuring entity has to do next, in the order a tender moves through. */
export function WorklistView({ list }: { list: Worklist }) {
  return (
    <>
      <div className={styles.headerRow}>
        <div className={styles.heading}>
          <h1 className="text-title">Worklist</h1>
          <p className={styles.subtitle}>
            {list.entity ? `${list.entity}: tenders` : "Tenders"} to open, score, award or watch as they close.
          </p>
        </div>
        <ButtonLink href="/entity/tenders/new">Publish tender</ButtonLink>
      </div>
      <Section
        title="Ready to open"
        items={list.readyToOpen}
        empty="No closed tenders are waiting to be opened."
        action={(item) => (
          <a href={`/entity/tenders/${item.key}/open`} className={styles.action}>
            Open bids
          </a>
        )}
      />
      <Section
        title="Waiting for scores"
        items={list.waitingForScores}
        empty="No opened tenders are waiting for the committee."
        action={(item) => (
          <a href={`/tenders/${item.key}`} className={styles.action}>
            View tender
          </a>
        )}
      />
      <Section
        title="Ready to award"
        items={list.readyToAward}
        empty="No tenders have all their bids scored yet."
        action={(item) => (
          <a href={`/entity/tenders/${item.key}/award`} className={styles.action}>
            Record award
          </a>
        )}
      />
      <Section
        title="Closing this week"
        tone="amber"
        items={list.closingThisWeek}
        empty="No tenders close in the next seven days."
        action={() => <span className={styles.status}>Accepting submissions</span>}
      />
    </>
  );
}
