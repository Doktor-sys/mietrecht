"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoadBalancer = void 0;
const logger_1 = require("../utils/logger");
class LoadBalancer {
    constructor(config) {
        this.servers = new Map();
        this.currentIndex = 0;
        this.requestMetrics = [];
        this.healthCheckTimer = null;
        this.config = {
            strategy: config?.strategy || 'round-robin',
            healthCheckInterval: config?.healthCheckInterval || 30000, // 30 Sekunden
            failoverTimeout: config?.failoverTimeout || 5000, // 5 Sekunden
            maxRetries: config?.maxRetries || 3
        };
        this.startHealthChecks();
    }
    static getInstance(config) {
        if (!LoadBalancer.instance) {
            LoadBalancer.instance = new LoadBalancer(config);
        }
        return LoadBalancer.instance;
    }
    /**
     * Fügt eine Server-Instanz hinzu
     */
    addServer(server) {
        const serverInstance = {
            ...server,
            isHealthy: true,
            lastHealthCheck: new Date(),
            responseTime: 0,
            currentLoad: 0
        };
        this.servers.set(server.id, serverInstance);
        logger_1.logger.info(`Added server to load balancer: ${server.id} (${server.host}:${server.port})`);
    }
    /**
     * Entfernt eine Server-Instanz
     */
    removeServer(serverId) {
        this.servers.delete(serverId);
        logger_1.logger.info(`Removed server from load balancer: ${serverId}`);
    }
    /**
     * Wählt einen Server basierend auf der Load-Balancing-Strategie
     */
    selectServer() {
        const healthyServers = Array.from(this.servers.values()).filter(server => server.isHealthy);
        if (healthyServers.length === 0) {
            logger_1.logger.warn('No healthy servers available');
            return null;
        }
        switch (this.config.strategy) {
            case 'round-robin':
                return this.selectRoundRobin(healthyServers);
            case 'weighted':
                return this.selectWeighted(healthyServers);
            case 'least-connections':
                return this.selectLeastConnections(healthyServers);
            case 'response-time':
                return this.selectByResponseTime(healthyServers);
            default:
                return this.selectRoundRobin(healthyServers);
        }
    }
    /**
     * Wählt einen Server mittels Round-Robin
     */
    selectRoundRobin(servers) {
        const server = servers[this.currentIndex % servers.length];
        this.currentIndex = (this.currentIndex + 1) % servers.length;
        return server;
    }
    /**
     * Wählt einen Server basierend auf Gewichtung
     */
    selectWeighted(servers) {
        // Berechne die Gesamtgewichtung
        const totalWeight = servers.reduce((sum, server) => sum + server.weight, 0);
        // Wähle einen zufälligen Wert basierend auf der Gesamtgewichtung
        let random = Math.random() * totalWeight;
        // Finde den Server, der dem zufälligen Wert entspricht
        for (const server of servers) {
            random -= server.weight;
            if (random <= 0) {
                return server;
            }
        }
        // Fallback auf den ersten Server
        return servers[0];
    }
    /**
     * Wählt den Server mit den wenigsten Verbindungen
     */
    selectLeastConnections(servers) {
        return servers.reduce((min, server) => server.currentLoad < min.currentLoad ? server : min);
    }
    /**
     * Wählt den Server mit der besten Antwortzeit
     */
    selectByResponseTime(servers) {
        return servers.reduce((min, server) => server.responseTime < min.responseTime ? server : min);
    }
    /**
     * Aktualisiert die Metriken für einen Server
     */
    updateServerMetrics(serverId, responseTime, success) {
        const server = this.servers.get(serverId);
        if (server) {
            server.responseTime = responseTime;
            server.lastHealthCheck = new Date();
            // Aktualisiere die Request-Metriken
            this.requestMetrics.push({
                serverId,
                responseTime,
                timestamp: new Date(),
                success
            });
            // Begrenze die Anzahl der gespeicherten Metriken
            if (this.requestMetrics.length > 10000) {
                this.requestMetrics.shift();
            }
        }
    }
    /**
     * Aktualisiert die aktuelle Last eines Servers
     */
    updateServerLoad(serverId, currentLoad) {
        const server = this.servers.get(serverId);
        if (server) {
            server.currentLoad = currentLoad;
        }
    }
    /**
     * Führt periodische Gesundheitschecks durch
     */
    startHealthChecks() {
        this.healthCheckTimer = setInterval(() => {
            this.performHealthChecks();
        }, this.config.healthCheckInterval);
    }
    /**
     * Führt Gesundheitschecks für alle Server durch
     */
    async performHealthChecks() {
        for (const [serverId, server] of this.servers) {
            try {
                const isHealthy = await this.checkServerHealth(server);
                server.isHealthy = isHealthy;
                server.lastHealthCheck = new Date();
                if (isHealthy) {
                    logger_1.logger.debug(`Server ${serverId} is healthy`);
                }
                else {
                    logger_1.logger.warn(`Server ${serverId} is unhealthy`);
                }
            }
            catch (error) {
                logger_1.logger.error(`Health check failed for server ${serverId}`, { error });
                server.isHealthy = false;
                server.lastHealthCheck = new Date();
            }
        }
    }
    /**
     * Prüft die Gesundheit eines Servers
     */
    async checkServerHealth(server) {
        // In einer echten Implementierung würden wir hier eine HTTP-Anfrage
        // an den Server senden, um seine Gesundheit zu prüfen
        // Für dieses Beispiel simulieren wir eine erfolgreiche Gesundheitsprüfung
        return true;
    }
    /**
     * Holt den Gesundheitsstatus aller Server
     */
    getServerHealth() {
        return Array.from(this.servers.values()).map(server => ({
            id: server.id,
            isHealthy: server.isHealthy,
            responseTime: server.responseTime
        }));
    }
    /**
     * Holt Load-Balancing-Statistiken
     */
    getStats() {
        const totalServers = this.servers.size;
        const healthyServers = Array.from(this.servers.values())
            .filter(server => server.isHealthy).length;
        return {
            totalServers,
            healthyServers,
            currentStrategy: this.config.strategy,
            requestMetrics: this.requestMetrics.length
        };
    }
    /**
     * Ändert die Load-Balancing-Strategie
     */
    setStrategy(strategy) {
        this.config.strategy = strategy;
        logger_1.logger.info(`Load balancing strategy changed to: ${strategy}`);
    }
    /**
     * Stoppt die periodischen Gesundheitschecks
     */
    stopHealthChecks() {
        if (this.healthCheckTimer) {
            clearInterval(this.healthCheckTimer);
            this.healthCheckTimer = null;
        }
    }
    /**
     * Schließt den Load-Balancer
     */
    close() {
        this.stopHealthChecks();
        logger_1.logger.info('Load balancer closed');
    }
}
exports.LoadBalancer = LoadBalancer;
