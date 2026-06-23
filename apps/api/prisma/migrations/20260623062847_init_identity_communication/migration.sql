-- CreateEnum
CREATE TYPE "identity_role" AS ENUM ('LEARNER', 'TRAINER', 'ADMIN');

-- CreateEnum
CREATE TYPE "identity_user_status" AS ENUM ('PENDING_CONFIRMATION', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "communication_template_status" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "communication_dispatch_status" AS ENUM ('SENT', 'FAILED');

-- CreateTable
CREATE TABLE "identity_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "name" TEXT NOT NULL,
    "role" "identity_role" NOT NULL DEFAULT 'LEARNER',
    "status" "identity_user_status" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activatedAt" TIMESTAMP(3),
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mfaSecretEnc" TEXT,
    "sessionsValidAfter" TIMESTAMP(3),
    "confirmationTokenHash" TEXT,
    "confirmationTokenExpiresAt" TIMESTAMP(3),
    "resetTokenHash" TEXT,
    "resetTokenExpiresAt" TIMESTAMP(3),

    CONSTRAINT "identity_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity_revoked_tokens" (
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "identity_revoked_tokens_pkey" PRIMARY KEY ("tokenHash")
);

-- CreateTable
CREATE TABLE "identity_trusted_devices" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "identity_trusted_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity_mfa_recovery_codes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "identity_mfa_recovery_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity_auth_audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "identity_auth_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity_invites" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "role" "identity_role" NOT NULL DEFAULT 'LEARNER',
    "createdById" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "identity_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communication_template_versions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "communication_template_status" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "communication_template_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communication_template_bodies" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "bodyMjml" TEXT NOT NULL,
    "bodyState" JSONB,
    "variables" TEXT[],
    "engineVersion" INTEGER NOT NULL DEFAULT 1,
    "compiledHtml" TEXT,

    CONSTRAINT "communication_template_bodies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communication_dispatch" (
    "id" TEXT NOT NULL,
    "templateName" TEXT NOT NULL,
    "templateVersion" INTEGER NOT NULL,
    "locale" TEXT NOT NULL,
    "to_address" TEXT NOT NULL,
    "messageId" TEXT,
    "status" "communication_dispatch_status" NOT NULL,
    "error" TEXT,
    "correlationId" TEXT,
    "dispatchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "communication_dispatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "identity_users_email_key" ON "identity_users"("email");

-- CreateIndex
CREATE INDEX "identity_users_confirmationTokenHash_idx" ON "identity_users"("confirmationTokenHash");

-- CreateIndex
CREATE INDEX "identity_users_resetTokenHash_idx" ON "identity_users"("resetTokenHash");

-- CreateIndex
CREATE INDEX "identity_trusted_devices_userId_idx" ON "identity_trusted_devices"("userId");

-- CreateIndex
CREATE INDEX "identity_mfa_recovery_codes_userId_idx" ON "identity_mfa_recovery_codes"("userId");

-- CreateIndex
CREATE INDEX "identity_auth_audit_logs_userId_idx" ON "identity_auth_audit_logs"("userId");

-- CreateIndex
CREATE INDEX "identity_auth_audit_logs_type_idx" ON "identity_auth_audit_logs"("type");

-- CreateIndex
CREATE INDEX "communication_template_versions_name_status_idx" ON "communication_template_versions"("name", "status");

-- CreateIndex
CREATE UNIQUE INDEX "communication_template_versions_name_version_key" ON "communication_template_versions"("name", "version");

-- CreateIndex
CREATE UNIQUE INDEX "communication_template_bodies_versionId_locale_key" ON "communication_template_bodies"("versionId", "locale");

-- CreateIndex
CREATE INDEX "communication_dispatch_templateName_dispatchedAt_idx" ON "communication_dispatch"("templateName", "dispatchedAt");

-- CreateIndex
CREATE INDEX "communication_dispatch_to_address_dispatchedAt_idx" ON "communication_dispatch"("to_address", "dispatchedAt");

-- CreateIndex
CREATE INDEX "communication_dispatch_status_dispatchedAt_idx" ON "communication_dispatch"("status", "dispatchedAt");

-- AddForeignKey
ALTER TABLE "identity_trusted_devices" ADD CONSTRAINT "identity_trusted_devices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "identity_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity_mfa_recovery_codes" ADD CONSTRAINT "identity_mfa_recovery_codes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "identity_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity_auth_audit_logs" ADD CONSTRAINT "identity_auth_audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "identity_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity_invites" ADD CONSTRAINT "identity_invites_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "identity_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_template_bodies" ADD CONSTRAINT "communication_template_bodies_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "communication_template_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
