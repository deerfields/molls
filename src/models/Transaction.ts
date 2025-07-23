import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity()
@Index(['paymentId', 'status', 'timestamp'])
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  paymentId: string;

  @Column({ length: 32 })
  type: string;

  @Column('decimal', { precision: 18, scale: 2 })
  amount: number;

  @Column('decimal', { precision: 18, scale: 2, nullable: true })
  fee: number;

  @Column({ length: 3 })
  currency: string;

  @Column({ length: 32 })
  status: string;

  @Column({ nullable: true })
  stripeTransactionId: string;

  @Column({ nullable: true })
  description: string;

  @Column('timestamp')
  timestamp: Date;
} 