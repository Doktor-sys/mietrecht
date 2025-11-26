import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';
import BookingDialog from '../components/BookingDialog';
import lawyerReducer, { selectLawyer } from '../store/slices/lawyerSlice';
import { lawyerAPI } from '../services/api';

jest.mock('../services/api');

const mockLawyer = {
  id: '1',
  name: 'Dr. Max Mustermann',
  location: 'Berlin',
  rating: 4.5,
  reviewCount: 42,
  specializations: ['Mietrecht', 'Wohnungseigentumsrecht'],
  hourlyRate: 200,
  languages: ['Deutsch', 'English'],
  availableSlots: [],
  verified: true,
};

const createMockStore = () => {
  const store = configureStore({
    reducer: {
      lawyer: lawyerReducer,
    },
  });
  store.dispatch(selectLawyer(mockLawyer));
  return store;
};

describe('BookingDialog', () => {
  let store: ReturnType<typeof createMockStore>;

  beforeEach(() => {
    store = createMockStore();
    jest.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    return render(
      <Provider store={store}>
        <I18nextProvider i18n={i18n}>
          <BookingDialog open={true} onClose={jest.fn()} {...props} />
        </I18nextProvider>
      </Provider>
    );
  };

  it('should render booking dialog with lawyer name', () => {
    renderComponent();
    expect(screen.getByText(/Dr. Max Mustermann/i)).toBeInTheDocument();
  });

  it('should show date and time selection in first step', () => {
    renderComponent();
    expect(screen.getByText(/Datum und Zeit auswählen/i)).toBeInTheDocument();
  });

  it('should not proceed without selecting date and time', async () => {
    renderComponent();
    
    const nextButton = screen.getByRole('button', { name: /weiter/i });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText(/Bitte wählen Sie Datum und Zeit/i)).toBeInTheDocument();
    });
  });

  it('should proceed to consultation type selection after selecting date and time', async () => {
    renderComponent();
    
    // Select date
    const dateChips = screen.getAllByRole('button');
    const dateChip = dateChips.find(chip => chip.textContent?.includes('2024'));
    if (dateChip) fireEvent.click(dateChip);

    // Select time
    const timeChip = screen.getByText('09:00');
    fireEvent.click(timeChip);

    // Click next
    const nextButton = screen.getByRole('button', { name: /weiter/i });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText(/Beratungsart/i)).toBeInTheDocument();
    });
  });

  it('should show confirmation step with all selected details', async () => {
    renderComponent();
    
    // Select date and time
    const dateChips = screen.getAllByRole('button');
    const dateChip = dateChips.find(chip => chip.textContent?.includes('2024'));
    if (dateChip) fireEvent.click(dateChip);
    
    const timeChip = screen.getByText('09:00');
    fireEvent.click(timeChip);
    
    fireEvent.click(screen.getByRole('button', { name: /weiter/i }));

    await waitFor(() => {
      expect(screen.getByText(/Beratungsart/i)).toBeInTheDocument();
    });

    // Select consultation type
    const consultationTypeSelect = screen.getByLabelText(/Beratungsart auswählen/i);
    fireEvent.mouseDown(consultationTypeSelect);
    
    const videoOption = await screen.findByText(/Videoberatung/i);
    fireEvent.click(videoOption);

    fireEvent.click(screen.getByRole('button', { name: /weiter/i }));

    await waitFor(() => {
      expect(screen.getByText(/Buchung bestätigen/i)).toBeInTheDocument();
      expect(screen.getByText(/Dr. Max Mustermann/i)).toBeInTheDocument();
    });
  });

  it('should successfully book consultation', async () => {
    (lawyerAPI.bookConsultation as jest.Mock).mockResolvedValue({
      success: true,
      data: { bookingId: '123' },
    });

    const onClose = jest.fn();
    renderComponent({ onClose });
    
    // Navigate through steps
    const dateChips = screen.getAllByRole('button');
    const dateChip = dateChips.find(chip => chip.textContent?.includes('2024'));
    if (dateChip) fireEvent.click(dateChip);
    
    fireEvent.click(screen.getByText('09:00'));
    fireEvent.click(screen.getByRole('button', { name: /weiter/i }));

    await waitFor(() => {
      expect(screen.getByText(/Beratungsart/i)).toBeInTheDocument();
    });

    const consultationTypeSelect = screen.getByLabelText(/Beratungsart auswählen/i);
    fireEvent.mouseDown(consultationTypeSelect);
    const videoOption = await screen.findByText(/Videoberatung/i);
    fireEvent.click(videoOption);

    fireEvent.click(screen.getByRole('button', { name: /weiter/i }));

    await waitFor(() => {
      expect(screen.getByText(/Buchung bestätigen/i)).toBeInTheDocument();
    });

    // Confirm booking
    const confirmButton = screen.getByRole('button', { name: /Bestätigen und buchen/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(lawyerAPI.bookConsultation).toHaveBeenCalledWith(
        '1',
        expect.any(String),
        expect.objectContaining({
          consultationType: 'video',
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/Erfolgreich gebucht/i)).toBeInTheDocument();
    });
  });

  it('should handle booking error', async () => {
    (lawyerAPI.bookConsultation as jest.Mock).mockRejectedValue(
      new Error('Booking failed')
    );

    renderComponent();
    
    // Navigate to confirmation
    const dateChips = screen.getAllByRole('button');
    const dateChip = dateChips.find(chip => chip.textContent?.includes('2024'));
    if (dateChip) fireEvent.click(dateChip);
    
    fireEvent.click(screen.getByText('09:00'));
    fireEvent.click(screen.getByRole('button', { name: /weiter/i }));

    await waitFor(() => {
      expect(screen.getByText(/Beratungsart/i)).toBeInTheDocument();
    });

    const consultationTypeSelect = screen.getByLabelText(/Beratungsart auswählen/i);
    fireEvent.mouseDown(consultationTypeSelect);
    const videoOption = await screen.findByText(/Videoberatung/i);
    fireEvent.click(videoOption);

    fireEvent.click(screen.getByRole('button', { name: /weiter/i }));

    await waitFor(() => {
      expect(screen.getByText(/Buchung bestätigen/i)).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole('button', { name: /Bestätigen und buchen/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText(/Buchung fehlgeschlagen/i)).toBeInTheDocument();
    });
  });

  it('should allow going back to previous steps', async () => {
    renderComponent();
    
    // Go to step 2
    const dateChips = screen.getAllByRole('button');
    const dateChip = dateChips.find(chip => chip.textContent?.includes('2024'));
    if (dateChip) fireEvent.click(dateChip);
    
    fireEvent.click(screen.getByText('09:00'));
    fireEvent.click(screen.getByRole('button', { name: /weiter/i }));

    await waitFor(() => {
      expect(screen.getByText(/Beratungsart/i)).toBeInTheDocument();
    });

    // Go back
    const backButton = screen.getByRole('button', { name: /zurück/i });
    fireEvent.click(backButton);

    await waitFor(() => {
      expect(screen.getByText(/Datum und Zeit auswählen/i)).toBeInTheDocument();
    });
  });
});
