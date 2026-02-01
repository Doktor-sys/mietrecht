import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import ChatPage from '../pages/ChatPage';
import chatReducer from '../store/slices/chatSlice';
import authReducer from '../store/slices/authSlice';
import documentReducer from '../store/slices/documentSlice';
import lawyerReducer from '../store/slices/lawyerSlice';

// Mock WebSocket
class MockWebSocket {
  onopen: (() => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onclose: (() => void) | null = null;
  readyState = WebSocket.OPEN;

  constructor(public url: string) {
    setTimeout(() => {
      if (this.onopen) this.onopen();
    }, 0);
  }

  send(data: string) {
    // Mock send
  }

  close() {
    if (this.onclose) this.onclose();
  }
}

(global as any).WebSocket = MockWebSocket;

// Mock API
jest.mock('../services/api', () => ({
  chatAPI: {
    startConversation: jest.fn().mockResolvedValue({
      conversationId: 'test-conversation-id',
      message: 'Wie kann ich Ihnen helfen?',
    }),
    sendMessage: jest.fn().mockResolvedValue({
      message: 'Das ist eine Testantwort',
    }),
  },
  documentAPI: {
    upload: jest.fn().mockResolvedValue({
      documentId: 'test-doc-id',
    }),
    analyze: jest.fn().mockResolvedValue({}),
  },
}));

const createTestStore = () => {
  return configureStore({
    reducer: {
      chat: chatReducer,
      auth: authReducer,
      document: documentReducer,
      lawyer: lawyerReducer,
    },
    preloadedState: {
      auth: {
        isAuthenticated: true,
        user: { id: 'test-user', email: 'test@example.com', userType: 'tenant' },
        token: 'test-token',
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
};

describe('ChatPage', () => {
  beforeEach(() => {
    localStorage.setItem('token', 'test-token');
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('rendert die Chat-Seite korrekt', () => {
    const store = createTestStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <ChatPage />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByText(/Mietrechts-Chat/i)).toBeInTheDocument();
  });

  it('zeigt Willkommensnachricht an, wenn keine Nachrichten vorhanden sind', () => {
    const store = createTestStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <ChatPage />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByText(/Willkommen beim SmartLaw Mietrechts-Chat/i)).toBeInTheDocument();
  });

  it('ermöglicht das Eingeben und Senden einer Nachricht', async () => {
    const store = createTestStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <ChatPage />
        </BrowserRouter>
      </Provider>
    );

    const input = screen.getByPlaceholderText(/Beschreiben Sie Ihr mietrechtliches Problem/i);
    const sendButton = screen.getByLabelText(/Senden/i);

    fireEvent.change(input, { target: { value: 'Meine Heizung ist kaputt' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(input).toHaveValue('');
    });
  });

  it('zeigt Typing-Indikator an', async () => {
    const store = createTestStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <ChatPage />
        </BrowserRouter>
      </Provider>
    );

    const input = screen.getByPlaceholderText(/Beschreiben Sie Ihr mietrechtliches Problem/i);
    const sendButton = screen.getByLabelText(/Senden/i);

    fireEvent.change(input, { target: { value: 'Test Nachricht' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText(/Assistent tippt/i)).toBeInTheDocument();
    });
  });

  it('öffnet den Datei-Upload-Dialog', () => {
    const store = createTestStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <ChatPage />
        </BrowserRouter>
      </Provider>
    );

    const attachButton = screen.getByLabelText(/Datei anhängen/i);
    fireEvent.click(attachButton);

    expect(screen.getByText(/Dokument hochladen/i)).toBeInTheDocument();
  });
});
