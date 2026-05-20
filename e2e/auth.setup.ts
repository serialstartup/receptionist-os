import { test as setup } from "@playwright/test"
import path from "path"

const authFile = path.resolve("e2e/.auth/user.json")

setup("authenticate", async ({ page }) => {
  await page.goto("/login")
  await page.locator("#email").fill(process.env.TEST_USER_EMAIL!)
  await page.locator("#password").fill(process.env.TEST_USER_PASSWORD!)
  await page.getByRole("button", { name: /sign in/i }).click()
  await page.waitForURL("/dashboard", { timeout: 15000 })
  await page.context().storageState({ path: authFile })
})
