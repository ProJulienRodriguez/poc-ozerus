import { Query } from '@nestjs/cqrs';
import { TrustedDeviceView } from '../../../domain/ports/trusted-device.repository.port';

/** Liste les appareils de confiance (non expirés) du compte courant. */
export class GetTrustedDevicesQuery extends Query<TrustedDeviceView[]> {
  constructor(public readonly accountId: string) {
    super();
  }
}
