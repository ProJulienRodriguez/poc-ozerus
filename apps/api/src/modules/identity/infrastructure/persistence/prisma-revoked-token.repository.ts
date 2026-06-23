import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import { RevokedTokenRepositoryPort } from '../../domain/ports/revoked-token.repository.port';

@Injectable()
export class PrismaRevokedTokenRepository implements RevokedTokenRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async revoke(tokenHash: string, expiresAt: Date): Promise<void> {
    await this.prisma.revokedToken.upsert({
      where: { tokenHash },
      create: { tokenHash, expiresAt },
      update: { expiresAt },
    });
  }

  async isRevoked(tokenHash: string): Promise<boolean> {
    const found = await this.prisma.revokedToken.findUnique({ where: { tokenHash } });
    return found !== null;
  }

  async purgeExpired(now: Date): Promise<number> {
    const { count } = await this.prisma.revokedToken.deleteMany({
      where: { expiresAt: { lt: now } },
    });
    return count;
  }
}
