import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  TRUSTED_DEVICE_REPOSITORY,
  TrustedDeviceRepositoryPort,
  TrustedDeviceView,
} from '../../../domain/ports/trusted-device.repository.port';
import { GetTrustedDevicesQuery } from './get-trusted-devices.query';

@QueryHandler(GetTrustedDevicesQuery)
export class GetTrustedDevicesHandler
  implements IQueryHandler<GetTrustedDevicesQuery, TrustedDeviceView[]>
{
  constructor(
    @Inject(TRUSTED_DEVICE_REPOSITORY) private readonly devices: TrustedDeviceRepositoryPort,
  ) {}

  execute(query: GetTrustedDevicesQuery): Promise<TrustedDeviceView[]> {
    return this.devices.listForUser(query.accountId);
  }
}
