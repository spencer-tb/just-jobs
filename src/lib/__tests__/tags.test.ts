import { describe, it, expect } from "vitest";
import { tagJob } from "../tags";
import type { RawJob } from "../types";

const NICHE_TAGS = {
  "project-management": ["project manager", "programme manager", "project coordinator"],
  "climate": ["climate", "sustainability", "net zero"],
  "grant-management": ["grant manager", "grant writer", "grants officer"],
};

function makeJob(title: string, description: string | null = null): RawJob {
  return {
    title,
    description,
    datePosted: null,
    validThrough: null,
    employmentType: null,
    hiringOrganization: { name: "Test Org", sameAs: null, logo: null },
    jobLocation: null,
    jobLocationType: null,
    baseSalary: null,
    applyUrl: "https://example.com",
    source: "greenhouse",
    source_id: "test-1",
    skills: [],
    industry: null,
  };
}

describe("tagJob", () => {
  it("matches tags from title", () => {
    const tags = tagJob(makeJob("Senior Project Manager"), NICHE_TAGS);
    expect(tags).toContain("project-management");
  });

  it("matches tags from description", () => {
    const tags = tagJob(
      makeJob("Senior Advisor", "Working on climate change policy and net zero strategy"),
      NICHE_TAGS,
    );
    expect(tags).toContain("climate");
  });

  it("matches multiple tags", () => {
    const tags = tagJob(
      makeJob("Project Manager - Climate Programme"),
      NICHE_TAGS,
    );
    expect(tags).toContain("project-management");
    expect(tags).toContain("climate");
  });

  it("returns empty array when nothing matches", () => {
    const tags = tagJob(makeJob("Software Engineer"), NICHE_TAGS);
    expect(tags).toEqual([]);
  });

  it("is case insensitive", () => {
    const tags = tagJob(makeJob("GRANT MANAGER at NGO"), NICHE_TAGS);
    expect(tags).toContain("grant-management");
  });

  it("handles null description", () => {
    const tags = tagJob(makeJob("Climate Analyst", null), NICHE_TAGS);
    expect(tags).toContain("climate");
  });
});
