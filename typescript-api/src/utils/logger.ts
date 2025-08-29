import winston from 'winston';
import { loggingConfig } from '../config';

const { combine, timestamp, printf, errors, json } = winston.format;

// Custom log format
const logFormat = printf(({ level, message, timestamp, ...meta }) => {
  const logEntry = {
    timestamp,
    level,
    message,
    ...meta,
  };
  
  if (loggingConfig.enableJson) {
    return JSON.stringify(logEntry);
  } else {
    return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
  }
});

// Create logger instance
export const logger = winston.createLogger({
  level: loggingConfig.level,
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    json()
  ),
  transports: [
    // Console transport
    new winston.transports.Console({
      format: combine(
        timestamp(),
        logFormat
      ),
      level: loggingConfig.level,
    }),
    
    // File transport
    new winston.transports.File({
      filename: 'logs/trading-bot.log',
      maxsize: 20 * 1024 * 1024, // 20MB
      maxFiles: 5,
      format: combine(
        timestamp(),
        logFormat
      ),
    }),
    
    // Error file transport
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 20 * 1024 * 1024,
      maxFiles: 5,
      format: combine(
        timestamp(),
        logFormat
      ),
    }),
  ],
});

// Add Morgan-like HTTP request logging if needed
export const httpLogger = winston.createLogger({
  level: 'http',
  format: combine(
    timestamp(),
    json()
  ),
  transports: [
    new winston.transports.File({
      filename: 'logs/http.log',
      maxsize: 20 * 1024 * 1024,
      maxFiles: 5,
    }),
  ],
});