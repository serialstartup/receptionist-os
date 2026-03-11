-- Run this in your Supabase SQL Editor to support the new Campaign features
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS type text;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS discount_value integer;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS rules jsonb default '{}';
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS sent_count integer default 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS conversion_count integer default 0;

-- Optional indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaigns_type ON campaigns(type);
