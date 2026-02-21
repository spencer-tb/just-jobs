import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NicheConfig } from "../types";

/**
 * Tests using real job data from actual API responses.
 * These are snapshot fixtures — the LLM is mocked but the inputs
 * are real page content that the extractor would see.
 */

vi.mock("@anthropic-ai/sdk", () => {
  const mockCreate = vi.fn();
  return {
    default: class MockAnthropic {
      messages = { create: mockCreate };
    },
    __mockCreate: mockCreate,
  };
});

async function getMockCreate() {
  const mod = await import("@anthropic-ai/sdk");
  return (mod as unknown as { __mockCreate: ReturnType<typeof vi.fn> }).__mockCreate;
}

const NGO_NICHE: NicheConfig = {
  id: "ngo",
  name: "Just Jobs — NGO",
  domain: "justjobs.org",
  tagline: "Find meaningful work in the nonprofit sector",
  keywords: ["ngo", "nonprofit", "charity"],
  serpQueries: [],
  atsBoards: { greenhouse: [], lever: [] },
  apiSources: [],
  tags: {
    "project-management": ["project manager", "programme manager", "project coordinator"],
    "grant-management": ["grant manager", "grant writer", "grants officer"],
    "climate": ["climate", "sustainability", "net zero", "environmental"],
    "fundraising": ["fundraiser", "fundraising", "donor relations"],
    "monitoring-evaluation": ["M&E", "monitoring and evaluation", "MEAL"],
  },
  theme: { primaryColor: "#059669", accentColor: "#0d9488" },
  seo: { titleTemplate: "%s | Just Jobs", description: "NGO jobs" },
};

beforeEach(() => {
  vi.restoreAllMocks();
  process.env.ANTHROPIC_API_KEY = "test-key";
});

// ============================================================
// Real Greenhouse job: Data Engineer at Rescue.co
// Source: https://boards-api.greenhouse.io/v1/boards/rescue/jobs
// ============================================================

describe("Real job: Greenhouse — Data Engineer at Rescue.co", () => {
  it("Greenhouse adapter maps real API response correctly", async () => {
    const realGreenhouseResponse = {
      jobs: [{
        id: 4000114009,
        title: "Data Engineer ",
        location: { name: "Remote, on EMEA time zones, spanning GMT to GMT+3" },
        content: "<div class=\"content-intro\"><h3><strong>The company</strong></h3>\n<p>At Rescue.co, we build technology that saves lives. Every day, our dispatch systems connect people in urgent need with medical, security, and roadside assistance.</p></div><h2><strong>About the role:</strong></h2>\n<p>We are seeking a versatile and innovative Data Engineer who excels at the intersection of data engineering, full-stack development, and AI-powered integrations.</p>",
        updated_at: "2025-04-30T11:59:02-04:00",
        absolute_url: "https://job-boards.greenhouse.io/rescue/jobs/4000114009",
        departments: [{ name: "Engineering" }],
        offices: [{ name: "Remote" }],
      }],
    };

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(realGreenhouseResponse),
    }));

    const { fetchGreenhouseJobs } = await import("../aggregator/greenhouse");
    const jobs = await fetchGreenhouseJobs("rescue");

    expect(jobs).toHaveLength(1);
    const job = jobs[0];

    expect(job.title).toBe("Data Engineer ");
    expect(job.source).toBe("greenhouse");
    expect(job.source_id).toBe("gh-rescue-4000114009");
    expect(job.applyUrl).toBe("https://job-boards.greenhouse.io/rescue/jobs/4000114009");
    expect(job.datePosted).toBe("2025-04-30T11:59:02-04:00");
    expect(job.description).toContain("Rescue.co");
    expect(job.description).toContain("Data Engineer");

    // Location includes "Remote" so should be flagged
    expect(job.jobLocation?.address).toBe("Remote, on EMEA time zones, spanning GMT to GMT+3");
    expect(job.jobLocationType).toBe("TELECOMMUTE");
  });
});

// ============================================================
// Real Lever job: Campaign Director at Sierra Club
// Source: https://api.lever.co/v0/postings/sierraclub
// ============================================================

describe("Real job: Lever — Campaign Director at Sierra Club", () => {
  it("Lever adapter maps real API response correctly", async () => {
    const realLeverResponse = [{
      id: "1e53fe7d-66ae-40cc-aff8-4b660e137c51",
      text: "Campaign Director",
      categories: {
        commitment: "Regular - Full Time",
        department: "Strategy",
        location: "Remote",
        team: "Campaign Strategy",
      },
      description: "<div><b>Job Title:</b> Campaign Director, Industrial Transformation</div><div><b>Department:</b> Campaign Strategy</div><div>At the Sierra Club, we believe in the power of interdependence. Together, we remain committed to the fight for a healthy climate.</div>",
      descriptionPlain: "Job Title: Campaign Director, Industrial Transformation\nDepartment: Campaign Strategy\nAt the Sierra Club, we believe in the power of interdependence.",
      lists: [],
      hostedUrl: "https://jobs.lever.co/sierraclub/1e53fe7d-66ae-40cc-aff8-4b660e137c51",
      applyUrl: "https://jobs.lever.co/sierraclub/1e53fe7d-66ae-40cc-aff8-4b660e137c51/apply",
      createdAt: 1771619456300,
    }];

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(realLeverResponse),
    }));

    const { fetchLeverJobs } = await import("../aggregator/lever");
    const jobs = await fetchLeverJobs("sierraclub");

    expect(jobs).toHaveLength(1);
    const job = jobs[0];

    expect(job.title).toBe("Campaign Director");
    expect(job.source).toBe("lever");
    expect(job.source_id).toBe("lv-sierraclub-1e53fe7d-66ae-40cc-aff8-4b660e137c51");
    expect(job.applyUrl).toBe("https://jobs.lever.co/sierraclub/1e53fe7d-66ae-40cc-aff8-4b660e137c51");
    expect(job.description).toContain("Sierra Club");
    expect(job.description).toContain("Campaign Director");

    // Location is "Remote"
    expect(job.jobLocation?.address).toBe("Remote");
    expect(job.jobLocationType).toBe("TELECOMMUTE");

    // Has a created date
    expect(job.datePosted).toBeTruthy();
    expect(new Date(job.datePosted!).getFullYear()).toBeGreaterThanOrEqual(2025);
  });
});

// ============================================================
// Real LLM extraction: simulate what Haiku returns for a
// CharityJob page (the kind of scraped page we'd process)
// ============================================================

describe("Real job: LLM extraction — CharityJob-style page", () => {
  // This is the kind of page text page-fetcher would produce from a CharityJob listing
  const REAL_PAGE_TEXT = `
    Programme Manager - Climate Action Edinburgh, Scotland Salary: £35,000 - £42,000 per annum
    Scottish Wildlife Trust Closing date: 15 Mar 2025 Full-time, permanent
    About the role We are looking for a dynamic Programme Manager to lead our climate action
    programme across Scotland. You will manage a portfolio of projects focused on peatland
    restoration, community engagement, and policy advocacy. Key responsibilities: Lead the
    development and delivery of the climate action programme Manage relationships with funders
    including Scottish Government and EU LIFE programme Oversee monitoring and evaluation frameworks
    Line manage a team of 3 project officers Prepare grant reports and funding applications
    About you Essential: Proven experience in programme/project management within the environmental
    or charity sector Understanding of Scottish climate policy landscape Experience managing budgets
    over £500k Strong stakeholder engagement skills Desirable: Knowledge of peatland ecology
    PRINCE2 or equivalent project management qualification Experience with EU funding mechanisms
    Benefits: 34 days annual leave Pension scheme Flexible working Cycle to work scheme
    How to apply: Visit our website scottishwildlifetrust.org.uk/careers
  `;

  it("extracts structured data from realistic CharityJob page text", async () => {
    const mockCreate = await getMockCreate();

    // This is what we'd expect Haiku to return for the above page
    mockCreate.mockResolvedValue({
      content: [{
        type: "text",
        text: JSON.stringify({
          title: "Programme Manager - Climate Action",
          description: "<h3>About the role</h3><p>We are looking for a dynamic Programme Manager to lead our climate action programme across Scotland. You will manage a portfolio of projects focused on peatland restoration, community engagement, and policy advocacy.</p><h3>Key responsibilities</h3><ul><li>Lead the development and delivery of the climate action programme</li><li>Manage relationships with funders including Scottish Government and EU LIFE programme</li><li>Oversee monitoring and evaluation frameworks</li><li>Line manage a team of 3 project officers</li><li>Prepare grant reports and funding applications</li></ul><h3>About you</h3><p><strong>Essential:</strong></p><ul><li>Proven experience in programme/project management within the environmental or charity sector</li><li>Understanding of Scottish climate policy landscape</li><li>Experience managing budgets over £500k</li><li>Strong stakeholder engagement skills</li></ul><p><strong>Desirable:</strong></p><ul><li>Knowledge of peatland ecology</li><li>PRINCE2 or equivalent project management qualification</li><li>Experience with EU funding mechanisms</li></ul><h3>Benefits</h3><ul><li>34 days annual leave</li><li>Pension scheme</li><li>Flexible working</li><li>Cycle to work scheme</li></ul>",
          datePosted: null,
          validThrough: "2025-03-15",
          employmentType: "FULL_TIME",
          organizationName: "Scottish Wildlife Trust",
          organizationUrl: "https://scottishwildlifetrust.org.uk",
          locationAddress: "Edinburgh",
          locationRegion: "Scotland",
          locationCountry: "GB",
          isRemote: false,
          salaryCurrency: "GBP",
          salaryMin: 35000,
          salaryMax: 42000,
          salaryUnit: "YEAR",
          skills: [
            "programme management",
            "project management",
            "stakeholder engagement",
            "budget management",
            "grant writing",
            "monitoring and evaluation",
            "climate policy",
            "team management",
          ],
          industry: "Environmental/Conservation",
          matchedTags: ["project-management", "climate", "grant-management", "monitoring-evaluation"],
        }),
      }],
    });

    const { extractJobFromText } = await import("../aggregator/llm-extractor");
    const result = await extractJobFromText(REAL_PAGE_TEXT, "https://www.charityjob.co.uk/jobs/swt/programme-manager", NGO_NICHE);

    expect(result).not.toBeNull();
    const { job, tags } = result!;

    // Title
    expect(job.title).toBe("Programme Manager - Climate Action");

    // Organization
    expect(job.hiringOrganization.name).toBe("Scottish Wildlife Trust");
    expect(job.hiringOrganization.sameAs).toBe("https://scottishwildlifetrust.org.uk");

    // Location — Edinburgh, Scotland
    expect(job.jobLocation).not.toBeNull();
    expect(job.jobLocation?.address).toBe("Edinburgh");
    expect(job.jobLocation?.addressRegion).toBe("Scotland");
    expect(job.jobLocation?.addressCountry).toBe("GB");
    expect(job.jobLocationType).toBeNull(); // not remote

    // Salary
    expect(job.baseSalary).not.toBeNull();
    expect(job.baseSalary?.currency).toBe("GBP");
    expect(job.baseSalary?.minValue).toBe(35000);
    expect(job.baseSalary?.maxValue).toBe(42000);
    expect(job.baseSalary?.unitText).toBe("YEAR");

    // Employment type
    expect(job.employmentType).toBe("FULL_TIME");

    // Closing date
    expect(job.validThrough).toBe("2025-03-15");

    // Skills — should have real skills from the listing
    expect(job.skills.length).toBeGreaterThanOrEqual(5);
    expect(job.skills).toContain("programme management");
    expect(job.skills).toContain("stakeholder engagement");

    // Description — full HTML, not truncated
    expect(job.description).toContain("<h3>");
    expect(job.description).toContain("peatland restoration");
    expect(job.description).toContain("PRINCE2");
    expect(job.description).toContain("Benefits");

    // Semantic tags — should match multiple niche categories
    expect(tags).toContain("project-management");
    expect(tags).toContain("climate");
    expect(tags).toContain("grant-management");
    expect(tags).toContain("monitoring-evaluation");

    // Source metadata
    expect(job.source).toBe("scraper");
    expect(job.source_id).toMatch(/^llm-/);
    expect(job.applyUrl).toBe("https://www.charityjob.co.uk/jobs/swt/programme-manager");
  });

  it("the prompt includes niche tag categories for semantic matching", async () => {
    const mockCreate = await getMockCreate();
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify({ title: "", description: null }) }],
    });

    const { extractJobFromText } = await import("../aggregator/llm-extractor");
    await extractJobFromText(REAL_PAGE_TEXT, "https://example.com", NGO_NICHE);

    const call = mockCreate.mock.calls[0][0];
    const prompt = call.messages[0].content;

    // Prompt should contain our niche tag categories
    expect(prompt).toContain("project-management");
    expect(prompt).toContain("climate");
    expect(prompt).toContain("grant-management");
    expect(prompt).toContain("programme manager");
    expect(prompt).toContain("sustainability");
  });
});

// ============================================================
// Edge case: page that isn't a job posting
// ============================================================

describe("Real edge case: non-job page", () => {
  it("returns null for a charity homepage", async () => {
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
    const result = await extractJobFromText(
      "Welcome to the Scottish Wildlife Trust. We are Scotland's leading nature conservation charity. Donate today. Our reserves. Get involved. Latest news about wildlife in Scotland.",
      "https://scottishwildlifetrust.org.uk",
      NGO_NICHE,
    );

    expect(result).toBeNull();
  });
});
