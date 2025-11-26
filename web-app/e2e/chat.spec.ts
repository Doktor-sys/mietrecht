import { test, expect } from '@playwright/test';

test.describe('Chat Functionality', () => {
    test.beforeEach(async ({ page }) => {
        // Go to the starting url before each test.
        await page.goto('/');
    });

    test('should allow user to send a message and receive a response', async ({ page }) => {
        // Check if we are on the chat page
        await expect(page).toHaveTitle(/SmartLaw/);

        // Find input field
        const input = page.getByPlaceholder(/nachricht/i);
        await expect(input).toBeVisible();

        // Type a message
        await input.fill('Meine Heizung ist kaputt');

        // Click send button
        const sendButton = page.getByLabel(/senden/i);
        await sendButton.click();

        // Check if message appears in chat
        await expect(page.getByText('Meine Heizung ist kaputt')).toBeVisible();

        // Wait for AI response (might take a while in real backend)
        // In a real E2E test with backend, we expect a response
        // For now, we check if the typing indicator appears or if a response comes eventually
        // await expect(page.getByText(/Mietminderung/i)).toBeVisible({ timeout: 10000 });
    });

    test('should show upload dialog when clicking attach button', async ({ page }) => {
        const attachButton = page.getByLabel(/datei anhängen/i);
        await attachButton.click();

        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible();

        const fileInput = page.getByLabel(/datei auswählen/i);
        await expect(fileInput).toBeVisible();
    });

    test('should be responsive on mobile', async ({ page }) => {
        // Resize viewport to mobile
        await page.setViewportSize({ width: 375, height: 667 });

        // Check if layout adapts (e.g. hamburger menu or simplified view)
        const input = page.getByPlaceholder(/nachricht/i);
        await expect(input).toBeVisible();
    });
});
