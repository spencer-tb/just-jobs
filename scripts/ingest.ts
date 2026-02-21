/**
 * Job ingestion script.
 * Run with: npx tsx scripts/ingest.ts
 *
 * Fetches jobs from all configured sources for the current niche
 * and stores them in Supabase.
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { getNiche } from "../src/lib/niche";
import { aggregateForNiche } from "../src/lib/aggregator";

async function main() {
  const niche = getNiche();
  console.log(`\n=== Ingesting jobs for niche: ${niche.id} (${niche.name}) ===\n`);

  const result = await aggregateForNiche(niche);

  console.log(`\n=== Results ===`);
  console.log(`Fetched:    ${result.fetched}`);
  console.log(`Inserted:   ${result.inserted}`);
  console.log(`Duplicates: ${result.duplicates}`);

  if (result.errors.length > 0) {
    console.log(`\nErrors (${result.errors.length}):`);
    result.errors.forEach((e) => console.log(`  - ${e}`));
  }

  console.log(`\nDone.`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
