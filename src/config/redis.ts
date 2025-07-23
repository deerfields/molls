/**
 * MallOS Enterprise - Redis Configuration
 * Redis client setup for caching and session management
 */

import Redis from 'ioredis';
import { config } from '@/config/config';
import { logger } from '@/utils/logger';

// Create Redis client
export const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  db: config.redis.db,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keepAlive: 30000,
  connectTimeout: 10000,
  commandTimeout: 5000,
  keyPrefix: 'mallos:',
});

// Redis connection manager
export class RedisManager {
  private static instance: RedisManager;
  private isConnected = false;

  private constructor() {}

  static getInstance(): RedisManager {
    if (!RedisManager.instance) {
      RedisManager.instance = new RedisManager();
    }
    return RedisManager.instance;
  }

  async connect(): Promise<void> {
    try {
      await redis.connect();
      this.isConnected = true;
      logger.info('✅ Redis connection established');
    } catch (error) {
      logger.error('❌ Failed to connect to Redis:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await redis.disconnect();
      this.isConnected = false;
      logger.info('✅ Redis connection closed');
    } catch (error) {
      logger.error('❌ Error closing Redis connection:', error);
      throw error;
    }
  }

  getStatus(): { connected: boolean; host: string; port: number } {
    return {
      connected: this.isConnected,
      host: config.redis.host,
      port: config.redis.port
    };
  }
}

// Export Redis manager instance
export const redisManager = RedisManager.getInstance();

// Export Redis for direct access
export { redis as cache }; 