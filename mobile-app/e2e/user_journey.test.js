describe('User Journey', () => {
    beforeAll(async () => {
        await device.launchApp();
    });

    beforeEach(async () => {
        await device.reloadReactNative();
    });

    it('should successfully register, login, view profile, search lawyer and book appointment', async () => {
        // 1. Registration
        await element(by.id('register-button')).tap();
        await element(by.id('email-input')).typeText('newuser@example.com');
        await element(by.id('password-input')).typeText('password123');
        await element(by.id('confirm-password-input')).typeText('password123');
        await element(by.id('submit-register-button')).tap();

        // Expect to be on Login screen or auto-logged in. Assuming Login screen for now.
        await expect(element(by.text('Login'))).toBeVisible();

        // 2. Login
        await element(by.id('email-input')).typeText('newuser@example.com');
        await element(by.id('password-input')).typeText('password123');
        await element(by.id('login-button')).tap();

        // Expect to be on Home screen
        await expect(element(by.id('home-screen'))).toBeVisible();

        // 3. Profile
        await element(by.id('profile-tab')).tap();
        await expect(element(by.text('Profil'))).toBeVisible();
        await expect(element(by.text('newuser@example.com'))).toBeVisible();

        // 4. Lawyer Search
        await element(by.id('lawyers-tab')).tap();
        await expect(element(by.id('lawyer-search-input'))).toBeVisible();
        await element(by.id('lawyer-search-input')).typeText('Mietrecht');
        // Mocking search result tap
        await element(by.id('lawyer-list-item-0')).tap();

        // 5. Booking
        await expect(element(by.text('Termin buchen'))).toBeVisible();
        await element(by.id('book-appointment-button')).tap();
        await element(by.id('confirm-booking-button')).tap();

        await expect(element(by.text('Buchung erfolgreich'))).toBeVisible();
    });
});
