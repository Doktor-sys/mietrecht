import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the starting url before each test.
    await page.goto('/');
  });

  test('should match homepage snapshot', async ({ page }) => {
    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot of the entire page
    await expect(page).toHaveScreenshot('homepage.png', {
      maxDiffPixels: 10,
      threshold: 0.001
    });
  });

  test('should match chat interface snapshot', async ({ page }) => {
    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot of the chat interface
    const chatContainer = page.getByRole('main');
    await expect(chatContainer).toHaveScreenshot('chat-interface.png', {
      maxDiffPixels: 10,
      threshold: 0.001
    });
  });

  test('should match header snapshot', async ({ page }) => {
    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot of the header
    const header = page.getByRole('banner');
    await expect(header).toHaveScreenshot('header.png', {
      maxDiffPixels: 10,
      threshold: 0.001
    });
  });

  test('should match footer snapshot', async ({ page }) => {
    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot of the footer
    const footer = page.getByRole('contentinfo');
    await expect(footer).toHaveScreenshot('footer.png', {
      maxDiffPixels: 10,
      threshold: 0.001
    });
  });

  test('should match dashboard snapshot', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot of the dashboard
    await expect(page).toHaveScreenshot('dashboard.png', {
      maxDiffPixels: 10,
      threshold: 0.001
    });
  });

  test('should match document upload form snapshot', async ({ page }) => {
    // Navigate to document upload
    await page.goto('/documents/upload');
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot of the document upload form
    const uploadForm = page.getByRole('form');
    await expect(uploadForm).toHaveScreenshot('document-upload-form.png', {
      maxDiffPixels: 10,
      threshold: 0.001
    });
  });

  test('should match mobile homepage snapshot', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot of the mobile homepage
    await expect(page).toHaveScreenshot('homepage-mobile.png', {
      maxDiffPixels: 10,
      threshold: 0.001
    });
  });

  test('should match tablet homepage snapshot', async ({ page }) => {
    // Set viewport to tablet size
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot of the tablet homepage
    await expect(page).toHaveScreenshot('homepage-tablet.png', {
      maxDiffPixels: 10,
      threshold: 0.001
    });
  });

  test('should match mobile menu snapshot', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Open mobile menu
    await page.click('[data-testid="mobile-menu-button"]');
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot of the mobile menu
    const mobileMenu = page.getByRole('navigation');
    await expect(mobileMenu).toHaveScreenshot('mobile-menu.png', {
      maxDiffPixels: 10,
      threshold: 0.001
    });
  });
});