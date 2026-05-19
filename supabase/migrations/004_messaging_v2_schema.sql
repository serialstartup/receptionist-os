-- Migration 004: Messaging V2 Schema (Conversations & State)
-- This enables threading, deterministic AI state tracking, and human takeover.

-- 1. Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('whatsapp', 'instagram')),
    platform_conversation_id TEXT NOT NULL,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'ai' CHECK (status IN ('ai', 'human')),
    unread_count INTEGER DEFAULT 0,
    ai_enabled BOOLEAN DEFAULT TRUE,
    current_state TEXT DEFAULT 'START' NOT NULL, -- e.g. START, COLLECT_SERVICE, COLLECT_TIME, CONFIRMING
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(business_id, platform, platform_conversation_id)
);

-- 2. Update messages table to link to conversations
-- Note: We add conversation_id and platform_message_id
ALTER TABLE messages ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS platform_message_id TEXT UNIQUE;

-- 3. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_business ON conversations(business_id);
CREATE INDEX IF NOT EXISTS idx_conversations_customer ON conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_platform_id ON messages(platform_message_id);

-- 4. Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- 5. Add RLS Policy (Multi-tenant isolation)
CREATE POLICY "Business access" ON conversations
    FOR ALL USING (
        business_id IN (SELECT business_id FROM users WHERE id = auth.uid())
    );

-- 6. Trigger to update last_message_at in conversations when a new message is inserted
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET last_message_at = NEW.created_at,
        unread_count = unread_count + (CASE WHEN NEW.role = 'user' THEN 1 ELSE 0 END)
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_update_conversation_timestamp ON messages;
CREATE TRIGGER tr_update_conversation_timestamp
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_timestamp();
