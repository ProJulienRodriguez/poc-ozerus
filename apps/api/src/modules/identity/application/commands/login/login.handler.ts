import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { AccountLockedEvent } from '../../../domain/events/account-locked.event';
import { AccountLoggedInEvent } from '../../../domain/events/account-logged-in.event';
import { AccountLoginFailedEvent } from '../../../domain/events/account-login-failed.event';
import {
  AccountLockedException,
  AccountNotActiveException,
  InvalidCredentialsException,
} from '../../../domain/exceptions/identity.exceptions';
import {
  ACCOUNT_REPOSITORY,
  AccountRepositoryPort,
} from '../../../domain/ports/account.repository.port';
import {
  PASSWORD_HASHER,
  PasswordHasherPort,
} from '../../../domain/ports/password-hasher.port';
import {
  TRUSTED_DEVICE_REPOSITORY,
  TrustedDeviceRepositoryPort,
} from '../../../domain/ports/trusted-device.repository.port';
import { LOCK_DURATION_MS, MAX_FAILED_LOGINS } from '../../identity.constants';
import { LoginCommand, LoginResult } from './login.command';

@CommandHandler(LoginCommand)
export class LoginHandler implements ICommandHandler<LoginCommand, LoginResult> {
  constructor(
    @Inject(ACCOUNT_REPOSITORY) private readonly accounts: AccountRepositoryPort,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasherPort,
    @Inject(TRUSTED_DEVICE_REPOSITORY) private readonly devices: TrustedDeviceRepositoryPort,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: LoginCommand): Promise<LoginResult> {
    const user = await this.accounts.findByEmail(command.email);

    // Compte inexistant ou jamais activé : pas de fuite d'information précise.
    if (!user || !user.passwordHash) {
      throw new InvalidCredentialsException();
    }

    // Verrou actif : on bloque AVANT toute vérification de mot de passe.
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new AccountLockedException(user.lockedUntil);
    }

    const ok = await this.hasher.compare(command.password, user.passwordHash);
    if (!ok) {
      // Lockout SYNCHRONE (sécurité) : incrément atomique + verrou au seuil.
      const attempts = await this.accounts.incrementFailedLogin(user.id);
      this.eventBus.publish(
        new AccountLoginFailedEvent(user.id, user.email, command.ipAddress, command.userAgent),
      );
      if (attempts >= MAX_FAILED_LOGINS) {
        const until = new Date(Date.now() + LOCK_DURATION_MS);
        await this.accounts.lock(user.id, until);
        this.eventBus.publish(new AccountLockedEvent(user.id, until, attempts));
        throw new AccountLockedException(until);
      }
      throw new InvalidCredentialsException();
    }

    if (user.status === 'PENDING_CONFIRMATION') {
      throw new AccountNotActiveException("Compte non activé — vérifie ton email d'invitation");
    }
    if (user.status === 'SUSPENDED') {
      throw new AccountNotActiveException('Compte suspendu — contacte ton référent du programme');
    }

    // Mot de passe correct : on remet les compteurs à zéro (synchrone).
    await this.accounts.resetLoginCounters(user.id);

    // MFA requis, sauf si la connexion vient d'un appareil de confiance valide.
    let requiresMfa = user.mfaEnabled;
    if (requiresMfa && command.trustedDeviceId) {
      const trusted = await this.devices.isValid(user.id, command.trustedDeviceId);
      if (trusted) requiresMfa = false;
    }

    // On ne marque la connexion (audit) qu'une fois l'authentification complète :
    // si MFA requis, c'est le handler du défi MFA qui émettra AccountLoggedIn.
    if (!requiresMfa) {
      this.eventBus.publish(
        new AccountLoggedInEvent(user.id, command.ipAddress, command.userAgent),
      );
    }

    return {
      accountId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      requiresMfa,
    };
  }
}
