import type { NicheConfig, RawJob } from "../types";
import { fetchReliefWebJobs } from "./reliefweb";
import { fetchGreenhouseJobs, fetchGreenhouseBoardName } from "./greenhouse";
import { fetchLeverJobs, fetchLeverCompanyName } from "./lever";
import { fetchAshbyJobs } from "./ashby";
import { fetchSmartRecruitersJobs } from "./smartrecruiters";
import { fetchSerperJobs } from "./serper";
import { fetchGoogleCseBatch } from "./google-cse";
import { scrapeJobUrls } from "./scraper";
import { generateFingerprint } from "../fingerprint";
import { tagJob } from "../tags";
import { getSupabaseAdmin } from "../supabase";

/**
 * Run the full aggregation pipeline for a niche.
 * Fetches from all configured sources, deduplicates, tags, and stores.
 */
export async function aggregateForNiche(niche: NicheConfig): Promise<{
  fetched: number;
  inserted: number;
  duplicates: number;
  errors: string[];
}> {
  const rawJobs: RawJob[] = [];
  // Jobs from the LLM scraper come with their own semantic tags
  const llmTags = new Map<string, string[]>();
  const errors: string[] = [];

  // 1. ReliefWeb API
  for (const source of niche.apiSources) {
    if (source.type === "reliefweb") {
      try {
        const jobs = await fetchReliefWebJobs(source.filters);
        rawJobs.push(...jobs);
        console.log(`ReliefWeb: fetched ${jobs.length} jobs`);
      } catch (e) {
        const msg = `ReliefWeb error: ${e instanceof Error ? e.message : e}`;
        console.error(msg);
        errors.push(msg);
      }
    }
  }

  // 2. Greenhouse boards
  for (const board of niche.atsBoards.greenhouse) {
    try {
      const jobs = await fetchGreenhouseJobs(board);
      if (jobs.length > 0) {
        const companyName = await fetchGreenhouseBoardName(board);
        for (const job of jobs) {
          job.hiringOrganization.name = companyName;
        }
      }
      rawJobs.push(...jobs);
      console.log(`Greenhouse [${board}]: fetched ${jobs.length} jobs`);
    } catch (e) {
      const msg = `Greenhouse [${board}] error: ${e instanceof Error ? e.message : e}`;
      console.error(msg);
      errors.push(msg);
    }
  }

  // 3. Lever companies
  for (const company of niche.atsBoards.lever) {
    try {
      const jobs = await fetchLeverJobs(company);
      if (jobs.length > 0) {
        const companyName = await fetchLeverCompanyName(company);
        for (const job of jobs) {
          job.hiringOrganization.name = companyName;
        }
      }
      rawJobs.push(...jobs);
      console.log(`Lever [${company}]: fetched ${jobs.length} jobs`);
    } catch (e) {
      const msg = `Lever [${company}] error: ${e instanceof Error ? e.message : e}`;
      console.error(msg);
      errors.push(msg);
    }
  }

  // 4. Ashby boards
  for (const board of niche.atsBoards.ashby || []) {
    try {
      const jobs = await fetchAshbyJobs(board);
      rawJobs.push(...jobs);
      console.log(`Ashby [${board}]: fetched ${jobs.length} jobs`);
    } catch (e) {
      const msg = `Ashby [${board}] error: ${e instanceof Error ? e.message : e}`;
      console.error(msg);
      errors.push(msg);
    }
  }

  // 5. SmartRecruiters boards
  for (const board of niche.atsBoards.smartrecruiters || []) {
    try {
      const jobs = await fetchSmartRecruitersJobs(board);
      rawJobs.push(...jobs);
      console.log(`SmartRecruiters [${board}]: fetched ${jobs.length} jobs`);
    } catch (e) {
      const msg = `SmartRecruiters [${board}] error: ${e instanceof Error ? e.message : e}`;
      console.error(msg);
      errors.push(msg);
    }
  }

  // 6. Google CSE — free 100 queries/day (preferred over Serper for free tier)
  if (niche.serpQueries?.length && process.env.GOOGLE_CSE_API_KEY) {
    try {
      const jobs = await fetchGoogleCseBatch(niche.serpQueries, { dateRestrict: "m1" });
      rawJobs.push(...jobs);
      console.log(`Google CSE: fetched ${jobs.length} jobs from ${niche.serpQueries.length} queries`);
    } catch (e) {
      const msg = `Google CSE error: ${e instanceof Error ? e.message : e}`;
      console.error(msg);
      errors.push(msg);
    }
  }

  // 7. Serper SERP results (fallback if Google CSE not configured)
  if (niche.serpQueries?.length && !process.env.GOOGLE_CSE_API_KEY) {
    for (const query of niche.serpQueries) {
      try {
        const jobs = await fetchSerperJobs(query);
        rawJobs.push(...jobs);
        console.log(`Serper ["${query}"]: fetched ${jobs.length} jobs`);
      } catch (e) {
        const msg = `Serper ["${query}"] error: ${e instanceof Error ? e.message : e}`;
        console.error(msg);
        errors.push(msg);
      }
    }
  }

  // 8. LLM Scraper — fetch + extract individual job page URLs
  if (niche.scraperUrls && niche.scraperUrls.length > 0 && !process.env.ANTHROPIC_API_KEY) {
    console.warn(`Skipping ${niche.scraperUrls.length} scraper URLs: ANTHROPIC_API_KEY not set`);
  }
  if (niche.scraperUrls && niche.scraperUrls.length > 0 && process.env.ANTHROPIC_API_KEY) {
    try {
      console.log(`\nScraper: processing ${niche.scraperUrls.length} URLs via LLM...`);
      const { results, errors: scrapeErrors } = await scrapeJobUrls(
        niche.scraperUrls,
        niche,
      );
      for (const { job, tags } of results) {
        rawJobs.push(job);
        llmTags.set(job.source_id, tags);
      }
      errors.push(...scrapeErrors);
      console.log(`Scraper: extracted ${results.length} jobs, ${scrapeErrors.length} errors`);
    } catch (e) {
      const msg = `Scraper error: ${e instanceof Error ? e.message : e}`;
      console.error(msg);
      errors.push(msg);
    }
  }

  console.log(`\nTotal fetched: ${rawJobs.length} raw jobs`);

  // 9. Process: fingerprint, tag, deduplicate, store
  const supabase = getSupabaseAdmin();
  let inserted = 0;
  let duplicates = 0;

  for (const raw of rawJobs) {
    const fingerprint = generateFingerprint(raw);

    // Use LLM-extracted tags if available, fall back to keyword matching
    const tags = llmTags.get(raw.source_id) ?? tagJob(raw, niche.tags);

    const row = {
      niche: niche.id,
      source: raw.source,
      source_id: raw.source_id,
      scraped_at: new Date().toISOString(),
      status: "active",
      fingerprint,
      tags: JSON.stringify(tags),
      title: raw.title,
      description: raw.description || null,
      date_posted: raw.datePosted,
      valid_through: raw.validThrough,
      employment_type: raw.employmentType,
      org_name: raw.hiringOrganization.name,
      org_url: raw.hiringOrganization.sameAs,
      org_logo: raw.hiringOrganization.logo,
      location_address: raw.jobLocation?.address || null,
      location_postal_code: raw.jobLocation?.postalCode || null,
      location_region: raw.jobLocation?.addressRegion || null,
      location_country: raw.jobLocation?.addressCountry || null,
      job_location_type: raw.jobLocationType,
      salary_currency: raw.baseSalary?.currency || null,
      salary_min: raw.baseSalary?.minValue || null,
      salary_max: raw.baseSalary?.maxValue || null,
      salary_unit: raw.baseSalary?.unitText || null,
      apply_url: raw.applyUrl,
      skills: JSON.stringify(raw.skills),
      industry: raw.industry,
    };

    const { error } = await supabase.from("jobs").upsert(row, {
      onConflict: "source,source_id",
      ignoreDuplicates: true,
    });

    if (error) {
      if (error.code === "23505") {
        duplicates++;
      } else {
        errors.push(`DB insert error: ${error.message}`);
      }
    } else {
      inserted++;
    }
  }

  return { fetched: rawJobs.length, inserted, duplicates, errors };
}
