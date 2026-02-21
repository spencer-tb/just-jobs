import { getSupabaseAdmin } from "./supabase";
import type { Job } from "./types";

export interface JobFilters {
  niche: string;
  query?: string;
  tags?: string[];
  remote?: boolean;
  page?: number;
  limit?: number;
}

/**
 * Map a flat DB row to the nested Job interface.
 */
function rowToJob(row: Record<string, unknown>): Job {
  return {
    id: row.id as string,
    niche: row.niche as string,
    source: row.source as Job["source"],
    source_id: row.source_id as string,
    scraped_at: row.scraped_at as string,
    status: row.status as Job["status"],
    fingerprint: row.fingerprint as string,
    tags: typeof row.tags === "string" ? JSON.parse(row.tags) : (row.tags as string[]) || [],
    title: row.title as string,
    description: (row.description as string) || null,
    datePosted: (row.date_posted as string) || null,
    validThrough: (row.valid_through as string) || null,
    employmentType: (row.employment_type as Job["employmentType"]) || null,
    hiringOrganization: {
      name: (row.org_name as string) || "Unknown",
      sameAs: (row.org_url as string) || null,
      logo: (row.org_logo as string) || null,
    },
    jobLocation: row.location_address || row.location_region || row.location_country
      ? {
          address: (row.location_address as string) || null,
          postalCode: (row.location_postal_code as string) || null,
          addressRegion: (row.location_region as string) || null,
          addressCountry: (row.location_country as string) || null,
        }
      : null,
    jobLocationType: row.job_location_type === "TELECOMMUTE" ? "TELECOMMUTE" : null,
    baseSalary: row.salary_currency
      ? {
          currency: row.salary_currency as string,
          minValue: (row.salary_min as number) || null,
          maxValue: (row.salary_max as number) || null,
          unitText: (row.salary_unit as Job["baseSalary"] & { unitText: string })["unitText"] || "YEAR" as const,
        }
      : null,
    applyUrl: row.apply_url as string,
    skills: typeof row.skills === "string" ? JSON.parse(row.skills) : (row.skills as string[]) || [],
    industry: (row.industry as string) || null,
  };
}

export async function getJobs(filters: JobFilters): Promise<{
  jobs: Job[];
  total: number;
}> {
  const supabase = getSupabaseAdmin();
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("jobs")
    .select("*", { count: "exact" })
    .eq("niche", filters.niche)
    .eq("status", "active")
    .order("date_posted", { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1);

  if (filters.query) {
    query = query.textSearch("fts", filters.query, { type: "websearch" });
  }

  if (filters.tags && filters.tags.length > 0) {
    query = query.contains("tags", JSON.stringify(filters.tags));
  }

  if (filters.remote) {
    query = query.eq("job_location_type", "TELECOMMUTE");
  }

  const { data, count, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch jobs: ${error.message}`);
  }

  const jobs = (data || []).map((row) => rowToJob(row as Record<string, unknown>));

  return { jobs, total: count || 0 };
}

export async function getJobById(id: string): Promise<Job | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;

  return rowToJob(data as Record<string, unknown>);
}
