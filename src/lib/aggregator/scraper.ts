/**
 * Generic job page scraper.
 *
 * Takes a list of URLs (individual job posting pages), fetches each,
 * and runs them through the LLM extractor to get structured RawJob data.
 *
 * This is the bridge between "I have a URL to a job posting" and
 * "I have structured data in Google JobPosting format".
 *
 * Usage:
 *   const results = await scrapeJobUrls(urls, niche);
 *   // results is an array of { job: RawJob, tags: string[] }
 */

import type { NicheConfig, RawJob } from "../types";
import { fetchPageText } from "./page-fetcher";
import { extractJobFromText } from "./llm-extractor";

interface ScrapeResult {
  job: RawJob;
  tags: string[];
}

/**
 * Scrape individual job pages and extract structured data via LLM.
 * Processes URLs sequentially with a delay to be polite to servers.
 */
export async function scrapeJobUrls(
  urls: string[],
  niche: NicheConfig,
  options?: { delayMs?: number; concurrency?: number },
): Promise<{ results: ScrapeResult[]; errors: string[] }> {
  const delayMs = options?.delayMs ?? 1000;
  const results: ScrapeResult[] = [];
  const errors: string[] = [];

  for (const url of urls) {
    try {
      const pageText = await fetchPageText(url);

      if (pageText.length < 100) {
        errors.push(`${url}: page too short (${pageText.length} chars), skipping`);
        continue;
      }

      const extraction = await extractJobFromText(pageText, url, niche, "scraper");

      if (extraction) {
        results.push(extraction);
      } else {
        errors.push(`${url}: LLM could not extract a job posting`);
      }
    } catch (e) {
      errors.push(`${url}: ${e instanceof Error ? e.message : String(e)}`);
    }

    // Be polite
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return { results, errors };
}
