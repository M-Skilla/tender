import type { ReactNode } from "react";
import type { EventId, TenderCase } from "@/lib/tender-case";
import { formatTzs } from "@/lib/format";
import { FingerprintChip } from "../FingerprintChip/FingerprintChip";
import { RecordFields } from "../RecordFields/RecordFields";
import { RuledTable, type RuledTableColumn } from "../RuledTable/RuledTable";
import { Spine, SpineNode } from "../SpineNode/SpineNode";
import { TenderHeader } from "../TenderHeader/TenderHeader";
import { Toast } from "../Toast/Toast";
import { VerificationBanner, VerificationBannerAction, VerificationMark } from "../VerificationMark/VerificationMark";
import styles from "./TenderDetailView.module.css";

// P2 widths: 240px and 160px text columns plus the 16px gap Figma places between cells.
const BID_COLUMNS: RuledTableColumn[] = [
  { key: "bidder", header: "Bidder", width: "37.65%" },
  { key: "received", header: "Received", width: "25.88%" },
  { key: "fingerprint", header: "Fingerprint" },
];

function bannerSentence(tenderCase: TenderCase): string {
  const { total, mismatched, documentMismatch, checkedAt } = tenderCase.check;
  if (documentMismatch) {
    return "The stored copy of this document no longer matches its recorded fingerprint. The recorded version is unchanged.";
  }
  if (mismatched > 0) {
    const one = mismatched === 1;
    return `${mismatched} of ${total} ${total === 1 ? "record" : "records"} ${one ? "does" : "do"} not match ${
      one ? "its" : "their"
    } recorded fingerprint. Checked ${checkedAt}.`;
  }
  return `All ${total} ${total === 1 ? "record matches" : "records match"}. Checked ${checkedAt}.`;
}

function BidsDetail({ tenderCase }: { tenderCase: TenderCase }) {
  const count = tenderCase.bids.length;
  const anyMismatch = tenderCase.bids.some((bid) => bid.result === "does-not-match");
  const hidden = tenderCase.opened
    ? "Amounts were revealed when the bids were opened."
    : tenderCase.closed
      ? "Amounts are hidden until the bids are opened."
      : "Amounts are hidden until the closing time.";
  return (
    <>
      {/* A2: when a bid's stored document was altered, the alert takes the heading's place. */}
      {tenderCase.tamperedBid ? (
        <div className={styles.alert} role="alert">
          <h2 className={styles.alertTitle}>Stored document does not match</h2>
          <p className={styles.alertText}>
            The document submitted with {tenderCase.tamperedBid.bidderName}&rsquo;s bid on {tenderCase.tamperedBid.received} no
            longer matches the fingerprint recorded when the bid was revealed. The recorded bid is unchanged.
          </p>
        </div>
      ) : (
        <div className={styles.detailHeader}>
          <h2 className={styles.detailTitle}>Bids received</h2>
          <p className={styles.detailText}>
            {count > 0 ? `${count} sealed ${count === 1 ? "bid" : "bids"}. ${hidden}` : null}
          </p>
        </div>
      )}
      <RuledTable
        caption={`Sealed bids for ${tenderCase.reference}`}
        density="compact"
        columns={BID_COLUMNS}
        rows={tenderCase.bids.map((bid) => ({
          id: bid.key,
          highlight: bid.tampered,
          cells: {
            bidder: bid.bidderName,
            received: <span className={styles.secondary}>{bid.received}</span>,
            fingerprint: (
              <span className={styles.proof}>
                <FingerprintChip value={bid.fingerprint} tone={bid.result === "does-not-match" ? "mismatch" : "default"} />
                {anyMismatch ? <VerificationMark result={bid.result} /> : null}
              </span>
            ),
          },
        }))}
        empty={{ message: "No bids yet. Bids appear here once bidders submit them." }}
      />
    </>
  );
}

function PublishedDetail({ tenderCase }: { tenderCase: TenderCase }) {
  return (
    <>
      <div className={styles.detailHeader}>
        <h2 className={styles.detailTitle}>Published</h2>
        <p className={styles.detailText}>Published by the procuring entity on {tenderCase.publishedAt}.</p>
      </div>
      <div className={styles.recordSheet}>
        <RecordFields
          fields={[
            { label: "Reference", value: tenderCase.reference },
            { label: "Procuring entity", value: tenderCase.entity },
            { label: "Category", value: tenderCase.category },
            { label: "Budget ceiling", value: formatTzs(tenderCase.budgetCeiling) },
            { label: "Opens", value: tenderCase.opens },
            { label: "Closes", value: tenderCase.closes },
            { label: "Description", value: <span className="text-prose">{tenderCase.description}</span> },
            ...(tenderCase.document
              ? [
                  {
                    label: "Tender document",
                    value: (
                      <span className={styles.document}>
                        <span>{tenderCase.document.name}</span>
                        <span className={styles.proof}>
                          <FingerprintChip
                            value={tenderCase.document.fingerprint}
                            tone={tenderCase.document.result === "does-not-match" ? "mismatch" : "default"}
                          />
                          <VerificationMark result={tenderCase.document.result} />
                        </span>
                      </span>
                    ),
                  },
                ]
              : []),
            {
              label: "Record fingerprint",
              value: (
                <span className={styles.proof}>
                  <FingerprintChip value={tenderCase.tenderFingerprint} />
                  <VerificationMark result={tenderCase.tenderRecordResult} />
                  <a href="?event=published&history=1" className={styles.historyLink}>
                    Record history
                  </a>
                </span>
              ),
            },
          ]}
        />
      </div>
    </>
  );
}

export function TenderDetailView({
  tenderCase,
  selected,
  header,
  toast,
  headerActions,
  overlay,
}: {
  tenderCase: TenderCase;
  selected: EventId;
  /** The navigation bar: SiteHeader on real pages (reads the session), NavigationBar in review. */
  header: ReactNode;
  /** Confirmation after an action that lands here, such as "Tender published". */
  toast?: string;
  /** The procuring entity's controls on its own tender (H5 "Cancel tender"). */
  headerActions?: ReactNode;
  /** P3's record history drawer, when open. */
  overlay?: ReactNode;
}) {
  const failed = tenderCase.check.mismatched > 0;
  return (
    <>
      {header}
      <main className={styles.page}>
        <TenderHeader
          title={tenderCase.title}
          reference={tenderCase.reference}
          status={tenderCase.status}
          fields={[
            { label: "Procuring entity", value: tenderCase.entity },
            { label: "Budget ceiling", value: formatTzs(tenderCase.budgetCeiling) },
            { label: "Closes", value: tenderCase.closes },
          ]}
          actions={headerActions}
        />

        {tenderCase.cancellation ? (
          <section className={styles.cancelled} aria-label="Cancellation">
            <p className={styles.cancelledTitle}>Cancelled{tenderCase.cancellation.at ? ` on ${tenderCase.cancellation.at}` : ""}</p>
            <p>{tenderCase.cancellation.reason}</p>
          </section>
        ) : null}

        <VerificationBanner
          result={failed ? "does-not-match" : "matches"}
          action={
            failed ? undefined : (
              <form method="get">
                <input type="hidden" name="event" value={selected} />
                <VerificationBannerAction type="submit">Check again</VerificationBannerAction>
              </form>
            )
          }
        >
          {bannerSentence(tenderCase)}
        </VerificationBanner>

        <div className={styles.split}>
          <div className={styles.spineColumn}>
            <Spine label={`Record of ${tenderCase.reference}`}>
              {tenderCase.events.map((event) => (
                <SpineNode
                  key={event.id}
                  state={event.state}
                  title={event.title}
                  version={event.version}
                  latest={event.latest}
                  time={event.time}
                  dateTime={event.dateTime}
                  actor={event.actor}
                  fingerprint={event.fingerprint}
                  result={event.result}
                  note={event.note}
                  pendingLabel={event.pendingLabel}
                  selected={event.id === selected}
                  href={event.selectable ? `?event=${event.id}` : undefined}
                  versionHref={event.id === "published" ? `?event=${selected}&history=1` : undefined}
                />
              ))}
            </Spine>
          </div>
          <section className={styles.detail} aria-live="polite">
            {selected === "published" ? <PublishedDetail tenderCase={tenderCase} /> : <BidsDetail tenderCase={tenderCase} />}
          </section>
        </div>
      </main>
      {toast ? <Toast>{toast}</Toast> : null}
      {overlay}
    </>
  );
}
