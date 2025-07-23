export enum DeviceType {
  SENSOR = 'sensor',
  CAMERA = 'camera',
  CONTROLLER = 'controller',
  GATEWAY = 'gateway',
  ACTUATOR = 'actuator'
}

export enum DeviceStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  MAINTENANCE = 'maintenance',
  ERROR = 'error'
}

export enum SensorType {
  TEMPERATURE = 'temperature',
  HUMIDITY = 'humidity',
  CO2 = 'co2',
  OCCUPANCY = 'occupancy',
  WATER_LEAK = 'water_leak',
  AIR_QUALITY = 'air_quality',
  ENERGY_CONSUMPTION = 'energy_consumption',
  PARKING_SENSOR = 'parking_sensor',
  CROWD_DENSITY = 'crowd_density',
  LIGHTING = 'lighting',
  HVAC = 'hvac',
  SECURITY = 'security',
  MAINTENANCE = 'maintenance',
  DIGITAL_SIGNAGE = 'digital_signage'
}

export enum DataQuality {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  ERROR = 'error'
}

export interface IoTDevice {
  id: string;
  deviceId: string;
  mallId: string;
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  location: {
    area?: string;
    floor?: string;
    coordinates?: { lat: number; lng: number };
  };
  configuration?: any;
  lastSeen?: Date;
  lastData?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface SensorData {
  id: string;
  deviceId: string;
  mallId: string;
  sensorType: SensorType;
  timestamp: Date;
  data: {
    value: number;
    unit?: string;
    raw?: any;
    processed?: any;
    metadata?: any;
  };
  quality: DataQuality;
  location?: {
    area?: string;
    floor?: string;
    coordinates?: { lat: number; lng: number };
    zone?: string;
  };
  alerts?: {
    triggered: boolean;
    threshold?: number;
    message?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
  };
  aiInsights?: {
    anomaly?: boolean;
    prediction?: number;
    confidence?: number;
    recommendations?: string[];
  };
  processed: boolean;
  tags?: string[];
  createdAt: Date;
}

export interface DeviceCommand {
  deviceId: string;
  command: string;
  parameters?: any;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  timeout?: number;
}

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
}

export interface IoTStats {
  totalDevices: number;
  onlineDevices: number;
  totalSensors: number;
  activeAlerts: number;
  dataPointsToday: number;
  averageResponseTime: number;
  energyConsumption: number;
  occupancyRate: number;
  airQualityIndex: number;
  parkingOccupancy: number;
}

export interface SensorAnalytics {
  temperatureTrends: { timestamp: Date; value: number }[];
  humidityTrends: { timestamp: Date; value: number }[];
  energyConsumption: { timestamp: Date; value: number }[];
  occupancyTrends: { timestamp: Date; value: number }[];
  airQualityTrends: { timestamp: Date; value: number }[];
  parkingTrends: { timestamp: Date; value: number }[];
  alertsByType: Record<string, number>;
  devicePerformance: { deviceId: string; uptime: number; dataQuality: number }[];
  energyEfficiency: {
    totalConsumption: number;
    savings: number;
    recommendations: string[];
  };
  predictiveInsights: {
    maintenanceSchedule: { deviceId: string; predictedDate: Date; confidence: number }[];
    energyForecast: { timestamp: Date; predictedValue: number }[];
    occupancyForecast: { timestamp: Date; predictedValue: number }[];
  };
} 