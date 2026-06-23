import { Injectable, Logger } from '@nestjs/common';
import type { MjmlCompilerPort } from '../../application/ports/mjml-compiler.port';
// eslint-disable-next-line @typescript-eslint/no-require-imports
import mjml2html = require('mjml');

@Injectable()
export class MjmlCompilerService implements MjmlCompilerPort {
  private readonly logger = new Logger(MjmlCompilerService.name);

  async compile(mjml: string): Promise<string> {
    const result = await mjml2html(mjml, { validationLevel: 'soft' });
    const errors = result.errors ?? [];
    if (errors.length > 0) {
      this.logger.warn(
        `Compilation MJML : ${errors.length} avertissement(s) : ${errors
          .map((e) => e.formattedMessage)
          .join('; ')}`,
      );
    }
    return result.html;
  }
}
