import { config } from "dotenv"
config({ path: ".env.local" })

// Must be set before importing agent
process.env.NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

const { processConversationMessage } = await import("../lib/ai/agent")

const conversationId = "029c1e99-3610-4a4c-90e8-958b853b9a0e"

console.log("Testing AI agent for conversation:", conversationId)

try {
  const result = await processConversationMessage(conversationId)
  console.log("✅ Agent result:", result)
} catch (err) {
  console.error("❌ Agent error:", err)
}
