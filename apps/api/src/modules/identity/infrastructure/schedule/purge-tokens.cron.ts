import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import {
  INVITE_REPOSITORY,
  InviteRepositoryPort,
} from '../../domain/ports/invite.repository.port';
import {
  REVOKED_TOKEN_REPOSITORY,
  RevokedTokenRepositoryPort,
} from '../../domain/ports/revoked-token.repository.port';

/** Purge périodique des tokens expirés (révoqués + activation/reset) et des
    invitations expirées jamais utilisées (hygiène de conservation RGPD). */
@Injectable()
export class PurgeTokensCron {
  private readonly logger = new Logger(PurgeTokensCron.name);

  constructor(
    @Inject(REVOKED_TOKEN_REPOSITORY) private readonly revoked: RevokedTokenRepositoryPort,
    @Inject(INVITE_REPOSITORY) private readonly invites: InviteRepositoryPort,
    private readonly prisma: PrismaService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async purge(): Promise<void> {
    const now = new Date();
    const revokedCount = await this.revoked.purgeExpired(now);
    // Tokens d'activation / reset portés par le compte : on efface ceux expirés.
    const { count: confirmCount } = await this.prisma.user.updateMany({
      where: { confirmationTokenExpiresAt: { lt: now } },
      data: { confirmationTokenHash: null, confirmationTokenExpiresAt: null },
    });
    const { count: resetCount } = await this.prisma.user.updateMany({
      where: { resetTokenExpiresAt: { lt: now } },
      data: { resetTokenHash: null, resetTokenExpiresAt: null },
    });
    const inviteCount = await this.invites.purgeExpired(now);
    this.logger.log(
      `Purge : ${revokedCount} révoqués + ${confirmCount + resetCount} tokens activation/reset ` +
        `expirés + ${inviteCount} invitations expirées.`,
    );
  }
}
