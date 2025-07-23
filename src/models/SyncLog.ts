import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { IntegrationConfig } from './IntegrationConfig';
import { IntegrationError } from './IntegrationError';

@Entity('sync_logs')
export class SyncLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => IntegrationConfig, config => config.syncLogs, { onDelete: 'CASCADE' })
  integrationConfig: IntegrationConfig;

  @Column()
  operation: string;

  @Column({ default: 'pending' })
  status: 'pending' | 'success' | 'failed';

  @Column({ nullable: true })
  details?: string;

  @CreateDateColumn()
  startedAt: Date;

  @Column({ nullable: true })
  finishedAt?: Date;

  @OneToMany(() => IntegrationError, error => error.syncLog)
  errors: IntegrationError[];
} 