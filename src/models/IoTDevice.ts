/**
 * MallOS Enterprise - IoT Device Entity
 * IoT device management and monitoring
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index
} from 'typeorm';

export enum DeviceType {
  SENSOR = 'sensor',
  CAMERA = 'camera',
  CONTROLLER = 'controller',
  GATEWAY = 'gateway',
  ACTUATOR = 'actuator'
}

export enum DeviceStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  MAINTENANCE = 'maintenance',
  ERROR = 'error'
}

@Entity('iot_devices')
@Index(['deviceId'], { unique: true })
@Index(['mallId', 'type'])
@Index(['status', 'lastSeen'])
export class IoTDevice {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 100, unique: true })
  deviceId!: string;

  @Column({ type: 'uuid' })
  mallId!: string;

  @Column({ length: 100 })
  name!: string;

  @Column({
    type: 'enum',
    enum: DeviceType,
    default: DeviceType.SENSOR
  })
  type: DeviceType = DeviceType.SENSOR;

  @Column({
    type: 'enum',
    enum: DeviceStatus,
    default: DeviceStatus.OFFLINE
  })
  status: DeviceStatus = DeviceStatus.OFFLINE;

  @Column({ type: 'jsonb' })
  location: {
    area?: string;
    floor?: string;
    coordinates?: { lat: number; lng: number };
  } = {};

  @Column({ type: 'jsonb', nullable: true })
  configuration: any;

  @Column({ type: 'timestamp', nullable: true })
  lastSeen?: Date;

  @Column({ type: 'jsonb', nullable: true })
  lastData?: any;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
} 