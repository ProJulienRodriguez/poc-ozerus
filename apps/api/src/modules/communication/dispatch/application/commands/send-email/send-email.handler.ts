import { randomUUID } from 'crypto';
import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import {
  MJML_COMPILER_PORT,
  type MjmlCompilerPort,
} from '../../../../application/ports/mjml-compiler.port';
import {
  TEMPLATE_ENGINE_PORT,
  type TemplateEnginePort,
} from '../../../../application/ports/template-engine.port';
import {
  EMAIL_TEMPLATE_QUERY_REPOSITORY,
  type EmailTemplateQueryRepository,
} from '../../../../application/queries/email-template.query-repository';
import type { EmailTemplateReadModel } from '../../../../application/queries/email-template.read-model';
import { EmailDeliveryFailedException } from '../../../../domain/exceptions/communication.exceptions';
import {
  COMMUNICATION_MAILER,
  type CommunicationMailerPort,
} from '../../../../domain/ports/mailer.port';
import { EmailDispatch } from '../../../domain/email-dispatch.aggregate';
import {
  EMAIL_DISPATCH_REPOSITORY,
  type EmailDispatchRepositoryPort,
} from '../../../domain/ports/email-dispatch.repository.port';
import { TemplateNotFoundException } from '../../../../domain/exceptions/communication.exceptions';
import { SendEmailCommand, type SendEmailResult } from './send-email.command';

const APP_NAME = process.env.COMMUNICATION_APP_NAME ?? 'Ozerus';
const SUPPORT_EMAIL = process.env.COMMUNICATION_SUPPORT_EMAIL ?? 'support@ozerus.example';
const FALLBACK_LOCALE = process.env.COMMUNICATION_FALLBACK_LOCALE ?? 'fr';

@CommandHandler(SendEmailCommand)
export class SendEmailHandler implements ICommandHandler<SendEmailCommand, SendEmailResult> {
  private readonly logger = new Logger(SendEmailHandler.name);

  constructor(
    @Inject(EMAIL_TEMPLATE_QUERY_REPOSITORY)
    private readonly templateQuery: EmailTemplateQueryRepository,
    @Inject(EMAIL_DISPATCH_REPOSITORY)
    private readonly dispatchRepository: EmailDispatchRepositoryPort,
    @Inject(TEMPLATE_ENGINE_PORT) private readonly engine: TemplateEnginePort,
    @Inject(MJML_COMPILER_PORT) private readonly compiler: MjmlCompilerPort,
    @Inject(COMMUNICATION_MAILER) private readonly mailer: CommunicationMailerPort,
  ) {}

  async execute(command: SendEmailCommand): Promise<SendEmailResult> {
    const template = await this.resolveTemplate(
      command.templateName,
      command.locale,
      command.templateVersion,
    );
    if (!template) {
      throw new TemplateNotFoundException({
        name: command.templateName,
        locale: command.locale,
        version: command.templateVersion,
      });
    }

    const variables = { ...this.buildGlobals(), ...command.variables };
    const subject = this.engine.render(template.subject, variables, template.engineVersion);
    const htmlSource = template.compiledHtml ?? (await this.compileFallback(template));
    const html = this.engine.render(htmlSource, variables, template.engineVersion);

    const messageId = randomUUID();
    const now = new Date();

    try {
      await this.mailer.send({ to: command.to, subject, html });
      this.logger.log(
        `Email envoyé : template=${command.templateName} to=${command.to} messageId=${messageId}`,
      );
      await this.recordOutcome(template, command.to, {
        status: 'SENT',
        messageId,
        dispatchedAt: now,
      });
      return { messageId, sentAt: now.toISOString() };
    } catch (error) {
      const message = (error as Error).message;
      this.logger.error(
        `Échec d'envoi template=${command.templateName} to=${command.to} : ${message}`,
      );
      await this.recordOutcome(template, command.to, {
        status: 'FAILED',
        error: message,
        attemptedAt: now,
      });
      throw new EmailDeliveryFailedException(message);
    }
  }

  private buildGlobals(): Record<string, string | number> {
    return {
      appName: APP_NAME,
      supportEmail: SUPPORT_EMAIL,
      currentYear: new Date().getFullYear(),
    };
  }

  private async resolveTemplate(
    name: string,
    locale: string,
    version?: number,
  ): Promise<EmailTemplateReadModel | null> {
    if (version !== undefined) {
      return this.templateQuery.findByNameLocaleVersion(name, locale, version);
    }
    const direct = await this.templateQuery.findPublishedByNameAndLocale(name, locale);
    if (direct) {
      return direct;
    }
    if (locale === FALLBACK_LOCALE) {
      return null;
    }
    this.logger.warn(`Template ${name} indisponible en ${locale}, fallback ${FALLBACK_LOCALE}`);
    return this.templateQuery.findPublishedByNameAndLocale(name, FALLBACK_LOCALE);
  }

  private async compileFallback(template: EmailTemplateReadModel): Promise<string> {
    this.logger.warn(
      `Template ${template.name}@${template.locale} v${template.version} sans compiledHtml — recompilation à chaud`,
    );
    return this.compiler.compile(template.bodyMjml);
  }

  private async recordOutcome(
    template: EmailTemplateReadModel,
    to: string,
    outcome:
      | { status: 'SENT'; messageId: string; dispatchedAt: Date }
      | { status: 'FAILED'; error: string; attemptedAt: Date },
  ): Promise<void> {
    try {
      const aggregate =
        outcome.status === 'SENT'
          ? EmailDispatch.recordSent({
              templateName: template.name,
              templateVersion: template.version,
              locale: template.locale,
              to,
              messageId: outcome.messageId,
              dispatchedAt: outcome.dispatchedAt,
            })
          : EmailDispatch.recordFailed({
              templateName: template.name,
              templateVersion: template.version,
              locale: template.locale,
              to,
              error: outcome.error,
              attemptedAt: outcome.attemptedAt,
            });
      await this.dispatchRepository.save(aggregate);
    } catch (error) {
      this.logger.error(
        `Échec d'enregistrement du dispatch ${template.name}/${to} : ${(error as Error).message}`,
      );
    }
  }
}
