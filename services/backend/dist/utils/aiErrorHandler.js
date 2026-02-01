"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIErrorHandler = exports.DataProcessingError = exports.PredictionError = exports.ModelLoadingError = exports.AIProcessingError = void 0;
const logger_1 = require("./logger");
// Definiere spezifische Fehlerklassen für KI/ML-Prozesse
class AIProcessingError extends Error {
    constructor(message, errorCode, details) {
        super(message);
        this.errorCode = errorCode;
        this.details = details;
        this.name = 'AIProcessingError';
    }
}
exports.AIProcessingError = AIProcessingError;
class ModelLoadingError extends AIProcessingError {
    constructor(modelName, details) {
        super(`Fehler beim Laden des Modells: ${modelName}`, 'MODEL_LOADING_ERROR', details);
        this.name = 'ModelLoadingError';
    }
}
exports.ModelLoadingError = ModelLoadingError;
class PredictionError extends AIProcessingError {
    constructor(modelName, details) {
        super(`Fehler bei der Vorhersage des Modells: ${modelName}`, 'PREDICTION_ERROR', details);
        this.name = 'PredictionError';
    }
}
exports.PredictionError = PredictionError;
class DataProcessingError extends AIProcessingError {
    constructor(details) {
        super('Fehler bei der Datenverarbeitung', 'DATA_PROCESSING_ERROR', details);
        this.name = 'DataProcessingError';
    }
}
exports.DataProcessingError = DataProcessingError;
// Erweitertes Fehlerbehandlungssystem für KI/ML-Prozesse
class AIErrorHandler {
    // Protokolliere KI/ML-Fehler mit zusätzlichen Kontextinformationen
    static logAIError(error, context) {
        logger_1.logger.error('KI/ML-Prozessfehler', {
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
    static handleAIError(error, context) {
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
        }
        else if (error instanceof PredictionError) {
            // Bei Vorhersagefehlern kann eine Wiederholung sinnvoll sein
            shouldRetry = true;
            retryDelay = 3000; // 3 Sekunden
            userMessage = 'Ein temporärer Fehler ist bei der Vorhersage aufgetreten. Bitte versuchen Sie es erneut.';
        }
        else if (error instanceof DataProcessingError) {
            // Bei Datenverarbeitungsfehlern ist eine Wiederholung in der Regel nicht sinnvoll
            shouldRetry = false;
            userMessage = 'Die Eingabedaten konnten nicht verarbeitet werden. Bitte überprüfen Sie Ihre Eingabe.';
        }
        else if (error instanceof AIProcessingError) {
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
    static notifyAdmins(error, context) {
        // In einer Produktionsumgebung würden wir hier eine echte Benachrichtigung senden
        // z.B. per E-Mail, Slack oder einem anderen Benachrichtigungssystem
        logger_1.logger.warn('Administrator-Benachrichtigung gesendet', {
            error: {
                name: error.name,
                message: error.message
            },
            context
        });
    }
    // Erstelle detaillierte Fehlerberichte für die Fehlersuche
    static generateErrorReport(error, context) {
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
exports.AIErrorHandler = AIErrorHandler;
exports.default = AIErrorHandler;
