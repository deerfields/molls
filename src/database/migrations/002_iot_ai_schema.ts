/**
 * MallOS Enterprise - IoT & AI Schema Migration
 * Database schema extensions for IoT devices, AI models, and computer vision
 */

import { MigrationInterface, QueryRunner } from 'typeorm';

export class IoTAndAISchema002 implements MigrationInterface {
  name = 'IoTAndAISchema002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create sensor_data table
    await queryRunner.query(`
      CREATE TYPE "public"."sensor_type_enum" AS ENUM (
        'temperature', 'humidity', 'co2', 'occupancy', 'water_leak',
        'air_quality', 'energy_consumption', 'parking_sensor',
        'crowd_density', 'lighting', 'hvac', 'security',
        'maintenance', 'digital_signage'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."data_quality_enum" AS ENUM (
        'excellent', 'good', 'fair', 'poor', 'error'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "sensor_data" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "deviceId" uuid NOT NULL,
        "mallId" uuid NOT NULL,
        "sensorType" "public"."sensor_type_enum" NOT NULL,
        "timestamp" TIMESTAMP NOT NULL,
        "data" jsonb NOT NULL DEFAULT '{"value": 0}',
        "quality" "public"."data_quality_enum" NOT NULL DEFAULT 'good',
        "location" jsonb,
        "alerts" jsonb,
        "aiInsights" jsonb,
        "processed" boolean NOT NULL DEFAULT false,
        "tags" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sensor_data" PRIMARY KEY ("id")
      )
    `);

    // Create ai_models table
    await queryRunner.query(`
      CREATE TYPE "public"."model_type_enum" AS ENUM (
        'prediction', 'classification', 'anomaly_detection',
        'computer_vision', 'nlp', 'recommendation', 'forecasting'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."model_status_enum" AS ENUM (
        'training', 'active', 'inactive', 'deprecated', 'error'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."model_framework_enum" AS ENUM (
        'tensorflow', 'pytorch', 'scikit_learn', 'opencv',
        'face_api', 'custom'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "ai_models" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(100) NOT NULL,
        "version" character varying(20) NOT NULL,
        "mallId" uuid NOT NULL,
        "type" "public"."model_type_enum" NOT NULL,
        "framework" "public"."model_framework_enum" NOT NULL,
        "status" "public"."model_status_enum" NOT NULL DEFAULT 'inactive',
        "description" text,
        "configuration" jsonb NOT NULL DEFAULT '{}',
        "metrics" jsonb NOT NULL DEFAULT '{}',
        "trainingData" jsonb,
        "deployment" jsonb,
        "performance" jsonb,
        "modelFile" jsonb,
        "dependencies" jsonb,
        "tags" jsonb,
        "isProduction" boolean NOT NULL DEFAULT false,
        "parentModelId" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ai_models" PRIMARY KEY ("id")
      )
    `);

    // Create ai_predictions table
    await queryRunner.query(`
      CREATE TYPE "public"."prediction_type_enum" AS ENUM (
        'revenue_forecast', 'foot_traffic', 'energy_consumption',
        'maintenance_schedule', 'crowd_density', 'parking_availability',
        'tenant_performance', 'security_threat', 'equipment_failure',
        'customer_behavior', 'pricing_optimization', 'anomaly_detection'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."prediction_status_enum" AS ENUM (
        'pending', 'processing', 'completed', 'failed', 'expired'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "ai_predictions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "modelId" uuid NOT NULL,
        "mallId" uuid NOT NULL,
        "type" "public"."prediction_type_enum" NOT NULL,
        "status" "public"."prediction_status_enum" NOT NULL DEFAULT 'pending',
        "timestamp" TIMESTAMP NOT NULL,
        "predictionDate" TIMESTAMP,
        "input" jsonb NOT NULL DEFAULT '{"features": {}}',
        "output" jsonb NOT NULL DEFAULT '{"prediction": null}',
        "metadata" jsonb,
        "accuracy" jsonb,
        "alerts" jsonb,
        "recommendations" jsonb,
        "tags" jsonb,
        "isHistorical" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ai_predictions" PRIMARY KEY ("id")
      )
    `);

    // Create computer_vision table
    await queryRunner.query(`
      CREATE TYPE "public"."vision_type_enum" AS ENUM (
        'facial_recognition', 'behavior_analysis', 'crowd_analysis',
        'license_plate', 'fire_smoke', 'social_distancing',
        'violence_detection', 'theft_prevention', 'vip_recognition',
        'anomaly_detection', 'occupancy_counting', 'traffic_flow'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."detection_status_enum" AS ENUM (
        'detected', 'verified', 'false_positive', 'pending_review', 'ignored'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."threat_level_enum" AS ENUM (
        'low', 'medium', 'high', 'critical'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "computer_vision" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "cameraId" uuid NOT NULL,
        "mallId" uuid NOT NULL,
        "type" "public"."vision_type_enum" NOT NULL,
        "status" "public"."detection_status_enum" NOT NULL DEFAULT 'detected',
        "timestamp" TIMESTAMP NOT NULL,
        "detection" jsonb NOT NULL DEFAULT '{"confidence": 0}',
        "facialData" jsonb,
        "behaviorData" jsonb,
        "crowdData" jsonb,
        "securityData" jsonb,
        "imageData" jsonb,
        "aiInsights" jsonb,
        "alerts" jsonb,
        "tags" jsonb,
        "isProcessed" boolean NOT NULL DEFAULT false,
        "metadata" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_computer_vision" PRIMARY KEY ("id")
      )
    `);

    // Create indexes for performance
    await queryRunner.query(`
      CREATE INDEX "IDX_sensor_data_device_timestamp" ON "sensor_data" ("deviceId", "timestamp")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_sensor_data_type_timestamp" ON "sensor_data" ("sensorType", "timestamp")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_sensor_data_mall_timestamp" ON "sensor_data" ("mallId", "timestamp")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_sensor_data_timestamp" ON "sensor_data" ("timestamp")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_ai_models_name_version" ON "ai_models" ("name", "version")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_ai_models_type_status" ON "ai_models" ("type", "status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_ai_models_mall_status" ON "ai_models" ("mallId", "status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_ai_predictions_model_timestamp" ON "ai_predictions" ("modelId", "timestamp")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_ai_predictions_type_status" ON "ai_predictions" ("type", "status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_ai_predictions_mall_timestamp" ON "ai_predictions" ("mallId", "timestamp")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_ai_predictions_timestamp" ON "ai_predictions" ("timestamp")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_computer_vision_camera_timestamp" ON "computer_vision" ("cameraId", "timestamp")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_computer_vision_type_status" ON "computer_vision" ("type", "status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_computer_vision_mall_timestamp" ON "computer_vision" ("mallId", "timestamp")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_computer_vision_timestamp" ON "computer_vision" ("timestamp")
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "sensor_data" ADD CONSTRAINT "FK_sensor_data_device" 
      FOREIGN KEY ("deviceId") REFERENCES "iot_devices"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "ai_predictions" ADD CONSTRAINT "FK_ai_predictions_model" 
      FOREIGN KEY ("modelId") REFERENCES "ai_models"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "ai_models" ADD CONSTRAINT "FK_ai_models_parent" 
      FOREIGN KEY ("parentModelId") REFERENCES "ai_models"("id") ON DELETE SET NULL
    `);

    // Create time-series partitioning for sensor_data (for large datasets)
    await queryRunner.query(`
      CREATE TABLE "sensor_data_2024" PARTITION OF "sensor_data"
      FOR VALUES FROM ('2024-01-01') TO ('2025-01-01')
    `);

    await queryRunner.query(`
      CREATE TABLE "sensor_data_2025" PARTITION OF "sensor_data"
      FOR VALUES FROM ('2025-01-01') TO ('2026-01-01')
    `);

    // Create materialized views for analytics
    await queryRunner.query(`
      CREATE MATERIALIZED VIEW "sensor_analytics_daily" AS
      SELECT 
        DATE(timestamp) as date,
        "sensorType",
        "mallId",
        COUNT(*) as readings,
        AVG(CAST(data->>'value' AS FLOAT)) as avg_value,
        MIN(CAST(data->>'value' AS FLOAT)) as min_value,
        MAX(CAST(data->>'value' AS FLOAT)) as max_value,
        STDDEV(CAST(data->>'value' AS FLOAT)) as std_value
      FROM "sensor_data"
      GROUP BY DATE(timestamp), "sensorType", "mallId"
      WITH DATA
    `);

    await queryRunner.query(`
      CREATE MATERIALIZED VIEW "ai_predictions_daily" AS
      SELECT 
        DATE(timestamp) as date,
        "type",
        "mallId",
        COUNT(*) as predictions,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
        AVG(CAST(output->>'confidence' AS FLOAT)) as avg_confidence
      FROM "ai_predictions"
      GROUP BY DATE(timestamp), "type", "mallId"
      WITH DATA
    `);

    // Create indexes on materialized views
    await queryRunner.query(`
      CREATE INDEX "IDX_sensor_analytics_daily_date" ON "sensor_analytics_daily" ("date")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_sensor_analytics_daily_mall" ON "sensor_analytics_daily" ("mallId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_ai_predictions_daily_date" ON "ai_predictions_daily" ("date")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_ai_predictions_daily_mall" ON "ai_predictions_daily" ("mallId")
    `);

    // Create functions for data retention and cleanup
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION cleanup_old_sensor_data()
      RETURNS void AS $$
      BEGIN
        DELETE FROM "sensor_data" 
        WHERE "timestamp" < NOW() - INTERVAL '1 year';
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION refresh_analytics_views()
      RETURNS void AS $$
      BEGIN
        REFRESH MATERIALIZED VIEW "sensor_analytics_daily";
        REFRESH MATERIALIZED VIEW "ai_predictions_daily";
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create scheduled jobs (using pg_cron if available)
    await queryRunner.query(`
      SELECT cron.schedule('refresh-analytics-daily', '0 2 * * *', 'SELECT refresh_analytics_views();');
    `);

    await queryRunner.query(`
      SELECT cron.schedule('cleanup-old-data-monthly', '0 3 1 * *', 'SELECT cleanup_old_sensor_data();');
    `);

    console.log('✅ IoT & AI schema migration completed successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop scheduled jobs
    await queryRunner.query(`SELECT cron.unschedule('refresh-analytics-daily');`);
    await queryRunner.query(`SELECT cron.unschedule('cleanup-old-data-monthly');`);

    // Drop functions
    await queryRunner.query(`DROP FUNCTION IF EXISTS cleanup_old_sensor_data();`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS refresh_analytics_views();`);

    // Drop materialized views
    await queryRunner.query(`DROP MATERIALIZED VIEW IF EXISTS "ai_predictions_daily";`);
    await queryRunner.query(`DROP MATERIALIZED VIEW IF EXISTS "sensor_analytics_daily";`);

    // Drop partitions
    await queryRunner.query(`DROP TABLE IF EXISTS "sensor_data_2025";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sensor_data_2024";`);

    // Drop foreign key constraints
    await queryRunner.query(`ALTER TABLE "ai_models" DROP CONSTRAINT IF EXISTS "FK_ai_models_parent";`);
    await queryRunner.query(`ALTER TABLE "ai_predictions" DROP CONSTRAINT IF EXISTS "FK_ai_predictions_model";`);
    await queryRunner.query(`ALTER TABLE "sensor_data" DROP CONSTRAINT IF EXISTS "FK_sensor_data_device";`);

    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_computer_vision_timestamp";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_computer_vision_mall_timestamp";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_computer_vision_type_status";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_computer_vision_camera_timestamp";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ai_predictions_timestamp";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ai_predictions_mall_timestamp";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ai_predictions_type_status";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ai_predictions_model_timestamp";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ai_models_mall_status";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ai_models_type_status";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ai_models_name_version";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_sensor_data_timestamp";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_sensor_data_mall_timestamp";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_sensor_data_type_timestamp";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_sensor_data_device_timestamp";`);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "computer_vision";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ai_predictions";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ai_models";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sensor_data";`);

    // Drop enums
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."threat_level_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."detection_status_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."vision_type_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."prediction_status_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."prediction_type_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."model_framework_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."model_status_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."model_type_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."data_quality_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."sensor_type_enum";`);

    console.log('✅ IoT & AI schema migration reverted successfully');
  }
} 