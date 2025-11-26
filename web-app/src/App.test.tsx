import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider, createTheme } from '@mui/material';
import App from './App';
import authReducer from './store/slices/authSlice';
import chatReducer from './store/slices/chatSlice';
import documentReducer from './store/slices/documentSlice';
import lawyerReducer from './store/slices/lawyerSlice';

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

describe('App Component', () => {
  test('renders without crashing', () => {
    renderWithProviders(<App />);
  });

  test('renders header with app title', () => {
    renderWithProviders(<App />);
    expect(screen.getByText(/SmartLaw Agent/i)).toBeInTheDocument();
  });

  test('renders main content area', () => {
    renderWithProviders(<App />);
    const mainContent = screen.getByRole('main');
    expect(mainContent).toBeInTheDocument();
    expect(mainContent).toHaveAttribute('id', 'main-content');
  });

  test('renders navigation header', () => {
    renderWithProviders(<App />);
    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
  });

  test('renders footer', () => {
    renderWithProviders(<App />);
    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeInTheDocument();
  });

  test('renders skip to content link', () => {
    renderWithProviders(<App />);
    const skipLink = screen.getByText(/zum hauptinhalt springen/i);
    expect(skipLink).toBeInTheDocument();
  });

  test('shows login and register buttons when not authenticated', () => {
    renderWithProviders(<App />);
    expect(screen.getByText(/anmelden/i)).toBeInTheDocument();
    expect(screen.getByText(/registrieren/i)).toBeInTheDocument();
  });

  test('renders language switcher buttons', () => {
    renderWithProviders(<App />);
    expect(screen.getByText('DE')).toBeInTheDocument();
    expect(screen.getByText('TR')).toBeInTheDocument();
    expect(screen.getByText('AR')).toBeInTheDocument();
  });

  test('has proper document structure with landmarks', () => {
    renderWithProviders(<App />);
    
    // Check for landmark roles
    expect(screen.getByRole('banner')).toBeInTheDocument(); // header
    expect(screen.getByRole('main')).toBeInTheDocument(); // main content
    expect(screen.getByRole('contentinfo')).toBeInTheDocument(); // footer
    expect(screen.getByRole('navigation')).toBeInTheDocument(); // nav
  });
});
