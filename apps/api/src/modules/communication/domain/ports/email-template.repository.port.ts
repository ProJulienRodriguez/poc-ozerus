import type { EmailTemplateVersion } from '../email-template-version.aggregate';
import type { EmailTemplateId } from '../value-objects/email-template-id.value-object';

export const EMAIL_TEMPLATE_REPOSITORY = Symbol('EMAIL_TEMPLATE_REPOSITORY');

export interface EmailTemplateRepositoryPort {
  findById(id: EmailTemplateId): Promise<EmailTemplateVersion | null>;
  findPublishedByName(name: string): Promise<EmailTemplateVersion | null>;
  findLatestByName(name: string): Promise<EmailTemplateVersion | null>;
  /** Upsert transactionnel de la version + ses corps (insert ou update). */
  save(version: EmailTemplateVersion): Promise<void>;
}
