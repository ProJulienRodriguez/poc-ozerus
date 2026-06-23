/* Exceptions du domaine identity, mappées sur des codes HTTP. */
import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

export class InvalidCredentialsException extends UnauthorizedException {
  constructor() {
    super('Email ou mot de passe incorrect');
  }
}

export class AccountNotActiveException extends ForbiddenException {
  constructor(message = 'Compte non actif — contacte ton référent du programme') {
    super(message);
  }
}

export class AccountLockedException extends HttpException {
  constructor(until: Date) {
    super(
      `Compte temporairement verrouillé suite à trop de tentatives. Réessaie après ${until.toLocaleTimeString('fr-FR', { timeZone: 'Europe/Paris' })}.`,
      HttpStatus.LOCKED,
    );
  }
}

export class InvalidTokenException extends BadRequestException {
  constructor(message = 'Lien invalide ou expiré') {
    super(message);
  }
}

export class AccountNotSuspendedException extends BadRequestException {
  constructor() {
    super("Le compte n'est pas suspendu");
  }
}

export class MfaNotEnrolledException extends BadRequestException {
  constructor() {
    super('Aucun enrôlement MFA en cours');
  }
}

export class MfaNotEnabledException extends BadRequestException {
  constructor() {
    super("Le MFA n'est pas activé");
  }
}

export class InviteAlreadyUsedException extends BadRequestException {
  constructor() {
    super('Invitation déjà utilisée');
  }
}

export class InviteExpiredException extends BadRequestException {
  constructor() {
    super('Invitation expirée');
  }
}

export class InviteEmailMismatchException extends BadRequestException {
  constructor() {
    super('Cette invitation est réservée à une autre adresse email');
  }
}

export class TrustedDeviceNotFoundException extends NotFoundException {
  constructor() {
    super('Appareil de confiance introuvable');
  }
}
