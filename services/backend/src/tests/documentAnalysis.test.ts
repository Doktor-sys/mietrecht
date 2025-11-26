filename: 'contract.pdf',
  mimeType: 'application/pdf',
    size: 1000,
      storageKey: 'key-1',
        createdAt: new Date(),
          updatedAt: new Date()
      };

const mockExtractedData = {
  landlordName: 'Max Mustermann',
  tenantName: 'Erika Musterfrau',
  address: 'Musterstraße 1, 12345 Berlin',
  rentAmount: 1500,
  squareMeters: 50,
  deposit: 3000
};

jest.spyOn(prisma.document, 'findUnique').mockResolvedValue(mockDocument as any);
jest.spyOn(OCRService, 'extractRentalContractData').mockReturnValue(mockExtractedData);
jest.spyOn(prisma.documentAnalysis, 'create').mockResolvedValue({} as any);

const analysis = await service.analyzeDocument('doc-1');

expect(analysis.documentType).toBe('RENTAL_CONTRACT');
expect(analysis.issues.length).toBeGreaterThan(0);

const rentIssue = analysis.issues.find((i: any) => i.type === 'excessive_rent');
expect(rentIssue).toBeDefined();
expect(rentIssue?.severity).toBe('warning');
    });

it('should detect excessive deposit', async () => {
  const mockDocument = {
    id: 'doc-2',
    userId: 'user-1',
    type: 'RENTAL_CONTRACT' as DocumentType,
    filename: 'contract.pdf',
    mimeType: 'application/pdf',
    size: 1000,
    storageKey: 'key-2',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockExtractedData = {
    landlordName: 'Max Mustermann',
    tenantName: 'Erika Musterfrau',
    rentAmount: 1000,
    deposit: 4000 // More than 3x rent
  };

  jest.spyOn(prisma.document, 'findUnique').mockResolvedValue(mockDocument as any);
  jest.spyOn(OCRService, 'extractRentalContractData').mockReturnValue(mockExtractedData);
  jest.spyOn(prisma.documentAnalysis, 'create').mockResolvedValue({} as any);

  const analysis = await service.analyzeDocument('doc-2');

  const depositIssue = analysis.issues.find((i: any) => i.type === 'excessive_deposit');
  expect(depositIssue).toBeDefined();
  expect(depositIssue?.legalBasis).toBe('§ 551 BGB');
});

it('should detect missing mandatory fields', async () => {
  const mockDocument = {
    id: 'doc-3',
    userId: 'user-1',
    type: 'RENTAL_CONTRACT' as DocumentType,
    filename: 'contract.pdf',
    mimeType: 'application/pdf',
    size: 1000,
    storageKey: 'key-3',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockExtractedData = {
    landlordName: 'Max Mustermann'
    // Missing other mandatory fields
  };

  jest.spyOn(prisma.document, 'findUnique').mockResolvedValue(mockDocument as any);
  jest.spyOn(OCRService, 'extractRentalContractData').mockReturnValue(mockExtractedData);
  jest.spyOn(prisma.documentAnalysis, 'create').mockResolvedValue({} as any);

  const analysis = await service.analyzeDocument('doc-3');

  const missingFieldsIssue = analysis.issues.find((i: any) => i.type === 'missing_information');
  expect(missingFieldsIssue).toBeDefined();
});
  });

describe('analyzeUtilityBill', () => {
  it('should detect non-deductible costs', async () => {
    const mockDocument = {
      id: 'doc-4',
      userId: 'user-1',
      type: 'UTILITY_BILL' as DocumentType,
      filename: 'bill.pdf',
      mimeType: 'application/pdf',
      size: 1000,
      storageKey: 'key-4',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const mockText = `
        Nebenkostenabrechnung 2023
        Verwaltungskosten: 200€
        Heizkosten: 500€
        Instandhaltung: 300€
      `;

    jest.spyOn(prisma.document, 'findUnique').mockResolvedValue(mockDocument as any);
    jest.spyOn(OCRService, 'extractUtilityBillData').mockReturnValue({
      totalAmount: 1000
    });
    jest.spyOn(prisma.documentAnalysis, 'create').mockResolvedValue({} as any);

    const analysis = await service.analyzeDocument('doc-4');

    const nonDeductibleIssues = analysis.issues.filter((i: any) => i.type === 'non_deductible_cost');
    expect(nonDeductibleIssues.length).toBeGreaterThan(0);
  });

  it('should detect invalid billing period', async () => {
    const mockDocument = {
      id: 'doc-5',
      userId: 'user-1',
      type: 'UTILITY_BILL' as DocumentType,
      filename: 'bill.pdf',
      mimeType: 'application/pdf',
      size: 1000,
      storageKey: 'key-5',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const mockExtractedData = {
      billingPeriodStart: '01.01.2023',
      billingPeriodEnd: '01.06.2023', // Only 6 months instead of 12
      totalAmount: 500
    };

    jest.spyOn(prisma.document, 'findUnique').mockResolvedValue(mockDocument as any);
    jest.spyOn(OCRService, 'extractUtilityBillData').mockReturnValue(mockExtractedData);
    jest.spyOn(prisma.documentAnalysis, 'create').mockResolvedValue({} as any);

    const analysis = await service.analyzeDocument('doc-5');

    const periodIssue = analysis.issues.find((i: any) => i.type === 'invalid_billing_period');
    expect(periodIssue).toBeDefined();
  });
});

describe('analyzeWarningLetter', () => {
  it('should detect termination threat', async () => {
    const mockDocument = {
      id: 'doc-6',
      userId: 'user-1',
      type: 'WARNING_LETTER' as DocumentType,
      filename: 'warning.pdf',
      mimeType: 'application/pdf',
      size: 1000,
      storageKey: 'key-6',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const mockExtractedData = {
      date: '01.01.2024',
      deadline: '15.01.2024',
      containsTerminationThreat: true,
      containsLegalThreat: false
    };

    jest.spyOn(prisma.document, 'findUnique').mockResolvedValue(mockDocument as any);
    jest.spyOn(OCRService, 'extractWarningLetterData').mockReturnValue(mockExtractedData);
    jest.spyOn(prisma.documentAnalysis, 'create').mockResolvedValue({} as any);

    const analysis = await service.analyzeDocument('doc-6');

    expect(analysis.riskLevel).toBe('high');

    const terminationIssue = analysis.issues.find((i: any) => i.type === 'termination_threat');
    expect(terminationIssue).toBeDefined();
    expect(terminationIssue?.severity).toBe('critical');
  });

  it('should detect urgent deadline', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const deadlineStr = `${tomorrow.getDate().toString().padStart(2, '0')}.${(tomorrow.getMonth() + 1).toString().padStart(2, '0')}.${tomorrow.getFullYear()}`;

    const mockDocument = {
      id: 'doc-7',
      userId: 'user-1',
      type: 'WARNING_LETTER' as DocumentType,
      filename: 'warning.pdf',
      mimeType: 'application/pdf',
      size: 1000,
      storageKey: 'key-7',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const mockExtractedData = {
      date: '01.01.2024',
      deadline: deadlineStr,
      containsTerminationThreat: false,
      containsLegalThreat: false
    };

    jest.spyOn(prisma.document, 'findUnique').mockResolvedValue(mockDocument as any);
    jest.spyOn(OCRService, 'extractWarningLetterData').mockReturnValue(mockExtractedData);
    jest.spyOn(prisma.documentAnalysis, 'create').mockResolvedValue({} as any);

    const analysis = await service.analyzeDocument('doc-7');

    const urgentIssue = analysis.issues.find((i: any) => i.type === 'urgent_deadline');
    expect(urgentIssue).toBeDefined();
  });
});

describe('getAnalysis', () => {
  it('should retrieve saved analysis', async () => {
    const mockAnalysis = {
      id: 'analysis-1',
      documentId: 'doc-1',
      documentType: 'RENTAL_CONTRACT' as DocumentType,
      extractedData: { rentAmount: 1000 },
      issues: [],
      recommendations: [],
      riskLevel: 'low',
      confidence: 0.9,
      analyzedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    jest.spyOn(prisma.documentAnalysis, 'findUnique').mockResolvedValue(mockAnalysis as any);

    const analysis = await service.getAnalysis('doc-1');

    expect(analysis).toBeDefined();
    expect(analysis?.documentId).toBe('doc-1');
    expect(analysis?.riskLevel).toBe('low');
  });

  it('should return null for non-existent analysis', async () => {
    jest.spyOn(prisma.documentAnalysis, 'findUnique').mockResolvedValue(null);

    const analysis = await service.getAnalysis('non-existent');

    expect(analysis).toBeNull();
  });
});

describe('getUserAnalyses', () => {
  it('should retrieve all user analyses', async () => {
    const mockDocuments = [
      {
        id: 'doc-1',
        userId: 'user-1',
        type: 'RENTAL_CONTRACT' as DocumentType,
        filename: 'contract.pdf',
        mimeType: 'application/pdf',
        size: 1000,
        storageKey: 'key-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        analysis: {
          id: 'analysis-1',
          documentId: 'doc-1',
          documentType: 'RENTAL_CONTRACT' as DocumentType,
          extractedData: {},
          issues: [],
          recommendations: [],
          riskLevel: 'low',
          confidence: 0.9,
          analyzedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      }
    ];

    jest.spyOn(prisma.document, 'findMany').mockResolvedValue(mockDocuments as any);

    const analyses = await service.getUserAnalyses('user-1');

    expect(analyses).toHaveLength(1);
    expect(analyses[0].documentId).toBe('doc-1');
  });
});
});
