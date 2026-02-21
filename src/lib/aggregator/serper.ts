import type { RawJob } from "../types";
import { isJobBoardUrl, JOB_BOARDS } from "../job-boards";

interface SerperOrganicResult {
  title: string;
  link: string;
  snippet?: string;
  date?: string;
  position: number;
}

interface SerperResponse {
  organic?: SerperOrganicResult[];
  searchParameters?: {
    q: string;
    type: string;
  };
}

const SERPER_API = "https://google.serper.dev/search";

/**
 * Fetch job listings from Google Search via Serper.dev SERP API.
 * Uses organic search results for job-related queries.
 * Requires SERPER_API_KEY env variable. Skips gracefully if not set.
 */
export async function fetchSerperJobs(query: string): Promise<RawJob[]> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) {
    console.warn(
      "Skipping Serper: SERPER_API_KEY not set. Get one at https://serper.dev"
    );
    return [];
  }

  const response = await fetch(SERPER_API, {
    method: "POST",
    headers: {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q: query,
      num: 30,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Serper API error: ${response.status} ${response.statusText}`
    );
  }

  const data: SerperResponse = await response.json();

  if (!data.organic || data.organic.length === 0) {
    return [];
  }

  return data.organic
    .filter((result) => isJobListing(result))
    .map((result) => {
      const isRemote =
        result.title.toLowerCase().includes("remote") ||
        result.snippet?.toLowerCase().includes("remote") ||
        false;

      return {
        title: cleanTitle(result.title),
        description: result.snippet || null,
        datePosted: null,
        validThrough: null,
        employmentType: null,
        hiringOrganization: {
          name: extractCompany(result.title, result.link),
          sameAs: null,
          logo: null,
        },
        jobLocation: null,
        jobLocationType: isRemote ? "TELECOMMUTE" as const : null,
        baseSalary: null,
        applyUrl: result.link,
        source: "serper" as const,
        source_id: `serp-${hashString(result.link)}`,
        skills: [],
        industry: null,
      };
    });
}

/** Simple string hash for generating stable source IDs. */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

/** Filter out non-job organic results using the job boards registry. */
function isJobListing(result: SerperOrganicResult): boolean {
  const url = result.link.toLowerCase();
  const title = result.title.toLowerCase();

  // Check against our job boards registry first
  if (isJobBoardUrl(result.link)) return true;

  // Common job URL path patterns
  const jobUrlPatterns = [
    "/jobs/", "/job/", "/careers/", "/career/",
    "/positions/", "/position/", "/openings/", "/opening/",
    "/vacancies/", "/vacancy/", "/apply",
  ];

  // Job-related title keywords
  const jobTitleKeywords = [
    "job", "hiring", "position", "opening",
    "career", "vacancy", "apply now",
    "we're hiring", "join our team",
  ];

  const urlMatch = jobUrlPatterns.some((pattern) => url.includes(pattern));
  const titleMatch = jobTitleKeywords.some((keyword) => title.includes(keyword));

  return urlMatch || titleMatch;
}

/** Extract company name from title, using registry to identify job boards. */
function extractCompany(title: string, link: string): string {
  const separators = [" - ", " | ", " at ", " @ "];
  for (const sep of separators) {
    const parts = title.split(sep);
    if (parts.length >= 2) {
      const candidate = parts[parts.length - 1].trim();
      // Skip if it's a known job board
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

/** Clean up the title by removing trailing job board names. */
function cleanTitle(title: string): string {
  // Build regex from known job board names
  const boardNames = JOB_BOARDS.map((b) => b.name).join("|");
  const pattern = new RegExp(` [-|–] (${boardNames})$`, "i");
  return title.replace(pattern, "").trim();
}

/** Check if a name is a known job board rather than an employer. */
function isKnownJobBoard(name: string): boolean {
  const lower = name.toLowerCase();
  return JOB_BOARDS.some(
    (b) => lower.includes(b.name.toLowerCase()) || lower.includes(b.domain.split(".")[0])
  );
}
