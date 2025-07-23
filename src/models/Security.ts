/**
 * MallOS Enterprise - Security Entity
 * Security incident management and monitoring
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  BeforeInsert
} from 'typeorm';
import { IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { v4 as uuidv4 } from 'uuid';

export enum IncidentType {
  THEFT = 'theft',
  VANDALISM = 'vandalism',
  TRESPASSING = 'trespassing',
  ASSAULT = 'assault',
  FIRE = 'fire',
  MEDICAL = 'medical',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  TRAFFIC_ACCIDENT = 'traffic_accident',
  OTHER = 'other'
}

export enum IncidentStatus {
  REPORTED = 'reported',
  INVESTIGATING = 'investigating',
  RESOLVED = 'resolved',
  CLOSED = 'closed'
}

export enum Severity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

@Entity('security')
@Index(['incidentNumber'], { unique: true })
@Index(['mallId', 'status'])
@Index(['incidentDate', 'type'])
export class Security {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 50, unique: true })
  @IsNotEmpty()
  incidentNumber!: string;

  @Column({ type: 'uuid' })
  mallId!: string;

  @Column({
    type: 'enum',
    enum: IncidentType,
    default: IncidentType.OTHER
  })
  @IsEnum(IncidentType)
  type: IncidentType = IncidentType.OTHER;

  @Column({
    type: 'enum',
    enum: IncidentStatus,
    default: IncidentStatus.REPORTED
  })
  @IsEnum(IncidentStatus)
  status: IncidentStatus = IncidentStatus.REPORTED;

  @Column({
    type: 'enum',
    enum: Severity,
    default: Severity.MEDIUM
  })
  @IsEnum(Severity)
  severity: Severity = Severity.MEDIUM;

  @Column({ length: 200 })
  @IsNotEmpty()
  title!: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  description?: string;

  @Column({ type: 'timestamp' })
  incidentDate!: Date;

  @Column({ type: 'jsonb' })
  location: {
    area?: string;
    floor?: string;
    unit?: string;
    coordinates?: { lat: number; lng: number };
  } = {};

  @Column({ type: 'jsonb', nullable: true })
  involved: {
    victims?: Array<{
      name: string;
      contact: string;
      injuries?: string;
    }>;
    suspects?: Array<{
      description: string;
      clothing?: string;
      direction?: string;
    }>;
    witnesses?: Array<{
      name: string;
      contact: string;
      statement?: string;
    }>;
  };

  @Column({ type: 'jsonb', nullable: true })
  response: {
    reportedBy: string;
    reportedAt: Date;
    firstResponder?: string;
    responseTime?: number;
    actions?: string[];
    authorities?: string[];
  };

  @Column({ type: 'jsonb', nullable: true })
  investigation: {
    investigator?: string;
    findings?: string[];
    evidence?: string[];
    photos?: string[];
    videos?: string[];
    statements?: Array<{
      person: string;
      statement: string;
      date: Date;
    }>;
  };

  @Column({ type: 'jsonb', nullable: true })
  resolution: {
    resolvedBy?: string;
    resolvedAt?: Date;
    outcome?: string;
    actions?: string[];
    followUp?: string;
  };

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt?: Date;

  // Lifecycle hooks
  @BeforeInsert()
  generateIncidentNumber(): void {
    if (!this.incidentNumber) {
      this.incidentNumber = `SEC-${uuidv4().substring(0, 8).toUpperCase()}`;
    }
  }
} 