import { describe, it, expect, vi, beforeEach } from "vitest";
import type { RawJob } from "../types";

// Validate that adapter outputs conform to the RawJob interface
function assertRawJobShape(job: RawJob) {
  expect(typeof job.title).toBe("string");
  expect(job.title.length).toBeGreaterThan(0);
  expect(typeof job.applyUrl).toBe("string");
  expect(typeof job.source).toBe("string");
  expect(typeof job.source_id).toBe("string");
  expect(job.source_id.length).toBeGreaterThan(0);

  // hiringOrganization is always present
  expect(job.hiringOrganization).toBeDefined();
  expect(typeof job.hiringOrganization.name).toBe("string");

  // Nullable fields
  expect(["string", "object"]).toContain(typeof job.description);
  expect(["string", "object"]).toContain(typeof job.datePosted);

  // jobLocation is object or null
  if (job.jobLocation !== null) {
    expect(typeof job.jobLocation).toBe("object");
  }

  // jobLocationType is "TELECOMMUTE" or null
  expect([null, "TELECOMMUTE"]).toContain(job.jobLocationType);

  // baseSalary is object or null
  if (job.baseSalary !== null) {
    expect(typeof job.baseSalary.currency).toBe("string");
    expect(["YEAR", "MONTH", "DAY", "HOUR"]).toContain(job.baseSalary.unitText);
  }

  // skills is always an array
  expect(Array.isArray(job.skills)).toBe(true);
}

// Mock global fetch for each adapter test
beforeEach(() => {
  vi.restoreAllMocks();
});

describe("Greenhouse adapter", () => {
  it("maps API response to RawJob shape", async () => {
    const mockResponse = {
      jobs: [
        {
          id: 123,
          title: "Grant Manager",
          location: { name: "London, UK" },
          content: "<p>Manage grants</p>",
          updated_at: "2025-01-15T00:00:00Z",
          absolute_url: "https://boards.greenhouse.io/test/jobs/123",
          departments: [{ name: "Programs" }],
          offices: [{ name: "London" }],
        },
      ],
    };

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    }));

    const { fetchGreenhouseJobs } = await import("../aggregator/greenhouse");
    const jobs = await fetchGreenhouseJobs("testboard");

    expect(jobs).toHaveLength(1);
    assertRawJobShape(jobs[0]);
    expect(jobs[0].title).toBe("Grant Manager");
    expect(jobs[0].source).toBe("greenhouse");
    expect(jobs[0].source_id).toBe("gh-testboard-123");
    expect(jobs[0].jobLocation?.address).toBe("London, UK");
    expect(jobs[0].description).toBe("<p>Manage grants</p>");
  });

  it("returns empty array for 404", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    }));

    const { fetchGreenhouseJobs } = await import("../aggregator/greenhouse");
    const jobs = await fetchGreenhouseJobs("nonexistent");
    expect(jobs).toEqual([]);
  });
});

describe("Lever adapter", () => {
  it("maps API response to RawJob shape", async () => {
    const mockResponse = [
      {
        id: "abc-123",
        text: "Climate Policy Analyst",
        categories: { location: "Remote", commitment: "Full-time" },
        description: "<p>Analyze climate policy</p>",
        descriptionPlain: "Analyze climate policy",
        lists: [],
        hostedUrl: "https://jobs.lever.co/test/abc-123",
        applyUrl: "https://jobs.lever.co/test/abc-123/apply",
        createdAt: 1705276800000,
      },
    ];

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    }));

    const { fetchLeverJobs } = await import("../aggregator/lever");
    const jobs = await fetchLeverJobs("testcompany");

    expect(jobs).toHaveLength(1);
    assertRawJobShape(jobs[0]);
    expect(jobs[0].title).toBe("Climate Policy Analyst");
    expect(jobs[0].source).toBe("lever");
    expect(jobs[0].jobLocationType).toBe("TELECOMMUTE");
    expect(jobs[0].applyUrl).toBe("https://jobs.lever.co/test/abc-123");
  });
});

describe("Ashby adapter", () => {
  it("maps API response to RawJob shape with employment type", async () => {
    const mockResponse = {
      jobs: [
        {
          id: "ash-1",
          title: "Programme Coordinator",
          location: "Edinburgh",
          employmentType: "FullTime",
          isRemote: false,
          publishedDate: "2025-02-01",
          descriptionHtml: "<p>Coordinate programmes</p>",
          jobUrl: "https://jobs.ashbyhq.com/test/ash-1",
          isListed: true,
        },
      ],
    };

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    }));

    const { fetchAshbyJobs } = await import("../aggregator/ashby");
    const jobs = await fetchAshbyJobs("testboard");

    expect(jobs).toHaveLength(1);
    assertRawJobShape(jobs[0]);
    expect(jobs[0].title).toBe("Programme Coordinator");
    expect(jobs[0].source).toBe("ashby");
    expect(jobs[0].jobLocation?.address).toBe("Edinburgh");
    expect(jobs[0].jobLocationType).toBeNull();
    expect(jobs[0].description).toBe("<p>Coordinate programmes</p>");
  });

  it("detects remote jobs", async () => {
    const mockResponse = {
      jobs: [
        {
          id: "ash-2",
          title: "Remote Analyst",
          location: "Remote",
          isRemote: true,
          publishedDate: "2025-02-01",
          jobUrl: "https://jobs.ashbyhq.com/test/ash-2",
          isListed: true,
        },
      ],
    };

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    }));

    const { fetchAshbyJobs } = await import("../aggregator/ashby");
    const jobs = await fetchAshbyJobs("testboard");

    expect(jobs[0].jobLocationType).toBe("TELECOMMUTE");
  });

  it("filters unlisted jobs", async () => {
    const mockResponse = {
      jobs: [
        { id: "1", title: "Listed", isListed: true, location: "", isRemote: false, publishedDate: "", jobUrl: "" },
        { id: "2", title: "Unlisted", isListed: false, location: "", isRemote: false, publishedDate: "", jobUrl: "" },
      ],
    };

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    }));

    const { fetchAshbyJobs } = await import("../aggregator/ashby");
    const jobs = await fetchAshbyJobs("testboard");

    expect(jobs).toHaveLength(1);
    expect(jobs[0].title).toBe("Listed");
  });
});

describe("Lever titleCase", () => {
  it("converts slugs to readable names", async () => {
    // We can test this indirectly via fetchLeverCompanyName with a mock
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ id: "1", hostedUrl: "https://jobs.lever.co/sierraclub" }]),
    }));

    const { fetchLeverCompanyName } = await import("../aggregator/lever");

    expect(await fetchLeverCompanyName("sierraclub")).toBe("Sierraclub");
    expect(await fetchLeverCompanyName("charitywater")).toBe("Charitywater");
  });
});
