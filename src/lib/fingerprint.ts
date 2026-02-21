import { createHash } from "crypto";
import type { RawJob } from "./types";

/**
 * Generate a deduplication fingerprint for a job.
 * Jobs with the same fingerprint are considered duplicates.
 */
export function generateFingerprint(job: RawJob): string {
  const normalized = [
    job.title.toLowerCase().trim().replace(/\s+/g, " "),
    job.hiringOrganization.name.toLowerCase().trim().replace(/\s+/g, " "),
    (job.jobLocation?.address || "remote").toLowerCase().trim(),
  ].join("|");

  return createHash("sha256").update(normalized).digest("hex").slice(0, 16);
}
