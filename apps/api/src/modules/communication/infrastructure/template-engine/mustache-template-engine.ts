import { Injectable } from '@nestjs/common';
import type { TemplateEnginePort } from '../../application/ports/template-engine.port';
import { UnsupportedEngineVersionException } from '../../domain/exceptions/communication.exceptions';

const SUPPORTED_VERSIONS = [1];

@Injectable()
export class MustacheTemplateEngine implements TemplateEnginePort {
  render(
    template: string,
    variables: Record<string, string | number | boolean>,
    engineVersion: number,
  ): string {
    if (!SUPPORTED_VERSIONS.includes(engineVersion)) {
      throw new UnsupportedEngineVersionException(engineVersion, SUPPORTED_VERSIONS);
    }
    return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(variables[key] ?? ''));
  }
}
