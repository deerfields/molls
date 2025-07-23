import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
@Index(['tenantId', 'customerId', 'status', 'createdAt'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  stripePaymentId: string;

  @Column('decimal', { precision: 18, scale: 2 })
  amount: number;

  @Column({ length: 3 })
  currency: string;

  @Column({ length: 32 })
  status: string;

  @Column({ nullable: true })
  paymentMethod: string;

  @Column({ nullable: false })
  customerId: string;

  @Column({ nullable: false })
  tenantId: string;

  @Column({ nullable: true })
  description: string;

  @Column('jsonb', { nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 