import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { EmailTemplateVersion } from '../../../domain/email-template-version.aggregate';
import { BusinessRuleViolationException } from '../../../domain/exceptions/communication.exceptions';
import {
  EMAIL_TEMPLATE_REPOSITORY,
  type EmailTemplateRepositoryPort,
} from '../../../domain/ports/email-template.repository.port';
import { findTemplateType } from '../../../domain/template-types/template-type.registry';
import { CreateDraftTemplateCommand } from './create-draft-template.command';

@CommandHandler(CreateDraftTemplateCommand)
export class CreateDraftTemplateHandler
  implements ICommandHandler<CreateDraftTemplateCommand, { id: string; version: number }>
{
  constructor(
    @Inject(EMAIL_TEMPLATE_REPOSITORY)
    private readonly repository: EmailTemplateRepositoryPort,
  ) {}

  async execute(
    command: CreateDraftTemplateCommand,
  ): Promise<{ id: string; version: number }> {
    // Type figé par le code : pas de création libre (sinon template orphelin jamais envoyé).
    if (!findTemplateType(command.name)) {
      throw new BusinessRuleViolationException(
        `Type de template inconnu : "${command.name}". Les types transactionnels sont définis dans le code ; la création libre n'est pas autorisée.`,
      );
    }

    const latest = await this.repository.findLatestByName(command.name);
    const nextVersion = latest ? latest.templateVersion + 1 : 1;

    const version = EmailTemplateVersion.createDraft({
      name: command.name,
      version: nextVersion,
      bodies: command.bodies.map((b) => ({
        locale: b.locale,
        subject: b.subject,
        bodyMjml: b.bodyMjml,
        bodyState: b.bodyState ?? null,
        variables: b.variables,
      })),
    });
    await this.repository.save(version);
    return { id: version.id.value, version: nextVersion };
  }
}
