/**
 * MallOS Enterprise - IoT API Routes
 * Device management, real-time data streaming, and control endpoints
 */

import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { logger } from '@/utils/logger';
import { iotService } from '@/services/IoTService';
import { authMiddleware } from '@/middleware/auth';
import { rateLimit } from 'express-rate-limit';
import { DeviceType, DeviceStatus } from '@/models/IoTDevice';
import { SensorType } from '@/models/SensorData';

const router = Router();

// Rate limiting
const deviceLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many device requests from this IP'
});

const dataLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many data requests from this IP'
});

/**
 * @swagger
 * /api/iot/devices:
 *   get:
 *     summary: Get all IoT devices
 *     tags: [IoT]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: mallId
 *         schema:
 *           type: string
 *         description: Filter by mall ID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [sensor, camera, controller, gateway, actuator]
 *         description: Filter by device type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [online, offline, maintenance, error]
 *         description: Filter by device status
 *     responses:
 *       200:
 *         description: List of IoT devices
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/IoTDevice'
 */
router.get('/devices', 
  authMiddleware,
  deviceLimiter,
  [
    query('mallId').optional().isUUID(),
    query('type').optional().isIn(Object.values(DeviceType)),
    query('status').optional().isIn(Object.values(DeviceStatus))
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { mallId, type, status } = req.query;
      
      let devices;
      if (mallId) {
        devices = await iotService.getDevicesByMall(mallId as string, type as DeviceType);
      } else {
        // Get all devices for user's malls
        devices = await iotService.getDevicesByMall(req.user.mallId);
      }

      if (status) {
        devices = devices.filter(device => device.status === status);
      }

      res.json({
        success: true,
        data: devices,
        count: devices.length
      });
    } catch (error) {
      logger.error('❌ Failed to get devices:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve devices'
      });
    }
  }
);

/**
 * @swagger
 * /api/iot/devices:
 *   post:
 *     summary: Register new IoT device
 *     tags: [IoT]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - deviceId
 *               - mallId
 *               - name
 *               - type
 *             properties:
 *               deviceId:
 *                 type: string
 *               mallId:
 *                 type: string
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [sensor, camera, controller, gateway, actuator]
 *               location:
 *                 type: object
 *               configuration:
 *                 type: object
 *     responses:
 *       201:
 *         description: Device registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IoTDevice'
 */
router.post('/devices',
  authMiddleware,
  deviceLimiter,
  [
    body('deviceId').isString().isLength({ min: 1, max: 100 }),
    body('mallId').isUUID(),
    body('name').isString().isLength({ min: 1, max: 100 }),
    body('type').isIn(Object.values(DeviceType)),
    body('location').optional().isObject(),
    body('configuration').optional().isObject()
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const device = await iotService.registerDevice(req.body);
      
      res.status(201).json({
        success: true,
        data: device,
        message: 'Device registered successfully'
      });
    } catch (error) {
      logger.error('❌ Failed to register device:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to register device'
      });
    }
  }
);

/**
 * @swagger
 * /api/iot/devices/{deviceId}:
 *   get:
 *     summary: Get device by ID
 *     tags: [IoT]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Device details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IoTDevice'
 */
router.get('/devices/:deviceId',
  authMiddleware,
  deviceLimiter,
  [
    param('deviceId').isString().isLength({ min: 1, max: 100 })
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { deviceId } = req.params;
      const device = await iotService.getDevice(deviceId);

      if (!device) {
        return res.status(404).json({
          success: false,
          error: 'Device not found'
        });
      }

      res.json({
        success: true,
        data: device
      });
    } catch (error) {
      logger.error('❌ Failed to get device:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve device'
      });
    }
  }
);

/**
 * @swagger
 * /api/iot/devices/{deviceId}/command:
 *   post:
 *     summary: Send command to device
 *     tags: [IoT]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
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
 *               - command
 *             properties:
 *               command:
 *                 type: string
 *               parameters:
 *                 type: object
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *     responses:
 *       200:
 *         description: Command sent successfully
 */
router.post('/devices/:deviceId/command',
  authMiddleware,
  deviceLimiter,
  [
    param('deviceId').isString().isLength({ min: 1, max: 100 }),
    body('command').isString().isLength({ min: 1, max: 100 }),
    body('parameters').optional().isObject(),
    body('priority').optional().isIn(['low', 'medium', 'high', 'critical'])
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { deviceId } = req.params;
      const { command, parameters, priority } = req.body;

      await iotService.sendDeviceCommand({
        deviceId,
        command,
        parameters,
        priority
      });

      res.json({
        success: true,
        message: 'Command sent successfully'
      });
    } catch (error) {
      logger.error('❌ Failed to send command:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to send command'
      });
    }
  }
);

/**
 * @swagger
 * /api/iot/devices/{deviceId}/data:
 *   get:
 *     summary: Get sensor data for device
 *     tags: [IoT]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: sensorType
 *         schema:
 *           type: string
 *           enum: [temperature, humidity, co2, occupancy, water_leak, air_quality, energy_consumption, parking_sensor, crowd_density, lighting, hvac, security, maintenance, digital_signage]
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
 *           minimum: 1
 *           maximum: 10000
 *           default: 1000
 *     responses:
 *       200:
 *         description: Sensor data
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SensorData'
 */
router.get('/devices/:deviceId/data',
  authMiddleware,
  dataLimiter,
  [
    param('deviceId').isString().isLength({ min: 1, max: 100 }),
    query('sensorType').optional().isIn(Object.values(SensorType)),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('limit').optional().isInt({ min: 1, max: 10000 })
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { deviceId } = req.params;
      const { sensorType, startDate, endDate, limit = 1000 } = req.query;

      const data = await iotService.getSensorData(
        deviceId,
        sensorType as SensorType,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined,
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data,
        count: data.length
      });
    } catch (error) {
      logger.error('❌ Failed to get sensor data:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve sensor data'
      });
    }
  }
);

/**
 * @swagger
 * /api/iot/data/stream:
 *   get:
 *     summary: Stream real-time sensor data
 *     tags: [IoT]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: mallId
 *         schema:
 *           type: string
 *       - in: query
 *         name: sensorType
 *     responses:
 *       200:
 *         description: Real-time data stream
 */
router.get('/data/stream',
  authMiddleware,
  (req: Request, res: Response) => {
    try {
      const { mallId, sensorType } = req.query;

      // Set headers for SSE
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      });

      // Send initial connection message
      res.write('data: {"type": "connected", "message": "Real-time data stream started"}\n\n');

      // Listen for sensor data events
      const dataHandler = (sensorData: any) => {
        if (mallId && sensorData.mallId !== mallId) return;
        if (sensorType && sensorData.sensorType !== sensorType) return;

        res.write(`data: ${JSON.stringify({
          type: 'sensor_data',
          data: sensorData
        })}\n\n`);
      };

      const alertHandler = (alert: any) => {
        if (mallId && alert.mallId !== mallId) return;

        res.write(`data: ${JSON.stringify({
          type: 'alert',
          data: alert
        })}\n\n`);
      };

      iotService.on('sensorData', dataHandler);
      iotService.on('sensorAlert', alertHandler);

      // Clean up on client disconnect
      req.on('close', () => {
        iotService.off('sensorData', dataHandler);
        iotService.off('sensorAlert', alertHandler);
      });

    } catch (error) {
      logger.error('❌ Failed to start data stream:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to start data stream'
      });
    }
  }
);

/**
 * @swagger
 * /api/iot/data/bulk:
 *   post:
 *     summary: Upload bulk sensor data
 *     tags: [IoT]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - data
 *             properties:
 *               data:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Data uploaded successfully
 */
router.post('/data/bulk',
  authMiddleware,
  dataLimiter,
  [
    body('data').isArray({ min: 1, max: 1000 }),
    body('data.*.deviceId').isString(),
    body('data.*.mallId').isUUID(),
    body('data.*.sensorType').isIn(Object.values(SensorType)),
    body('data.*.value').isNumeric(),
    body('data.*.timestamp').optional().isISO8601()
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { data } = req.body;
      let processedCount = 0;
      let errorCount = 0;

      for (const item of data) {
        try {
          await iotService.processSensorData(
            item.deviceId,
            item.mallId,
            {
              sensorType: item.sensorType,
              value: item.value,
              unit: item.unit,
              timestamp: item.timestamp || new Date(),
              location: item.location,
              metadata: item.metadata
            }
          );
          processedCount++;
        } catch (error) {
          errorCount++;
          logger.error(`❌ Failed to process data item:`, error);
        }
      }

      res.json({
        success: true,
        message: 'Bulk data upload completed',
        processed: processedCount,
        errors: errorCount
      });
    } catch (error) {
      logger.error('❌ Failed to upload bulk data:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to upload bulk data'
      });
    }
  }
);

/**
 * @swagger
 * /api/iot/analytics:
 *   get:
 *     summary: Get IoT analytics
 *     tags: [IoT]
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
 *         description: IoT analytics data
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

      // Get device statistics
      const deviceStats = await iotService.getStatistics();

      // Get sensor data analytics
      const analytics = await getSensorAnalytics(
        mallIdToUse as string,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      res.json({
        success: true,
        data: {
          deviceStats,
          sensorAnalytics: analytics
        }
      });
    } catch (error) {
      logger.error('❌ Failed to get IoT analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve analytics'
      });
    }
  }
);

/**
 * @swagger
 * /api/iot/alerts:
 *   get:
 *     summary: Get IoT alerts
 *     tags: [IoT]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: mallId
 *         schema:
 *           type: string
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [low, medium, high, critical]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: IoT alerts
 */
router.get('/alerts',
  authMiddleware,
  [
    query('mallId').optional().isUUID(),
    query('severity').optional().isIn(['low', 'medium', 'high', 'critical']),
    query('limit').optional().isInt({ min: 1, max: 1000 })
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { mallId, severity, limit = 100 } = req.query;
      const mallIdToUse = mallId || req.user.mallId;

      // Get alerts from database
      const alerts = await getAlerts(
        mallIdToUse as string,
        severity as string,
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data: alerts,
        count: alerts.length
      });
    } catch (error) {
      logger.error('❌ Failed to get alerts:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve alerts'
      });
    }
  }
);

/**
 * @swagger
 * /api/iot/status:
 *   get:
 *     summary: Get IoT system status
 *     tags: [IoT]
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
      const stats = await iotService.getStatistics();
      
      res.json({
        success: true,
        data: {
          status: 'operational',
          uptime: stats.uptime,
          mqttConnected: stats.mqttConnected,
          totalDevices: stats.totalDevices,
          onlineDevices: stats.onlineDevices,
          offlineDevices: stats.offlineDevices,
          totalReadings: stats.totalReadings,
          todayReadings: stats.todayReadings,
          lastUpdated: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('❌ Failed to get system status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve system status'
      });
    }
  }
);

// Helper functions
async function getSensorAnalytics(mallId: string, startDate?: Date, endDate?: Date): Promise<any> {
  try {
    // Implement sensor analytics logic
    // This would aggregate sensor data and provide insights
    return {
      temperature: {
        average: 22.5,
        min: 18.0,
        max: 28.0,
        trend: 'stable'
      },
      humidity: {
        average: 45.2,
        min: 35.0,
        max: 55.0,
        trend: 'increasing'
      },
      occupancy: {
        average: 125,
        peak: 450,
        trend: 'decreasing'
      }
    };
  } catch (error) {
    logger.error('❌ Failed to get sensor analytics:', error);
    throw error;
  }
}

async function getAlerts(mallId: string, severity?: string, limit: number = 100): Promise<any[]> {
  try {
    // Implement alert retrieval logic
    // This would query the database for alerts
    return [];
  } catch (error) {
    logger.error('❌ Failed to get alerts:', error);
    throw error;
  }
}

export default router; 