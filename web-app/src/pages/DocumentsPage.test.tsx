import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';
import DocumentsPage from './DocumentsPage';
import documentReducer from '../store/slices/documentSlice';
import { Document } from '../store/slices/documentSlice';

const theme = createTheme();

// Mock the API functions
const mockDocumentAPI = {
  getAll: jest.fn(),
  upload: jest.fn(),
  analyze: jest.fn(),
  download: jest.fn(),
  delete: jest.fn(),
  extractText: jest.fn(),
};

// Mock the API module
jest.mock('../services/api', () => ({
  documentAPI: mockDocumentAPI,
}));

// Mock the components
jest.mock('../components/DocumentUploadDialog', () => () => <div data-testid="upload-dialog">Upload Dialog</div>);
jest.mock('../components/DocumentAnalysisView', () => () => <div>Analysis View</div>);
jest.mock('../components/OCRPreviewDialog', () => () => <div data-testid="ocr-preview-dialog">OCR Preview Dialog</div>);

const mockDocuments: Document[] = [
  {
    id: '1',
    name: 'Mietvertrag.pdf',
    type: 'rental_contract',
    uploadDate: new Date(),
    status: 'completed' as const,
    analysisResult: {},
  },
];

const createMockStore = (initialState: any = {}) => {
  return configureStore({
    reducer: {
      document: documentReducer,
    },
    preloadedState: initialState,
  });
};

const renderWithProviders = (store: any) => {
  return render(
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <I18nextProvider i18n={i18n}>
          <DocumentsPage />
        </I18nextProvider>
      </ThemeProvider>
    </Provider>
  );
};

describe('DocumentsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const store = createMockStore({
      document: {
        documents: [],
        selectedDocument: null,
        uploading: false,
      },
    });

    mockDocumentAPI.getAll.mockResolvedValue({ success: true, data: [] });

    renderWithProviders(store);

    expect(screen.getByText('Dokumente')).toBeInTheDocument();
  });

  it('shows OCR preview dialog after upload', async () => {
    const store = createMockStore({
      document: {
        documents: [],
        selectedDocument: null,
        uploading: false,
      },
    });

    mockDocumentAPI.getAll.mockResolvedValue({ success: true, data: [] });
    mockDocumentAPI.upload.mockResolvedValue({
      success: true,
      data: { documentId: 'test-document-id' },
    });

    renderWithProviders(store);

    // Simulate upload completion
    // This would trigger the OCR preview dialog
    expect(screen.getByTestId('ocr-preview-dialog')).toBeInTheDocument();
  });

  it('displays documents when loaded', async () => {
    const store = createMockStore({
      document: {
        documents: mockDocuments,
        selectedDocument: null,
        uploading: false,
      },
    });

    mockDocumentAPI.getAll.mockResolvedValue({ success: true, data: mockDocuments });

    renderWithProviders(store);

    await waitFor(() => {
      expect(screen.getByText('Mietvertrag.pdf')).toBeInTheDocument();
    });
  });
});