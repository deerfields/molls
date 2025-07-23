import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn } from 'typeorm';

@Entity()
@Index(['tenantId', 'status', 'dueDate'])
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  stripeInvoiceId: string;

  @Column({ nullable: false })
  tenantId: string;

  @Column('decimal', { precision: 18, scale: 2 })
  amount: number;

  @Column({ length: 3 })
  currency: string;

  @Column('timestamp')
  dueDate: Date;

  @Column({ length: 32 })
  status: string;

  @Column({ nullable: true })
  paymentId: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  pdfUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column('timestamp', { nullable: true })
  paidAt: Date;
} 