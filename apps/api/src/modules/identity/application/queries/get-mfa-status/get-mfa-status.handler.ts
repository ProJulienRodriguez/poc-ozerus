import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  ACCOUNT_REPOSITORY,
  AccountRepositoryPort,
} from '../../../domain/ports/account.repository.port';
import { GetMfaStatusQuery } from './get-mfa-status.query';

@QueryHandler(GetMfaStatusQuery)
export class GetMfaStatusHandler implements IQueryHandler<GetMfaStatusQuery, { enabled: boolean }> {
  constructor(@Inject(ACCOUNT_REPOSITORY) private readonly accounts: AccountRepositoryPort) {}

  async execute(query: GetMfaStatusQuery): Promise<{ enabled: boolean }> {
    const user = await this.accounts.findById(query.accountId);
    return { enabled: Boolean(user?.mfaEnabled) };
  }
}
