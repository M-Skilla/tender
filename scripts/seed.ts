// Seeds the P2 sample case: one published tender with its notice document, and six sealed
// bids. Run through the wallet: `pnpm seed` (see package.json).
//
// Writes only through src/services/amanadb.ts. The bid reveal data (amount, document hash,
// salt) is what each bidder would keep from their receipt; it is written to
// storage/seed-receipts.json (git-ignored) for the bid-opening task, never to AmanaDB.
import { createHash, randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { bidCommitment } from "@/lib/commitment";
import { defineIndexes, insertBid, insertTender } from "@/services/amanadb";

const eat = (local: string) => new Date(`${local}+03:00`).toISOString();

async function storeDocument(name: string, contents: string): Promise<string> {
  const bytes = Buffer.from(contents, "utf8");
  const hash = createHash("sha256").update(bytes).digest("hex");
  const dir = path.join(process.cwd(), "storage", "documents", hash);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), bytes);
  return hash;
}

async function main() {
  await defineIndexes();
  console.log("Lookup indexes on tenderId are defined");

  const noticeName = "TND-2026-0142-notice.txt";
  const docHash = await storeDocument(
    noticeName,
    [
      "Tender notice TND-2026-0142",
      "Ministry of Works",
      "Road rehabilitation, Dodoma to Mtera section",
      "Budget ceiling: TZS 2,450,000,000",
      "Closing: 28 Oct 2026, 14:00 (East Africa Time)",
    ].join("\n"),
  );

  const tenderKey = await insertTender({
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
    docHash,
    docName: noticeName,
    publishedBy: "seed-pe-admin",
  });
  console.log(`Published tender ${tenderKey}`);

  // Bids are stamped with the time they are actually sealed, so they follow publication.
  const bidders: [string, number][] = [
    ["Kilimo Works Ltd", 2310000000],
    ["Mtera Builders", 2260500000],
    ["Zuri Civil", 1980000000],
    ["Dodoma Earthworks", 2180000000],
    ["Pemba Construction", 2420000000],
    ["Tanga Roads Co", 2105000000],
  ];

  const receipts = [];
  for (const [index, [bidderName, amount]] of bidders.entries()) {
    const bidDocHash = await storeDocument(`${bidderName.replace(/\W+/g, "-")}-bid.txt`, `${bidderName} bid for TND-2026-0142`);
    const salt = randomBytes(16).toString("hex");
    const commitment = await bidCommitment({ amount, docHash: bidDocHash, salt });
    const bidKey = await insertBid({
      tenderId: tenderKey,
      bidderId: `seed-bidder-${index + 1}`,
      bidderName,
      commitment,
      submittedAt: new Date().toISOString(),
    });
    receipts.push({ bidKey, bidderName, amount, docHash: bidDocHash, salt, commitment });
    console.log(`Sealed bid ${bidKey} from ${bidderName}`);
  }

  await writeFile(
    path.join(process.cwd(), "storage", "seed-receipts.json"),
    JSON.stringify({ tenderKey, receipts }, null, 2),
  );
  console.log(`Open the case file at /tenders/${tenderKey}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
