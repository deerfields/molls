/**
 * MallOS Enterprise - Blockchain Transaction Entity
 * Blockchain transaction tracking and management
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index
} from 'typeorm';

export enum TransactionType {
  LEASE_AGREEMENT = 'lease_agreement',
  PAYMENT = 'payment',
  LOYALTY_TOKEN = 'loyalty_token',
  CARBON_CREDIT = 'carbon_credit',
  SUPPLY_CHAIN = 'supply_chain',
  VOTING = 'voting',
  IDENTITY_VERIFICATION = 'identity_verification'
}

export enum TransactionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
  REVERTED = 'reverted'
}

@Entity('blockchain_transactions')
@Index(['transactionHash'], { unique: true })
@Index(['type', 'status'])
@Index(['mallId', 'timestamp'])
@Index(['timestamp'])
export class BlockchainTransaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 66, unique: true })
  transactionHash!: string;

  @Column({ type: 'uuid' })
  mallId!: string;

  @Column({
    type: 'enum',
    enum: TransactionType
  })
  type!: TransactionType;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING
  })
  status: TransactionStatus = TransactionStatus.PENDING;

  @Column({ type: 'timestamp' })
  timestamp!: Date;

  @Column({ type: 'jsonb' })
  data: {
    from?: string;
    to?: string;
    amount?: number;
    currency?: string;
    metadata?: any;
    contractAddress?: string;
    methodName?: string;
    parameters?: any[];
  } = {};

  @Column({ type: 'jsonb', nullable: true })
  blockchainInfo?: {
    blockNumber?: number;
    gasUsed?: number;
    gasPrice?: number;
    network?: string;
    confirmations?: number;
  };

  @Column({ type: 'jsonb', nullable: true })
  error?: {
    code?: string;
    message?: string;
    details?: any;
  };

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    tenantId?: string;
    userId?: string;
    description?: string;
    tags?: string[];
  };

  @Column({ type: 'boolean', default: false })
  isVerified: boolean = false;

  @Column({ type: 'timestamp', nullable: true })
  confirmedAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
} 