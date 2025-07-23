/**
 * MallOS Enterprise - Mall Entity
 * Mall management with comprehensive facility details
 */

import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm'
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsObject } from 'class-validator'
import { Tenant } from './Tenant'

export enum MallType {
  SHOPPING_CENTER = 'SHOPPING_CENTER',
  RETAIL_PARK = 'RETAIL_PARK',
  MIXED_USE = 'MIXED_USE',
  OUTLET = 'OUTLET'
}

export enum MallClass {
  PREMIUM = 'PREMIUM',
  STANDARD = 'STANDARD',
  ECONOMY = 'ECONOMY'
}

export enum MallStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  UNDER_CONSTRUCTION = 'UNDER_CONSTRUCTION',
  CLOSED = 'CLOSED'
}

@Entity('malls')
@Index(['mallCode'], { unique: true })
export class Mall {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ length: 50, unique: true })
  @IsNotEmpty()
  mallCode!: string

  @Column({ length: 200 })
  @IsNotEmpty()
  name!: string

  @Column({ length: 200, nullable: true })
  @IsOptional()
  @IsString()
  tradingName?: string

  @Column({ type: 'enum', enum: MallType, default: MallType.SHOPPING_CENTER })
  @IsEnum(MallType)
  type: MallType = MallType.SHOPPING_CENTER

  @Column({ type: 'enum', enum: MallClass, default: MallClass.STANDARD })
  @IsEnum(MallClass)
  class: MallClass = MallClass.STANDARD

  @Column({ type: 'enum', enum: MallStatus, default: MallStatus.ACTIVE })
  @IsEnum(MallStatus)
  status: MallStatus = MallStatus.ACTIVE

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsObject()
  location?: any

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsObject()
  contact?: any

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsObject()
  facilityDetails?: any

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsObject()
  operatingHours?: any

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsObject()
  amenities?: any

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsObject()
  tenantMix?: any

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsObject()
  financial?: any

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsObject()
  performance?: any

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsObject()
  marketing?: any

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsObject()
  compliance?: any

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsObject()
  maintenance?: any

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsObject()
  security?: any

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsObject()
  technology?: any

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsObject()
  sustainability?: any

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsObject()
  accessibility?: any

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsObject()
  settings?: any

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsObject()
  metadata?: any

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date

  // Virtual properties
  get isActive(): boolean {
    return this.status === MallStatus.ACTIVE
  }

  get isUnderConstruction(): boolean {
    return this.status === MallStatus.UNDER_CONSTRUCTION
  }

  get isClosed(): boolean {
    return this.status === MallStatus.CLOSED
  }

  get isPremium(): boolean {
    return this.class === MallClass.PREMIUM
  }

  get isStandard(): boolean {
    return this.class === MallClass.STANDARD
  }

  get isEconomy(): boolean {
    return this.class === MallClass.ECONOMY
  }

  // Relationships
  @OneToMany(() => Tenant, tenant => tenant.mall)
  tenants?: Tenant[]

  // Methods
  updateStatus(status: MallStatus): void {
    this.status = status
  }

  updateClass(mallClass: MallClass): void {
    this.class = mallClass
  }

  updateType(type: MallType): void {
    this.type = type
  }

  addAmenity(amenity: string): void {
    if (!this.amenities) {
      this.amenities = []
    }
    if (!this.amenities.includes(amenity)) {
      this.amenities.push(amenity)
    }
  }

  removeAmenity(amenity: string): void {
    if (this.amenities) {
      this.amenities = this.amenities.filter(a => a !== amenity)
    }
  }

  updateOperatingHours(day: string, hours: { open: string; close: string }): void {
    if (!this.operatingHours) {
      this.operatingHours = {}
    }
    this.operatingHours[day] = hours
  }

  updatePerformanceMetrics(metrics: any): void {
    this.performance = { ...this.performance, ...metrics }
  }

  updateFinancialData(data: any): void {
    this.financial = { ...this.financial, ...data }
  }

  updateComplianceStatus(compliance: any): void {
    this.compliance = { ...this.compliance, ...compliance }
  }

  updateSecuritySettings(security: any): void {
    this.security = { ...this.security, ...security }
  }

  updateTechnologySettings(technology: any): void {
    this.technology = { ...this.technology, ...technology }
  }

  updateSustainabilitySettings(sustainability: any): void {
    this.sustainability = { ...this.sustainability, ...sustainability }
  }

  updateAccessibilitySettings(accessibility: any): void {
    this.accessibility = { ...this.accessibility, ...accessibility }
  }

  updateSettings(settings: any): void {
    this.settings = { ...this.settings, ...settings }
  }

  addMetadata(key: string, value: any): void {
    if (!this.metadata) {
      this.metadata = {}
    }
    this.metadata[key] = value
  }

  removeMetadata(key: string): void {
    if (this.metadata && this.metadata[key]) {
      delete this.metadata[key]
    }
  }
} 