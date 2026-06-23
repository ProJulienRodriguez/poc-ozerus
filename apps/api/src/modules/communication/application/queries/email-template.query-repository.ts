import type {
  EmailTemplateReadModel,
  EmailTemplateVersionReadModel,
  TemplateTypeSummary,
} from './email-template.read-model';

export const EMAIL_TEMPLATE_QUERY_REPOSITORY = Symbol('EMAIL_TEMPLATE_QUERY_REPOSITORY');

export interface EmailTemplateQueryRepository {
  findVersionById(id: string): Promise<EmailTemplateVersionReadModel | null>;
  findAllVersionsByName(name: string): Promise<EmailTemplateVersionReadModel[]>;
  findPublishedByNameAndLocale(
    name: string,
    locale: string,
  ): Promise<EmailTemplateReadModel | null>;
  findByNameLocaleVersion(
    name: string,
    locale: string,
    version: number,
  ): Promise<EmailTemplateReadModel | null>;
  findDistinctTypes(): Promise<TemplateTypeSummary[]>;
}
