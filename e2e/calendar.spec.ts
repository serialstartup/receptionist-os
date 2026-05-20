import { test, expect } from "@playwright/test"

test.describe("Calendar", () => {
  test("loads calendar page", async ({ page }) => {
    await page.goto("/calendar")
    await expect(page.getByText("Service Schedule")).toBeVisible()
  })

  test("opens appointment detail modal on click", async ({ page }) => {
    await page.goto("/calendar")

    // Click the first visible appointment card (pointer-events-auto)
    const card = page.locator(".cursor-pointer").first()
    const cardCount = await card.count()
    if (cardCount === 0) {
      test.skip()
      return
    }

    await card.click()

    // Modal should show appointment details
    await expect(page.getByText("Customer", { exact: true })).toBeVisible()
    await expect(page.getByText("Time & Duration")).toBeVisible()
  })

  test("confirms appointment from calendar modal", async ({ page }) => {
    await page.goto("/calendar")

    const card = page.locator(".cursor-pointer").first()
    if (await card.count() === 0) {
      test.skip()
      return
    }

    await card.click()

    // If "Confirm" button is visible (appointment is in scheduled state), click it
    const confirmBtn = page.getByRole("button", { name: /^confirm$/i })
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click()
      await expect(page.getByText("Appointment confirmed.")).toBeVisible({ timeout: 10000 })
    } else {
      // Appointment may already be confirmed — modal should still close cleanly
      await page.getByRole("button", { name: /close/i }).click()
      await expect(page.getByText("Customer")).not.toBeVisible()
    }
  })

  test("opens new appointment modal from calendar", async ({ page }) => {
    await page.goto("/calendar")
    await page.getByRole("button", { name: /new/i }).click()
    await expect(page.getByText("New Appointment")).toBeVisible()
  })
})
