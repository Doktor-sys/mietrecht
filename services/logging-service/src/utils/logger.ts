import winston from 'winston';
import 'winston-elasticsearch';

// Logger-Konfiguration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'logging-service' },
  transports: [
    // In Entwicklungsumgebung auch in die Konsole loggen
    ...(process.env.NODE_ENV !== 'production' 
      ? [new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })]
      : []),
    
    // In allen Umgebungen in eine Datei loggen
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

export { logger };