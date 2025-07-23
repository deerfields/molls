/**
 * MallOS Enterprise - File Upload Routes
 * File upload functionality with validation and storage management
 */

import express from 'express';
import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { database } from '@/config/database';
import { logger } from '@/utils/logger';
import { authenticate, authorize } from '@/middleware/auth';
import { UserRole } from '@/models/User';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
  // Allowed file types
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Max 5 files per request
  }
});

// File upload endpoint
router.post('/upload', authenticate, upload.array('files', 5), async (req: Request, res: Response) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }
    
    const uploadedFiles = [];
    const files = Array.isArray(req.files) ? req.files : [req.files];
    
    for (const file of files) {
      const fileInfo = {
        id: uuidv4(),
        originalName: file.originalname,
        filename: file.filename,
        path: file.path,
        size: file.size,
        mimetype: file.mimetype,
        uploadedBy: req.user.id,
        uploadedAt: new Date(),
        metadata: {
          tenantId: req.body.tenantId,
          mallId: req.body.mallId,
          category: req.body.category || 'general',
          description: req.body.description
        }
      };
      
      uploadedFiles.push(fileInfo);
      
      // Log file upload
      logger.info(`File uploaded: ${file.originalname} by ${req.user.id}`);
    }
    
    return res.status(201).json({
      message: 'Files uploaded successfully',
      files: uploadedFiles.map(file => ({
        id: file.id,
        originalName: file.originalName,
        filename: file.filename,
        size: file.size,
        mimetype: file.mimetype,
        uploadedAt: file.uploadedAt
      }))
    });
  } catch (err) {
    logger.error('File upload error', err);
    return res.status(500).json({ message: 'Failed to upload files' });
  }
});

// Get uploaded files
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, tenantId, mallId, category, uploadedBy } = req.query;
    
    // In a real implementation, you would store file metadata in a database
    // For now, we'll return a mock response
    const mockFiles = [
      {
        id: uuidv4(),
        originalName: 'document.pdf',
        filename: 'mock-file-1.pdf',
        size: 1024000,
        mimetype: 'application/pdf',
        uploadedBy: req.user.id,
        uploadedAt: new Date(),
        metadata: {
          tenantId: tenantId || null,
          mallId: mallId || null,
          category: category || 'general'
        }
      }
    ];
    
    return res.json({
      files: mockFiles,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: mockFiles.length,
        pages: 1
      }
    });
  } catch (err) {
    logger.error('Get files error', err);
    return res.status(500).json({ message: 'Failed to fetch files' });
  }
});

// Get file by ID
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // In a real implementation, you would fetch file metadata from database
    // For now, we'll return a mock response
    const mockFile = {
      id,
      originalName: 'document.pdf',
      filename: 'mock-file-1.pdf',
      size: 1024000,
      mimetype: 'application/pdf',
      uploadedBy: req.user.id,
      uploadedAt: new Date(),
      metadata: {
        tenantId: null,
        mallId: null,
        category: 'general',
        description: 'Sample document'
      }
    };
    
    return res.json(mockFile);
  } catch (err) {
    logger.error('Get file error', err);
    return res.status(500).json({ message: 'Failed to fetch file' });
  }
});

// Download file
router.get('/:id/download', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // In a real implementation, you would fetch file path from database
    // For now, we'll return a mock response
    const mockFilePath = path.join(__dirname, '../../uploads/mock-file-1.pdf');
    
    if (!fs.existsSync(mockFilePath)) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    const originalName = 'document.pdf';
    res.download(mockFilePath, originalName);
  } catch (err) {
    logger.error('Download file error', err);
    return res.status(500).json({ message: 'Failed to download file' });
  }
});

// Delete file
router.delete('/:id', authenticate, authorize([UserRole.ADMIN, UserRole.MALL_MANAGER]), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // In a real implementation, you would:
    // 1. Fetch file metadata from database
    // 2. Delete physical file
    // 3. Remove database record
    
    logger.info(`File deleted: ${id} by ${req.user.id}`);
    
    return res.json({ message: 'File deleted successfully' });
  } catch (err) {
    logger.error('Delete file error', err);
    return res.status(500).json({ message: 'Failed to delete file' });
  }
});

// Get file statistics
router.get('/stats/overview', authenticate, authorize([UserRole.ADMIN, UserRole.MALL_MANAGER]), async (req: Request, res: Response) => {
  try {
    // In a real implementation, you would fetch statistics from database
    const mockStats = {
      totalFiles: 150,
      totalSize: 1024 * 1024 * 1024, // 1GB
      filesByType: {
        'application/pdf': 50,
        'image/jpeg': 30,
        'image/png': 20,
        'application/msword': 25,
        'text/plain': 25
      },
      recentUploads: 15
    };
    
    return res.json(mockStats);
  } catch (err) {
    logger.error('Get file stats error', err);
    return res.status(500).json({ message: 'Failed to fetch file statistics' });
  }
});

// Error handling middleware for multer
router.use((error: any, req: Request, res: Response, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ message: 'Too many files' });
    }
  }
  
  if (error.message === 'Invalid file type') {
    return res.status(400).json({ message: 'Invalid file type' });
  }
  
  logger.error('File upload middleware error', error);
  return res.status(500).json({ message: 'File upload failed' });
});

export default router; 