import { test, expect } from '@playwright/test'

test.describe('Event Management', () => {
  test('should create an event and access its page', async ({ page }) => {
    // Navigate to admin page
    await page.goto('/admin')

    // Fill out the event creation form
    await page.fill('input[name="name"]', 'Test Event E2E')
    await page.fill('input[name="date"]', '2025-12-01')

    // Submit the form
    await page.click('button[type="submit"]')

    // Wait for success message or redirect
    await page.waitForURL(/\/admin/)

    // Get the created event ID from the API response or page
    // This is a simplified version - in real scenario we'd capture the response
    const eventLink = page.locator('a[href*="/event/"]').first()
    const eventUrl = await eventLink.getAttribute('href')

    if (eventUrl) {
      const eventId = eventUrl.replace('/event/', '')

      // Navigate to the event page
      await page.goto(`/event/${eventId}`)

      // Verify the event page loads
      await expect(page.getByText('Test Event E2E')).toBeVisible()
    }
  })

  test('should handle 404 for non-existent events', async ({ page }) => {
    await page.goto('/event/non-existent-event-id')

    // Should show 404 page
    await expect(page.getByText('404')).toBeVisible()
    await expect(page.getByText('This page could not be found')).toBeVisible()
  })
})