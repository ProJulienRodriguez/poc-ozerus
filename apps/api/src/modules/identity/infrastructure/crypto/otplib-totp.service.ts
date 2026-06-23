import { Injectable } from '@nestjs/common';
import { authenticator } from 'otplib';
import { TotpServicePort } from '../../domain/ports/totp.service.port';

// Libellé affiché par l'app d'authentification. Configurable via MFA_ISSUER
// (à défaut COMMUNICATION_APP_NAME), sinon « Ozerus ».
const ISSUER = process.env.MFA_ISSUER || process.env.COMMUNICATION_APP_NAME || 'Ozerus';

@Injectable()
export class OtplibTotpService implements TotpServicePort {
  constructor() {
    // Tolérance d'une fenêtre (±30 s) pour absorber le décalage d'horloge.
    authenticator.options = { window: 1 };
  }

  generateSecret(): string {
    return authenticator.generateSecret();
  }

  keyUri(accountName: string, secret: string): string {
    return authenticator.keyuri(accountName, ISSUER, secret);
  }

  verify(token: string, secret: string): boolean {
    try {
      return authenticator.verify({ token, secret });
    } catch {
      return false;
    }
  }
}
