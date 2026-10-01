import "server-only";

// Off-chain document storage (spec section 3): the file goes to storage/documents/<sha256>/<name>
// on the server's disk, and only its SHA-256 is written to AmanaDB. This is file storage, not a
// database.
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const DOCUMENTS = path.join(process.cwd(), "storage", "documents");

export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

/** Safe file name: letters, digits, dot, dash and underscore only. */
export function safeName(name: string): string {
  const cleaned = path.basename(name).replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  return cleaned || "document";
}

export async function storeDocument(file: File): Promise<{ docHash: string; docName: string }> {
  const bytes = Buffer.from(await file.arrayBuffer());
  const docHash = createHash("sha256").update(bytes).digest("hex");
  const docName = safeName(file.name);
  const dir = path.join(DOCUMENTS, docHash);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, docName), bytes);
  return { docHash, docName };
}
