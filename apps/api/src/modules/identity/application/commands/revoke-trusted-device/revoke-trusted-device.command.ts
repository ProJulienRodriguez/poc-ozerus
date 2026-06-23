import { Command } from '@nestjs/cqrs';

/** Révoque un appareil de confiance du compte (il redemandera le MFA). */
export class RevokeTrustedDeviceCommand extends Command<void> {
  constructor(
    public readonly accountId: string,
    public readonly deviceId: string,
  ) {
    super();
  }
}
