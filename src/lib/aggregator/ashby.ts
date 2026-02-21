import type { RawJob, EmploymentType } from "../types";

interface AshbyJob {
  id: string;
  title: string;
  location: string;
  departmentName?: string;
  teamName?: string;
  employmentType?: string;
  isRemote: boolean;
  publishedDate: string;
  descriptionHtml?: string;
  descriptionPlain?: string;
  jobUrl: string;
  isListed: boolean;
}

interface AshbyResponse {
  jobs: AshbyJob[];
}

const EMPLOYMENT_MAP: Record<string, EmploymentType> = {
  "fulltime": "FULL_TIME",
  "full-time": "FULL_TIME",
  "full_time": "FULL_TIME",
  "parttime": "PART_TIME",
  "part-time": "PART_TIME",
  "part_time": "PART_TIME",
  "contract": "CONTRACT",
  "contractor": "CONTRACT",
  "temporary": "TEMPORARY",
  "temp": "TEMPORARY",
  "intern": "INTERN",
  "internship": "INTERN",
  "volunteer": "VOLUNTEER",
};

function parseEmploymentType(raw?: string): EmploymentType | null {
  if (!raw) return null;
  return EMPLOYMENT_MAP[raw.toLowerCase().trim()] || null;
}

/**
 * Fetch all open jobs from an Ashby public job board.
 * Free, no auth required.
 * Board slug is the company identifier (e.g., "rmi", "terra").
 */
export async function fetchAshbyJobs(boardSlug: string): Promise<RawJob[]> {
  const url = `https://api.ashbyhq.com/posting-api/job-board/${boardSlug}`;

  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 404) {
      console.warn(`Ashby board not found: ${boardSlug}`);
      return [];
    }
    throw new Error(`Ashby API error for ${boardSlug}: ${response.status}`);
  }

  const data: AshbyResponse = await response.json();

  if (!data.jobs || !Array.isArray(data.jobs)) {
    console.warn(`Ashby [${boardSlug}]: unexpected response format`);
    return [];
  }

  return data.jobs
    .filter((job) => job.isListed !== false)
    .map((job) => ({
      title: job.title,
      description: job.descriptionHtml || job.descriptionPlain || null,
      datePosted: job.publishedDate || null,
      validThrough: null,
      employmentType: parseEmploymentType(job.employmentType),
      hiringOrganization: {
        name: boardSlug,
        sameAs: null,
        logo: null,
      },
      jobLocation: job.location ? {
        address: job.location,
        postalCode: null,
        addressRegion: null,
        addressCountry: null,
      } : null,
      jobLocationType: job.isRemote ? "TELECOMMUTE" as const : null,
      baseSalary: null,
      applyUrl: job.jobUrl,
      source: "ashby" as const,
      source_id: `ab-${boardSlug}-${job.id}`,
      skills: [],
      industry: null,
    }));
}
