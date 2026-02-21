/**
 * LLM-based job extraction using Claude Haiku.
 *
 * Takes raw page text + URL and extracts a structured RawJob.
 * Also performs semantic tagging — extracts skills, industry, employment type,
 * salary, and suggests tags from the niche's tag categories.
 *
 * This replaces brittle HTML parsers with a single LLM call that handles
 * any job page format.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { NicheConfig, RawJob, JobSource } from "../types";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY not set");
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

interface ExtractionResult {
  title: string;
  description: string | null;
  datePosted: string | null;
  validThrough: string | null;
  employmentType: string | null;
  organizationName: string;
  organizationUrl: string | null;
  locationAddress: string | null;
  locationRegion: string | null;
  locationCountry: string | null;
  isRemote: boolean;
  salaryCurrency: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryUnit: string | null;
  skills: string[];
  industry: string | null;
  matchedTags: string[];
}

const EMPLOYMENT_TYPES = ["FULL_TIME", "PART_TIME", "CONTRACT", "TEMPORARY", "INTERN", "VOLUNTEER"];
const SALARY_UNITS = ["YEAR", "MONTH", "DAY", "HOUR"];

function buildPrompt(pageText: string, url: string, niche: NicheConfig): string {
  const tagCategories = Object.entries(niche.tags)
    .map(([tag, keywords]) => `  "${tag}": [${keywords.map((k) => `"${k}"`).join(", ")}]`)
    .join("\n");

  return `Extract structured job posting data from this page text. Return ONLY valid JSON, no markdown fences.

PAGE URL: ${url}

PAGE TEXT:
${pageText}

TAG CATEGORIES (match the job against these — return tag names where the job is relevant, using semantic understanding not just keyword matching):
${tagCategories}

Return this exact JSON shape:
{
  "title": "Job title",
  "description": "The FULL job description body in clean HTML. Include all duties, requirements, qualifications, benefits etc. Use <p>, <ul>, <li>, <strong>, <h3> tags for formatting. Do NOT truncate.",
  "datePosted": "ISO 8601 date or null",
  "validThrough": "ISO 8601 date or null (closing/deadline date)",
  "employmentType": one of ${JSON.stringify(EMPLOYMENT_TYPES)} or null,
  "organizationName": "Hiring company/org name",
  "organizationUrl": "Company website URL or null",
  "locationAddress": "City, region or full address or null",
  "locationRegion": "State/region/country subdivision or null",
  "locationCountry": "2-letter ISO country code or null",
  "isRemote": true/false,
  "salaryCurrency": "3-letter currency code or null (e.g. GBP, USD, EUR)",
  "salaryMin": number or null (annual equivalent, no commas),
  "salaryMax": number or null (annual equivalent, no commas),
  "salaryUnit": one of ${JSON.stringify(SALARY_UNITS)} or null,
  "skills": ["skill1", "skill2", ...] (extract 3-10 relevant skills mentioned),
  "industry": "Primary industry/sector or null",
  "matchedTags": ["tag-name", ...] (from the tag categories above, semantically matched)
}

Rules:
- Extract ONLY what's on the page. Don't invent data.
- For description, include the FULL job description with clean HTML formatting. This will be displayed on our job board, so preserve all sections (about the role, responsibilities, requirements, qualifications, benefits, how to apply). Strip out navigation, ads, cookie banners, related jobs, and unrelated page content.
- For dates, look carefully — job boards often show "Posted: 3 Feb 2025" or "Closing date: 15 Mar 2025" in small print, headers, or sidebars. Convert relative dates like "2 days ago" to ISO 8601 if possible.
- For salary, normalise to numbers (e.g. "£35k" = 35000, "$50-70k" = 50000/70000). Check for salary info in sidebars, headers, or bullet points — it may not be in the main description.
- For location, extract the most specific location given (city > region > country). If the job says "Remote" or "Work from home", set isRemote to true. A job can be BOTH remote and have a location (e.g. "Edinburgh, remote-friendly").
- For skills, extract 5-15 concrete, specific skills mentioned in requirements/qualifications (e.g. "Python", "grant writing", "PRINCE2", "stakeholder engagement"). Prefer specific skills over generic ones like "communication".
- For matchedTags, use semantic understanding — a "Climate Policy Analyst" role matches "climate" even if the exact keywords aren't present. Only return tags from the categories provided.
- If the page doesn't contain a job posting, return {"title": "", "description": null} and nulls for everything.
- Return ONLY the JSON object. No markdown fences, no explanation, no text before or after.`;
}

/**
 * Extract a structured RawJob from page text using Claude Haiku.
 */
export async function extractJobFromText(
  pageText: string,
  url: string,
  niche: NicheConfig,
  source: JobSource = "scraper",
): Promise<{ job: RawJob; tags: string[] } | null> {
  const anthropic = getClient();

  const prompt = buildPrompt(pageText, url, niche);

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";

  // Strip markdown fences if present (LLMs sometimes add them despite instructions)
  const jsonText = text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();

  let parsed: ExtractionResult;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    console.error(`LLM extraction failed to parse JSON for ${url}`);
    console.error(`Raw response: ${text.slice(0, 300)}`);
    return null;
  }

  // Empty title means the page wasn't a job posting
  if (!parsed.title) {
    return null;
  }

  const job: RawJob = {
    title: parsed.title,
    description: parsed.description,
    datePosted: parsed.datePosted,
    validThrough: parsed.validThrough,
    employmentType: EMPLOYMENT_TYPES.includes(parsed.employmentType || "")
      ? (parsed.employmentType as RawJob["employmentType"])
      : null,
    hiringOrganization: {
      name: parsed.organizationName || "Unknown",
      sameAs: parsed.organizationUrl,
      logo: null,
    },
    jobLocation: parsed.locationAddress || parsed.locationRegion || parsed.locationCountry
      ? {
          address: parsed.locationAddress,
          postalCode: null,
          addressRegion: parsed.locationRegion,
          addressCountry: parsed.locationCountry,
        }
      : null,
    jobLocationType: parsed.isRemote ? "TELECOMMUTE" : null,
    baseSalary: parsed.salaryCurrency && (parsed.salaryMin || parsed.salaryMax)
      ? {
          currency: parsed.salaryCurrency,
          minValue: parsed.salaryMin,
          maxValue: parsed.salaryMax,
          unitText: (SALARY_UNITS.includes(parsed.salaryUnit || "") ? parsed.salaryUnit : "YEAR") as "YEAR" | "MONTH" | "DAY" | "HOUR",
        }
      : null,
    applyUrl: url,
    source,
    source_id: `llm-${hashUrl(url)}`,
    skills: Array.isArray(parsed.skills) ? parsed.skills.slice(0, 15) : [],
    industry: parsed.industry,
  };

  const tags = Array.isArray(parsed.matchedTags) ? parsed.matchedTags : [];

  return { job, tags };
}

function hashUrl(url: string): string {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}
