// Optional project setup: creates any missing AmanaDB lookup indexes (INDEXES in
// src/services/amanadb-helpers.ts) up front. The app also does this on its first lookup, so this
// only moves the one-time index writes off the first request. Run through the wallet: `pnpm setup`.
import { ensureIndexes } from "@/services/amanadb";

ensureIndexes()
  .then((created) => {
    for (const c of created) console.log(`Indexed ${c.collection}.${c.field} (${c.indexed} records)`);
    console.log(created.length ? "Lookup indexes are ready" : "Lookup indexes were already there");
  })
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
