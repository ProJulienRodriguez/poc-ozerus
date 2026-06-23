import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { ActivateAccountHandler } from './application/commands/activate-account/activate-account.handler';
import { ChangePasswordHandler } from './application/commands/change-password/change-password.handler';
import { ChangeRoleHandler } from './application/commands/change-role/change-role.handler';
import { ConfirmMfaHandler } from './application/commands/confirm-mfa/confirm-mfa.handler';
import { CreateAccountHandler } from './application/commands/create-account/create-account.handler';
import { CreateInviteHandler } from './application/commands/create-invite/create-invite.handler';
import { DeleteAccountHandler } from './application/commands/delete-account/delete-account.handler';
import { DisableMfaHandler } from './application/commands/disable-mfa/disable-mfa.handler';
import { EnrollMfaHandler } from './application/commands/enroll-mfa/enroll-mfa.handler';
import { LoginHandler } from './application/commands/login/login.handler';
import { RegenerateRecoveryCodesHandler } from './application/commands/regenerate-recovery-codes/regenerate-recovery-codes.handler';
import { RegisterViaInviteHandler } from './application/commands/register-via-invite/register-via-invite.handler';
import { RequestPasswordResetHandler } from './application/commands/request-password-reset/request-password-reset.handler';
import { ResetPasswordHandler } from './application/commands/reset-password/reset-password.handler';
import { RevokeAllSessionsHandler } from './application/commands/revoke-all-sessions/revoke-all-sessions.handler';
import { RevokeInviteHandler } from './application/commands/revoke-invite/revoke-invite.handler';
import { RevokeTrustedDeviceHandler } from './application/commands/revoke-trusted-device/revoke-trusted-device.handler';
import { SuspendAccountHandler } from './application/commands/suspend-account/suspend-account.handler';
import { UnlockAccountHandler } from './application/commands/unlock-account/unlock-account.handler';
import { UnsuspendAccountHandler } from './application/commands/unsuspend-account/unsuspend-account.handler';
import { VerifyMfaChallengeHandler } from './application/commands/verify-mfa-challenge/verify-mfa-challenge.handler';
import { SendActivationEmailHandler } from './application/event-handlers/send-activation-email.handler';
import { SendInviteEmailHandler } from './application/event-handlers/send-invite-email.handler';
import { SendPasswordResetEmailHandler } from './application/event-handlers/send-password-reset-email.handler';
import { WriteAuditLogHandler } from './application/event-handlers/write-audit-log.handler';
import { GetInviteInfoHandler } from './application/queries/get-invite-info/get-invite-info.handler';
import { GetMeHandler } from './application/queries/get-me/get-me.handler';
import { GetAccountActivityHandler } from './application/queries/get-account-activity/get-account-activity.handler';
import { GetMfaStatusHandler } from './application/queries/get-mfa-status/get-mfa-status.handler';
import { GetMyActivityHandler } from './application/queries/get-my-activity/get-my-activity.handler';
import { GetTrustedDevicesHandler } from './application/queries/get-trusted-devices/get-trusted-devices.handler';
import { ListAccountsHandler } from './application/queries/list-accounts/list-accounts.handler';
import { ListInvitesHandler } from './application/queries/list-invites/list-invites.handler';
import { ACCOUNT_REPOSITORY } from './domain/ports/account.repository.port';
import { AUDIT_REPOSITORY } from './domain/ports/audit.repository.port';
import { INVITE_REPOSITORY } from './domain/ports/invite.repository.port';
import { MAILER } from './domain/ports/mailer.port';
import { PASSWORD_HASHER } from './domain/ports/password-hasher.port';
import { RECOVERY_CODE_REPOSITORY } from './domain/ports/recovery-code.repository.port';
import { REVOKED_TOKEN_REPOSITORY } from './domain/ports/revoked-token.repository.port';
import { SECRET_CIPHER } from './domain/ports/secret-cipher.port';
import { TOTP_SERVICE } from './domain/ports/totp.service.port';
import { TRUSTED_DEVICE_REPOSITORY } from './domain/ports/trusted-device.repository.port';
import { AesSecretCipher } from './infrastructure/crypto/aes-secret-cipher';
import { BcryptPasswordHasher } from './infrastructure/crypto/bcrypt-password-hasher';
import { OtplibTotpService } from './infrastructure/crypto/otplib-totp.service';
import { JwtTokenService } from './infrastructure/jwt/jwt-token.service';
import { IdentityMailer } from './infrastructure/mail/identity-mailer';
import { PrismaAccountRepository } from './infrastructure/persistence/prisma-account.repository';
import { PrismaAuditRepository } from './infrastructure/persistence/prisma-audit.repository';
import { PrismaInviteRepository } from './infrastructure/persistence/prisma-invite.repository';
import { PrismaRecoveryCodeRepository } from './infrastructure/persistence/prisma-recovery-code.repository';
import { PrismaRevokedTokenRepository } from './infrastructure/persistence/prisma-revoked-token.repository';
import { PrismaTrustedDeviceRepository } from './infrastructure/persistence/prisma-trusted-device.repository';
import { PurgeTokensCron } from './infrastructure/schedule/purge-tokens.cron';
import { AdminAccountsController } from './presentation/http/admin-accounts.controller';
import { AdminInvitesController } from './presentation/http/admin-invites.controller';
import { AdminUsersController } from './presentation/http/admin-users.controller';
import { AuthController } from './presentation/http/auth.controller';
import { InvitesController } from './presentation/http/invites.controller';
import { MfaController } from './presentation/http/mfa.controller';
import {
  AccessTokenGuard,
  AdminGuard,
  TrainerGuard,
} from './presentation/guards/access-token.guard';

const commandHandlers = [
  LoginHandler,
  CreateAccountHandler,
  ActivateAccountHandler,
  RequestPasswordResetHandler,
  ResetPasswordHandler,
  ChangePasswordHandler,
  EnrollMfaHandler,
  ConfirmMfaHandler,
  DisableMfaHandler,
  VerifyMfaChallengeHandler,
  RegenerateRecoveryCodesHandler,
  RevokeTrustedDeviceHandler,
  RevokeAllSessionsHandler,
  CreateInviteHandler,
  RevokeInviteHandler,
  RegisterViaInviteHandler,
  SuspendAccountHandler,
  UnsuspendAccountHandler,
  UnlockAccountHandler,
  DeleteAccountHandler,
  ChangeRoleHandler,
];
const queryHandlers = [
  GetMeHandler,
  GetMfaStatusHandler,
  GetTrustedDevicesHandler,
  GetMyActivityHandler,
  GetAccountActivityHandler,
  GetInviteInfoHandler,
  ListInvitesHandler,
  ListAccountsHandler,
];
const eventHandlers = [
  SendActivationEmailHandler,
  SendInviteEmailHandler,
  SendPasswordResetEmailHandler,
  WriteAuditLogHandler,
];

const adapters = [
  { provide: ACCOUNT_REPOSITORY, useClass: PrismaAccountRepository },
  { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
  { provide: REVOKED_TOKEN_REPOSITORY, useClass: PrismaRevokedTokenRepository },
  { provide: AUDIT_REPOSITORY, useClass: PrismaAuditRepository },
  { provide: MAILER, useClass: IdentityMailer },
  { provide: TOTP_SERVICE, useClass: OtplibTotpService },
  { provide: SECRET_CIPHER, useClass: AesSecretCipher },
  { provide: TRUSTED_DEVICE_REPOSITORY, useClass: PrismaTrustedDeviceRepository },
  { provide: RECOVERY_CODE_REPOSITORY, useClass: PrismaRecoveryCodeRepository },
  { provide: INVITE_REPOSITORY, useClass: PrismaInviteRepository },
];

@Module({
  imports: [CqrsModule, JwtModule.register({})],
  controllers: [
    AuthController,
    AdminAccountsController,
    AdminInvitesController,
    AdminUsersController,
    InvitesController,
    MfaController,
  ],
  providers: [
    ...commandHandlers,
    ...queryHandlers,
    ...eventHandlers,
    ...adapters,
    JwtTokenService,
    PurgeTokensCron,
    AccessTokenGuard,
    TrainerGuard,
    AdminGuard,
  ],
  exports: [
    JwtTokenService,
    AccessTokenGuard,
    TrainerGuard,
    AdminGuard,
    ACCOUNT_REPOSITORY,
    PASSWORD_HASHER,
    REVOKED_TOKEN_REPOSITORY,
  ],
})
export class IdentityModule {}
