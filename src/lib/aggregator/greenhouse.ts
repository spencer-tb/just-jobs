import type { RawJob } from "../types";

interface GreenhouseJob {
  id: number;
  title: string;
  location: { name: string };
  content: string;
  updated_at: string;
  absolute_url: string;
  departments: Array<{ name: string }>;
  offices: Array<{ name: string }>;
}

interface GreenhouseResponse {
  jobs: GreenhouseJob[];
}

export async function fetchGreenhouseJobs(boardToken: string): Promise<RawJob[]> {
  const url = `https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs?content=true`;
  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 404) {
      console.warn(`Greenhouse board not found: ${boardToken}`);
      return [];
    }
    throw new Error(`Greenhouse API error for ${boardToken}: ${response.status}`);
  }

  const data: GreenhouseResponse = await response.json();

  return data.jobs.map((job) => {
    const locationName = job.location?.name || null;
    const isRemote = locationName?.toLowerCase().includes("remote") || false;

    return {
      title: job.title,
      description: job.content || null,
      datePosted: job.updated_at || null,
      validThrough: null,
      employmentType: null,
      hiringOrganization: {
        name: boardToken,
        sameAs: null,
        logo: null,
      },
      jobLocation: locationName ? {
        address: locationName,
        postalCode: null,
        addressRegion: null,
        addressCountry: null,
      } : null,
      jobLocationType: isRemote ? "TELECOMMUTE" as const : null,
      baseSalary: null,
      applyUrl: job.absolute_url,
      source: "greenhouse" as const,
      source_id: `gh-${boardToken}-${job.id}`,
      skills: [],
      industry: null,
    };
  });
}

export async function fetchGreenhouseBoardName(boardToken: string): Promise<string> {
  const url = `https://boards-api.greenhouse.io/v1/boards/${boardToken}`;
  const response = await fetch(url);
  if (!response.ok) return boardToken;
  const data = await response.json();
  return data.name || boardToken;
}
