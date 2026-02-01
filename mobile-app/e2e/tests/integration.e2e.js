describe('Mobile App Integration Tests', () => {
    beforeAll(async () => {
        await device.launchApp();
    });

    beforeEach(async () => {
        await device.reloadReactNative();
    });

    it('should integrate offline functionality with push notifications', async () => {
        // Login first
        await element(by.id('email-input')).typeText('testuser@example.com');
        await element(by.id('password-input')).typeText('password123');
        await element(by.id('login-button')).tap();

        // Go to Documents screen
        await element(by.id('documents-tab')).tap();
        
        // Turn off network connectivity
        await device.setNetworkSpeed('offline');
        
        // Upload a document while offline
        await element(by.id('upload-document-button')).tap();
        await element(by.id('scan-document-option')).tap();
        
        // Confirm document is stored offline
        await expect(element(by.text('Dokument offline gespeichert'))).toBeVisible();
        
        // Turn network connectivity back on
        await device.setNetworkSpeed('full');
        
        // Wait for automatic sync and notification
        await waitFor(element(by.text('Dokument hochgeladen')))
            .toBeVisible()
            .withTimeout(10000);
            
        // Verify push notification was received
        await expect(element(by.text('Dokumenten-Upload abgeschlossen'))).toBeVisible();
        
        // Tap on notification
        await element(by.text('Dokumenten-Upload abgeschlossen')).tap();
        
        // Verify we're navigated to the documents screen
        await expect(element(by.id('documents-screen'))).toBeVisible();
        
        // Verify document appears in list
        await expect(element(by.id('document-list-item-0'))).toBeVisible();
    });

    it('should synchronize offline data with risk assessment results', async () => {
        // Login first
        await element(by.id('email-input')).typeText('testuser@example.com');
        await element(by.id('password-input')).typeText('password123');
        await element(by.id('login-button')).tap();

        // Go to Documents screen
        await element(by.id('documents-tab')).tap();
        
        // Turn off network connectivity
        await device.setNetworkSpeed('offline');
        
        // Upload a document while offline
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
            
        // Navigate to the document detail screen
        await element(by.id('document-list-item-0')).tap();
        
        // Wait for risk assessment to complete
        await waitFor(element(by.text('Risikobewertung abgeschlossen')))
            .toBeVisible()
            .withTimeout(15000);
            
        // Verify risk assessment results are displayed
        await expect(element(by.id('risk-assessment-score'))).toBeVisible();
        await expect(element(by.id('risk-assessment-level'))).toBeVisible();
    });

    it('should handle offline strategy recommendations correctly', async () => {
        // Login first
        await element(by.id('email-input')).typeText('testuser@example.com');
        await element(by.id('password-input')).typeText('password123');
        await element(by.id('login-button')).tap();

        // Go to Chat screen
        await element(by.id('chat-tab')).tap();
        
        // Turn off network connectivity
        await device.setNetworkSpeed('offline');
        
        // Send a legal question while offline
        await element(by.id('message-input')).typeText('Welche rechtlichen Schritte sollte ich wegen meiner Mietprobleme unternehmen?');
        await element(by.id('send-message-button')).tap();
        
        // Confirm message is stored offline
        await expect(element(by.text('Nachricht offline gespeichert'))).toBeVisible();
        
        // Turn network connectivity back on
        await device.setNetworkSpeed('full');
        
        // Wait for message to be sent and strategy recommendations to be received
        await waitFor(element(by.text('Strategieempfehlungen verfügbar')))
            .toBeVisible()
            .withTimeout(15000);
            
        // Tap on the recommendation notification
        await element(by.text('Strategieempfehlungen verfügbar')).tap();
        
        // Verify we're navigated to the recommendations screen
        await expect(element(by.id('recommendations-screen'))).toBeVisible();
        
        // Verify recommendations are displayed
        await expect(element(by.id('recommendation-item-0'))).toBeVisible();
        await expect(element(by.id('recommendation-item-1'))).toBeVisible();
    });

    it('should maintain data consistency across offline and online modes', async () => {
        // Login first
        await element(by.id('email-input')).typeText('testuser@example.com');
        await element(by.id('password-input')).typeText('password123');
        await element(by.id('login-button')).tap();

        // Create some data while online
        await element(by.id('documents-tab')).tap();
        await element(by.id('upload-document-button')).tap();
        await element(by.id('scan-document-option')).tap();
        
        // Wait for upload to complete
        await waitFor(element(by.text('Dokument hochgeladen')))
            .toBeVisible()
            .withTimeout(10000);
        
        // Turn off network connectivity
        await device.setNetworkSpeed('offline');
        
        // Create more data while offline
        await element(by.id('upload-document-button')).tap();
        await element(by.id('choose-from-gallery-option')).tap();
        
        // Confirm document is stored offline
        await expect(element(by.text('Dokument offline gespeichert'))).toBeVisible();
        
        // Navigate to another screen and back to ensure data persistence
        await element(by.id('chat-tab')).tap();
        await element(by.id('documents-tab')).tap();
        
        // Verify both documents are visible (one online, one offline)
        await expect(element(by.id('document-list-item-0'))).toBeVisible();
        await expect(element(by.text('Offline - Wird hochgeladen, sobald Internet verfügbar ist'))).toBeVisible();
        
        // Turn network connectivity back on
        await device.setNetworkSpeed('full');
        
        // Wait for offline document to sync
        await waitFor(element(by.text('Dokument hochgeladen')))
            .toBeVisible()
            .withTimeout(10000);
            
        // Verify both documents are now fully synced
        await expect(element(by.id('document-list-item-0'))).toBeVisible();
        await expect(element(by.id('document-list-item-1'))).toBeVisible();
        
        // Verify no duplicate entries exist
        // This checks that the document list contains exactly 2 items
        await expect(element(by.id('document-list-item-2'))).not.toBeVisible();
    });
});