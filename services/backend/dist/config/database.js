"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectDatabase = exports.connectDatabase = exports.prisma = exports.db = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const config_1 = require("./config");
// Prisma Client Singleton
class DatabaseService {
    constructor() {
        // Construct database URL with connection pool parameters
        const dbUrl = new URL(config_1.config.database.url);
        dbUrl.searchParams.set('connection_limit', config_1.config.database.pool.max.toString());
        dbUrl.searchParams.set('pool_timeout', '10');
        this.prisma = new client_1.PrismaClient({
            log: [
                {
                    emit: 'event',
                    level: 'query',
                },
                {
                    emit: 'event',
                    level: 'error',
                },
                {
                    emit: 'event',
                    level: 'info',
                },
                {
                    emit: 'event',
                    level: 'warn',
                },
            ],
            datasources: {
                db: {
                    url: dbUrl.toString(),
                },
            },
        });
        // Prisma Event Listeners für Logging (disabled due to typing issues)
    }
    static getInstance() {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }
    getClient() {
        return this.prisma;
    }
    async connect() {
        try {
            await this.prisma.$connect();
            logger_1.logger.info('Datenbankverbindung erfolgreich hergestellt');
        }
        catch (error) {
            logger_1.logger.error('Fehler beim Verbinden zur Datenbank:', error);
            throw error;
        }
    }
    async disconnect() {
        try {
            await this.prisma.$disconnect();
            logger_1.logger.info('Datenbankverbindung getrennt');
        }
        catch (error) {
            logger_1.logger.error('Fehler beim Trennen der Datenbankverbindung:', error);
            throw error;
        }
    }
    async healthCheck() {
        try {
            await this.prisma.$queryRaw `SELECT 1`;
            return true;
        }
        catch (error) {
            logger_1.logger.error('Database Health Check fehlgeschlagen:', error);
            return false;
        }
    }
    // Transaction Helper
    async transaction(fn) {
        return await this.prisma.$transaction(fn);
    }
}
// Exportiere Singleton-Instanz
exports.db = DatabaseService.getInstance();
exports.prisma = exports.db.getClient();
// Helper-Funktion für die Verbindung
const connectDatabase = async () => {
    await exports.db.connect();
};
exports.connectDatabase = connectDatabase;
// Helper-Funktion für Graceful Shutdown
const disconnectDatabase = async () => {
    await exports.db.disconnect();
};
exports.disconnectDatabase = disconnectDatabase;
// Graceful Shutdown Handler
process.on('beforeExit', async () => {
    await (0, exports.disconnectDatabase)();
});
process.on('SIGINT', async () => {
    await (0, exports.disconnectDatabase)();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    await (0, exports.disconnectDatabase)();
    process.exit(0);
});
