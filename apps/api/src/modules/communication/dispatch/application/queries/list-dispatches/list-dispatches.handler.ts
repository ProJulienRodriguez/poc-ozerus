import { Inject } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  EMAIL_DISPATCH_QUERY_REPOSITORY,
  type EmailDispatchQueryRepository,
  type PagedDispatches,
} from '../email-dispatch.read-model';
import { ListDispatchesQuery } from './list-dispatches.query';

@QueryHandler(ListDispatchesQuery)
export class ListDispatchesHandler
  implements IQueryHandler<ListDispatchesQuery, PagedDispatches>
{
  constructor(
    @Inject(EMAIL_DISPATCH_QUERY_REPOSITORY)
    private readonly queryRepository: EmailDispatchQueryRepository,
  ) {}

  async execute(query: ListDispatchesQuery): Promise<PagedDispatches> {
    return this.queryRepository.list({
      page: query.page,
      pageSize: query.pageSize,
      to: query.to,
      templateName: query.templateName,
      status: query.status,
    });
  }
}
