import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity()
@Index(['tenantId', 'customerId', 'status', 'planId'])
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  stripeSubscriptionId: string;

  @Column({ nullable: false })
  customerId: string;

  @Column({ nullable: false })
  tenantId: string;

  @Column({ nullable: false })
  planId: string;

  @Column({ length: 32 })
  status: string;

  @Column({ length: 16 })
  billingCycle: string;

  @Column('decimal', { precision: 18, scale: 2 })
  amount: number;

  @Column({ length: 3 })
  currency: string;

  @Column('timestamp')
  startDate: Date;

  @Column('timestamp', { nullable: true })
  endDate: Date;

  @Column('timestamp', { nullable: true })
  nextBillingDate: Date;
} 