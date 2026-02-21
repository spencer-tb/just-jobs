import type { NicheConfig, RawJob } from "./types";

/**
 * Tag a job based on title and description matching against niche tag keywords.
 */
export function tagJob(job: RawJob, nicheTags: NicheConfig["tags"]): string[] {
  const text = `${job.title} ${job.description || ""}`.toLowerCase();
  return Object.entries(nicheTags)
    .filter(([, keywords]) => keywords.some((kw) => text.includes(kw.toLowerCase())))
    .map(([tag]) => tag);
}
