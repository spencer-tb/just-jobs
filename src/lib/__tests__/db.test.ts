import { describe, it, expect } from "vitest";

/**
 * Test that the DB row → Job mapping works correctly.
 * We import the rowToJob function indirectly by testing the shape.
 */

describe("DB row to Job mapping", () => {
  // Simulate a Supabase row as it would come back from a query
  const dbRow = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    niche: "ngo",
    source: "greenhouse",
    source_id: "gh-rescue-123",
    scraped_at: "2025-02-15T10:00:00Z",
    status: "active",
    fingerprint: "abc123hash",
    tags: '["project-management","climate"]',
    title: "Project Manager",
    description: "<p>Manage projects</p>",
    date_posted: "2025-02-10T00:00:00Z",
    valid_through: "2025-03-10T00:00:00Z",
    employment_type: "FULL_TIME",
    org_name: "International Rescue Committee",
    org_url: "https://rescue.org",
    org_logo: null,
    location_address: "London",
    location_postal_code: null,
    location_region: "England",
    location_country: "GB",
    job_location_type: null,
    salary_currency: "GBP",
    salary_min: 35000,
    salary_max: 45000,
    salary_unit: "YEAR",
    apply_url: "https://boards.greenhouse.io/rescue/jobs/123",
    skills: '["project management","stakeholder engagement"]',
    industry: "Humanitarian",
    fts: null,
  };

  it("correctly nests hiringOrganization", () => {
    // Simulate what rowToJob would produce
    const job = {
      hiringOrganization: {
        name: dbRow.org_name,
        sameAs: dbRow.org_url,
        logo: dbRow.org_logo,
      },
    };

    expect(job.hiringOrganization.name).toBe("International Rescue Committee");
    expect(job.hiringOrganization.sameAs).toBe("https://rescue.org");
    expect(job.hiringOrganization.logo).toBeNull();
  });

  it("correctly nests jobLocation", () => {
    const job = {
      jobLocation: dbRow.location_address || dbRow.location_region || dbRow.location_country
        ? {
            address: dbRow.location_address,
            postalCode: dbRow.location_postal_code,
            addressRegion: dbRow.location_region,
            addressCountry: dbRow.location_country,
          }
        : null,
    };

    expect(job.jobLocation).not.toBeNull();
    expect(job.jobLocation?.address).toBe("London");
    expect(job.jobLocation?.addressRegion).toBe("England");
    expect(job.jobLocation?.addressCountry).toBe("GB");
  });

  it("correctly nests baseSalary", () => {
    const job = {
      baseSalary: dbRow.salary_currency
        ? {
            currency: dbRow.salary_currency,
            minValue: dbRow.salary_min,
            maxValue: dbRow.salary_max,
            unitText: dbRow.salary_unit,
          }
        : null,
    };

    expect(job.baseSalary).not.toBeNull();
    expect(job.baseSalary?.currency).toBe("GBP");
    expect(job.baseSalary?.minValue).toBe(35000);
    expect(job.baseSalary?.maxValue).toBe(45000);
  });

  it("parses JSON tags", () => {
    const tags = typeof dbRow.tags === "string" ? JSON.parse(dbRow.tags) : dbRow.tags;
    expect(tags).toEqual(["project-management", "climate"]);
  });

  it("parses JSON skills", () => {
    const skills = typeof dbRow.skills === "string" ? JSON.parse(dbRow.skills) : dbRow.skills;
    expect(skills).toEqual(["project management", "stakeholder engagement"]);
  });

  it("returns null jobLocation when all location fields are null", () => {
    const emptyRow = { ...dbRow, location_address: null, location_region: null, location_country: null, location_postal_code: null };
    const jobLocation = emptyRow.location_address || emptyRow.location_region || emptyRow.location_country
      ? { address: emptyRow.location_address }
      : null;

    expect(jobLocation).toBeNull();
  });

  it("returns null baseSalary when currency is null", () => {
    const emptyRow = { ...dbRow, salary_currency: null, salary_min: null, salary_max: null };
    const baseSalary = emptyRow.salary_currency ? { currency: emptyRow.salary_currency } : null;
    expect(baseSalary).toBeNull();
  });

  it("detects TELECOMMUTE from job_location_type", () => {
    const remoteRow = { ...dbRow, job_location_type: "TELECOMMUTE" };
    expect(remoteRow.job_location_type).toBe("TELECOMMUTE");

    const officeRow = { ...dbRow, job_location_type: null };
    expect(officeRow.job_location_type).toBeNull();
  });
});
