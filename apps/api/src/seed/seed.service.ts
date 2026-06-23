import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../core/prisma/prisma.service';

/**
 * Seed minimal : crée le compte administrateur initial à partir de
 * ADMIN_EMAIL / ADMIN_PASSWORD s'il n'existe pas encore. Aucun effet si les
 * variables ne sont pas définies (no-op sûr).
 */
@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.seedAdmin();
  }

  private async seedAdmin(): Promise<void> {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    if (!email || !password) {
      this.logger.warn('ADMIN_EMAIL / ADMIN_PASSWORD absents — pas de compte admin seedé.');
      return;
    }
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) return;
    await this.prisma.user.create({
      data: {
        email,
        passwordHash: await bcrypt.hash(password, 10),
        name: 'Administrateur',
        role: 'ADMIN',
      },
    });
    this.logger.log(`Compte admin initial créé (${email}).`);
  }
}
