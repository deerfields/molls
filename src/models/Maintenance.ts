/**
 * MallOS Enterprise - Maintenance Entity
 * Maintenance management with scheduling and tracking
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

export enum MaintenanceType {
  PREVENTIVE = 'preventive',
  CORRECTIVE = 'corrective',
  EMERGENCY = 'emergency',
  INSPECTION = 'inspection',
  REPAIR = 'repair',
  REPLACEMENT = 'replacement',
  UPGRADE = 'upgrade'
}

export enum MaintenanceStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  OVERDUE = 'overdue'
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

@Entity('maintenance')
@Index(['maintenanceNumber'], { unique: true })
@Index(['mallId', 'status'])
@Index(['scheduledDate', 'status'])
export class Maintenance {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 50, unique: true })
  @IsNotEmpty()
  maintenanceNumber!: string;

  @Column({ type: 'uuid' })
  mallId!: string;

  @Column({ type: 'uuid', nullable: true })
  @IsOptional()
  tenantId?: string;

  @Column({
    type: 'enum',
    enum: MaintenanceType,
    default: MaintenanceType.PREVENTIVE
  })
  @IsEnum(MaintenanceType)
  type: MaintenanceType = MaintenanceType.PREVENTIVE;

  @Column({
    type: 'enum',
    enum: MaintenanceStatus,
    default: MaintenanceStatus.SCHEDULED
  })
  @IsEnum(MaintenanceStatus)
  status: MaintenanceStatus = MaintenanceStatus.SCHEDULED;

  @Column({
    type: 'enum',
    enum: Priority,
    default: Priority.MEDIUM
  })
  @IsEnum(Priority)
  priority: Priority = Priority.MEDIUM;

  @Column({ length: 200 })
  @IsNotEmpty()
  title!: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  description?: string;

  @Column({ type: 'jsonb' })
  location: {
    area?: string;
    floor?: string;
    unit?: string;
    equipment?: string;
    coordinates?: { lat: number; lng: number };
  } = {};

  @Column({ type: 'timestamp' })
  scheduledDate!: Date;

  @Column({ type: 'timestamp', nullable: true })
  startDate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedDate?: Date;

  @Column({ type: 'jsonb', nullable: true })
  contractor: {
    name?: string;
    contact?: string;
    phone?: string;
    email?: string;
    license?: string;
    insurance?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  costs: {
    estimated?: number;
    actual?: number;
    currency?: string;
    breakdown?: Array<{
      item: string;
      cost: number;
      notes?: string;
    }>;
  };

  @Column({ type: 'jsonb', nullable: true })
  materials: Array<{
    name: string;
    quantity: number;
    unit: string;
    cost: number;
    supplier?: string;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  workOrder: {
    steps?: Array<{
      step: number;
      description: string;
      duration: string;
      assignedTo?: string;
    }>;
    safetyNotes?: string[];
    qualityChecks?: string[];
  };

  @Column({ type: 'jsonb', nullable: true })
  completion: {
    completedBy?: string;
    qualityCheck?: boolean;
    photos?: string[];
    notes?: string;
    nextMaintenance?: Date;
  };

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt?: Date;

  // Lifecycle hooks
  @BeforeInsert()
  generateMaintenanceNumber(): void {
    if (!this.maintenanceNumber) {
      this.maintenanceNumber = `MNT-${uuidv4().substring(0, 8).toUpperCase()}`;
    }
  }
} 