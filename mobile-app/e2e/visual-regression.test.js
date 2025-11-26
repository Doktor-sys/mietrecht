describe('Visual Regression Tests', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should match home screen snapshot', async () => {
    await expect(element(by.id('home-screen'))).toBeVisible();
    await device.takeScreenshot('home-screen');
  });

  it('should match login screen snapshot', async () => {
    await element(by.id('login-button')).tap();
    await expect(element(by.id('login-screen'))).toBeVisible();
    await device.takeScreenshot('login-screen');
  });

  it('should match registration screen snapshot', async () => {
    await element(by.id('register-button')).tap();
    await expect(element(by.id('register-screen'))).toBeVisible();
    await device.takeScreenshot('register-screen');
  });

  it('should match profile screen snapshot', async () => {
    // Login first
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-button')).tap();
    
    // Navigate to profile
    await element(by.id('profile-tab')).tap();
    await expect(element(by.id('profile-screen'))).toBeVisible();
    await device.takeScreenshot('profile-screen');
  });

  it('should match lawyers list screen snapshot', async () => {
    // Login first
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-button')).tap();
    
    // Navigate to lawyers list
    await element(by.id('lawyers-tab')).tap();
    await expect(element(by.id('lawyers-screen'))).toBeVisible();
    await device.takeScreenshot('lawyers-list-screen');
  });

  it('should match document upload screen snapshot', async () => {
    // Login first
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-button')).tap();
    
    // Navigate to document upload
    await element(by.id('documents-tab')).tap();
    await element(by.id('upload-document-button')).tap();
    await expect(element(by.id('document-upload-screen'))).toBeVisible();
    await device.takeScreenshot('document-upload-screen');
  });

  it('should match chat screen snapshot', async () => {
    // Login first
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-button')).tap();
    
    // Navigate to chat
    await element(by.id('chat-tab')).tap();
    await expect(element(by.id('chat-screen'))).toBeVisible();
    await device.takeScreenshot('chat-screen');
  });

  it('should match settings screen snapshot', async () => {
    // Login first
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-button')).tap();
    
    // Navigate to settings
    await element(by.id('settings-tab')).tap();
    await expect(element(by.id('settings-screen'))).toBeVisible();
    await device.takeScreenshot('settings-screen');
  });

  it('should match notifications screen snapshot', async () => {
    // Login first
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-button')).tap();
    
    // Navigate to notifications
    await element(by.id('notifications-tab')).tap();
    await expect(element(by.id('notifications-screen'))).toBeVisible();
    await device.takeScreenshot('notifications-screen');
  });
});