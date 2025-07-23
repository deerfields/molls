import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity()
@Index(['tenantId', 'userId', 'email'])
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  stripeCustomerId: string;

  @Column({ nullable: false })
  userId: string;

  @Column({ nullable: false })
  tenantId: string;

  @Column({ nullable: false })
  email: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  defaultPaymentMethodId: string;
} 