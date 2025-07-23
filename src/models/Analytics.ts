/**
 * MallOS Enterprise - Analytics Entity
 * Analytics and reporting data
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index
} from 'typeorm';

@Entity('analytics')
@Index(['mallId', 'date'])
@Index(['type', 'date'])
export class Analytics {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  mallId!: string;

  @Column({ type: 'uuid', nullable: true })
  tenantId?: string;

  @Column({ length: 50 })
  type!: string;

  @Column({ type: 'date' })
  date!: Date;

  @Column({ type: 'jsonb' })
  data: any = {};

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
} 