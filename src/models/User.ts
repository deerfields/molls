/**
 * MallOS Enterprise - User Entity
 * User management with role-based access control
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  BeforeInsert,
  BeforeUpdate
} from 'typeorm';
import { IsEmail, IsNotEmpty, MinLength, IsEnum, IsOptional } from 'class-validator';
import bcrypt from 'bcryptjs';
import { config } from '@/config/config';

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  MALL_ADMIN = 'mall_admin',
  TENANT_ADMIN = 'tenant_admin',
  SECURITY_OFFICER = 'security_officer',
  MAINTENANCE_STAFF = 'maintenance_staff',
  FINANCIAL_OFFICER = 'financial_officer',
  ANALYTICS_SPECIALIST = 'analytics_specialist',
  IOT_ENGINEER = 'iot_engineer',
  AI_SPECIALIST = 'ai_specialist',
  BLOCKCHAIN_DEVELOPER = 'blockchain_developer',
  TENANT_USER = 'tenant_user',
  GUEST = 'guest'
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification',
  LOCKED = 'locked'
}

export enum UserType {
  INTERNAL = 'internal',
  TENANT = 'tenant',
  CONTRACTOR = 'contractor',
  VISITOR = 'visitor'
}

@Entity('users')
@Index(['email', 'tenantId'], { unique: true })
@Index(['phoneNumber', 'tenantId'])
@Index(['username', 'tenantId'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  tenantId: string;

  @Column({ length: 100 })
  @IsNotEmpty()
  firstName: string;

  @Column({ length: 100 })
  @IsNotEmpty()
  lastName: string;

  @Column({ length: 100, unique: true })
  @IsNotEmpty()
  username: string;

  @Column({ length: 255, unique: true })
  @IsEmail()
  email: string;

  @Column({ length: 20, nullable: true })
  @IsOptional()
  phoneNumber?: string;

  @Column({ type: 'text', select: false })
  @MinLength(8)
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.TENANT_USER
  })
  @IsEnum(UserRole)
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING_VERIFICATION
  })
  @IsEnum(UserStatus)
  status: UserStatus;

  @Column({
    type: 'enum',
    enum: UserType,
    default: UserType.TENANT
  })
  @IsEnum(UserType)
  type: UserType;

  @Column({ type: 'jsonb', nullable: true })
  profile: {
    avatar?: string;
    bio?: string;
    dateOfBirth?: Date;
    gender?: string;
    nationality?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      country?: string;
      postalCode?: string;
    };
    emergencyContact?: {
      name?: string;
      relationship?: string;
      phone?: string;
      email?: string;
    };
    preferences?: {
      language?: string;
      timezone?: string;
      notifications?: {
        email?: boolean;
        sms?: boolean;
        push?: boolean;
      };
    };
  };

  @Column({ type: 'jsonb', nullable: true })
  permissions: string[];

  @Column({ type: 'jsonb', nullable: true })
  settings: {
    theme?: 'light' | 'dark' | 'auto';
    dashboard?: {
      layout?: string;
      widgets?: string[];
    };
    security?: {
      twoFactorEnabled?: boolean;
      lastPasswordChange?: Date;
      passwordHistory?: string[];
    };
  };

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastActiveAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  emailVerifiedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  phoneVerifiedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  passwordChangedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  accountLockedAt?: Date;

  @Column({ type: 'text', nullable: true })
  lockReason?: string;

  @Column({ type: 'int', default: 0 })
  loginAttempts: number;

  @Column({ type: 'timestamp', nullable: true })
  lockoutUntil?: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    createdBy?: string;
    source?: string;
    tags?: string[];
    notes?: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt?: Date;

  // Virtual properties
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  get isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  get isLocked(): boolean {
    return this.status === UserStatus.LOCKED || 
           (this.lockoutUntil && this.lockoutUntil > new Date());
  }

  get isVerified(): boolean {
    return !!(this.emailVerifiedAt && this.phoneVerifiedAt);
  }

  // Lifecycle hooks
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword(): Promise<void> {
    if (this.password && this.password.length < 60) {
      this.password = await bcrypt.hash(this.password, config.auth.bcryptRounds);
    }
  }

  // Methods
  async comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
  }

  async incrementLoginAttempts(): Promise<void> {
    this.loginAttempts += 1;
    
    if (this.loginAttempts >= 5) {
      this.status = UserStatus.LOCKED;
      this.accountLockedAt = new Date();
      this.lockoutUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    }
  }

  async resetLoginAttempts(): Promise<void> {
    this.loginAttempts = 0;
    this.lockoutUntil = null;
  }

  async lockAccount(reason: string): Promise<void> {
    this.status = UserStatus.LOCKED;
    this.accountLockedAt = new Date();
    this.lockReason = reason;
  }

  async unlockAccount(): Promise<void> {
    this.status = UserStatus.ACTIVE;
    this.accountLockedAt = null;
    this.lockReason = null;
    this.loginAttempts = 0;
    this.lockoutUntil = null;
  }

  hasPermission(permission: string): boolean {
    return this.permissions?.includes(permission) || false;
  }

  hasRole(role: UserRole): boolean {
    return this.role === role;
  }

  canAccessTenant(tenantId: string): boolean {
    if (this.role === UserRole.SUPER_ADMIN) return true;
    return this.tenantId === tenantId;
  }
} 