// One-time project setup: declares the AmanaDB lookup indexes the app queries by (tenderId on
// bids, bid_reveals, evaluations and awards). Idempotent. Run through the wallet: `pnpm setup`.
import { defineIndexes } from "@/services/amanadb";

defineIndexes()
  .then(() => console.log("Lookup indexes on tenderId are defined"))
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
