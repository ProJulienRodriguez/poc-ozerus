import { Inject } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  EMAIL_TEMPLATE_QUERY_REPOSITORY,
  type EmailTemplateQueryRepository,
} from '../email-template.query-repository';
import type { EmailTemplateVersionReadModel } from '../email-template.read-model';
import { GetTemplateByIdQuery } from './get-template-by-id.query';

@QueryHandler(GetTemplateByIdQuery)
export class GetTemplateByIdHandler
  implements IQueryHandler<GetTemplateByIdQuery, EmailTemplateVersionReadModel | null>
{
  constructor(
    @Inject(EMAIL_TEMPLATE_QUERY_REPOSITORY)
    private readonly queryRepository: EmailTemplateQueryRepository,
  ) {}

  async execute(query: GetTemplateByIdQuery): Promise<EmailTemplateVersionReadModel | null> {
    return this.queryRepository.findVersionById(query.id);
  }
}
