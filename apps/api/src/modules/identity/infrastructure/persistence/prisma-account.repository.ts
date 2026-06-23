import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import { Account } from '../../domain/account.aggregate';
import { AccountRepositoryPort } from '../../domain/ports/account.repository.port';

@Injectable()
export class PrismaAccountRepository implements AccountRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByConfirmationTokenHash(hash: string): Promise<User | null> {
    return this.prisma.user.findFirst({ where: { confirmationTokenHash: hash } });
  }

  findByResetTokenHash(hash: string): Promise<User | null> {
    return this.prisma.user.findFirst({ where: { resetTokenHash: hash } });
  }

  async insertAccount(account: Account, tx?: Prisma.TransactionClient): Promise<void> {
    const db = tx ?? this.prisma;
    await db.user.create({ data: { id: account.id, ...account.snapshot() } });
  }

  async saveAccount(account: Account, tx?: Prisma.TransactionClient): Promise<void> {
    // Snapshot complet (idempotent — rechargé depuis le row). Les compteurs de lockout
    // ne font pas partie du snapshot (gérés en atomique côté login).
    const db = tx ?? this.prisma;
    await db.user.update({ where: { id: account.id }, data: account.snapshot() });
  }

  async incrementFailedLogin(id: string): Promise<number> {
    // Incrément atomique : pas de lost-update sous tentatives concurrentes.
    const user = await this.prisma.user.update({
      where: { id },
      data: { failedLoginAttempts: { increment: 1 } },
      select: { failedLoginAttempts: true },
    });
    return user.failedLoginAttempts;
  }

  async lock(id: string, until: Date): Promise<void> {
    await this.prisma.user.update({ where: { id }, data: { lockedUntil: until } });
  }

  async resetLoginCounters(id: string, tx?: Prisma.TransactionClient): Promise<void> {
    const db = tx ?? this.prisma;
    await db.user.update({
      where: { id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
  }

  async delete(id: string, tx?: Prisma.TransactionClient): Promise<void> {
    const db = tx ?? this.prisma;
    await db.user.delete({ where: { id } });
  }
}
