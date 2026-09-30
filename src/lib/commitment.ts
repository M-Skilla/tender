// Canonical JSON and SHA-256, shared by the browser (sealing a bid) and the server
// (opening bids, fingerprinting records), so both produce identical output (spec section 6).
// Uses Web Crypto only: available in browsers and in Node 20+ as globalThis.crypto.

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

/** JSON with object keys sorted at every level and no whitespace. */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortKeys(value as Json));
}

function sortKeys(value: Json): Json {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value !== null && typeof value === "object") {
    const sorted: { [key: string]: Json } = {};
    for (const key of Object.keys(value).sort()) {
      const item = value[key];
      if (item !== undefined) sorted[key] = sortKeys(item);
    }
    return sorted;
  }
  return value;
}

/** Lower-case hex SHA-256 of a UTF-8 string or raw bytes. */
export async function sha256Hex(input: string | Uint8Array): Promise<string> {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes as BufferSource);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** A bid's sealed commitment: sha256(canonicalJson({ amount, docHash, salt })) (spec section 3). */
export function bidCommitment(reveal: { amount: number; docHash: string; salt: string }): Promise<string> {
  return sha256Hex(canonicalJson({ amount: reveal.amount, docHash: reveal.docHash, salt: reveal.salt }));
}
