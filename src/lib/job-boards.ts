/**
 * Registry of known job board domains.
 * Used for SERP result filtering, company name extraction, and targeted queries.
 */

export interface JobBoardEntry {
  domain: string;
  name: string;
  region: "uk" | "us" | "global" | "scotland" | "europe";
  sector: "ngo" | "climate" | "general" | "international-dev" | "charity";
  hasApi: boolean;
  notes?: string;
}

export const JOB_BOARDS: JobBoardEntry[] = [
  // UK Charity
  { domain: "charityjob.co.uk", name: "CharityJob", region: "uk", sector: "charity", hasApi: false },
  { domain: "goodmoves.org", name: "Goodmoves", region: "scotland", sector: "charity", hasApi: false, notes: "Run by SCVO, Scotland-specific" },
  { domain: "charitycareersscotland.co.uk", name: "Charity Careers Scotland", region: "scotland", sector: "charity", hasApi: false },
  { domain: "thirdsector.co.uk", name: "Third Sector", region: "uk", sector: "charity", hasApi: false },
  { domain: "civilsociety.co.uk", name: "Civil Society", region: "uk", sector: "charity", hasApi: false },
  { domain: "harrishill.co.uk", name: "Harris Hill", region: "uk", sector: "charity", hasApi: false, notes: "Charity recruitment agency" },
  { domain: "tpp.co.uk", name: "TPP Recruitment", region: "uk", sector: "charity", hasApi: false, notes: "Not-for-profit recruitment" },

  // Climate / Environment
  { domain: "climatebase.org", name: "Climatebase", region: "global", sector: "climate", hasApi: false },
  { domain: "climatecareers.com", name: "Climate Careers", region: "global", sector: "climate", hasApi: false },
  { domain: "climatechangecareers.com", name: "Climate Change Careers", region: "global", sector: "climate", hasApi: false },
  { domain: "environmentjob.co.uk", name: "Environmentjob", region: "uk", sector: "climate", hasApi: false },
  { domain: "greenjobs.co.uk", name: "Green Jobs", region: "uk", sector: "climate", hasApi: false },
  { domain: "conservationjobboard.com", name: "Conservation Job Board", region: "global", sector: "climate", hasApi: false },
  { domain: "environmentalcareer.com", name: "Environmental Career", region: "us", sector: "climate", hasApi: false },

  // International Development / Humanitarian
  { domain: "reliefweb.int", name: "ReliefWeb", region: "global", sector: "international-dev", hasApi: true, notes: "Free API v2" },
  { domain: "devex.com", name: "Devex", region: "global", sector: "international-dev", hasApi: false },
  { domain: "impactpool.org", name: "Impactpool", region: "global", sector: "international-dev", hasApi: false },
  { domain: "idealist.org", name: "Idealist", region: "global", sector: "ngo", hasApi: false },
  { domain: "workforgood.co.uk", name: "Work for Good", region: "uk", sector: "ngo", hasApi: false },
  { domain: "bond.org.uk", name: "Bond", region: "uk", sector: "international-dev", hasApi: false, notes: "UK network for international development" },
  { domain: "fontes.nl", name: "Fontes", region: "europe", sector: "international-dev", hasApi: false },
  { domain: "unjobs.org", name: "UN Jobs", region: "global", sector: "international-dev", hasApi: false },
  { domain: "uncareer.net", name: "UN Career", region: "global", sector: "international-dev", hasApi: false },
  { domain: "humentum.org", name: "Humentum", region: "global", sector: "international-dev", hasApi: false },
  { domain: "coordinationsud.org", name: "Coordination SUD", region: "europe", sector: "international-dev", hasApi: false },

  // General (large boards that list NGO jobs)
  { domain: "indeed.com", name: "Indeed", region: "global", sector: "general", hasApi: false },
  { domain: "uk.indeed.com", name: "Indeed UK", region: "uk", sector: "general", hasApi: false },
  { domain: "linkedin.com", name: "LinkedIn", region: "global", sector: "general", hasApi: false },
  { domain: "glassdoor.com", name: "Glassdoor", region: "global", sector: "general", hasApi: false },
  { domain: "glassdoor.co.uk", name: "Glassdoor UK", region: "uk", sector: "general", hasApi: false },
  { domain: "reed.co.uk", name: "Reed", region: "uk", sector: "general", hasApi: false },
  { domain: "s1jobs.com", name: "s1jobs", region: "scotland", sector: "general", hasApi: false, notes: "Scottish jobs board" },
  { domain: "myjobscotland.gov.uk", name: "myjobscotland", region: "scotland", sector: "general", hasApi: false, notes: "Scottish public sector" },
  { domain: "cv-library.co.uk", name: "CV-Library", region: "uk", sector: "general", hasApi: false },
  { domain: "totaljobs.com", name: "Totaljobs", region: "uk", sector: "general", hasApi: false },
  { domain: "jobs.theguardian.com", name: "Guardian Jobs", region: "uk", sector: "general", hasApi: false },

  // ATS platforms (we extract jobs from these directly via API)
  { domain: "boards.greenhouse.io", name: "Greenhouse", region: "global", sector: "general", hasApi: true },
  { domain: "jobs.lever.co", name: "Lever", region: "global", sector: "general", hasApi: true },
  { domain: "jobs.ashbyhq.com", name: "Ashby", region: "global", sector: "general", hasApi: true },
];

/** All known job board domains for quick lookup */
export const JOB_BOARD_DOMAINS = new Set(JOB_BOARDS.map((b) => b.domain));

/** Check if a URL is from a known job board */
export function isJobBoardUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    return JOB_BOARD_DOMAINS.has(hostname) ||
      JOB_BOARDS.some((b) => hostname.endsWith(b.domain));
  } catch {
    return false;
  }
}

/** Get the job board entry for a URL, if any */
export function getJobBoard(url: string): JobBoardEntry | undefined {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    return JOB_BOARDS.find(
      (b) => hostname === b.domain || hostname.endsWith(`.${b.domain}`)
    );
  } catch {
    return undefined;
  }
}

/** Get boards by region and sector for targeted SERP site: queries */
export function getBoardsByFilter(opts: {
  region?: JobBoardEntry["region"];
  sector?: JobBoardEntry["sector"];
}): JobBoardEntry[] {
  return JOB_BOARDS.filter((b) => {
    if (opts.region && b.region !== opts.region) return false;
    if (opts.sector && b.sector !== opts.sector) return false;
    return true;
  });
}
