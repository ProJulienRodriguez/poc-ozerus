import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../../../../core/prisma/prisma.service';
import { initialsOf } from '../../../domain/auth-user';
import { AdminAccountView, ListAccountsQuery } from './list-accounts.query';

@QueryHandler(ListAccountsQuery)
export class ListAccountsHandler implements IQueryHandler<ListAccountsQuery, AdminAccountView[]> {
  // Côté lecture : accès direct à Prisma (read-model), pas de port repository.
  constructor(private readonly prisma: PrismaService) {}

  async execute(): Promise<AdminAccountView[]> {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
    const now = Date.now();
    return users.map((u) => ({
      id: u.id,
      name: u.name,
      initials: initialsOf(u.name),
      email: u.email,
      role: u.role,
      status: u.status,
      createdAt: u.createdAt,
      mfaEnabled: u.mfaEnabled,
      locked: u.lockedUntil != null && u.lockedUntil.getTime() > now,
      lockedUntil: u.lockedUntil,
    }));
  }
}
