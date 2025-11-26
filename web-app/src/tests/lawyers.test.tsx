import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import LawyersPage from '../pages/LawyersPage';
import lawyerReducer from '../store/slices/lawyerSlice';
import authReducer from '../store/slices/authSlice';

// Mock API
jest.mock('../services/api', () => ({
  lawyerAPI: {
    search: jest.fn().mockResolvedValue({
      success: true,
      data: [
        {
          id: 'lawyer-1',
          name: 'Dr. Maria Schmidt',
          location: 'Berlin',
          specializations: ['Mietrecht', 'Mieterschutz'],
          rating: 4.5,
          reviewCount: 42,
          hourlyRate: 180,
          languages: ['Deutsch', 'Englisch'],
        },
        {
          id: 'lawyer-2',
          name: 'RA Thomas Müller',
          location: 'München',
          specializations: ['Mietrecht', 'Immobilienrecht'],
          rating: 4.8,
          reviewCount: 67,
          hourlyRate: 200,
          languages: ['Deutsch'],
        },
      ],
    }),
    bookConsultation: jest.fn().mockResolvedValue({
      success: true,
      data: { bookingId: 'booking-123' },
    }),
  },
}));

const createTestStore = () => {
  return configureStore({
    reducer: {
      lawyer: lawyerReducer,
      auth: authReducer,
    },
    preloadedState: {
      auth: {
        isAuthenticated: true,
        user: { id: 'test-user', email: 'test@example.com', userType: 'tenant' },
        token: 'test-token',
        loading: false,
        error: null,
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

describe('LawyersPage', () => {
  beforeEach(() => {
    localStorage.setItem('token', 'test-token');
  });

  afterEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('rendert die Anwaltssuche-Seite korrekt', () => {
    const store = createTestStore();
    
    render(
      <Provider store={store}>
        <BrowserRouter>
          <LawyersPage />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByText(/Anwälte finden/i)).toBeInTheDocument();
  });

  it('lädt Anwälte beim Mounten', async () => {
    const store = createTestStore();
    
    render(
      <Provider store={store}>
        <BrowserRouter>
          <LawyersPage />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Dr. Maria Schmidt/i)).toBeInTheDocument();
      expect(screen.getByText(/RA Thomas Müller/i)).toBeInTheDocument();
    });
  });

  it('filtert Anwälte nach Standort', async () => {
    const { lawyerAPI } = require('../services/api');
    const store = createTestStore();
    
    render(
      <Provider store={store}>
        <BrowserRouter>
          <LawyersPage />
        </BrowserRouter>
      </Provider>
    );

    const locationInput = screen.getByPlaceholderText(/Stadt oder PLZ/i);
    fireEvent.change(locationInput, { target: { value: 'Berlin' } });

    const searchButton = screen.getByRole('button', { name: /Suchen/i });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(lawyerAPI.search).toHaveBeenCalledWith(
        expect.objectContaining({ location: 'Berlin' })
      );
    });
  });

  it('filtert Anwälte nach Spezialisierung', async () => {
    const { lawyerAPI } = require('../services/api');
    const store = createTestStore();
    
    render(
      <Provider store={store}>
        <BrowserRouter>
          <LawyersPage />
        </BrowserRouter>
      </Provider>
    );

    const specializationSelect = screen.getByLabelText(/Spezialisierung/i);
    fireEvent.mouseDown(specializationSelect);

    const option = await screen.findByText(/Mietrecht/i);
    fireEvent.click(option);

    const searchButton = screen.getByRole('button', { name: /Suchen/i });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(lawyerAPI.search).toHaveBeenCalledWith(
        expect.objectContaining({ specialization: 'rent_law' })
      );
    });
  });

  it('öffnet Anwalts-Details-Dialog', async () => {
    const store = createTestStore();
    
    render(
      <Provider store={store}>
        <BrowserRouter>
          <LawyersPage />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Dr. Maria Schmidt/i)).toBeInTheDocument();
    });

    const viewProfileButton = screen.getAllByText(/Profil ansehen/i)[0];
    fireEvent.click(viewProfileButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('öffnet Buchungs-Dialog', async () => {
    const store = createTestStore();
    
    render(
      <Provider store={store}>
        <BrowserRouter>
          <LawyersPage />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Dr. Maria Schmidt/i)).toBeInTheDocument();
    });

    const bookButton = screen.getAllByText(/Termin buchen/i)[0];
    fireEvent.click(bookButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('zeigt "Keine Ergebnisse" Nachricht an', async () => {
    const { lawyerAPI } = require('../services/api');
    lawyerAPI.search.mockResolvedValueOnce({
      success: true,
      data: [],
    });

    const store = createTestStore();
    
    render(
      <Provider store={store}>
        <BrowserRouter>
          <LawyersPage />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Keine Anwälte gefunden/i)).toBeInTheDocument();
    });
  });

  it('zeigt Bewertungen korrekt an', async () => {
    const store = createTestStore();
    
    render(
      <Provider store={store}>
        <BrowserRouter>
          <LawyersPage />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(/42.*Bewertungen/i)).toBeInTheDocument();
      expect(screen.getByText(/67.*Bewertungen/i)).toBeInTheDocument();
    });
  });

  it('zeigt Stundensätze an', async () => {
    const store = createTestStore();
    
    render(
      <Provider store={store}>
        <BrowserRouter>
          <LawyersPage />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(/180€\/h/i)).toBeInTheDocument();
      expect(screen.getByText(/200€\/h/i)).toBeInTheDocument();
    });
  });
});

describe('LawyerDetailsDialog', () => {
  it('zeigt Anwalts-Details korrekt an', async () => {
    const store = createTestStore();
    
    render(
      <Provider store={store}>
        <BrowserRouter>
          <LawyersPage />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Dr. Maria Schmidt/i)).toBeInTheDocument();
    });

    const viewProfileButton = screen.getAllByText(/Profil ansehen/i)[0];
    fireEvent.click(viewProfileButton);

    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(screen.getByText(/Berlin/i)).toBeInTheDocument();
      expect(screen.getByText(/Mietrecht/i)).toBeInTheDocument();
    });
  });

  it('zeigt Sprachen an', async () => {
    const store = createTestStore();
    
    render(
      <Provider store={store}>
        <BrowserRouter>
          <LawyersPage />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Dr. Maria Schmidt/i)).toBeInTheDocument();
    });

    const viewProfileButton = screen.getAllByText(/Profil ansehen/i)[0];
    fireEvent.click(viewProfileButton);

    await waitFor(() => {
      expect(screen.getByText(/Deutsch/i)).toBeInTheDocument();
      expect(screen.getByText(/Englisch/i)).toBeInTheDocument();
    });
  });

  it('öffnet Buchungs-Dialog aus Details-Dialog', async () => {
    const store = createTestStore();
    
    render(
      <Provider store={store}>
        <BrowserRouter>
          <LawyersPage />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Dr. Maria Schmidt/i)).toBeInTheDocument();
    });

    const viewProfileButton = screen.getAllByText(/Profil ansehen/i)[0];
    fireEvent.click(viewProfileButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const bookButton = screen.getAllByText(/Termin buchen/i)[0];
    fireEvent.click(bookButton);

    // Details-Dialog sollte geschlossen sein, Buchungs-Dialog offen
    await waitFor(() => {
      expect(screen.getByText(/Datum und Uhrzeit wählen/i)).toBeInTheDocument();
    });
  });
});

describe('BookingDialog', () => {
  it('zeigt Buchungs-Schritte korrekt an', async () => {
    const store = createTestStore();
    
    render(
      <Provider store={store}>
        <BrowserRouter>
          <LawyersPage />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Dr. Maria Schmidt/i)).toBeInTheDocument();
    });

    const bookButton = screen.getAllByText(/Termin buchen/i)[0];
    fireEvent.click(bookButton);

    await waitFor(() => {
      expect(screen.getByText(/Datum und Uhrzeit wählen/i)).toBeInTheDocument();
      expect(screen.getByText(/Beratungsart/i)).toBeInTheDocument();
      expect(screen.getByText(/Bestätigung/i)).toBeInTheDocument();
    });
  });

  it('ermöglicht Datum-Auswahl', async () => {
    const store = createTestStore();
    
    render(
      <Provider store={store}>
        <BrowserRouter>
          <LawyersPage />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Dr. Maria Schmidt/i)).toBeInTheDocument();
    });

    const bookButton = screen.getAllByText(/Termin buchen/i)[0];
    fireEvent.click(bookButton);

    await waitFor(() => {
      const dateChips = screen.getAllByRole('button', { name: /\w+,.*\d{4}/i });
      expect(dateChips.length).toBeGreaterThan(0);
    });
  });

  it('ermöglicht Zeit-Auswahl nach Datum-Auswahl', async () => {
    const store = createTestStore();
    
    render(
      <Provider store={store}>
        <BrowserRouter>
          <LawyersPage />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Dr. Maria Schmidt/i)).toBeInTheDocument();
    });

    const bookButton = screen.getAllByText(/Termin buchen/i)[0];
    fireEvent.click(bookButton);

    await waitFor(() => {
      const dateChips = screen.getAllByRole('button', { name: /\w+,.*\d{4}/i });
      fireEvent.click(dateChips[0]);
    });

    await waitFor(() => {
      expect(screen.getByText(/09:00/i)).toBeInTheDocument();
      expect(screen.getByText(/10:00/i)).toBeInTheDocument();
    });
  });

  it('navigiert durch Buchungs-Schritte', async () => {
    const store = createTestStore();
    
    render(
      <Provider store={store}>
        <BrowserRouter>
          <LawyersPage />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Dr. Maria Schmidt/i)).toBeInTheDocument();
    });

    const bookButton = screen.getAllByText(/Termin buchen/i)[0];
    fireEvent.click(bookButton);

    // Schritt 1: Datum und Zeit
    await waitFor(() => {
      const dateChips = screen.getAllByRole('button', { name: /\w+,.*\d{4}/i });
      fireEvent.click(dateChips[0]);
    });

    await waitFor(() => {
      const timeChip = screen.getByText(/09:00/i);
      fireEvent.click(timeChip);
    });

    const nextButton = screen.getByRole('button', { name: /Weiter/i });
    fireEvent.click(nextButton);

    // Schritt 2: Beratungsart
    await waitFor(() => {
      expect(screen.getByLabelText(/Beratungsart auswählen/i)).toBeInTheDocument();
    });
  });

  it('zeigt Fehler bei unvollständiger Auswahl', async () => {
    const store = createTestStore();
    
    render(
      <Provider store={store}>
        <BrowserRouter>
          <LawyersPage />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Dr. Maria Schmidt/i)).toBeInTheDocument();
    });

    const bookButton = screen.getAllByText(/Termin buchen/i)[0];
    fireEvent.click(bookButton);

    await waitFor(() => {
      const nextButton = screen.getByRole('button', { name: /Weiter/i });
      fireEvent.click(nextButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/Bitte wählen Sie Datum und Uhrzeit/i)).toBeInTheDocument();
    });
  });

  it('bucht erfolgreich eine Beratung', async () => {
    const { lawyerAPI } = require('../services/api');
    const store = createTestStore();
    
    render(
      <Provider store={store}>
        <BrowserRouter>
          <LawyersPage />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Dr. Maria Schmidt/i)).toBeInTheDocument();
    });

    const bookButton = screen.getAllByText(/Termin buchen/i)[0];
    fireEvent.click(bookButton);

    // Schritt 1: Datum und Zeit
    await waitFor(() => {
      const dateChips = screen.getAllByRole('button', { name: /\w+,.*\d{4}/i });
      fireEvent.click(dateChips[0]);
    });

    await waitFor(() => {
      const timeChip = screen.getByText(/09:00/i);
      fireEvent.click(timeChip);
    });

    let nextButton = screen.getByRole('button', { name: /Weiter/i });
    fireEvent.click(nextButton);

    // Schritt 2: Beratungsart
    await waitFor(() => {
      const typeSelect = screen.getByLabelText(/Beratungsart auswählen/i);
      fireEvent.mouseDown(typeSelect);
    });

    await waitFor(() => {
      const videoOption = screen.getByText(/Videoberatung/i);
      fireEvent.click(videoOption);
    });

    nextButton = screen.getByRole('button', { name: /Weiter/i });
    fireEvent.click(nextButton);

    // Schritt 3: Bestätigung
    await waitFor(() => {
      expect(screen.getByText(/Buchung bestätigen/i)).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole('button', { name: /Bestätigen und buchen/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(lawyerAPI.bookConsultation).toHaveBeenCalled();
      expect(screen.getByText(/Buchung erfolgreich/i)).toBeInTheDocument();
    });
  });
});
