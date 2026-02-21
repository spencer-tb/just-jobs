/**
 * Test the LLM extraction on a real job page.
 * Run with: npx tsx scripts/test-llm-extractor.ts <url>
 *
 * Examples:
 *   npx tsx scripts/test-llm-extractor.ts https://www.charityjob.co.uk/jobs/some-job-posting
 *   npx tsx scripts/test-llm-extractor.ts https://goodmoves.com/jobs/some-job-posting
 *
 * Requires ANTHROPIC_API_KEY in .env.local
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { fetchPageText } from "../src/lib/aggregator/page-fetcher";
import { extractJobFromText } from "../src/lib/aggregator/llm-extractor";
import { getNiche } from "../src/lib/niche";

async function main() {
  const url = process.argv[2];
  if (!url) {
    console.error("Usage: npx tsx scripts/test-llm-extractor.ts <job-page-url>");
    process.exit(1);
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY not set in .env.local");
    process.exit(1);
  }

  const niche = getNiche();
  console.log(`Niche: ${niche.id}\n`);

  console.log(`Fetching ${url}...`);
  const pageText = await fetchPageText(url);
  console.log(`Page text: ${pageText.length} chars\n`);
  console.log(`Preview: ${pageText.slice(0, 300)}...\n`);

  console.log("Extracting via Claude Haiku...\n");
  const result = await extractJobFromText(pageText, url, niche);

  if (!result) {
    console.log("No job posting found on this page.");
    return;
  }

  console.log("=== Extracted Job ===");
  console.log(`Title: ${result.job.title}`);
  console.log(`Org: ${result.job.hiringOrganization.name}`);
  console.log(`Location: ${result.job.jobLocation?.address || "N/A"}`);
  console.log(`Remote: ${result.job.jobLocationType === "TELECOMMUTE" ? "Yes" : "No"}`);
  console.log(`Type: ${result.job.employmentType || "N/A"}`);
  console.log(`Posted: ${result.job.datePosted || "N/A"}`);
  console.log(`Closes: ${result.job.validThrough || "N/A"}`);

  if (result.job.baseSalary) {
    const s = result.job.baseSalary;
    console.log(`Salary: ${s.currency} ${s.minValue}–${s.maxValue} / ${s.unitText}`);
  } else {
    console.log("Salary: N/A");
  }

  console.log(`Skills: ${result.job.skills.join(", ") || "N/A"}`);
  console.log(`Industry: ${result.job.industry || "N/A"}`);
  console.log(`\n=== Tags (semantic) ===`);
  console.log(result.tags.length > 0 ? result.tags.join(", ") : "No tags matched");

  console.log(`\n=== Full JSON ===`);
  console.log(JSON.stringify(result.job, null, 2));
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
