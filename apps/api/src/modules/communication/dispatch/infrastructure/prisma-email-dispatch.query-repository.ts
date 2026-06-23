import { Injectable } from '@nestjs/common';
import { EmailDispatch, Prisma } from '@prisma/client';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import type {
  EmailDispatchQueryRepository,
  EmailDispatchReadModel,
  ListDispatchesFilter,
  PagedDispatches,
} from '../application/queries/email-dispatch.read-model';
import type { EmailDispatchStatus } from '../domain/email-dispatch.aggregate';

@Injectable()
export class PrismaEmailDispatchQueryRepository implements EmailDispatchQueryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(filter: ListDispatchesFilter): Promise<PagedDispatches> {
    const where: Prisma.EmailDispatchWhereInput = {};
    if (filter.to) where.to = filter.to;
    if (filter.templateName) where.templateName = filter.templateName;
    if (filter.status) where.status = filter.status;

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.emailDispatch.findMany({
        where,
        orderBy: { dispatchedAt: 'desc' },
        skip: (filter.page - 1) * filter.pageSize,
        take: filter.pageSize,
      }),
      this.prisma.emailDispatch.count({ where }),
    ]);

    return {
      items: rows.map((r) => this.toModel(r)),
      total,
      page: filter.page,
      pageSize: filter.pageSize,
    };
  }

  private toModel(row: EmailDispatch): EmailDispatchReadModel {
    return {
      id: row.id,
      templateName: row.templateName,
      templateVersion: row.templateVersion,
      locale: row.locale,
      to: row.to,
      messageId: row.messageId,
      status: row.status as EmailDispatchStatus,
      error: row.error,
      correlationId: row.correlationId,
      dispatchedAt: row.dispatchedAt,
    };
  }
}
