import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider } from '@mui/material/styles';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import Layout from '../components/Layout';
import authReducer from '../store/slices/authSlice';
import chatReducer from '../store/slices/chatSlice';
import documentReducer from '../store/slices/documentSlice';
import lawyerReducer from '../store/slices/lawyerSlice';
import theme from '../theme';

const mockStore = configureStore({
  reducer: {
    auth: authReducer,
    chat: chatReducer,
    document: documentReducer,
    lawyer: lawyerReducer,
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <Provider store={mockStore}>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          {component}
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
  );
};

describe('Screen Reader Support Tests', () => {
  test('LoginPage should have proper ARIA labels', () => {
    renderWithProviders(<LoginPage />);

    // Check for proper heading
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();

    // Check for form region
    expect(screen.getByRole('region')).toBeInTheDocument();

    // Check for form with aria-label
    const form = screen.getByLabelText(/anmeldeformular/i);
    expect(form).toBeInTheDocument();

    // Check for accessible text fields
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/passwort/i)).toBeInTheDocument();
  });

  test('RegisterPage should have proper ARIA labels', () => {
    renderWithProviders(<RegisterPage />);

    // Check for proper heading
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();

    // Check for form region
    expect(screen.getByRole('region')).toBeInTheDocument();

    // Check for form with aria-label
    const form = screen.getByLabelText(/registrierungsformular/i);
    expect(form).toBeInTheDocument();

    // Check for accessible select
    expect(screen.getByLabelText(/benutzertyp/i)).toBeInTheDocument();
  });

  test('Layout should have proper landmark roles', () => {
    renderWithProviders(<Layout />);

    // Check for main landmark
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
    expect(main).toHaveAttribute('aria-label', 'Hauptinhalt');

    // Check for banner (header)
    expect(screen.getByRole('banner')).toBeInTheDocument();

    // Check for contentinfo (footer)
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();

    // Check for navigation
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  test('Skip to content link should be present', () => {
    renderWithProviders(<Layout />);

    const skipLink = screen.getByText(/zum hauptinhalt springen/i);
    expect(skipLink).toBeInTheDocument();
  });

  test('Error messages should have proper ARIA live regions', () => {
    const storeWithError = configureStore({
      reducer: {
        auth: authReducer,
        chat: chatReducer,
        document: documentReducer,
        lawyer: lawyerReducer,
      },
      preloadedState: {
        auth: {
          user: null,
          token: null,
          isAuthenticated: false,
          loading: false,
          error: 'Test error message',
        },
      },
    });

    render(
      <Provider store={storeWithError}>
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <LoginPage />
          </ThemeProvider>
        </BrowserRouter>
      </Provider>
    );

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveAttribute('aria-live');
  });
});
