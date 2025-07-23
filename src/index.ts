/**
 * MallOS Enterprise - Main Application Entry Point
 * IoT & AI Integration Hub for Mall Management System
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { config } from '@/config/config';
import { logger } from '@/utils/logger';
import { databaseManager } from '@/config/database';
import { redis } from '@/config/redis';
import { iotService } from '@/services/IoTService';
import { aiAnalyticsService } from '@/services/AIAnalyticsService';
import { computerVisionService } from '@/services/ComputerVisionService';
import os from 'os';
import { getRepository } from 'typeorm';
import { AuditLog } from '@/models/AuditLog';
import { IntegrationConfig } from '@/models/IntegrationConfig';
import promClient from 'prom-client';

// Import routes
import authRoutes from '@/routes/auth';
import dashboardRoutes from '@/routes/dashboard';
import usersRoutes from '@/routes/users';
import mallsRoutes from '@/routes/malls';
import tenantsRoutes from '@/routes/tenants';
import workPermitsRoutes from '@/routes/work-permits';
import iotRoutes from '@/routes/iot';
import aiRoutes from '@/routes/ai';
import computerVisionRoutes from '@/routes/computer-vision';
import integrationsRouter from '@/routes/integrations';
import auditLogRouter from '@/routes/audit-logs';
import { auditLog } from '@/middleware/audit';

// Import middleware
import { authMiddleware } from '@/middleware/auth';
import { errorHandler } from '@/middleware/errorHandler';
import { rateLimiter } from '@/middleware/rateLimiter';

class MallOSApplication {
  private app: express.Application;
  private server: any;
  private io: Server;
  private isInitialized = false;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: config.app.corsOrigin,
        methods: ['GET', 'POST']
      }
    });
  }

  /**
   * Initialize the application
   */
  async initialize(): Promise<void> {
    try {
      if (this.isInitialized) return;

      logger.info('🚀 Initializing MallOS Enterprise Application...');

      // Initialize database
      await databaseManager.initialize();
      logger.info('✅ Database initialized');

      // Initialize Redis
      await redis.connect();
      logger.info('✅ Redis connected');

      // Initialize IoT Service
      await iotService.initialize();
      logger.info('✅ IoT Service initialized');

      // Initialize AI Analytics Service
      await aiAnalyticsService.initialize();
      logger.info('✅ AI Analytics Service initialized');

      // Initialize Computer Vision Service
      await computerVisionService.initialize();
      logger.info('✅ Computer Vision Service initialized');

      // Setup middleware
      this.setupMiddleware();

      // Setup routes
      this.setupRoutes();

      // Setup Socket.IO
      this.setupSocketIO();

      // Setup error handling
      this.setupErrorHandling();

      // Setup graceful shutdown
      this.setupGracefulShutdown();

      this.isInitialized = true;
      logger.info('✅ MallOS Enterprise Application initialized successfully');
    } catch (error) {
      logger.error('❌ Failed to initialize application:', error);
      throw error;
    }
  }

  /**
   * Setup middleware
   */
  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS
    this.app.use(cors({
      origin: config.app.corsOrigin,
      credentials: true
    }));

    // Rate limiting (global, can be overridden per route)
    this.app.use(rateLimiter);

    // Compression
    this.app.use(compression());

    // Logging
    this.app.use(morgan('combined', {
      stream: {
        write: (message: string) => logger.info(message.trim())
      }
    }));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Audit logging (global)
    this.app.use(auditLog);

    // Health and metrics endpoints
    this.app.get('/health', async (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: config.app.version,
        environment: config.app.environment,
        nodeEnv: process.env.NODE_ENV,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        memoryPercent: (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100,
        cpu: os.loadavg(),
        dependencies: {
          database: databaseManager.getStatus(),
          redis: redis.status,
          integrations: 'ok', // Placeholder, see /health/integrations
          security: 'ok', // Placeholder, see /health/security
        }
      });
    });

    this.app.get('/health/database', async (req, res) => {
      try {
        const status = databaseManager.getStatus();
        const pool = databaseManager.getPoolStatus ? databaseManager.getPoolStatus() : {};
        const repo = getRepository(AuditLog);
        const count = await repo.count();
        res.json({
          status,
          pool,
          auditLogCount: count,
          migration: databaseManager.getMigrationStatus ? await databaseManager.getMigrationStatus() : 'unknown',
        });
      } catch (err) {
        res.status(500).json({ status: 'error', error: err.message });
      }
    });

    this.app.get('/health/integrations', async (req, res) => {
      try {
        const repo = getRepository(IntegrationConfig);
        const integrations = await repo.find();
        // Simulate connectivity checks and last sync/error status
        const statuses = integrations.map(i => ({
          id: i.id,
          name: i.name,
          type: i.type,
          status: i.status,
          lastSync: i['lastSync'] || null,
          errorCount: i['errorCount'] || 0,
        }));
        res.json({ integrations: statuses });
      } catch (err) {
        res.status(500).json({ status: 'error', error: err.message });
      }
    });

    this.app.get('/health/security', (req, res) => {
      // Simulate security middleware status
      res.json({
        helmet: true,
        cors: true,
        rateLimiting: true,
        recentSecurityEvents: [], // Could be populated from logs
        authentication: true,
        auditLogging: true,
      });
    });

    this.app.get('/health/audit', async (req, res) => {
      try {
        const repo = getRepository(AuditLog);
        const count = await repo.count();
        const recent = await repo.find({ order: { timestamp: 'DESC' }, take: 10 });
        res.json({
          logVolume: count,
          recentLogs: recent,
          retentionPolicy: process.env.AUDIT_RETENTION_DAYS || 90,
          cleanupStatus: 'ok', // Placeholder
        });
      } catch (err) {
        res.status(500).json({ status: 'error', error: err.message });
      }
    });

    // Prometheus metrics endpoint
    const collectDefaultMetrics = promClient.collectDefaultMetrics;
    collectDefaultMetrics();
    this.app.get('/metrics', async (req, res) => {
      res.set('Content-Type', promClient.register.contentType);
      res.end(await promClient.register.metrics());
    });
  }

  /**
   * Setup routes
   */
  private setupRoutes(): void {
    // API routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/dashboard', authMiddleware, dashboardRoutes);
    this.app.use('/api/users', authMiddleware, usersRoutes);
    this.app.use('/api/malls', authMiddleware, mallsRoutes);
    this.app.use('/api/tenants', authMiddleware, tenantsRoutes);
    this.app.use('/api/work-permits', authMiddleware, workPermitsRoutes);
    
    // IoT & AI routes
    this.app.use('/api/iot', iotRoutes);
    this.app.use('/api/ai', aiRoutes);
    this.app.use('/api/computer-vision', computerVisionRoutes);

    // --- Register enhanced integration router with full security stack ---
    this.app.use('/api/integrations', integrationsRouter);

    // --- Register audit log router with full security stack ---
    this.app.use('/api/audit-logs', auditLogRouter);

    // API documentation
    this.app.get('/api', (req, res) => {
      res.json({
        name: 'MallOS Enterprise API',
        version: config.app.version,
        description: 'IoT & AI Integration Hub for Mall Management',
        endpoints: {
          auth: '/api/auth',
          dashboard: '/api/dashboard',
          users: '/api/users',
          malls: '/api/malls',
          tenants: '/api/tenants',
          workPermits: '/api/work-permits',
          iot: '/api/iot',
          ai: '/api/ai',
          computerVision: '/api/computer-vision',
          integrations: '/api/integrations',
          auditLogs: '/api/audit-logs'
        }
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        path: req.originalUrl
      });
    });
  }

  /**
   * Setup Socket.IO for real-time communication
   */
  private setupSocketIO(): void {
    // Authentication middleware for Socket.IO
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }
      // Verify token and attach user data
      // This is a simplified implementation
      socket.data.user = { id: 'user-id', mallId: 'mall-id' };
      next();
    });

    this.io.on('connection', (socket) => {
      logger.info(`🔌 Client connected: ${socket.id}`);

      // Join mall-specific room
      socket.join(`mall-${socket.data.user.mallId}`);

      // Handle IoT data subscriptions
      socket.on('subscribe-iot-data', (data) => {
        const { sensorType, deviceId } = data;
        socket.join(`iot-${sensorType}-${deviceId}`);
        logger.info(`📡 Client ${socket.id} subscribed to IoT data: ${sensorType}`);
      });

      // Handle AI predictions subscriptions
      socket.on('subscribe-ai-predictions', (data) => {
        const { type } = data;
        socket.join(`ai-${type}`);
        logger.info(`🤖 Client ${socket.id} subscribed to AI predictions: ${type}`);
      });

      // Handle computer vision alerts subscriptions
      socket.on('subscribe-cv-alerts', (data) => {
        const { cameraId } = data;
        socket.join(`cv-${cameraId}`);
        logger.info(`👁️ Client ${socket.id} subscribed to CV alerts: ${cameraId}`);
      });

      socket.on('disconnect', () => {
        logger.info(`🔌 Client disconnected: ${socket.id}`);
      });
    });

    // Forward IoT events to Socket.IO
    iotService.on('sensorData', (data) => {
      this.io.to(`iot-${data.sensorType}-${data.deviceId}`).emit('sensor-data', data);
      this.io.to(`mall-${data.mallId}`).emit('iot-update', {
        type: 'sensor-data',
        data
      });
    });

    iotService.on('sensorAlert', (alert) => {
      this.io.to(`mall-${alert.mallId}`).emit('iot-alert', {
        type: 'sensor-alert',
        data: alert
      });
    });

    iotService.on('deviceStatusUpdate', (update) => {
      this.io.to(`mall-${update.mallId}`).emit('device-status', {
        type: 'device-status',
        data: update
      });
    });

    // Forward AI events to Socket.IO
    aiAnalyticsService.on('predictionCompleted', (prediction) => {
      this.io.to(`ai-${prediction.type}`).emit('ai-prediction', {
        type: 'prediction-completed',
        data: prediction
      });
    });

    aiAnalyticsService.on('modelTrained', (model) => {
      this.io.to(`mall-${model.mallId}`).emit('ai-model', {
        type: 'model-trained',
        data: model
      });
    });

    // Forward Computer Vision events to Socket.IO
    computerVisionService.on('securityAlert', (alert) => {
      this.io.to(`cv-${alert.cameraId}`).emit('cv-alert', {
        type: 'security-alert',
        data: alert
      });
      this.io.to(`mall-${alert.mallId}`).emit('security-update', {
        type: 'security-alert',
        data: alert
      });
    });
  }

  /**
   * Setup error handling
   */
  private setupErrorHandling(): void {
    // Global error handler for security and RBAC violations
    this.app.use((err, req, res, next) => {
      if (err.name === 'UnauthorizedError') {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }
      if (err.status === 403) {
        return res.status(403).json({ success: false, error: err.message || 'Forbidden' });
      }
      logger.error('❌ Global Error:', err);
      res.status(500).json({ success: false, error: err.message || 'Internal server error' });
    });
  }

  /**
   * Setup graceful shutdown
   */
  private setupGracefulShutdown(): void {
    const gracefulShutdown = async (signal: string) => {
      logger.info(`🛑 Received ${signal}. Starting graceful shutdown...`);

      try {
        // Close Socket.IO
        this.io.close(() => {
          logger.info('✅ Socket.IO server closed');
        });

        // Close HTTP server
        this.server.close(() => {
          logger.info('✅ HTTP server closed');
        });

        // Cleanup services
        await iotService.cleanup();
        await aiAnalyticsService.cleanup();
        await computerVisionService.cleanup();

        // Close database connections
        await databaseManager.close();
        await redis.disconnect();

        logger.info('✅ Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('❌ Error during graceful shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  }

  /**
   * Start the application
   */
  async start(): Promise<void> {
    try {
      await this.initialize();

      const port = config.app.port;
      this.server.listen(port, () => {
        logger.info(`🚀 MallOS Enterprise Server running on port ${port}`);
        logger.info(`📊 Environment: ${config.app.environment}`);
        logger.info(`🔗 API Documentation: http://localhost:${port}/api`);
        logger.info(`🏥 Health Check: http://localhost:${port}/health`);
      });
    } catch (error) {
      logger.error('❌ Failed to start application:', error);
      process.exit(1);
    }
  }

  /**
   * Get application status
   */
  getStatus(): any {
    return {
      initialized: this.isInitialized,
      database: databaseManager.getStatus(),
      redis: redis.status,
      iot: iotService.getStatistics(),
      ai: aiAnalyticsService.getStatistics(),
      computerVision: computerVisionService.getStatistics(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: config.app.version
    };
  }
}

// Create and start the application
const app = new MallOSApplication();

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the application
app.start().catch((error) => {
  logger.error('❌ Failed to start MallOS Enterprise:', error);
  process.exit(1);
});

export default app; 