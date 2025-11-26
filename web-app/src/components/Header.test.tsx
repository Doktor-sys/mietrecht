import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider, createTheme } from '@mui/material';
import Header from './Header';
import authReducer from '../store/slices/authSlice';
import chatReducer from '../store/slices/chatSlice';
import documentReducer from '../store/slices/documentSlice';
import lawyerReducer from '../store/slices/lawyerSlice';

const theme = createTheme();

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authReducer,
      chat: chatReducer,
      document: documentReducer,
      lawyer: lawyerReducer,
    },
    preloadedState: initialState,
  });
};

const renderWithProviders = (
  component: React.ReactElement,
  initialState = {}
) => {
  const store = createMockStore(initialState);
  return render(
    <Provider store={store}>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          {component}
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
  );
};

describe('Header Component', () => {
  test('renders app title', () => {
    renderWithProviders(<Header />);
    expect(screen.getByText(/SmartLaw Agent/i)).toBeInTheDocument();
  });

  test('renders login button when not authenticated', () => {
    renderWithProviders(<Header />);
    expect(screen.getByText(/Anmelden/i)).toBeInTheDocument();
  });

  test('renders register button when not authenticated', () => {
    renderWithProviders(<Header />);
    expect(screen.getByText(/Registrieren/i)).toBeInTheDocument();
  });

  test('renders language switcher buttons', () => {
    renderWithProviders(<Header />);
    expect(screen.getByText('DE')).toBeInTheDocument();
    expect(screen.getByText('TR')).toBeInTheDocument();
    expect(screen.getByText('AR')).toBeInTheDocument();
  });

  test('has proper banner role', () => {
    renderWithProviders(<Header />);
    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
  });

  test('has navigation with proper aria-label', () => {
    renderWithProviders(<Header />);
    const nav = screen.getByRole('navigation', { name: /hauptnavigation/i });
    expect(nav).toBeInTheDocument();
  });

  test('language buttons have proper aria-labels', () => {
    renderWithProviders(<Header />);
    expect(screen.getByLabelText(/sprache auf deutsch ändern/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/dili türkçe olarak değiştir/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/تغيير اللغة إلى العربية/i)).toBeInTheDocument();
  });

  test('shows navigation links when authenticated', () => {
    const authenticatedState = {
      auth: {
        user: { id: '1', email: 'test@test.com', userType: 'tenant' as const },
        token: 'test-token',
        isAuthenticated: true,
        loading: false,
        error: null,
      },
    };

    renderWithProviders(<Header />, authenticatedState);
    
    expect(screen.getByText(/chat/i)).toBeInTheDocument();
    expect(screen.getByText(/dokumente/i)).toBeInTheDocument();
    expect(screen.getByText(/anwälte/i)).toBeInTheDocument();
  });

  test('shows user menu when authenticated', () => {
    const authenticatedState = {
      auth: {
        user: { id: '1', email: 'test@test.com', userType: 'tenant' as const },
        token: 'test-token',
        isAuthenticated: true,
        loading: false,
        error: null,
      },
    };

    renderWithProviders(<Header />, authenticatedState);
    
    const userMenuButton = screen.getByLabelText(/benutzerkonto-menü öffnen/i);
    expect(userMenuButton).toBeInTheDocument();
  });

  test('language switcher buttons have aria-pressed attribute', () => {
    renderWithProviders(<Header />);
    
    const deButton = screen.getByLabelText(/sprache auf deutsch ändern/i);
    expect(deButton).toHaveAttribute('aria-pressed');
  });
});
