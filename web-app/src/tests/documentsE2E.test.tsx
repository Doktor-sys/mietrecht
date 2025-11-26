import { render, screen, waitFor, fireEvent, within } from '@testing-library/user';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import DocumentsPage from '../pages/DocumentsPage';
import documentReducer from '../store/slices/documentSlice';
import authReducer from '../store/slices/authSlice';
import { documentAPI } from '../services/api';
import '../i18n';

// Mock APIs
jest.mock('../services/api', () => ({
  documentAPI: {
    getAll: jest.fn(),
    upload: jest.fn(),
    analyze: jest.fn(),
    download: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockDocumentAPI = documentAPI as jest.Mocked<typeof documentAPI>;

describe('Documents E2E Tests', () => {
  let store: ReturnType<typeof configureStore>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup store
    store = configureStore({
      reducer: {
        document: documentReducer,
        auth: authReducer,
      },
      preloadedState: {
        auth: {
          user: { id: 'user-1', email: 'test@example.com' },
          token: 'mock-token',
          isAuthenticated: true,
          loading: false,
          error: null,
        },
        document: {
          documents: [],
          selectedDocument: null,
          uploading: false,
          loading: false,
          error: null,
        },
      },
    });
    
    // Mock window.confirm
    global.confirm = jest.fn(() => true);
    
    // Mock URL.createObjectURL
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = jest.fn();
  });
  
  const renderDocumentsPage = () => {
    return render(
      <Provider store={store}>
        <BrowserRouter>
          <DocumentsPage />
        </BrowserRouter>
      </Provider>
    );
  };
  
  describe('Vollständiger Upload-Flow mit Analyse', () => {
    it('sollte Dokument hochladen und automatisch analysieren', async () => {
      mockDocumentAPI.getAll.mockResolvedValue({
        success: true,
        data: [],
      });
      
      mockDocumentAPI.upload.mockImplementation((file, type, onProgress) => {
        // Simuliere Progress
        setTimeout(() => onProgress(50), 100);
        setTimeout(() => onProgress(100), 200);
        
        return Promise.resolve({
          success: true,
          data: {
            documentId: 'doc-123',
            fileName: file.name,
            documentType: type,
          },
        });
      });
      
      mockDocumentAPI.analyze.mockResolvedValue({
        success: true,
        data: {
          documentType: 'rental_contract',
          issues: [
            {
              type: 'invalid_clause',
              severity: 'warning',
              description: 'Unwirksame Klausel in § 5 gefunden',
              legalBasis: '§ 307 BGB',
              suggestedAction: 'Klausel anfechten',
            },
          ],
          recommendations: [
            {
              title: 'Rechtliche Prüfung empfohlen',
              description: 'Lassen Sie den Vertrag von einem Anwalt prüfen',
              priority: 'high',
            },
          ],
          riskLevel: 'medium',
          extractedData: {
            miete: '850 EUR',
            kaution: '2550 EUR',
          },
        },
      });
      
      renderDocumentsPage();
      
      // Warte auf Laden
      await waitFor(() => {
        expect(mockDocumentAPI.getAll).toHaveBeenCalled();
      });
      
      // Öffne Upload-Dialog
      const uploadButton = screen.getByRole('button', { name: /hochladen/i });
      await userEvent.click(uploadButton);
      
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
      
      // Prüfe ob Dateiname angezeigt wird
      expect(screen.getByText('mietvertrag.pdf')).toBeInTheDocument();
      
      // Wähle Dokumenttyp
      const typeSelect = screen.getByLabelText(/dokumenttyp/i);
      await userEvent.click(typeSelect);
      
      const rentalContractOption = screen.getByRole('option', { name: /mietvertrag/i });
      await userEvent.click(rentalContractOption);
      
      // Klicke Upload-Button
      const submitButton = screen.getByRole('button', { name: /^hochladen$/i });
      await userEvent.click(submitButton);
      
      // Prüfe ob Upload-API aufgerufen wurde
      await waitFor(() => {
        expect(mockDocumentAPI.upload).toHaveBeenCalledWith(
          expect.any(File),
          'rental_contract',
          expect.any(Function)
        );
      });
      
      // Prüfe ob Analyse gestartet wurde
      await waitFor(() => {
        expect(mockDocumentAPI.analyze).toHaveBeenCalledWith('doc-123');
      });
      
      // Prüfe ob Dokument in der Liste angezeigt wird
      await waitFor(() => {
        expect(screen.getByText('mietvertrag.pdf')).toBeInTheDocument();
      });
      
      // Prüfe ob Status "Abgeschlossen" angezeigt wird
      expect(screen.getByText(/abgeschlossen/i)).toBeInTheDocument();
    });
    
    it('sollte Progress während Upload anzeigen', async () => {
      mockDocumentAPI.getAll.mockResolvedValue({
        success: true,
        data: [],
      });
      
      let progressCallback: ((progress: number) => void) | null = null;
      
      mockDocumentAPI.upload.mockImplementation((file, type, onProgress) => {
        progressCallback = onProgress;
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              success: true,
              data: { documentId: 'doc-123' },
            });
          }, 1000);
        });
      });
      
      renderDocumentsPage();
      
      await waitFor(() => {
        expect(mockDocumentAPI.getAll).toHaveBeenCalled();
      });
      
      const uploadButton = screen.getByRole('button', { name: /hochladen/i });
      await userEvent.click(uploadButton);
      
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const fileInput = screen.getByLabelText(/datei auswählen/i);
      await userEvent.upload(fileInput, file);
      
      const typeSelect = screen.getByLabelText(/dokumenttyp/i);
      await userEvent.click(typeSelect);
      const option = screen.getByRole('option', { name: /mietvertrag/i });
      await userEvent.click(option);
      
      const submitButton = screen.getByRole('button', { name: /^hochladen$/i });
      await userEvent.click(submitButton);
      
      // Simuliere Progress-Updates
      await waitFor(() => {
        expect(progressCallback).not.toBeNull();
      });
      
      if (progressCallback) {
        progressCallback(25);
        await waitFor(() => {
          expect(screen.getByText(/25%/i)).toBeInTheDocument();
        });
        
        progressCallback(75);
        await waitFor(() => {
          expect(screen.getByText(/75%/i)).toBeInTheDocument();
        });
      }
    });
    
    it('sollte Fehler bei ungültiger Datei anzeigen', async () => {
      mockDocumentAPI.getAll.mockResolvedValue({
        success: true,
        data: [],
      });
      
      renderDocumentsPage();
      
      await waitFor(() => {
        expect(mockDocumentAPI.getAll).toHaveBeenCalled();
      });
      
      const uploadButton = screen.getByRole('button', { name: /hochladen/i });
      await userEvent.click(uploadButton);
      
      // Erstelle ungültige Datei (zu groß)
      const largeContent = new Array(11 * 1024 * 1024).fill('a').join('');
      const file = new File([largeContent], 'large.pdf', {
        type: 'application/pdf',
      });
      
      const fileInput = screen.getByLabelText(/datei auswählen/i);
      await userEvent.upload(fileInput, file);
      
      // Prüfe ob Fehlermeldung angezeigt wird
      await waitFor(() => {
        expect(screen.getByText(/zu groß/i)).toBeInTheDocument();
      });
    });
    
    it('sollte Fehler bei ungültigem Dateityp anzeigen', async () => {
      mockDocumentAPI.getAll.mockResolvedValue({
        success: true,
        data: [],
      });
      
      renderDocumentsPage();
      
      await waitFor(() => {
        expect(mockDocumentAPI.getAll).toHaveBeenCalled();
      });
      
      const uploadButton = screen.getByRole('button', { name: /hochladen/i });
      await userEvent.click(uploadButton);
      
      // Erstelle ungültige Datei (falscher Typ)
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
  });
  
  describe('Dokument ansehen und herunterladen', () => {
    beforeEach(() => {
      mockDocumentAPI.getAll.mockResolvedValue({
        success: true,
        data: [
          {
            id: 'doc-1',
            fileName: 'mietvertrag.pdf',
            documentType: 'rental_contract',
            uploadDate: '2024-01-15T10:00:00Z',
            analysisStatus: 'completed',
            analysis: {
              documentType: 'rental_contract',
              issues: [
                {
                  type: 'invalid_clause',
                  severity: 'critical',
                  description: 'Unwirksame Schönheitsreparatur-Klausel',
                  legalBasis: '§ 307 BGB',
                  suggestedAction: 'Klausel ist unwirksam und muss nicht befolgt werden',
                },
              ],
              recommendations: [
                {
                  title: 'Anwalt konsultieren',
                  description: 'Lassen Sie den Vertrag rechtlich prüfen',
                  priority: 'high',
                },
              ],
              riskLevel: 'high',
              extractedData: {
                miete: '1200 EUR',
                nebenkosten: '150 EUR',
              },
            },
          },
        ],
      });
    });
    
    it('sollte Analyse-Ergebnisse anzeigen', async () => {
      renderDocumentsPage();
      
      // Warte auf Laden der Dokumente
      await waitFor(() => {
        expect(screen.getByText('mietvertrag.pdf')).toBeInTheDocument();
      });
      
      // Klicke auf Ansehen-Button
      const viewButton = screen.getByLabelText(/ansehen/i);
      await userEvent.click(viewButton);
      
      // Prüfe ob Analyse-Dialog geöffnet ist
      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
      });
      
      // Prüfe Risiko-Level
      expect(screen.getByText(/hoch/i)).toBeInTheDocument();
      
      // Prüfe extrahierte Daten
      expect(screen.getByText(/1200 EUR/i)).toBeInTheDocument();
      expect(screen.getByText(/150 EUR/i)).toBeInTheDocument();
      
      // Prüfe Issues
      expect(screen.getByText(/Unwirksame Schönheitsreparatur-Klausel/i)).toBeInTheDocument();
      expect(screen.getByText(/§ 307 BGB/i)).toBeInTheDocument();
      
      // Prüfe Empfehlungen
      expect(screen.getByText(/Anwalt konsultieren/i)).toBeInTheDocument();
    });
    
    it('sollte Dokument herunterladen', async () => {
      const mockBlob = new Blob(['pdf content'], { type: 'application/pdf' });
      mockDocumentAPI.download.mockResolvedValue(mockBlob);
      
      renderDocumentsPage();
      
      await waitFor(() => {
        expect(screen.getByText('mietvertrag.pdf')).toBeInTheDocument();
      });
      
      // Klicke auf Download-Button
      const downloadButton = screen.getByLabelText(/herunterladen/i);
      await userEvent.click(downloadButton);
      
      // Prüfe ob Download-API aufgerufen wurde
      await waitFor(() => {
        expect(mockDocumentAPI.download).toHaveBeenCalledWith('doc-1');
      });
      
      // Prüfe ob Blob-URL erstellt wurde
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
    });
    
    it('sollte verschiedene Schweregrade korrekt anzeigen', async () => {
      mockDocumentAPI.getAll.mockResolvedValue({
        success: true,
        data: [
          {
            id: 'doc-1',
            fileName: 'test.pdf',
            documentType: 'rental_contract',
            uploadDate: '2024-01-15T10:00:00Z',
            analysisStatus: 'completed',
            analysis: {
              documentType: 'rental_contract',
              issues: [
                {
                  type: 'critical_issue',
                  severity: 'critical',
                  description: 'Kritisches Problem',
                },
                {
                  type: 'warning_issue',
                  severity: 'warning',
                  description: 'Warnung',
                },
                {
                  type: 'info_issue',
                  severity: 'info',
                  description: 'Information',
                },
              ],
              recommendations: [],
              riskLevel: 'medium',
            },
          },
        ],
      });
      
      renderDocumentsPage();
      
      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeInTheDocument();
      });
      
      const viewButton = screen.getByLabelText(/ansehen/i);
      await userEvent.click(viewButton);
      
      await waitFor(() => {
        expect(screen.getByText('Kritisches Problem')).toBeInTheDocument();
        expect(screen.getByText('Warnung')).toBeInTheDocument();
        expect(screen.getByText('Information')).toBeInTheDocument();
      });
      
      // Prüfe ob Schweregrad-Chips angezeigt werden
      expect(screen.getByText(/kritisch/i)).toBeInTheDocument();
      expect(screen.getByText(/warnung/i)).toBeInTheDocument();
      expect(screen.getByText(/information/i)).toBeInTheDocument();
    });
  });
  
  describe('Dokument löschen', () => {
    beforeEach(() => {
      mockDocumentAPI.getAll.mockResolvedValue({
        success: true,
        data: [
          {
            id: 'doc-1',
            fileName: 'test.pdf',
            documentType: 'rental_contract',
            uploadDate: '2024-01-15T10:00:00Z',
            analysisStatus: 'completed',
          },
        ],
      });
    });
    
    it('sollte Dokument nach Bestätigung löschen', async () => {
      mockDocumentAPI.delete.mockResolvedValue({ success: true });
      
      renderDocumentsPage();
      
      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeInTheDocument();
      });
      
      // Klicke auf Löschen-Button
      const deleteButton = screen.getByLabelText(/löschen/i);
      await userEvent.click(deleteButton);
      
      // Prüfe ob Bestätigungsdialog angezeigt wurde
      expect(global.confirm).toHaveBeenCalled();
      
      // Prüfe ob Delete-API aufgerufen wurde
      await waitFor(() => {
        expect(mockDocumentAPI.delete).toHaveBeenCalledWith('doc-1');
      });
      
      // Prüfe ob Dokumente neu geladen wurden
      expect(mockDocumentAPI.getAll).toHaveBeenCalledTimes(2);
    });
    
    it('sollte Dokument nicht löschen bei Abbruch', async () => {
      global.confirm = jest.fn(() => false);
      
      renderDocumentsPage();
      
      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeInTheDocument();
      });
      
      const deleteButton = screen.getByLabelText(/löschen/i);
      await userEvent.click(deleteButton);
      
      // Prüfe ob Delete-API NICHT aufgerufen wurde
      expect(mockDocumentAPI.delete).not.toHaveBeenCalled();
    });
  });
  
  describe('Mehrere Dokumente verwalten', () => {
    it('sollte mehrere Dokumente gleichzeitig anzeigen', async () => {
      mockDocumentAPI.getAll.mockResolvedValue({
        success: true,
        data: [
          {
            id: 'doc-1',
            fileName: 'mietvertrag.pdf',
            documentType: 'rental_contract',
            uploadDate: '2024-01-15T10:00:00Z',
            analysisStatus: 'completed',
          },
          {
            id: 'doc-2',
            fileName: 'nebenkosten.pdf',
            documentType: 'utility_bill',
            uploadDate: '2024-01-16T10:00:00Z',
            analysisStatus: 'analyzing',
          },
          {
            id: 'doc-3',
            fileName: 'abmahnung.pdf',
            documentType: 'warning_letter',
            uploadDate: '2024-01-17T10:00:00Z',
            analysisStatus: 'completed',
          },
        ],
      });
      
      renderDocumentsPage();
      
      await waitFor(() => {
        expect(screen.getByText('mietvertrag.pdf')).toBeInTheDocument();
        expect(screen.getByText('nebenkosten.pdf')).toBeInTheDocument();
        expect(screen.getByText('abmahnung.pdf')).toBeInTheDocument();
      });
      
      // Prüfe verschiedene Status
      expect(screen.getByText(/abgeschlossen/i)).toBeInTheDocument();
      expect(screen.getByText(/analysieren/i)).toBeInTheDocument();
    });
    
    it('sollte verschiedene Dokumenttypen korrekt anzeigen', async () => {
      mockDocumentAPI.getAll.mockResolvedValue({
        success: true,
        data: [
          {
            id: 'doc-1',
            fileName: 'doc1.pdf',
            documentType: 'rental_contract',
            uploadDate: '2024-01-15T10:00:00Z',
            analysisStatus: 'completed',
          },
          {
            id: 'doc-2',
            fileName: 'doc2.pdf',
            documentType: 'utility_bill',
            uploadDate: '2024-01-16T10:00:00Z',
            analysisStatus: 'completed',
          },
          {
            id: 'doc-3',
            fileName: 'doc3.pdf',
            documentType: 'warning_letter',
            uploadDate: '2024-01-17T10:00:00Z',
            analysisStatus: 'completed',
          },
        ],
      });
      
      renderDocumentsPage();
      
      await waitFor(() => {
        expect(screen.getByText(/mietvertrag/i)).toBeInTheDocument();
        expect(screen.getByText(/nebenkostenabrechnung/i)).toBeInTheDocument();
        expect(screen.getByText(/abmahnung/i)).toBeInTheDocument();
      });
    });
  });
  
  describe('Drag & Drop', () => {
    it('sollte Drag & Drop für Datei-Upload unterstützen', async () => {
      mockDocumentAPI.getAll.mockResolvedValue({
        success: true,
        data: [],
      });
      
      mockDocumentAPI.upload.mockResolvedValue({
        success: true,
        data: { documentId: 'doc-123' },
      });
      
      mockDocumentAPI.analyze.mockResolvedValue({
        success: true,
        data: {
          documentType: 'rental_contract',
          issues: [],
          recommendations: [],
          riskLevel: 'low',
        },
      });
      
      renderDocumentsPage();
      
      await waitFor(() => {
        expect(mockDocumentAPI.getAll).toHaveBeenCalled();
      });
      
      const uploadButton = screen.getByRole('button', { name: /hochladen/i });
      await userEvent.click(uploadButton);
      
      // Finde Drop-Zone
      const dropZone = screen.getByText(/hierher ziehen/i).closest('div');
      expect(dropZone).toBeInTheDocument();
      
      // Erstelle Mock-Datei
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      
      // Simuliere Drag Enter
      fireEvent.dragEnter(dropZone!, {
        dataTransfer: {
          files: [file],
        },
      });
      
      // Simuliere Drop
      fireEvent.drop(dropZone!, {
        dataTransfer: {
          files: [file],
        },
      });
      
      // Prüfe ob Datei ausgewählt wurde
      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeInTheDocument();
      });
    });
  });
  
  describe('Fehlerbehandlung', () => {
    it('sollte Fehler beim Laden anzeigen', async () => {
      mockDocumentAPI.getAll.mockRejectedValue(new Error('Network error'));
      
      renderDocumentsPage();
      
      await waitFor(() => {
        expect(screen.getByText(/laden.*fehlgeschlagen/i)).toBeInTheDocument();
      });
    });
    
    it('sollte Fehler beim Upload anzeigen', async () => {
      mockDocumentAPI.getAll.mockResolvedValue({
        success: true,
        data: [],
      });
      
      mockDocumentAPI.upload.mockRejectedValue(new Error('Upload failed'));
      
      renderDocumentsPage();
      
      await waitFor(() => {
        expect(mockDocumentAPI.getAll).toHaveBeenCalled();
      });
      
      const uploadButton = screen.getByRole('button', { name: /hochladen/i });
      await userEvent.click(uploadButton);
      
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const fileInput = screen.getByLabelText(/datei auswählen/i);
      await userEvent.upload(fileInput, file);
      
      const typeSelect = screen.getByLabelText(/dokumenttyp/i);
      await userEvent.click(typeSelect);
      const option = screen.getByRole('option', { name: /mietvertrag/i });
      await userEvent.click(option);
      
      const submitButton = screen.getByRole('button', { name: /^hochladen$/i });
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/upload.*fehlgeschlagen/i)).toBeInTheDocument();
      });
    });
    
    it('sollte Fehler beim Download anzeigen', async () => {
      mockDocumentAPI.getAll.mockResolvedValue({
        success: true,
        data: [
          {
            id: 'doc-1',
            fileName: 'test.pdf',
            documentType: 'rental_contract',
            uploadDate: '2024-01-15T10:00:00Z',
            analysisStatus: 'completed',
          },
        ],
      });
      
      mockDocumentAPI.download.mockRejectedValue(new Error('Download failed'));
      
      renderDocumentsPage();
      
      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeInTheDocument();
      });
      
      const downloadButton = screen.getByLabelText(/herunterladen/i);
      await userEvent.click(downloadButton);
      
      await waitFor(() => {
        expect(screen.getByText(/download.*fehlgeschlagen/i)).toBeInTheDocument();
      });
    });
  });
  
  describe('Barrierefreiheit', () => {
    it('sollte ARIA-Labels für alle Buttons haben', async () => {
      mockDocumentAPI.getAll.mockResolvedValue({
        success: true,
        data: [
          {
            id: 'doc-1',
            fileName: 'test.pdf',
            documentType: 'rental_contract',
            uploadDate: '2024-01-15T10:00:00Z',
            analysisStatus: 'completed',
          },
        ],
      });
      
      renderDocumentsPage();
      
      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeInTheDocument();
      });
      
      expect(screen.getByLabelText(/ansehen/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/herunterladen/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/löschen/i)).toBeInTheDocument();
    });
    
    it('sollte Tastaturnavigation unterstützen', async () => {
      mockDocumentAPI.getAll.mockResolvedValue({
        success: true,
        data: [],
      });
      
      renderDocumentsPage();
      
      await waitFor(() => {
        expect(mockDocumentAPI.getAll).toHaveBeenCalled();
      });
      
      // Tab zum Upload-Button
      await userEvent.tab();
      const uploadButton = screen.getByRole('button', { name: /hochladen/i });
      expect(uploadButton).toHaveFocus();
    });
  });
});
