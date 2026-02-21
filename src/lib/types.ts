// ============================================================
// Niche Configuration
// ============================================================

export interface NicheConfig {
  id: string;
  name: string;
  domain: string;
  tagline: string;
  keywords: string[];
  serpQueries: string[];
  atsBoards: {
    greenhouse: string[];
    lever: string[];
    ashby?: string[];
    smartrecruiters?: string[];
  };
  scraperUrls?: string[];
  apiSources: ApiSource[];
  tags: Record<string, string[]>;
  theme: {
    primaryColor: string;
    accentColor: string;
  };
  seo: {
    titleTemplate: string;
    description: string;
  };
}

export interface ApiSource {
  type: "reliefweb";
  filters: Record<string, string[]>;
}

// ============================================================
// Job — Google JobPosting-aligned schema
// https://schema.org/JobPosting
//
// This is the ONE canonical format used everywhere:
//   LLM extraction → database → frontend → JSON-LD SEO
// ============================================================

export interface Job {
  // Internal
  id: string;
  niche: string;
  source: JobSource;
  source_id: string;
  scraped_at: string;
  status: "active" | "expired" | "duplicate";
  fingerprint: string;
  tags: string[];

  // Google JobPosting fields
  title: string;
  description: string | null;
  datePosted: string | null;
  validThrough: string | null;
  employmentType: EmploymentType | null;

  hiringOrganization: {
    name: string;
    sameAs: string | null;
    logo: string | null;
  };

  jobLocation: {
    address: string | null;
    postalCode: string | null;
    addressRegion: string | null;
    addressCountry: string | null;
  } | null;

  jobLocationType: "TELECOMMUTE" | null;

  baseSalary: {
    currency: string;
    minValue: number | null;
    maxValue: number | null;
    unitText: "YEAR" | "MONTH" | "DAY" | "HOUR";
  } | null;

  applyUrl: string;
  skills: string[];
  industry: string | null;
}

export type JobSource =
  | "greenhouse"
  | "lever"
  | "reliefweb"
  | "ashby"
  | "serper"
  | "smartrecruiters"
  | "google_cse"
  | "scraper";

export type EmploymentType =
  | "FULL_TIME"
  | "PART_TIME"
  | "CONTRACT"
  | "TEMPORARY"
  | "INTERN"
  | "VOLUNTEER";

// ============================================================
// RawJob — intermediate format from any source before processing
// Same Google-aligned shape but without internal fields
// ============================================================

export interface RawJob {
  title: string;
  description: string | null;
  datePosted: string | null;
  validThrough: string | null;
  employmentType: EmploymentType | null;

  hiringOrganization: {
    name: string;
    sameAs: string | null;
    logo: string | null;
  };

  jobLocation: {
    address: string | null;
    postalCode: string | null;
    addressRegion: string | null;
    addressCountry: string | null;
  } | null;

  jobLocationType: "TELECOMMUTE" | null;

  baseSalary: {
    currency: string;
    minValue: number | null;
    maxValue: number | null;
    unitText: "YEAR" | "MONTH" | "DAY" | "HOUR";
  } | null;

  applyUrl: string;
  source: JobSource;
  source_id: string;
  skills: string[];
  industry: string | null;
}
