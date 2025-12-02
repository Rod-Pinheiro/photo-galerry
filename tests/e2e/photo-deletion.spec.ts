import { test, expect } from '@playwright/test'

test.describe('Photo Deletion E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/admin/login')
    await page.fill('input[name="username"]', 'admin')
    await page.fill('input[name="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/admin')
  })

  test('should delete a single photo successfully', async ({ page }) => {
    // Navigate to events page
    await page.goto('/admin/events')
    
    // Click on first event
    await page.click('a[href*="/admin/events/"]:first-child')
    
    // Wait for event page to load
    await page.waitForURL('**/admin/events/**')
    
    // Click on photos management
    await page.click('a[href*="/photos"]')
    
    // Wait for photos page to load
    await page.waitForURL('**/photos')
    
    // Get initial photo count
    const initialPhotosCount = await page.locator('.grid img').count()
    expect(initialPhotosCount).toBeGreaterThan(0)
    
    // Hover over first photo to show delete button
    const firstPhoto = page.locator('.grid > div').first()
    await firstPhoto.hover()
    
    // Click delete button
    await firstPhoto.locator('button[aria-label="Delete"]').click()
    
    // Handle confirmation dialog
    await page.waitForSelector('text=Tem certeza que deseja excluir esta foto?')
    await page.click('text=OK')
    
    // Wait for deletion to complete
    await page.waitForTimeout(1000)
    
    // Verify photo was deleted
    const finalPhotosCount = await page.locator('.grid img').count()
    expect(finalPhotosCount).toBe(initialPhotosCount - 1)
  })

  test('should delete multiple photos using bulk delete', async ({ page }) => {
    // Navigate to events page
    await page.goto('/admin/events')
    
    // Click on first event
    await page.click('a[href*="/admin/events/"]:first-child')
    
    // Click on photos management
    await page.click('a[href*="/photos"]')
    
    // Wait for photos page to load
    await page.waitForURL('**/photos')
    
    // Get initial photo count
    const initialPhotosCount = await page.locator('.grid img').count()
    expect(initialPhotosCount).toBeGreaterThan(1)
    
    // Select all photos
    await page.click('button:has-text("Selecionar Todas")')
    
    // Verify selection count
    await expect(page.locator('text=selecionadas')).toBeVisible()
    
    // Click bulk delete button
    await page.click('button:has-text("Excluir Selecionadas")')
    
    // Handle confirmation dialog
    await page.waitForSelector('text=/Tem certeza que deseja excluir \\d+ fotos?/')
    await page.click('text=OK')
    
    // Wait for deletion to complete
    await page.waitForTimeout(2000)
    
    // Verify success message
    await expect(page.locator('text=/\\d+ fotos excluídas com sucesso/')).toBeVisible()
    
    // Verify photos were deleted
    const finalPhotosCount = await page.locator('.grid img').count()
    expect(finalPhotosCount).toBe(0)
  })

  test('should show error when deletion fails', async ({ page }) => {
    // Mock network failure for delete request
    await page.route('**/api/admin/events/*/photos/*', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Database error' })
      })
    })
    
    // Navigate to events page
    await page.goto('/admin/events')
    
    // Click on first event
    await page.click('a[href*="/admin/events/"]:first-child')
    
    // Click on photos management
    await page.click('a[href*="/photos"]')
    
    // Wait for photos page to load
    await page.waitForURL('**/photos')
    
    // Hover over first photo to show delete button
    const firstPhoto = page.locator('.grid > div').first()
    await firstPhoto.hover()
    
    // Click delete button
    await firstPhoto.locator('button[aria-label="Delete"]').click()
    
    // Handle confirmation dialog
    await page.waitForSelector('text=Tem certeza que deseja excluir esta foto?')
    await page.click('text=OK')
    
    // Wait for error message
    await expect(page.locator('text=Erro ao excluir foto: Database error')).toBeVisible()
  })

  test('should handle unauthorized access', async ({ page, context }) => {
    // Clear auth cookies to simulate unauthorized access
    await context.clearCookies()
    
    // Navigate directly to photos page
    await page.goto('/admin/events/test-event/photos')
    
    // Should redirect to login
    await page.waitForURL('**/admin/login')
  })
})