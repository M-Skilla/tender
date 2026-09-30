// Tamper demo (spec section 5.8, screen A2): alters a revealed bid's document on disk, the way
// someone with file-server access might, and leaves AmanaDB untouched. The case file then flags
// the bid because the stored copy no longer re-hashes to the fingerprint recorded at reveal.
//
//   pnpm tamper-demo                               alter Kilimo Works Ltd's document on TND-2026-0138
//   TAMPER_BIDDER="Zuri Civil" pnpm tamper-demo    alter another bidder's document
//   pnpm tamper-demo:restore                       put every altered document back, byte for byte
// (Restoring only touches disk, so it runs without the wallet.)
import { createHash } from "node:crypto";
import { copyFile, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { findTenderByReference, listBidsForTender, listRevealsForTender } from "@/services/amanadb";

const REFERENCE = "TND-2026-0138";
const DOCUMENTS = path.join(process.cwd(), "storage", "documents");
const BACKUPS = path.join(process.cwd(), "storage", "tamper-backups");
const sha256 = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");

async function restore() {
  let restored = 0;
  const backups = await readdir(BACKUPS).catch(() => [] as string[]);
  for (const hash of backups) {
    const [name] = await readdir(path.join(BACKUPS, hash));
    if (!name) continue;
    await copyFile(path.join(BACKUPS, hash, name), path.join(DOCUMENTS, hash, name));
    const bytes = await readFile(path.join(DOCUMENTS, hash, name));
    console.log(`Restored ${name}: ${sha256(bytes) === hash ? "matches its recorded fingerprint again" : "STILL DIFFERS"}`);
    await rm(path.join(BACKUPS, hash), { recursive: true });
    restored++;
  }
  if (!restored) console.log("Nothing to restore.");
}

async function tamper(bidderName: string) {
  const tender = await findTenderByReference(REFERENCE);
  if (!tender) throw new Error(`${REFERENCE} is not in AmanaDB. Run pnpm seed first.`);
  if (!tender.data.openedAt) throw new Error(`${REFERENCE} has not been opened, so no bid documents are recorded yet. Open its bids first.`);
  const bids = await listBidsForTender(tender.key);
  const bid = bids.find((b) => b.data.bidderName === bidderName);
  if (!bid) throw new Error(`No bid from ${bidderName} on ${REFERENCE}.`);
  const reveal = (await listRevealsForTender(tender.key)).find((r) => r.data.bidId === bid.key);
  if (!reveal) throw new Error(`${bidderName} has not revealed, so its document is not recorded.`);

  const dir = path.join(DOCUMENTS, reveal.data.docHash);
  const [name] = await readdir(dir);
  if (!name) throw new Error(`The stored document for ${bidderName} is missing.`);
  const file = path.join(dir, name);
  const backup = path.join(BACKUPS, reveal.data.docHash);
  await mkdir(backup, { recursive: true });
  await copyFile(file, path.join(backup, name));

  const before = await readFile(file);
  await writeFile(file, Buffer.concat([before, Buffer.from("\nAmended price schedule: TZS 1,900,000,000\n")]));
  const after = sha256(await readFile(file));

  console.log(`Altered ${name} on disk.`);
  console.log(`  Recorded in AmanaDB (reveal v${reveal.version}): ${reveal.data.docHash}`);
  console.log(`  Stored copy now hashes to:          ${after}`);
  console.log(`AmanaDB records are unchanged. Open /tenders/${tender.key}?event=bids to see the case file flag it.`);
  console.log(`Undo with: pnpm tamper-demo:restore`);
}

const arg = process.argv[2];
(arg === "--restore" ? restore() : tamper(process.env.TAMPER_BIDDER || arg || "Kilimo Works Ltd")).catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
