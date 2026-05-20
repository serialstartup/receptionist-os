const API_VERSION = "v21.0"

export const instagram = {
  async sendMessage(recipientId: string, text: string, accessToken: string): Promise<boolean> {
    if (!accessToken) {
      console.error("Instagram access token missing.")
      return false
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/${API_VERSION}/me/messages?access_token=${accessToken}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipient: { id: recipientId },
            message: { text },
          }),
        }
      )

      if (!response.ok) {
        const data = await response.json()
        console.error("Instagram API Error:", JSON.stringify(data))
        return false
      }

      return true
    } catch (error) {
      console.error("Error sending Instagram message:", error)
      return false
    }
  },
}
