import type { RawJob } from "../types";

interface LeverJob {
  id: string;
  text: string;
  categories: {
    team?: string;
    location?: string;
    commitment?: string;
    department?: string;
  };
  description: string;
  descriptionPlain: string;
  lists: Array<{ text: string; content: string }>;
  hostedUrl: string;
  applyUrl: string;
  createdAt: number;
}

/**
 * Fetch the company display name from Lever's API.
 * Falls back to slug if the site page can't be parsed.
 */
export async function fetchLeverCompanyName(companySlug: string): Promise<string> {
  try {
    const response = await fetch(`https://api.lever.co/v0/postings/${companySlug}?mode=json&limit=1`);
    if (!response.ok) return companySlug;
    const data = await response.json();
    // Lever doesn't have a dedicated "company name" endpoint, but the
    // site URL pattern gives us the branded page we can derive from.
    // The best we can do from the API is use the slug as-is or look at
    // the hosted URL domain. For now, title-case the slug.
    if (Array.isArray(data) && data.length > 0) {
      // Extract from hostedUrl: https://jobs.lever.co/sierraclub → "sierraclub"
      // Title-case it: "Sierra Club" (best effort)
      return titleCase(companySlug);
    }
    return titleCase(companySlug);
  } catch {
    return titleCase(companySlug);
  }
}

function titleCase(slug: string): string {
  return slug
    .replace(/([a-z])([A-Z])/g, "$1 $2")  // camelCase → camel Case
    .replace(/[-_]/g, " ")                  // kebab-case → kebab case
    .replace(/\b\w/g, (c) => c.toUpperCase()); // capitalize words
}

export async function fetchLeverJobs(companySlug: string): Promise<RawJob[]> {
  const url = `https://api.lever.co/v0/postings/${companySlug}?mode=json`;
  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 404) {
      console.warn(`Lever company not found: ${companySlug}`);
      return [];
    }
    throw new Error(`Lever API error for ${companySlug}: ${response.status}`);
  }

  const data: LeverJob[] = await response.json();

  return data.map((job) => {
    const location = job.categories?.location || null;
    const isRemote =
      location?.toLowerCase().includes("remote") ||
      job.categories?.commitment?.toLowerCase().includes("remote") ||
      false;

    return {
      title: job.text,
      description: job.description || job.descriptionPlain || null,
      datePosted: job.createdAt ? new Date(job.createdAt).toISOString() : null,
      validThrough: null,
      employmentType: null,
      hiringOrganization: {
        name: companySlug,
        sameAs: null,
        logo: null,
      },
      jobLocation: location ? {
        address: location,
        postalCode: null,
        addressRegion: null,
        addressCountry: null,
      } : null,
      jobLocationType: isRemote ? "TELECOMMUTE" as const : null,
      baseSalary: null,
      applyUrl: job.hostedUrl,
      source: "lever" as const,
      source_id: `lv-${companySlug}-${job.id}`,
      skills: [],
      industry: null,
    };
  });
}
