
ALTER TABLE public.venture_snapshots
  ADD COLUMN IF NOT EXISTS founder_name TEXT,
  ADD COLUMN IF NOT EXISTS founder_email TEXT,
  ADD COLUMN IF NOT EXISTS founder_phone TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS region TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS market_scope TEXT CHECK (market_scope IN ('local','regional','national','international')),
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS sub_industry TEXT;
