import { Inject } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  EMAIL_TEMPLATE_QUERY_REPOSITORY,
  type EmailTemplateQueryRepository,
} from '../email-template.query-repository';
import type { EmailTemplateReadModel } from '../email-template.read-model';
import { GetPublishedTemplateQuery } from './get-published-template.query';

@QueryHandler(GetPublishedTemplateQuery)
export class GetPublishedTemplateHandler
  implements IQueryHandler<GetPublishedTemplateQuery, EmailTemplateReadModel | null>
{
  constructor(
    @Inject(EMAIL_TEMPLATE_QUERY_REPOSITORY)
    private readonly queryRepository: EmailTemplateQueryRepository,
  ) {}

  async execute(query: GetPublishedTemplateQuery): Promise<EmailTemplateReadModel | null> {
    return this.queryRepository.findPublishedByNameAndLocale(query.name, query.locale);
  }
}
