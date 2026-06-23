import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import { RecoveryCodeRepositoryPort } from '../../domain/ports/recovery-code.repository.port';

@Injectable()
export class PrismaRecoveryCodeRepository implements RecoveryCodeRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async replaceForUser(userId: string, codeHashes: string[]): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.mfaRecoveryCode.deleteMany({ where: { userId } }),
      this.prisma.mfaRecoveryCode.createMany({
        data: codeHashes.map((codeHash) => ({ userId, codeHash })),
      }),
    ]);
  }

  async consume(userId: string, codeHash: string): Promise<boolean> {
    const code = await this.prisma.mfaRecoveryCode.findFirst({
      where: { userId, codeHash, usedAt: null },
    });
    if (!code) return false;
    await this.prisma.mfaRecoveryCode.update({
      where: { id: code.id },
      data: { usedAt: new Date() },
    });
    return true;
  }

  async removeAllForUser(userId: string): Promise<void> {
    await this.prisma.mfaRecoveryCode.deleteMany({ where: { userId } });
  }
}
