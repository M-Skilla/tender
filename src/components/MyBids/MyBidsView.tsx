"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { withdrawBidAction } from "@/app/bidder/bids/actions";
import type { MyBidRow } from "@/lib/my-bids";
import { Button, ButtonLink } from "../Button/Button";
import { ConfirmModal } from "../ConfirmModal/ConfirmModal";
import { FingerprintChip } from "../FingerprintChip/FingerprintChip";
import { IconAlertTriangle20 } from "../icons";
import { RuledTable, type RuledTableColumn } from "../RuledTable/RuledTable";
import { StatusLabel } from "../StatusLabel/StatusLabel";
import { Toast } from "../Toast/Toast";
import styles from "./MyBidsView.module.css";

// B2 widths: 400, 200 and 240px columns plus Figma's 16px gaps, over 1280.
const COLUMNS: RuledTableColumn[] = [
  { key: "tender", header: "Tender", width: "32.5%" },
  { key: "submitted", header: "Submitted", width: "16.88%" },
  { key: "fingerprint", header: "Fingerprint", width: "20%" },
  { key: "state", header: "State" },
];

/** B2: the signed-in bidder's bids. Sealed bids can be withdrawn before closing, and opened after. */
export function MyBidsView({ rows }: { rows: MyBidRow[] }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState<MyBidRow | null>(null);
  const [error, setError] = useState("");
  const [withdrawn, setWithdrawn] = useState(false);
  const [pending, startTransition] = useTransition();

  function withdraw(row: MyBidRow) {
    setError("");
    startTransition(async () => {
      const result = await withdrawBidAction(row.key, row.version);
      setConfirming(null);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setWithdrawn(true);
      router.refresh();
    });
  }

  return (
    <>
      <div className={`${styles.titleRow} mobile-band`}>
        <h1 className="text-title">My bids</h1>
      </div>
      {error ? (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      ) : null}
      {/* b2-mobile: the same bids as cards; the table is hidden there when it has rows. */}
      {rows.length > 0 ? (
        <ul className={styles.cards} aria-label="My bids">
          {rows.map((row) => (
            <li key={row.key} className={styles.card}>
              <div className={styles.cardHeader}>
                {row.status === "withdrawn" ? (
                  <span className={styles.cardWithdrawn}>{row.tenderTitle}</span>
                ) : (
                  <a href={`/tenders/${row.tenderKey}`} className={styles.cardTitle}>
                    {row.tenderTitle}
                  </a>
                )}
                <span className={styles.cardMeta}>Submitted: {row.submitted}</span>
              </div>
              <div className={styles.cardFooter}>
                <FingerprintChip value={row.fingerprint} />
                <StatusLabel status={row.status} />
              </div>
              {row.canWithdraw || row.awaitingOpen ? (
                <div className={styles.cardActions}>
                  {row.canWithdraw ? (
                    <Button variant="secondary" className={styles.cardButton} onClick={() => setConfirming(row)}>
                      Withdraw bid
                    </Button>
                  ) : (
                    <ButtonLink href="/bidder/open" variant="secondary" className={styles.cardButton}>
                      Open your bid
                    </ButtonLink>
                  )}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
      <div className={rows.length > 0 ? styles.tableWrap : undefined}>
      <RuledTable
        caption="My bids"
        columns={COLUMNS}
        rows={rows.map((row) => ({
          id: row.key,
          cells: {
            tender:
              row.status === "withdrawn" ? (
                <span className={styles.withdrawnTitle}>{row.tenderTitle}</span>
              ) : (
                <a href={`/tenders/${row.tenderKey}`} className={styles.title}>
                  {row.tenderTitle}
                </a>
              ),
            submitted: <span className={styles.muted}>{row.submitted}</span>,
            fingerprint: <FingerprintChip value={row.fingerprint} />,
            state: (
              <span className={styles.state}>
                <StatusLabel status={row.status} />
                {row.canWithdraw ? (
                  <button type="button" className={styles.rowAction} onClick={() => setConfirming(row)}>
                    Withdraw
                  </button>
                ) : null}
                {row.awaitingOpen ? (
                  <a href="/bidder/open" className={styles.rowAction}>
                    Open your bid
                  </a>
                ) : null}
              </span>
            ),
          },
        }))}
        empty={{
          message: "You have not submitted any bids. Bids you seal appear here with their fingerprint.",
          action: (
            <ButtonLink href="/" variant="secondary" size="small">
              Browse tenders
            </ButtonLink>
          ),
        }}
      />
      </div>

      {confirming ? (
        <ConfirmModal
          title="Withdraw this bid?"
          tone="destructive"
          icon={<IconAlertTriangle20 />}
          onCancel={() => setConfirming(null)}
          actions={
            <>
              <Button variant="text" onClick={() => setConfirming(null)} disabled={pending}>
                Keep bid
              </Button>
              <Button variant="destructive" loading={pending} loadingLabel="Withdrawing bid" onClick={() => withdraw(confirming)}>
                Withdraw bid
              </Button>
            </>
          }
        >
          <p>{confirming.tenderTitle}</p>
          <p>
            The bid leaves the tender and will not be opened. Its record and fingerprint stay in the audit history. You can seal a new
            bid before the closing time.
          </p>
        </ConfirmModal>
      ) : null}
      {withdrawn ? <Toast>Bid withdrawn</Toast> : null}
    </>
  );
}
