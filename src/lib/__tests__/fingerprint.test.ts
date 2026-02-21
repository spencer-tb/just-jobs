import { describe, it, expect } from "vitest";
import { generateFingerprint } from "../fingerprint";
import type { RawJob } from "../types";

function makeJob(overrides: Partial<RawJob> = {}): RawJob {
  return {
    title: "Project Manager",
    description: null,
    datePosted: null,
    validThrough: null,
    employmentType: null,
    hiringOrganization: { name: "Oxfam", sameAs: null, logo: null },
    jobLocation: { address: "London", postalCode: null, addressRegion: null, addressCountry: null },
    jobLocationType: null,
    baseSalary: null,
    applyUrl: "https://example.com/job/1",
    source: "greenhouse",
    source_id: "gh-test-1",
    skills: [],
    industry: null,
    ...overrides,
  };
}

describe("generateFingerprint", () => {
  it("returns a consistent hash for the same job", () => {
    const job = makeJob();
    expect(generateFingerprint(job)).toBe(generateFingerprint(job));
  });

  it("returns different hashes for different titles", () => {
    const a = generateFingerprint(makeJob({ title: "Project Manager" }));
    const b = generateFingerprint(makeJob({ title: "Grant Manager" }));
    expect(a).not.toBe(b);
  });

  it("returns different hashes for different companies", () => {
    const a = generateFingerprint(makeJob());
    const b = generateFingerprint(makeJob({
      hiringOrganization: { name: "UNICEF", sameAs: null, logo: null },
    }));
    expect(a).not.toBe(b);
  });

  it("returns different hashes for different locations", () => {
    const a = generateFingerprint(makeJob());
    const b = generateFingerprint(makeJob({
      jobLocation: { address: "Edinburgh", postalCode: null, addressRegion: null, addressCountry: null },
    }));
    expect(a).not.toBe(b);
  });

  it("handles null location", () => {
    const fp = generateFingerprint(makeJob({ jobLocation: null }));
    expect(typeof fp).toBe("string");
    expect(fp.length).toBeGreaterThan(0);
  });
});
