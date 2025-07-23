/**
 * MallOS Enterprise - Sensor Data Entity
 * Time-series optimized sensor data storage for IoT devices
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { IoTDevice } from './IoTDevice';

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

@Entity('sensor_data')
@Index(['deviceId', 'timestamp'])
@Index(['sensorType', 'timestamp'])
@Index(['mallId', 'timestamp'])
@Index(['timestamp'])
export class SensorData {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  deviceId!: string;

  @Column({ type: 'uuid' })
  mallId!: string;

  @Column({
    type: 'enum',
    enum: SensorType
  })
  sensorType!: SensorType;

  @Column({ type: 'timestamp' })
  timestamp!: Date;

  @Column({ type: 'jsonb' })
  data: {
    value: number;
    unit?: string;
    raw?: any;
    processed?: any;
    metadata?: any;
  } = { value: 0 };

  @Column({
    type: 'enum',
    enum: DataQuality,
    default: DataQuality.GOOD
  })
  quality: DataQuality = DataQuality.GOOD;

  @Column({ type: 'jsonb', nullable: true })
  location?: {
    area?: string;
    floor?: string;
    coordinates?: { lat: number; lng: number };
    zone?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  alerts?: {
    triggered: boolean;
    threshold?: number;
    message?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
  };

  @Column({ type: 'jsonb', nullable: true })
  aiInsights?: {
    anomaly?: boolean;
    prediction?: number;
    confidence?: number;
    recommendations?: string[];
  };

  @Column({ type: 'boolean', default: false })
  processed: boolean = false;

  @Column({ type: 'jsonb', nullable: true })
  tags?: string[];

  @CreateDateColumn()
  createdAt!: Date;

  // Relations
  @ManyToOne(() => IoTDevice, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'deviceId' })
  device?: IoTDevice;
} 