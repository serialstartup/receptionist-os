-- Migration 008: Vapi Voice Integration
-- Adds voice as a third routable platform alongside whatsapp/instagram,
-- following the same business_integrations pattern (see 005).

-- 1. Allow 'voice' on business_integrations.platform
ALTER TABLE business_integrations DROP CONSTRAINT IF EXISTS business_integrations_platform_check;
ALTER TABLE business_integrations ADD CONSTRAINT business_integrations_platform_check
    CHECK (platform IN ('whatsapp', 'instagram', 'voice'));

-- 2. Vapi-specific routing/credential columns
ALTER TABLE business_integrations ADD COLUMN IF NOT EXISTS vapi_assistant_id TEXT;
ALTER TABLE business_integrations ADD COLUMN IF NOT EXISTS vapi_phone_number_id TEXT;
ALTER TABLE business_integrations ADD COLUMN IF NOT EXISTS vapi_api_key TEXT;

CREATE INDEX IF NOT EXISTS idx_bi_vapi_assistant_id ON business_integrations(vapi_assistant_id) WHERE platform = 'voice';

-- 3. Allow 'voice' on conversations.platform
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_platform_check;
ALTER TABLE conversations ADD CONSTRAINT conversations_platform_check
    CHECK (platform IN ('whatsapp', 'instagram', 'voice'));
