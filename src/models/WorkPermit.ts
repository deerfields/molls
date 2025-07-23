/**
 * MallOS Enterprise - Work Permit Entity
 * Work permit management with safety protocols
 */

import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, BeforeInsert } from 'typeorm'
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsObject, IsDate, IsUUID } from 'class-validator'
import { v4 as uuidv4 } from 'uuid'
import { Tenant } from './Tenant'
import { Mall } from './Mall'

export enum WorkPermitType {
  GENERAL = 'GENERAL',
  HOT_WORK = 'HOT_WORK',
  HIGH_LEVEL = 'HIGH_LEVEL',
  MEDIA = 'MEDIA',
  SPECIAL = 'SPECIAL'
}

export enum WorkPermitStatus {
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED'
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum WorkCategory {
  ELECTRICAL = 'ELECTRICAL',
  PLUMBING = 'PLUMBING',
  HVAC = 'HVAC',
  STRUCTURAL = 'STRUCTURAL',
  DECORATION = 'DECORATION',
  MAINTENANCE = 'MAINTENANCE',
  OTHER = 'OTHER'
}

@Entity('work_permits')
@Index(['permitNumber'], { unique: true })
export class WorkPermit {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ length: 50, unique: true })
  @IsNotEmpty()
  permitNumber!: string

  @Column({ type: 'uuid' })
  @IsUUID()
  tenantId!: string

  @Column({ type: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  contractorId?: string

  @Column({ type: 'uuid' })
  @IsUUID()
  mallId!: string

  @Column({ type: 'enum', enum: WorkPermitType, default: WorkPermitType.GENERAL })
  @IsEnum(WorkPermitType)
  type: WorkPermitType = WorkPermitType.GENERAL

  @Column({ type: 'enum', enum: WorkPermitStatus, default: WorkPermitStatus.PENDING_APPROVAL })
  @IsEnum(WorkPermitStatus)
  status: WorkPermitStatus = WorkPermitStatus.PENDING_APPROVAL

  @Column({ type: 'enum', enum: RiskLevel, default: RiskLevel.LOW })
  @IsEnum(RiskLevel)
  riskLevel: RiskLevel = RiskLevel.LOW

  @Column({ type: 'enum', enum: WorkCategory, default: WorkCategory.OTHER })
  @IsEnum(WorkCategory)
  category: WorkCategory = WorkCategory.OTHER

  @Column({ type: 'text' })
  @IsNotEmpty()
  @IsString()
  workDescription!: string

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  detailedDescription?: string

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsObject()
  location?: any

  @Column({ type: 'timestamp' })
  @IsDate()
  startDate!: Date

  @Column({ type: 'timestamp' })
  @IsDate()
  endDate!: Date

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsObject()
  workSchedule?: any

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsObject()
  personnel?: any

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsObject()
  equipment?: any

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsObject()
  safetyMeasures?: any

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsObject()
  riskAssessment?: any

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsObject()
  methodStatement?: any

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsObject()
  approvals?: any

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsObject()
  inspections?: any

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsObject()
  incidents?: any

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsObject()
  compliance?: any

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsObject()
  costs?: any

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsObject()
  documents?: any

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsObject()
  notifications?: any

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsObject()
  completion?: any

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsObject()
  metadata?: any

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date

  // Relationships
  @ManyToOne(() => Tenant, tenant => tenant.workPermits)
  @JoinColumn({ name: 'tenant_id' })
  tenant?: Tenant

  @ManyToOne(() => Mall, mall => mall.workPermits)
  @JoinColumn({ name: 'mall_id' })
  mall?: Mall

  // Virtual properties
  get isPending(): boolean {
    return this.status === WorkPermitStatus.PENDING_APPROVAL
  }

  get isApproved(): boolean {
    return this.status === WorkPermitStatus.APPROVED
  }

  get isActive(): boolean {
    return this.status === WorkPermitStatus.ACTIVE
  }

  get isCompleted(): boolean {
    return this.status === WorkPermitStatus.COMPLETED
  }

  get isRejected(): boolean {
    return this.status === WorkPermitStatus.REJECTED
  }

  get isCancelled(): boolean {
    return this.status === WorkPermitStatus.CANCELLED
  }

  get isHighRisk(): boolean {
    return this.riskLevel === RiskLevel.HIGH || this.riskLevel === RiskLevel.CRITICAL
  }

  get isHotWork(): boolean {
    return this.type === WorkPermitType.HOT_WORK
  }

  get isHighLevel(): boolean {
    return this.type === WorkPermitType.HIGH_LEVEL
  }

  get duration(): number {
    const start = new Date(this.startDate)
    const end = new Date(this.endDate)
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  }

  get isOverdue(): boolean {
    return this.endDate < new Date() && this.status !== WorkPermitStatus.COMPLETED
  }

  get isExpiringSoon(): boolean {
    const now = new Date()
    const end = new Date(this.endDate)
    const daysUntilExpiry = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry <= 3 && daysUntilExpiry > 0
  }

  // Lifecycle hooks
  @BeforeInsert()
  generatePermitNumber(): void {
    if (!this.permitNumber) {
      const year = new Date().getFullYear()
      const random = uuidv4().substring(0, 6).toUpperCase()
      this.permitNumber = `WP-${year}-${random}`
    }
  }

  // Methods
  approve(approvedBy: string, comments?: string): void {
    this.status = WorkPermitStatus.APPROVED
    if (!this.approvals) {
      this.approvals = []
    }
    this.approvals.push({
      role: 'Approver',
      name: approvedBy,
      date: new Date().toISOString(),
      status: 'Approved',
      comments
    })
  }

  reject(rejectedBy: string, reason: string): void {
    this.status = WorkPermitStatus.REJECTED
    if (!this.approvals) {
      this.approvals = []
    }
    this.approvals.push({
      role: 'Rejector',
      name: rejectedBy,
      date: new Date().toISOString(),
      status: 'Rejected',
      reason
    })
  }

  activate(activatedBy: string): void {
    this.status = WorkPermitStatus.ACTIVE
    if (!this.approvals) {
      this.approvals = []
    }
    this.approvals.push({
      role: 'Activator',
      name: activatedBy,
      date: new Date().toISOString(),
      status: 'Activated'
    })
  }

  complete(completedBy: string, completionNotes?: string): void {
    this.status = WorkPermitStatus.COMPLETED
    this.completion = {
      completedBy,
      completedAt: new Date().toISOString(),
      notes: completionNotes
    }
  }

  cancel(cancelledBy: string, reason: string): void {
    this.status = WorkPermitStatus.CANCELLED
    if (!this.approvals) {
      this.approvals = []
    }
    this.approvals.push({
      role: 'Canceller',
      name: cancelledBy,
      date: new Date().toISOString(),
      status: 'Cancelled',
      reason
    })
  }

  addInspection(inspection: any): void {
    if (!this.inspections) {
      this.inspections = []
    }
    this.inspections.push({
      ...inspection,
      date: new Date().toISOString()
    })
  }

  addIncident(incident: any): void {
    if (!this.incidents) {
      this.incidents = []
    }
    this.incidents.push({
      ...incident,
      date: new Date().toISOString()
    })
  }

  updateRiskAssessment(assessment: any): void {
    this.riskAssessment = { ...this.riskAssessment, ...assessment }
  }

  updateMethodStatement(statement: any): void {
    this.methodStatement = { ...this.methodStatement, ...statement }
  }

  updateSafetyMeasures(measures: string[]): void {
    this.safetyMeasures = measures
  }

  updatePersonnel(personnel: any[]): void {
    this.personnel = personnel
  }

  updateEquipment(equipment: string[]): void {
    this.equipment = equipment
  }

  updateWorkSchedule(schedule: any): void {
    this.workSchedule = schedule
  }

  updateCosts(costs: any): void {
    this.costs = { ...this.costs, ...costs }
  }

  addDocument(document: any): void {
    if (!this.documents) {
      this.documents = []
    }
    this.documents.push({
      ...document,
      uploadedAt: new Date().toISOString()
    })
  }

  addNotification(notification: any): void {
    if (!this.notifications) {
      this.notifications = []
    }
    this.notifications.push({
      ...notification,
      sentAt: new Date().toISOString()
    })
  }

  updateCompliance(compliance: any): void {
    this.compliance = { ...this.compliance, ...compliance }
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