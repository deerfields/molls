import { Router, Request, Response } from 'express'
import { validate } from '@/middleware/validation'
import { authenticate, authorize } from '@/middleware/auth'
import { WorkPermitService } from '@/services/WorkPermitService'
import { NotificationService } from '@/services/NotificationService'
import { workPermitSchema, updateWorkPermitSchema, approveWorkPermitSchema } from '@/validators/workPermit'
import { logger } from '@/utils/logger'
import { ApiError } from '@/utils/ApiError'

const router = Router()
const workPermitService = new WorkPermitService()
const notificationService = new NotificationService()

/**
 * @swagger
 * /api/work-permits:
 *   get:
 *     summary: Get all work permits with filtering and pagination
 *     tags: [Work Permits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING_APPROVAL, APPROVED, ACTIVE, COMPLETED, REJECTED, CANCELLED]
 *         description: Filter by status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [GENERAL, HOT_WORK, HIGH_LEVEL, MEDIA, SPECIAL]
 *         description: Filter by type
 *       - in: query
 *         name: riskLevel
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *         description: Filter by risk level
 *       - in: query
 *         name: tenantId
 *         schema:
 *           type: string
 *         description: Filter by tenant ID
 *       - in: query
 *         name: mallId
 *         schema:
 *           type: string
 *         description: Filter by mall ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in permit number and description
 *     responses:
 *       200:
 *         description: List of work permits
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 workPermits:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/WorkPermit'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, status, type, riskLevel, tenantId, mallId, search } = req.query
    const filters = { status, type, riskLevel, tenantId, mallId, search }
    
    const result = await workPermitService.getWorkPermits({
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      filters
    })

    logger.info('Work permits retrieved successfully', { 
      userId: req.user?.id, 
      filters,
      count: result.workPermits.length 
    })

    res.json(result)
  } catch (error) {
    logger.error('Error retrieving work permits:', error)
    throw new ApiError(500, 'Failed to retrieve work permits')
  }
})

/**
 * @swagger
 * /api/work-permits/{id}:
 *   get:
 *     summary: Get work permit by ID
 *     tags: [Work Permits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Work permit ID
 *     responses:
 *       200:
 *         description: Work permit details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WorkPermit'
 *       404:
 *         description: Work permit not found
 */
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const workPermit = await workPermitService.getWorkPermitById(id)

    if (!workPermit) {
      throw new ApiError(404, 'Work permit not found')
    }

    logger.info('Work permit retrieved successfully', { 
      userId: req.user?.id, 
      workPermitId: id 
    })

    res.json(workPermit)
  } catch (error) {
    logger.error('Error retrieving work permit:', error)
    throw error
  }
})

/**
 * @swagger
 * /api/work-permits:
 *   post:
 *     summary: Create a new work permit
 *     tags: [Work Permits]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateWorkPermitRequest'
 *     responses:
 *       201:
 *         description: Work permit created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WorkPermit'
 *       400:
 *         description: Invalid request data
 */
router.post('/', authenticate, authorize(['TENANT_USER', 'MALL_MANAGER', 'ADMIN']), validate(workPermitSchema), async (req: Request, res: Response) => {
  try {
    const workPermitData = req.body
    const workPermit = await workPermitService.createWorkPermit(workPermitData, req.user!.id)

    // Send notifications
    await notificationService.sendWorkPermitNotification(workPermit, 'created')

    logger.info('Work permit created successfully', { 
      userId: req.user?.id, 
      workPermitId: workPermit.id 
    })

    res.status(201).json(workPermit)
  } catch (error) {
    logger.error('Error creating work permit:', error)
    throw error
  }
})

/**
 * @swagger
 * /api/work-permits/{id}:
 *   put:
 *     summary: Update work permit
 *     tags: [Work Permits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Work permit ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateWorkPermitRequest'
 *     responses:
 *       200:
 *         description: Work permit updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WorkPermit'
 *       404:
 *         description: Work permit not found
 */
router.put('/:id', authenticate, authorize(['TENANT_USER', 'MALL_MANAGER', 'ADMIN']), validate(updateWorkPermitSchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const updateData = req.body
    
    const workPermit = await workPermitService.updateWorkPermit(id, updateData, req.user!.id)

    if (!workPermit) {
      throw new ApiError(404, 'Work permit not found')
    }

    // Send notifications if status changed
    if (updateData.status) {
      await notificationService.sendWorkPermitNotification(workPermit, 'updated')
    }

    logger.info('Work permit updated successfully', { 
      userId: req.user?.id, 
      workPermitId: id 
    })

    res.json(workPermit)
  } catch (error) {
    logger.error('Error updating work permit:', error)
    throw error
  }
})

/**
 * @swagger
 * /api/work-permits/{id}/approve:
 *   post:
 *     summary: Approve work permit
 *     tags: [Work Permits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Work permit ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comments:
 *                 type: string
 *                 description: Approval comments
 *     responses:
 *       200:
 *         description: Work permit approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WorkPermit'
 */
router.post('/:id/approve', authenticate, authorize(['MALL_MANAGER', 'ADMIN']), validate(approveWorkPermitSchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { comments } = req.body
    
    const workPermit = await workPermitService.approveWorkPermit(id, req.user!.id, comments)

    if (!workPermit) {
      throw new ApiError(404, 'Work permit not found')
    }

    // Send approval notification
    await notificationService.sendWorkPermitNotification(workPermit, 'approved')

    logger.info('Work permit approved successfully', { 
      userId: req.user?.id, 
      workPermitId: id 
    })

    res.json(workPermit)
  } catch (error) {
    logger.error('Error approving work permit:', error)
    throw error
  }
})

/**
 * @swagger
 * /api/work-permits/{id}/reject:
 *   post:
 *     summary: Reject work permit
 *     tags: [Work Permits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Work permit ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Rejection reason
 *     responses:
 *       200:
 *         description: Work permit rejected successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WorkPermit'
 */
router.post('/:id/reject', authenticate, authorize(['MALL_MANAGER', 'ADMIN']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { reason } = req.body
    
    if (!reason) {
      throw new ApiError(400, 'Rejection reason is required')
    }
    
    const workPermit = await workPermitService.rejectWorkPermit(id, req.user!.id, reason)

    if (!workPermit) {
      throw new ApiError(404, 'Work permit not found')
    }

    // Send rejection notification
    await notificationService.sendWorkPermitNotification(workPermit, 'rejected')

    logger.info('Work permit rejected successfully', { 
      userId: req.user?.id, 
      workPermitId: id,
      reason 
    })

    res.json(workPermit)
  } catch (error) {
    logger.error('Error rejecting work permit:', error)
    throw error
  }
})

/**
 * @swagger
 * /api/work-permits/{id}/activate:
 *   post:
 *     summary: Activate work permit
 *     tags: [Work Permits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Work permit ID
 *     responses:
 *       200:
 *         description: Work permit activated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WorkPermit'
 */
router.post('/:id/activate', authenticate, authorize(['MALL_MANAGER', 'ADMIN']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    
    const workPermit = await workPermitService.activateWorkPermit(id, req.user!.id)

    if (!workPermit) {
      throw new ApiError(404, 'Work permit not found')
    }

    // Send activation notification
    await notificationService.sendWorkPermitNotification(workPermit, 'activated')

    logger.info('Work permit activated successfully', { 
      userId: req.user?.id, 
      workPermitId: id 
    })

    res.json(workPermit)
  } catch (error) {
    logger.error('Error activating work permit:', error)
    throw error
  }
})

/**
 * @swagger
 * /api/work-permits/{id}/complete:
 *   post:
 *     summary: Complete work permit
 *     tags: [Work Permits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Work permit ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               completionNotes:
 *                 type: string
 *                 description: Completion notes
 *     responses:
 *       200:
 *         description: Work permit completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WorkPermit'
 */
router.post('/:id/complete', authenticate, authorize(['TENANT_USER', 'MALL_MANAGER', 'ADMIN']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { completionNotes } = req.body
    
    const workPermit = await workPermitService.completeWorkPermit(id, req.user!.id, completionNotes)

    if (!workPermit) {
      throw new ApiError(404, 'Work permit not found')
    }

    // Send completion notification
    await notificationService.sendWorkPermitNotification(workPermit, 'completed')

    logger.info('Work permit completed successfully', { 
      userId: req.user?.id, 
      workPermitId: id 
    })

    res.json(workPermit)
  } catch (error) {
    logger.error('Error completing work permit:', error)
    throw error
  }
})

/**
 * @swagger
 * /api/work-permits/{id}/cancel:
 *   post:
 *     summary: Cancel work permit
 *     tags: [Work Permits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Work permit ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Cancellation reason
 *     responses:
 *       200:
 *         description: Work permit cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WorkPermit'
 */
router.post('/:id/cancel', authenticate, authorize(['TENANT_USER', 'MALL_MANAGER', 'ADMIN']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { reason } = req.body
    
    if (!reason) {
      throw new ApiError(400, 'Cancellation reason is required')
    }
    
    const workPermit = await workPermitService.cancelWorkPermit(id, req.user!.id, reason)

    if (!workPermit) {
      throw new ApiError(404, 'Work permit not found')
    }

    // Send cancellation notification
    await notificationService.sendWorkPermitNotification(workPermit, 'cancelled')

    logger.info('Work permit cancelled successfully', { 
      userId: req.user?.id, 
      workPermitId: id,
      reason 
    })

    res.json(workPermit)
  } catch (error) {
    logger.error('Error cancelling work permit:', error)
    throw error
  }
})

/**
 * @swagger
 * /api/work-permits/{id}/inspections:
 *   post:
 *     summary: Add inspection to work permit
 *     tags: [Work Permits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Work permit ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - inspector
 *               - type
 *               - findings
 *               - status
 *             properties:
 *               inspector:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [pre-work, during-work, post-work]
 *               findings:
 *                 type: array
 *                 items:
 *                   type: string
 *               status:
 *                 type: string
 *                 enum: [pass, fail, conditional]
 *               comments:
 *                 type: string
 *     responses:
 *       200:
 *         description: Inspection added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WorkPermit'
 */
router.post('/:id/inspections', authenticate, authorize(['MALL_MANAGER', 'ADMIN']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const inspectionData = req.body
    
    const workPermit = await workPermitService.addInspection(id, inspectionData, req.user!.id)

    if (!workPermit) {
      throw new ApiError(404, 'Work permit not found')
    }

    logger.info('Inspection added to work permit successfully', { 
      userId: req.user?.id, 
      workPermitId: id 
    })

    res.json(workPermit)
  } catch (error) {
    logger.error('Error adding inspection to work permit:', error)
    throw error
  }
})

/**
 * @swagger
 * /api/work-permits/{id}/incidents:
 *   post:
 *     summary: Add incident to work permit
 *     tags: [Work Permits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Work permit ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - description
 *               - severity
 *               - reportedBy
 *             properties:
 *               description:
 *                 type: string
 *               severity:
 *                 type: string
 *                 enum: [minor, major, critical]
 *               injuries:
 *                 type: array
 *                 items:
 *                   type: string
 *               damage:
 *                 type: array
 *                 items:
 *                   type: string
 *               actions:
 *                 type: array
 *                 items:
 *                   type: string
 *               reportedBy:
 *                 type: string
 *     responses:
 *       200:
 *         description: Incident added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WorkPermit'
 */
router.post('/:id/incidents', authenticate, authorize(['TENANT_USER', 'MALL_MANAGER', 'ADMIN']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const incidentData = req.body
    
    const workPermit = await workPermitService.addIncident(id, incidentData, req.user!.id)

    if (!workPermit) {
      throw new ApiError(404, 'Work permit not found')
    }

    // Send incident notification
    await notificationService.sendWorkPermitNotification(workPermit, 'incident')

    logger.info('Incident added to work permit successfully', { 
      userId: req.user?.id, 
      workPermitId: id 
    })

    res.json(workPermit)
  } catch (error) {
    logger.error('Error adding incident to work permit:', error)
    throw error
  }
})

/**
 * @swagger
 * /api/work-permits/stats/overview:
 *   get:
 *     summary: Get work permit statistics overview
 *     tags: [Work Permits]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Work permit statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: number
 *                 pendingApproval:
 *                   type: number
 *                 approved:
 *                   type: number
 *                 active:
 *                   type: number
 *                 completed:
 *                   type: number
 *                 rejected:
 *                   type: number
 *                 cancelled:
 *                   type: number
 *                 byType:
 *                   type: object
 *                 byRiskLevel:
 *                   type: object
 *                 byCategory:
 *                   type: object
 */
router.get('/stats/overview', authenticate, async (req: Request, res: Response) => {
  try {
    const stats = await workPermitService.getWorkPermitStats()

    logger.info('Work permit statistics retrieved successfully', { 
      userId: req.user?.id 
    })

    res.json(stats)
  } catch (error) {
    logger.error('Error retrieving work permit statistics:', error)
    throw new ApiError(500, 'Failed to retrieve work permit statistics')
  }
})

/**
 * @swagger
 * /api/work-permits/{id}:
 *   delete:
 *     summary: Delete work permit
 *     tags: [Work Permits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Work permit ID
 *     responses:
 *       204:
 *         description: Work permit deleted successfully
 *       404:
 *         description: Work permit not found
 */
router.delete('/:id', authenticate, authorize(['ADMIN']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    
    const deleted = await workPermitService.deleteWorkPermit(id)

    if (!deleted) {
      throw new ApiError(404, 'Work permit not found')
    }

    logger.info('Work permit deleted successfully', { 
      userId: req.user?.id, 
      workPermitId: id 
    })

    res.status(204).send()
  } catch (error) {
    logger.error('Error deleting work permit:', error)
    throw error
  }
})

export default router 