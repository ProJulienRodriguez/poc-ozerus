import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { TemplateNotFoundException } from '../../../domain/exceptions/communication.exceptions';
import {
  EMAIL_TEMPLATE_REPOSITORY,
  type EmailTemplateRepositoryPort,
} from '../../../domain/ports/email-template.repository.port';
import { EmailTemplateId } from '../../../domain/value-objects/email-template-id.value-object';
import { UpdateBodySamplesCommand } from './update-body-samples.command';

@CommandHandler(UpdateBodySamplesCommand)
export class UpdateBodySamplesHandler
  implements ICommandHandler<UpdateBodySamplesCommand, void>
{
  constructor(
    @Inject(EMAIL_TEMPLATE_REPOSITORY)
    private readonly repository: EmailTemplateRepositoryPort,
  ) {}

  async execute(command: UpdateBodySamplesCommand): Promise<void> {
    const version = await this.repository.findById(EmailTemplateId.create(command.versionId));
    if (!version) {
      throw new TemplateNotFoundException({ id: command.versionId });
    }
    version.setSamples(command.locale, command.samples);
    await this.repository.save(version);
  }
}
