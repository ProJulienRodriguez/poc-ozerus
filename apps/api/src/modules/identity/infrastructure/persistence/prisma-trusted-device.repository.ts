import { Injectable } from '@nestjs/common';
import { TrustedDevice as TrustedDeviceRow } from '@prisma/client';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import {
  TrustedDeviceRepositoryPort,
  TrustedDeviceView,
} from '../../domain/ports/trusted-device.repository.port';

@Injectable()
export class PrismaTrustedDeviceRepository implements TrustedDeviceRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async add(userId: string, label: string | null, expiresAt: Date): Promise<string> {
    const device = await this.prisma.trustedDevice.create({
      data: { userId, label, expiresAt },
      select: { id: true },
    });
    return device.id;
  }

  async isValid(userId: string, deviceId: string): Promise<boolean> {
    const device = await this.prisma.trustedDevice.findUnique({ where: { id: deviceId } });
    return device !== null && device.userId === userId && device.expiresAt > new Date();
  }

  async listForUser(userId: string): Promise<TrustedDeviceView[]> {
    return this.prisma.trustedDevice.findMany({
      where: { userId, expiresAt: { gt: new Date() } },
      select: { id: true, label: true, createdAt: true, expiresAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: string): Promise<TrustedDeviceRow | null> {
    return this.prisma.trustedDevice.findUnique({ where: { id } });
  }

  async remove(id: string): Promise<void> {
    await this.prisma.trustedDevice.delete({ where: { id } });
  }

  async removeAllForUser(userId: string): Promise<void> {
    await this.prisma.trustedDevice.deleteMany({ where: { userId } });
  }
}
