import type { RawJob, EmploymentType } from "../types";

interface SmartRecruitersJob {
  id: string;
  name: string;
  uuid: string;
  refNumber?: string;
  department?: { id: string; label: string };
  location: {
    city?: string;
    region?: string;
    country?: string;
    remote?: boolean;
  };
  industry?: { id: string; label: string };
  function?: { id: string; label: string };
  typeOfEmployment?: { id: string; label: string };
  experienceLevel?: { id: string; label: string };
  releasedDate?: string;
  company: { name: string; identifier: string };
}

interface SmartRecruitersJobDetail extends SmartRecruitersJob {
  jobAd?: {
    sections?: {
      jobDescription?: { text: string };
      qualifications?: { text: string };
      additionalInformation?: { text: string };
      companyDescription?: { text: string };
    };
  };
}

interface SmartRecruitersListResponse {
  totalFound: number;
  offset: number;
  limit: number;
  content: SmartRecruitersJob[];
}

const EMPLOYMENT_MAP: Record<string, EmploymentType> = {
  "full-time": "FULL_TIME",
  "fulltime": "FULL_TIME",
  "part-time": "PART_TIME",
  "parttime": "PART_TIME",
  "contract": "CONTRACT",
  "contractor": "CONTRACT",
  "temporary": "TEMPORARY",
  "intern": "INTERN",
  "internship": "INTERN",
  "volunteer": "VOLUNTEER",
};

function parseEmploymentType(raw?: { label: string }): EmploymentType | null {
  if (!raw?.label) return null;
  const key = raw.label.toLowerCase().trim().replace(/\s+/g, "-");
  return EMPLOYMENT_MAP[key] || EMPLOYMENT_MAP[raw.label.toLowerCase().trim()] || null;
}

function buildLocationString(loc: SmartRecruitersJob["location"]): string | null {
  const parts = [loc.city, loc.region, loc.country].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}

/**
 * Fetch all open jobs from a SmartRecruiters company board.
 * Free public API, no auth required.
 * Company identifier is the board token (e.g., "WRI", "UNDP").
 *
 * API docs: https://dev.smartrecruiters.com/customer-api/live-docs/posting-api/
 */
export async function fetchSmartRecruitersJobs(companyId: string): Promise<RawJob[]> {
  const allJobs: SmartRecruitersJob[] = [];
  let offset = 0;
  const limit = 100;

  // Paginate through all results
  while (true) {
    const url = `https://api.smartrecruiters.com/v1/companies/${companyId}/postings?offset=${offset}&limit=${limit}`;
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`SmartRecruiters board not found: ${companyId}`);
        return [];
      }
      throw new Error(`SmartRecruiters API error for ${companyId}: ${response.status}`);
    }

    const data: SmartRecruitersListResponse = await response.json();

    if (!data.content || !Array.isArray(data.content)) {
      break;
    }

    allJobs.push(...data.content);

    if (allJobs.length >= data.totalFound || data.content.length < limit) {
      break;
    }

    offset += limit;
  }

  // Fetch details for each job (includes full description)
  const rawJobs: RawJob[] = [];

  for (const job of allJobs) {
    try {
      const detail = await fetchJobDetail(companyId, job.uuid);
      rawJobs.push(mapToRawJob(companyId, detail || job));
    } catch {
      // Fall back to list data if detail fetch fails
      rawJobs.push(mapToRawJob(companyId, job));
    }
  }

  return rawJobs;
}

async function fetchJobDetail(
  companyId: string,
  jobUuid: string,
): Promise<SmartRecruitersJobDetail | null> {
  const url = `https://api.smartrecruiters.com/v1/companies/${companyId}/postings/${jobUuid}`;
  const response = await fetch(url);

  if (!response.ok) return null;
  return response.json();
}

function mapToRawJob(companyId: string, job: SmartRecruitersJob | SmartRecruitersJobDetail): RawJob {
  const locationStr = buildLocationString(job.location);
  const isRemote = job.location.remote === true;

  // Build description from sections if available
  let description: string | null = null;
  const detail = job as SmartRecruitersJobDetail;
  if (detail.jobAd?.sections) {
    const sections = detail.jobAd.sections;
    const parts: string[] = [];
    if (sections.companyDescription?.text) parts.push(sections.companyDescription.text);
    if (sections.jobDescription?.text) parts.push(sections.jobDescription.text);
    if (sections.qualifications?.text) parts.push(sections.qualifications.text);
    if (sections.additionalInformation?.text) parts.push(sections.additionalInformation.text);
    if (parts.length > 0) description = parts.join("\n");
  }

  return {
    title: job.name,
    description,
    datePosted: job.releasedDate || null,
    validThrough: null,
    employmentType: parseEmploymentType(job.typeOfEmployment),
    hiringOrganization: {
      name: job.company?.name || companyId,
      sameAs: null,
      logo: null,
    },
    jobLocation: locationStr
      ? {
          address: locationStr,
          postalCode: null,
          addressRegion: job.location.region || null,
          addressCountry: job.location.country || null,
        }
      : null,
    jobLocationType: isRemote ? "TELECOMMUTE" as const : null,
    baseSalary: null, // SmartRecruiters public API doesn't expose salary
    applyUrl: `https://jobs.smartrecruiters.com/${companyId}/${job.uuid}`,
    source: "smartrecruiters" as const,
    source_id: `sr-${companyId}-${job.uuid}`,
    skills: [],
    industry: job.industry?.label || null,
  };
}
