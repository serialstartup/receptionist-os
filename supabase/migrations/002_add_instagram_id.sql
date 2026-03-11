-- Add instagram_id to customers table
ALTER TABLE customers ADD COLUMN if not exists instagram_id text;
CREATE INDEX if not exists idx_customers_instagram on customers(instagram_id);
