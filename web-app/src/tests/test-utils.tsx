import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore, PreloadedState } from '@reduxjs/toolkit';
import { ThemeProvider } from '@mui/material/styles';
import authReducer from '../store/slices/authSlice';
import chatReducer from '../store/slices/chatSlice';
import documentReducer from '../store/slices/documentSlice';
import lawyerReducer from '../store/slices/lawyerSlice';
import theme from '../theme';
import { RootState } from '../store';

interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
  preloadedState?: PreloadedState<RootState>;
}

export function createMockStore(preloadedState?: PreloadedState<RootState>) {
  return configureStore({
    reducer: {
      auth: authReducer,
      chat: chatReducer,
      document: documentReducer,
      lawyer: lawyerReducer,
    },
    preloadedState,
  });
}

export function renderWithProviders(
  ui: ReactElement,
  {
    preloadedState,
    ...renderOptions
  }: ExtendedRenderOptions = {}
) {
  const store = createMockStore(preloadedState);

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={store}>
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            {children}
          </ThemeProvider>
        </BrowserRouter>
      </Provider>
    );
  }

  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}

// Mock authenticated user state
export const mockAuthenticatedState: PreloadedState<RootState> = {
  auth: {
    user: {
      id: '1',
      email: 'test@example.com',
      userType: 'tenant',
    },
    token: 'mock-token',
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
};

// Mock unauthenticated user state
export const mockUnauthenticatedState: PreloadedState<RootState> = {
  auth: {
    user: null,
    token: null,
    isAuthenticated: false,
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
};

// Re-export everything from testing library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
