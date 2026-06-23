import { Inject, Injectable } from '@nestjs/common';
import {
  MJML_COMPILER_PORT,
  type MjmlCompilerPort,
} from '../../application/ports/mjml-compiler.port';
import type { EmailTemplateVersion } from '../email-template-version.aggregate';
import { BusinessRuleViolationException } from '../exceptions/communication.exceptions';
import {
  EMAIL_TEMPLATE_REPOSITORY,
  type EmailTemplateRepositoryPort,
} from '../ports/email-template.repository.port';
import {
  extractVariables,
  findTemplateType,
  GLOBAL_VARIABLES,
} from '../template-types/template-type.registry';

/* Service de domaine : publie une version (compile le MJML de chaque locale et met
   en cache le HTML) après avoir archivé la version PUBLISHED précédente du même nom. */
@Injectable()
export class TemplatePublishingService {
  constructor(
    @Inject(EMAIL_TEMPLATE_REPOSITORY)
    private readonly repository: EmailTemplateRepositoryPort,
    @Inject(MJML_COMPILER_PORT)
    private readonly compiler: MjmlCompilerPort,
  ) {}

  async publish(version: EmailTemplateVersion): Promise<void> {
    this.assertVariableContract(version);

    const compiledHtmlByLocale = new Map<string, string>();
    for (const body of version.bodies) {
      compiledHtmlByLocale.set(body.locale.value, await this.compiler.compile(body.body.mjml));
    }

    await this.archiveCurrentPublished(version.name.value, version.id.value);

    version.publish(compiledHtmlByLocale);
    await this.repository.save(version);
  }

  /* Empêche la publication d'un template dont le corps référence une variable hors
     contrat (faute de frappe → trou silencieux dans l'email) ou qui omet une variable
     requise (ex. le lien d'activation). Seuls les types connus du registre sont validés ;
     un type non enregistré (futur canal libre) passe sans contrainte. */
  private assertVariableContract(version: EmailTemplateVersion): void {
    const type = findTemplateType(version.name.value);
    if (!type) {
      return;
    }

    const used = new Set<string>();
    for (const body of version.bodies) {
      for (const name of extractVariables(body.subject.value)) {
        used.add(name);
      }
      for (const name of extractVariables(body.body.mjml)) {
        used.add(name);
      }
    }

    const allowed = new Set<string>([
      ...type.variables.map((v) => v.name),
      ...GLOBAL_VARIABLES,
    ]);
    const unknown = [...used].filter((name) => !allowed.has(name));
    if (unknown.length > 0) {
      throw new BusinessRuleViolationException(
        `Variables inconnues pour le template "${type.name}" : ${unknown.join(', ')}. ` +
          `Variables autorisées : ${[...allowed].join(', ')}.`,
      );
    }

    const missing = type.variables
      .filter((v) => v.required && !used.has(v.name))
      .map((v) => v.name);
    if (missing.length > 0) {
      throw new BusinessRuleViolationException(
        `Variables requises manquantes pour le template "${type.name}" : ${missing.join(', ')}.`,
      );
    }
  }

  private async archiveCurrentPublished(name: string, excludeId: string): Promise<void> {
    const current = await this.repository.findPublishedByName(name);
    if (current && current.id.value !== excludeId) {
      current.archive();
      await this.repository.save(current);
    }
  }
}
