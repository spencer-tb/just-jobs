# just-jobs

A multi-niche job board aggregator. One codebase powers multiple niche job sites — each niche is just a JSON config file that defines data sources, tags, theme colours, and SEO.

Built for the NGO/charity/climate sector first, but designed to work for any niche.

## Features

- **Multi-source aggregation** — pulls jobs from Greenhouse, Lever, Ashby, ReliefWeb, and Google SERP (via Serper.dev)
- **Google JobPosting schema** — canonical data format throughout the stack, from ingestion to JSON-LD SEO output
- **Niche-as-config** — add a new job board niche with a single JSON file (tags, sources, theme, queries)
- **Deduplication** — SHA-256 fingerprinting prevents duplicate listings across sources
- **Full-text search** — weighted PostgreSQL FTS (title > company > description)
- **Tag filtering** — keyword-based categorisation driven by niche config
- **Remote job filter** — first-class support for TELECOMMUTE job type
- **JSON-LD structured data** — every job page outputs Google Jobs-compatible markup
- **Responsive UI** — clean, minimal design with niche-specific theming

## Quick Start

```sh
# Clone and install
git clone <repo-url> just-jobs
cd just-jobs
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Set up database
# Run supabase/migration.sql in your Supabase SQL Editor

# Test data sources (no DB needed)
npm run test-sources

# Ingest jobs into database
npm run ingest

# Start dev server
npm run dev
```

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    GENERIC FRAMEWORK                 │
│                                                      │
│  Sources          Pipeline           Frontend        │
│  ┌──────────┐    ┌──────────────┐   ┌────────────┐  │
│  │Greenhouse│───▸│              │   │ Home page  │  │
│  │Lever     │───▸│  Fingerprint │   │ Job detail │  │
│  │Ashby     │───▸│  + Tag       │──▸│ JSON-LD    │  │
│  │ReliefWeb │───▸│  + Store     │   │ Search     │  │
│  │Serper    │───▸│              │   │ Filters    │  │
│  └──────────┘    └──────────────┘   └────────────┘  │
└─────────────────────────────────────────────────────┘
                          │
              ┌───────────┴───────────┐
              │   NICHE CONFIG (JSON) │
              │                       │
              │ - ATS board slugs     │
              │ - SERP queries        │
              │ - Tag keywords        │
              │ - Theme colours       │
              │ - SEO metadata        │
              └───────────────────────┘
```

Everything in `src/` is **generic** — it works for any niche without modification. The only niche-specific files are JSON configs in `niches/`.

## Data Sources

| Source | Type | Auth | Notes |
|--------|------|------|-------|
| Greenhouse | ATS API | None | Public board API, ~277 NGO/climate jobs found |
| Lever | ATS API | None | Public postings API |
| Ashby | ATS API | None | Public job board API |
| ReliefWeb | REST API | Appname | Requires registration, 1000 results/call |
| Serper.dev | SERP API | API Key | Google organic search results, 2500 free queries |

## Current Niches

### NGO Jobs (`niches/ngo/config.json`)
- 15 Greenhouse boards (IRC, ACLU, GiveDirectly, One Acre Fund, etc.)
- 4 Lever boards (Sierra Club, charity: water, Brookings, Abt)
- ReliefWeb API with type filters
- 14 Edinburgh/Scotland/UK-targeted SERP queries
- Tags: project management, grant writing, climate, advocacy, monitoring & evaluation

### Climate Jobs (`niches/climate/config.json`)
- 3 Greenhouse boards (Greenpeace, etc.)
- 1 Lever board (Sierra Club)
- 5 climate-specific SERP queries

## Adding a New Niche

1. Create `niches/<your-niche>/config.json`:

```json
{
  "id": "your-niche",
  "name": "Your Niche Jobs",
  "domain": "yourniche.jobs",
  "tagline": "Find your next role",
  "keywords": ["keyword1", "keyword2"],
  "serpQueries": ["your niche jobs UK"],
  "atsBoards": {
    "greenhouse": ["company-slug"],
    "lever": ["company-slug"]
  },
  "apiSources": [],
  "tags": {
    "category-name": ["keyword1", "keyword2"]
  },
  "theme": {
    "primaryColor": "#2563eb",
    "accentColor": "#1e40af"
  },
  "seo": {
    "titleTemplate": "Your Niche Jobs — %s",
    "description": "Your niche job board description"
  }
}
```

2. Register in `src/lib/niche.ts`
3. Set `NICHE_ID=your-niche` and deploy

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NICHE_ID` | Yes | Which niche config to use (default: `ngo`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-side only) |
| `RELIEFWEB_APPNAME` | No | ReliefWeb API appname (skips if not set) |
| `SERPER_API_KEY` | No | Serper.dev API key (skips if not set) |
| `ANTHROPIC_API_KEY` | No | For LLM extraction of scraped job pages |

## Tech Stack

- **Next.js 16** — App Router, React Server Components
- **TypeScript** — strict mode
- **Tailwind CSS v4** — utility-first styling
- **Supabase** — Postgres database with RLS, full-text search
- **Vercel** — deployment (one project per niche, same repo)

## Deployment

Each niche is a separate Vercel deployment sharing the same codebase:

1. Connect your repo to Vercel
2. Set environment variables (including `NICHE_ID`)
3. Deploy
4. Set up a cron job or Vercel Cron to run `npm run ingest` periodically

## LLM Extraction

Jobs from scraped pages go through Claude Haiku for structured extraction:

```
URL → page-fetcher (strip HTML) → llm-extractor (Claude Haiku) → RawJob + tags + skills
```

The LLM extracts title, org, location, salary, employment type, skills, and semantically matches the niche's tag categories — so a "Climate Policy Analyst" role matches the "climate" tag even without exact keyword hits.

Test it on any job page URL:
```sh
npx tsx scripts/test-llm-extractor.ts https://www.charityjob.co.uk/jobs/some-posting
```

ATS jobs (Greenhouse, Lever, etc.) still use free keyword-based tagging since their data is already structured.

## Roadmap

- [x] Multi-source ATS aggregation (Greenhouse, Lever, Ashby)
- [x] ReliefWeb API integration
- [x] Google SERP via Serper.dev
- [x] LLM extraction (Claude Haiku) for scraped pages
- [x] Semantic tagging via LLM
- [ ] Job board listing crawlers (CharityJob, Goodmoves → URL discovery)
- [ ] Email alerts for new job matches
- [ ] Salary data enrichment
