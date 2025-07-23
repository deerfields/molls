/**
 * MallOS Enterprise - Financial Entity
 * Financial management and accounting
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

export enum TransactionType {
  RENT = 'rent',
  MAINTENANCE = 'maintenance',
  UTILITIES = 'utilities',
  INSURANCE = 'insurance',
  TAX = 'tax',
  FINE = 'fine',
  DEPOSIT = 'deposit',
  REFUND = 'refund',
  OTHER = 'other'
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

@Entity('financial')
@Index(['transactionNumber'], { unique: true })
@Index(['mallId', 'tenantId'])
@Index(['transactionDate', 'type'])
export class Financial {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 50, unique: true })
  @IsNotEmpty()
  transactionNumber!: string;

  @Column({ type: 'uuid' })
  mallId!: string;

  @Column({ type: 'uuid', nullable: true })
  @IsOptional()
  tenantId?: string;

  @Column({
    type: 'enum',
    enum: TransactionType,
    default: TransactionType.OTHER
  })
  @IsEnum(TransactionType)
  type: TransactionType = TransactionType.OTHER;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING
  })
  @IsEnum(TransactionStatus)
  status: TransactionStatus = TransactionStatus.PENDING;

  @Column({ length: 200 })
  @IsNotEmpty()
  description!: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount!: number;

  @Column({ length: 3, default: 'AED' })
  currency!: string;

  @Column({ type: 'timestamp' })
  transactionDate!: Date;

  @Column({ type: 'timestamp', nullable: true })
  dueDate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  paidDate?: Date;

  @Column({ type: 'jsonb', nullable: true })
  payment: {
    method?: string;
    reference?: string;
    gateway?: string;
    fees?: number;
  };

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt?: Date;

  // Lifecycle hooks
  @BeforeInsert()
  generateTransactionNumber(): void {
    if (!this.transactionNumber) {
      this.transactionNumber = `FIN-${uuidv4().substring(0, 8).toUpperCase()}`;
    }
  }
} 