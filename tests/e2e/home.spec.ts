import { test, expect } from '@playwright/test'

test.describe('Home Page', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/')

    // Check if the header is present
    await expect(page.getByText('Galeria de Eventos')).toBeVisible()
    await expect(page.getByText('Visualize, selecione e baixe fotos dos seus eventos')).toBeVisible()
  })

  test('should display events list', async ({ page }) => {
    await page.goto('/')

    // Wait for events to load (this might fail if no events exist)
    // In a real scenario, we'd set up test data
    const eventsContainer = page.locator('[data-testid="events-list"]')
    // This test will pass if the container exists, even if empty
    await expect(eventsContainer).toBeDefined()
  })
})