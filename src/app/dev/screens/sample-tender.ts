// Review data only: sample AmanaDB records shaped like P2's frame content. Used by the dev
// screen routes to exercise the real composer and view; never read by app routes.
import { createHash } from "node:crypto";
import type { TenderCaseInput } from "@/lib/tender-case";
import { bidCommitment } from "@/lib/commitment";
import type { AuditedVersion, Bid, BidReveal, StoredRecord, Tender } from "@/lib/types";

/** What AmanaDB stores as dataHash: SHA-256 of the data string as written. */
const hashOf = (data: unknown) => createHash("sha256").update(JSON.stringify(data)).digest("hex");

const eat = (local: string) => new Date(`${local}+03:00`).toISOString();

const tenderData: Tender = {
  reference: "TND-2026-0142",
  title: "Road rehabilitation, Dodoma to Mtera section",
  description:
    "Rehabilitation of 142 km of the Dodoma to Mtera trunk road, including sub-base reconstruction, drainage and asphalt concrete surfacing.",
  entity: "Ministry of Works",
  category: "Works and infrastructure",
  budgetCeiling: 2450000000,
  openDate: eat("2026-09-30T09:00:00"),
  closeDate: eat("2026-10-28T14:00:00"),
  status: "PUBLISHED",
  docHash: "c0ffee4a7d91b2e3f4a5b6c7d8e9f00112233445566778899aabbccddeeff0a1",
  docName: "TND-2026-0142-notice.pdf",
  publishedBy: "user-pe-admin-01",
};

const tender: StoredRecord<Tender> = {
  collection: "tenders",
  key: "01K6TND2026014200000000000",
  version: 1,
  createdAt: eat("2026-09-30T09:12:00"),
  updatedAt: eat("2026-09-30T09:12:00"),
  data: tenderData,
  dataHash: hashOf(tenderData),
  integrity: "verified",
};

const hex = (start: string, end: string) => `${start}${"0123456789abcdef".repeat(4).slice(0, 64 - start.length - end.length)}${end}`;

const BIDS: [string, string, string, string][] = [
  ["01K6BID0000000000000000001", "Kilimo Works Ltd", "2026-10-28T11:20:00", hex("7be1", "90d")],
  ["01K6BID0000000000000000002", "Mtera Builders", "2026-10-28T12:45:00", hex("c410", "2af")],
  ["01K6BID0000000000000000003", "Zuri Civil", "2026-10-28T13:10:00", hex("91dd", "e07")],
  ["01K6BID0000000000000000004", "Dodoma Earthworks", "2026-10-28T13:30:00", hex("f223", "b14")],
  ["01K6BID0000000000000000005", "Pemba Construction", "2026-10-28T13:45:00", hex("8a01", "c77")],
  ["01K6BID0000000000000000006", "Tanga Roads Co", "2026-10-28T13:58:00", hex("3bc4", "d92")],
];

const bids: StoredRecord<Bid>[] = BIDS.map(([key, bidderName, at, commitment], i) => {
  const data: Bid = { tenderId: tender.key, bidderId: `user-bidder-0${i + 1}`, bidderName, commitment, submittedAt: eat(at) };
  return { collection: "bids", key, version: 1, createdAt: eat(at), updatedAt: eat(at), data, dataHash: hashOf(data), integrity: "verified" };
});

function audit(records: StoredRecord<unknown>[]) {
  const map = new Map<string, AuditedVersion>();
  for (const r of records) {
    map.set(`${r.collection}/${r.key}`, {
      version: r.version,
      dataHash: r.dataHash,
      firstWriteAt: r.createdAt,
      lastWriteAt: r.updatedAt,
      lastTxId: `tx-${r.key}`,
    });
  }
  return map;
}

export type Scenario = "default" | "tampered-bid" | "tampered-document" | "no-bids";

export function sampleTenderInput(scenario: Scenario): TenderCaseInput {
  const records = scenario === "no-bids" ? [] : bids;
  const audited = audit([tender, ...records]);
  // A tampered bid: its content no longer re-hashes to the fingerprint AmanaDB stored with it.
  const shown =
    scenario === "tampered-bid"
      ? records.map((r) => (r.key === BIDS[2][0] ? { ...r, integrity: "mismatch" as const } : r))
      : records;
  return {
    tender,
    bids: shown,
    reveals: [],
    evaluations: [],
    awards: [],
    audited,
    documentCheck: scenario === "tampered-document" ? "does-not-match" : "matches",
    now: new Date(eat("2026-10-28T13:59:00")),
  };
}

export type OpeningState = "sealed" | "closed" | "opened";

/**
 * H3 review data: the same tender and bidders with real commitments and reveals. Zuri Civil
 * reveals a lower amount than it sealed. "sealed" is before the closing time; "closed" is after
 * it with every reveal received; "opened" is after "Open all bids".
 */
export async function sampleOpeningInput(state: OpeningState): Promise<TenderCaseInput> {
  const amounts = [2310000000, 2260500000, 1980000000, 2180000000, 2420000000, 2105000000];
  const sealedBids: StoredRecord<Bid>[] = [];
  const reveals: StoredRecord<BidReveal>[] = [];
  for (const [i, bid] of bids.entries()) {
    const docHash = hashOf(`${bid.data.bidderName} bid`);
    const salt = hashOf(`salt-${i}`).slice(0, 32);
    const commitment = await bidCommitment({ amount: amounts[i]!, docHash, salt });
    const data: Bid = { ...bid.data, commitment };
    sealedBids.push({ ...bid, data, dataHash: hashOf(data) });
    const revealData: BidReveal = {
      bidId: bid.key,
      tenderId: tender.key,
      amount: bid.data.bidderName === "Zuri Civil" ? 1950000000 : amounts[i]!,
      docHash,
      salt,
      revealedAt: eat("2026-10-28T15:00:00"),
      verified: bid.data.bidderName !== "Zuri Civil",
    };
    reveals.push({
      collection: "bid_reveals",
      key: `01K6REV000000000000000000${i + 1}`,
      version: 1,
      createdAt: revealData.revealedAt,
      updatedAt: revealData.revealedAt,
      data: revealData,
      dataHash: hashOf(revealData),
      integrity: "verified",
    });
  }
  const openedTender: StoredRecord<Tender> =
    state === "opened"
      ? { ...tender, version: 2, data: { ...tender.data, status: "CLOSED", openedAt: eat("2026-10-28T15:30:00"), openedBy: "user-pe-admin-01" } }
      : tender;
  if (state === "opened") openedTender.dataHash = hashOf(openedTender.data);
  const shownReveals = state === "sealed" ? [] : reveals;
  return {
    tender: openedTender,
    bids: sealedBids,
    reveals: shownReveals,
    evaluations: [],
    awards: [],
    audited: audit([openedTender, ...sealedBids, ...shownReveals]),
    documentCheck: "matches",
    now: new Date(eat(state === "sealed" ? "2026-09-30T14:02:00" : "2026-10-28T16:00:00")),
  };
}
