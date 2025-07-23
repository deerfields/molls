/**
 * MallOS Enterprise - Tenant Entity
 * Tenant management with multi-tenancy support
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
  BeforeInsert
} from 'typeorm';
import { IsNotEmpty, IsEmail, IsOptional, IsEnum } from 'class-validator';
import { v4 as uuidv4 } from 'uuid';

export enum TenantStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_APPROVAL = 'pending_approval',
  EXPIRED = 'expired'
}

export enum TenantType {
  RETAIL = 'retail',
  FOOD_BEVERAGE = 'food_beverage',
  ENTERTAINMENT = 'entertainment',
  SERVICES = 'services',
  OFFICE = 'office',
  WAREHOUSE = 'warehouse',
  PARKING = 'parking',
  OTHER = 'other'
}

export enum BusinessCategory {
  FASHION = 'fashion',
  ELECTRONICS = 'electronics',
  HOME_GOODS = 'home_goods',
  BEAUTY = 'beauty',
  SPORTS = 'sports',
  BOOKS = 'books',
  JEWELRY = 'jewelry',
  TOYS = 'toys',
  RESTAURANT = 'restaurant',
  CAFE = 'cafe',
  FAST_FOOD = 'fast_food',
  CINEMA = 'cinema',
  GAMING = 'gaming',
  FITNESS = 'fitness',
  BANKING = 'banking',
  PHARMACY = 'pharmacy',
  TELECOM = 'telecom',
  OTHER = 'other'
}

@Entity('tenants')
@Index(['tenantCode'], { unique: true })
@Index(['businessName', 'mallId'])
@Index(['email', 'mallId'])
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  mallId!: string;

  @Column({ length: 50, unique: true })
  @IsNotEmpty()
  tenantCode!: string;

  @Column({ length: 200 })
  @IsNotEmpty()
  businessName!: string;

  @Column({ length: 100, nullable: true })
  @IsOptional()
  tradingName?: string;

  @Column({
    type: 'enum',
    enum: TenantType,
    default: TenantType.RETAIL
  })
  @IsEnum(TenantType)
  type: TenantType = TenantType.RETAIL;

  @Column({
    type: 'enum',
    enum: BusinessCategory,
    default: BusinessCategory.OTHER
  })
  @IsEnum(BusinessCategory)
  category: BusinessCategory = BusinessCategory.OTHER;

  @Column({
    type: 'enum',
    enum: TenantStatus,
    default: TenantStatus.PENDING_APPROVAL
  })
  @IsEnum(TenantStatus)
  status: TenantStatus = TenantStatus.PENDING_APPROVAL;

  @Column({ length: 255 })
  @IsEmail()
  email!: string;

  @Column({ length: 20, nullable: true })
  @IsOptional()
  phoneNumber?: string;

  @Column({ length: 20, nullable: true })
  @IsOptional()
  faxNumber?: string;

  @Column({ length: 100, nullable: true })
  @IsOptional()
  website?: string;

  @Column({ type: 'jsonb' })
  contactPerson: {
    name: string;
    position: string;
    email: string;
    phone: string;
    mobile?: string;
  } = {
    name: '',
    position: '',
    email: '',
    phone: ''
  };

  @Column({ type: 'jsonb' })
  address: {
    unitNumber?: string;
    floor?: string;
    building?: string;
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  } = {
    street: '',
    city: '',
    state: '',
    country: '',
    postalCode: ''
  };

  @Column({ type: 'jsonb', nullable: true })
  businessDetails: {
    registrationNumber?: string;
    taxId?: string;
    licenseNumber?: string;
    insurancePolicy?: string;
    insuranceExpiry?: Date;
    businessHours?: {
      monday?: { open: string; close: string };
      tuesday?: { open: string; close: string };
      wednesday?: { open: string; close: string };
      thursday?: { open: string; close: string };
      friday?: { open: string; close: string };
      saturday?: { open: string; close: string };
      sunday?: { open: string; close: string };
    };
    specialties?: string[];
    brands?: string[];
    certifications?: string[];
  };

  @Column({ type: 'jsonb', nullable: true })
  leaseDetails: {
    leaseNumber?: string;
    startDate?: Date;
    endDate?: Date;
    rentAmount?: number;
    rentCurrency?: string;
    securityDeposit?: number;
    maintenanceFee?: number;
    utilitiesIncluded?: boolean;
    parkingSpaces?: number;
    storageSpace?: number;
    renewalTerms?: string;
    terminationClause?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  financialInfo: {
    bankName?: string;
    accountNumber?: string;
    routingNumber?: string;
    creditLimit?: number;
    paymentTerms?: string;
    taxExempt?: boolean;
    taxExemptionNumber?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  compliance: {
    tradeLicense?: {
      number?: string;
      expiryDate?: Date;
      status?: 'valid' | 'expired' | 'pending';
    };
    municipalityApproval?: {
      number?: string;
      expiryDate?: Date;
      status?: 'valid' | 'expired' | 'pending';
    };
    fireSafety?: {
      certificate?: string;
      expiryDate?: Date;
      status?: 'valid' | 'expired' | 'pending';
    };
    healthPermit?: {
      number?: string;
      expiryDate?: Date;
      status?: 'valid' | 'expired' | 'pending';
    };
    insurance?: {
      policyNumber?: string;
      expiryDate?: Date;
      coverage?: number;
      status?: 'valid' | 'expired' | 'pending';
    };
  };

  @Column({ type: 'jsonb', nullable: true })
  spaceDetails: {
    unitNumber?: string;
    floor?: string;
    area?: number;
    areaUnit?: 'sqft' | 'sqm';
    frontage?: number;
    depth?: number;
    height?: number;
    accessPoints?: number;
    loadingDock?: boolean;
    parkingSpaces?: number;
    storageArea?: number;
  };

  @Column({ type: 'jsonb', nullable: true })
  services: {
    utilities?: {
      electricity?: boolean;
      water?: boolean;
      gas?: boolean;
      internet?: boolean;
      phone?: boolean;
    };
    maintenance?: {
      included?: boolean;
      provider?: string;
      contact?: string;
    };
    security?: {
      included?: boolean;
      provider?: string;
      contact?: string;
    };
    cleaning?: {
      included?: boolean;
      provider?: string;
      contact?: string;
    };
  };

  @Column({ type: 'jsonb', nullable: true })
  marketing: {
    socialMedia?: {
      facebook?: string;
      instagram?: string;
      twitter?: string;
      linkedin?: string;
      tiktok?: string;
    };
    website?: string;
    description?: string;
    keywords?: string[];
    logo?: string;
    banner?: string;
    promotionalMaterials?: string[];
  };

  @Column({ type: 'jsonb', nullable: true })
  performance: {
    monthlySales?: number[];
    footTraffic?: number[];
    conversionRate?: number;
    averageTransaction?: number;
    customerSatisfaction?: number;
    rating?: number;
    reviews?: number;
  };

  @Column({ type: 'jsonb', nullable: true })
  settings: {
    notifications?: {
      email?: boolean;
      sms?: boolean;
      push?: boolean;
    };
    reporting?: {
      frequency?: 'daily' | 'weekly' | 'monthly';
      format?: 'pdf' | 'excel' | 'csv';
    };
    access?: {
      restrictedHours?: boolean;
      afterHoursAccess?: boolean;
      deliveryAccess?: boolean;
    };
  };

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    tags?: string[];
    notes?: string;
    createdBy?: string;
    source?: string;
    priority?: 'low' | 'medium' | 'high';
  };

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt?: Date;

  // Virtual properties
  get isActive(): boolean {
    return this.status === TenantStatus.ACTIVE;
  }

  get isExpired(): boolean {
    return this.status === TenantStatus.EXPIRED;
  }

  get isCompliant(): boolean {
    const compliance = this.compliance;
    if (!compliance) return false;

    const now = new Date();
    return (
      (!compliance.tradeLicense?.expiryDate || compliance.tradeLicense.expiryDate > now) &&
      (!compliance.municipalityApproval?.expiryDate || compliance.municipalityApproval.expiryDate > now) &&
      (!compliance.fireSafety?.expiryDate || compliance.fireSafety.expiryDate > now) &&
      (!compliance.healthPermit?.expiryDate || compliance.healthPermit.expiryDate > now) &&
      (!compliance.insurance?.expiryDate || compliance.insurance.expiryDate > now)
    );
  }

  get leaseStatus(): 'active' | 'expired' | 'pending' | 'terminated' {
    if (!this.leaseDetails?.startDate || !this.leaseDetails?.endDate) {
      return 'pending';
    }

    const now = new Date();
    const startDate = new Date(this.leaseDetails.startDate);
    const endDate = new Date(this.leaseDetails.endDate);

    if (now < startDate) return 'pending';
    if (now > endDate) return 'expired';
    return 'active';
  }

  // Lifecycle hooks
  @BeforeInsert()
  generateTenantCode(): void {
    if (!this.tenantCode) {
      this.tenantCode = `TNT-${uuidv4().substring(0, 8).toUpperCase()}`;
    }
  }

  // Methods
  updateStatus(status: TenantStatus): void {
    this.status = status;
  }

  updateCompliance(type: keyof typeof this.compliance, data: any): void {
    if (!this.compliance) {
      this.compliance = {};
    }
    this.compliance[type] = { ...this.compliance[type], ...data };
  }

  addPerformanceData(month: number, sales: number, traffic: number): void {
    if (!this.performance) {
      this.performance = { monthlySales: [], footTraffic: [] };
    }
    
    this.performance.monthlySales[month] = sales;
    this.performance.footTraffic[month] = traffic;
  }

  getAverageMonthlySales(): number {
    if (!this.performance?.monthlySales?.length) return 0;
    const sales = this.performance.monthlySales.filter(s => s > 0);
    return sales.length > 0 ? sales.reduce((a, b) => a + b, 0) / sales.length : 0;
  }

  getAverageFootTraffic(): number {
    if (!this.performance?.footTraffic?.length) return 0;
    const traffic = this.performance.footTraffic.filter(t => t > 0);
    return traffic.length > 0 ? traffic.reduce((a, b) => a + b, 0) / traffic.length : 0;
  }
} 