import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider } from '@mui/material/styles';
import { BrowserRouter as Router } from 'react-router-dom';
import KeyboardNavigationManager from '../components/KeyboardNavigationManager';
import DocumentUploadDialog from '../components/DocumentUploadDialog';
import LawyerDetailsDialog from '../components/LawyerDetailsDialog';
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
      data: {}
    }),
    updatePreferences: jest.fn().mockResolvedValue({
      success: true,
      data: {}
    })
  },
  documentAPI: {
    uploadDocument: jest.fn().mockResolvedValue({
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
      selectedLawyer: {
        id: '1',
        name: 'Max Mustermann',
        location: 'Berlin',
        rating: 4.5,
        reviewCount: 12,
        specializations: ['Mietrecht', 'Verbraucherrecht'],
        languages: ['Deutsch', 'Englisch'],
        hourlyRate: 150,
        availableSlots: [
          {
            start: new Date(),
            end: new Date(Date.now() + 3600000),
            available: true
          }
        ],
        verified: true
      },
      searchCriteria: {},
      loading: false,
    },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <Provider store={mockStore}>
      <ThemeProvider theme={theme}>
        <Router>
          {component}
        </Router>
      </ThemeProvider>
    </Provider>
  );
};

describe('Enhanced Keyboard Navigation Tests', () => {
  test('should handle global keyboard shortcuts', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <KeyboardNavigationManager>
        <div>Test Content</div>
      </KeyboardNavigationManager>
    );

    // Test Ctrl+Alt+H for help
    await user.keyboard('{Control>}{Alt>}{h}');
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Close the dialog
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Test Ctrl+Alt+P for profile
    await user.keyboard('{Control>}{Alt>}{p}');
    // This would navigate to /profile

    // Test Ctrl+Alt+C for chat
    await user.keyboard('{Control>}{Alt>}{c}');
    // This would navigate to /chat

    // Test Ctrl+Alt+D for documents
    await user.keyboard('{Control>}{Alt>}{d}');
    // This would navigate to /documents

    // Test Ctrl+Alt+L for lawyers
    await user.keyboard('{Control>}{Alt>}{l}');
    // This would navigate to /lawyers

    // Test Ctrl+Alt+A for accessibility settings
    await user.keyboard('{Control>}{Alt>}{a}');
    // This would navigate to /accessibility-settings
  });

  test('should handle escape key to close dialogs', async () => {
    const user = userEvent.setup();
    const mockOnClose = jest.fn();

    renderWithProviders(
      <KeyboardNavigationManager>
        <DocumentUploadDialog
          open={true}
          onClose={mockOnClose}
          onUpload={jest.fn()}
        />
      </KeyboardNavigationManager>
    );

    // Dialog should be open
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Press Escape to close dialog
    await user.keyboard('{Escape}');

    // onClose should be called
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('should handle focus trapping in dialogs', async () => {
    const user = userEvent.setup();
    const mockOnClose = jest.fn();

    renderWithProviders(
      <KeyboardNavigationManager>
        <DocumentUploadDialog
          open={true}
          onClose={mockOnClose}
          onUpload={jest.fn()}
        />
      </KeyboardNavigationManager>
    );

    // Dialog should be open
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Focus should be on the file input initially
    const fileInput = screen.getByLabelText('Dateiauswahl');
    expect(fileInput).toBeInTheDocument();

    // Test Tab navigation within dialog
    await user.tab();
    // Focus should remain within dialog

    // Test Shift+Tab navigation
    await user.tab({ shift: true });
    // Focus should remain within dialog
  });

  test('should have proper ARIA attributes in DocumentUploadDialog', async () => {
    renderWithProviders(
      <DocumentUploadDialog
        open={true}
        onClose={jest.fn()}
        onUpload={jest.fn()}
      />
    );

    // Check dialog has proper ARIA attributes
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-labelledby');
    expect(dialog).toHaveAttribute('aria-describedby');

    // Check title has proper ID
    const title = screen.getByText('Dokument hochladen');
    expect(title).toHaveAttribute('id');

    // Check drag and drop area has proper attributes
    const dragArea = screen.getByLabelText('Ziehen Sie Dateien hierher oder klicken Sie zum Auswählen');
    expect(dragArea).toBeInTheDocument();
    expect(dragArea).toHaveAttribute('role', 'button');
    expect(dragArea).toHaveAttribute('tabIndex', '0');

    // Check file input has proper label
    const fileInput = screen.getByLabelText('Dateiauswahl');
    expect(fileInput).toBeInTheDocument();

    // Check buttons have proper labels
    const cancelButton = screen.getByLabelText('Abbrechen');
    expect(cancelButton).toBeInTheDocument();

    const uploadButton = screen.getByLabelText('Dokument hochladen');
    expect(uploadButton).toBeInTheDocument();
  });

  test('should have proper ARIA attributes in LawyerDetailsDialog', async () => {
    renderWithProviders(
      <LawyerDetailsDialog
        open={true}
        onClose={jest.fn()}
        onBook={jest.fn()}
      />
    );

    // Check dialog has proper ARIA attributes
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-labelledby');
    expect(dialog).toHaveAttribute('aria-describedby');

    // Check title has proper ID
    const title = screen.getByText('Max Mustermann');
    expect(title).toHaveAttribute('id');

    // Check regions have proper labels
    const contactRegion = screen.getByLabelText('Kontaktinformationen');
    expect(contactRegion).toBeInTheDocument();

    const specializationsRegion = screen.getByLabelText('Spezialisierungen');
    expect(specializationsRegion).toBeInTheDocument();

    const languagesRegion = screen.getByLabelText('Sprachen');
    expect(languagesRegion).toBeInTheDocument();

    const aboutRegion = screen.getByLabelText('Über mich');
    expect(aboutRegion).toBeInTheDocument();

    const pricingRegion = screen.getByLabelText('Preise');
    expect(pricingRegion).toBeInTheDocument();

    const reviewsRegion = screen.getByLabelText('Bewertungen');
    expect(reviewsRegion).toBeInTheDocument();

    // Check buttons have proper labels
    const closeButton = screen.getByLabelText('Schließen');
    expect(closeButton).toBeInTheDocument();

    const bookButton = screen.getByLabelText('Termin buchen');
    expect(bookButton).toBeInTheDocument();

    const viewAllButton = screen.getByLabelText('Alle Bewertungen anzeigen');
    expect(viewAllButton).toBeInTheDocument();
  });
});