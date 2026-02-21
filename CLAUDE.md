# just-jobs

Multi-niche job board aggregator. One codebase, many niche job sites. Each niche is a JSON config that defines which sources to scrape, how to tag/filter, and how the frontend looks.

## Tech Stack

- **Next.js 16** (App Router, TypeScript, Tailwind v4)
- **Supabase** Postgres (database, auth, RLS)
- **Vercel** (hosting, free tier)

## Commands

```sh
npm run dev           # Start dev server
npm run build         # Production build
npm run lint          # ESLint
npm run ingest        # Fetch jobs from all sources → Supabase
npm run test-sources  # Test ATS/API sources without Supabase
```

## Directory Structure

```
src/
  app/                    # Next.js pages (generic — works for any niche)
    page.tsx              # Home: job list with search/filter/pagination
    jobs/[id]/page.tsx    # Job detail with JSON-LD structured data
    layout.tsx            # Niche-themed layout
  components/             # React components (generic)
    job-card.tsx          # Job listing card
    search-bar.tsx        # Full-text search
    tag-filter.tsx        # Tag + remote filters
  lib/
    types.ts              # Canonical types: Job, RawJob, NicheConfig
    db.ts                 # Supabase queries, maps DB rows → Job objects
    supabase.ts           # Supabase client (admin + public)
    niche.ts              # Loads niche config from NICHE_ID env var
    fingerprint.ts        # SHA-256 dedup on title|company|location
    tags.ts               # Keyword-based tagging from niche config
    job-boards.ts         # Registry of 35+ known job board domains
    aggregator/
      index.ts            # Pipeline: fetch → fingerprint → tag → store
      greenhouse.ts       # Greenhouse ATS public API adapter
      lever.ts            # Lever ATS public API adapter
      ashby.ts            # Ashby ATS public API adapter
      smartrecruiters.ts  # SmartRecruiters ATS public API adapter
      reliefweb.ts        # ReliefWeb API v2 adapter
      google-cse.ts       # Google Custom Search Engine (100 free queries/day)
      serper.ts           # Google SERP via Serper.dev adapter (fallback)
      llm-extractor.ts    # Claude Haiku extraction: HTML → structured RawJob + tags
      page-fetcher.ts     # Fetch URL → stripped text (removes scripts/styles/nav)
      scraper.ts          # Generic scraper: URL list → LLM extract → RawJob[]
scripts/
  ingest.ts               # CLI entrypoint for job ingestion
  test-sources.ts         # Validate ATS boards without DB
  test-llm-extractor.ts   # Test LLM extraction on a single URL
niches/
  ngo/config.json         # NGO niche: boards, queries, tags, theme
  climate/config.json     # Climate niche: boards, queries, tags, theme
supabase/
  migration.sql           # DB schema (run in Supabase SQL Editor)
```

## Schema

Everything uses **Google JobPosting** (schema.org/JobPosting) as the canonical format:
- Source adapters output `RawJob` (Google-aligned fields)
- Pipeline flattens to DB columns (`org_name`, `location_address`, `date_posted`, etc.)
- `db.ts` maps DB rows back to nested `Job` objects
- Frontend reads `Job` directly
- JSON-LD output is a direct mapping from `Job` fields

Key types in `src/lib/types.ts`:
- `RawJob` — output of any source adapter (no internal fields)
- `Job` — full record with internal fields (id, niche, status, fingerprint, tags)
- `NicheConfig` — niche definition (sources, tags, theme, SEO)

## Data Flow

```
ATS APIs (Greenhouse, Lever, Ashby, SmartRecruiters, ReliefWeb)
  + Search APIs (Google CSE or Serper.dev)
  → RawJob[]
  → fingerprint (dedup)
  → tagJob (keyword match)        ← free, fast
  → flatten to DB columns
  → Supabase upsert

Scraped URLs (scraperUrls in config)
  → page-fetcher (HTML → text)
  → llm-extractor (Claude Haiku)
  → RawJob[] + semantic tags       ← LLM does tagging + skill extraction
  → fingerprint (dedup)
  → flatten to DB columns
  → Supabase upsert

DB → db.ts rowToJob() → Job → Frontend / JSON-LD
```

## Adding a New Niche

1. Create `niches/<niche-id>/config.json` following `NicheConfig` interface
2. Register it in `src/lib/niche.ts` (import + add to `niches` map)
3. Set `NICHE_ID=<niche-id>` in `.env.local`
4. Deploy as a separate Vercel project (same repo, different env var)

## Environment Variables

```
NICHE_ID=ngo                          # Which niche to serve
NEXT_PUBLIC_SUPABASE_URL=...          # Supabase project URL
SUPABASE_SERVICE_ROLE_KEY=...         # Supabase service role key
RELIEFWEB_APPNAME=...                 # ReliefWeb API appname (register at reliefweb.int)
GOOGLE_CSE_API_KEY=...                # Google Custom Search API key (100 free/day)
GOOGLE_CSE_CX=...                     # Google Programmable Search Engine ID
SERPER_API_KEY=...                    # Serper.dev API key (fallback if no Google CSE)
ANTHROPIC_API_KEY=...                 # For LLM extraction of scraped pages (optional)
```

## DB Column Naming

The DB uses snake_case columns that map to the Google JobPosting fields:
- `org_name` / `org_url` / `org_logo` → `hiringOrganization`
- `location_address` / `location_region` / `location_country` → `jobLocation`
- `job_location_type` → `jobLocationType` ("TELECOMMUTE" or null)
- `salary_currency` / `salary_min` / `salary_max` / `salary_unit` → `baseSalary`
- `date_posted` → `datePosted`
- `valid_through` → `validThrough`
- `apply_url` → `applyUrl`
- `employment_type` → `employmentType`

## Tagging Strategy

Two tagging paths depending on source:
- **ATS jobs** (Greenhouse, Lever, Ashby, ReliefWeb): keyword matching via `tags.ts` — free, fast
- **Scraped jobs** (scraperUrls): LLM does semantic tagging + skill extraction during extraction — smarter, costs ~$0.001/job via Haiku

The LLM extractor receives the niche's tag categories and semantically matches them, so a "Climate Policy Analyst" role matches "climate" even without exact keyword hits.

## Pending Work

- Job board scrapers (CharityJob, Goodmoves listing page crawlers → individual URLs)
- Email alerts for new jobs matching user criteria
- Supabase project setup + ReliefWeb appname registration
