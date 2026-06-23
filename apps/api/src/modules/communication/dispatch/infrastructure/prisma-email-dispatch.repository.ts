import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import type { EmailDispatch } from '../domain/email-dispatch.aggregate';
import type { EmailDispatchRepositoryPort } from '../domain/ports/email-dispatch.repository.port';

@Injectable()
export class PrismaEmailDispatchRepository implements EmailDispatchRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async save(dispatch: EmailDispatch): Promise<void> {
    const s = dispatch.snapshot();
    await this.prisma.emailDispatch.create({
      data: {
        id: s.id,
        templateName: s.templateName,
        templateVersion: s.templateVersion,
        locale: s.locale,
        to: s.to,
        messageId: s.messageId,
        status: s.status,
        error: s.error,
        correlationId: s.correlationId,
        dispatchedAt: s.dispatchedAt,
      },
    });
  }
}
