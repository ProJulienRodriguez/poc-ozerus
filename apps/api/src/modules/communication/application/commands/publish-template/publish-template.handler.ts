import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { TemplateNotFoundException } from '../../../domain/exceptions/communication.exceptions';
import {
  EMAIL_TEMPLATE_REPOSITORY,
  type EmailTemplateRepositoryPort,
} from '../../../domain/ports/email-template.repository.port';
import { TemplatePublishingService } from '../../../domain/services/template-publishing.service';
import { EmailTemplateId } from '../../../domain/value-objects/email-template-id.value-object';
import { PublishTemplateCommand } from './publish-template.command';

@CommandHandler(PublishTemplateCommand)
export class PublishTemplateHandler implements ICommandHandler<PublishTemplateCommand, void> {
  constructor(
    @Inject(EMAIL_TEMPLATE_REPOSITORY)
    private readonly repository: EmailTemplateRepositoryPort,
    private readonly publishingService: TemplatePublishingService,
  ) {}

  async execute(command: PublishTemplateCommand): Promise<void> {
    const version = await this.repository.findById(
      EmailTemplateId.create(command.versionId),
    );
    if (!version) {
      throw new TemplateNotFoundException({ id: command.versionId });
    }
    await this.publishingService.publish(version);
  }
}
