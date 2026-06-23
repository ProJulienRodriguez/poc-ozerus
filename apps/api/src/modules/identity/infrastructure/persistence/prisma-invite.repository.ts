import { Injectable } from '@nestjs/common';
import { Invite as InviteRow, Prisma } from '@prisma/client';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import { Invite } from '../../domain/invite.aggregate';
import { InviteRepositoryPort, InviteWithCreator } from '../../domain/ports/invite.repository.port';

@Injectable()
export class PrismaInviteRepository implements InviteRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async insertInvite(invite: Invite, tx?: Prisma.TransactionClient): Promise<void> {
    const db = tx ?? this.prisma;
    await db.invite.create({ data: { id: invite.id, ...invite.snapshot() } });
  }

  async saveInvite(invite: Invite, tx?: Prisma.TransactionClient): Promise<void> {
    const db = tx ?? this.prisma;
    await db.invite.update({
      where: { id: invite.id },
      data: { usedAt: invite.snapshot().usedAt },
    });
  }

  findById(id: string): Promise<InviteRow | null> {
    return this.prisma.invite.findUnique({ where: { id } });
  }

  async remove(id: string): Promise<void> {
    await this.prisma.invite.delete({ where: { id } });
  }

  async list(): Promise<InviteWithCreator[]> {
    const invites = await this.prisma.invite.findMany({
      orderBy: { createdAt: 'desc' },
      include: { createdBy: { select: { name: true } } },
    });
    return invites.map(({ createdBy, ...invite }) => ({
      ...invite,
      createdByName: createdBy.name,
    }));
  }

  async deleteByEmail(email: string, tx?: Prisma.TransactionClient): Promise<number> {
    const db = tx ?? this.prisma;
    const { count } = await db.invite.deleteMany({ where: { email } });
    return count;
  }

  async purgeExpired(now: Date): Promise<number> {
    const { count } = await this.prisma.invite.deleteMany({
      where: { usedAt: null, expiresAt: { lt: now } },
    });
    return count;
  }
}
