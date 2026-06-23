import { EmailTemplateBody, EmailTemplateVersion as VersionRow } from '@prisma/client';
import {
  EmailTemplateVersion,
  type EmailTemplateVersionSnapshot,
} from '../../domain/email-template-version.aggregate';

type VersionRowWithBodies = VersionRow & { bodies: EmailTemplateBody[] };

/** Réhydratation : ligne Prisma (version + corps) → agrégat de domaine. */
export function rowToSnapshot(row: VersionRowWithBodies): EmailTemplateVersionSnapshot {
  return {
    id: row.id,
    name: row.name,
    version: row.version,
    status: row.status,
    publishedAt: row.publishedAt,
    archivedAt: row.archivedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    bodies: (row.bodies ?? []).map((b) => ({
      id: b.id,
      locale: b.locale,
      subject: b.subject,
      bodyMjml: b.bodyMjml,
      bodyState: (b.bodyState as Record<string, unknown> | null) ?? null,
      variables: b.variables,
      engineVersion: b.engineVersion,
      compiledHtml: b.compiledHtml,
    })),
  };
}

export function rowToDomain(row: VersionRowWithBodies): EmailTemplateVersion {
  return EmailTemplateVersion.rehydrate(rowToSnapshot(row));
}
