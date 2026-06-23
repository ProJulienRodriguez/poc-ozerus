import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import {
  AuditEntry,
  AuditLogView,
  AuditRepositoryPort,
} from '../../domain/ports/audit.repository.port';

@Injectable()
export class PrismaAuditRepository implements AuditRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async record(entry: AuditEntry): Promise<void> {
    await this.prisma.authAuditLog.create({
      data: {
        userId: entry.userId ?? null,
        type: entry.type,
        ipAddress: entry.ipAddress ?? null,
        userAgent: entry.userAgent ?? null,
        metadata: (entry.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async findRecentByUser(userId: string, limit: number): Promise<AuditLogView[]> {
    return this.prisma.authAuditLog.findMany({
      where: { userId },
      select: { id: true, type: true, ipAddress: true, userAgent: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
