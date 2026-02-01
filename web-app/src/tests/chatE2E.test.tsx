import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import ChatPage from '../pages/ChatPage';
import chatReducer from '../store/slices/chatSlice';
import authReducer from '../store/slices/authSlice';
import documentReducer from '../store/slices/documentSlice';
import lawyerReducer from '../store/slices/lawyerSlice';
import { chatAPI, documentAPI } from '../services/api';
import '../i18n';

// Mock WebSocket
class MockWebSocket {
  static instances: MockWebSocket[] = [];

  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;

  readyState: number = WebSocket.CONNECTING;

  constructor(public url: string) {
    MockWebSocket.instances.push(this);

    // Simuliere erfolgreiche Verbindung
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 100);
  }

  send(data: string) {
    console.log('WebSocket send:', data);
  }

  close() {
    this.readyState = WebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close'));
    }
  }

  // Helper für Tests
  simulateMessage(data: any) {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', {
        data: JSON.stringify(data)
      }));
    }
  }

  static reset() {
    MockWebSocket.instances = [];
  }
}

// Mock APIs
jest.mock('../services/api', () => ({
  chatAPI: {
    startConversation: jest.fn(),
    sendMessage: jest.fn(),
    getHistory: jest.fn(),
  },
  documentAPI: {
    upload: jest.fn(),
    analyze: jest.fn(),
  },
}));

// Setup
const mockChatAPI = chatAPI as jest.Mocked<typeof chatAPI>;
const mockDocumentAPI = documentAPI as jest.Mocked<typeof documentAPI>;

describe('Chat E2E Tests', () => {
  let store: any; // Using any for store in tests to avoid type inference issues with preloadedState
  let originalWebSocket: typeof WebSocket;

  beforeAll(() => {
    originalWebSocket = global.WebSocket;
    (global as any).WebSocket = MockWebSocket;
  });

  afterAll(() => {
    global.WebSocket = originalWebSocket;
  });

  beforeEach(() => {
    MockWebSocket.reset();
    jest.clearAllMocks();

    // Setup store
    store = configureStore({
      reducer: {
        chat: chatReducer,
        auth: authReducer,
        document: documentReducer,
        lawyer: lawyerReducer,
      },
      preloadedState: {
        auth: {
          user: { id: 'user-1', email: 'test@example.com', userType: 'tenant' },
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
      },
    });

    // Mock localStorage
    Storage.prototype.getItem = jest.fn(() => 'mock-token');
  });

  const renderChatPage = () => {
    return render(
      <Provider store={store}>
        <BrowserRouter>
          <ChatPage />
        </BrowserRouter>
      </Provider>
    );
  };

  describe('Vollständiger Chat-Flow', () => {
    it('sollte eine neue Konversation starten und Antwort erhalten', async () => {
      mockChatAPI.startConversation.mockResolvedValue({
        conversationId: 'conv-123',
        message: {
          id: 'msg-1',
          role: 'assistant',
          content: 'Hallo! Wie kann ich Ihnen helfen?',
          timestamp: new Date().toISOString(),
        },
      });

      renderChatPage();

      // Warte auf WebSocket-Verbindung
      await waitFor(() => {
        expect(MockWebSocket.instances.length).toBe(1);
      });

      const ws = MockWebSocket.instances[0];

      // Finde Eingabefeld und Button
      const input = screen.getByPlaceholderText(/nachricht/i);
      const sendButton = screen.getByLabelText(/senden/i);

      // Gebe Nachricht ein
      await userEvent.type(input, 'Meine Heizung ist kaputt');

      // Sende Nachricht
      await userEvent.click(sendButton);

      // Prüfe ob Nachricht angezeigt wird
      expect(screen.getByText('Meine Heizung ist kaputt')).toBeInTheDocument();

      // Prüfe ob API aufgerufen wurde
      expect(mockChatAPI.startConversation).toHaveBeenCalledWith('Meine Heizung ist kaputt');

      // Simuliere Typing-Indikator
      ws.simulateMessage({
        type: 'typing',
        isTyping: true,
      });

      await waitFor(() => {
        expect(screen.getByText(/tippt/i)).toBeInTheDocument();
      });

      // Simuliere AI-Antwort über WebSocket
      ws.simulateMessage({
        type: 'message',
        id: 'msg-2',
        content: 'Bei einer defekten Heizung haben Sie das Recht auf Mietminderung gemäß § 536 BGB.',
        timestamp: new Date().toISOString(),
        legalReferences: [
          {
            reference: '§ 536 BGB',
            title: 'Mietminderung bei Sachmängeln',
          },
        ],
      });

      // Prüfe ob AI-Antwort angezeigt wird
      await waitFor(() => {
        expect(screen.getByText(/Bei einer defekten Heizung/i)).toBeInTheDocument();
      });

      // Prüfe ob rechtliche Referenz angezeigt wird
      expect(screen.getByText('§ 536 BGB')).toBeInTheDocument();

      // Prüfe ob Typing-Indikator verschwunden ist
      expect(screen.queryByText(/tippt/i)).not.toBeInTheDocument();
    });

    it('sollte Folgenachrichten in bestehender Konversation senden', async () => {
      mockChatAPI.sendMessage.mockResolvedValue({
        message: {
          id: 'msg-3',
          role: 'assistant',
          content: 'Sie können die Miete um 20-30% mindern.',
          timestamp: new Date().toISOString(),
        },
      });

      // Setup mit bestehender Konversation
      store = configureStore({
        reducer: {
          chat: chatReducer,
          auth: authReducer,
          document: documentReducer,
          lawyer: lawyerReducer,
        },
        preloadedState: {
          auth: {
            user: { id: 'user-1', email: 'test@example.com', userType: 'tenant' },
            token: 'mock-token',
            isAuthenticated: true,
            loading: false,
            error: null,
          },
          chat: {
            messages: [
              {
                id: 'msg-1',
                role: 'user',
                content: 'Meine Heizung ist kaputt',
                timestamp: new Date(),
              },
            ],
            isTyping: false,
            conversationId: 'conv-123',
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

      renderChatPage();

      await waitFor(() => {
        expect(MockWebSocket.instances.length).toBe(1);
      });

      const ws = MockWebSocket.instances[0];

      const input = screen.getByPlaceholderText(/nachricht/i);
      const sendButton = screen.getByLabelText(/senden/i);

      // Sende Folgenachricht
      await userEvent.type(input, 'Um wie viel kann ich die Miete mindern?');
      await userEvent.click(sendButton);

      // Prüfe ob API mit Konversations-ID aufgerufen wurde
      expect(mockChatAPI.sendMessage).toHaveBeenCalledWith(
        'conv-123',
        'Um wie viel kann ich die Miete mindern?'
      );

      // Simuliere Antwort
      ws.simulateMessage({
        type: 'message',
        id: 'msg-3',
        content: 'Sie können die Miete um 20-30% mindern.',
        timestamp: new Date().toISOString(),
      });

      await waitFor(() => {
        expect(screen.getByText(/20-30% mindern/i)).toBeInTheDocument();
      });
    });

    it('sollte Enter-Taste zum Senden verwenden', async () => {
      mockChatAPI.startConversation.mockResolvedValue({
        conversationId: 'conv-123',
        message: {
          id: 'msg-1',
          role: 'assistant',
          content: 'Antwort',
          timestamp: new Date().toISOString(),
        },
      });

      renderChatPage();

      await waitFor(() => {
        expect(MockWebSocket.instances.length).toBe(1);
      });

      const input = screen.getByPlaceholderText(/nachricht/i);

      await userEvent.type(input, 'Test Nachricht{Enter}');

      expect(mockChatAPI.startConversation).toHaveBeenCalledWith('Test Nachricht');
    });

    it('sollte Shift+Enter für Zeilenumbruch verwenden', async () => {
      renderChatPage();

      await waitFor(() => {
        expect(MockWebSocket.instances.length).toBe(1);
      });

      const input = screen.getByPlaceholderText(/nachricht/i) as HTMLTextAreaElement;

      await userEvent.type(input, 'Zeile 1{Shift>}{Enter}{/Shift}Zeile 2');

      // Prüfe ob Nachricht nicht gesendet wurde
      expect(mockChatAPI.startConversation).not.toHaveBeenCalled();

      // Prüfe ob Text im Input ist
      expect(input.value).toContain('Zeile 1');
      expect(input.value).toContain('Zeile 2');
    });
  });

  describe('Dokumenten-Upload und Analyse', () => {
    it('sollte Dokument hochladen und Analyse starten', async () => {
      mockDocumentAPI.upload.mockResolvedValue({
        documentId: 'doc-123',
        filename: 'mietvertrag.pdf',
        documentType: 'rental_contract',
      });

      mockDocumentAPI.analyze.mockResolvedValue({
        documentId: 'doc-123',
        issues: [
          {
            type: 'invalid_clause',
            severity: 'warning',
            description: 'Unwirksame Klausel gefunden',
          },
        ],
      });

      renderChatPage();

      await waitFor(() => {
        expect(MockWebSocket.instances.length).toBe(1);
      });

      // Öffne Upload-Dialog
      const attachButton = screen.getByLabelText(/datei anhängen/i);
      await userEvent.click(attachButton);

      // Prüfe ob Dialog geöffnet ist
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Erstelle Mock-Datei
      const file = new File(['test content'], 'mietvertrag.pdf', {
        type: 'application/pdf',
      });

      // Simuliere Datei-Upload
      const fileInput = screen.getByLabelText(/datei auswählen/i);
      await userEvent.upload(fileInput, file);

      // Wähle Dokumenttyp
      const typeSelect = screen.getByLabelText(/dokumenttyp/i);
      await userEvent.selectOptions(typeSelect, 'rental_contract');

      // Klicke Upload-Button
      const uploadButton = screen.getByRole('button', { name: /hochladen/i });
      await userEvent.click(uploadButton);

      // Prüfe ob Upload-API aufgerufen wurde
      await waitFor(() => {
        expect(mockDocumentAPI.upload).toHaveBeenCalledWith(
          expect.any(File),
          'rental_contract'
        );
      });

      // Prüfe ob Analyse gestartet wurde
      expect(mockDocumentAPI.analyze).toHaveBeenCalledWith('doc-123');

      // Prüfe ob Nachricht im Chat angezeigt wird
      expect(screen.getByText(/mietvertrag\.pdf/i)).toBeInTheDocument();
    });

    it('sollte Fehler bei ungültigem Dateityp anzeigen', async () => {
      renderChatPage();

      await waitFor(() => {
        expect(MockWebSocket.instances.length).toBe(1);
      });

      const attachButton = screen.getByLabelText(/datei anhängen/i);
      await userEvent.click(attachButton);

      // Erstelle ungültige Datei
      const file = new File(['test'], 'document.txt', {
        type: 'text/plain',
      });

      const fileInput = screen.getByLabelText(/datei auswählen/i);
      await userEvent.upload(fileInput, file);

      // Prüfe ob Fehlermeldung angezeigt wird
      await waitFor(() => {
        expect(screen.getByText(/ungültiger dateityp/i)).toBeInTheDocument();
      });
    });

    it('sollte Fehler bei zu großer Datei anzeigen', async () => {
      renderChatPage();

      await waitFor(() => {
        expect(MockWebSocket.instances.length).toBe(1);
      });

      const attachButton = screen.getByLabelText(/datei anhängen/i);
      await userEvent.click(attachButton);

      // Erstelle zu große Datei (>10MB)
      const largeContent = new Array(11 * 1024 * 1024).fill('a').join('');
      const file = new File([largeContent], 'large.pdf', {
        type: 'application/pdf',
      });

      const fileInput = screen.getByLabelText(/datei auswählen/i);
      await userEvent.upload(fileInput, file);

      // Prüfe ob Fehlermeldung angezeigt wird
      await waitFor(() => {
        expect(screen.getByText(/datei zu groß/i)).toBeInTheDocument();
      });
    });
  });

  describe('WebSocket-Verbindung und Wiederverbindung', () => {
    it('sollte WebSocket-Verbindung herstellen', async () => {
      renderChatPage();

      await waitFor(() => {
        expect(MockWebSocket.instances.length).toBe(1);
      });

      const ws = MockWebSocket.instances[0];
      expect(ws.url).toContain('token=mock-token');
    });

    it('sollte Verbindungsstatus anzeigen', async () => {
      renderChatPage();

      // Prüfe ob "Verbinde..." angezeigt wird
      expect(screen.getByText(/verbinde/i)).toBeInTheDocument();

      // Warte auf Verbindung
      await waitFor(() => {
        expect(MockWebSocket.instances.length).toBe(1);
      });

      // Prüfe ob Verbindungsstatus verschwindet
      await waitFor(() => {
        expect(screen.queryByText(/verbinde/i)).not.toBeInTheDocument();
      });
    });

    it('sollte Fehler bei fehlender Authentifizierung anzeigen', async () => {
      Storage.prototype.getItem = jest.fn(() => null);

      renderChatPage();

      await waitFor(() => {
        expect(screen.getByText(/nicht authentifiziert/i)).toBeInTheDocument();
      });
    });

    it('sollte automatisch neu verbinden nach Verbindungsabbruch', async () => {
      jest.useFakeTimers();

      renderChatPage();

      await waitFor(() => {
        expect(MockWebSocket.instances.length).toBe(1);
      });

      const firstWs = MockWebSocket.instances[0];

      // Simuliere Verbindungsabbruch
      firstWs.close();

      // Warte 3 Sekunden (Reconnect-Delay)
      jest.advanceTimersByTime(3000);

      await waitFor(() => {
        expect(MockWebSocket.instances.length).toBe(2);
      });

      jest.useRealTimers();
    });

    it('sollte Heartbeat-Pings senden', async () => {
      jest.useFakeTimers();

      renderChatPage();

      await waitFor(() => {
        expect(MockWebSocket.instances.length).toBe(1);
      });

      const ws = MockWebSocket.instances[0];
      const sendSpy = jest.spyOn(ws, 'send');

      // Warte 30 Sekunden (Heartbeat-Intervall)
      jest.advanceTimersByTime(30000);

      expect(sendSpy).toHaveBeenCalledWith(
        JSON.stringify({ type: 'ping' })
      );

      jest.useRealTimers();
    });
  });

  describe('Mehrere gleichzeitige Konversationen', () => {
    it('sollte zwischen Konversationen wechseln können', async () => {
      // Setup mit mehreren Konversationen
      store = configureStore({
        reducer: {
          chat: chatReducer,
          auth: authReducer,
          document: documentReducer,
          lawyer: lawyerReducer,
        },
        preloadedState: {
          auth: {
            user: { id: 'user-1', email: 'test@example.com', userType: 'tenant' },
            token: 'mock-token',
            isAuthenticated: true,
            loading: false,
            error: null,
          },
          chat: {
            messages: [],
            isTyping: false,
            conversationId: 'conv-1',
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

      renderChatPage();

      await waitFor(() => {
        expect(MockWebSocket.instances.length).toBe(1);
      });

      // Wechsle zu neuer Konversation
      const newChatButton = screen.getByRole('button', { name: /neue konversation/i });
      await userEvent.click(newChatButton);

      // Prüfe ob Konversations-ID zurückgesetzt wurde
      const state = store.getState();
      expect(state.chat.conversationId).toBeNull();
      expect(state.chat.messages).toHaveLength(0);
    });
  });

  describe('Barrierefreiheit', () => {
    it('sollte ARIA-Labels für alle interaktiven Elemente haben', async () => {
      renderChatPage();

      await waitFor(() => {
        expect(MockWebSocket.instances.length).toBe(1);
      });

      expect(screen.getByLabelText(/nachricht eingeben/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/senden/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/datei anhängen/i)).toBeInTheDocument();
    });

    it('sollte Tastaturnavigation unterstützen', async () => {
      renderChatPage();

      await waitFor(() => {
        expect(MockWebSocket.instances.length).toBe(1);
      });

      const input = screen.getByPlaceholderText(/nachricht/i);

      // Tab zur Eingabe
      await userEvent.tab();
      expect(input).toHaveFocus();

      // Tab zum Send-Button
      await userEvent.tab();
      const sendButton = screen.getByLabelText(/senden/i);
      expect(sendButton).toHaveFocus();
    });

    it('sollte Screenreader-Ankündigungen für neue Nachrichten haben', async () => {
      renderChatPage();

      await waitFor(() => {
        expect(MockWebSocket.instances.length).toBe(1);
      });

      const ws = MockWebSocket.instances[0];

      // Simuliere neue Nachricht
      ws.simulateMessage({
        type: 'message',
        id: 'msg-1',
        content: 'Neue Nachricht',
        timestamp: new Date().toISOString(),
      });

      await waitFor(() => {
        const message = screen.getByText('Neue Nachricht');
        expect(message).toHaveAttribute('role', 'article');
      });
    });
  });

  describe('Fehlerbehandlung', () => {
    it('sollte Fehler beim Senden anzeigen', async () => {
      mockChatAPI.startConversation.mockRejectedValue(
        new Error('Netzwerkfehler')
      );

      renderChatPage();

      await waitFor(() => {
        expect(MockWebSocket.instances.length).toBe(1);
      });

      const input = screen.getByPlaceholderText(/nachricht/i);
      const sendButton = screen.getByLabelText(/senden/i);

      await userEvent.type(input, 'Test');
      await userEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText(/fehler beim senden/i)).toBeInTheDocument();
      });
    });

    it('sollte Fehler beim Upload anzeigen', async () => {
      mockDocumentAPI.upload.mockRejectedValue(
        new Error('Upload fehlgeschlagen')
      );

      renderChatPage();

      await waitFor(() => {
        expect(MockWebSocket.instances.length).toBe(1);
      });

      const attachButton = screen.getByLabelText(/datei anhängen/i);
      await userEvent.click(attachButton);

      const file = new File(['test'], 'test.pdf', {
        type: 'application/pdf',
      });

      const fileInput = screen.getByLabelText(/datei auswählen/i);
      await userEvent.upload(fileInput, file);

      const typeSelect = screen.getByLabelText(/dokumenttyp/i);
      await userEvent.selectOptions(typeSelect, 'rental_contract');

      const uploadButton = screen.getByRole('button', { name: /hochladen/i });
      await userEvent.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText(/upload fehlgeschlagen/i)).toBeInTheDocument();
      });
    });
  });
});
