-- Migration 005: Business Integrations (Multi-tenant Social Configs)
-- Each business stores its own WhatsApp / Instagram connection details.

CREATE TABLE IF NOT EXISTS business_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('whatsapp', 'instagram')),

    -- WhatsApp fields
    wa_phone_number TEXT,           -- The business's WA number (e.g. 905551234567)
    wa_phone_number_id TEXT,        -- Meta's phone_number_id (used in Graph API calls)
    wa_access_token TEXT,           -- Per-business access token (encrypt in production)

    -- Instagram fields
    ig_user_id TEXT,                -- Instagram Business Account ID
    ig_page_id TEXT,                -- Connected Facebook Page ID
    ig_access_token TEXT,           -- Long-lived page access token
    ig_username TEXT,               -- @username for display

    -- Shared fields
    is_active BOOLEAN DEFAULT TRUE,
    verified_at TIMESTAMPTZ,
    verification_code TEXT,         -- Temporary 6-digit code for WA verification
    verification_expires_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(business_id, platform)
);

-- Indexes for webhook routing (critical path)
CREATE INDEX IF NOT EXISTS idx_bi_wa_phone_number_id ON business_integrations(wa_phone_number_id) WHERE platform = 'whatsapp';
CREATE INDEX IF NOT EXISTS idx_bi_ig_user_id ON business_integrations(ig_user_id) WHERE platform = 'instagram';
CREATE INDEX IF NOT EXISTS idx_bi_business ON business_integrations(business_id);

-- RLS
ALTER TABLE business_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business access" ON business_integrations
    FOR ALL USING (
        business_id IN (SELECT business_id FROM users WHERE id = auth.uid())
    );
