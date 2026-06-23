import { Inject } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  EMAIL_TEMPLATE_QUERY_REPOSITORY,
  type EmailTemplateQueryRepository,
} from '../email-template.query-repository';
import type { EmailTemplateVersionReadModel } from '../email-template.read-model';
import { ListTemplateVersionsQuery } from './list-template-versions.query';

@QueryHandler(ListTemplateVersionsQuery)
export class ListTemplateVersionsHandler
  implements IQueryHandler<ListTemplateVersionsQuery, EmailTemplateVersionReadModel[]>
{
  constructor(
    @Inject(EMAIL_TEMPLATE_QUERY_REPOSITORY)
    private readonly queryRepository: EmailTemplateQueryRepository,
  ) {}

  async execute(query: ListTemplateVersionsQuery): Promise<EmailTemplateVersionReadModel[]> {
    return this.queryRepository.findAllVersionsByName(query.name);
  }
}
