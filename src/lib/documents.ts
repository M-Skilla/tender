import "server-only";

// Off-chain document storage (spec section 3): the file goes to storage/documents/<sha256>/<name>
// on the server's disk, and only its SHA-256 is written to AmanaDB. This is file storage, not a
// database.
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { DocumentCheck } from "@/lib/types";

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

/**
 * Re-hashes a stored document (storage/documents/<docHash>/<docName>) and compares it with the
 * SHA-256 recorded in AmanaDB.
 */
export async function checkDocument(docHash: string, docName: string): Promise<DocumentCheck> {
  const file = path.join(DOCUMENTS, docHash, path.basename(docName));
  try {
    const bytes = await readFile(file);
    const actual = createHash("sha256").update(bytes).digest("hex");
    return actual === docHash ? "matches" : "does-not-match";
  } catch {
    return "missing";
  }
}

/**
 * Re-hashes the one stored file under storage/documents/<docHash>/ (used for bid documents,
 * whose file name is not recorded) and compares it with the recorded SHA-256.
 */
export async function checkStoredDocument(docHash: string): Promise<DocumentCheck> {
  try {
    const files = await readdir(path.join(DOCUMENTS, docHash));
    if (files.length !== 1) return "missing";
    return checkDocument(docHash, files[0]!);
  } catch {
    return "missing";
  }
}
