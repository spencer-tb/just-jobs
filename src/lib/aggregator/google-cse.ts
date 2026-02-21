import type { RawJob } from "../types";
import { isJobBoardUrl, JOB_BOARDS } from "../job-boards";

/**
 * Google Custom Search Engine (CSE) adapter.
 *
 * Uses the Google Custom Search JSON API to discover job listings.
 * Free tier: 100 queries/day (forever free, no credit card required).
 *
 * Setup:
 * 1. Create a project at https://console.cloud.google.com
 * 2. Enable "Custom Search API"
 * 3. Create a Programmable Search Engine at https://programmablesearchengine.google.com
 *    - Enable "Search the entire web"
 * 4. Get your API key from Google Cloud Console
 * 5. Set GOOGLE_CSE_API_KEY and GOOGLE_CSE_CX in .env.local
 *
 * Compared to Serper.dev:
 *   - Google CSE: 100 free queries/day forever
 *   - Serper.dev: 2,500 free total, then $50/month
 */

interface GoogleCseItem {
  title: string;
  link: string;
  snippet?: string;
  displayLink?: string;
  pagemap?: {
    metatags?: Array<Record<string, string>>;
  };
}

interface GoogleCseResponse {
  items?: GoogleCseItem[];
  searchInformation?: {
    totalResults: string;
  };
  queries?: {
    request?: Array<{ totalResults: string }>;
    nextPage?: Array<{ startIndex: number }>;
  };
}

const CSE_API = "https://www.googleapis.com/customsearch/v1";

/**
 * Search Google for job listings matching a query.
 * Returns RawJob[] with basic info from search results.
 * These are typically fed into the LLM extractor for full data.
 *
 * @param query - Search query (e.g., "charity project manager jobs UK")
 * @param options - Optional: dateRestrict, siteSearch, num
 */
export async function fetchGoogleCseJobs(
  query: string,
  options?: {
    /** Restrict results by date (e.g., "m1" = past month, "w1" = past week) */
    dateRestrict?: string;
    /** Restrict to a specific site (e.g., "boards.greenhouse.io") */
    siteSearch?: string;
    /** Number of results (1-10, default 10) */
    num?: number;
  },
): Promise<RawJob[]> {
  const apiKey = process.env.GOOGLE_CSE_API_KEY;
  const cx = process.env.GOOGLE_CSE_CX;

  if (!apiKey || !cx) {
    console.warn(
      "Skipping Google CSE: GOOGLE_CSE_API_KEY or GOOGLE_CSE_CX not set. " +
      "Set up at https://programmablesearchengine.google.com (100 free queries/day)",
    );
    return [];
  }

  const params = new URLSearchParams({
    key: apiKey,
    cx,
    q: query,
    num: String(options?.num || 10),
  });

  if (options?.dateRestrict) {
    params.set("dateRestrict", options.dateRestrict);
  }
  if (options?.siteSearch) {
    params.set("siteSearch", options.siteSearch);
    params.set("siteSearchFilter", "i"); // include only this site
  }

  const response = await fetch(`${CSE_API}?${params}`);

  if (!response.ok) {
    if (response.status === 429) {
      console.warn("Google CSE: daily quota exceeded (100 queries/day on free tier)");
      return [];
    }
    throw new Error(`Google CSE API error: ${response.status} ${response.statusText}`);
  }

  const data: GoogleCseResponse = await response.json();

  if (!data.items || data.items.length === 0) {
    return [];
  }

  return data.items
    .filter((item) => isJobListing(item))
    .map((item) => ({
      title: cleanTitle(item.title),
      description: item.snippet || null,
      datePosted: null,
      validThrough: null,
      employmentType: null,
      hiringOrganization: {
        name: extractCompany(item.title, item.link),
        sameAs: null,
        logo: null,
      },
      jobLocation: null,
      jobLocationType: detectRemote(item) ? "TELECOMMUTE" as const : null,
      baseSalary: null,
      applyUrl: item.link,
      source: "google_cse" as const,
      source_id: `gcse-${hashString(item.link)}`,
      skills: [],
      industry: null,
    }));
}

/**
 * Run multiple search queries with a budget limit.
 * Useful for running all niche serpQueries within the daily quota.
 */
export async function fetchGoogleCseBatch(
  queries: string[],
  options?: {
    dateRestrict?: string;
    maxQueries?: number;
  },
): Promise<RawJob[]> {
  const maxQueries = options?.maxQueries || 20; // Conservative default to stay within free tier
  const queriesToRun = queries.slice(0, maxQueries);
  const allJobs: RawJob[] = [];
  const seenUrls = new Set<string>();

  for (const query of queriesToRun) {
    try {
      const jobs = await fetchGoogleCseJobs(query, {
        dateRestrict: options?.dateRestrict || "m1", // Default to past month
      });

      for (const job of jobs) {
        if (!seenUrls.has(job.applyUrl)) {
          seenUrls.add(job.applyUrl);
          allJobs.push(job);
        }
      }

      console.log(`Google CSE ["${query}"]: ${jobs.length} results`);
    } catch (e) {
      console.error(`Google CSE ["${query}"] error: ${e instanceof Error ? e.message : e}`);
    }
  }

  return allJobs;
}

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function isJobListing(item: GoogleCseItem): boolean {
  const url = item.link.toLowerCase();
  const title = item.title.toLowerCase();

  if (isJobBoardUrl(item.link)) return true;

  const jobUrlPatterns = [
    "/jobs/", "/job/", "/careers/", "/career/",
    "/positions/", "/position/", "/openings/",
    "/vacancies/", "/vacancy/", "/apply",
    "/postings/",
  ];

  const jobTitleKeywords = [
    "job", "hiring", "position", "opening",
    "career", "vacancy", "apply",
    "we're hiring", "join our team",
  ];

  return (
    jobUrlPatterns.some((p) => url.includes(p)) ||
    jobTitleKeywords.some((k) => title.includes(k))
  );
}

function extractCompany(title: string, link: string): string {
  const separators = [" - ", " | ", " at ", " @ "];
  for (const sep of separators) {
    const parts = title.split(sep);
    if (parts.length >= 2) {
      const candidate = parts[parts.length - 1].trim();
      if (!isKnownJobBoard(candidate)) {
        return candidate;
      }
      if (parts.length >= 3) {
        return parts[parts.length - 2].trim();
      }
    }
  }

  try {
    const hostname = new URL(link).hostname.replace("www.", "");
    return hostname.split(".")[0];
  } catch {
    return "Unknown";
  }
}

function cleanTitle(title: string): string {
  const boardNames = JOB_BOARDS.map((b) => b.name).join("|");
  const pattern = new RegExp(` [-|–] (${boardNames})$`, "i");
  return title.replace(pattern, "").trim();
}

function isKnownJobBoard(name: string): boolean {
  const lower = name.toLowerCase();
  return JOB_BOARDS.some(
    (b) => lower.includes(b.name.toLowerCase()) || lower.includes(b.domain.split(".")[0]),
  );
}

function detectRemote(item: GoogleCseItem): boolean {
  const text = `${item.title} ${item.snippet || ""}`.toLowerCase();
  return text.includes("remote") || text.includes("work from home");
}
