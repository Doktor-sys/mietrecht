// Type definitions for i18n translations

export interface TranslationResources {
  app: {
    title: string;
    description: string;
  };
  nav: {
    home: string;
    chat: string;
    documents: string;
    lawyers: string;
    profile: string;
    login: string;
    register: string;
    logout: string;
    language: string;
    accessibility: string;
  };
  auth: {
    email: string;
    password: string;
    login: string;
    register: string;
    loginTitle: string;
    registerTitle: string;
    userType: string;
    tenant: string;
    landlord: string;
    business: string;
  };
  chat: {
    title: string;
    placeholder: string;
    send: string;
    typing: string;
    user: string;
    assistant: string;
    legalReferences: string;
    newConversation: string;
    attachFile: string;
    uploadDocument: string;
    dragDropFile: string;
    orClickToSelect: string;
    supportedFormats: string;
    documentType: string;
    upload: string;
    uploading: string;
    fileUploaded: string;
    connecting: string;
    welcome: string;
    welcomeHint: string;
    documentTypes: {
      rentalContract: string;
      utilityBill: string;
      warningLetter: string;
      termination: string;
      other: string;
    };
    error: {
      notAuthenticated: string;
      connection: string;
      sendFailed: string;
      uploadFailed: string;
      fileTooLarge: string;
      invalidFileType: string;
    };
  };
  documents: {
    title: string;
    upload: string;
    uploadDocument: string;
    uploadFirst: string;
    uploadHint: string;
    analyze: string;
    noDocuments: string;
    view: string;
    viewHistory: string;
    viewAnnotations: string;
    viewWorkflow: string;
    download: string;
    delete: string;
    confirmDelete: string;
    dragDropFile: string;
    orClickToSelect: string;
    supportedFormats: string;
    documentType: string;
    uploading: string;
    analysisResults: string;
    noAnalysis: string;
    selectedFiles: string;
    selectedFilesList: string;
    ocrPreview: {
      title: string;
      extracting: string;
      extractedText: string;
      confidence: string;
      instructions: string;
      confirmAndAnalyze: string;
    };
    versionHistory: {
      title: string;
      version: string;
      current: string;
      noVersions: string;
    };
    sharing: {
      title: string;
      shareWith: string;
      email: string;
      emailHelper: string;
      permission: string;
      expiresAt: string;
      shareButton: string;
      sharedWith: string;
      noShares: string;
      remove: string;
      permissions: {
        read: string;
        write: string;
        comment: string;
      };
      success: {
        shared: string;
        removed: string;
      };
      error: {
        loadFailed: string;
        shareFailed: string;
        removeFailed: string;
        emailRequired: string;
      };
    };
    annotations: {
      title: string;
      addAnnotation: string;
      replyToAnnotation: string;
      replyingTo: string;
      textPlaceholder: string;
      type: string;
      addButton: string;
      reply: string;
      resolve: string;
      delete: string;
      resolved: string;
      noAnnotations: string;
      types: {
        comment: string;
        highlight: string;
        strikethrough: string;
        underline: string;
        note: string;
      };
      success: {
        created: string;
        updated: string;
        deleted: string;
        resolved: string;
      };
      error: {
        loadFailed: string;
        createFailed: string;
        updateFailed: string;
        deleteFailed: string;
        resolveFailed: string;
      };
    };
    types: {
      rentalContract: string;
      utilityBill: string;
      warningLetter: string;
      termination: string;
      other: string;
    };
    status: {
      draft: string;
      review: string;
      approved: string;
      archived: string;
      rejected: string;
      uploading: string;
      analyzing: string;
      completed: string;
      statusError: string;
    };
    workflow: string;
    analysis: {
      riskLevel: string;
      risk: {
        low: string;
        medium: string;
        high: string;
      };
      confidence: string;
      analyzedAt: string;
      extractedData: string;
      issues: string;
      recommendations: string;
      legalBasis: string;
      suggestedAction: string;
      noIssues: string;
      severity: {
        info: string;
        warning: string;
        critical: string;
      };
      priority: {
        low: string;
        medium: string;
        high: string;
      };
      actionRequired: string;
      copyToClipboard: string;
      copied: string;
      summary: string;
      criticalIssues: string;
      warnings: string;
    };
    error: {
      loadFailed: string;
      uploadFailed: string;
      downloadFailed: string;
      deleteFailed: string;
      fileTooLarge: string;
      invalidFileType: string;
      extractFailed: string;
      analysisFailed: string;
    };
  };
  lawyers: {
    title: string;
    subtitle: string;
    search: string;
    location: string;
    locationPlaceholder: string;
    specialization: string;
    allSpecializations: string;
    book: string;
    viewProfile: string;
    hourlyRate: string;
    reviews: string;
    resultsCount: string;
    noResults: string;
    noResultsHint: string;
    allLawyers: string;
    viewMode: string;
    listView: string;
    mapView: string;
    toggleFilters: string;
    specializations: {
      title: string;
      rentLaw: string;
      tenantProtection: string;
      landlordLaw: string;
      realEstate: string;
    };
    filters: {
      maxDistance: string;
      minRating: string;
      maxHourlyRate: string;
      languages: string;
    };
    details: {
      contact: string;
      about: string;
      languages: string;
      pricing: string;
      pricingNote: string;
      reviews: string;
    };
    booking: {
      title: string;
      selectDateTime: string;
      selectDate: string;
      selectTime: string;
      consultationType: string;
      selectConsultationType: string;
      confirmation: string;
      confirmBooking: string;
      lawyer: string;
      dateTime: string;
      type: string;
      notes: string;
      notesPlaceholder: string;
      estimatedCost: string;
      confirmAndBook: string;
      booking: string;
      success: string;
      types: {
        video: string;
        phone: string;
        inPerson: string;
      };
      error: {
        selectDateTime: string;
        selectType: string;
        bookingFailed: string;
      };
    };
    map: {
      placeholder: string;
      placeholderHint: string;
      selectLawyer: string;
    };
    error: {
      searchFailed: string;
      loadFailed: string;
    };
  };
  accessibility: {
    settings: string;
    fontSize: string;
    highContrast: string;
    highContrastDesc: string;
    screenReaderMode: string;
    screenReaderModeDesc: string;
    reset: string;
  };
  common: {
    loading: string;
    error: string;
    save: string;
    cancel: string;
    close: string;
    next: string;
    back: string;
    submit: string;
    delete: string;
    edit: string;
    confirm: string;
    yes: string;
    no: string;
  };
}

export type SupportedLanguage = 'de' | 'tr' | 'ar' | 'es' | 'fr' | 'it';

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['de', 'tr', 'ar', 'es', 'fr', 'it'];

export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  de: 'Deutsch',
  tr: 'Türkçe',
  ar: 'العربية',
  es: 'Español',
  fr: 'Français',
  it: 'Italiano',
};