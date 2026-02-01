describe('Offline Functionality', () => {
    beforeAll(async () => {
        await device.launchApp();
    });

    beforeEach(async () => {
        await device.reloadReactNative();
    });

    it('should allow document upload and storage when offline', async () => {
        // Login first
        await element(by.id('email-input')).typeText('testuser@example.com');
        await element(by.id('password-input')).typeText('password123');
        await element(by.id('login-button')).tap();

        // Go to Documents screen
        await element(by.id('documents-tab')).tap();
        
        // Turn off network connectivity
        await device.setNetworkSpeed('offline');
        
        // Try to upload a document
        await element(by.id('upload-document-button')).tap();
        await element(by.id('scan-document-option')).tap();
        
        // Confirm document is stored offline
        await expect(element(by.text('Dokument offline gespeichert'))).toBeVisible();
        
        // Turn network connectivity back on
        await device.setNetworkSpeed('full');
        
        // Wait for automatic sync
        await waitFor(element(by.text('Dokument hochgeladen')))
            .toBeVisible()
            .withTimeout(10000);
            
        // Verify document appears in list
        await expect(element(by.id('document-list-item-0'))).toBeVisible();
    });

    it('should display offline documents with appropriate status', async () => {
        // Login first
        await element(by.id('email-input')).typeText('testuser@example.com');
        await element(by.id('password-input')).typeText('password123');
        await element(by.id('login-button')).tap();

        // Go to Documents screen
        await element(by.id('documents-tab')).tap();
        
        // Turn off network connectivity
        await device.setNetworkSpeed('offline');
        
        // Check that offline indicator is visible
        await expect(element(by.text('Offline-Modus'))).toBeVisible();
        
        // Try to upload a document
        await element(by.id('upload-document-button')).tap();
        await element(by.id('scan-document-option')).tap();
        
        // Verify document appears in list with offline status
        await expect(element(by.id('document-list-item-0'))).toBeVisible();
        await expect(element(by.text('Offline - Wird hochgeladen, sobald Internet verfügbar ist'))).toBeVisible();
    });

    it('should receive push notifications for legal updates', async () => {
        // Login first
        await element(by.id('email-input')).typeText('testuser@example.com');
        await element(by.id('password-input')).typeText('password123');
        await element(by.id('login-button')).tap();

        // Go to Chat screen
        await element(by.id('chat-tab')).tap();
        
        // Send a legal question
        await element(by.id('message-input')).typeText('Habe ich ein Recht auf Mietminderung?');
        await element(by.id('send-message-button')).tap();
        
        // Wait for notification (simulate 5 minute delay)
        await waitFor(element(by.text('Rechtliche Beratung')))
            .toBeVisible()
            .withTimeout(10000);
            
        // Tap on notification
        await element(by.text('Rechtliche Beratung')).tap();
        
        // Verify we're navigated back to chat
        await expect(element(by.id('chat-screen'))).toBeVisible();
    });

    it('should handle offline queue processing correctly', async () => {
        // Login first
        await element(by.id('email-input')).typeText('testuser@example.com');
        await element(by.id('password-input')).typeText('password123');
        await element(by.id('login-button')).tap();

        // Turn off network connectivity
        await device.setNetworkSpeed('offline');
        
        // Go to Documents screen
        await element(by.id('documents-tab')).tap();
        
        // Upload multiple documents while offline
        await element(by.id('upload-document-button')).tap();
        await element(by.id('scan-document-option')).tap();
        
        await element(by.id('upload-document-button')).tap();
        await element(by.id('choose-from-gallery-option')).tap();
        
        // Verify documents are queued
        await expect(element(by.text('2 Dokumente in Warteschlange'))).toBeVisible();
        
        // Turn network connectivity back on
        await device.setNetworkSpeed('full');
        
        // Wait for queue processing
        await waitFor(element(by.text('Alle Dokumente hochgeladen')))
            .toBeVisible()
            .withTimeout(15000);
            
        // Verify documents appear in list
        await expect(element(by.id('document-list-item-0'))).toBeVisible();
        await expect(element(by.id('document-list-item-1'))).toBeVisible();
    });
});