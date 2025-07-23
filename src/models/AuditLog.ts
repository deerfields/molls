/**
 * MallOS Enterprise - Audit Log Entity
 * System audit logging for compliance and security
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ nullable: true })
  userId?: string;

  @Column({ nullable: true })
  userRole?: string;

  @Column({ nullable: true })
  username?: string;

  @Index()
  @Column({ nullable: true })
  tenantId?: string;

  @Column({ nullable: true })
  ipAddress?: string;

  @Column({ nullable: true })
  userAgent?: string;

  @Index()
  @Column({ nullable: true })
  requestId?: string;

  @Column()
  endpoint: string;

  @Column()
  method: string;

  @Column()
  action: string;

  @Column({ nullable: true })
  resource?: string;

  @Column({ nullable: true })
  resourceId?: string;

  @Column({ nullable: true })
  resourceType?: string;

  @Column('jsonb', { nullable: true })
  oldValues?: any;

  @Column('jsonb', { nullable: true })
  newValues?: any;

  @CreateDateColumn()
  timestamp: Date;

  @Column({ nullable: true })
  duration?: number;

  @Column({ default: true })
  success: boolean;

  @Column({ nullable: true })
  errorMessage?: string;
} 