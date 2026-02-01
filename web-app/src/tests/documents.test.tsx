import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import DocumentsPage from '../pages/DocumentsPage';
import documentReducer from '../store/slices/documentSlice';
import authReducer from '../store/slices/authSlice';
import chatReducer from '../store/slices/chatSlice';
import lawyerReducer from '../store/slices/lawyerSlice';

// Mock API
jest.mock('../services/api', () => ({
  documentAPI: {
    getAll: jest.fn().mockResolvedValue({
      success: true,
      data: [
        {
          id: 'doc-1',
          fileName: 'Mietvertrag.pdf',
          documentType: 'rental_contract',
          uploadDate: '2024-01-01',
          analysisStatus: 'completed',
          analysis: {
            documentType: 'rental_contract',
            issues: [
              {
                type: 'invalid_clause',
                severity: 'warning',
                description: 'Unwirksame Klausel gefunden',
                legalBasis: '§ 307 BGB',
                suggestedAction: 'Klausel anfechten',
              },
            ],
            recommendations: [
              {
                title: 'Mietvertrag prüfen lassen',
                description: 'Empfehlung: Anwalt konsultieren',
                priority: 'medium',
              },
            ],
            riskLevel: 'medium',
          },
        },
      ],
    }),
    upload: jest.fn().mockResolvedValue({
      success: true,
      data: { documentId: 'new-doc-id' },
    }),
    analyze: jest.fn().mockResolvedValue({
      success: true,
      data: {
        documentType: 'rental_contract',
        issues: [],
        recommendations: [],
        riskLevel: 'low',
      },
    }),
    download: jest.fn().mockResolvedValue(new Blob(['test'], { type: 'application/pdf' })),
    delete: jest.fn().mockResolvedValue({ success: true }),
  },
}));

const createTestStore = () => {
  return configureStore({
    reducer: {
      document: documentReducer,
      auth: authReducer,
      chat: chatReducer,
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
      document: {
        documents: [],
        selectedDocument: null,
        uploading: false,
      },
      chat: {
        messages: [],
        isTyping: false,
        conversationId: null,
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

describe('DocumentsPage', () => {
  beforeEach(() => {
    localStorage.setItem('token', 'test-token');
  });

  afterEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('rendert die Dokumente-Seite korrekt', () => {
    const store = createTestStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <DocumentsPage />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByText(/Dokumente/i)).toBeInTheDocument();
  });

  it('lädt Dokumente beim Mounten', async () => {
    const store = createTestStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <DocumentsPage />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Mietvertrag.pdf/i)).toBeInTheDocument();
    });
  });

  it('öffnet den Upload-Dialog', () => {
    const store = createTestStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <DocumentsPage />
        </BrowserRouter>
      </Provider>
    );

    const uploadButton = screen.getAllByText(/Dokument hochladen/i)[0];
    fireEvent.click(uploadButton);

    expect(screen.getByText(/Dokumenttyp/i)).toBeInTheDocument();
  });

  it('zeigt Analyse-Ergebnisse an', async () => {
    const store = createTestStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <DocumentsPage />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Mietvertrag.pdf/i)).toBeInTheDocument();
    });

    // Klicke auf Ansehen-Button
    const viewButtons = screen.getAllByLabelText(/Ansehen/i);
    fireEvent.click(viewButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/Analyse-Ergebnisse/i)).toBeInTheDocument();
    });
  });

  it('zeigt "Keine Dokumente" Nachricht an, wenn keine Dokumente vorhanden sind', async () => {
    const { documentAPI } = require('../services/api');
    documentAPI.getAll.mockResolvedValueOnce({
      success: true,
      data: [],
    });

    const store = createTestStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <DocumentsPage />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Keine Dokumente vorhanden/i)).toBeInTheDocument();
    });
  });

  it('zeigt verschiedene Dokumentstatus korrekt an', async () => {
    const { documentAPI } = require('../services/api');
    documentAPI.getAll.mockResolvedValueOnce({
      success: true,
      data: [
        {
          id: 'doc-1',
          fileName: 'Test1.pdf',
          documentType: 'rental_contract',
          uploadDate: '2024-01-01',
          analysisStatus: 'completed',
        },
        {
          id: 'doc-2',
          fileName: 'Test2.pdf',
          documentType: 'utility_bill',
          uploadDate: '2024-01-02',
          analysisStatus: 'analyzing',
        },
      ],
    });

    const store = createTestStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <DocumentsPage />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Abgeschlossen/i)).toBeInTheDocument();
      expect(screen.getByText(/Wird analysiert/i)).toBeInTheDocument();
    });
  });
});

describe('DocumentAnalysisView', () => {
  it('zeigt Probleme mit verschiedenen Schweregraden an', () => {
    const mockDocument = {
      id: 'doc-1',
      name: 'Test.pdf',
      type: 'rental_contract',
      uploadDate: new Date(),
      status: 'completed',
      analysisResult: {
        documentType: 'rental_contract',
        issues: [
          {
            type: 'invalid_clause',
            severity: 'critical' as const,
            description: 'Kritisches Problem',
            legalBasis: '§ 307 BGB',
          },
          {
            type: 'missing_info',
            severity: 'warning' as const,
            description: 'Warnung',
          },
          {
            type: 'info',
            severity: 'info' as const,
            description: 'Information',
          },
        ],
        recommendations: [],
        riskLevel: 'high' as const,
      },
    };

    const store = createTestStore();
    const DocumentAnalysisView = require('../components/DocumentAnalysisView').default;

    render(
      <Provider store={store}>
        <BrowserRouter>
          <DocumentAnalysisView document={mockDocument} />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByText(/Kritisches Problem/i)).toBeInTheDocument();
    expect(screen.getByText(/Warnung/i)).toBeInTheDocument();
    expect(screen.getByText(/Information/i)).toBeInTheDocument();
  });

  it('zeigt "Keine Probleme" Nachricht an, wenn keine Issues vorhanden sind', () => {
    const mockDocument = {
      id: 'doc-1',
      name: 'Test.pdf',
      type: 'rental_contract',
      uploadDate: new Date(),
      status: 'completed',
      analysisResult: {
        documentType: 'rental_contract',
        issues: [],
        recommendations: [],
        riskLevel: 'low' as const,
      },
    };

    const store = createTestStore();
    const DocumentAnalysisView = require('../components/DocumentAnalysisView').default;

    render(
      <Provider store={store}>
        <BrowserRouter>
          <DocumentAnalysisView document={mockDocument} />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByText(/Keine Probleme gefunden/i)).toBeInTheDocument();
  });
});
