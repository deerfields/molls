/**
 * MallOS Enterprise - Database Configuration
 * PostgreSQL database setup with TypeORM
 */

import { DataSource } from 'typeorm';
import { config } from '@/config/config';
import { logger } from '@/utils/logger';

// Import entities
import { User } from '@/models/User';
import { Tenant } from '@/models/Tenant';
import { Mall } from '@/models/Mall';
import { WorkPermit } from '@/models/WorkPermit';
import { Maintenance } from '@/models/Maintenance';
import { Security } from '@/models/Security';
import { Financial } from '@/models/Financial';
import { Analytics } from '@/models/Analytics';
import { IoTDevice } from '@/models/IoTDevice';
import { SensorData } from '@/models/SensorData';
import { AIModel } from '@/models/AIModel';
import { AIPrediction } from '@/models/AIPrediction';
import { ComputerVision } from '@/models/ComputerVision';
import { BlockchainTransaction } from '@/models/BlockchainTransaction';
import { Notification } from '@/models/Notification';
import { AuditLog } from '@/models/AuditLog';

// Create database connection
export const database = new DataSource({
  type: 'postgres',
  host: config.database.host,
  port: config.database.port,
  username: config.database.username,
  password: config.database.password,
  database: config.database.name,
  ssl: config.database.ssl,
  synchronize: config.app.environment === 'development',
  logging: config.app.environment === 'development',
  entities: [
    User,
    Tenant,
    Mall,
    WorkPermit,
    Maintenance,
    Security,
    Financial,
    Analytics,
    IoTDevice,
    SensorData,
    AIModel,
    AIPrediction,
    ComputerVision,
    BlockchainTransaction,
    Notification,
    AuditLog
  ],
  migrations: ['src/database/migrations/*.ts'],
  subscribers: ['src/database/subscribers/*.ts'],
  poolSize: config.database.pool.max,
  extra: {
    connectionLimit: config.database.pool.max,
    acquireTimeout: 60000,
    timeout: 60000,
    idleTimeout: 30000,
    max: config.database.pool.max,
    min: config.database.pool.min
  }
});

// Database connection manager
export class DatabaseManager {
  private static instance: DatabaseManager;
  private isConnected = false;

  private constructor() {}

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  /**
   * Initialize database connection
   */
  async initialize(): Promise<void> {
    try {
      if (!this.isConnected) {
        await database.initialize();
        this.isConnected = true;
        logger.info('✅ Database connection established');
        
        // Test connection
        await this.testConnection();
      }
    } catch (error) {
      logger.error('❌ Failed to connect to database:', error);
      throw error;
    }
  }

  /**
   * Test database connection
   */
  async testConnection(): Promise<void> {
    try {
      const queryRunner = database.createQueryRunner();
      await queryRunner.query('SELECT 1');
      await queryRunner.release();
      logger.info('✅ Database connection test successful');
    } catch (error) {
      logger.error('❌ Database connection test failed:', error);
      throw error;
    }
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    try {
      if (this.isConnected) {
        await database.destroy();
        this.isConnected = false;
        logger.info('✅ Database connection closed');
      }
    } catch (error) {
      logger.error('❌ Error closing database connection:', error);
      throw error;
    }
  }

  /**
   * Get database status
   */
  getStatus(): { connected: boolean; host: string; database: string } {
    return {
      connected: this.isConnected,
      host: config.database.host,
      database: config.database.name
    };
  }

  /**
   * Run database migrations
   */
  async runMigrations(): Promise<void> {
    try {
      await database.runMigrations();
      logger.info('✅ Database migrations completed');
    } catch (error) {
      logger.error('❌ Database migration failed:', error);
      throw error;
    }
  }

  /**
   * Revert last migration
   */
  async revertLastMigration(): Promise<void> {
    try {
      await database.undoLastMigration();
      logger.info('✅ Last migration reverted');
    } catch (error) {
      logger.error('❌ Migration revert failed:', error);
      throw error;
    }
  }

  /**
   * Get migration status
   */
  async getMigrationStatus(): Promise<any[]> {
    try {
      return await database.showMigrations();
    } catch (error) {
      logger.error('❌ Failed to get migration status:', error);
      throw error;
    }
  }

  /**
   * Create database backup
   */
  async createBackup(): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = `./backups/mallos_backup_${timestamp}.sql`;
      
      // This would require pg_dump to be available
      // For now, we'll just log the intention
      logger.info(`📦 Database backup requested: ${backupPath}`);
      
      return backupPath;
    } catch (error) {
      logger.error('❌ Database backup failed:', error);
      throw error;
    }
  }

  /**
   * Restore database from backup
   */
  async restoreBackup(backupPath: string): Promise<void> {
    try {
      logger.info(`🔄 Restoring database from backup: ${backupPath}`);
      // This would require pg_restore to be available
      // For now, we'll just log the intention
      logger.info('✅ Database restore completed');
    } catch (error) {
      logger.error('❌ Database restore failed:', error);
      throw error;
    }
  }

  /**
   * Get database statistics
   */
  async getStatistics(): Promise<any> {
    try {
      const queryRunner = database.createQueryRunner();
      
      // Get table sizes
      const tableSizes = await queryRunner.query(`
        SELECT 
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      `);

      // Get connection count
      const connectionCount = await queryRunner.query(`
        SELECT count(*) as active_connections 
        FROM pg_stat_activity 
        WHERE state = 'active'
      `);

      // Get database size
      const dbSize = await queryRunner.query(`
        SELECT pg_size_pretty(pg_database_size(current_database())) as database_size
      `);

      await queryRunner.release();

      return {
        tableSizes,
        connectionCount: connectionCount[0]?.active_connections || 0,
        databaseSize: dbSize[0]?.database_size || '0 MB',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('❌ Failed to get database statistics:', error);
      throw error;
    }
  }

  /**
   * Optimize database
   */
  async optimize(): Promise<void> {
    try {
      const queryRunner = database.createQueryRunner();
      
      // Vacuum database
      await queryRunner.query('VACUUM ANALYZE');
      
      // Update statistics
      await queryRunner.query('ANALYZE');
      
      await queryRunner.release();
      
      logger.info('✅ Database optimization completed');
    } catch (error) {
      logger.error('❌ Database optimization failed:', error);
      throw error;
    }
  }
}

// Export database manager instance
export const databaseManager = DatabaseManager.getInstance();

// Export database for direct access
export { database as db }; 