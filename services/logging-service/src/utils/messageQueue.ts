import amqp from 'amqplib';
import { logger } from './logger';

let channel: amqp.Channel | null = null;

/**
 * Stellt eine Verbindung zur Message Queue her
 */
export async function connectToMessageQueue() {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    channel = await connection.createChannel();
    
    // Deklariere die Logs-Queue
    await channel.assertQueue('logs', { durable: true });
    
    // Konsumiere Nachrichten aus der Queue
    channel.consume('logs', (msg) => {
      if (msg !== null) {
        try {
          const logData = JSON.parse(msg.content.toString());
          logger.log(logData.level, logData.message, logData.meta);
          
          // Bestätige die Nachricht
          channel?.ack(msg);
        } catch (error) {
          logger.error('Failed to process log message', { error });
          channel?.nack(msg, false, false); // Verwerfe die Nachricht
        }
      }
    });
    
    logger.info('Connected to message queue');
  } catch (error) {
    logger.error('Failed to connect to message queue', { error });
    throw error;
  }
}

/**
 * Sendet eine Log-Nachricht an die Queue
 */
export async function sendLogToQueue(logData: any) {
  if (!channel) {
    throw new Error('Message queue not connected');
  }
  
  try {
    channel.sendToQueue('logs', Buffer.from(JSON.stringify(logData)), {
      persistent: true
    });
  } catch (error) {
    logger.error('Failed to send log to queue', { error });
    throw error;
  }
}