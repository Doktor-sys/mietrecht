import { logger } from './logger';

// Definiere spezifische Fehlerklassen für KI/ML-Prozesse
export class AIProcessingError extends Error {
  constructor(
    message: string,
    public readonly errorCode: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'AIProcessingError';
  }
}

export class ModelLoadingError extends AIProcessingError {
  constructor(modelName: string, details?: any) {
    super(`Fehler beim Laden des Modells: ${modelName}`, 'MODEL_LOADING_ERROR', details);
    this.name = 'ModelLoadingError';
  }
}

export class PredictionError extends AIProcessingError {
  constructor(modelName: string, details?: any) {
    super(`Fehler bei der Vorhersage des Modells: ${modelName}`, 'PREDICTION_ERROR', details);
    this.name = 'PredictionError';
  }
}

export class DataProcessingError extends AIProcessingError {
  constructor(details?: any) {
    super('Fehler bei der Datenverarbeitung', 'DATA_PROCESSING_ERROR', details);
    this.name = 'DataProcessingError';
  }
}

// Erweitertes Fehlerbehandlungssystem für KI/ML-Prozesse
export class AIErrorHandler {
  // Protokolliere KI/ML-Fehler mit zusätzlichen Kontextinformationen
  static logAIError(error: Error, context: {
    userId?: string;
    processType: string;
    modelName?: string;
    inputData?: any;
    timestamp: Date;
  }) {
    logger.error('KI/ML-Prozessfehler', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      context: {
        ...context,
        inputData: context.inputData ? '[REDACTED]' : undefined // Schütze sensible Daten
      }
    });
  }

  // Behandle KI/ML-Fehler und entscheide, ob sie behandelt werden können oder nicht
  static handleAIError(error: Error, context: {
    userId?: string;
    processType: string;
    modelName?: string;
    inputData?: any;
  }): { shouldRetry: boolean; retryDelay?: number; userMessage: string } {
    const timestamp = new Date();
    
    // Protokolliere den Fehler
    this.logAIError(error, { ...context, timestamp });
    
    // Standardmäßig keine Wiederholung
    let shouldRetry = false;
    let retryDelay = undefined;
    let userMessage = 'Ein Fehler ist bei der Verarbeitung aufgetreten.';
    
    // Behandle spezifische Fehlertypen
    if (error instanceof ModelLoadingError) {
      // Bei Modelllade-Fehlern kann eine Wiederholung sinnvoll sein
      shouldRetry = true;
      retryDelay = 5000; // 5 Sekunden
      userMessage = 'Das Modell wird momentan geladen. Bitte versuchen Sie es in Kürze erneut.';
    } else if (error instanceof PredictionError) {
      // Bei Vorhersagefehlern kann eine Wiederholung sinnvoll sein
      shouldRetry = true;
      retryDelay = 3000; // 3 Sekunden
      userMessage = 'Ein temporärer Fehler ist bei der Vorhersage aufgetreten. Bitte versuchen Sie es erneut.';
    } else if (error instanceof DataProcessingError) {
      // Bei Datenverarbeitungsfehlern ist eine Wiederholung in der Regel nicht sinnvoll
      shouldRetry = false;
      userMessage = 'Die Eingabedaten konnten nicht verarbeitet werden. Bitte überprüfen Sie Ihre Eingabe.';
    } else if (error instanceof AIProcessingError) {
      // Bei allgemeinen KI-Fehlern ist eine Wiederholung in der Regel nicht sinnvoll
      shouldRetry = false;
      userMessage = 'Ein Fehler ist bei der KI-Verarbeitung aufgetreten.';
    }
    
    // Benachrichtige Administratoren bei schwerwiegenden Fehlern
    if (!shouldRetry) {
      this.notifyAdmins(error, { ...context, timestamp });
    }
    
    return { shouldRetry, retryDelay, userMessage };
  }

  // Benachrichtige Administratoren über schwerwiegende Fehler
  static notifyAdmins(error: Error, context: {
    userId?: string;
    processType: string;
    modelName?: string;
    timestamp: Date;
  }) {
    // In einer Produktionsumgebung würden wir hier eine echte Benachrichtigung senden
    // z.B. per E-Mail, Slack oder einem anderen Benachrichtigungssystem
    logger.warn('Administrator-Benachrichtigung gesendet', {
      error: {
        name: error.name,
        message: error.message
      },
      context
    });
  }

  // Erstelle detaillierte Fehlerberichte für die Fehlersuche
  static generateErrorReport(error: Error, context: {
    userId?: string;
    processType: string;
    modelName?: string;
    inputData?: any;
    timestamp: Date;
  }): string {
    return `
KI/ML-Fehlerbericht
==================

Fehler:
  Typ: ${error.name}
  Nachricht: ${error.message}
  Zeitstempel: ${context.timestamp.toISOString()}

Kontext:
  Prozesstyp: ${context.processType}
  Modellname: ${context.modelName || 'Nicht angegeben'}
  Benutzer-ID: ${context.userId || 'Nicht angegeben'}

Zusätzliche Informationen:
  ${context.inputData ? 'Eingabedaten: [REDACTED]' : 'Keine Eingabedaten'}

Stacktrace:
${error.stack || 'Nicht verfügbar'}
    `.trim();
  }
}

export default AIErrorHandler;