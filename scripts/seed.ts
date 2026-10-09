// Seeds the demo data through src/services/amanadb.ts and the app's own bid-opening logic.
// Run through the wallet: `pnpm seed`. Idempotent: users and tenders that already exist are
// skipped, so it can be re-run.
//
//   1. Lookup indexes.
//   2. Staff and bidder accounts (password from SEED_PASSWORD, or the default printed below).
//   3. TND-2026-0142, open until 28 Oct 2026, with six sealed bids (P2).
//   4. TND-2026-0138, closed on 29 Sep 2026, with six sealed bids that the bidders have
//      revealed; Zuri Civil's reveal does not match its sealed bid (H3).
//   5. TND-2026-0139, closed, three sealed bids not yet revealed; receipts in storage/receipts/ (B5).
//   6. TND-2026-0127 and TND-2026-0121, closed, revealed, opened and fully scored by the
//      committee: both ready to award (H1, H4). Awarding one through H4 gives P4 its record.
//
// Bid reveal data (amount, document hash, salt) is what a bidder keeps from their receipt. It
// is written to storage/seed-receipts.json (git-ignored), never to AmanaDB before the reveal.
import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { openBids, submitReveal } from "@/lib/bid-opening";
import { CRITERIA, totals } from "@/lib/evaluation";
import { bidCommitment } from "@/lib/commitment";
import { hashPassword } from "@/lib/password";
import type { Tender, UserRole } from "@/lib/types";
import {
  ensureIndexes,
  ensureEvaluation,
  findTenderByReference,
  findUserByEmail,
  insertBid,
  insertTender,
  insertUser,
  saveEvaluation,
} from "@/services/amanadb";

const PASSWORD = process.env.SEED_PASSWORD || "Tender-demo-2026";
const eat = (local: string) => new Date(`${local}+03:00`).toISOString();
const RECEIPTS = path.join(process.cwd(), "storage", "seed-receipts.json");

type Receipt = { tender: string; bidKey: string; bidderName: string; amount: number; docHash: string; salt: string };

async function storeDocument(name: string, contents: string): Promise<string> {
  const bytes = Buffer.from(contents, "utf8");
  const hash = createHash("sha256").update(bytes).digest("hex");
  const dir = path.join(process.cwd(), "storage", "documents", hash);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), bytes);
  return hash;
}

async function ensureUser(email: string, name: string, role: UserRole): Promise<string> {
  const existing = await findUserByEmail(email);
  if (existing) return existing.key;
  const key = await insertUser({
    email,
    name,
    role,
    passwordHash: await hashPassword(PASSWORD),
    active: true,
    createdAt: new Date().toISOString(),
  });
  console.log(`Created ${role} ${email}`);
  return key;
}

const BIDDERS: [name: string, email: string][] = [
  ["Kilimo Works Ltd", "bids@kilimoworks.co.tz"],
  ["Mtera Builders", "tenders@mterabuilders.co.tz"],
  ["Zuri Civil", "bids@zuricivil.co.tz"],
  ["Dodoma Earthworks", "office@dodomaearthworks.co.tz"],
  ["Pemba Construction", "bids@pembaconstruction.co.tz"],
  ["Tanga Roads Co", "tenders@tangaroads.co.tz"],
];

async function seedTender(
  tender: Omit<Tender, "docHash" | "docName" | "publishedBy">,
  publishedBy: string,
  noticeLines: string[],
): Promise<{ key: string; created: boolean }> {
  const existing = await findTenderByReference(tender.reference);
  if (existing) {
    console.log(`Tender ${tender.reference} exists (${existing.key}), skipped`);
    return { key: existing.key, created: false };
  }
  const docName = `${tender.reference}-notice.txt`;
  const docHash = await storeDocument(docName, noticeLines.join("\n"));
  const key = await insertTender({ ...tender, docHash, docName, publishedBy });
  console.log(`Published tender ${tender.reference} (${key})`);
  return { key, created: true };
}

async function sealBids(
  tenderKey: string,
  reference: string,
  bids: { bidderName: string; bidderId: string; amount: number; submittedAt: string }[],
): Promise<Receipt[]> {
  const receipts: Receipt[] = [];
  for (const bid of bids) {
    const docHash = await storeDocument(
      `${bid.bidderName.replace(/\W+/g, "-")}-${reference}-bid.txt`,
      `${bid.bidderName} bid for ${reference}`,
    );
    const salt = randomBytes(16).toString("hex");
    const commitment = await bidCommitment({ amount: bid.amount, docHash, salt });
    const bidKey = await insertBid({
      tenderId: tenderKey,
      bidderId: bid.bidderId,
      bidderName: bid.bidderName,
      commitment,
      submittedAt: bid.submittedAt,
    });
    receipts.push({ tender: reference, bidKey, bidderName: bid.bidderName, amount: bid.amount, docHash, salt });
    console.log(`Sealed bid ${bidKey} from ${bid.bidderName}`);
  }
  return receipts;
}

/**
 * A closed tender whose bids were sealed, revealed (all matching), opened and scored by the
 * committee: the state H4 starts from. Scores are one row per bid, in CRITERIA order.
 */
async function seedScoredTender(
  tender: Omit<Tender, "docHash" | "docName" | "publishedBy" | "status">,
  people: { peAdmin: string; evaluators: { userId: string; name: string }[]; bidderIds: Map<string, string> },
  bids: { bidderName: string; amount: number; submittedAt: string; scores: number[] }[],
): Promise<Receipt[]> {
  const created = await seedTender({ ...tender, status: "PUBLISHED" }, people.peAdmin, [
    `Tender notice ${tender.reference}`,
    tender.entity,
    tender.title,
  ]);
  if (!created.created) return [];
  const receipts = await sealBids(
    created.key,
    tender.reference,
    bids.map((b) => ({ bidderName: b.bidderName, bidderId: people.bidderIds.get(b.bidderName)!, amount: b.amount, submittedAt: b.submittedAt })),
  );
  for (const r of receipts) await submitReveal({ bidKey: r.bidKey, amount: r.amount, docHash: r.docHash, salt: r.salt });
  await openBids(created.key, { userId: people.peAdmin, name: "Joseph Mwangi", email: "pe.admin@works.go.tz", role: "pe_admin" });
  for (const [i, r] of receipts.entries()) {
    const scores = bids[i]!.scores;
    const evaluator = people.evaluators[i % people.evaluators.length]!;
    const empty = await ensureEvaluation(r.bidKey, {
      tenderId: created.key,
      bidId: r.bidKey,
      evaluatorId: "",
      evaluatorName: "",
      criteria: CRITERIA.map((c) => ({ name: c.name, weight: c.weight, score: null, comment: "" })),
      comment: "",
      total: 0,
    });
    await saveEvaluation(
      empty.key,
      {
        ...empty.data,
        evaluatorId: evaluator.userId,
        evaluatorName: evaluator.name,
        criteria: CRITERIA.map((c, k) => ({ name: c.name, weight: c.weight, score: scores[k] ?? null, comment: "" })),
        comment: "Scored against the published criteria.",
        total: Math.round(totals(scores).weightedTotal * 10) / 10,
      },
      empty.version,
    );
  }
  console.log(`Opened and scored ${tender.reference} (${created.key})`);
  return receipts;
}

async function main() {
  await ensureIndexes();
  console.log("Lookup indexes are ready");

  const peAdmin = await ensureUser("pe.admin@works.go.tz", "Joseph Mwangi", "pe_admin");
  const amina = await ensureUser("amina.mussa@works.go.tz", "Amina Mussa", "evaluator");
  const baraka = await ensureUser("baraka.said@works.go.tz", "Baraka Said", "evaluator");
  await ensureUser("audit@nao.go.tz", "Neema Kato", "auditor");
  const bidderIds = new Map<string, string>();
  for (const [name, email] of BIDDERS) bidderIds.set(name, await ensureUser(email, name, "bidder"));

  let receipts: Receipt[] = [];
  try {
    receipts = JSON.parse(await readFile(RECEIPTS, "utf8")).receipts ?? [];
  } catch {
    receipts = [];
  }

  // TND-2026-0142: open until 28 Oct 2026 (P2). Bids are stamped with the time they are sealed.
  const open = await seedTender(
    {
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
    },
    peAdmin,
    [
      "Tender notice TND-2026-0142",
      "Ministry of Works",
      "Road rehabilitation, Dodoma to Mtera section",
      "Budget ceiling: TZS 2,450,000,000",
      "Closing: 28 Oct 2026, 14:00 (East Africa Time)",
    ],
  );
  if (open.created) {
    const amounts = [2310000000, 2260500000, 1980000000, 2180000000, 2420000000, 2105000000];
    receipts.push(
      ...(await sealBids(
        open.key,
        "TND-2026-0142",
        BIDDERS.map(([name], i) => ({
          bidderName: name,
          bidderId: bidderIds.get(name)!,
          amount: amounts[i]!,
          submittedAt: new Date().toISOString(),
        })),
      )),
    );
  }

  // TND-2026-0138: closed on 29 Sep 2026, 14:00 (H3). Bids were sealed before the closing time.
  const closed = await seedTender(
    {
      reference: "TND-2026-0138",
      title: "Road maintenance, Kondoa to Babati section",
      description:
        "Periodic maintenance of 118 km of the Kondoa to Babati road: pothole patching, regravelling of shoulders and culvert cleaning.",
      entity: "Ministry of Works",
      category: "Works and infrastructure",
      budgetCeiling: 2500000000,
      openDate: eat("2026-09-01T09:00:00"),
      closeDate: eat("2026-09-29T14:00:00"),
      status: "PUBLISHED",
    },
    peAdmin,
    [
      "Tender notice TND-2026-0138",
      "Ministry of Works",
      "Road maintenance, Kondoa to Babati section",
      "Budget ceiling: TZS 2,500,000,000",
      "Closing: 29 Sep 2026, 14:00 (East Africa Time)",
    ],
  );
  if (closed.created) {
    const sealed: [string, number, string][] = [
      ["Kilimo Works Ltd", 2310000000, "2026-09-22T11:20:00"],
      ["Mtera Builders", 2260500000, "2026-09-24T12:45:00"],
      ["Zuri Civil", 1980000000, "2026-09-25T13:10:00"],
      ["Dodoma Earthworks", 2180000000, "2026-09-26T13:30:00"],
      ["Pemba Construction", 2420000000, "2026-09-28T13:45:00"],
      ["Tanga Roads Co", 2105000000, "2026-09-29T13:58:00"],
    ];
    const closedReceipts = await sealBids(
      closed.key,
      "TND-2026-0138",
      sealed.map(([name, amount, at]) => ({ bidderName: name, bidderId: bidderIds.get(name)!, amount, submittedAt: eat(at) })),
    );
    receipts.push(...closedReceipts);

    // Each bidder reveals from their receipt through the app's own reveal logic. Zuri Civil
    // reveals a lower amount than it sealed, so its reveal does not match.
    for (const receipt of closedReceipts) {
      const amount = receipt.bidderName === "Zuri Civil" ? 1950000000 : receipt.amount;
      const { verified } = await submitReveal({ bidKey: receipt.bidKey, amount, docHash: receipt.docHash, salt: receipt.salt });
      console.log(`Revealed ${receipt.bidderName}: ${verified ? "matches" : "does not match"}`);
    }
  }

  // TND-2026-0139: closed on 30 Sep 2026, 10:00, bids sealed but NOT revealed (B5). Each
  // bidder's receipt (the B4 download) goes to storage/receipts/ and their bid document to
  // storage/bid-documents/, as if both were still on the bidder's own computer.
  const unrevealed = await seedTender(
    {
      reference: "TND-2026-0139",
      title: "Laboratory equipment, Muhimbili National Hospital",
      description:
        "Supply, installation and commissioning of clinical chemistry and haematology analysers for the central laboratory.",
      entity: "Muhimbili National Hospital",
      category: "Goods",
      budgetCeiling: 450000000,
      openDate: eat("2026-09-02T09:00:00"),
      closeDate: eat("2026-09-30T10:00:00"),
      status: "PUBLISHED",
    },
    peAdmin,
    ["Tender notice TND-2026-0139", "Muhimbili National Hospital", "Laboratory equipment", "Budget ceiling: TZS 450,000,000", "Closing: 30 Sep 2026, 10:00 (East Africa Time)"],
  );
  if (unrevealed.created) {
    const bidDocs = path.join(process.cwd(), "storage", "bid-documents");
    const receiptsDir = path.join(process.cwd(), "storage", "receipts");
    await mkdir(bidDocs, { recursive: true });
    await mkdir(receiptsDir, { recursive: true });
    const sealedLab: [string, number, string][] = [
      ["Mtera Builders", 412000000, "2026-09-26T10:15:00"],
      ["Pemba Construction", 398500000, "2026-09-28T15:40:00"],
      ["Tanga Roads Co", 431000000, "2026-09-29T09:05:00"],
    ];
    for (const [i, [name, amount, at]] of sealedLab.entries()) {
      const docName = `${name.replace(/\W+/g, "-")}-TND-2026-0139-bid.pdf`;
      const bytes = Buffer.from(`%PDF-1.4\n% ${name} bid for TND-2026-0139\n%%EOF\n`, "utf8");
      const docHash = createHash("sha256").update(bytes).digest("hex");
      await writeFile(path.join(bidDocs, docName), bytes);
      const salt = randomBytes(16).toString("hex");
      const commitment = await bidCommitment({ amount, docHash, salt });
      const bidReference = `BID-2026-0139-${String(i + 1).padStart(3, "0")}`;
      const bidKey = await insertBid({
        tenderId: unrevealed.key,
        bidderId: bidderIds.get(name)!,
        bidderName: name,
        commitment,
        submittedAt: eat(at),
        reference: bidReference,
      });
      const receipt = {
        tender: "TND-2026-0139",
        tenderTitle: "Laboratory equipment, Muhimbili National Hospital",
        tenderKey: unrevealed.key,
        bidKey,
        bidReference,
        amount,
        docHash,
        docName,
        salt,
        commitment,
        submittedAt: eat(at),
      };
      await writeFile(path.join(receiptsDir, `receipt-${bidReference}.json`), JSON.stringify(receipt, null, 2));
      console.log(`Sealed bid ${bidReference} from ${name} (receipt in storage/receipts/)`);
    }
  }

  // TND-2026-0127 and TND-2026-0121: opened and fully scored, ready to award (H1, H4, P4).
  const people = {
    peAdmin,
    evaluators: [
      { userId: amina, name: "Amina Mussa" },
      { userId: baraka, name: "Baraka Said" },
    ],
    bidderIds,
  };
  receipts.push(
    ...(await seedScoredTender(
      {
        reference: "TND-2026-0127",
        title: "Supply of school desks, Mwanza Region",
        description: "Supply and delivery of 4,800 two-seater hardwood desks to 32 primary schools in Mwanza Region.",
        entity: "Ministry of Works",
        category: "Goods",
        budgetCeiling: 520000000,
        openDate: eat("2026-08-25T09:00:00"),
        closeDate: eat("2026-09-22T10:00:00"),
      },
      people,
      [
        { bidderName: "Mtera Builders", amount: 468000000, submittedAt: eat("2026-09-15T09:30:00"), scores: [17, 16, 15, 14, 16] },
        { bidderName: "Kilimo Works Ltd", amount: 455000000, submittedAt: eat("2026-09-18T14:10:00"), scores: [15, 15, 16, 17, 14] },
        { bidderName: "Pemba Construction", amount: 497500000, submittedAt: eat("2026-09-21T16:45:00"), scores: [14, 13, 14, 12, 15] },
      ],
    )),
    ...(await seedScoredTender(
      {
        reference: "TND-2026-0121",
        title: "Bridge repair, Wami River crossing",
        description: "Repair of the deck, bearings and approach slabs of the Wami River bridge on the Chalinze to Segera road.",
        entity: "Ministry of Works",
        category: "Works and infrastructure",
        budgetCeiling: 1850000000,
        openDate: eat("2026-08-10T09:00:00"),
        closeDate: eat("2026-09-08T14:00:00"),
      },
      people,
      [
        { bidderName: "Dodoma Earthworks", amount: 1720000000, submittedAt: eat("2026-09-01T11:00:00"), scores: [16, 17, 16, 15, 17] },
        { bidderName: "Tanga Roads Co", amount: 1645000000, submittedAt: eat("2026-09-04T10:20:00"), scores: [15, 16, 15, 17, 15] },
        { bidderName: "Zuri Civil", amount: 1790000000, submittedAt: eat("2026-09-07T15:35:00"), scores: [13, 14, 15, 13, 14] },
      ],
    )),
  );

  await mkdir(path.dirname(RECEIPTS), { recursive: true });
  await writeFile(RECEIPTS, JSON.stringify({ receipts }, null, 2));
  console.log(`\nAccounts use the password ${process.env.SEED_PASSWORD ? "from SEED_PASSWORD" : `"${PASSWORD}"`}.`);
  console.log(`Case file:   /tenders/${open.key}`);
  console.log(`Bid opening: /entity/tenders/${closed.key}/open  (sign in as pe.admin@works.go.tz)`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
