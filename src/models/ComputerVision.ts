/**
 * MallOS Enterprise - Computer Vision Entity
 * Security camera analytics and computer vision insights
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index
} from 'typeorm';

export enum VisionType {
  FACIAL_RECOGNITION = 'facial_recognition',
  BEHAVIOR_ANALYSIS = 'behavior_analysis',
  CROWD_ANALYSIS = 'crowd_analysis',
  LICENSE_PLATE = 'license_plate',
  FIRE_SMOKE = 'fire_smoke',
  SOCIAL_DISTANCING = 'social_distancing',
  VIOLENCE_DETECTION = 'violence_detection',
  THEFT_PREVENTION = 'theft_prevention',
  VIP_RECOGNITION = 'vip_recognition',
  ANOMALY_DETECTION = 'anomaly_detection',
  OCCUPANCY_COUNTING = 'occupancy_counting',
  TRAFFIC_FLOW = 'traffic_flow'
}

export enum DetectionStatus {
  DETECTED = 'detected',
  VERIFIED = 'verified',
  FALSE_POSITIVE = 'false_positive',
  PENDING_REVIEW = 'pending_review',
  IGNORED = 'ignored'
}

export enum ThreatLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

@Entity('computer_vision')
@Index(['cameraId', 'timestamp'])
@Index(['type', 'status'])
@Index(['mallId', 'timestamp'])
@Index(['timestamp'])
export class ComputerVision {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  cameraId!: string;

  @Column({ type: 'uuid' })
  mallId!: string;

  @Column({
    type: 'enum',
    enum: VisionType
  })
  type!: VisionType;

  @Column({
    type: 'enum',
    enum: DetectionStatus,
    default: DetectionStatus.DETECTED
  })
  status: DetectionStatus = DetectionStatus.DETECTED;

  @Column({ type: 'timestamp' })
  timestamp!: Date;

  @Column({ type: 'jsonb' })
  detection: {
    confidence: number;
    boundingBox?: { x: number; y: number; width: number; height: number };
    landmarks?: any[];
    attributes?: Record<string, any>;
    objects?: any[];
  } = { confidence: 0 };

  @Column({ type: 'jsonb', nullable: true })
  facialData?: {
    faceId?: string;
    personId?: string;
    name?: string;
    age?: number;
    gender?: string;
    emotions?: Record<string, number>;
    features?: any[];
    matchConfidence?: number;
  };

  @Column({ type: 'jsonb', nullable: true })
  behaviorData?: {
    action?: string;
    duration?: number;
    trajectory?: any[];
    riskScore?: number;
    patterns?: string[];
  };

  @Column({ type: 'jsonb', nullable: true })
  crowdData?: {
    count?: number;
    density?: number;
    flow?: { direction: string; speed: number };
    heatmap?: any;
    bottlenecks?: any[];
  };

  @Column({ type: 'jsonb', nullable: true })
  securityData?: {
    threatLevel?: ThreatLevel;
    alertType?: string;
    description?: string;
    location?: { area: string; coordinates?: any };
    responseRequired?: boolean;
  };

  @Column({ type: 'jsonb', nullable: true })
  imageData?: {
    originalPath?: string;
    processedPath?: string;
    thumbnailPath?: string;
    metadata?: {
      resolution?: string;
      format?: string;
      size?: number;
      compression?: string;
    };
  };

  @Column({ type: 'jsonb', nullable: true })
  aiInsights?: {
    anomaly?: boolean;
    prediction?: any;
    recommendations?: string[];
    riskAssessment?: number;
  };

  @Column({ type: 'jsonb', nullable: true })
  alerts?: {
    triggered: boolean;
    message?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    acknowledged?: boolean;
    acknowledgedBy?: string;
    acknowledgedAt?: Date;
  };

  @Column({ type: 'jsonb', nullable: true })
  tags?: string[];

  @Column({ type: 'boolean', default: false })
  isProcessed: boolean = false;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    processingTime?: number;
    modelVersion?: string;
    algorithm?: string;
    quality?: number;
  };

  @CreateDateColumn()
  createdAt!: Date;
} 