import { describe, it, expect, vi, beforeEach } from "vitest";
import type { RawJob } from "../types";

function assertRawJobShape(job: RawJob) {
  expect(typeof job.title).toBe("string");
  expect(job.title.length).toBeGreaterThan(0);
  expect(typeof job.applyUrl).toBe("string");
  expect(typeof job.source).toBe("string");
  expect(typeof job.source_id).toBe("string");
  expect(job.hiringOrganization).toBeDefined();
  expect(typeof job.hiringOrganization.name).toBe("string");
  expect([null, "TELECOMMUTE"]).toContain(job.jobLocationType);
  expect(Array.isArray(job.skills)).toBe(true);
}

beforeEach(() => {
  vi.restoreAllMocks();
  process.env.GOOGLE_CSE_API_KEY = "test-key";
  process.env.GOOGLE_CSE_CX = "test-cx";
});

const MOCK_CSE_RESPONSE = {
  items: [
    {
      title: "Programme Manager - Climate Action - Scottish Wildlife Trust",
      link: "https://www.charityjob.co.uk/jobs/swt/programme-manager/12345",
      snippet: "Edinburgh, Scotland. £35,000 - £42,000. Full-time, permanent. Lead our climate action programme.",
      displayLink: "www.charityjob.co.uk",
    },
    {
      title: "Grant Writer at Oxfam | CharityJob",
      link: "https://www.charityjob.co.uk/jobs/oxfam/grant-writer/67890",
      snippet: "Remote. £28,000 - £32,000. Write grant proposals for humanitarian programmes.",
      displayLink: "www.charityjob.co.uk",
    },
    {
      title: "Best Restaurants in Edinburgh - TripAdvisor",
      link: "https://www.tripadvisor.com/restaurants/edinburgh",
      snippet: "Find the best restaurants in Edinburgh.",
      displayLink: "www.tripadvisor.com",
    },
  ],
  searchInformation: { totalResults: "150" },
};

describe("Google CSE adapter", () => {
  it("maps API response to RawJob shape", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MOCK_CSE_RESPONSE),
    }));

    const { fetchGoogleCseJobs } = await import("../aggregator/google-cse");
    const jobs = await fetchGoogleCseJobs("charity project manager UK");

    // Should filter out the TripAdvisor result (not a job listing)
    expect(jobs.length).toBeGreaterThanOrEqual(1);
    for (const job of jobs) {
      assertRawJobShape(job);
      expect(job.source).toBe("google_cse");
      expect(job.source_id).toMatch(/^gcse-/);
    }
  });

  it("extracts company name from title separators", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        items: [
          {
            title: "Data Analyst - Greenpeace",
            link: "https://www.charityjob.co.uk/jobs/greenpeace/data-analyst/111",
            snippet: "Analyse environmental data for campaigns.",
          },
        ],
      }),
    }));

    const { fetchGoogleCseJobs } = await import("../aggregator/google-cse");
    const jobs = await fetchGoogleCseJobs("data analyst charity");

    expect(jobs).toHaveLength(1);
    expect(jobs[0].hiringOrganization.name).toBe("Greenpeace");
  });

  it("detects remote from title and snippet", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        items: [
          {
            title: "Remote Climate Researcher - WRI",
            link: "https://www.charityjob.co.uk/jobs/wri/climate-researcher/456",
            snippet: "Work from home. Research climate policy.",
          },
        ],
      }),
    }));

    const { fetchGoogleCseJobs } = await import("../aggregator/google-cse");
    const jobs = await fetchGoogleCseJobs("remote climate researcher");

    expect(jobs).toHaveLength(1);
    expect(jobs[0].jobLocationType).toBe("TELECOMMUTE");
  });

  it("skips gracefully when credentials not set", async () => {
    delete process.env.GOOGLE_CSE_API_KEY;
    delete process.env.GOOGLE_CSE_CX;

    const { fetchGoogleCseJobs } = await import("../aggregator/google-cse");
    const jobs = await fetchGoogleCseJobs("test query");

    expect(jobs).toEqual([]);
  });

  it("handles 429 rate limit gracefully", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      statusText: "Too Many Requests",
    }));

    const { fetchGoogleCseJobs } = await import("../aggregator/google-cse");
    const jobs = await fetchGoogleCseJobs("test query");

    expect(jobs).toEqual([]);
  });

  it("returns empty array when no results", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ items: [] }),
    }));

    const { fetchGoogleCseJobs } = await import("../aggregator/google-cse");
    const jobs = await fetchGoogleCseJobs("very niche query");

    expect(jobs).toEqual([]);
  });

  it("passes dateRestrict and siteSearch params", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ items: [] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { fetchGoogleCseJobs } = await import("../aggregator/google-cse");
    await fetchGoogleCseJobs("climate jobs", {
      dateRestrict: "w1",
      siteSearch: "boards.greenhouse.io",
      num: 5,
    });

    const calledUrl = fetchMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain("dateRestrict=w1");
    expect(calledUrl).toContain("siteSearch=boards.greenhouse.io");
    expect(calledUrl).toContain("siteSearchFilter=i");
    expect(calledUrl).toContain("num=5");
  });

  it("generates stable source IDs", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        items: [{
          title: "Test Job - Org",
          link: "https://example.com/jobs/42",
          snippet: "A job.",
        }],
      }),
    }));

    const { fetchGoogleCseJobs } = await import("../aggregator/google-cse");
    const jobs1 = await fetchGoogleCseJobs("test");
    const jobs2 = await fetchGoogleCseJobs("test");

    expect(jobs1[0].source_id).toBe(jobs2[0].source_id);
  });
});

describe("Google CSE batch", () => {
  it("deduplicates across queries", async () => {
    const sameResult = {
      items: [{
        title: "Climate Analyst - WWF | CharityJob",
        link: "https://www.charityjob.co.uk/jobs/wwf/climate-analyst/999",
        snippet: "Analyse climate data.",
      }],
    };

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(sameResult),
    }));

    const { fetchGoogleCseBatch } = await import("../aggregator/google-cse");
    const jobs = await fetchGoogleCseBatch([
      "climate analyst charity",
      "WWF climate jobs",
      "climate analyst NGO",
    ]);

    // Same URL appears in all 3 queries, should only appear once
    expect(jobs).toHaveLength(1);
  });

  it("respects maxQueries limit", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ items: [] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const queries = Array.from({ length: 50 }, (_, i) => `query ${i}`);

    const { fetchGoogleCseBatch } = await import("../aggregator/google-cse");
    await fetchGoogleCseBatch(queries, { maxQueries: 5 });

    // Should only make 5 API calls despite 50 queries
    expect(fetchMock).toHaveBeenCalledTimes(5);
  });
});
