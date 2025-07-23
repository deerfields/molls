/**
 * MallOS Enterprise - AI Model Entity
 * Machine learning model management and versioning
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index
} from 'typeorm';

export enum ModelType {
  PREDICTION = 'prediction',
  CLASSIFICATION = 'classification',
  ANOMALY_DETECTION = 'anomaly_detection',
  COMPUTER_VISION = 'computer_vision',
  NLP = 'nlp',
  RECOMMENDATION = 'recommendation',
  FORECASTING = 'forecasting'
}

export enum ModelStatus {
  TRAINING = 'training',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DEPRECATED = 'deprecated',
  ERROR = 'error'
}

export enum ModelFramework {
  TENSORFLOW = 'tensorflow',
  PYTORCH = 'pytorch',
  SCIKIT_LEARN = 'scikit_learn',
  OPENCV = 'opencv',
  FACE_API = 'face_api',
  CUSTOM = 'custom'
}

@Entity('ai_models')
@Index(['name', 'version'])
@Index(['type', 'status'])
@Index(['mallId', 'status'])
export class AIModel {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 100 })
  name!: string;

  @Column({ length: 20 })
  version!: string;

  @Column({ type: 'uuid' })
  mallId!: string;

  @Column({
    type: 'enum',
    enum: ModelType
  })
  type!: ModelType;

  @Column({
    type: 'enum',
    enum: ModelFramework
  })
  framework!: ModelFramework;

  @Column({
    type: 'enum',
    enum: ModelStatus,
    default: ModelStatus.INACTIVE
  })
  status: ModelStatus = ModelStatus.INACTIVE;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'jsonb' })
  configuration: {
    inputShape?: number[];
    outputShape?: number[];
    layers?: any[];
    hyperparameters?: any;
    preprocessing?: any;
    postprocessing?: any;
  } = {};

  @Column({ type: 'jsonb' })
  metrics: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1Score?: number;
    mse?: number;
    mae?: number;
    custom?: any;
  } = {};

  @Column({ type: 'jsonb', nullable: true })
  trainingData?: {
    startDate?: Date;
    endDate?: Date;
    samples?: number;
    features?: string[];
    validationSplit?: number;
  };

  @Column({ type: 'jsonb', nullable: true })
  deployment?: {
    endpoint?: string;
    environment?: string;
    resources?: {
      cpu?: number;
      memory?: number;
      gpu?: boolean;
    };
    scaling?: {
      minInstances?: number;
      maxInstances?: number;
    };
  };

  @Column({ type: 'jsonb', nullable: true })
  performance?: {
    latency?: number;
    throughput?: number;
    errorRate?: number;
    lastUpdated?: Date;
  };

  @Column({ type: 'jsonb', nullable: true })
  modelFile?: {
    path?: string;
    size?: number;
    checksum?: string;
    format?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  dependencies?: {
    packages?: string[];
    versions?: Record<string, string>;
  };

  @Column({ type: 'jsonb', nullable: true })
  tags?: string[];

  @Column({ type: 'boolean', default: false })
  isProduction: boolean = false;

  @Column({ type: 'uuid', nullable: true })
  parentModelId?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
} 