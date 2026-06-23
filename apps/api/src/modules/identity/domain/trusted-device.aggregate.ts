/* Agrégat TrustedDevice (appareil de confiance autorisant à sauter le MFA).

   Même convention « snapshot » que les autres agrégats : la ligne Prisma est la
   source de vérité ; l'event est publié après le commit DB.
*/
import { AggregateRoot } from '@nestjs/cqrs';
import { TrustedDevice as TrustedDeviceRow } from '@prisma/client';
import { SecurityActionEvent } from './events/security-action.event';
import { TrustedDeviceNotFoundException } from './exceptions/identity.exceptions';

export class TrustedDevice extends AggregateRoot {
  private _userId!: string;

  private constructor(public readonly id: string) {
    super();
  }

  static fromRow(row: TrustedDeviceRow): TrustedDevice {
    const device = new TrustedDevice(row.id);
    device._userId = row.userId;
    return device;
  }

  /** Révocation par le propriétaire. Invariant : l'appareil doit appartenir au compte.
     Un appareil d'autrui est traité comme introuvable (ne révèle pas son existence). */
  revoke(byAccountId: string): void {
    if (this._userId !== byAccountId) {
      throw new TrustedDeviceNotFoundException();
    }
    this.apply(new SecurityActionEvent(this._userId, 'TRUSTED_DEVICE_REVOKED'));
  }
}
