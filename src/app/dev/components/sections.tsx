import { Button } from "@/components/Button/Button";
import { DiffLine, DiffList } from "@/components/DiffLine/DiffLine";
import { FingerprintChip } from "@/components/FingerprintChip/FingerprintChip";
import { Pagination } from "@/components/Pagination/Pagination";
import { RuledTable, type RuledTableColumn, type RuledTableRow } from "@/components/RuledTable/RuledTable";
import { Spine, SpineNode } from "@/components/SpineNode/SpineNode";
import { Stepper } from "@/components/Stepper/Stepper";
import { VersionMark } from "@/components/VersionMark/VersionMark";
import styles from "./page.module.css";

/** A 64-character sample fingerprint that truncates to the frame's text ("a3f9…c21"). */
export function fp(start: string, end: string) {
  const middle = "0123456789abcdef".repeat(4).slice(0, 64 - start.length - end.length);
  return `${start}${middle}${end}`;
}

const BID_SUBMISSIONS = [
  ["Kilimo Works Ltd", "28 Oct 2026, 11:20", fp("7be1", "90d")],
  ["Mtera Builders", "28 Oct 2026, 12:45", fp("c410", "2af")],
  ["Zuri Civil", "28 Oct 2026, 13:10", fp("91dd", "e07")],
  ["Dodoma Earthworks", "28 Oct 2026, 13:30", fp("f223", "b14")],
  ["Pemba Construction", "28 Oct 2026, 13:45", fp("8a01", "c77")],
  ["Tanga Roads Co", "28 Oct 2026, 13:58", fp("3bc4", "d92")],
];

const BIDDER_COLUMNS: RuledTableColumn[] = [
  { key: "bidder", header: "Bidder", width: "35.3%" },
  { key: "received", header: "Received", width: "23.5%" },
  { key: "fingerprint", header: "Fingerprint" },
];

const bidderRows: RuledTableRow[] = BID_SUBMISSIONS.map(([bidder, received, value]) => ({
  id: bidder,
  cells: {
    bidder,
    received: <span className={styles.secondary}>{received}</span>,
    fingerprint: <FingerprintChip value={value} />,
  },
}));

const AUDIT_COLUMNS: RuledTableColumn[] = [
  { key: "time", header: "Time", width: "12.5%" },
  { key: "actor", header: "Actor", width: "17.2%" },
  { key: "action", header: "Action", width: "10.9%" },
  { key: "record", header: "Record", width: "12.5%" },
  { key: "version", header: "Version", width: "6.3%" },
  { key: "fingerprint", header: "Fingerprint" },
];

const auditRows: RuledTableRow[] = [
  ["30 Sep 2026 14:02", "System", "Verified", "TND-2026-0142", 6, fp("7be1", "90d")],
  ["30 Sep 2026 09:12", "J. Mwangi (Procuring entity)", "Published", "TND-2026-0142", 1, fp("a3f9", "c21")],
  ["29 Sep 2026 16:45", "Amina M. (Committee)", "Saved evaluation", "TND-2026-0138", 4, fp("e5c2", "f88")],
  ["28 Sep 2026 11:20", "Kilimo Works Ltd (Bidder)", "Submitted bid", "TND-2026-0142", 1, fp("7be1", "90d")],
].map(([time, actor, action, record, version, value]) => ({
  id: `${time}`,
  cells: {
    time,
    actor: <span className={styles.secondary}>{actor}</span>,
    action,
    record: <a className={styles.recordLink} href="#">{record}</a>,
    version: <VersionMark version={version as number} />,
    fingerprint: <FingerprintChip value={value as string} />,
  },
  expandLabel: `Show changes to ${record} version ${version}`,
  expansion:
    action === "Published" ? (
      <div className={styles.panelContent}>
        <p className={styles.panelTitle}>Changed fields</p>
        <DiffList surface="sheet">
          <DiffLine wideLabel label="Budget ceiling" previous="TZS 2,500,000,000" value="TZS 2,450,000,000" />
        </DiffList>
      </div>
    ) : undefined,
}));

const TENDER_COLUMNS: RuledTableColumn[] = [
  { key: "title", header: "Tender title", width: "34.4%" },
  { key: "entity", header: "Procuring entity", width: "21.9%" },
  { key: "budget", header: "Budget ceiling", width: "14.1%" },
  { key: "closes", header: "Closing date", width: "15.6%" },
  { key: "status", header: "Status" },
];

const tenderRows: RuledTableRow[] = [
  ["Road rehabilitation, Dodoma to Mtera section", "Ministry of Works", "TZS 2,450,000,000", "28 Oct 2026, 14:00"],
  ["Supply and distribution of school desks", "President's Office (TAMISEMI)", "TZS 380,000,000", "15 Oct 2026, 10:00"],
  ["Medical laboratory equipment procurement", "Muhimbili National Hospital", "TZS 1,200,000,000", "01 Oct 2026, 12:00"],
].map(([title, entity, budget, closes], index) => ({
  id: title,
  selected: index === 1,
  cells: {
    title: <a className={styles.titleLink} href="#">{title}</a>,
    entity,
    budget,
    closes: <span className={styles.secondary}>{closes}</span>,
    status: "Published",
  },
}));

export function Task2Sections() {
  return (
    <>
      <section className={styles.section}>
        <h2 className="text-section">Spine node</h2>
        <div className={styles.spines}>
          <div>
            <p className={styles.state}>P2: completed, current and selected, upcoming, sealed</p>
            <div className={styles.spineColumn}>
              <Spine label="Tender events">
                <SpineNode state="completed" title="Published" version={1} time="30 Sep 2026, 09:12" actor="Procuring entity" fingerprint={fp("a3f9", "c21")} result="matches" href="#published" />
                <SpineNode state="current" selected latest title="Bids received" version={6} time="30 Sep 2026, 14:02" actor="System" fingerprint={fp("7be1", "90d")} result="matches" href="#bids" />
                <SpineNode state="upcoming" title="Opened" note="28 Oct 2026" />
                <SpineNode state="upcoming" title="Scored" />
                <SpineNode state="sealed" title="Awarded" />
              </Spine>
            </div>
          </div>
          <div>
            <p className={styles.state}>A2: mismatch and selected</p>
            <div className={styles.spineColumn}>
              <Spine label="Tender events">
                <SpineNode state="completed" title="Published" version={1} time="12 Oct 2026, 09:12" actor="Procuring entity" fingerprint={fp("a3f9", "c21")} result="matches" href="#published" />
                <SpineNode state="mismatch" selected title="Bids received" version={2} time="15 Oct 2026, 11:05" actor="System" fingerprint={fp("7be1", "90d")} result="does-not-match" href="#bids" />
                <SpineNode state="upcoming" title="Opened" />
              </Spine>
            </div>
          </div>
          <div>
            <p className={styles.state}>Not selected: current, mismatch, checking</p>
            <div className={styles.spineColumn}>
              <Spine label="Node states">
                <SpineNode state="current" latest title="Bids received" version={6} time="30 Sep 2026, 14:02" actor="System" fingerprint={fp("7be1", "90d")} result="matches" href="#bids" />
                <SpineNode state="mismatch" title="Bids received" version={2} time="15 Oct 2026, 11:05" actor="System" fingerprint={fp("7be1", "90d")} result="does-not-match" href="#bids" />
                <SpineNode state="completed" title="Scored" version={4} time="02 Nov 2026, 10:30" actor="Committee" fingerprint={fp("e5c2", "f88")} result="checking" href="#scored" />
              </Spine>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className="text-section">Ruled table</h2>
        <p className={styles.state}>Compact (P2 bidders)</p>
        <div className={styles.detailWidth}>
          <RuledTable caption="Sealed bids received" density="compact" columns={BIDDER_COLUMNS} rows={bidderRows} />
        </div>
        <p className={styles.state}>Compact, expandable row open (A1 audit log)</p>
        <RuledTable caption="Audit log" density="compact" columns={AUDIT_COLUMNS} rows={auditRows} defaultExpandedId="30 Sep 2026 09:12" />
        <Pagination summary="Showing 1–4 of 1,842 operations" page={1} pageCount={461} hrefForPage={(n) => `?page=${n}`} />
        <p className={styles.state}>Default density, second row selected (P1)</p>
        <RuledTable caption="Tenders" columns={TENDER_COLUMNS} rows={tenderRows} />
        <Pagination summary="Showing 1–8 of 142 tenders" page={1} pageCount={3} hrefForPage={(n) => `?page=${n}`} />
        <p className={styles.state}>Pagination, middle page</p>
        <Pagination summary="Showing 81–88 of 142 tenders" page={11} pageCount={18} hrefForPage={(n) => `?page=${n}`} />
        <p className={styles.state}>Loading</p>
        <RuledTable caption="Tenders" columns={TENDER_COLUMNS} rows={[]} loading loadingRows={3} />
        <p className={styles.state}>Empty</p>
        <RuledTable
          caption="Sealed bids received"
          density="compact"
          columns={BIDDER_COLUMNS}
          rows={[]}
          empty={{
            message: "No bids yet. Bids appear here once bidders submit them.",
            action: <Button variant="secondary" size="small">Copy tender link</Button>,
          }}
        />
      </section>

      <section className={styles.section}>
        <h2 className="text-section">Diff line</h2>
        <div className={styles.diffColumns}>
          <div className={styles.diffColumn}>
            <p className={styles.state}>Your changes (C3)</p>
            <DiffList>
              <DiffLine label="Price score" value="38" highlight />
              <DiffLine label="Technical score" value="41" />
              <DiffLine label="Comment" value="Meets spec" />
            </DiffList>
          </div>
          <div className={styles.diffColumn}>
            <p className={styles.state}>Latest saved, v4 (C3)</p>
            <DiffList>
              <DiffLine label="Price score" value="35" />
              <DiffLine label="Technical score" previous="41" value="44" />
              <DiffLine label="Comment" previous="Meets spec" value="Meets spec, delivery risk" />
            </DiffList>
          </div>
        </div>
        <p className={styles.state}>Stacked (P3 history drawer)</p>
        <div className={styles.drawerWidth}>
          <DiffLine layout="stacked" label="Closing date" previous="24 Oct 2026, 14:00" value="28 Oct 2026, 14:00" />
        </div>
      </section>

      <section className={styles.section}>
        <h2 className="text-section">Stepper</h2>
        <p className={styles.state}>Review is current (B3)</p>
        <Stepper label="Submit bid" steps={["Bid details", "Review", "Seal and submit"]} current={1} />
        <p className={styles.state}>First and last step</p>
        <Stepper label="Submit bid" steps={["Bid details", "Review", "Seal and submit"]} current={0} />
        <Stepper label="Submit bid" steps={["Bid details", "Review", "Seal and submit"]} current={2} />
      </section>

      <section className={styles.section}>
        <h2 className="text-section">Version mark</h2>
        <div className={styles.inlineItems}>
          <VersionMark version={3} />
          <VersionMark version={6} latest />
        </div>
      </section>
    </>
  );
}
