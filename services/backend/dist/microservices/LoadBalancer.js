"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoadBalancer = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../utils/logger");
class LoadBalancer {
    constructor(registry, config) {
        this.registry = registry;
        this.config = {
            strategy: config?.strategy || 'round-robin',
            timeout: config?.timeout || 5000,
            retryAttempts: config?.retryAttempts || 3,
            circuitBreakerThreshold: config?.circuitBreakerThreshold || 5,
            circuitBreakerTimeout: config?.circuitBreakerTimeout || 60000
        };
        this.serviceStats = new Map();
        this.roundRobinIndex = new Map();
    }
    /**
     * Sendet eine Anfrage an einen verfügbaren Service
     */
    async sendRequest(serviceName, requestOptions) {
        // Prüfe Circuit Breaker
        if (this.isCircuitBreakerOpen(serviceName)) {
            throw new Error(`Circuit breaker is open for service ${serviceName}`);
        }
        // Hole einen gesunden Service
        const service = this.registry.getHealthyService(serviceName);
        if (!service) {
            throw new Error(`No healthy instances available for service ${serviceName}`);
        }
        // Aktualisiere Statistiken
        this.incrementConnections(serviceName);
        try {
            // Sende die Anfrage
            const response = await this.makeRequestWithRetry(service, requestOptions);
            // Zurücksetzen der Fehler bei erfolgreichem Request
            this.resetFailures(serviceName);
            return response;
        }
        catch (error) {
            // Aktualisiere Fehlerstatistiken
            this.incrementFailures(serviceName);
            // Öffne Circuit Breaker wenn nötig
            this.checkCircuitBreakerThreshold(serviceName);
            throw error;
        }
        finally {
            // Dekrementiere Verbindungsstatistik
            this.decrementConnections(serviceName);
        }
    }
    /**
     * Sendet eine Anfrage mit Retry-Logik
     */
    async makeRequestWithRetry(service, requestOptions) {
        let lastError = null;
        for (let attempt = 0; attempt <= this.config.retryAttempts; attempt++) {
            try {
                const config = {
                    ...requestOptions,
                    baseURL: `http://${service.host}:${service.port}`,
                    timeout: this.config.timeout
                };
                const response = await axios_1.default.request(config);
                return response;
            }
            catch (error) {
                lastError = error;
                // Bei letztem Versuch Fehler werfen
                if (attempt === this.config.retryAttempts) {
                    throw lastError;
                }
                // Exponentielles Backoff
                const delay = Math.pow(2, attempt) * 1000;
                await this.sleep(delay);
            }
        }
        throw lastError;
    }
    /**
     * Prüft ob der Circuit Breaker offen ist
     */
    isCircuitBreakerOpen(serviceName) {
        const stats = this.serviceStats.get(serviceName);
        if (!stats || !stats.circuitBreakerOpen) {
            return false;
        }
        // Prüfe ob Circuit Breaker Timeout erreicht ist
        if (stats.circuitBreakerOpenedAt &&
            (Date.now() - stats.circuitBreakerOpenedAt.getTime()) > this.config.circuitBreakerTimeout) {
            // Half-open state - erlaube einen Testrequest
            return false;
        }
        return true;
    }
    /**
     * Prüft ob der Circuit Breaker Threshold erreicht ist
     */
    checkCircuitBreakerThreshold(serviceName) {
        const stats = this.serviceStats.get(serviceName);
        if (!stats)
            return;
        if (stats.failures >= this.config.circuitBreakerThreshold) {
            stats.circuitBreakerOpen = true;
            stats.circuitBreakerOpenedAt = new Date();
            logger_1.logger.warn(`Circuit breaker opened for service ${serviceName}`);
        }
    }
    /**
     * Setzt die Fehlerstatistiken zurück
     */
    resetFailures(serviceName) {
        const stats = this.serviceStats.get(serviceName);
        if (stats) {
            stats.failures = 0;
            stats.lastFailure = null;
            stats.circuitBreakerOpen = false;
            stats.circuitBreakerOpenedAt = null;
        }
    }
    /**
     * Inkrementiert die Verbindungsstatistik
     */
    incrementConnections(serviceName) {
        if (!this.serviceStats.has(serviceName)) {
            this.serviceStats.set(serviceName, {
                connections: 0,
                failures: 0,
                lastFailure: null,
                circuitBreakerOpen: false,
                circuitBreakerOpenedAt: null
            });
        }
        const stats = this.serviceStats.get(serviceName);
        stats.connections++;
    }
    /**
     * Dekrementiert die Verbindungsstatistik
     */
    decrementConnections(serviceName) {
        const stats = this.serviceStats.get(serviceName);
        if (stats && stats.connections > 0) {
            stats.connections--;
        }
    }
    /**
     * Inkrementiert die Fehlerstatistik
     */
    incrementFailures(serviceName) {
        const stats = this.serviceStats.get(serviceName);
        if (stats) {
            stats.failures++;
            stats.lastFailure = new Date();
        }
        else {
            this.serviceStats.set(serviceName, {
                connections: 0,
                failures: 1,
                lastFailure: new Date(),
                circuitBreakerOpen: false,
                circuitBreakerOpenedAt: null
            });
        }
    }
    /**
     * Implementiert Round-Robin Load Balancing
     */
    getNextRoundRobinInstance(serviceName) {
        const currentIndex = this.roundRobinIndex.get(serviceName) || 0;
        const instances = this.registry.getAllInstances(serviceName);
        if (instances.length === 0) {
            return -1;
        }
        const nextIndex = (currentIndex + 1) % instances.length;
        this.roundRobinIndex.set(serviceName, nextIndex);
        return nextIndex;
    }
    /**
     * Implementiert Least Connections Load Balancing
     */
    getLeastConnectionsInstance(serviceName) {
        const instances = this.registry.getAllInstances(serviceName);
        if (instances.length === 0) {
            return -1;
        }
        let minConnections = Infinity;
        let selectedIndex = 0;
        instances.forEach((_, index) => {
            const stats = this.serviceStats.get(`${serviceName}-${index}`);
            const connections = stats ? stats.connections : 0;
            if (connections < minConnections) {
                minConnections = connections;
                selectedIndex = index;
            }
        });
        return selectedIndex;
    }
    /**
     * Holt Statistiken für einen Service
     */
    getServiceStats(serviceName) {
        return this.serviceStats.get(serviceName);
    }
    /**
     * Setzt alle Statistiken zurück
     */
    resetAllStats() {
        this.serviceStats.clear();
        this.roundRobinIndex.clear();
    }
    /**
     * Hilfsfunktion für Sleep
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.LoadBalancer = LoadBalancer;
