import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider } from '@mui/material/styles';
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import Header from '../components/Header';
import Footer from '../components/Footer';
import authReducer from '../store/slices/authSlice';
import chatReducer from '../store/slices/chatSlice';
import documentReducer from '../store/slices/documentSlice';
import lawyerReducer from '../store/slices/lawyerSlice';
import theme from '../theme';

expect.extend(toHaveNoViolations);

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

describe('Accessibility Tests', () => {
  test('HomePage should have no accessibility violations', async () => {
    const { container } = renderWithProviders(<HomePage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('LoginPage should have no accessibility violations', async () => {
    const { container } = renderWithProviders(<LoginPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('RegisterPage should have no accessibility violations', async () => {
    const { container } = renderWithProviders(<RegisterPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('Header should have no accessibility violations', async () => {
    const { container } = renderWithProviders(<Header />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('Footer should have no accessibility violations', async () => {
    const { container } = renderWithProviders(<Footer />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
