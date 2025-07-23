/**
 * MallOS Enterprise - Notification Entity
 * System notifications and alerts management
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index
} from 'typeorm';

export enum NotificationType {
  SYSTEM = 'system',
  SECURITY = 'security',
  MAINTENANCE = 'maintenance',
  FINANCIAL = 'financial',
  IOT_ALERT = 'iot_alert',
  AI_INSIGHT = 'ai_insight',
  COMPUTER_VISION = 'computer_vision',
  TENANT = 'tenant',
  USER = 'user'
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  READ = 'read',
  FAILED = 'failed'
}

@Entity('notifications')
@Index(['userId', 'status'])
@Index(['type', 'priority'])
@Index(['mallId', 'timestamp'])
@Index(['timestamp'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'uuid' })
  mallId!: string;

  @Column({
    type: 'enum',
    enum: NotificationType
  })
  type!: NotificationType;

  @Column({
    type: 'enum',
    enum: NotificationPriority,
    default: NotificationPriority.MEDIUM
  })
  priority: NotificationPriority = NotificationPriority.MEDIUM;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.PENDING
  })
  status: NotificationStatus = NotificationStatus.PENDING;

  @Column({ length: 200 })
  title!: string;

  @Column({ type: 'text' })
  message!: string;

  @Column({ type: 'timestamp' })
  timestamp!: Date;

  @Column({ type: 'jsonb', nullable: true })
  data?: {
    actionUrl?: string;
    actionText?: string;
    metadata?: any;
    attachments?: string[];
  };

  @Column({ type: 'jsonb', nullable: true })
  deliveryInfo?: {
    email?: boolean;
    sms?: boolean;
    push?: boolean;
    inApp?: boolean;
    sentAt?: Date;
    deliveredAt?: Date;
    readAt?: Date;
  };

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    sourceId?: string;
    sourceType?: string;
    tags?: string[];
    category?: string;
  };

  @Column({ type: 'boolean', default: false })
  isRead: boolean = false;

  @Column({ type: 'timestamp', nullable: true })
  readAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
} 