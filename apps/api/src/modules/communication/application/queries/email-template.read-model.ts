export interface EmailTemplateReadModel {
  id: string;
  name: string;
  locale: string;
  subject: string;
  bodyMjml: string;
  bodyState: Record<string, unknown> | null;
  variables: string[];
  version: number;
  status: string;
  engineVersion: number;
  compiledHtml: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailTemplateBodyReadModel {
  id: string;
  locale: string;
  subject: string;
  bodyMjml: string;
  bodyState: Record<string, unknown> | null;
  variables: string[];
  engineVersion: number;
  compiledHtml: string | null;
}

export interface EmailTemplateVersionReadModel {
  id: string;
  name: string;
  version: number;
  status: string;
  publishedAt: Date | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  bodies: EmailTemplateBodyReadModel[];
}

export type TemplateTypeStatus = 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';

export interface TemplateTypeSummary {
  name: string;
  locales: string[];
  updatedAt: Date;
  /** Statut effectif tous locales confondus : PUBLISHED si une version l'est, sinon DRAFT, sinon ARCHIVED. */
  status: TemplateTypeStatus;
  /** Numéro de la version actuellement publiée (null si aucune). */
  publishedVersion: number | null;
  /** Vrai si une version DRAFT existe (édition en cours, distincte de la publiée). */
  hasDraft: boolean;
}
