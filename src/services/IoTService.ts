/**
 * MallOS Enterprise - IoT Integration Hub Service
 * Manages 10,000+ IoT devices with MQTT broker integration
 */

import * as mqtt from 'mqtt';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import { logger } from '@/utils/logger';
import { database } from '@/config/database';
import { IoTDevice, DeviceType, DeviceStatus } from '@/models/IoTDevice';
import { SensorData, SensorType, DataQuality } from '@/models/SensorData';
import { redis } from '@/config/redis';

export interface DeviceRegistration {
  deviceId: string;
  mallId: string;
  name: string;
  type: DeviceType;
  location: {
    area?: string;
    floor?: string;
    coordinates?: { lat: number; lng: number };
  };
  configuration?: any;
  certificate?: string;
}

export interface SensorReading {
  deviceId: string;
  mallId: string;
  sensorType: SensorType;
  value: number;
  unit?: string;
  timestamp: Date;
  location?: any;
  metadata?: any;
}

export interface DeviceCommand {
  deviceId: string;
  command: string;
  parameters?: any;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

export class IoTService extends EventEmitter {
  private static instance: IoTService;
  private mqttClient: mqtt.Client | null = null;
  private deviceConnections: Map<string, any> = new Map();
  private deviceCertificates: Map<string, string> = new Map();
  private isInitialized = false;

  private constructor() {
    super();
  }

  static getInstance(): IoTService {
    if (!IoTService.instance) {
      IoTService.instance = new IoTService();
    }
    return IoTService.instance;
  }

  /**
   * Initialize IoT service with MQTT broker
   */
  async initialize(): Promise<void> {
    try {
      if (this.isInitialized) return;

      // Connect to MQTT broker
      await this.connectMQTT();
      
      // Load device certificates
      await this.loadDeviceCertificates();
      
      // Start device monitoring
      await this.startDeviceMonitoring();
      
      this.isInitialized = true;
      logger.info('✅ IoT Service initialized successfully');
    } catch (error) {
      logger.error('❌ Failed to initialize IoT Service:', error);
      throw error;
    }
  }

  /**
   * Connect to MQTT broker
   */
  private async connectMQTT(): Promise<void> {
    try {
      const mqttConfig = {
        host: process.env.MQTT_HOST || 'localhost',
        port: parseInt(process.env.MQTT_PORT || '1883'),
        username: process.env.MQTT_USERNAME,
        password: process.env.MQTT_PASSWORD,
        clientId: `mallos-iot-${uuidv4()}`,
        clean: true,
        reconnectPeriod: 1000,
        connectTimeout: 30000
      };

      this.mqttClient = mqtt.connect(mqttConfig);

      this.mqttClient.on('connect', () => {
        logger.info('✅ Connected to MQTT broker');
        this.subscribeToTopics();
      });

      this.mqttClient.on('message', (topic, message) => {
        this.handleMQTTMessage(topic, message);
      });

      this.mqttClient.on('error', (error) => {
        logger.error('❌ MQTT connection error:', error);
      });

      this.mqttClient.on('close', () => {
        logger.warn('⚠️ MQTT connection closed');
      });
    } catch (error) {
      logger.error('❌ Failed to connect to MQTT broker:', error);
      throw error;
    }
  }

  /**
   * Subscribe to MQTT topics
   */
  private subscribeToTopics(): void {
    if (!this.mqttClient) return;

    const topics = [
      'mallos/+/devices/+/data',
      'mallos/+/devices/+/status',
      'mallos/+/devices/+/alerts',
      'mallos/+/devices/+/commands/response'
    ];

    topics.forEach(topic => {
      this.mqttClient!.subscribe(topic, (err) => {
        if (err) {
          logger.error(`❌ Failed to subscribe to ${topic}:`, err);
        } else {
          logger.info(`✅ Subscribed to ${topic}`);
        }
      });
    });
  }

  /**
   * Handle incoming MQTT messages
   */
  private async handleMQTTMessage(topic: string, message: Buffer): Promise<void> {
    try {
      const payload = JSON.parse(message.toString());
      const topicParts = topic.split('/');
      
      if (topicParts.length < 4) return;

      const mallId = topicParts[1];
      const deviceId = topicParts[3];
      const messageType = topicParts[4];

      switch (messageType) {
        case 'data':
          await this.processSensorData(deviceId, mallId, payload);
          break;
        case 'status':
          await this.updateDeviceStatus(deviceId, payload);
          break;
        case 'alerts':
          await this.processDeviceAlert(deviceId, mallId, payload);
          break;
        case 'response':
          await this.processCommandResponse(deviceId, payload);
          break;
      }
    } catch (error) {
      logger.error('❌ Error processing MQTT message:', error);
    }
  }

  /**
   * Register new IoT device
   */
  async registerDevice(registration: DeviceRegistration): Promise<IoTDevice> {
    try {
      // Validate device ID uniqueness
      const existingDevice = await database
        .getRepository(IoTDevice)
        .findOne({ where: { deviceId: registration.deviceId } });

      if (existingDevice) {
        throw new Error(`Device with ID ${registration.deviceId} already exists`);
      }

      // Generate device certificate
      const certificate = await this.generateDeviceCertificate(registration.deviceId);

      // Create device entity
      const device = database.getRepository(IoTDevice).create({
        deviceId: registration.deviceId,
        mallId: registration.mallId,
        name: registration.name,
        type: registration.type,
        location: registration.location,
        configuration: registration.configuration,
        status: DeviceStatus.OFFLINE
      });

      const savedDevice = await database.getRepository(IoTDevice).save(device);

      // Store certificate
      this.deviceCertificates.set(registration.deviceId, certificate);

      // Cache device info
      await redis.setex(`device:${registration.deviceId}`, 3600, JSON.stringify({
        id: savedDevice.id,
        mallId: savedDevice.mallId,
        type: savedDevice.type,
        status: savedDevice.status
      }));

      logger.info(`✅ Device ${registration.deviceId} registered successfully`);
      this.emit('deviceRegistered', savedDevice);

      return savedDevice;
    } catch (error) {
      logger.error('❌ Failed to register device:', error);
      throw error;
    }
  }

  /**
   * Generate device certificate for authentication
   */
  private async generateDeviceCertificate(deviceId: string): Promise<string> {
    try {
      const privateKey = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
      });

      const certificate = {
        deviceId,
        publicKey: privateKey.publicKey,
        issuedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year
      };

      return JSON.stringify(certificate);
    } catch (error) {
      logger.error('❌ Failed to generate device certificate:', error);
      throw error;
    }
  }

  /**
   * Process sensor data from devices
   */
  async processSensorData(deviceId: string, mallId: string, data: any): Promise<void> {
    try {
      const sensorData = database.getRepository(SensorData).create({
        deviceId,
        mallId,
        sensorType: data.sensorType,
        timestamp: new Date(data.timestamp || Date.now()),
        data: {
          value: data.value,
          unit: data.unit,
          raw: data.raw,
          metadata: data.metadata
        },
        quality: this.assessDataQuality(data),
        location: data.location,
        tags: data.tags
      });

      await database.getRepository(SensorData).save(sensorData);

      // Cache recent data
      await redis.setex(
        `sensor:${deviceId}:${data.sensorType}`,
        300,
        JSON.stringify(sensorData)
      );

      // Emit real-time event
      this.emit('sensorData', sensorData);

      // Check for alerts
      await this.checkSensorAlerts(sensorData);

    } catch (error) {
      logger.error('❌ Failed to process sensor data:', error);
    }
  }

  /**
   * Assess data quality based on various factors
   */
  private assessDataQuality(data: any): DataQuality {
    // Implement data quality assessment logic
    if (data.value === null || data.value === undefined) {
      return DataQuality.ERROR;
    }

    if (data.confidence && data.confidence > 0.9) {
      return DataQuality.EXCELLENT;
    } else if (data.confidence && data.confidence > 0.7) {
      return DataQuality.GOOD;
    } else if (data.confidence && data.confidence > 0.5) {
      return DataQuality.FAIR;
    }

    return DataQuality.POOR;
  }

  /**
   * Update device status
   */
  async updateDeviceStatus(deviceId: string, status: any): Promise<void> {
    try {
      await database
        .getRepository(IoTDevice)
        .update(
          { deviceId },
          {
            status: status.status,
            lastSeen: new Date(),
            lastData: status.data
          }
        );

      // Update cache
      await redis.setex(`device:${deviceId}:status`, 300, JSON.stringify(status));

      this.emit('deviceStatusUpdate', { deviceId, status });
    } catch (error) {
      logger.error('❌ Failed to update device status:', error);
    }
  }

  /**
   * Send command to device
   */
  async sendDeviceCommand(command: DeviceCommand): Promise<void> {
    try {
      if (!this.mqttClient) {
        throw new Error('MQTT client not connected');
      }

      const topic = `mallos/devices/${command.deviceId}/commands`;
      const payload = {
        command: command.command,
        parameters: command.parameters,
        priority: command.priority || 'medium',
        timestamp: new Date().toISOString(),
        id: uuidv4()
      };

      this.mqttClient.publish(topic, JSON.stringify(payload));

      logger.info(`📤 Command sent to device ${command.deviceId}: ${command.command}`);
    } catch (error) {
      logger.error('❌ Failed to send device command:', error);
      throw error;
    }
  }

  /**
   * Get device information
   */
  async getDevice(deviceId: string): Promise<IoTDevice | null> {
    try {
      // Try cache first
      const cached = await redis.get(`device:${deviceId}`);
      if (cached) {
        return JSON.parse(cached);
      }

      // Get from database
      const device = await database
        .getRepository(IoTDevice)
        .findOne({ where: { deviceId } });

      if (device) {
        // Cache for 1 hour
        await redis.setex(`device:${deviceId}`, 3600, JSON.stringify(device));
      }

      return device;
    } catch (error) {
      logger.error('❌ Failed to get device:', error);
      throw error;
    }
  }

  /**
   * Get devices by mall
   */
  async getDevicesByMall(mallId: string, type?: DeviceType): Promise<IoTDevice[]> {
    try {
      const where: any = { mallId };
      if (type) where.type = type;

      return await database
        .getRepository(IoTDevice)
        .find({ where, order: { createdAt: 'DESC' } });
    } catch (error) {
      logger.error('❌ Failed to get devices by mall:', error);
      throw error;
    }
  }

  /**
   * Get sensor data for device
   */
  async getSensorData(
    deviceId: string,
    sensorType?: SensorType,
    startDate?: Date,
    endDate?: Date,
    limit: number = 1000
  ): Promise<SensorData[]> {
    try {
      const where: any = { deviceId };
      if (sensorType) where.sensorType = sensorType;
      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) where.timestamp.$gte = startDate;
        if (endDate) where.timestamp.$lte = endDate;
      }

      return await database
        .getRepository(SensorData)
        .find({
          where,
          order: { timestamp: 'DESC' },
          take: limit
        });
    } catch (error) {
      logger.error('❌ Failed to get sensor data:', error);
      throw error;
    }
  }

  /**
   * Load device certificates from storage
   */
  private async loadDeviceCertificates(): Promise<void> {
    try {
      const devices = await database
        .getRepository(IoTDevice)
        .find({ select: ['deviceId'] });

      for (const device of devices) {
        const certificate = await redis.get(`certificate:${device.deviceId}`);
        if (certificate) {
          this.deviceCertificates.set(device.deviceId, certificate);
        }
      }

      logger.info(`✅ Loaded ${this.deviceCertificates.size} device certificates`);
    } catch (error) {
      logger.error('❌ Failed to load device certificates:', error);
    }
  }

  /**
   * Start device monitoring
   */
  private async startDeviceMonitoring(): Promise<void> {
    // Monitor device health every 5 minutes
    setInterval(async () => {
      try {
        const devices = await database
          .getRepository(IoTDevice)
          .find({ where: { status: DeviceStatus.ONLINE } });

        const now = new Date();
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

        for (const device of devices) {
          if (device.lastSeen && device.lastSeen < fiveMinutesAgo) {
            await this.updateDeviceStatus(device.deviceId, {
              status: DeviceStatus.OFFLINE,
              reason: 'No heartbeat received'
            });
          }
        }
      } catch (error) {
        logger.error('❌ Device monitoring error:', error);
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Check sensor alerts
   */
  private async checkSensorAlerts(sensorData: SensorData): Promise<void> {
    try {
      // Implement alert checking logic based on thresholds
      const device = await this.getDevice(sensorData.deviceId);
      if (!device) return;

      const config = device.configuration?.alerts;
      if (!config) return;

      const threshold = config[sensorData.sensorType];
      if (!threshold) return;

      const value = sensorData.data.value;
      let alertTriggered = false;
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';

      if (threshold.min !== undefined && value < threshold.min) {
        alertTriggered = true;
        severity = threshold.severity || 'medium';
      } else if (threshold.max !== undefined && value > threshold.max) {
        alertTriggered = true;
        severity = threshold.severity || 'medium';
      }

      if (alertTriggered) {
        sensorData.alerts = {
          triggered: true,
          threshold: threshold.min || threshold.max,
          message: `Sensor ${sensorData.sensorType} value ${value} exceeded threshold`,
          severity
        };

        await database.getRepository(SensorData).save(sensorData);
        this.emit('sensorAlert', sensorData);
      }
    } catch (error) {
      logger.error('❌ Failed to check sensor alerts:', error);
    }
  }

  /**
   * Process device alert
   */
  private async processDeviceAlert(deviceId: string, mallId: string, alert: any): Promise<void> {
    try {
      this.emit('deviceAlert', { deviceId, mallId, alert });
      logger.warn(`⚠️ Device alert: ${deviceId} - ${alert.message}`);
    } catch (error) {
      logger.error('❌ Failed to process device alert:', error);
    }
  }

  /**
   * Process command response
   */
  private async processCommandResponse(deviceId: string, response: any): Promise<void> {
    try {
      this.emit('commandResponse', { deviceId, response });
      logger.info(`📥 Command response from ${deviceId}: ${response.status}`);
    } catch (error) {
      logger.error('❌ Failed to process command response:', error);
    }
  }

  /**
   * Get system statistics
   */
  async getStatistics(): Promise<any> {
    try {
      const totalDevices = await database
        .getRepository(IoTDevice)
        .count();

      const onlineDevices = await database
        .getRepository(IoTDevice)
        .count({ where: { status: DeviceStatus.ONLINE } });

      const totalReadings = await database
        .getRepository(SensorData)
        .count();

      const todayReadings = await database
        .getRepository(SensorData)
        .count({
          where: {
            timestamp: {
              $gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        });

      return {
        totalDevices,
        onlineDevices,
        offlineDevices: totalDevices - onlineDevices,
        totalReadings,
        todayReadings,
        uptime: process.uptime(),
        mqttConnected: this.mqttClient?.connected || false
      };
    } catch (error) {
      logger.error('❌ Failed to get statistics:', error);
      throw error;
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    try {
      if (this.mqttClient) {
        this.mqttClient.end();
      }
      this.isInitialized = false;
      logger.info('✅ IoT Service cleaned up');
    } catch (error) {
      logger.error('❌ Failed to cleanup IoT Service:', error);
    }
  }
}

// Export singleton instance
export const iotService = IoTService.getInstance(); 