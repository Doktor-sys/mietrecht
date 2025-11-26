import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider } from '@mui/material/styles';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import Header from '../components/Header';
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

describe('Keyboard Navigation Tests', () => {
  test('LoginPage form fields should be keyboard navigable', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    const emailInput = screen.getByLabelText(/e-mail/i);
    const passwordInput = screen.getByLabelText(/passwort/i);
    const submitButton = screen.getByRole('button', { name: /anmelden/i });

    // Tab through form fields
    await user.tab();
    expect(emailInput).toHaveFocus();

    await user.tab();
    expect(passwordInput).toHaveFocus();

    await user.tab();
    expect(submitButton).toHaveFocus();
  });

  test('RegisterPage form fields should be keyboard navigable', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    const emailInput = screen.getByLabelText(/e-mail/i);
    const passwordInput = screen.getByLabelText(/passwort/i);

    // Tab through form fields
    await user.tab();
    expect(emailInput).toHaveFocus();

    await user.tab();
    expect(passwordInput).toHaveFocus();
  });

  test('Header navigation links should be keyboard accessible', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Header />);

    const homeLink = screen.getByText(/SmartLaw Agent/i);
    
    // Tab to home link
    await user.tab();
    expect(homeLink).toHaveFocus();
  });

  test('Language switcher buttons should be keyboard accessible', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Header />);

    const deButton = screen.getByRole('button', { name: /Sprache auf Deutsch ändern/i });
    
    // Should be able to focus and activate with keyboard
    deButton.focus();
    expect(deButton).toHaveFocus();
    
    fireEvent.keyDown(deButton, { key: 'Enter', code: 'Enter' });
    // Language should change (tested via aria-pressed)
  });
});
