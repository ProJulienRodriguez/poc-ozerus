import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { AdminGuard } from '../../../identity/presentation/guards/access-token.guard';
import type { PagedDispatches } from '../../dispatch/application/queries/email-dispatch.read-model';
import { ListDispatchesQuery } from '../../dispatch/application/queries/list-dispatches/list-dispatches.query';
import type { EmailDispatchStatus } from '../../dispatch/domain/email-dispatch.aggregate';

const ALLOWED_STATUSES: EmailDispatchStatus[] = ['SENT', 'FAILED'];

@Controller('admin/communication/dispatches')
@UseGuards(AdminGuard)
export class AdminDispatchController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  async list(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '50',
    @Query('to') to?: string,
    @Query('templateName') templateName?: string,
    @Query('status') status?: string,
  ): Promise<PagedDispatches> {
    const pageNum = Math.max(1, Number.parseInt(page, 10) || 1);
    const sizeNum = Math.min(200, Math.max(1, Number.parseInt(pageSize, 10) || 50));
    const filterStatus = ALLOWED_STATUSES.includes(status as EmailDispatchStatus)
      ? (status as EmailDispatchStatus)
      : undefined;
    return this.queryBus.execute(
      new ListDispatchesQuery(pageNum, sizeNum, to, templateName, filterStatus),
    );
  }
}
