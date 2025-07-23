import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn } from 'typeorm';

@Entity()
@Index(['customerId', 'isDefault'])
export class PaymentMethod {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  stripeMethodId: string;

  @Column({ nullable: false })
  customerId: string;

  @Column({ length: 32 })
  type: string;

  @Column({ length: 4, nullable: true })
  last4: string;

  @Column({ type: 'int', nullable: true })
  expiryMonth: number;

  @Column({ type: 'int', nullable: true })
  expiryYear: number;

  @Column({ length: 32, nullable: true })
  brand: string;

  @Column({ default: false })
  isDefault: boolean;

  @CreateDateColumn()
  createdAt: Date;
} 