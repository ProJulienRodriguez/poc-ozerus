/* Agrégat Account.

   Convention « event sourcing » de @nestjs/cqrs, MAIS sans event store : l'entité
   Prisma reste la seule source de vérité (snapshot). On ne persiste pas les events,
   on les publie après le commit DB pour déclencher les effets de bord (audit, mail…).

   Asymétrie : écriture via apply(event) → on<Event>() ou mutation directe (état
   dérivé d'infra/horloge) ; lecture = réhydratation depuis le snapshot (fromRow).

   Les tokens d'activation / réinitialisation sont portés PAR le compte (value object
   HashedToken, hashé au repos) — pas de table séparée. Activation/reset/création
   deviennent donc des opérations mono-agrégat.

   Frontière de concurrence : les compteurs de lockout (failedLoginAttempts,
   lockedUntil) ne sont PAS gérés ici (opérations atomiques dédiées, cf. login).
*/
import { randomUUID } from 'crypto';
import { AggregateRoot } from '@nestjs/cqrs';
import { Role, User, UserStatus } from '@prisma/client';
import { AccountActivatedEvent } from './events/account-activated.event';
import { AccountCreatedEvent } from './events/account-created.event';
import { AccountDeletedEvent } from './events/account-deleted.event';
import { AccountRegisteredEvent } from './events/account-registered.event';
import { AccountRoleChangedEvent } from './events/account-role-changed.event';
import { AccountSuspendedEvent } from './events/account-suspended.event';
import { AccountUnsuspendedEvent } from './events/account-unsuspended.event';
import { PasswordChangedEvent } from './events/password-changed.event';
import { MfaToggledEvent } from './events/mfa-enabled.event';
import { PasswordResetRequestedEvent } from './events/password-reset-requested.event';
import { SecurityActionEvent } from './events/security-action.event';
import {
  AccountNotSuspendedException,
  InvalidTokenException,
  MfaNotEnabledException,
  MfaNotEnrolledException,
} from './exceptions/identity.exceptions';
import { HashedToken } from './value-objects/hashed-token';

interface CreatePendingProps {
  email: string;
  name: string;
  role: Role;
  confirmationTokenHash: string;
  confirmationTokenExpiresAt: Date;
  /** Token en clair, uniquement porté par l'event (jamais stocké). */
  plainToken: string;
}

interface RegisterProps {
  email: string;
  name: string;
  role: Role;
  passwordHash: string;
  inviteId: string;
  now: Date;
}

/** Projection de persistance d'un compte (hors id). Consommée par le repository. */
export interface AccountSnapshot {
  email: string;
  name: string;
  status: UserStatus;
  role: Role;
  passwordHash: string | null;
  activatedAt: Date | null;
  sessionsValidAfter: Date | null;
  confirmationTokenHash: string | null;
  confirmationTokenExpiresAt: Date | null;
  resetTokenHash: string | null;
  resetTokenExpiresAt: Date | null;
  mfaEnabled: boolean;
  mfaSecretEnc: string | null;
}

export class Account extends AggregateRoot {
  private _email!: string;
  private _name!: string;
  private _status!: UserStatus;
  private _role!: Role;
  private _passwordHash!: string | null;
  private _activatedAt!: Date | null;
  private _sessionsValidAfter!: Date | null;
  private _confirmationToken!: HashedToken | null;
  private _resetToken!: HashedToken | null;
  private _mfaEnabled!: boolean;
  private _mfaSecretEnc!: string | null;

  private constructor(public readonly id: string) {
    super();
  }

  /** Réhydratation depuis le snapshot Prisma (pas de replay d'events). */
  static fromRow(row: User): Account {
    const account = new Account(row.id);
    account._email = row.email;
    account._name = row.name;
    account._status = row.status;
    account._role = row.role;
    account._passwordHash = row.passwordHash;
    account._activatedAt = row.activatedAt;
    account._sessionsValidAfter = row.sessionsValidAfter;
    account._confirmationToken = HashedToken.fromRow(
      row.confirmationTokenHash,
      row.confirmationTokenExpiresAt,
    );
    account._resetToken = HashedToken.fromRow(row.resetTokenHash, row.resetTokenExpiresAt);
    account._mfaEnabled = row.mfaEnabled;
    account._mfaSecretEnc = row.mfaSecretEnc;
    return account;
  }

  /** (Admin) Création d'un compte PENDING avec un token d'activation. */
  static createPending(props: CreatePendingProps): Account {
    const account = new Account(randomUUID());
    account._email = props.email;
    account._name = props.name;
    account._role = props.role;
    account._status = 'PENDING_CONFIRMATION';
    account._passwordHash = null;
    account._activatedAt = null;
    account._sessionsValidAfter = null;
    account._confirmationToken = HashedToken.of(
      props.confirmationTokenHash,
      props.confirmationTokenExpiresAt,
    );
    account._resetToken = null;
    account._mfaEnabled = false;
    account._mfaSecretEnc = null;
    account.apply(new AccountCreatedEvent(account.id, props.email, props.name, props.plainToken));
    return account;
  }

  /** Création via invitation : compte ACTIVE avec mot de passe déjà défini. */
  static register(props: RegisterProps): Account {
    const account = new Account(randomUUID());
    account._email = props.email;
    account._name = props.name;
    account._role = props.role;
    account._status = 'ACTIVE';
    account._passwordHash = props.passwordHash;
    account._activatedAt = props.now;
    account._sessionsValidAfter = null;
    account._confirmationToken = null;
    account._resetToken = null;
    account._mfaEnabled = false;
    account._mfaSecretEnc = null;
    account.apply(new AccountRegisteredEvent(account.id, props.email, props.inviteId));
    return account;
  }

  /** Projection de persistance (consommée par le repository). Réservée à l'infra :
     évite d'exposer chaque champ — dont passwordHash/mfaSecretEnc — en getter public. */
  snapshot(): AccountSnapshot {
    return {
      email: this._email,
      name: this._name,
      status: this._status,
      role: this._role,
      passwordHash: this._passwordHash,
      activatedAt: this._activatedAt,
      sessionsValidAfter: this._sessionsValidAfter,
      confirmationTokenHash: this._confirmationToken?.hash ?? null,
      confirmationTokenExpiresAt: this._confirmationToken?.expiresAt ?? null,
      resetTokenHash: this._resetToken?.hash ?? null,
      resetTokenExpiresAt: this._resetToken?.expiresAt ?? null,
      mfaEnabled: this._mfaEnabled,
      mfaSecretEnc: this._mfaSecretEnc,
    };
  }

  // --- Commandes (gardiennes des invariants) ---

  suspend(byAdminId: string): void {
    this.apply(new AccountSuspendedEvent(this.id, byAdminId));
  }

  unsuspend(byAdminId: string): void {
    if (this._status !== 'SUSPENDED') {
      throw new AccountNotSuspendedException();
    }
    this.apply(new AccountUnsuspendedEvent(this.id, byAdminId));
  }

  /** Suppression (RGPD) : émet l'event qui porte l'email (l'entité va disparaître). */
  markDeleted(byAdminId: string): void {
    this.apply(new AccountDeletedEvent(this.id, this._email, byAdminId));
  }

  changeRole(role: Role, byAdminId: string): void {
    this.apply(new AccountRoleChangedEvent(this.id, role, byAdminId));
  }

  /** « Déconnexion partout » : invalide tout token émis avant `at`. */
  revokeAllSessions(at: Date): void {
    this._sessionsValidAfter = at;
    this.apply(new SecurityActionEvent(this.id, 'SESSIONS_REVOKED'));
  }

  /** Activation : valide le token de confirmation, définit le mot de passe, passe ACTIVE. */
  activate(submittedTokenHash: string, passwordHash: string, now: Date): void {
    this.assertTokenValid(this._confirmationToken, submittedTokenHash, now);
    this._passwordHash = passwordHash;
    this._activatedAt = now;
    this._confirmationToken = null;
    this.apply(new AccountActivatedEvent(this.id));
  }

  /** Demande de réinitialisation : pose un token de reset (un seul slot = un seul lien valide). */
  requestPasswordReset(resetTokenHash: string, expiresAt: Date, plainToken: string): void {
    this._resetToken = HashedToken.of(resetTokenHash, expiresAt);
    this.apply(new PasswordResetRequestedEvent(this.id, this._email, this._name, plainToken));
  }

  /** Réinitialisation via lien : valide le token de reset puis change le mot de passe. */
  resetPassword(submittedTokenHash: string, passwordHash: string, now: Date): void {
    this.assertTokenValid(this._resetToken, submittedTokenHash, now);
    this._passwordHash = passwordHash;
    this._resetToken = null;
    this.apply(new PasswordChangedEvent(this.id, 'reset'));
  }

  /** Changement de mot de passe par l'utilisateur connecté. */
  changePassword(passwordHash: string): void {
    this._passwordHash = passwordHash;
    this.apply(new PasswordChangedEvent(this.id, 'change'));
  }

  /** Enrôlement MFA : stocke le secret chiffré (MFA inactif tant que non confirmé). */
  enrollMfa(secretEnc: string): void {
    this._mfaSecretEnc = secretEnc;
  }

  /** Confirmation MFA : active le MFA (le secret doit avoir été enrôlé). */
  confirmMfa(): void {
    if (!this._mfaSecretEnc) {
      throw new MfaNotEnrolledException();
    }
    this._mfaEnabled = true;
    this.apply(new MfaToggledEvent(this.id, true));
  }

  /** Désactivation MFA : coupe le MFA et oublie le secret. */
  disableMfa(): void {
    if (!this._mfaEnabled) {
      throw new MfaNotEnabledException();
    }
    this._mfaEnabled = false;
    this._mfaSecretEnc = null;
    this.apply(new MfaToggledEvent(this.id, false));
  }

  private assertTokenValid(token: HashedToken | null, submittedHash: string, now: Date): void {
    if (!token || token.isExpired(now) || !token.matches(submittedHash)) {
      throw new InvalidTokenException();
    }
  }

  // --- Mutations d'état pilotées par les events (appelées par apply()) ---

  private onAccountSuspendedEvent(_event: AccountSuspendedEvent): void {
    this._status = 'SUSPENDED';
  }

  private onAccountUnsuspendedEvent(_event: AccountUnsuspendedEvent): void {
    this._status = 'ACTIVE';
  }

  private onAccountRoleChangedEvent(event: AccountRoleChangedEvent): void {
    this._role = event.role;
  }

  private onAccountActivatedEvent(_event: AccountActivatedEvent): void {
    this._status = 'ACTIVE';
  }
}
