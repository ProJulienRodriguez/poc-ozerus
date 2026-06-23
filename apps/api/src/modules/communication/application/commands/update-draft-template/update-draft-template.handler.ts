import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { TemplateNotFoundException } from '../../../domain/exceptions/communication.exceptions';
import {
  EMAIL_TEMPLATE_REPOSITORY,
  type EmailTemplateRepositoryPort,
} from '../../../domain/ports/email-template.repository.port';
import { EmailTemplateId } from '../../../domain/value-objects/email-template-id.value-object';
import { UpdateDraftTemplateCommand } from './update-draft-template.command';

@CommandHandler(UpdateDraftTemplateCommand)
export class UpdateDraftTemplateHandler
  implements ICommandHandler<UpdateDraftTemplateCommand, void>
{
  constructor(
    @Inject(EMAIL_TEMPLATE_REPOSITORY)
    private readonly repository: EmailTemplateRepositoryPort,
  ) {}

  async execute(command: UpdateDraftTemplateCommand): Promise<void> {
    const version = await this.repository.findById(
      EmailTemplateId.create(command.versionId),
    );
    if (!version) {
      throw new TemplateNotFoundException({ id: command.versionId });
    }
    version.updateBody(command.locale, {
      subject: command.subject,
      bodyMjml: command.bodyMjml,
      bodyState: command.bodyState ?? null,
      variables: command.variables,
    });
    await this.repository.save(version);
  }
}
