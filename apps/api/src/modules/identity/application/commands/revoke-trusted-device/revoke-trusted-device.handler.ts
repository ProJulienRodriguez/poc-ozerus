import { Inject } from '@nestjs/common';
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { TrustedDevice } from '../../../domain/trusted-device.aggregate';
import { TrustedDeviceNotFoundException } from '../../../domain/exceptions/identity.exceptions';
import {
  TRUSTED_DEVICE_REPOSITORY,
  TrustedDeviceRepositoryPort,
} from '../../../domain/ports/trusted-device.repository.port';
import { RevokeTrustedDeviceCommand } from './revoke-trusted-device.command';

@CommandHandler(RevokeTrustedDeviceCommand)
export class RevokeTrustedDeviceHandler
  implements ICommandHandler<RevokeTrustedDeviceCommand, void>
{
  constructor(
    @Inject(TRUSTED_DEVICE_REPOSITORY) private readonly devices: TrustedDeviceRepositoryPort,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: RevokeTrustedDeviceCommand): Promise<void> {
    const row = await this.devices.findById(command.deviceId);
    if (!row) throw new TrustedDeviceNotFoundException();

    // L'agrégat porte l'invariant de propriété (un appareil d'autrui = introuvable).
    const device = this.publisher.mergeObjectContext(TrustedDevice.fromRow(row));
    device.revoke(command.accountId);
    await this.devices.remove(device.id);
    device.commit(); // SecurityActionEvent (TRUSTED_DEVICE_REVOKED) publié après commit
  }
}
