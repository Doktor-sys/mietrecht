import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import LawyersPage from '../pages/LawyersPage';
import lawyerReducer from '../store/slices/lawyerSlice';
import authReducer from '../store/slices/authSlice';
import { lawyerAPI } from '../services/api';
import '../i18n';

// Mock APIs
jest.mock('../services/api', () => ({
  lawyerAPI: {
    search: jest.fn(),
    getDetails: jest.fn(),
    bookConsultation: jest.fn(),
    getAvailableSlots: jest.fn(),
    submitReview: jest.fn(),
  },
}));

const mockLawyerAPI = lawyerAPI as jest.Mocked<typeof lawyerAPI>;

describe('Lawyers E2E Tests', () => {
  let store: ReturnType<typeof configureStore>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup store
    store = configureStore({
      reducer: {
        lawyer: lawyerReducer,
        auth: authReducer,
      },
      preloadedState: {
        auth: {
          user: { id: 'user-1', email: 'test@example.com', userType: 'tenant' as const },
          token: 'mock-token',
          isAuthenticated: true,
          loading: false,
          error: '',
        },
        lawyer: {
          lawyers: [],
          selectedLawyer: null,
          searchCriteria: {},
          loading: false,
        },
      },
    });
  });
  
  const renderLawyersPage = () => {
    return render(
      <Provider store={store}>
        <BrowserRouter>
          <LawyersPage />
        </BrowserRouter>
      </Provider>
    );
  };
  
  describe('Vollständiger Anwaltssuche-Flow', () => {
    it('sollte Anwälte suchen, filtern und Details anzeigen', async () => {
      mockLawyerAPI.search.mockResolvedValue({
        success: true,
        data: [
          {
            id: 'lawyer-1',
            name: 'Dr. Maria Schmidt',
            location: 'Berlin',
            address: 'Unter den Linden 1, 10117 Berlin',
            specializations: ['Mietrecht', 'Mieterschutz'],
            rating: 4.5,
            reviewCount: 42,
            hourlyRate: 180,
            languages: ['Deutsch', 'Englisch'],
            experience: 15,
            education: 'Freie Universität Berlin',
            bio: 'Spezialisiert auf Mietrecht mit 15 Jahren Erfahrung',
          },
          {
            id: 'lawyer-2',
            name: 'RA Thomas Müller',
            location: 'Berlin',
            address: 'Friedrichstraße 50, 10117 Berlin',
            specializations: ['Mietrecht', 'Immobilienrecht'],
            rating: 4.8,
            reviewCount: 67,
            hourlyRate: 200,
            languages: ['Deutsch'],
            experience: 20,
            education: 'Humboldt-Universität zu Berlin',
            bio: 'Erfahrener Anwalt für Mietrecht',
          },
        ],
      });
      
      renderLawyersPage();
      
      // Warte auf Laden der Anwälte
      await waitFor(() => {
        expect(mockLawyerAPI.search).toHaveBeenCalled();
      });
      
      // Prüfe ob Anwälte angezeigt werden
      await waitFor(() => {
        expect(screen.getByText('Dr. Maria Schmidt')).toBeInTheDocument();
        expect(screen.getByText('RA Thomas Müller')).toBeInTheDocument();
      });
      
      // Prüfe Bewertungen
      expect(screen.getByText(/4\.5/)).toBeInTheDocument();
      expect(screen.getByText(/42.*Bewertungen/i)).toBeInTheDocument();
      
      // Prüfe Stundensätze
      expect(screen.getByText(/180€\/h/i)).toBeInTheDocument();
      expect(screen.getByText(/200€\/h/i)).toBeInTheDocument();
    });
    
    it('sollte nach Standort filtern', async () => {
      mockLawyerAPI.search.mockResolvedValue({
        success: true,
        data: [
          {
            id: 'lawyer-1',
            name: 'Dr. Maria Schmidt',
            location: 'Berlin',
            specializations: ['Mietrecht'],
            rating: 4.5,
            reviewCount: 42,
            hourlyRate: 180,
            languages: ['Deutsch'],
          },
        ],
      });
      
      renderLawyersPage();
      
      // Gebe Standort ein
      const locationInput = screen.getByPlaceholderText(/Stadt oder PLZ/i);
      await userEvent.clear(locationInput);
      await userEvent.type(locationInput, 'Berlin');
      
      // Klicke Suchen
      const searchButton = screen.getByRole('button', { name: /Suchen/i });
      await userEvent.click(searchButton);
      
      // Prüfe API-Aufruf
      await waitFor(() => {
        expect(mockLawyerAPI.search).toHaveBeenCalledWith(
          expect.objectContaining({ location: 'Berlin' })
        );
      });
      
      // Prüfe Ergebnisse
      await waitFor(() => {
        expect(screen.getByText('Dr. Maria Schmidt')).toBeInTheDocument();
      });
    });
    
    it('sollte nach Spezialisierung filtern', async () => {
      mockLawyerAPI.search.mockResolvedValue({
        success: true,
        data: [],
      });
      
      renderLawyersPage();
      
      await waitFor(() => {
        expect(mockLawyerAPI.search).toHaveBeenCalled();
      });
      
      // Wähle Spezialisierung
      const specializationSelect = screen.getByLabelText(/Spezialisierung/i);
      await userEvent.click(specializationSelect);
      
      const option = await screen.findByText(/Mietrecht/i);
      await userEvent.click(option);
      
      // Klicke Suchen
      const searchButton = screen.getByRole('button', { name: /Suchen/i });
      await userEvent.click(searchButton);
      
      // Prüfe API-Aufruf
      await waitFor(() => {
        expect(mockLawyerAPI.search).toHaveBeenCalledWith(
          expect.objectContaining({ specialization: expect.any(String) })
        );
      });
    });
    
    it('sollte nach Bewertung filtern', async () => {
      mockLawyerAPI.search.mockResolvedValue({
        success: true,
        data: [],
      });
      
      renderLawyersPage();
      
      await waitFor(() => {
        expect(mockLawyerAPI.search).toHaveBeenCalled();
      });
      
      // Wähle Mindestbewertung
      const ratingSelect = screen.getByLabelText(/Mindestbewertung/i);
      await userEvent.click(ratingSelect);
      
      const option = await screen.findByText(/4 Sterne/i);
      await userEvent.click(option);
      
      // Klicke Suchen
      const searchButton = screen.getByRole('button', { name: /Suchen/i });
      await userEvent.click(searchButton);
      
      // Prüfe API-Aufruf
      await waitFor(() => {
        expect(mockLawyerAPI.search).toHaveBeenCalledWith(
          expect.objectContaining({ minRating: 4 })
        );
      });
    });
  });
  
  describe('Anwalts-Details anzeigen', () => {
    beforeEach(() => {
      mockLawyerAPI.search.mockResolvedValue({
        success: true,
        data: [
          {
            id: 'lawyer-1',
            name: 'Dr. Maria Schmidt',
            location: 'Berlin',
            address: 'Unter den Linden 1, 10117 Berlin',
            specializations: ['Mietrecht', 'Mieterschutz'],
            rating: 4.5,
            reviewCount: 42,
            hourlyRate: 180,
            languages: ['Deutsch', 'Englisch'],
            experience: 15,
            education: 'Freie Universität Berlin',
            bio: 'Spezialisiert auf Mietrecht mit 15 Jahren Erfahrung',
            reviews: [
              {
                id: 'review-1',
                userName: 'Max Mustermann',
                rating: 5,
                comment: 'Sehr kompetent und hilfsbereit',
                date: '2024-01-15',
              },
            ],
          },
        ],
      });
    });
    
    it('sollte Details-Dialog öffnen und alle Informationen anzeigen', async () => {
      renderLawyersPage();
      
      await waitFor(() => {
        expect(screen.getByText('Dr. Maria Schmidt')).toBeInTheDocument();
      });
      
      // Klicke auf Profil ansehen
      const viewProfileButton = screen.getByRole('button', { name: /Profil ansehen/i });
      await userEvent.click(viewProfileButton);
      
      // Prüfe ob Dialog geöffnet ist
      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
      });
      
      // Prüfe Details
      expect(screen.getByText(/Berlin/i)).toBeInTheDocument();
      expect(screen.getByText(/Unter den Linden 1/i)).toBeInTheDocument();
      expect(screen.getByText(/15 Jahren Erfahrung/i)).toBeInTheDocument();
      expect(screen.getByText(/Freie Universität Berlin/i)).toBeInTheDocument();
      
      // Prüfe Sprachen
      expect(screen.getByText(/Deutsch/i)).toBeInTheDocument();
      expect(screen.getByText(/Englisch/i)).toBeInTheDocument();
      
      // Prüfe Bewertungen
      expect(screen.getByText(/Max Mustermann/i)).toBeInTheDocument();
      expect(screen.getByText(/Sehr kompetent und hilfsbereit/i)).toBeInTheDocument();
    });
    
    it('sollte Dialog schließen können', async () => {
      renderLawyersPage();
      
      await waitFor(() => {
        expect(screen.getByText('Dr. Maria Schmidt')).toBeInTheDocument();
      });
      
      const viewProfileButton = screen.getByRole('button', { name: /Profil ansehen/i });
      await userEvent.click(viewProfileButton);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      // Schließe Dialog
      const closeButton = screen.getByRole('button', { name: /Schließen/i });
      await userEvent.click(closeButton);
      
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });
  
  describe('Vollständiger Buchungs-Flow', () => {
    beforeEach(() => {
      mockLawyerAPI.search.mockResolvedValue({
        success: true,
        data: [
          {
            id: 'lawyer-1',
            name: 'Dr. Maria Schmidt',
            location: 'Berlin',
            specializations: ['Mietrecht'],
            rating: 4.5,
            reviewCount: 42,
            hourlyRate: 180,
            languages: ['Deutsch'],
          },
        ],
      });
      
      mockLawyerAPI.getAvailableSlots.mockResolvedValue({
        success: true,
        data: {
          '2024-02-15': ['09:00', '10:00', '11:00', '14:00', '15:00'],
          '2024-02-16': ['09:00', '10:00', '13:00', '14:00'],
          '2024-02-17': ['10:00', '11:00', '15:00', '16:00'],
        },
      });
      
      mockLawyerAPI.bookConsultation.mockResolvedValue({
        success: true,
        data: {
          bookingId: 'booking-123',
          confirmationNumber: 'CONF-2024-001',
        },
      });
    });
    
    it('sollte vollständigen Buchungsprozess durchlaufen', async () => {
      renderLawyersPage();
      
      await waitFor(() => {
        expect(screen.getByText('Dr. Maria Schmidt')).toBeInTheDocument();
      });
      
      // Schritt 1: Öffne Buchungs-Dialog
      const bookButton = screen.getByRole('button', { name: /Termin buchen/i });
      await userEvent.click(bookButton);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/Datum und Uhrzeit wählen/i)).toBeInTheDocument();
      });
      
      // Schritt 2: Wähle Datum
      await waitFor(() => {
        expect(mockLawyerAPI.getAvailableSlots).toHaveBeenCalledWith('lawyer-1');
      });
      
      const dateButtons = await screen.findAllByRole('button', { name: /\d{2}\.\d{2}\.\d{4}/i });
      expect(dateButtons.length).toBeGreaterThan(0);
      await userEvent.click(dateButtons[0]);
      
      // Schritt 3: Wähle Uhrzeit
      await waitFor(() => {
        expect(screen.getByText(/09:00/i)).toBeInTheDocument();
      });
      
      const timeButton = screen.getByRole('button', { name: /09:00/i });
      await userEvent.click(timeButton);
      
      // Schritt 4: Weiter zu Beratungsart
      const nextButton = screen.getByRole('button', { name: /Weiter/i });
      await userEvent.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Beratungsart/i)).toBeInTheDocument();
      });
      
      // Schritt 5: Wähle Beratungsart
      const typeSelect = screen.getByLabelText(/Beratungsart auswählen/i);
      await userEvent.click(typeSelect);
      
      const videoOption = await screen.findByText(/Videoberatung/i);
      await userEvent.click(videoOption);
      
      // Schritt 6: Gebe Beschreibung ein
      const descriptionInput = screen.getByLabelText(/Beschreibung/i);
      await userEvent.type(descriptionInput, 'Ich habe ein Problem mit meiner Nebenkostenabrechnung');
      
      // Schritt 7: Weiter zur Bestätigung
      const nextButton2 = screen.getByRole('button', { name: /Weiter/i });
      await userEvent.click(nextButton2);
      
      await waitFor(() => {
        expect(screen.getByText(/Buchung bestätigen/i)).toBeInTheDocument();
      });
      
      // Schritt 8: Prüfe Zusammenfassung
      expect(screen.getByText(/Dr. Maria Schmidt/i)).toBeInTheDocument();
      expect(screen.getByText(/09:00/i)).toBeInTheDocument();
      expect(screen.getByText(/Videoberatung/i)).toBeInTheDocument();
      expect(screen.getByText(/180€/i)).toBeInTheDocument();
      
      // Schritt 9: Bestätige Buchung
      const confirmButton = screen.getByRole('button', { name: /Bestätigen und buchen/i });
      await userEvent.click(confirmButton);
      
      // Schritt 10: Prüfe Erfolg
      await waitFor(() => {
        expect(mockLawyerAPI.bookConsultation).toHaveBeenCalledWith({
          lawyerId: 'lawyer-1',
          date: expect.any(String),
          time: '09:00',
          type: 'video',
          description: 'Ich habe ein Problem mit meiner Nebenkostenabrechnung',
        });
      });
      
      await waitFor(() => {
        expect(screen.getByText(/Buchung erfolgreich/i)).toBeInTheDocument();
        expect(screen.getByText(/CONF-2024-001/i)).toBeInTheDocument();
      });
    });
    
    it('sollte Fehler bei unvollständiger Auswahl anzeigen', async () => {
      renderLawyersPage();
      
      await waitFor(() => {
        expect(screen.getByText('Dr. Maria Schmidt')).toBeInTheDocument();
      });
      
      const bookButton = screen.getByRole('button', { name: /Termin buchen/i });
      await userEvent.click(bookButton);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      // Versuche ohne Auswahl weiterzugehen
      const nextButton = screen.getByRole('button', { name: /Weiter/i });
      await userEvent.click(nextButton);
      
      // Prüfe Fehlermeldung
      await waitFor(() => {
        expect(screen.getByText(/Bitte wählen Sie Datum und Uhrzeit/i)).toBeInTheDocument();
      });
    });
    
    it('sollte zurück-Navigation ermöglichen', async () => {
      renderLawyersPage();
      
      await waitFor(() => {
        expect(screen.getByText('Dr. Maria Schmidt')).toBeInTheDocument();
      });
      
      const bookButton = screen.getByRole('button', { name: /Termin buchen/i });
      await userEvent.click(bookButton);
      
      await waitFor(() => {
        const dateButtons = screen.queryAllByRole('button', { name: /\d{2}\.\d{2}\.\d{4}/i });
        if (dateButtons.length > 0) {
          userEvent.click(dateButtons[0]);
        }
      });
      
      await waitFor(() => {
        const timeButton = screen.queryByRole('button', { name: /09:00/i });
        if (timeButton) {
          userEvent.click(timeButton);
        }
      });
      
      const nextButton = screen.getByRole('button', { name: /Weiter/i });
      await userEvent.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Beratungsart/i)).toBeInTheDocument();
      });
      
      // Gehe zurück
      const backButton = screen.getByRole('button', { name: /Zurück/i });
      await userEvent.click(backButton);
      
      // Prüfe ob wieder bei Datum/Zeit
      await waitFor(() => {
        expect(screen.getByText(/Datum und Uhrzeit wählen/i)).toBeInTheDocument();
      });
    });
    
    it('sollte Buchung abbrechen können', async () => {
      renderLawyersPage();
      
      await waitFor(() => {
        expect(screen.getByText('Dr. Maria Schmidt')).toBeInTheDocument();
      });
      
      const bookButton = screen.getByRole('button', { name: /Termin buchen/i });
      await userEvent.click(bookButton);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      // Abbrechen
      const cancelButton = screen.getByRole('button', { name: /Abbrechen/i });
      await userEvent.click(cancelButton);
      
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
      
      // Prüfe dass keine Buchung erfolgt ist
      expect(mockLawyerAPI.bookConsultation).not.toHaveBeenCalled();
    });
  });
  
  describe('Fehlerbehandlung', () => {
    it('sollte Fehler beim Laden anzeigen', async () => {
      mockLawyerAPI.search.mockRejectedValue(new Error('Network error'));
      
      renderLawyersPage();
      
      await waitFor(() => {
        expect(screen.getByText(/Fehler beim Laden/i)).toBeInTheDocument();
      });
    });
    
    it('sollte Fehler bei Buchung anzeigen', async () => {
      mockLawyerAPI.search.mockResolvedValue({
        success: true,
        data: [
          {
            id: 'lawyer-1',
            name: 'Dr. Maria Schmidt',
            location: 'Berlin',
            specializations: ['Mietrecht'],
            rating: 4.5,
            reviewCount: 42,
            hourlyRate: 180,
            languages: ['Deutsch'],
          },
        ],
      });
      
      mockLawyerAPI.getAvailableSlots.mockResolvedValue({
        success: true,
        data: {
          '2024-02-15': ['09:00'],
        },
      });
      
      mockLawyerAPI.bookConsultation.mockRejectedValue(new Error('Booking failed'));
      
      renderLawyersPage();
      
      await waitFor(() => {
        expect(screen.getByText('Dr. Maria Schmidt')).toBeInTheDocument();
      });
      
      const bookButton = screen.getByRole('button', { name: /Termin buchen/i });
      await userEvent.click(bookButton);
      
      // Durchlaufe Buchungsprozess schnell
      await waitFor(async () => {
        const dateButtons = screen.queryAllByRole('button', { name: /\d{2}\.\d{2}\.\d{4}/i });
        if (dateButtons.length > 0) {
          await userEvent.click(dateButtons[0]);
        }
      });
      
      await waitFor(async () => {
        const timeButton = screen.queryByRole('button', { name: /09:00/i });
        if (timeButton) {
          await userEvent.click(timeButton);
        }
      });
      
      const nextButton = screen.getByRole('button', { name: /Weiter/i });
      await userEvent.click(nextButton);
      
      await waitFor(async () => {
        const typeSelect = screen.queryByLabelText(/Beratungsart auswählen/i);
        if (typeSelect) {
          await userEvent.click(typeSelect);
          const option = await screen.findByText(/Videoberatung/i);
          await userEvent.click(option);
        }
      });
      
      const nextButton2 = screen.getByRole('button', { name: /Weiter/i });
      await userEvent.click(nextButton2);
      
      await waitFor(() => {
        const confirmButton = screen.queryByRole('button', { name: /Bestätigen und buchen/i });
        if (confirmButton) {
          userEvent.click(confirmButton);
        }
      });
      
      // Prüfe Fehlermeldung
      await waitFor(() => {
        expect(screen.getByText(/Buchung fehlgeschlagen/i)).toBeInTheDocument();
      });
    });
    
    it('sollte "Keine Ergebnisse" anzeigen', async () => {
      mockLawyerAPI.search.mockResolvedValue({
        success: true,
        data: [],
      });
      
      renderLawyersPage();
      
      await waitFor(() => {
        expect(screen.getByText(/Keine Anwälte gefunden/i)).toBeInTheDocument();
      });
    });
  });
  
  describe('Barrierefreiheit', () => {
    beforeEach(() => {
      mockLawyerAPI.search.mockResolvedValue({
        success: true,
        data: [
          {
            id: 'lawyer-1',
            name: 'Dr. Maria Schmidt',
            location: 'Berlin',
            specializations: ['Mietrecht'],
            rating: 4.5,
            reviewCount: 42,
            hourlyRate: 180,
            languages: ['Deutsch'],
          },
        ],
      });
    });
    
    it('sollte ARIA-Labels für alle Buttons haben', async () => {
      renderLawyersPage();
      
      await waitFor(() => {
        expect(screen.getByText('Dr. Maria Schmidt')).toBeInTheDocument();
      });
      
      expect(screen.getByRole('button', { name: /Profil ansehen/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Termin buchen/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Suchen/i })).toBeInTheDocument();
    });
    
    it('sollte Tastaturnavigation unterstützen', async () => {
      renderLawyersPage();
      
      await waitFor(() => {
        expect(mockLawyerAPI.search).toHaveBeenCalled();
      });
      
      // Tab durch Elemente
      await userEvent.tab();
      const locationInput = screen.getByPlaceholderText(/Stadt oder PLZ/i);
      expect(locationInput).toHaveFocus();
    });
    
    it('sollte Screenreader-freundliche Labels haben', async () => {
      renderLawyersPage();
      
      await waitFor(() => {
        expect(screen.getByText('Dr. Maria Schmidt')).toBeInTheDocument();
      });
      
      // Prüfe Labels
      expect(screen.getByLabelText(/Spezialisierung/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Stadt oder PLZ/i)).toBeInTheDocument();
    });
  });
  
  describe('Responsive Design', () => {
    it('sollte auf mobilen Geräten funktionieren', async () => {
      // Simuliere mobile Viewport
      global.innerWidth = 375;
      global.innerHeight = 667;
      
      mockLawyerAPI.search.mockResolvedValue({
        success: true,
        data: [
          {
            id: 'lawyer-1',
            name: 'Dr. Maria Schmidt',
            location: 'Berlin',
            specializations: ['Mietrecht'],
            rating: 4.5,
            reviewCount: 42,
            hourlyRate: 180,
            languages: ['Deutsch'],
          },
        ],
      });
      
      renderLawyersPage();
      
      await waitFor(() => {
        expect(screen.getByText('Dr. Maria Schmidt')).toBeInTheDocument();
      });
      
      // Prüfe dass Elemente vorhanden sind
      expect(screen.getByRole('button', { name: /Termin buchen/i })).toBeInTheDocument();
    });
  });
});
