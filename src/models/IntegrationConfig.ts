import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { SyncLog } from './SyncLog';
import { ExternalMapping } from './ExternalMapping';
import { IntegrationError } from './IntegrationError';
import crypto from 'crypto';

@Entity('integration_configs')
export class IntegrationConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column()
  type: string;

  @Column('text')
  private encryptedCredentials: string;

  @Column({ nullable: true })
  accessToken?: string;

  @Column({ nullable: true })
  refreshToken?: string;

  @Column({ nullable: true })
  tokenExpiry?: Date;

  @Column({ default: 'disconnected' })
  status: 'connected' | 'disconnected' | 'error';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => SyncLog, log => log.integrationConfig)
  syncLogs: SyncLog[];

  @OneToMany(() => ExternalMapping, mapping => mapping.integrationConfig)
  mappings: ExternalMapping[];

  @OneToMany(() => IntegrationError, error => error.integrationConfig)
  errors: IntegrationError[];

  setCredentials(creds: Record<string, any>) {
    const str = JSON.stringify(creds);
    const cipher = crypto.createCipher('aes-256-ctr', process.env.INTEGRATION_SECRET_KEY || 'integration-secret-key');
    let crypted = cipher.update(str, 'utf8', 'hex');
    crypted += cipher.final('hex');
    this.encryptedCredentials = crypted;
  }

  getCredentials(): Record<string, any> {
    if (!this.encryptedCredentials) return {};
    const decipher = crypto.createDecipher('aes-256-ctr', process.env.INTEGRATION_SECRET_KEY || 'integration-secret-key');
    let dec = decipher.update(this.encryptedCredentials, 'hex', 'utf8');
    dec += decipher.final('utf8');
    return JSON.parse(dec);
  }
} 