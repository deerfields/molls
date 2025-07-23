import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { IntegrationConfig } from './IntegrationConfig';
import { SyncLog } from './SyncLog';

@Entity('integration_errors')
export class IntegrationError {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => IntegrationConfig, config => config.errors, { onDelete: 'CASCADE' })
  integrationConfig: IntegrationConfig;

  @ManyToOne(() => SyncLog, log => log.errors, { onDelete: 'CASCADE' })
  syncLog: SyncLog;

  @Column()
  message: string;

  @Column('text', { nullable: true })
  stack?: string;

  @Column({ default: 'unresolved' })
  status: 'unresolved' | 'resolved';

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  resolvedAt?: Date;
} 