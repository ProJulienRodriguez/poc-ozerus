import { BadRequestException, Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { TemplateNotFoundException } from '../../../domain/exceptions/communication.exceptions';
import {
  EMAIL_TEMPLATE_REPOSITORY,
  type EmailTemplateRepositoryPort,
} from '../../../domain/ports/email-template.repository.port';
import { EmailTemplateId } from '../../../domain/value-objects/email-template-id.value-object';
import { AddLocaleCommand } from './add-locale.command';

@CommandHandler(AddLocaleCommand)
export class AddLocaleHandler implements ICommandHandler<AddLocaleCommand, void> {
  constructor(
    @Inject(EMAIL_TEMPLATE_REPOSITORY)
    private readonly repository: EmailTemplateRepositoryPort,
  ) {}

  async execute(command: AddLocaleCommand): Promise<void> {
    const version = await this.repository.findById(EmailTemplateId.create(command.versionId));
    if (!version) {
      throw new TemplateNotFoundException({ id: command.versionId });
    }

    const source = command.copyFrom ? version.getBody(command.copyFrom) : undefined;
    if (command.copyFrom && !source) {
      throw new BadRequestException(`Locale source "${command.copyFrom}" introuvable`);
    }

    const subject = command.subject ?? source?.subject.value;
    const bodyMjml = command.bodyMjml ?? source?.body.mjml;
    if (!subject || !bodyMjml) {
      throw new BadRequestException(
        'subject et bodyMjml sont requis (directement ou via copyFrom)',
      );
    }

    version.addLocale({
      locale: command.locale,
      subject,
      bodyMjml,
      bodyState: command.bodyState ?? source?.body.state ?? null,
      variables: command.variables ?? source?.variables.values ?? [],
    });
    await this.repository.save(version);
  }
}
