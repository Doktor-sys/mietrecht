/**
 * Simplified OCR Service Tests
 * 
 * Diese Tests validieren die Datenextraktion und Text-Preprocessing
 * ohne externe OCR-Dependencies zu benötigen.
 */

import OCRService from '../services/OCRService';

describe('OCRService - Data Extraction', () => {
  describe('extractRentalContractData', () => {
    it('should extract complete rental contract data', () => {
      const text = `
        MIETVERTRAG
        
        Vermieter: Max Mustermann
        Mieter: Anna Schmidt
        Mietobjekt: Musterstraße 123, 12345 Berlin
        Grundmiete: 850,00 EUR
        Nebenkosten: 150,00 EUR
        Kaution: 2550,00 EUR
        Wohnfläche: 65 m²
        Zimmer: 2,5
        Mietbeginn: 01.01.2024
      `;

      const result = OCRService.extractRentalContractData(text);

      expect(result.landlordName).toBe('Max Mustermann');
      expect(result.tenantName).toBe('Anna Schmidt');
      expect(result.address).toBe('Musterstraße 123, 12345 Berlin');
      expect(result.rentAmount).toBe(850.00);
      expect(result.additionalCosts).toBe(150.00);
      expect(result.deposit).toBe(2550.00);
      expect(result.squareMeters).toBe(65);
      expect(result.roomCount).toBe(2.5);
      expect(result.startDate).toBe('01.01.2024');
    });

    it('should handle missing fields gracefully', () => {
      const text = 'Mietvertrag ohne Details';
      const result = OCRService.extractRentalContractData(text);

      expect(result).toBeDefined();
      expect(Object.keys(result).length).toBe(0);
    });

    it('should extract rent with different formats', () => {
      const text1 = 'Kaltmiete: 1.250,50 EUR';
      const text2 = 'Nettomiete: 999,99 EUR';
      
      expect(OCRService.extractRentalContractData(text1).rentAmount).toBe(1250.50);
      expect(OCRService.extractRentalContractData(text2).rentAmount).toBe(999.99);
    });

    it('should extract square meters in different formats', () => {
      const text1 = 'Wohnfläche: 75,5 m²';
      const text2 = 'Größe: 80 qm';
      const text3 = '90 Quadratmeter';

      expect(OCRService.extractRentalContractData(text1).squareMeters).toBe(75.5);
      expect(OCRService.extractRentalContractData(text2).squareMeters).toBe(80);
      expect(OCRService.extractRentalContractData(text3).squareMeters).toBe(90);
    });

    it('should extract room count with decimal', () => {
      const text = 'Zimmer: 3,5';
      const result = OCRService.extractRentalContractData(text);
      
      expect(result.roomCount).toBe(3.5);
    });

    it('should extract deposit amount', () => {
      const text1 = 'Kaution: 2.400,00 EUR';
      const text2 = 'Sicherheit: 1.800,50 EUR';
      
      expect(OCRService.extractRentalContractData(text1).deposit).toBe(2400.00);
      expect(OCRService.extractRentalContractData(text2).deposit).toBe(1800.50);
    });
  });

  describe('preprocessGermanLegalText', () => {
    it('should clean excessive whitespace', () => {
      const text = 'Dies   ist    ein\n\n\nTest   Text';
      const result = OCRService.preprocessGermanLegalText(text);

      expect(result.cleanedText).toBe('Dies ist ein Test Text');
    });

    it('should normalize German umlauts', () => {
      const text = 'Mäßige Größe für Übungen';
      const result = OCRService.preprocessGermanLegalText(text);

      expect(result.normalizedText).toContain('Maessige');
      expect(result.normalizedText).toContain('Groesse');
      expect(result.normalizedText).toContain('Uebungen');
    });

    it('should normalize ß to ss', () => {
      const text = 'Straße und Maßnahme';
      const result = OCRService.preprocessGermanLegalText(text);

      expect(result.normalizedText).toContain('Strasse');
      expect(result.normalizedText).toContain('Massnahme');
    });

    it('should split text into paragraphs', () => {
      const text = 'Paragraph 1\n\nParagraph 2\n\nParagraph 3';
      const result = OCRService.preprocessGermanLegalText(text);

      expect(result.paragraphs).toHaveLength(3);
      expect(result.paragraphs[0]).toBe('Paragraph 1');
      expect(result.paragraphs[1]).toBe('Paragraph 2');
      expect(result.paragraphs[2]).toBe('Paragraph 3');
    });

    it('should split text into sentences', () => {
      const text = 'Satz eins. Satz zwei! Satz drei?';
      const result = OCRService.preprocessGermanLegalText(text);

      expect(result.sentences).toHaveLength(3);
      expect(result.sentences[0]).toBe('Satz eins');
      expect(result.sentences[1]).toBe('Satz zwei');
      expect(result.sentences[2]).toBe('Satz drei');
    });

    it('should preserve original text', () => {
      const text = 'Original Text mit Umlauten: äöü';
      const result = OCRService.preprocessGermanLegalText(text);

      expect(result.originalText).toBe(text);
    });

    it('should handle empty paragraphs', () => {
      const text = 'Text 1\n\n\n\nText 2';
      const result = OCRService.preprocessGermanLegalText(text);

      expect(result.paragraphs).toHaveLength(2);
    });
  });

  describe('extractUtilityBillData', () => {
    it('should extract complete utility bill data', () => {
      const text = `
        Nebenkostenabrechnung
        Abrechnungszeitraum: 01.01.2023 - 31.12.2023
        Gesamtbetrag: 1.234,56 EUR
        Heizkosten: 800,00 EUR
        Wasserkosten: 250,00 EUR
      `;

      const result = OCRService.extractUtilityBillData(text);

      expect(result.billingPeriodStart).toBe('01.01.2023');
      expect(result.billingPeriodEnd).toBe('31.12.2023');
      expect(result.totalAmount).toBe(1234.56);
      expect(result.heatingCosts).toBe(800.00);
      expect(result.waterCosts).toBe(250.00);
    });

    it('should handle missing fields', () => {
      const text = 'Nebenkostenabrechnung ohne Details';
      const result = OCRService.extractUtilityBillData(text);

      expect(result).toBeDefined();
      expect(Object.keys(result).length).toBe(0);
    });

    it('should extract refund amounts', () => {
      const text = 'Guthaben: 150,00 EUR';
      const result = OCRService.extractUtilityBillData(text);

      expect(result.totalAmount).toBe(150.00);
    });

    it('should extract additional payment', () => {
      const text = 'Nachzahlung: 75,50 EUR';
      const result = OCRService.extractUtilityBillData(text);

      expect(result.totalAmount).toBe(75.50);
    });

    it('should extract billing period with different separators', () => {
      const text1 = 'Zeitraum: 01.01.2023 - 31.12.2023';
      const text2 = 'Abrechnungszeitraum: 01.06.2023 – 31.05.2024';
      
      const result1 = OCRService.extractUtilityBillData(text1);
      const result2 = OCRService.extractUtilityBillData(text2);

      expect(result1.billingPeriodStart).toBe('01.01.2023');
      expect(result1.billingPeriodEnd).toBe('31.12.2023');
      expect(result2.billingPeriodStart).toBe('01.06.2023');
      expect(result2.billingPeriodEnd).toBe('31.05.2024');
    });
  });

  describe('extractWarningLetterData', () => {
    it('should extract complete warning letter data', () => {
      const text = `
        Berlin, 15.03.2024
        
        Abmahnung
        
        Sehr geehrter Herr Schmidt,
        
        hiermit mahnen wir Sie ab. Bitte zahlen Sie bis zum 31.03.2024.
        Andernfalls droht die Kündigung des Mietverhältnisses.
      `;

      const result = OCRService.extractWarningLetterData(text);

      expect(result.date).toBe('15.03.2024');
      expect(result.deadline).toBe('31.03.2024');
      expect(result.containsTerminationThreat).toBe(true);
      expect(result.containsLegalThreat).toBe(false);
    });

    it('should detect legal action threats', () => {
      const text1 = 'Wir werden rechtliche Schritte einleiten.';
      const text2 = 'Wir werden Klage erheben.';
      const text3 = 'Die Angelegenheit wird dem Gericht vorgelegt.';

      expect(OCRService.extractWarningLetterData(text1).containsLegalThreat).toBe(true);
      expect(OCRService.extractWarningLetterData(text2).containsLegalThreat).toBe(true);
      expect(OCRService.extractWarningLetterData(text3).containsLegalThreat).toBe(true);
    });

    it('should detect termination threats', () => {
      const text1 = 'Bei Nichtzahlung erfolgt die fristlose Kündigung.';
      const text2 = 'Wir werden das Mietverhältnis kündigen.';
      
      expect(OCRService.extractWarningLetterData(text1).containsTerminationThreat).toBe(true);
      expect(OCRService.extractWarningLetterData(text2).containsTerminationThreat).toBe(true);
    });

    it('should handle letters without threats', () => {
      const text = 'Freundliche Erinnerung an die Mietzahlung.';
      const result = OCRService.extractWarningLetterData(text);

      expect(result.containsTerminationThreat).toBe(false);
      expect(result.containsLegalThreat).toBe(false);
    });

    it('should extract deadline with different wording', () => {
      const text1 = 'Frist: 15.04.2024';
      const text2 = 'bis zum 20.05.2024';
      
      expect(OCRService.extractWarningLetterData(text1).deadline).toBe('15.04.2024');
      expect(OCRService.extractWarningLetterData(text2).deadline).toBe('20.05.2024');
    });
  });

  describe('Complex Document Extraction', () => {
    it('should extract data from complex rental contract', () => {
      const complexContract = `
        MIETVERTRAG
        
        zwischen
        
        Vermieter: Immobilien GmbH, vertreten durch Herrn Dr. Müller
        Mieter: Frau Maria Schneider
        
        wird folgender Mietvertrag geschlossen:
        
        § 1 Mietobjekt
        Mietobjekt: Wohnung im 3. OG, Hauptstraße 45, 10115 Berlin
        Wohnfläche: 78,5 m²
        Zimmer: 3
        
        § 2 Miete und Nebenkosten
        Nettomiete: 1.200,00 EUR
        Betriebskosten: 180,00 EUR
        Gesamtmiete: 1.380,00 EUR
        
        § 3 Kaution
        Kaution: 3.600,00 EUR
        
        § 4 Mietzeit
        Mietbeginn: 01.04.2024
      `;

      const result = OCRService.extractRentalContractData(complexContract);

      expect(result.landlordName).toContain('Immobilien GmbH');
      expect(result.tenantName).toContain('Maria Schneider');
      expect(result.address).toContain('Hauptstraße 45');
      expect(result.squareMeters).toBe(78.5);
      expect(result.roomCount).toBe(3);
      expect(result.rentAmount).toBe(1200.00);
      expect(result.additionalCosts).toBe(180.00);
      expect(result.deposit).toBe(3600.00);
      expect(result.startDate).toBe('01.04.2024');
    });

    it('should handle German legal terminology', () => {
      const legalText = `
        § 536 BGB - Mietminderung bei Sach- und Rechtsmängeln
        § 573 BGB - Ordentliche Kündigung des Vermieters
        § 543 BGB - Fristlose Kündigung aus wichtigem Grund
      `;

      const result = OCRService.preprocessGermanLegalText(legalText);

      expect(result.cleanedText).toContain('§ 536 BGB');
      expect(result.cleanedText).toContain('§ 573 BGB');
      expect(result.cleanedText).toContain('§ 543 BGB');
      expect(result.cleanedText).toContain('Mietminderung');
      expect(result.cleanedText).toContain('Kündigung');
    });
  });
});
