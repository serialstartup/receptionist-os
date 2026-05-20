import { test, expect } from "@playwright/test"

test.describe("Appointments", () => {
  test("shows appointments page", async ({ page }) => {
    await page.goto("/appointments")
    await expect(page.getByRole("heading", { name: "Appointments List" })).toBeVisible()
  })

  test("creates a new appointment", async ({ page }) => {
    await page.goto("/appointments")

    // Open create modal
    await page.getByRole("button", { name: /^new$/i }).click()
    await expect(page.getByText("Add New Appointment")).toBeVisible()

    // Select first available customer and service
    await page.locator('select').nth(0).selectOption({ index: 1 })
    await page.locator('select').nth(1).selectOption({ index: 1 })

    // Set start time (future date)
    await page.locator('input[type="datetime-local"]').fill("2026-07-01T10:00")

    // Submit
    await page.getByRole("button", { name: /book appointment/i }).click()

    // Expect success toast
    await expect(page.getByText("Appointment booked.")).toBeVisible({ timeout: 10000 })
  })

  test("updates appointment status via dropdown", async ({ page }) => {
    await page.goto("/appointments")

    // Wait for at least one appointment row (seed creates a today appointment)
    await page.waitForSelector("tbody tr", { timeout: 10000 })
    const firstRow = page.locator("tbody tr").first()
    await firstRow.hover()

    // Click the MoreVertical menu button
    await firstRow.locator('[data-testid="appointment-menu"]').click({ force: true })

    // Click "Mark confirmed" (first status option)
    await page.getByRole("menuitem", { name: /mark confirmed/i }).click()

    // Expect success toast
    await expect(page.getByText("Marked as confirmed.")).toBeVisible({ timeout: 10000 })
  })
})
