/**
 * MallOS Enterprise - Logger Utility
 * Comprehensive logging system with multiple levels and formats
 */

import winston from 'winston';
import { config } from '@/config/config';

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    if (stack) {
      log += `\n${stack}`;
    }
    
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    
    if (stack) {
      log += `\n${stack}`;
    }
    
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

// Create logger instance
export const logger = winston.createLogger({
  level: config.development.logLevel,
  format: logFormat,
  defaultMeta: {
    service: 'mallos-enterprise',
    version: config.app.version,
    environment: config.app.environment
  },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: consoleFormat
    }),
    
    // File transport for all logs
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    }),
    
    // File transport for error logs
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    }),
    
    // File transport for access logs
    new winston.transports.File({
      filename: 'logs/access.log',
      level: 'info',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    })
  ],
  exceptionHandlers: [
    new winston.transports.File({
      filename: 'logs/exceptions.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: 'logs/rejections.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Add request logging middleware
export const requestLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: 'logs/requests.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Add security logging
export const securityLogger = winston.createLogger({
  level: 'warn',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: 'logs/security.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Add audit logging
export const auditLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: 'logs/audit.log',
      maxsize: 5242880, // 5MB
      maxFiles: 10
    })
  ]
});

// Add performance logging
export const performanceLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: 'logs/performance.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Add AI/ML logging
export const aiLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: 'logs/ai.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Add IoT logging
export const iotLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: 'logs/iot.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Add blockchain logging
export const blockchainLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: 'logs/blockchain.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Helper functions for structured logging
export const logHelpers = {
  // Log user actions
  userAction: (userId: string, action: string, details: any = {}) => {
    auditLogger.info('User Action', {
      userId,
      action,
      details,
      timestamp: new Date().toISOString()
    });
  },

  // Log security events
  securityEvent: (event: string, details: any = {}) => {
    securityLogger.warn('Security Event', {
      event,
      details,
      timestamp: new Date().toISOString()
    });
  },

  // Log performance metrics
  performance: (operation: string, duration: number, details: any = {}) => {
    performanceLogger.info('Performance Metric', {
      operation,
      duration,
      details,
      timestamp: new Date().toISOString()
    });
  },

  // Log AI/ML operations
  aiOperation: (operation: string, details: any = {}) => {
    aiLogger.info('AI Operation', {
      operation,
      details,
      timestamp: new Date().toISOString()
    });
  },

  // Log IoT events
  iotEvent: (deviceId: string, event: string, data: any = {}) => {
    iotLogger.info('IoT Event', {
      deviceId,
      event,
      data,
      timestamp: new Date().toISOString()
    });
  },

  // Log blockchain transactions
  blockchainTransaction: (txHash: string, operation: string, details: any = {}) => {
    blockchainLogger.info('Blockchain Transaction', {
      txHash,
      operation,
      details,
      timestamp: new Date().toISOString()
    });
  },

  // Log API requests
  apiRequest: (method: string, url: string, statusCode: number, duration: number, userId?: string) => {
    requestLogger.info('API Request', {
      method,
      url,
      statusCode,
      duration,
      userId,
      timestamp: new Date().toISOString()
    });
  },

  // Log errors with context
  error: (error: Error, context: any = {}) => {
    logger.error('Application Error', {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    });
  },

  // Log warnings
  warning: (message: string, details: any = {}) => {
    logger.warn('Warning', {
      message,
      details,
      timestamp: new Date().toISOString()
    });
  },

  // Log info messages
  info: (message: string, details: any = {}) => {
    logger.info('Info', {
      message,
      details,
      timestamp: new Date().toISOString()
    });
  },

  // Log debug messages
  debug: (message: string, details: any = {}) => {
    logger.debug('Debug', {
      message,
      details,
      timestamp: new Date().toISOString()
    });
  }
};

// Export default logger
export default logger; 