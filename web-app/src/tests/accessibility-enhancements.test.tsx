import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider } from '@mui/material/styles';
import EnhancedProfileSettings from '../components/EnhancedProfileSettings';
import authReducer from '../store/slices/authSlice';
import chatReducer from '../store/slices/chatSlice';
import documentReducer from '../store/slices/documentSlice';
import lawyerReducer from '../store/slices/lawyerSlice';
import theme from '../theme';

// Mock the API calls
jest.mock('../services/api', () => ({
  userAPI: {
    getPreferences: jest.fn().mockResolvedValue({
      success: true,
      data: {
        language: 'de',
        accessibility: {
          highContrast: false,
          dyslexiaFriendly: false,
          reducedMotion: false,
          largerText: false,
          screenReaderMode: false
        },
        notifications: {
          email: true,
          push: true,
          sms: false
        },
        privacy: {
          dataSharing: false,
          analytics: true,
          marketing: false
        },
        legalTopics: [],
        frequentDocuments: [],
        alerts: {
          newCaseLaw: 'daily',
          documentUpdates: 'instant',
          newsletter: 'monthly'
        }
      }
    }),
    updatePreferences: jest.fn().mockResolvedValue({
      success: true,
      data: {}
    })
  }
}));

const mockStore = configureStore({
  reducer: {
    auth: authReducer,
    chat: chatReducer,
    document: documentReducer,
    lawyer: lawyerReducer,
  },
  preloadedState: {
    auth: {
      user: { id: '1', email: 'test@example.com', userType: 'tenant' },
      token: 'test-token',
      isAuthenticated: true,
      loading: false,
      error: null,
    },
    chat: {
      messages: [],
      isTyping: false,
      conversationId: null,
    },
    document: {
      documents: [],
      selectedDocument: null,
      uploading: false,
    },
    lawyer: {
      lawyers: [],
      selectedLawyer: null,
      searchCriteria: {},
      loading: false,
    },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <Provider store={mockStore}>
      <ThemeProvider theme={theme}>
        {component}
      </ThemeProvider>
    </Provider>
  );
};

describe('Accessibility Enhancements Tests', () => {
  test('should render EnhancedProfileSettings with proper ARIA attributes', async () => {
    renderWithProviders(<EnhancedProfileSettings />);

    // Wait for component to load
    expect(await screen.findByText('Erweiterte Einstellungen')).toBeInTheDocument();

    // Check main heading has proper ARIA attributes
    const mainHeading = screen.getByLabelText('Erweiterte Einstellungen');
    expect(mainHeading).toBeInTheDocument();
    expect(mainHeading).toHaveAttribute('id', 'enhanced-profile-settings-heading');

    // Check language settings section
    const languageHeading = screen.getByLabelText('Spracheinstellungen');
    expect(languageHeading).toBeInTheDocument();
    expect(languageHeading).toHaveAttribute('id', 'language-settings-heading');

    // Check accessibility settings section
    const accessibilityHeading = screen.getByLabelText('Barrierefreiheit');
    expect(accessibilityHeading).toBeInTheDocument();
    expect(accessibilityHeading).toHaveAttribute('id', 'accessibility-settings-heading');

    // Check notification settings section
    const notificationHeading = screen.getByLabelText('Benachrichtigungseinstellungen');
    expect(notificationHeading).toBeInTheDocument();
    expect(notificationHeading).toHaveAttribute('id', 'notification-settings-heading');

    // Check legal topics section
    const legalTopicsHeading = screen.getByLabelText('Rechtsgebiete');
    expect(legalTopicsHeading).toBeInTheDocument();
    expect(legalTopicsHeading).toHaveAttribute('id', 'legal-topics-heading');

    // Check frequent documents section
    const documentsHeading = screen.getByLabelText('Häufige Dokumente');
    expect(documentsHeading).toBeInTheDocument();
    expect(documentsHeading).toHaveAttribute('id', 'frequent-documents-heading');

    // Check alert preferences section
    const alertsHeading = screen.getByLabelText('Benachrichtigungseinstellungen');
    expect(alertsHeading).toBeInTheDocument();
    expect(alertsHeading).toHaveAttribute('id', 'alert-preferences-heading');
  });

  test('should have proper ARIA roles for interactive elements', async () => {
    renderWithProviders(<EnhancedProfileSettings />);

    // Wait for component to load
    expect(await screen.findByText('Erweiterte Einstellungen')).toBeInTheDocument();

    // Check language select has proper ARIA attributes
    const languageSelect = screen.getByRole('combobox', { name: 'Sprache' });
    expect(languageSelect).toBeInTheDocument();
    expect(languageSelect).toHaveAttribute('aria-describedby');

    // Check checkboxes have proper ARIA attributes
    const highContrastCheckbox = screen.getByRole('checkbox', { name: /Hoher Kontrast/ });
    expect(highContrastCheckbox).toBeInTheDocument();
    expect(highContrastCheckbox).toHaveAttribute('aria-describedby');

    // Check switches have proper ARIA attributes
    const emailSwitch = screen.getByRole('switch', { name: /E-Mail-Benachrichtigungen/ });
    expect(emailSwitch).toBeInTheDocument();
    expect(emailSwitch).toHaveAttribute('aria-describedby');

    // Check chips have proper ARIA attributes
    const chips = screen.getAllByRole('checkbox');
    expect(chips.length).toBeGreaterThan(0);
    chips.forEach(chip => {
      expect(chip).toHaveAttribute('aria-checked');
    });
  });

  test('should have proper ARIA labels for form controls', async () => {
    renderWithProviders(<EnhancedProfileSettings />);

    // Wait for component to load
    expect(await screen.findByText('Erweiterte Einstellungen')).toBeInTheDocument();

    // Check select dropdowns have proper labels
    const newCaseLawSelect = screen.getByRole('combobox', { name: 'Neue Rechtsprechung' });
    expect(newCaseLawSelect).toBeInTheDocument();

    const documentUpdatesSelect = screen.getByRole('combobox', { name: 'Dokumentaktualisierungen' });
    expect(documentUpdatesSelect).toBeInTheDocument();

    const newsletterSelect = screen.getByRole('combobox', { name: 'Newsletter' });
    expect(newsletterSelect).toBeInTheDocument();
  });

  test('should provide accessible feedback for save actions', async () => {
    const user = userEvent.setup();
    renderWithProviders(<EnhancedProfileSettings />);

    // Wait for component to load
    expect(await screen.findByText('Erweiterte Einstellungen')).toBeInTheDocument();

    // Click save button
    const saveButton = screen.getByRole('button', { name: 'Speichern' });
    await user.click(saveButton);

    // Check for success message with proper ARIA attributes
    const successMessage = await screen.findByRole('alert');
    expect(successMessage).toBeInTheDocument();
    expect(successMessage).toHaveAttribute('aria-live', 'polite');
  });
});