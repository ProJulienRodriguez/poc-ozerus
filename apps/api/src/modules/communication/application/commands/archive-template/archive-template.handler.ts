import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import {
  BusinessRuleViolationException,
  TemplateNotFoundException,
} from '../../../domain/exceptions/communication.exceptions';
import {
  EMAIL_TEMPLATE_REPOSITORY,
  type EmailTemplateRepositoryPort,
} from '../../../domain/ports/email-template.repository.port';
import { findTemplateType } from '../../../domain/template-types/template-type.registry';
import { EmailTemplateId } from '../../../domain/value-objects/email-template-id.value-object';
import { ArchiveTemplateCommand } from './archive-template.command';

@CommandHandler(ArchiveTemplateCommand)
export class ArchiveTemplateHandler implements ICommandHandler<ArchiveTemplateCommand, void> {
  constructor(
    @Inject(EMAIL_TEMPLATE_REPOSITORY)
    private readonly repository: EmailTemplateRepositoryPort,
  ) {}

  async execute(command: ArchiveTemplateCommand): Promise<void> {
    const version = await this.repository.findById(
      EmailTemplateId.create(command.versionId),
    );
    if (!version) {
      throw new TemplateNotFoundException({ id: command.versionId });
    }

    // Un type transactionnel câblé au code doit toujours avoir une version publiée :
    // on interdit d'archiver la version active (publier une nouvelle version la remplace).
    const type = findTemplateType(version.name.value);
    if (type?.protected && version.status.isPublished()) {
      throw new BusinessRuleViolationException(
        `Le template "${type.name}" est protégé : sa version publiée ne peut pas être archivée ` +
          `(les envois automatiques en dépendent). Publiez une nouvelle version pour la remplacer.`,
      );
    }

    version.archive();
    await this.repository.save(version);
  }
}
