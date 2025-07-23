/**
 * MallOS Enterprise - AI Analytics API Routes
 * Model management, predictions, and machine learning operations
 */

import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { logger } from '@/utils/logger';
import { aiAnalyticsService } from '@/services/AIAnalyticsService';
import { authMiddleware } from '@/middleware/auth';
import { rateLimit } from 'express-rate-limit';
import { ModelType, ModelStatus, ModelFramework } from '@/models/AIModel';
import { PredictionType, PredictionStatus } from '@/models/AIPrediction';

const router = Router();

// Rate limiting
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  message: 'Too many AI requests from this IP'
});

const predictionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many prediction requests from this IP'
});

/**
 * @swagger
 * /api/ai/models:
 *   get:
 *     summary: Get all AI models
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: mallId
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [prediction, classification, anomaly_detection, computer_vision, nlp, recommendation, forecasting]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [training, active, inactive, deprecated, error]
 *     responses:
 *       200:
 *         description: List of AI models
 */
router.get('/models',
  authMiddleware,
  aiLimiter,
  [
    query('mallId').optional().isUUID(),
    query('type').optional().isIn(Object.values(ModelType)),
    query('status').optional().isIn(Object.values(ModelStatus))
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { mallId, type, status } = req.query;
      const mallIdToUse = mallId || req.user.mallId;

      // Get models from database
      const models = await getModels(mallIdToUse as string, type as ModelType, status as ModelStatus);

      res.json({
        success: true,
        data: models,
        count: models.length
      });
    } catch (error) {
      logger.error('❌ Failed to get AI models:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve AI models'
      });
    }
  }
);

/**
 * @swagger
 * /api/ai/models:
 *   post:
 *     summary: Create new AI model
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - mallId
 *               - type
 *               - framework
 *             properties:
 *               name:
 *                 type: string
 *               mallId:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [prediction, classification, anomaly_detection, computer_vision, nlp, recommendation, forecasting]
 *               framework:
 *                 type: string
 *                 enum: [tensorflow, pytorch, scikit_learn, opencv, face_api, custom]
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Model created successfully
 */
router.post('/models',
  authMiddleware,
  aiLimiter,
  [
    body('name').isString().isLength({ min: 1, max: 100 }),
    body('mallId').isUUID(),
    body('type').isIn(Object.values(ModelType)),
    body('framework').isIn(Object.values(ModelFramework)),
    body('description').optional().isString()
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const model = await aiAnalyticsService.createModel(req.body);

      res.status(201).json({
        success: true,
        data: model,
        message: 'AI model created successfully'
      });
    } catch (error) {
      logger.error('❌ Failed to create AI model:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create AI model'
      });
    }
  }
);

/**
 * @swagger
 * /api/ai/models/{modelId}/train:
 *   post:
 *     summary: Train AI model
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: modelId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - dataSource
 *               - features
 *               - target
 *             properties:
 *               dataSource:
 *                 type: string
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *               target:
 *                 type: string
 *               validationSplit:
 *                 type: number
 *                 default: 0.2
 *               epochs:
 *                 type: number
 *                 default: 100
 *               batchSize:
 *                 type: number
 *                 default: 32
 *               learningRate:
 *                 type: number
 *                 default: 0.001
 *     responses:
 *       200:
 *         description: Training started successfully
 */
router.post('/models/:modelId/train',
  authMiddleware,
  aiLimiter,
  [
    param('modelId').isUUID(),
    body('dataSource').isString(),
    body('features').isArray({ min: 1 }),
    body('target').isString(),
    body('validationSplit').optional().isFloat({ min: 0, max: 1 }),
    body('epochs').optional().isInt({ min: 1, max: 1000 }),
    body('batchSize').optional().isInt({ min: 1, max: 512 }),
    body('learningRate').optional().isFloat({ min: 0.0001, max: 1 })
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { modelId } = req.params;
      const trainingConfig = {
        modelId,
        ...req.body,
        validationSplit: req.body.validationSplit || 0.2,
        epochs: req.body.epochs || 100,
        batchSize: req.body.batchSize || 32,
        learningRate: req.body.learningRate || 0.001
      };

      await aiAnalyticsService.trainModel(trainingConfig);

      res.json({
        success: true,
        message: 'Model training started successfully'
      });
    } catch (error) {
      logger.error('❌ Failed to start model training:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to start model training'
      });
    }
  }
);

/**
 * @swagger
 * /api/ai/models/{modelId}:
 *   get:
 *     summary: Get AI model by ID
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: modelId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Model details
 */
router.get('/models/:modelId',
  authMiddleware,
  aiLimiter,
  [
    param('modelId').isUUID()
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { modelId } = req.params;
      const model = await getModelById(modelId);

      if (!model) {
        return res.status(404).json({
          success: false,
          error: 'Model not found'
        });
      }

      res.json({
        success: true,
        data: model
      });
    } catch (error) {
      logger.error('❌ Failed to get AI model:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve AI model'
      });
    }
  }
);

/**
 * @swagger
 * /api/ai/predictions:
 *   get:
 *     summary: Get AI predictions
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: mallId
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [revenue_forecast, foot_traffic, energy_consumption, maintenance_schedule, crowd_density, parking_availability, tenant_performance, security_threat, equipment_failure, customer_behavior, pricing_optimization, anomaly_detection]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, completed, failed, expired]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: List of predictions
 */
router.get('/predictions',
  authMiddleware,
  aiLimiter,
  [
    query('mallId').optional().isUUID(),
    query('type').optional().isIn(Object.values(PredictionType)),
    query('status').optional().isIn(Object.values(PredictionStatus)),
    query('limit').optional().isInt({ min: 1, max: 1000 })
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { mallId, type, status, limit = 100 } = req.query;
      const mallIdToUse = mallId || req.user.mallId;

      const predictions = await getPredictions(
        mallIdToUse as string,
        type as PredictionType,
        status as PredictionStatus,
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data: predictions,
        count: predictions.length
      });
    } catch (error) {
      logger.error('❌ Failed to get predictions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve predictions'
      });
    }
  }
);

/**
 * @swagger
 * /api/ai/predictions:
 *   post:
 *     summary: Make prediction
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - modelId
 *               - mallId
 *               - type
 *               - input
 *             properties:
 *               modelId:
 *                 type: string
 *               mallId:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [revenue_forecast, foot_traffic, energy_consumption, maintenance_schedule, crowd_density, parking_availability, tenant_performance, security_threat, equipment_failure, customer_behavior, pricing_optimization, anomaly_detection]
 *               input:
 *                 type: object
 *               predictionDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Prediction created successfully
 */
router.post('/predictions',
  authMiddleware,
  predictionLimiter,
  [
    body('modelId').isUUID(),
    body('mallId').isUUID(),
    body('type').isIn(Object.values(PredictionType)),
    body('input').isObject(),
    body('predictionDate').optional().isISO8601()
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const prediction = await aiAnalyticsService.makePrediction(req.body);

      res.json({
        success: true,
        data: prediction,
        message: 'Prediction created successfully'
      });
    } catch (error) {
      logger.error('❌ Failed to make prediction:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to make prediction'
      });
    }
  }
);

/**
 * @swagger
 * /api/ai/forecast/revenue:
 *   post:
 *     summary: Forecast revenue
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mallId
 *             properties:
 *               mallId:
 *                 type: string
 *               days:
 *                 type: number
 *                 default: 30
 *     responses:
 *       200:
 *         description: Revenue forecast generated
 */
router.post('/forecast/revenue',
  authMiddleware,
  aiLimiter,
  [
    body('mallId').isUUID(),
    body('days').optional().isInt({ min: 1, max: 365 })
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { mallId, days = 30 } = req.body;
      const predictions = await aiAnalyticsService.forecastRevenue(mallId, days);

      res.json({
        success: true,
        data: predictions,
        count: predictions.length,
        message: 'Revenue forecast generated successfully'
      });
    } catch (error) {
      logger.error('❌ Failed to forecast revenue:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to forecast revenue'
      });
    }
  }
);

/**
 * @swagger
 * /api/ai/analytics/customer-behavior:
 *   post:
 *     summary: Analyze customer behavior
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mallId
 *             properties:
 *               mallId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Customer behavior analysis
 */
router.post('/analytics/customer-behavior',
  authMiddleware,
  aiLimiter,
  [
    body('mallId').isUUID()
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { mallId } = req.body;
      const analysis = await aiAnalyticsService.analyzeCustomerBehavior(mallId);

      res.json({
        success: true,
        data: analysis,
        message: 'Customer behavior analysis completed'
      });
    } catch (error) {
      logger.error('❌ Failed to analyze customer behavior:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to analyze customer behavior'
      });
    }
  }
);

/**
 * @swagger
 * /api/ai/anomalies:
 *   post:
 *     summary: Detect anomalies
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mallId
 *               - sensorType
 *             properties:
 *               mallId:
 *                 type: string
 *               sensorType:
 *                 type: string
 *                 enum: [temperature, humidity, co2, occupancy, water_leak, air_quality, energy_consumption, parking_sensor, crowd_density, lighting, hvac, security, maintenance, digital_signage]
 *     responses:
 *       200:
 *         description: Anomalies detected
 */
router.post('/anomalies',
  authMiddleware,
  aiLimiter,
  [
    body('mallId').isUUID(),
    body('sensorType').isString()
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { mallId, sensorType } = req.body;
      const anomalies = await aiAnalyticsService.detectAnomalies(mallId, sensorType);

      res.json({
        success: true,
        data: anomalies,
        count: anomalies.length,
        message: 'Anomaly detection completed'
      });
    } catch (error) {
      logger.error('❌ Failed to detect anomalies:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to detect anomalies'
      });
    }
  }
);

/**
 * @swagger
 * /api/ai/analytics:
 *   get:
 *     summary: Get AI analytics
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: mallId
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: AI analytics data
 */
router.get('/analytics',
  authMiddleware,
  [
    query('mallId').optional().isUUID(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { mallId, startDate, endDate } = req.query;
      const mallIdToUse = mallId || req.user.mallId;

      // Get AI statistics
      const aiStats = await aiAnalyticsService.getStatistics();

      // Get analytics data
      const analytics = await getAIAnalytics(
        mallIdToUse as string,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      res.json({
        success: true,
        data: {
          aiStats,
          analytics
        }
      });
    } catch (error) {
      logger.error('❌ Failed to get AI analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve AI analytics'
      });
    }
  }
);

/**
 * @swagger
 * /api/ai/status:
 *   get:
 *     summary: Get AI system status
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: AI system status
 */
router.get('/status',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const stats = await aiAnalyticsService.getStatistics();
      
      res.json({
        success: true,
        data: {
          status: 'operational',
          totalModels: stats.totalModels,
          activeModels: stats.activeModels,
          inactiveModels: stats.inactiveModels,
          totalPredictions: stats.totalPredictions,
          todayPredictions: stats.todayPredictions,
          loadedModels: stats.loadedModels,
          activeTrainingJobs: stats.activeTrainingJobs,
          lastUpdated: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('❌ Failed to get AI system status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve AI system status'
      });
    }
  }
);

// Helper functions
async function getModels(mallId: string, type?: ModelType, status?: ModelStatus): Promise<any[]> {
  try {
    // This would query the database for models
    // For now, return mock data
    return [];
  } catch (error) {
    logger.error('❌ Failed to get models:', error);
    throw error;
  }
}

async function getModelById(modelId: string): Promise<any> {
  try {
    // This would query the database for a specific model
    // For now, return null
    return null;
  } catch (error) {
    logger.error('❌ Failed to get model by ID:', error);
    throw error;
  }
}

async function getPredictions(
  mallId: string,
  type?: PredictionType,
  status?: PredictionStatus,
  limit: number = 100
): Promise<any[]> {
  try {
    // This would query the database for predictions
    // For now, return mock data
    return [];
  } catch (error) {
    logger.error('❌ Failed to get predictions:', error);
    throw error;
  }
}

async function getAIAnalytics(mallId: string, startDate?: Date, endDate?: Date): Promise<any> {
  try {
    // Implement AI analytics logic
    // This would aggregate AI data and provide insights
    return {
      modelPerformance: {
        averageAccuracy: 0.85,
        bestModel: 'revenue-forecast-v2',
        worstModel: 'anomaly-detection-v1'
      },
      predictions: {
        total: 1250,
        successful: 1180,
        failed: 70,
        accuracy: 0.944
      },
      insights: [
        'Revenue forecasting accuracy improved by 15%',
        'Customer behavior patterns show seasonal trends',
        'Anomaly detection reduced false positives by 25%'
      ]
    };
  } catch (error) {
    logger.error('❌ Failed to get AI analytics:', error);
    throw error;
  }
}

export default router; 