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
  if (job.jobLocation !== null) {
    expect(typeof job.jobLocation).toBe("object");
  }
  expect([null, "TELECOMMUTE"]).toContain(job.jobLocationType);
  expect(Array.isArray(job.skills)).toBe(true);
}

beforeEach(() => {
  vi.restoreAllMocks();
});

const MOCK_LIST_RESPONSE = {
  totalFound: 2,
  offset: 0,
  limit: 100,
  content: [
    {
      id: "posting-1",
      name: "Programme Manager",
      uuid: "abc-123-uuid",
      department: { id: "dept1", label: "Programs" },
      location: {
        city: "Edinburgh",
        region: "Scotland",
        country: "GB",
        remote: false,
      },
      industry: { id: "ind1", label: "Non-profit" },
      typeOfEmployment: { id: "emp1", label: "Full-time" },
      releasedDate: "2025-02-01T00:00:00Z",
      company: { name: "World Resources Institute", identifier: "WRI" },
    },
    {
      id: "posting-2",
      name: "Remote Climate Analyst",
      uuid: "def-456-uuid",
      department: { id: "dept2", label: "Research" },
      location: {
        city: null,
        region: null,
        country: "US",
        remote: true,
      },
      industry: { id: "ind2", label: "Environmental" },
      typeOfEmployment: { id: "emp2", label: "Contract" },
      releasedDate: "2025-02-10T00:00:00Z",
      company: { name: "World Resources Institute", identifier: "WRI" },
    },
  ],
};

const MOCK_DETAIL_RESPONSE = {
  ...MOCK_LIST_RESPONSE.content[0],
  jobAd: {
    sections: {
      companyDescription: { text: "<p>WRI is a global research org.</p>" },
      jobDescription: { text: "<p>Manage programmes across Scotland.</p>" },
      qualifications: { text: "<ul><li>3+ years experience</li></ul>" },
      additionalInformation: { text: "<p>Benefits: pension, flexible working</p>" },
    },
  },
};

describe("SmartRecruiters adapter", () => {
  it("maps API response to RawJob shape", async () => {
    const fetchMock = vi.fn()
      // First call: list endpoint
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(MOCK_LIST_RESPONSE),
      })
      // Detail fetch for job 1
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(MOCK_DETAIL_RESPONSE),
      })
      // Detail fetch for job 2
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ...MOCK_LIST_RESPONSE.content[1] }),
      });

    vi.stubGlobal("fetch", fetchMock);

    const { fetchSmartRecruitersJobs } = await import("../aggregator/smartrecruiters");
    const jobs = await fetchSmartRecruitersJobs("WRI");

    expect(jobs).toHaveLength(2);
    assertRawJobShape(jobs[0]);
    assertRawJobShape(jobs[1]);
  });

  it("extracts correct fields from list + detail", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ...MOCK_LIST_RESPONSE, content: [MOCK_LIST_RESPONSE.content[0]], totalFound: 1 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(MOCK_DETAIL_RESPONSE),
      });

    vi.stubGlobal("fetch", fetchMock);

    const { fetchSmartRecruitersJobs } = await import("../aggregator/smartrecruiters");
    const jobs = await fetchSmartRecruitersJobs("WRI");

    expect(jobs).toHaveLength(1);
    const job = jobs[0];

    expect(job.title).toBe("Programme Manager");
    expect(job.source).toBe("smartrecruiters");
    expect(job.source_id).toBe("sr-WRI-abc-123-uuid");
    expect(job.applyUrl).toBe("https://jobs.smartrecruiters.com/WRI/abc-123-uuid");
    expect(job.datePosted).toBe("2025-02-01T00:00:00Z");
    expect(job.employmentType).toBe("FULL_TIME");
    expect(job.industry).toBe("Non-profit");

    // Location
    expect(job.jobLocation).not.toBeNull();
    expect(job.jobLocation?.address).toBe("Edinburgh, Scotland, GB");
    expect(job.jobLocation?.addressRegion).toBe("Scotland");
    expect(job.jobLocation?.addressCountry).toBe("GB");
    expect(job.jobLocationType).toBeNull();

    // Company
    expect(job.hiringOrganization.name).toBe("World Resources Institute");

    // Description assembled from sections
    expect(job.description).toContain("WRI is a global research org");
    expect(job.description).toContain("Manage programmes across Scotland");
    expect(job.description).toContain("3+ years experience");
    expect(job.description).toContain("Benefits: pension");
  });

  it("detects remote jobs", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ...MOCK_LIST_RESPONSE, content: [MOCK_LIST_RESPONSE.content[1]], totalFound: 1 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(MOCK_LIST_RESPONSE.content[1]),
      });

    vi.stubGlobal("fetch", fetchMock);

    const { fetchSmartRecruitersJobs } = await import("../aggregator/smartrecruiters");
    const jobs = await fetchSmartRecruitersJobs("WRI");

    expect(jobs[0].jobLocationType).toBe("TELECOMMUTE");
    expect(jobs[0].jobLocation?.addressCountry).toBe("US");
  });

  it("returns empty array for 404", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    }));

    const { fetchSmartRecruitersJobs } = await import("../aggregator/smartrecruiters");
    const jobs = await fetchSmartRecruitersJobs("nonexistent");
    expect(jobs).toEqual([]);
  });

  it("falls back to list data when detail fetch fails", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ...MOCK_LIST_RESPONSE, content: [MOCK_LIST_RESPONSE.content[0]], totalFound: 1 }),
      })
      // Detail fetch fails
      .mockRejectedValueOnce(new Error("Network error"));

    vi.stubGlobal("fetch", fetchMock);

    const { fetchSmartRecruitersJobs } = await import("../aggregator/smartrecruiters");
    const jobs = await fetchSmartRecruitersJobs("WRI");

    expect(jobs).toHaveLength(1);
    expect(jobs[0].title).toBe("Programme Manager");
    // No description since detail failed
    expect(jobs[0].description).toBeNull();
  });

  it("paginates when more jobs than limit", async () => {
    const page1 = {
      totalFound: 150,
      offset: 0,
      limit: 100,
      content: Array.from({ length: 100 }, (_, i) => ({
        id: `p1-${i}`,
        name: `Job ${i}`,
        uuid: `uuid-p1-${i}`,
        location: { city: "London", country: "GB" },
        company: { name: "Big NGO", identifier: "bigngo" },
      })),
    };

    const page2 = {
      totalFound: 150,
      offset: 100,
      limit: 100,
      content: Array.from({ length: 50 }, (_, i) => ({
        id: `p2-${i}`,
        name: `Job ${100 + i}`,
        uuid: `uuid-p2-${i}`,
        location: { city: "London", country: "GB" },
        company: { name: "Big NGO", identifier: "bigngo" },
      })),
    };

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(page1) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(page2) });

    // All detail fetches return ok with minimal data
    for (let i = 0; i < 150; i++) {
      fetchMock.mockResolvedValueOnce({ ok: false, status: 404 });
    }

    vi.stubGlobal("fetch", fetchMock);

    const { fetchSmartRecruitersJobs } = await import("../aggregator/smartrecruiters");
    const jobs = await fetchSmartRecruitersJobs("bigngo");

    expect(jobs).toHaveLength(150);
    // Should have made 2 list calls + 150 detail calls
    expect(fetchMock).toHaveBeenCalledTimes(152);
  });

  it("parses employment type variants", async () => {
    const testCases = [
      { label: "Full-time", expected: "FULL_TIME" },
      { label: "Part-time", expected: "PART_TIME" },
      { label: "Contract", expected: "CONTRACT" },
      { label: "Internship", expected: "INTERN" },
    ];

    for (const { label, expected } of testCases) {
      const job = {
        ...MOCK_LIST_RESPONSE.content[0],
        typeOfEmployment: { id: "x", label },
      };

      const fetchMock = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ totalFound: 1, offset: 0, limit: 100, content: [job] }),
        })
        .mockResolvedValueOnce({ ok: false }); // detail fails, use list data

      vi.stubGlobal("fetch", fetchMock);

      const { fetchSmartRecruitersJobs } = await import("../aggregator/smartrecruiters");
      const jobs = await fetchSmartRecruitersJobs("test");
      expect(jobs[0].employmentType).toBe(expected);
    }
  });
});
