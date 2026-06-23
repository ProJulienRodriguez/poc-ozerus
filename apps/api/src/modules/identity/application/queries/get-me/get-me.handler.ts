import { Inject, UnauthorizedException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PublicUser, toPublicUser } from '../../../domain/auth-user';
import {
  ACCOUNT_REPOSITORY,
  AccountRepositoryPort,
} from '../../../domain/ports/account.repository.port';
import { GetMeQuery } from './get-me.query';

@QueryHandler(GetMeQuery)
export class GetMeHandler implements IQueryHandler<GetMeQuery, PublicUser> {
  constructor(
    @Inject(ACCOUNT_REPOSITORY) private readonly accounts: AccountRepositoryPort,
  ) {}

  async execute(query: GetMeQuery): Promise<PublicUser> {
    const user = await this.accounts.findById(query.accountId);
    if (!user || user.status === 'SUSPENDED') {
      throw new UnauthorizedException('Compte suspendu ou supprimé');
    }
    return toPublicUser(user);
  }
}
