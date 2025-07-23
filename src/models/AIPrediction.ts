/**
 * MallOS Enterprise - AI Prediction Entity
 * AI model predictions and forecasts storage
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
import { AIModel } from './AIModel';

export enum PredictionType {
  REVENUE_FORECAST = 'revenue_forecast',
  FOOT_TRAFFIC = 'foot_traffic',
  ENERGY_CONSUMPTION = 'energy_consumption',
  MAINTENANCE_SCHEDULE = 'maintenance_schedule',
  CROWD_DENSITY = 'crowd_density',
  PARKING_AVAILABILITY = 'parking_availability',
  TENANT_PERFORMANCE = 'tenant_performance',
  SECURITY_THREAT = 'security_threat',
  EQUIPMENT_FAILURE = 'equipment_failure',
  CUSTOMER_BEHAVIOR = 'customer_behavior',
  PRICING_OPTIMIZATION = 'pricing_optimization',
  ANOMALY_DETECTION = 'anomaly_detection'
}

export enum PredictionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  EXPIRED = 'expired'
}

@Entity('ai_predictions')
@Index(['modelId', 'timestamp'])
@Index(['type', 'status'])
@Index(['mallId', 'timestamp'])
@Index(['timestamp'])
export class AIPrediction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  modelId!: string;

  @Column({ type: 'uuid' })
  mallId!: string;

  @Column({
    type: 'enum',
    enum: PredictionType
  })
  type!: PredictionType;

  @Column({
    type: 'enum',
    enum: PredictionStatus,
    default: PredictionStatus.PENDING
  })
  status: PredictionStatus = PredictionStatus.PENDING;

  @Column({ type: 'timestamp' })
  timestamp!: Date;

  @Column({ type: 'timestamp', nullable: true })
  predictionDate?: Date;

  @Column({ type: 'jsonb' })
  input: {
    features: Record<string, any>;
    parameters?: any;
    context?: any;
  } = { features: {} };

  @Column({ type: 'jsonb' })
  output: {
    prediction: any;
    confidence?: number;
    probability?: number;
    range?: { min: number; max: number };
    alternatives?: any[];
  } = { prediction: null };

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    processingTime?: number;
    modelVersion?: string;
    algorithm?: string;
    features?: string[];
    preprocessing?: any;
  };

  @Column({ type: 'jsonb', nullable: true })
  accuracy?: {
    actualValue?: any;
    error?: number;
    accuracy?: number;
    validated?: boolean;
    validationDate?: Date;
  };

  @Column({ type: 'jsonb', nullable: true })
  alerts?: {
    triggered: boolean;
    threshold?: number;
    message?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
  };

  @Column({ type: 'jsonb', nullable: true })
  recommendations?: {
    actions?: string[];
    priority?: 'low' | 'medium' | 'high';
    impact?: 'positive' | 'negative' | 'neutral';
    confidence?: number;
  };

  @Column({ type: 'jsonb', nullable: true })
  tags?: string[];

  @Column({ type: 'boolean', default: false })
  isHistorical: boolean = false;

  @CreateDateColumn()
  createdAt!: Date;

  // Relations
  @ManyToOne(() => AIModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'modelId' })
  model?: AIModel;
} 