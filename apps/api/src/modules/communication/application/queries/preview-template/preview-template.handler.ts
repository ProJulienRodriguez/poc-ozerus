import { Inject } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { TemplateNotFoundException } from '../../../domain/exceptions/communication.exceptions';
import {
  MJML_COMPILER_PORT,
  type MjmlCompilerPort,
} from '../../ports/mjml-compiler.port';
import { TEMPLATE_ENGINE_PORT, type TemplateEnginePort } from '../../ports/template-engine.port';
import {
  EMAIL_TEMPLATE_QUERY_REPOSITORY,
  type EmailTemplateQueryRepository,
} from '../email-template.query-repository';
import { PreviewTemplateQuery, type PreviewTemplateResult } from './preview-template.query';

/** Valeurs d'exemple par défaut pour l'aperçu (fusionnées aux samples du template). */
export const SAMPLE_VALUES: Record<string, string | number> = {
  email: 'camille.durand@example.com',
  name: 'Camille Durand',
  firstName: 'Camille',
  lastName: 'Durand',
  activationLink: 'https://app.ozerus.example/activate?token=sample',
  resetLink: 'https://app.ozerus.example/reset-password?token=sample',
  invitationLink: 'https://app.ozerus.example/register?token=sample',
  roleLabel: 'apprenant',
  expiresInHours: 24,
  expiresInDays: 4,
  appName: 'Ozerus',
  supportEmail: 'support@ozerus.example',
};

@QueryHandler(PreviewTemplateQuery)
export class PreviewTemplateHandler
  implements IQueryHandler<PreviewTemplateQuery, PreviewTemplateResult>
{
  constructor(
    @Inject(EMAIL_TEMPLATE_QUERY_REPOSITORY)
    private readonly templateQuery: EmailTemplateQueryRepository,
    @Inject(TEMPLATE_ENGINE_PORT) private readonly engine: TemplateEnginePort,
    @Inject(MJML_COMPILER_PORT) private readonly compiler: MjmlCompilerPort,
  ) {}

  async execute(query: PreviewTemplateQuery): Promise<PreviewTemplateResult> {
    const template = await this.templateQuery.findByNameLocaleVersion(
      query.name,
      query.locale,
      query.version,
    );
    if (!template) {
      throw new TemplateNotFoundException({
        name: query.name,
        locale: query.locale,
        version: query.version,
      });
    }
    const sample = { ...SAMPLE_VALUES, currentYear: new Date().getFullYear() };
    const subject = this.engine.render(template.subject, sample, template.engineVersion);
    const htmlSource =
      template.compiledHtml ?? (await this.compiler.compile(template.bodyMjml));
    const html = this.engine.render(htmlSource, sample, template.engineVersion);
    return { subject, html };
  }
}
