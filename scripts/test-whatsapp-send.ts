import "dotenv/config"
import dotenv from "dotenv"
import path from "path"

// Load from .env.local as it's the standard for Next.js
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

import { whatsapp } from "../lib/whatsapp/client"

/**
 * Script to test WhatsApp outbound messaging.
 * Usage: npx tsx scripts/test-whatsapp-send.ts <phone_number_with_country_code>
 */

async function main() {
  const phoneNumber = process.argv[2]

  if (!phoneNumber) {
    console.error("Please provide a phone number (e.g., 905321234567)")
    process.exit(1)
  }

  console.log(`🚀 Sending test message to ${phoneNumber}...`)

  const testMessage = "Merhaba! BeautyAI asistanı başarıyla bağlandı. Bu bir test mesajıdır. ✨"
  
  const result = await whatsapp.sendMessage(phoneNumber, testMessage)

  if (result) {
    console.log("✅ Success! Message ID:", result.messages[0].id)
  } else {
    console.log("❌ Failed to send message. Check console for errors.")
  }
}

main().catch(console.error)
