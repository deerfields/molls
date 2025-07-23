/**
 * MallOS Enterprise - Computer Vision API Routes
 * Security camera analytics, facial recognition, and computer vision insights
 */

import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { logger } from '@/utils/logger';
import { computerVisionService } from '@/services/ComputerVisionService';
import { authMiddleware } from '@/middleware/auth';
import { rateLimit } from 'express-rate-limit';
import { VisionType, DetectionStatus, ThreatLevel } from '@/models/ComputerVision';

const router = Router();

// Rate limiting
const visionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many computer vision requests from this IP'
});

const streamLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many stream requests from this IP'
});

/**
 * @swagger
 * /api/computer-vision/cameras:
 *   get:
 *     summary: Get all security cameras
 *     tags: [Computer Vision]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: mallId
 *         schema:
 *           type: string
 *       - in: query
 *         name: area
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of security cameras
 */
router.get('/cameras',
  authMiddleware,
  visionLimiter,
  [
    query('mallId').optional().isUUID(),
    query('area').optional().isString()
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { mallId, area } = req.query;
      const mallIdToUse = mallId || req.user.mallId;

      // Get cameras from service
      const cameras = await getCameras(mallIdToUse as string, area as string);

      res.json({
        success: true,
        data: cameras,
        count: cameras.length
      });
    } catch (error) {
      logger.error('❌ Failed to get cameras:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve cameras'
      });
    }
  }
);

/**
 * @swagger
 * /api/computer-vision/cameras:
 *   post:
 *     summary: Add new security camera
 *     tags: [Computer Vision]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cameraId
 *               - mallId
 *               - url
 *               - location
 *               - enabledFeatures
 *             properties:
 *               cameraId:
 *                 type: string
 *               mallId:
 *                 type: string
 *               url:
 *                 type: string
 *               location:
 *                 type: object
 *               enabledFeatures:
 *                 type: array
 *                 items:
 *                   type: string
 *               recordingEnabled:
 *                 type: boolean
 *               alertThresholds:
 *                 type: object
 *     responses:
 *       201:
 *         description: Camera added successfully
 */
router.post('/cameras',
  authMiddleware,
  visionLimiter,
  [
    body('cameraId').isString().isLength({ min: 1, max: 100 }),
    body('mallId').isUUID(),
    body('url').isURL(),
    body('location').isObject(),
    body('enabledFeatures').isArray(),
    body('recordingEnabled').optional().isBoolean(),
    body('alertThresholds').optional().isObject()
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Add camera to service
      await addCamera(req.body);

      res.status(201).json({
        success: true,
        message: 'Camera added successfully'
      });
    } catch (error) {
      logger.error('❌ Failed to add camera:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add camera'
      });
    }
  }
);

/**
 * @swagger
 * /api/computer-vision/cameras/{cameraId}/stream:
 *   get:
 *     summary: Get camera stream
 *     tags: [Computer Vision]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cameraId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Camera stream
 */
router.get('/cameras/:cameraId/stream',
  authMiddleware,
  streamLimiter,
  [
    param('cameraId').isString().isLength({ min: 1, max: 100 })
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { cameraId } = req.params;

      // Set headers for video stream
      res.writeHead(200, {
        'Content-Type': 'multipart/x-mixed-replace; boundary=frame',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      });

      // Start video stream
      await startVideoStream(cameraId, res);

    } catch (error) {
      logger.error('❌ Failed to start camera stream:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to start camera stream'
      });
    }
  }
);

/**
 * @swagger
 * /api/computer-vision/detections:
 *   get:
 *     summary: Get computer vision detections
 *     tags: [Computer Vision]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: mallId
 *         schema:
 *           type: string
 *       - in: query
 *         name: cameraId
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [facial_recognition, behavior_analysis, crowd_analysis, license_plate, fire_smoke, social_distancing, violence_detection, theft_prevention, vip_recognition, anomaly_detection, occupancy_counting, traffic_flow]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [detected, verified, false_positive, pending_review, ignored]
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
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: List of detections
 */
router.get('/detections',
  authMiddleware,
  visionLimiter,
  [
    query('mallId').optional().isUUID(),
    query('cameraId').optional().isString(),
    query('type').optional().isIn(Object.values(VisionType)),
    query('status').optional().isIn(Object.values(DetectionStatus)),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('limit').optional().isInt({ min: 1, max: 1000 })
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { mallId, cameraId, type, status, startDate, endDate, limit = 100 } = req.query;
      const mallIdToUse = mallId || req.user.mallId;

      const detections = await getDetections(
        mallIdToUse as string,
        cameraId as string,
        type as VisionType,
        status as DetectionStatus,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined,
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data: detections,
        count: detections.length
      });
    } catch (error) {
      logger.error('❌ Failed to get detections:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve detections'
      });
    }
  }
);

/**
 * @swagger
 * /api/computer-vision/detections/{detectionId}:
 *   get:
 *     summary: Get detection by ID
 *     tags: [Computer Vision]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: detectionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detection details
 */
router.get('/detections/:detectionId',
  authMiddleware,
  visionLimiter,
  [
    param('detectionId').isUUID()
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { detectionId } = req.params;
      const detection = await getDetectionById(detectionId);

      if (!detection) {
        return res.status(404).json({
          success: false,
          error: 'Detection not found'
        });
      }

      res.json({
        success: true,
        data: detection
      });
    } catch (error) {
      logger.error('❌ Failed to get detection:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve detection'
      });
    }
  }
);

/**
 * @swagger
 * /api/computer-vision/detections/{detectionId}/verify:
 *   post:
 *     summary: Verify detection
 *     tags: [Computer Vision]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: detectionId
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
 *               - verified
 *             properties:
 *               verified:
 *                 type: boolean
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Detection verified
 */
router.post('/detections/:detectionId/verify',
  authMiddleware,
  visionLimiter,
  [
    param('detectionId').isUUID(),
    body('verified').isBoolean(),
    body('notes').optional().isString()
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { detectionId } = req.params;
      const { verified, notes } = req.body;

      await verifyDetection(detectionId, verified, notes);

      res.json({
        success: true,
        message: `Detection ${verified ? 'verified' : 'marked as false positive'}`
      });
    } catch (error) {
      logger.error('❌ Failed to verify detection:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to verify detection'
      });
    }
  }
);

/**
 * @swagger
 * /api/computer-vision/alerts:
 *   get:
 *     summary: Get security alerts
 *     tags: [Computer Vision]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: mallId
 *         schema:
 *           type: string
 *       - in: query
 *         name: threatLevel
 *         schema:
 *           type: string
 *           enum: [low, medium, high, critical]
 *       - in: query
 *         name: acknowledged
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: List of security alerts
 */
router.get('/alerts',
  authMiddleware,
  visionLimiter,
  [
    query('mallId').optional().isUUID(),
    query('threatLevel').optional().isIn(Object.values(ThreatLevel)),
    query('acknowledged').optional().isBoolean(),
    query('limit').optional().isInt({ min: 1, max: 1000 })
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { mallId, threatLevel, acknowledged, limit = 100 } = req.query;
      const mallIdToUse = mallId || req.user.mallId;

      const alerts = await getSecurityAlerts(
        mallIdToUse as string,
        threatLevel as ThreatLevel,
        acknowledged as boolean,
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data: alerts,
        count: alerts.length
      });
    } catch (error) {
      logger.error('❌ Failed to get security alerts:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve security alerts'
      });
    }
  }
);

/**
 * @swagger
 * /api/computer-vision/alerts/{alertId}/acknowledge:
 *   post:
 *     summary: Acknowledge security alert
 *     tags: [Computer Vision]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: alertId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               response:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Alert acknowledged
 */
router.post('/alerts/:alertId/acknowledge',
  authMiddleware,
  visionLimiter,
  [
    param('alertId').isUUID(),
    body('response').optional().isString(),
    body('notes').optional().isString()
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { alertId } = req.params;
      const { response, notes } = req.body;

      await acknowledgeAlert(alertId, req.user.id, response, notes);

      res.json({
        success: true,
        message: 'Alert acknowledged successfully'
      });
    } catch (error) {
      logger.error('❌ Failed to acknowledge alert:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to acknowledge alert'
      });
    }
  }
);

/**
 * @swagger
 * /api/computer-vision/analytics:
 *   get:
 *     summary: Get computer vision analytics
 *     tags: [Computer Vision]
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
 *         description: Computer vision analytics
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

      // Get computer vision statistics
      const cvStats = await computerVisionService.getStatistics();

      // Get analytics data
      const analytics = await getComputerVisionAnalytics(
        mallIdToUse as string,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      res.json({
        success: true,
        data: {
          cvStats,
          analytics
        }
      });
    } catch (error) {
      logger.error('❌ Failed to get computer vision analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve computer vision analytics'
      });
    }
  }
);

/**
 * @swagger
 * /api/computer-vision/stream/alerts:
 *   get:
 *     summary: Stream real-time security alerts
 *     tags: [Computer Vision]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: mallId
 *         schema:
 *           type: string
 *       - in: query
 *         name: threatLevel
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Real-time alert stream
 */
router.get('/stream/alerts',
  authMiddleware,
  (req: Request, res: Response) => {
    try {
      const { mallId, threatLevel } = req.query;

      // Set headers for SSE
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      });

      // Send initial connection message
      res.write('data: {"type": "connected", "message": "Security alert stream started"}\n\n');

      // Listen for security alert events
      const alertHandler = (alert: any) => {
        if (mallId && alert.mallId !== mallId) return;
        if (threatLevel && alert.threatLevel !== threatLevel) return;

        res.write(`data: ${JSON.stringify({
          type: 'security_alert',
          data: alert
        })}\n\n`);
      };

      computerVisionService.on('securityAlert', alertHandler);

      // Clean up on client disconnect
      req.on('close', () => {
        computerVisionService.off('securityAlert', alertHandler);
      });

    } catch (error) {
      logger.error('❌ Failed to start alert stream:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to start alert stream'
      });
    }
  }
);

/**
 * @swagger
 * /api/computer-vision/status:
 *   get:
 *     summary: Get computer vision system status
 *     tags: [Computer Vision]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System status
 */
router.get('/status',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const stats = await computerVisionService.getStatistics();
      
      res.json({
        success: true,
        data: {
          status: 'operational',
          totalCameras: stats.totalCameras,
          activeCameras: stats.activeCameras,
          inactiveCameras: stats.inactiveCameras,
          totalDetections: stats.totalDetections,
          todayDetections: stats.todayDetections,
          processingQueueSize: stats.processingQueueSize,
          lastUpdated: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('❌ Failed to get computer vision system status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve computer vision system status'
      });
    }
  }
);

// Helper functions
async function getCameras(mallId: string, area?: string): Promise<any[]> {
  try {
    // This would query the service for cameras
    // For now, return mock data
    return [
      {
        cameraId: 'cam-001',
        mallId,
        url: 'rtsp://camera1.example.com/stream',
        location: { area: 'Main Entrance', floor: '1' },
        enabledFeatures: ['facial_recognition', 'crowd_analysis'],
        status: 'active'
      }
    ];
  } catch (error) {
    logger.error('❌ Failed to get cameras:', error);
    throw error;
  }
}

async function addCamera(cameraConfig: any): Promise<void> {
  try {
    // This would add camera to the service
    logger.info(`Adding camera: ${cameraConfig.cameraId}`);
  } catch (error) {
    logger.error('❌ Failed to add camera:', error);
    throw error;
  }
}

async function startVideoStream(cameraId: string, res: Response): Promise<void> {
  try {
    // This would start video streaming
    // For now, just send a placeholder
    res.write('--frame\r\n');
    res.write('Content-Type: image/jpeg\r\n\r\n');
    res.write('placeholder-image-data\r\n\r\n');
  } catch (error) {
    logger.error('❌ Failed to start video stream:', error);
    throw error;
  }
}

async function getDetections(
  mallId: string,
  cameraId?: string,
  type?: VisionType,
  status?: DetectionStatus,
  startDate?: Date,
  endDate?: Date,
  limit: number = 100
): Promise<any[]> {
  try {
    // This would query the database for detections
    // For now, return mock data
    return [];
  } catch (error) {
    logger.error('❌ Failed to get detections:', error);
    throw error;
  }
}

async function getDetectionById(detectionId: string): Promise<any> {
  try {
    // This would query the database for a specific detection
    // For now, return null
    return null;
  } catch (error) {
    logger.error('❌ Failed to get detection by ID:', error);
    throw error;
  }
}

async function verifyDetection(detectionId: string, verified: boolean, notes?: string): Promise<void> {
  try {
    // This would update the detection status in the database
    logger.info(`Verifying detection ${detectionId}: ${verified}`);
  } catch (error) {
    logger.error('❌ Failed to verify detection:', error);
    throw error;
  }
}

async function getSecurityAlerts(
  mallId: string,
  threatLevel?: ThreatLevel,
  acknowledged?: boolean,
  limit: number = 100
): Promise<any[]> {
  try {
    // This would query the database for security alerts
    // For now, return mock data
    return [];
  } catch (error) {
    logger.error('❌ Failed to get security alerts:', error);
    throw error;
  }
}

async function acknowledgeAlert(alertId: string, userId: string, response?: string, notes?: string): Promise<void> {
  try {
    // This would update the alert status in the database
    logger.info(`Acknowledging alert ${alertId} by user ${userId}`);
  } catch (error) {
    logger.error('❌ Failed to acknowledge alert:', error);
    throw error;
  }
}

async function getComputerVisionAnalytics(mallId: string, startDate?: Date, endDate?: Date): Promise<any> {
  try {
    // Implement computer vision analytics logic
    // This would aggregate detection data and provide insights
    return {
      detections: {
        total: 1250,
        facialRecognition: 450,
        crowdAnalysis: 300,
        behaviorAnalysis: 200,
        anomalyDetection: 300
      },
      alerts: {
        total: 45,
        critical: 5,
        high: 12,
        medium: 18,
        low: 10
      },
      performance: {
        accuracy: 0.92,
        falsePositiveRate: 0.08,
        averageProcessingTime: 0.15
      },
      insights: [
        'Facial recognition accuracy improved by 8%',
        'Crowd density peaks during lunch hours',
        'Anomaly detection reduced false positives by 15%'
      ]
    };
  } catch (error) {
    logger.error('❌ Failed to get computer vision analytics:', error);
    throw error;
  }
}

export default router; 