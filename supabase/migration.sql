-- Just Jobs — Database Schema (Google JobPosting-aligned)
-- Run this in Supabase SQL Editor to set up the database
--
-- This schema mirrors schema.org/JobPosting so that:
--   1. LLM extraction writes directly to it
--   2. Frontend reads directly from it
--   3. JSON-LD SEO output is a direct column read

-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
  -- Internal fields
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  niche TEXT NOT NULL,
  source TEXT NOT NULL,
  source_id TEXT NOT NULL,
  scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'duplicate')),
  fingerprint TEXT NOT NULL,
  tags JSONB DEFAULT '[]'::JSONB,

  -- Google JobPosting fields
  title TEXT NOT NULL,
  description TEXT,
  date_posted TIMESTAMPTZ,
  valid_through TIMESTAMPTZ,
  employment_type TEXT CHECK (employment_type IN (
    'FULL_TIME', 'PART_TIME', 'CONTRACT', 'TEMPORARY', 'INTERN', 'VOLUNTEER', NULL
  )),

  -- hiringOrganization
  org_name TEXT NOT NULL,
  org_url TEXT,
  org_logo TEXT,

  -- jobLocation
  location_address TEXT,
  location_postal_code TEXT,
  location_region TEXT,
  location_country TEXT,

  -- jobLocationType
  job_location_type TEXT CHECK (job_location_type IN ('TELECOMMUTE', NULL)),

  -- baseSalary
  salary_currency TEXT,
  salary_min INTEGER,
  salary_max INTEGER,
  salary_unit TEXT CHECK (salary_unit IN ('YEAR', 'MONTH', 'DAY', 'HOUR', NULL)),

  -- Other
  apply_url TEXT NOT NULL,
  skills JSONB DEFAULT '[]'::JSONB,
  industry TEXT,

  UNIQUE(source, source_id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_jobs_niche_status ON jobs(niche, status, date_posted DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_fingerprint ON jobs(fingerprint);
CREATE INDEX IF NOT EXISTS idx_jobs_org ON jobs(org_name);
CREATE INDEX IF NOT EXISTS idx_jobs_tags ON jobs USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_jobs_skills ON jobs USING GIN(skills);
CREATE INDEX IF NOT EXISTS idx_jobs_source ON jobs(source, source_id);
CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location_country, location_region);
CREATE INDEX IF NOT EXISTS idx_jobs_remote ON jobs(job_location_type) WHERE job_location_type = 'TELECOMMUTE';
CREATE INDEX IF NOT EXISTS idx_jobs_employment ON jobs(employment_type);

-- Full-text search (weighted: title > org > description)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS fts TSVECTOR
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(org_name, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'C')
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_jobs_fts ON jobs USING GIN(fts);

-- Row Level Security: allow public reads
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON jobs
  FOR SELECT
  USING (true);

CREATE POLICY "Allow service role full access" ON jobs
  FOR ALL
  USING (auth.role() = 'service_role');
