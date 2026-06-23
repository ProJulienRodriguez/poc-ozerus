import { Inject } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { MJML_COMPILER_PORT, type MjmlCompilerPort } from '../../ports/mjml-compiler.port';
import { TEMPLATE_ENGINE_PORT, type TemplateEnginePort } from '../../ports/template-engine.port';
import { SAMPLE_VALUES } from '../preview-template/preview-template.handler';
import type { PreviewTemplateResult } from '../preview-template/preview-template.query';
import { PreviewDraftQuery } from './preview-draft.query';

@QueryHandler(PreviewDraftQuery)
export class PreviewDraftHandler
  implements IQueryHandler<PreviewDraftQuery, PreviewTemplateResult>
{
  constructor(
    @Inject(TEMPLATE_ENGINE_PORT) private readonly engine: TemplateEnginePort,
    @Inject(MJML_COMPILER_PORT) private readonly compiler: MjmlCompilerPort,
  ) {}

  async execute(query: PreviewDraftQuery): Promise<PreviewTemplateResult> {
    const sample = { ...SAMPLE_VALUES, currentYear: new Date().getFullYear(), ...query.variables };
    const subject = this.engine.render(query.subject, sample, query.engineVersion);
    const html = this.engine.render(
      await this.compiler.compile(query.bodyMjml),
      sample,
      query.engineVersion,
    );
    return { subject, html };
  }
}
