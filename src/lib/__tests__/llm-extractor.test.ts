import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NicheConfig } from "../types";

// Mock the Anthropic SDK before importing the extractor
vi.mock("@anthropic-ai/sdk", () => {
  const mockCreate = vi.fn();
  return {
    default: class MockAnthropic {
      messages = { create: mockCreate };
    },
    __mockCreate: mockCreate,
  };
});

// Helper to get the mock
async function getMockCreate() {
  const mod = await import("@anthropic-ai/sdk");
  return (mod as unknown as { __mockCreate: ReturnType<typeof vi.fn> }).__mockCreate;
}

const TEST_NICHE: NicheConfig = {
  id: "ngo",
  name: "Test NGO Jobs",
  domain: "test.org",
  tagline: "Test",
  keywords: ["ngo"],
  serpQueries: [],
  atsBoards: { greenhouse: [], lever: [] },
  apiSources: [],
  tags: {
    "project-management": ["project manager", "programme manager"],
    "climate": ["climate", "sustainability", "net zero"],
    "grant-management": ["grant manager", "grant writer"],
  },
  theme: { primaryColor: "#000", accentColor: "#111" },
  seo: { titleTemplate: "%s", description: "test" },
};

beforeEach(() => {
  vi.restoreAllMocks();
  process.env.ANTHROPIC_API_KEY = "test-key";
});

describe("extractJobFromText", () => {
  it("extracts a full job from LLM response", async () => {
    const mockCreate = await getMockCreate();
    mockCreate.mockResolvedValue({
      content: [{
        type: "text",
        text: JSON.stringify({
          title: "Senior Project Manager",
          description: "<p>Lead humanitarian projects across East Africa.</p>",
          datePosted: "2025-02-01",
          validThrough: "2025-03-15",
          employmentType: "FULL_TIME",
          organizationName: "Oxfam",
          organizationUrl: "https://oxfam.org",
          locationAddress: "Nairobi",
          locationRegion: "Nairobi County",
          locationCountry: "KE",
          isRemote: false,
          salaryCurrency: "USD",
          salaryMin: 65000,
          salaryMax: 85000,
          salaryUnit: "YEAR",
          skills: ["project management", "stakeholder engagement", "M&E", "budgeting"],
          industry: "Humanitarian",
          matchedTags: ["project-management"],
        }),
      }],
    });

    const { extractJobFromText } = await import("../aggregator/llm-extractor");
    const result = await extractJobFromText(
      "Some page text about a project manager role at Oxfam...",
      "https://oxfam.org/jobs/123",
      TEST_NICHE,
    );

    expect(result).not.toBeNull();
    const { job, tags } = result!;

    // Core fields
    expect(job.title).toBe("Senior Project Manager");
    expect(job.description).toContain("Lead humanitarian projects");
    expect(job.source).toBe("scraper");
    expect(job.applyUrl).toBe("https://oxfam.org/jobs/123");

    // Organization
    expect(job.hiringOrganization.name).toBe("Oxfam");
    expect(job.hiringOrganization.sameAs).toBe("https://oxfam.org");

    // Location
    expect(job.jobLocation).not.toBeNull();
    expect(job.jobLocation?.address).toBe("Nairobi");
    expect(job.jobLocation?.addressCountry).toBe("KE");
    expect(job.jobLocationType).toBeNull(); // not remote

    // Employment
    expect(job.employmentType).toBe("FULL_TIME");

    // Salary
    expect(job.baseSalary).not.toBeNull();
    expect(job.baseSalary?.currency).toBe("USD");
    expect(job.baseSalary?.minValue).toBe(65000);
    expect(job.baseSalary?.maxValue).toBe(85000);
    expect(job.baseSalary?.unitText).toBe("YEAR");

    // Skills
    expect(job.skills).toContain("project management");
    expect(job.skills).toContain("M&E");
    expect(job.skills.length).toBeLessThanOrEqual(15);

    // Tags (semantic)
    expect(tags).toContain("project-management");
  });

  it("handles remote jobs", async () => {
    const mockCreate = await getMockCreate();
    mockCreate.mockResolvedValue({
      content: [{
        type: "text",
        text: JSON.stringify({
          title: "Remote Climate Analyst",
          description: "<p>Work from anywhere</p>",
          datePosted: null,
          validThrough: null,
          employmentType: "CONTRACT",
          organizationName: "Green Corp",
          organizationUrl: null,
          locationAddress: null,
          locationRegion: null,
          locationCountry: null,
          isRemote: true,
          salaryCurrency: null,
          salaryMin: null,
          salaryMax: null,
          salaryUnit: null,
          skills: ["data analysis", "climate modeling"],
          industry: "Environment",
          matchedTags: ["climate"],
        }),
      }],
    });

    const { extractJobFromText } = await import("../aggregator/llm-extractor");
    const result = await extractJobFromText("Remote climate job...", "https://example.com/job", TEST_NICHE);

    expect(result).not.toBeNull();
    const { job, tags } = result!;

    expect(job.jobLocationType).toBe("TELECOMMUTE");
    expect(job.jobLocation).toBeNull();
    expect(job.baseSalary).toBeNull();
    expect(job.employmentType).toBe("CONTRACT");
    expect(tags).toContain("climate");
  });

  it("handles salary with only min value", async () => {
    const mockCreate = await getMockCreate();
    mockCreate.mockResolvedValue({
      content: [{
        type: "text",
        text: JSON.stringify({
          title: "Grant Writer",
          description: "<p>Write grants</p>",
          datePosted: null,
          validThrough: null,
          employmentType: null,
          organizationName: "Charity UK",
          organizationUrl: null,
          locationAddress: "Edinburgh",
          locationRegion: "Scotland",
          locationCountry: "GB",
          isRemote: false,
          salaryCurrency: "GBP",
          salaryMin: 35000,
          salaryMax: null,
          salaryUnit: "YEAR",
          skills: ["grant writing"],
          industry: null,
          matchedTags: ["grant-management"],
        }),
      }],
    });

    const { extractJobFromText } = await import("../aggregator/llm-extractor");
    const result = await extractJobFromText("Grant writer role...", "https://example.com/gw", TEST_NICHE);

    expect(result).not.toBeNull();
    expect(result!.job.baseSalary).not.toBeNull();
    expect(result!.job.baseSalary?.minValue).toBe(35000);
    expect(result!.job.baseSalary?.maxValue).toBeNull();
  });

  it("returns null for non-job pages", async () => {
    const mockCreate = await getMockCreate();
    mockCreate.mockResolvedValue({
      content: [{
        type: "text",
        text: JSON.stringify({
          title: "",
          description: null,
          datePosted: null,
          validThrough: null,
          employmentType: null,
          organizationName: "",
          organizationUrl: null,
          locationAddress: null,
          locationRegion: null,
          locationCountry: null,
          isRemote: false,
          salaryCurrency: null,
          salaryMin: null,
          salaryMax: null,
          salaryUnit: null,
          skills: [],
          industry: null,
          matchedTags: [],
        }),
      }],
    });

    const { extractJobFromText } = await import("../aggregator/llm-extractor");
    const result = await extractJobFromText("This is a blog post about cats", "https://blog.com/cats", TEST_NICHE);

    expect(result).toBeNull();
  });

  it("returns null when LLM returns invalid JSON", async () => {
    const mockCreate = await getMockCreate();
    mockCreate.mockResolvedValue({
      content: [{
        type: "text",
        text: "Sorry, I can't parse that page properly.",
      }],
    });

    const { extractJobFromText } = await import("../aggregator/llm-extractor");
    const result = await extractJobFromText("Garbled content", "https://example.com/bad", TEST_NICHE);

    expect(result).toBeNull();
  });

  it("rejects invalid employment types", async () => {
    const mockCreate = await getMockCreate();
    mockCreate.mockResolvedValue({
      content: [{
        type: "text",
        text: JSON.stringify({
          title: "Some Role",
          description: "<p>Desc</p>",
          datePosted: null,
          validThrough: null,
          employmentType: "PERMANENT",  // not a valid Google type
          organizationName: "Org",
          organizationUrl: null,
          locationAddress: null,
          locationRegion: null,
          locationCountry: null,
          isRemote: false,
          salaryCurrency: null,
          salaryMin: null,
          salaryMax: null,
          salaryUnit: null,
          skills: [],
          industry: null,
          matchedTags: [],
        }),
      }],
    });

    const { extractJobFromText } = await import("../aggregator/llm-extractor");
    const result = await extractJobFromText("Job page", "https://example.com/job", TEST_NICHE);

    expect(result).not.toBeNull();
    expect(result!.job.employmentType).toBeNull(); // invalid type should be nulled
  });

  it("defaults salary unit to YEAR when LLM returns invalid unit", async () => {
    const mockCreate = await getMockCreate();
    mockCreate.mockResolvedValue({
      content: [{
        type: "text",
        text: JSON.stringify({
          title: "Analyst",
          description: "<p>Analyze things</p>",
          datePosted: null,
          validThrough: null,
          employmentType: null,
          organizationName: "Corp",
          organizationUrl: null,
          locationAddress: null,
          locationRegion: null,
          locationCountry: null,
          isRemote: false,
          salaryCurrency: "GBP",
          salaryMin: 40000,
          salaryMax: 50000,
          salaryUnit: "ANNUAL",  // not a valid unit
          skills: [],
          industry: null,
          matchedTags: [],
        }),
      }],
    });

    const { extractJobFromText } = await import("../aggregator/llm-extractor");
    const result = await extractJobFromText("Job page", "https://example.com/j", TEST_NICHE);

    expect(result!.job.baseSalary?.unitText).toBe("YEAR");
  });

  it("caps skills at 15", async () => {
    const mockCreate = await getMockCreate();
    const manySkills = Array.from({ length: 25 }, (_, i) => `skill-${i}`);
    mockCreate.mockResolvedValue({
      content: [{
        type: "text",
        text: JSON.stringify({
          title: "Multi-skilled Role",
          description: "<p>Many skills needed</p>",
          datePosted: null,
          validThrough: null,
          employmentType: null,
          organizationName: "Org",
          organizationUrl: null,
          locationAddress: null,
          locationRegion: null,
          locationCountry: null,
          isRemote: false,
          salaryCurrency: null,
          salaryMin: null,
          salaryMax: null,
          salaryUnit: null,
          skills: manySkills,
          industry: null,
          matchedTags: [],
        }),
      }],
    });

    const { extractJobFromText } = await import("../aggregator/llm-extractor");
    const result = await extractJobFromText("Job page", "https://example.com/j", TEST_NICHE);

    expect(result!.job.skills).toHaveLength(15);
  });

  it("generates stable source_id from URL", async () => {
    const mockCreate = await getMockCreate();
    const mockResponse = {
      content: [{
        type: "text",
        text: JSON.stringify({
          title: "Test",
          description: null,
          datePosted: null,
          validThrough: null,
          employmentType: null,
          organizationName: "Org",
          organizationUrl: null,
          locationAddress: null,
          locationRegion: null,
          locationCountry: null,
          isRemote: false,
          salaryCurrency: null,
          salaryMin: null,
          salaryMax: null,
          salaryUnit: null,
          skills: [],
          industry: null,
          matchedTags: [],
        }),
      }],
    };

    mockCreate.mockResolvedValue(mockResponse);
    const { extractJobFromText } = await import("../aggregator/llm-extractor");

    const result1 = await extractJobFromText("Page", "https://example.com/job/42", TEST_NICHE);
    mockCreate.mockResolvedValue(mockResponse);
    const result2 = await extractJobFromText("Page", "https://example.com/job/42", TEST_NICHE);

    expect(result1!.job.source_id).toBe(result2!.job.source_id);
    expect(result1!.job.source_id).toMatch(/^llm-/);
  });

  it("uses custom source when provided", async () => {
    const mockCreate = await getMockCreate();
    mockCreate.mockResolvedValue({
      content: [{
        type: "text",
        text: JSON.stringify({
          title: "Test",
          description: null,
          datePosted: null,
          validThrough: null,
          employmentType: null,
          organizationName: "Org",
          organizationUrl: null,
          locationAddress: null,
          locationRegion: null,
          locationCountry: null,
          isRemote: false,
          salaryCurrency: null,
          salaryMin: null,
          salaryMax: null,
          salaryUnit: null,
          skills: [],
          industry: null,
          matchedTags: [],
        }),
      }],
    });

    const { extractJobFromText } = await import("../aggregator/llm-extractor");
    const result = await extractJobFromText("Page", "https://example.com/j", TEST_NICHE, "serper");

    expect(result!.job.source).toBe("serper");
  });

  it("calls Anthropic with correct model and max_tokens", async () => {
    const mockCreate = await getMockCreate();
    mockCreate.mockResolvedValue({
      content: [{
        type: "text",
        text: JSON.stringify({
          title: "Test",
          description: null,
          datePosted: null,
          validThrough: null,
          employmentType: null,
          organizationName: "Org",
          organizationUrl: null,
          locationAddress: null,
          locationRegion: null,
          locationCountry: null,
          isRemote: false,
          salaryCurrency: null,
          salaryMin: null,
          salaryMax: null,
          salaryUnit: null,
          skills: [],
          industry: null,
          matchedTags: [],
        }),
      }],
    });

    const { extractJobFromText } = await import("../aggregator/llm-extractor");
    await extractJobFromText("Page text", "https://example.com", TEST_NICHE);

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4096,
      }),
    );
  });
});
