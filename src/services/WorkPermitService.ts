import { Repository } from 'typeorm'
import { database } from '@/config/database'
import { WorkPermit, WorkPermitStatus, WorkPermitType, RiskLevel } from '@/models/WorkPermit'
import { Tenant } from '@/models/Tenant'
import { Mall } from '@/models/Mall'
import { User } from '@/models/User'
import { ApiError } from '@/utils/ApiError'
import { logger } from '@/utils/logger'

export class WorkPermitService {
  private workPermitRepository: Repository<WorkPermit>
  private tenantRepository: Repository<Tenant>
  private mallRepository: Repository<Mall>
  private userRepository: Repository<User>

  constructor() {
    this.workPermitRepository = database.getRepository(WorkPermit)
    this.tenantRepository = database.getRepository(Tenant)
    this.mallRepository = database.getRepository(Mall)
    this.userRepository = database.getRepository(User)
  }

  async getWorkPermits(options: {
    page: number
    limit: number
    filters?: any
  }) {
    const { page, limit, filters = {} } = options
    const skip = (page - 1) * limit

    const queryBuilder = this.workPermitRepository
      .createQueryBuilder('workPermit')
      .leftJoinAndSelect('workPermit.tenant', 'tenant')
      .leftJoinAndSelect('workPermit.mall', 'mall')
      .orderBy('workPermit.createdAt', 'DESC')

    // Apply filters
    if (filters.status) {
      queryBuilder.andWhere('workPermit.status = :status', { status: filters.status })
    }

    if (filters.type) {
      queryBuilder.andWhere('workPermit.type = :type', { type: filters.type })
    }

    if (filters.riskLevel) {
      queryBuilder.andWhere('workPermit.riskLevel = :riskLevel', { riskLevel: filters.riskLevel })
    }

    if (filters.tenantId) {
      queryBuilder.andWhere('workPermit.tenantId = :tenantId', { tenantId: filters.tenantId })
    }

    if (filters.mallId) {
      queryBuilder.andWhere('workPermit.mallId = :mallId', { mallId: filters.mallId })
    }

    if (filters.search) {
      queryBuilder.andWhere(
        '(workPermit.permitNumber ILIKE :search OR workPermit.workDescription ILIKE :search)',
        { search: `%${filters.search}%` }
      )
    }

    const [workPermits, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount()

    return {
      workPermits,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }

  async getWorkPermitById(id: string): Promise<WorkPermit | null> {
    return this.workPermitRepository.findOne({
      where: { id },
      relations: ['tenant', 'mall']
    })
  }

  async createWorkPermit(data: any, createdBy: string): Promise<WorkPermit> {
    // Validate tenant exists
    const tenant = await this.tenantRepository.findOne({
      where: { id: data.tenantId }
    })

    if (!tenant) {
      throw new ApiError(400, 'Tenant not found')
    }

    // Validate mall exists
    const mall = await this.mallRepository.findOne({
      where: { id: data.mallId }
    })

    if (!mall) {
      throw new ApiError(400, 'Mall not found')
    }

    // Validate dates
    if (new Date(data.startDate) >= new Date(data.endDate)) {
      throw new ApiError(400, 'End date must be after start date')
    }

    // Create work permit
    const workPermit = this.workPermitRepository.create({
      ...data,
      status: WorkPermitStatus.PENDING_APPROVAL
    })

    const savedWorkPermit = await this.workPermitRepository.save(workPermit)

    logger.info('Work permit created', {
      workPermitId: savedWorkPermit.id,
      createdBy,
      tenantId: data.tenantId,
      mallId: data.mallId
    })

    return savedWorkPermit
  }

  async updateWorkPermit(id: string, data: any, updatedBy: string): Promise<WorkPermit | null> {
    const workPermit = await this.workPermitRepository.findOne({
      where: { id }
    })

    if (!workPermit) {
      return null
    }

    // Check if work permit can be updated
    if (workPermit.status === WorkPermitStatus.COMPLETED) {
      throw new ApiError(400, 'Cannot update completed work permit')
    }

    // Validate dates if provided
    if (data.startDate && data.endDate) {
      if (new Date(data.startDate) >= new Date(data.endDate)) {
        throw new ApiError(400, 'End date must be after start date')
      }
    }

    // Update work permit
    Object.assign(workPermit, data)
    const updatedWorkPermit = await this.workPermitRepository.save(workPermit)

    logger.info('Work permit updated', {
      workPermitId: id,
      updatedBy,
      changes: Object.keys(data)
    })

    return updatedWorkPermit
  }

  async approveWorkPermit(id: string, approvedBy: string, comments?: string): Promise<WorkPermit | null> {
    const workPermit = await this.workPermitRepository.findOne({
      where: { id }
    })

    if (!workPermit) {
      return null
    }

    if (workPermit.status !== WorkPermitStatus.PENDING_APPROVAL) {
      throw new ApiError(400, 'Work permit is not pending approval')
    }

    workPermit.approve(approvedBy, comments)
    const approvedWorkPermit = await this.workPermitRepository.save(workPermit)

    logger.info('Work permit approved', {
      workPermitId: id,
      approvedBy,
      comments
    })

    return approvedWorkPermit
  }

  async rejectWorkPermit(id: string, rejectedBy: string, reason: string): Promise<WorkPermit | null> {
    const workPermit = await this.workPermitRepository.findOne({
      where: { id }
    })

    if (!workPermit) {
      return null
    }

    if (workPermit.status !== WorkPermitStatus.PENDING_APPROVAL) {
      throw new ApiError(400, 'Work permit is not pending approval')
    }

    workPermit.reject(rejectedBy, reason)
    const rejectedWorkPermit = await this.workPermitRepository.save(workPermit)

    logger.info('Work permit rejected', {
      workPermitId: id,
      rejectedBy,
      reason
    })

    return rejectedWorkPermit
  }

  async activateWorkPermit(id: string, activatedBy: string): Promise<WorkPermit | null> {
    const workPermit = await this.workPermitRepository.findOne({
      where: { id }
    })

    if (!workPermit) {
      return null
    }

    if (workPermit.status !== WorkPermitStatus.APPROVED) {
      throw new ApiError(400, 'Work permit must be approved before activation')
    }

    workPermit.activate(activatedBy)
    const activatedWorkPermit = await this.workPermitRepository.save(workPermit)

    logger.info('Work permit activated', {
      workPermitId: id,
      activatedBy
    })

    return activatedWorkPermit
  }

  async completeWorkPermit(id: string, completedBy: string, completionNotes?: string): Promise<WorkPermit | null> {
    const workPermit = await this.workPermitRepository.findOne({
      where: { id }
    })

    if (!workPermit) {
      return null
    }

    if (workPermit.status !== WorkPermitStatus.ACTIVE) {
      throw new ApiError(400, 'Work permit must be active to be completed')
    }

    workPermit.complete(completedBy, completionNotes)
    const completedWorkPermit = await this.workPermitRepository.save(workPermit)

    logger.info('Work permit completed', {
      workPermitId: id,
      completedBy,
      completionNotes
    })

    return completedWorkPermit
  }

  async cancelWorkPermit(id: string, cancelledBy: string, reason: string): Promise<WorkPermit | null> {
    const workPermit = await this.workPermitRepository.findOne({
      where: { id }
    })

    if (!workPermit) {
      return null
    }

    if (workPermit.status === WorkPermitStatus.COMPLETED) {
      throw new ApiError(400, 'Cannot cancel completed work permit')
    }

    workPermit.cancel(cancelledBy, reason)
    const cancelledWorkPermit = await this.workPermitRepository.save(workPermit)

    logger.info('Work permit cancelled', {
      workPermitId: id,
      cancelledBy,
      reason
    })

    return cancelledWorkPermit
  }

  async addInspection(id: string, inspectionData: any, addedBy: string): Promise<WorkPermit | null> {
    const workPermit = await this.workPermitRepository.findOne({
      where: { id }
    })

    if (!workPermit) {
      return null
    }

    workPermit.addInspection({
      ...inspectionData,
      addedBy
    })

    const updatedWorkPermit = await this.workPermitRepository.save(workPermit)

    logger.info('Inspection added to work permit', {
      workPermitId: id,
      addedBy,
      inspectionType: inspectionData.type
    })

    return updatedWorkPermit
  }

  async addIncident(id: string, incidentData: any, addedBy: string): Promise<WorkPermit | null> {
    const workPermit = await this.workPermitRepository.findOne({
      where: { id }
    })

    if (!workPermit) {
      return null
    }

    workPermit.addIncident({
      ...incidentData,
      addedBy
    })

    const updatedWorkPermit = await this.workPermitRepository.save(workPermit)

    logger.info('Incident added to work permit', {
      workPermitId: id,
      addedBy,
      severity: incidentData.severity
    })

    return updatedWorkPermit
  }

  async getWorkPermitStats() {
    const [
      total,
      pendingApproval,
      approved,
      active,
      completed,
      rejected,
      cancelled
    ] = await Promise.all([
      this.workPermitRepository.count(),
      this.workPermitRepository.count({ where: { status: WorkPermitStatus.PENDING_APPROVAL } }),
      this.workPermitRepository.count({ where: { status: WorkPermitStatus.APPROVED } }),
      this.workPermitRepository.count({ where: { status: WorkPermitStatus.ACTIVE } }),
      this.workPermitRepository.count({ where: { status: WorkPermitStatus.COMPLETED } }),
      this.workPermitRepository.count({ where: { status: WorkPermitStatus.REJECTED } }),
      this.workPermitRepository.count({ where: { status: WorkPermitStatus.CANCELLED } })
    ])

    // Get stats by type
    const byType = await this.workPermitRepository
      .createQueryBuilder('workPermit')
      .select('workPermit.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('workPermit.type')
      .getRawMany()

    // Get stats by risk level
    const byRiskLevel = await this.workPermitRepository
      .createQueryBuilder('workPermit')
      .select('workPermit.riskLevel', 'riskLevel')
      .addSelect('COUNT(*)', 'count')
      .groupBy('workPermit.riskLevel')
      .getRawMany()

    // Get stats by category
    const byCategory = await this.workPermitRepository
      .createQueryBuilder('workPermit')
      .select('workPermit.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .groupBy('workPermit.category')
      .getRawMany()

    return {
      total,
      pendingApproval,
      approved,
      active,
      completed,
      rejected,
      cancelled,
      byType: byType.reduce((acc, item) => {
        acc[item.type] = parseInt(item.count)
        return acc
      }, {} as any),
      byRiskLevel: byRiskLevel.reduce((acc, item) => {
        acc[item.risklevel] = parseInt(item.count)
        return acc
      }, {} as any),
      byCategory: byCategory.reduce((acc, item) => {
        acc[item.category] = parseInt(item.count)
        return acc
      }, {} as any)
    }
  }

  async deleteWorkPermit(id: string): Promise<boolean> {
    const workPermit = await this.workPermitRepository.findOne({
      where: { id }
    })

    if (!workPermit) {
      return false
    }

    await this.workPermitRepository.remove(workPermit)

    logger.info('Work permit deleted', {
      workPermitId: id
    })

    return true
  }

  async getOverdueWorkPermits(): Promise<WorkPermit[]> {
    const now = new Date()
    
    return this.workPermitRepository
      .createQueryBuilder('workPermit')
      .leftJoinAndSelect('workPermit.tenant', 'tenant')
      .leftJoinAndSelect('workPermit.mall', 'mall')
      .where('workPermit.endDate < :now', { now })
      .andWhere('workPermit.status IN (:...statuses)', {
        statuses: [WorkPermitStatus.APPROVED, WorkPermitStatus.ACTIVE]
      })
      .getMany()
  }

  async getExpiringWorkPermits(days: number = 3): Promise<WorkPermit[]> {
    const now = new Date()
    const expiryDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
    
    return this.workPermitRepository
      .createQueryBuilder('workPermit')
      .leftJoinAndSelect('workPermit.tenant', 'tenant')
      .leftJoinAndSelect('workPermit.mall', 'mall')
      .where('workPermit.endDate <= :expiryDate', { expiryDate })
      .andWhere('workPermit.endDate > :now', { now })
      .andWhere('workPermit.status IN (:...statuses)', {
        statuses: [WorkPermitStatus.APPROVED, WorkPermitStatus.ACTIVE]
      })
      .getMany()
  }

  async getWorkPermitsByTenant(tenantId: string, options: {
    page: number
    limit: number
    status?: WorkPermitStatus
  }) {
    const { page, limit, status } = options
    const skip = (page - 1) * limit

    const queryBuilder = this.workPermitRepository
      .createQueryBuilder('workPermit')
      .leftJoinAndSelect('workPermit.mall', 'mall')
      .where('workPermit.tenantId = :tenantId', { tenantId })
      .orderBy('workPermit.createdAt', 'DESC')

    if (status) {
      queryBuilder.andWhere('workPermit.status = :status', { status })
    }

    const [workPermits, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount()

    return {
      workPermits,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }

  async getWorkPermitsByMall(mallId: string, options: {
    page: number
    limit: number
    status?: WorkPermitStatus
  }) {
    const { page, limit, status } = options
    const skip = (page - 1) * limit

    const queryBuilder = this.workPermitRepository
      .createQueryBuilder('workPermit')
      .leftJoinAndSelect('workPermit.tenant', 'tenant')
      .where('workPermit.mallId = :mallId', { mallId })
      .orderBy('workPermit.createdAt', 'DESC')

    if (status) {
      queryBuilder.andWhere('workPermit.status = :status', { status })
    }

    const [workPermits, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount()

    return {
      workPermits,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }
} 