import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { IntegrationConfig } from './IntegrationConfig';

@Entity('external_mappings')
export class ExternalMapping {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => IntegrationConfig, config => config.mappings, { onDelete: 'CASCADE' })
  integrationConfig: IntegrationConfig;

  @Column()
  mallField: string;

  @Column()
  externalField: string;

  @Column({ nullable: true })
  transform?: string; // e.g., JSON for transformation rules
} 