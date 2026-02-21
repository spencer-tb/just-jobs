import type { RawJob } from "../types";

interface ReliefWebJob {
  id: number;
  fields: {
    title: string;
    body: string;
    url: string;
    date: { created: string; closing?: string };
    source?: Array<{ name: string; homepage?: string }>;
    country?: Array<{ name: string; iso3?: string }>;
    type?: Array<{ name: string }>;
    theme?: Array<{ name: string }>;
  };
}

interface ReliefWebResponse {
  count: number;
  data: ReliefWebJob[];
}

const RELIEFWEB_API = "https://api.reliefweb.int/v2/jobs";

export async function fetchReliefWebJobs(
  filters?: Record<string, string[]>
): Promise<RawJob[]> {
  const appname = process.env.RELIEFWEB_APPNAME;
  if (!appname) {
    console.warn("Skipping ReliefWeb: RELIEFWEB_APPNAME not set. Register at https://apidoc.reliefweb.int/parameters#appname");
    return [];
  }

  const body: Record<string, unknown> = {
    limit: 1000,
    fields: {
      include: ["title", "body", "url", "date", "source", "country", "type", "theme"],
    },
    sort: ["date.created:desc"],
  };

  if (filters && Object.keys(filters).length > 0) {
    const conditions = Object.entries(filters).map(([field, values]) => ({
      field: `${field}.name`,
      value: values,
      operator: "OR",
    }));
    body.filter = { conditions };
  }

  const response = await fetch(`${RELIEFWEB_API}?appname=${encodeURIComponent(appname)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`ReliefWeb API error: ${response.status} ${response.statusText}`);
  }

  const data: ReliefWebResponse = await response.json();

  return data.data.map((item) => {
    const country = item.fields.country?.[0];

    return {
      title: item.fields.title,
      description: item.fields.body || null,
      datePosted: item.fields.date?.created || null,
      validThrough: item.fields.date?.closing || null,
      employmentType: null,
      hiringOrganization: {
        name: item.fields.source?.[0]?.name || "Unknown Organization",
        sameAs: item.fields.source?.[0]?.homepage || null,
        logo: null,
      },
      jobLocation: country ? {
        address: item.fields.country?.map((c) => c.name).join(", ") || null,
        postalCode: null,
        addressRegion: null,
        addressCountry: country.iso3 || null,
      } : null,
      jobLocationType: null,
      baseSalary: null,
      applyUrl: item.fields.url,
      source: "reliefweb" as const,
      source_id: String(item.id),
      skills: [],
      industry: item.fields.theme?.map((t) => t.name).join(", ") || null,
    };
  });
}
