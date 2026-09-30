import type { ReactNode } from "react";
import { formatTzs } from "@/lib/format";
import type { TenderCase } from "@/lib/tender-case";
import { Countdown } from "../Countdown/Countdown";
import { FingerprintChip } from "../FingerprintChip/FingerprintChip";
import { RuledTable, type RuledTableColumn } from "../RuledTable/RuledTable";
import { StatusLabel } from "../StatusLabel/StatusLabel";
import { Toast } from "../Toast/Toast";
import { VerificationMark } from "../VerificationMark/VerificationMark";
import styles from "./BidOpeningView.module.css";

// H3 widths: 240, 180 and 220px text columns plus Figma's 16px gap between cells, over 1280.
const OPEN_COLUMNS: RuledTableColumn[] = [
  { key: "bidder", header: "Bidder", width: "20%" },
  { key: "fingerprint", header: "Fingerprint at submission", width: "15.31%" },
  { key: "amount", header: "Revealed amount", width: "18.44%" },
  { key: "result", header: "Result" },
];

// Before the closing time there is no reveal column at all (brief section 5).
const SEALED_COLUMNS: RuledTableColumn[] = [
  { key: "bidder", header: "Bidder", width: "20%" },
  { key: "fingerprint", header: "Fingerprint at submission", width: "15.31%" },
  { key: "result", header: "State" },
];

export function BidOpeningView({
  tenderCase,
  now,
  header,
  openControl,
  justOpened = false,
}: {
  tenderCase: TenderCase;
  now: Date;
  header: ReactNode;
  /** The "Open all bids" form (a client form around the server action). */
  openControl?: ReactNode;
  /** Just opened by this user: play the reveal transition and show the toast. */
  justOpened?: boolean;
}) {
  const { bids, closed, opened } = tenderCase;
  const revealedCount = bids.filter((b) => b.revealReceived).length;

  let subtitle: string;
  if (opened) subtitle = `Opened ${tenderCase.openedAt}.`;
  else if (closed) {
    subtitle = `Closed ${tenderCase.closes}. Opening is allowed. ${revealedCount} of ${bids.length} ${
      bids.length === 1 ? "bidder has" : "bidders have"
    } submitted their reveal.`;
  } else subtitle = `Closes ${tenderCase.closes}. Bids can be opened after the closing time.`;

  const rows = bids.map((bid) => {
    const fingerprint = <FingerprintChip value={bid.fingerprint} tone={bid.result === "does-not-match" ? "mismatch" : "default"} />;
    const bidder = <span className={styles.bidder}>{bid.bidderName}</span>;
    if (!closed) {
      return { id: bid.key, cells: { bidder, fingerprint, result: <StatusLabel status="sealed" /> } };
    }
    if (opened && bid.revealed) {
      return {
        id: bid.key,
        cells: {
          bidder,
          fingerprint,
          amount: <span className={styles.amount} data-reveal={justOpened || undefined}>{formatTzs(bid.revealed.amount)}</span>,
          result: (
            <span className={styles.reveal} data-reveal={justOpened || undefined}>
              <VerificationMark result={bid.revealed.result} />
            </span>
          ),
        },
      };
    }
    return {
      id: bid.key,
      cells: {
        bidder,
        fingerprint,
        amount: (
          <span className={styles.muted}>{opened || !bid.revealReceived ? "Not revealed" : "Hidden until opening"}</span>
        ),
        result: <StatusLabel status="sealed" />,
      },
    };
  });

  return (
    <>
      {header}
      <main className={styles.page}>
        <div className={styles.heading}>
          <h1 className="text-title">Open bids for {tenderCase.reference}</h1>
          <p className={styles.subtitle}>{subtitle}</p>
          {!closed ? <Countdown deadline={new Date(tenderCase.closeDate)} now={now} /> : null}
        </div>

        <RuledTable
          caption={`Bids for ${tenderCase.reference}`}
          columns={closed ? OPEN_COLUMNS : SEALED_COLUMNS}
          rows={rows}
          empty={{ message: "No bids were submitted. There is nothing to open." }}
        />

        {closed && !opened && bids.length > 0 && openControl ? <div className={styles.actions}>{openControl}</div> : null}
      </main>
      {justOpened ? <Toast>Bids opened</Toast> : null}
    </>
  );
}
