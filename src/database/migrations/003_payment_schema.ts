import { MigrationInterface, QueryRunner } from 'typeorm';

export class PaymentSchemaMigration1680000000000 implements MigrationInterface {
  name = 'PaymentSchemaMigration1680000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Payment table
    await queryRunner.query(`
      CREATE TABLE "payment" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "stripePaymentId" varchar NOT NULL UNIQUE,
        "amount" decimal(18,2) NOT NULL CHECK (amount > 0),
        "currency" varchar(3) NOT NULL,
        "status" varchar(32) NOT NULL,
        "paymentMethod" varchar,
        "customerId" uuid NOT NULL,
        "tenantId" uuid NOT NULL,
        "description" varchar,
        "metadata" jsonb,
        "createdAt" TIMESTAMP DEFAULT now(),
        "updatedAt" TIMESTAMP DEFAULT now(),
        CONSTRAINT "fk_payment_customer" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_payment_tenant" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE
      );
      CREATE INDEX "idx_payment_tenant_status_created" ON "payment" ("tenantId", "status", "createdAt");
      CREATE INDEX "idx_payment_customer_status" ON "payment" ("customerId", "status");
      CREATE INDEX "idx_payment_stripePaymentId" ON "payment" ("stripePaymentId");
      CREATE INDEX "idx_payment_status" ON "payment" ("status");
      CREATE INDEX "idx_payment_currency" ON "payment" ("currency");
      CREATE INDEX "idx_payment_paymentMethod" ON "payment" ("paymentMethod");
    `);
    // Subscription table
    await queryRunner.query(`
      CREATE TABLE "subscription" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "stripeSubscriptionId" varchar NOT NULL UNIQUE,
        "customerId" uuid NOT NULL,
        "tenantId" uuid NOT NULL,
        "planId" varchar NOT NULL,
        "status" varchar(32) NOT NULL,
        "billingCycle" varchar(16) NOT NULL,
        "amount" decimal(18,2) NOT NULL CHECK (amount > 0),
        "currency" varchar(3) NOT NULL,
        "startDate" TIMESTAMP NOT NULL,
        "endDate" TIMESTAMP,
        "nextBillingDate" TIMESTAMP,
        CONSTRAINT "fk_subscription_customer" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_subscription_tenant" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE
      );
      CREATE INDEX "idx_subscription_tenant_status_plan" ON "subscription" ("tenantId", "status", "planId");
      CREATE INDEX "idx_subscription_status" ON "subscription" ("status");
      CREATE INDEX "idx_subscription_currency" ON "subscription" ("currency");
      CREATE INDEX "idx_subscription_stripeSubscriptionId" ON "subscription" ("stripeSubscriptionId");
    `);
    // Invoice table
    await queryRunner.query(`
      CREATE TABLE "invoice" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "stripeInvoiceId" varchar NOT NULL UNIQUE,
        "tenantId" uuid NOT NULL,
        "amount" decimal(18,2) NOT NULL CHECK (amount > 0),
        "currency" varchar(3) NOT NULL,
        "dueDate" TIMESTAMP NOT NULL,
        "status" varchar(32) NOT NULL,
        "paymentId" uuid,
        "description" varchar,
        "pdfUrl" varchar,
        "createdAt" TIMESTAMP DEFAULT now(),
        "paidAt" TIMESTAMP,
        CONSTRAINT "fk_invoice_payment" FOREIGN KEY ("paymentId") REFERENCES "payment"("id") ON DELETE SET NULL,
        CONSTRAINT "fk_invoice_tenant" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE
      );
      CREATE INDEX "idx_invoice_tenant_status_due" ON "invoice" ("tenantId", "status", "dueDate");
      CREATE INDEX "idx_invoice_status" ON "invoice" ("status");
      CREATE INDEX "idx_invoice_currency" ON "invoice" ("currency");
      CREATE INDEX "idx_invoice_stripeInvoiceId" ON "invoice" ("stripeInvoiceId");
    `);
    // PaymentMethod table
    await queryRunner.query(`
      CREATE TABLE "payment_method" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "stripeMethodId" varchar NOT NULL UNIQUE,
        "customerId" uuid NOT NULL,
        "type" varchar(32) NOT NULL,
        "last4" varchar(4),
        "expiryMonth" int,
        "expiryYear" int,
        "brand" varchar(32),
        "isDefault" boolean DEFAULT false,
        "createdAt" TIMESTAMP DEFAULT now(),
        CONSTRAINT "fk_paymentmethod_customer" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE CASCADE
      );
      CREATE INDEX "idx_paymentmethod_customer_isDefault" ON "payment_method" ("customerId", "isDefault");
      CREATE INDEX "idx_paymentmethod_type" ON "payment_method" ("type");
      CREATE INDEX "idx_paymentmethod_stripeMethodId" ON "payment_method" ("stripeMethodId");
    `);
    // Transaction table
    await queryRunner.query(`
      CREATE TABLE "transaction" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "paymentId" uuid NOT NULL,
        "type" varchar(32) NOT NULL,
        "amount" decimal(18,2) NOT NULL CHECK (amount > 0),
        "fee" decimal(18,2),
        "currency" varchar(3) NOT NULL,
        "status" varchar(32) NOT NULL,
        "stripeTransactionId" varchar,
        "description" varchar,
        "timestamp" TIMESTAMP NOT NULL,
        CONSTRAINT "fk_transaction_payment" FOREIGN KEY ("paymentId") REFERENCES "payment"("id") ON DELETE CASCADE
      );
      CREATE INDEX "idx_transaction_payment_status_timestamp" ON "transaction" ("paymentId", "status", "timestamp");
      CREATE INDEX "idx_transaction_status" ON "transaction" ("status");
      CREATE INDEX "idx_transaction_currency" ON "transaction" ("currency");
      CREATE INDEX "idx_transaction_stripeTransactionId" ON "transaction" ("stripeTransactionId");
    `);
    // Customer table
    await queryRunner.query(`
      CREATE TABLE "customer" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "stripeCustomerId" varchar NOT NULL UNIQUE,
        "userId" uuid NOT NULL,
        "tenantId" uuid NOT NULL,
        "email" varchar NOT NULL,
        "name" varchar,
        "phone" varchar,
        "address" varchar,
        "defaultPaymentMethodId" uuid,
        CONSTRAINT "fk_customer_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_customer_tenant" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_customer_defaultPaymentMethod" FOREIGN KEY ("defaultPaymentMethodId") REFERENCES "payment_method"("id") ON DELETE SET NULL
      );
      CREATE INDEX "idx_customer_tenant_user_email" ON "customer" ("tenantId", "userId", "email");
      CREATE INDEX "idx_customer_stripeCustomerId" ON "customer" ("stripeCustomerId");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "transaction" CASCADE;');
    await queryRunner.query('DROP TABLE IF EXISTS "payment_method" CASCADE;');
    await queryRunner.query('DROP TABLE IF EXISTS "invoice" CASCADE;');
    await queryRunner.query('DROP TABLE IF EXISTS "subscription" CASCADE;');
    await queryRunner.query('DROP TABLE IF EXISTS "payment" CASCADE;');
    await queryRunner.query('DROP TABLE IF EXISTS "customer" CASCADE;');
  }
} 