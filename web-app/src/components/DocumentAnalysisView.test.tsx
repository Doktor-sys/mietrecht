import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';
import DocumentAnalysisView from './DocumentAnalysisView';

const theme = createTheme();

const mockDocument = {
  id: '1',
  name: 'Mietvertrag.pdf',
  type: 'RENTAL_CONTRACT',
  uploadDate: new Date(),
  status: 'completed',
  analysisResult: {
    documentType: 'RENTAL_CONTRACT',
    extractedData: {
      landlordName: 'Max Mustermann',
      tenantName: 'Erika Beispiel',
      rentAmount: 1200,
      startDate: '01.01.2023',
    },
    issues: [
      {
        type: 'invalid_clause',
        severity: 'critical' as const,
        description: 'Unwirksame Schönheitsreparaturklausel',
        legalBasis: 'BGH VIII ZR 185/14',
        suggestedAction: 'Klausel ist nicht bindend'
      },
      {
        type: 'warning',
        severity: 'warning' as const,
        description: 'Kurze Kündigungsfrist',
        legalBasis: '§ 573c BGB',
        suggestedAction: 'Gesetzliche Kündigungsfrist gilt'
      }
    ],
    recommendations: [
      {
        type: 'urgent_action',
        title: 'Rechtlichen Rat einholen',
        description: 'Kontaktieren Sie einen Fachanwalt für Mietrecht',
        priority: 'high' as const,
        actionRequired: true
      }
    ],
    riskLevel: 'high' as const,
    confidence: 0.85,
    analyzedAt: new Date()
  }
};

const renderComponent = () => {
  return render(
    <ThemeProvider theme={theme}>
      <I18nextProvider i18n={i18n}>
        <DocumentAnalysisView document={mockDocument} />
      </I18nextProvider>
    </ThemeProvider>
  );
};

describe('DocumentAnalysisView', () => {
  it('renders document information correctly', () => {
    renderComponent();
    
    expect(screen.getByText('Mietvertrag.pdf')).toBeInTheDocument();
    expect(screen.getByText('Mietvertrag')).toBeInTheDocument();
    expect(screen.getByText('Hoch')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('displays extracted data', () => {
    renderComponent();
    
    expect(screen.getByText('Extrahierte Daten (4)')).toBeInTheDocument();
    expect(screen.getByText('landlordName')).toBeInTheDocument();
    expect(screen.getByText('Max Mustermann')).toBeInTheDocument();
    expect(screen.getByText('rentAmount')).toBeInTheDocument();
    expect(screen.getByText('1200')).toBeInTheDocument();
  });

  it('displays issues with proper severity indicators', () => {
    renderComponent();
    
    expect(screen.getByText('Gefundene Probleme (2)')).toBeInTheDocument();
    expect(screen.getByText('Unwirksame Schönheitsreparaturklausel')).toBeInTheDocument();
    expect(screen.getByText('Kritisch')).toBeInTheDocument();
    expect(screen.getByText('Kurze Kündigungsfrist')).toBeInTheDocument();
    expect(screen.getByText('Warnung')).toBeInTheDocument();
  });

  it('displays recommendations with priority indicators', () => {
    renderComponent();
    
    expect(screen.getByText('Empfehlungen (1)')).toBeInTheDocument();
    expect(screen.getByText('Rechtlichen Rat einholen')).toBeInTheDocument();
    expect(screen.getByText('Hoch')).toBeInTheDocument();
    expect(screen.getByText('Handlungsbedarf')).toBeInTheDocument();
  });

  it('shows summary statistics', () => {
    renderComponent();
    
    expect(screen.getByText('Zusammenfassung')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); // Critical issues
    expect(screen.getByText('1')).toBeInTheDocument(); // Warnings
    expect(screen.getByText('1')).toBeInTheDocument(); // Recommendations
  });

  it('handles document without analysis result', () => {
    const documentWithoutAnalysis = {
      ...mockDocument,
      analysisResult: undefined
    };
    
    render(
      <ThemeProvider theme={theme}>
        <I18nextProvider i18n={i18n}>
          <DocumentAnalysisView document={documentWithoutAnalysis} />
        </I18nextProvider>
      </ThemeProvider>
    );
    
    expect(screen.getByText('Keine Analyse verfügbar')).toBeInTheDocument();
  });
});