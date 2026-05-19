/**
 * WhatsApp Business API Client
 * Handles sending messages via Meta's Graph API.
 */

const API_VERSION = "v21.0"

export interface WhatsAppMessageResponse {
  messaging_product: "whatsapp"
  contacts: Array<{ input: string; wa_id: string }>
  messages: Array<{ id: string }>
}

export const whatsapp = {
  /**
   * Send a text message to a WhatsApp user.
   * @param to The recipient's phone number (with country code, e.g., '905321234567')
   * @param text The message content
   */
  async sendMessage(to: string, text: string): Promise<WhatsAppMessageResponse | null> {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

    if (!accessToken || !phoneNumberId) {
      console.error("WhatsApp credentials missing in environment variables.")
      return null
    }

    const url = `https://graph.facebook.com/${API_VERSION}/${phoneNumberId}/messages`

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: to,
          type: "text",
          text: { body: text },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error("WhatsApp API Error:", JSON.stringify(data, null, 2))
        throw new Error(data.error?.message || "Failed to send WhatsApp message")
      }

      console.log(`WhatsApp message sent to ${to}. ID: ${data.messages?.[0]?.id}`)
      return data as WhatsAppMessageResponse
    } catch (error) {
      console.error("Error sending WhatsApp message:", error)
      return null
    }
  },
}
