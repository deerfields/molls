import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm'

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create users table
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'tenant_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'first_name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'last_name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'username',
            type: 'varchar',
            length: '255',
            isUnique: true,
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isUnique: true,
          },
          {
            name: 'phone_number',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'password',
            type: 'text',
          },
          {
            name: 'role',
            type: 'enum',
            enum: ['ADMIN', 'MALL_MANAGER', 'TENANT_USER', 'SECURITY', 'MAINTENANCE'],
            default: "'TENANT_USER'",
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['ACTIVE', 'INACTIVE', 'PENDING_VERIFICATION', 'LOCKED'],
            default: "'PENDING_VERIFICATION'",
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['REGULAR', 'CONTRACTOR', 'VISITOR'],
            default: "'REGULAR'",
          },
          {
            name: 'profile',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'permissions',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'settings',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'login_attempts',
            type: 'int',
            default: 0,
          },
          {
            name: 'last_login',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'email_verified_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    )

    // Create malls table
    await queryRunner.createTable(
      new Table({
        name: 'malls',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'mall_code',
            type: 'varchar',
            length: '50',
            isUnique: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '200',
          },
          {
            name: 'trading_name',
            type: 'varchar',
            length: '200',
            isNullable: true,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['SHOPPING_CENTER', 'RETAIL_PARK', 'MIXED_USE', 'OUTLET'],
            default: "'SHOPPING_CENTER'",
          },
          {
            name: 'class',
            type: 'enum',
            enum: ['PREMIUM', 'STANDARD', 'ECONOMY'],
            default: "'STANDARD'",
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['ACTIVE', 'INACTIVE', 'UNDER_CONSTRUCTION', 'CLOSED'],
            default: "'ACTIVE'",
          },
          {
            name: 'location',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'contact',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'facility_details',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'operating_hours',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'amenities',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'tenant_mix',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'financial',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'performance',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'marketing',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'compliance',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'maintenance',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'security',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'technology',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'sustainability',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'accessibility',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'settings',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    )

    // Create tenants table
    await queryRunner.createTable(
      new Table({
        name: 'tenants',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'mall_id',
            type: 'uuid',
          },
          {
            name: 'tenant_code',
            type: 'varchar',
            length: '50',
            isUnique: true,
          },
          {
            name: 'business_name',
            type: 'varchar',
            length: '200',
          },
          {
            name: 'trading_name',
            type: 'varchar',
            length: '200',
            isNullable: true,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['RETAIL', 'F&B', 'SERVICE', 'ENTERTAINMENT', 'OFFICE'],
            default: "'RETAIL'",
          },
          {
            name: 'category',
            type: 'enum',
            enum: ['GENERAL_RETAIL', 'FASHION', 'ELECTRONICS', 'HOME', 'SPORTS', 'BEAUTY', 'FOOD', 'BEVERAGE', 'SERVICE', 'ENTERTAINMENT'],
            default: "'GENERAL_RETAIL'",
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['ACTIVE', 'INACTIVE', 'PENDING_APPROVAL', 'REJECTED', 'EXPIRED'],
            default: "'PENDING_APPROVAL'",
          },
          {
            name: 'contact_email',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'contact_phone',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'contact_fax',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'website',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'contact_person',
            type: 'varchar',
            length: '200',
            isNullable: true,
          },
          {
            name: 'address',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'business_details',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'lease_details',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'financial_info',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'compliance',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'space_details',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'services',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'marketing',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'performance',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'settings',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'lease_start_date',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'lease_end_date',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    )

    // Create work permits table
    await queryRunner.createTable(
      new Table({
        name: 'work_permits',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'permit_number',
            type: 'varchar',
            length: '50',
            isUnique: true,
          },
          {
            name: 'tenant_id',
            type: 'uuid',
          },
          {
            name: 'contractor_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'mall_id',
            type: 'uuid',
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['GENERAL', 'HOT_WORK', 'HIGH_LEVEL', 'MEDIA', 'SPECIAL'],
            default: "'GENERAL'",
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['PENDING_APPROVAL', 'APPROVED', 'ACTIVE', 'COMPLETED', 'REJECTED', 'CANCELLED'],
            default: "'PENDING_APPROVAL'",
          },
          {
            name: 'risk_level',
            type: 'enum',
            enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
            default: "'LOW'",
          },
          {
            name: 'category',
            type: 'enum',
            enum: ['ELECTRICAL', 'PLUMBING', 'HVAC', 'STRUCTURAL', 'DECORATION', 'MAINTENANCE', 'OTHER'],
            default: "'OTHER'",
          },
          {
            name: 'work_description',
            type: 'text',
          },
          {
            name: 'detailed_description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'location',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'start_date',
            type: 'timestamp',
          },
          {
            name: 'end_date',
            type: 'timestamp',
          },
          {
            name: 'work_schedule',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'personnel',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'equipment',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'safety_measures',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'risk_assessment',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'method_statement',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'approvals',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'inspections',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'incidents',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'compliance',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'costs',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'documents',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'notifications',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'completion',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    )

    // Create indexes
    await queryRunner.createIndex('users', { name: 'idx_users_email', columnNames: ['email'] })
    await queryRunner.createIndex('users', { name: 'idx_users_tenant_id', columnNames: ['tenant_id'] })
    await queryRunner.createIndex('users', { name: 'idx_users_role', columnNames: ['role'] })
    await queryRunner.createIndex('users', { name: 'idx_users_status', columnNames: ['status'] })

    await queryRunner.createIndex('malls', { name: 'idx_malls_code', columnNames: ['mall_code'] })
    await queryRunner.createIndex('malls', { name: 'idx_malls_status', columnNames: ['status'] })

    await queryRunner.createIndex('tenants', { name: 'idx_tenants_code', columnNames: ['tenant_code'] })
    await queryRunner.createIndex('tenants', { name: 'idx_tenants_mall_id', columnNames: ['mall_id'] })
    await queryRunner.createIndex('tenants', { name: 'idx_tenants_status', columnNames: ['status'] })
    await queryRunner.createIndex('tenants', { name: 'idx_tenants_type', columnNames: ['type'] })

    await queryRunner.createIndex('work_permits', { name: 'idx_work_permits_number', columnNames: ['permit_number'] })
    await queryRunner.createIndex('work_permits', { name: 'idx_work_permits_tenant_id', columnNames: ['tenant_id'] })
    await queryRunner.createIndex('work_permits', { name: 'idx_work_permits_mall_id', columnNames: ['mall_id'] })
    await queryRunner.createIndex('work_permits', { name: 'idx_work_permits_status', columnNames: ['status'] })
    await queryRunner.createIndex('work_permits', { name: 'idx_work_permits_type', columnNames: ['type'] })

    // Create foreign keys
    await queryRunner.createForeignKey(
      'users',
      new TableForeignKey({
        columnNames: ['tenant_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tenants',
        onDelete: 'SET NULL',
      })
    )

    await queryRunner.createForeignKey(
      'tenants',
      new TableForeignKey({
        columnNames: ['mall_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'malls',
        onDelete: 'CASCADE',
      })
    )

    await queryRunner.createForeignKey(
      'work_permits',
      new TableForeignKey({
        columnNames: ['tenant_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tenants',
        onDelete: 'CASCADE',
      })
    )

    await queryRunner.createForeignKey(
      'work_permits',
      new TableForeignKey({
        columnNames: ['mall_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'malls',
        onDelete: 'CASCADE',
      })
    )

    // Enable UUID extension
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('work_permits')
    await queryRunner.dropTable('tenants')
    await queryRunner.dropTable('malls')
    await queryRunner.dropTable('users')
  }
} 