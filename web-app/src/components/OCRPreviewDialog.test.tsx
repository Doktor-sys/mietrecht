import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';
import OCRPreviewDialog from './OCRPreviewDialog';

const theme = createTheme();

const mockOnExtractText = jest.fn();
const mockOnConfirm = jest.fn();
const mockOnClose = jest.fn();

const defaultProps = {
  open: true,
  onClose: mockOnClose,
  documentId: 'test-document-id',
  onConfirm: mockOnConfirm,
  onExtractText: mockOnExtractText,
};

const renderComponent = (props = {}) => {
  return render(
    <ThemeProvider theme={theme}>
      <I18nextProvider i18n={i18n}>
        <OCRPreviewDialog {...defaultProps} {...props} />
      </I18nextProvider>
    </ThemeProvider>
  );
};

describe('OCRPreviewDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the dialog when open', () => {
    renderComponent();
    
    expect(screen.getByText('OCR-Vorschau')).toBeInTheDocument();
    expect(screen.getByText('Text wird extrahiert...')).toBeInTheDocument();
  });

  it('calls onExtractText when opened', () => {
    renderComponent();
    
    expect(mockOnExtractText).toHaveBeenCalledWith('test-document-id');
  });

  it('displays extracted text and confidence when extraction succeeds', async () => {
    mockOnExtractText.mockResolvedValue({
      success: true,
      data: {
        text: 'Extracted document text',
        confidence: 0.85,
      },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Extrahierter Text')).toBeInTheDocument();
      expect(screen.getByText('Extracted document text')).toBeInTheDocument();
      expect(screen.getByText('Konfidenz: 85.0%')).toBeInTheDocument();
    });
  });

  it('displays error message when extraction fails', async () => {
    mockOnExtractText.mockRejectedValue(new Error('Extraction failed'));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Textextraktion fehlgeschlagen.')).toBeInTheDocument();
    });
  });

  it('calls onConfirm when confirm button is clicked', async () => {
    mockOnExtractText.mockResolvedValue({
      success: true,
      data: {
        text: 'Extracted document text',
        confidence: 0.85,
      },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Extrahierter Text')).toBeInTheDocument();
    });

    const confirmButton = screen.getByText('Bestätigen und analysieren');
    fireEvent.click(confirmButton);

    expect(mockOnConfirm).toHaveBeenCalledWith('test-document-id');
  });

  it('calls onClose when cancel button is clicked', async () => {
    mockOnExtractText.mockResolvedValue({
      success: true,
      data: {
        text: 'Extracted document text',
        confidence: 0.85,
      },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Extrahierter Text')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText('Abbrechen');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });
});