import { Inject } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { AccountActivatedEvent } from '../../domain/events/account-activated.event';
import { AccountCreatedEvent } from '../../domain/events/account-created.event';
import { AccountDeletedEvent } from '../../domain/events/account-deleted.event';
import { AccountLockedEvent } from '../../domain/events/account-locked.event';
import { AccountLoggedInEvent } from '../../domain/events/account-logged-in.event';
import { AccountLoginFailedEvent } from '../../domain/events/account-login-failed.event';
import { AccountRegisteredEvent } from '../../domain/events/account-registered.event';
import { AccountRoleChangedEvent } from '../../domain/events/account-role-changed.event';
import { AccountSuspendedEvent } from '../../domain/events/account-suspended.event';
import { AccountUnlockedEvent } from '../../domain/events/account-unlocked.event';
import { AccountUnsuspendedEvent } from '../../domain/events/account-unsuspended.event';
import { MfaToggledEvent } from '../../domain/events/mfa-enabled.event';
import { PasswordChangedEvent } from '../../domain/events/password-changed.event';
import { PasswordResetRequestedEvent } from '../../domain/events/password-reset-requested.event';
import { SecurityActionEvent } from '../../domain/events/security-action.event';
import {
  AUDIT_REPOSITORY,
  AuditEntry,
  AuditRepositoryPort,
} from '../../domain/ports/audit.repository.port';

type AuditableEvent =
  | AccountLoggedInEvent
  | AccountLoginFailedEvent
  | AccountLockedEvent
  | AccountCreatedEvent
  | AccountActivatedEvent
  | PasswordResetRequestedEvent
  | PasswordChangedEvent
  | MfaToggledEvent
  | AccountRegisteredEvent
  | AccountSuspendedEvent
  | AccountUnsuspendedEvent
  | AccountUnlockedEvent
  | AccountDeletedEvent
  | AccountRoleChangedEvent
  | SecurityActionEvent;

/** Trace tous les événements d'identité dans le journal d'audit (découplé). */
@EventsHandler(
  AccountLoggedInEvent,
  AccountLoginFailedEvent,
  AccountLockedEvent,
  AccountCreatedEvent,
  AccountActivatedEvent,
  PasswordResetRequestedEvent,
  PasswordChangedEvent,
  MfaToggledEvent,
  AccountRegisteredEvent,
  AccountSuspendedEvent,
  AccountUnsuspendedEvent,
  AccountUnlockedEvent,
  AccountDeletedEvent,
  AccountRoleChangedEvent,
  SecurityActionEvent,
)
export class WriteAuditLogHandler implements IEventHandler<AuditableEvent> {
  constructor(@Inject(AUDIT_REPOSITORY) private readonly audit: AuditRepositoryPort) {}

  async handle(event: AuditableEvent): Promise<void> {
    await this.audit.record(this.toEntry(event));
  }

  private toEntry(event: AuditableEvent): AuditEntry {
    if (event instanceof AccountLoggedInEvent) {
      return {
        userId: event.accountId,
        type: 'LOGIN_OK',
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
      };
    }
    if (event instanceof AccountLoginFailedEvent) {
      return {
        userId: event.accountId,
        type: 'LOGIN_FAILED',
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        metadata: { email: event.email },
      };
    }
    if (event instanceof AccountLockedEvent) {
      return {
        userId: event.accountId,
        type: 'ACCOUNT_LOCKED',
        metadata: {
          lockedUntil: event.lockedUntil.toISOString(),
          failedAttempts: event.failedAttempts,
        },
      };
    }
    if (event instanceof AccountCreatedEvent) {
      return { userId: event.accountId, type: 'ACCOUNT_CREATED', metadata: { email: event.email } };
    }
    if (event instanceof AccountActivatedEvent) {
      return { userId: event.accountId, type: 'ACCOUNT_ACTIVATED' };
    }
    if (event instanceof PasswordResetRequestedEvent) {
      return { userId: event.accountId, type: 'PASSWORD_RESET_REQUESTED' };
    }
    if (event instanceof MfaToggledEvent) {
      return { userId: event.accountId, type: event.enabled ? 'MFA_ENABLED' : 'MFA_DISABLED' };
    }
    if (event instanceof AccountRegisteredEvent) {
      return {
        userId: event.accountId,
        type: 'ACCOUNT_REGISTERED',
        metadata: { email: event.email, inviteId: event.inviteId },
      };
    }
    if (event instanceof AccountSuspendedEvent) {
      return { userId: event.accountId, type: 'ACCOUNT_SUSPENDED', metadata: { byAdminId: event.byAdminId } };
    }
    if (event instanceof AccountUnsuspendedEvent) {
      return { userId: event.accountId, type: 'ACCOUNT_UNSUSPENDED', metadata: { byAdminId: event.byAdminId } };
    }
    if (event instanceof AccountUnlockedEvent) {
      return { userId: event.accountId, type: 'ACCOUNT_UNLOCKED', metadata: { byAdminId: event.byAdminId } };
    }
    if (event instanceof AccountDeletedEvent) {
      // L'utilisateur n'existe plus : on ne référence pas userId (FK), tout en métadonnées.
      return {
        userId: null,
        type: 'ACCOUNT_DELETED',
        metadata: { accountId: event.accountId, email: event.email, byAdminId: event.byAdminId },
      };
    }
    if (event instanceof AccountRoleChangedEvent) {
      return {
        userId: event.accountId,
        type: 'ROLE_CHANGED',
        metadata: { role: event.role, byAdminId: event.byAdminId },
      };
    }
    if (event instanceof SecurityActionEvent) {
      return { userId: event.accountId, type: event.action };
    }
    return { userId: event.accountId, type: 'PASSWORD_CHANGED', metadata: { via: event.via } };
  }
}
