/**
 * Test script to verify data sources work WITHOUT needing Supabase.
 * Run with: npx tsx scripts/test-sources.ts
 *
 * This is useful for validating ATS board tokens and API responses
 * before setting up the database.
 */

import { fetchReliefWebJobs } from "../src/lib/aggregator/reliefweb";
import { fetchGreenhouseJobs, fetchGreenhouseBoardName } from "../src/lib/aggregator/greenhouse";
import { fetchLeverJobs } from "../src/lib/aggregator/lever";
import { fetchAshbyJobs } from "../src/lib/aggregator/ashby";
import { fetchSerperJobs } from "../src/lib/aggregator/serper";

async function main() {
  console.log("=== Testing Data Sources ===\n");

  // Test ReliefWeb
  console.log("--- ReliefWeb ---");
  try {
    const rwJobs = await fetchReliefWebJobs();
    console.log(`Fetched ${rwJobs.length} jobs`);
    if (rwJobs.length > 0) {
      console.log(`Sample: "${rwJobs[0].title}" at ${rwJobs[0].hiringOrganization.name}`);
      console.log(`URL: ${rwJobs[0].applyUrl}`);
    }
  } catch (e) {
    console.error(`Error: ${e}`);
  }

  // Test a few Greenhouse boards
  const testBoards = ["rescue", "greenpeace", "aclu", "humanrightswatch", "acumen"];
  for (const board of testBoards) {
    console.log(`\n--- Greenhouse: ${board} ---`);
    try {
      const jobs = await fetchGreenhouseJobs(board);
      const name = await fetchGreenhouseBoardName(board);
      console.log(`Company: ${name}, Jobs: ${jobs.length}`);
      if (jobs.length > 0) {
        console.log(`Sample: "${jobs[0].title}" — ${jobs[0].jobLocation?.address || "No location"}`);
      }
    } catch (e) {
      console.error(`Error: ${e}`);
    }
  }

  // Test Lever
  const testCompanies = ["sierraclub"];
  for (const company of testCompanies) {
    console.log(`\n--- Lever: ${company} ---`);
    try {
      const jobs = await fetchLeverJobs(company);
      console.log(`Jobs: ${jobs.length}`);
      if (jobs.length > 0) {
        console.log(`Sample: "${jobs[0].title}" — ${jobs[0].jobLocation?.address || "No location"}`);
      }
    } catch (e) {
      console.error(`Error: ${e}`);
    }
  }

  // Test Ashby
  const testAshbyBoards = ["rmi"];
  for (const board of testAshbyBoards) {
    console.log(`\n--- Ashby: ${board} ---`);
    try {
      const jobs = await fetchAshbyJobs(board);
      console.log(`Jobs: ${jobs.length}`);
      if (jobs.length > 0) {
        console.log(`Sample: "${jobs[0].title}" — ${jobs[0].jobLocation?.address || "No location"}`);
      }
    } catch (e) {
      console.error(`Error: ${e}`);
    }
  }

  // Test Serper (Google SERP)
  console.log("\n--- Serper (Google SERP) ---");
  try {
    const serpJobs = await fetchSerperJobs("NGO project manager jobs");
    console.log(`Fetched ${serpJobs.length} jobs`);
    if (serpJobs.length > 0) {
      console.log(`Sample: "${serpJobs[0].title}" at ${serpJobs[0].hiringOrganization.name}`);
      console.log(`URL: ${serpJobs[0].applyUrl}`);
    }
  } catch (e) {
    console.error(`Error: ${e}`);
  }

  console.log("\n=== Done ===");
}

main().catch(console.error);
