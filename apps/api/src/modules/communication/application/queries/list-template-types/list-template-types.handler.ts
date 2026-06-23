import { Inject } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  EMAIL_TEMPLATE_QUERY_REPOSITORY,
  type EmailTemplateQueryRepository,
} from '../email-template.query-repository';
import type { TemplateTypeSummary } from '../email-template.read-model';
import { ListTemplateTypesQuery } from './list-template-types.query';

@QueryHandler(ListTemplateTypesQuery)
export class ListTemplateTypesHandler
  implements IQueryHandler<ListTemplateTypesQuery, TemplateTypeSummary[]>
{
  constructor(
    @Inject(EMAIL_TEMPLATE_QUERY_REPOSITORY)
    private readonly queryRepository: EmailTemplateQueryRepository,
  ) {}

  async execute(): Promise<TemplateTypeSummary[]> {
    return this.queryRepository.findDistinctTypes();
  }
}
