import type { QueueRow } from "@/lib/evaluation-queue";
import { ButtonLink } from "../Button/Button";
import { RuledTable, type RuledTableColumn } from "../RuledTable/RuledTable";
import styles from "./EvaluationQueueView.module.css";

// C1 widths: 480, 120 and 200px columns plus Figma's 16px gaps, over 1280.
const COLUMNS: RuledTableColumn[] = [
  { key: "tender", header: "Tender", width: "38.75%" },
  { key: "bids", header: "Bids to score", width: "10.63%" },
  { key: "progress", header: "Progress", width: "16.88%" },
  { key: "action", header: "Action", align: "end" },
];

const plural = (n: number) => `${n} ${n === 1 ? "bid" : "bids"}`;

function Action({ row }: { row: QueueRow }) {
  if (row.toScore === 0) return <span className={styles.muted}>No bids to score</span>;
  if (!row.nextBidKey) return <span className={`${styles.tag} ${styles.complete}`}>Review complete</span>;
  const href = `/committee/tenders/${row.tenderKey}/bids/${row.nextBidKey}`;
  return row.scored === 0 ? (
    <a href={href} className={`${styles.tag} ${styles.start}`}>
      Start scoring
    </a>
  ) : (
    <a href={href} className={styles.continue}>
      Continue scoring
    </a>
  );
}

/** C1: the committee's opened tenders, scoring progress and the next bid to score. */
export function EvaluationQueueView({ rows }: { rows: QueueRow[] }) {
  return (
    <>
      <div className={styles.heading}>
        <h1 className="text-title">Evaluation queue</h1>
        <p className={styles.subtitle}>Opened tenders waiting for the committee&rsquo;s scores.</p>
      </div>
      <RuledTable
        caption="Evaluation queue"
        columns={COLUMNS}
        density="relaxed"
        rows={rows.map((row) => ({
          id: row.tenderKey,
          cells: {
            tender: <span className={styles.title}>{row.title}</span>,
            bids: <span className={styles.muted}>{plural(row.toScore)}</span>,
            progress: `${row.scored} of ${plural(row.toScore)} scored`,
            action: <Action row={row} />,
          },
        }))}
        empty={{
          message: "No tenders are waiting for evaluation. Tenders appear here once the procuring entity opens their bids.",
          action: (
            <ButtonLink href="/" variant="secondary" size="small">
              Browse tenders
            </ButtonLink>
          ),
        }}
      />
    </>
  );
}
