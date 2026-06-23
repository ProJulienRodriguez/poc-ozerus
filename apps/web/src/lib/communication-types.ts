// Types miroir des read-models / registre du module communication (API).

export type TemplateStatus = 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';

export interface TemplateTypeSummary {
  name: string;
  locales: string[];
  updatedAt: string;
  status: TemplateStatus;
  publishedVersion: number | null;
  hasDraft: boolean;
}

export interface TemplateTypeVariable {
  name: string;
  required: boolean;
  description: string;
}

export interface TemplateTypeDefinition {
  name: string;
  label: string;
  description: string;
  protected: boolean;
  variables: TemplateTypeVariable[];
}

export interface TemplateBody {
  id: string;
  locale: string;
  subject: string;
  bodyMjml: string;
  bodyState: Record<string, unknown> | null;
  variables: string[];
  engineVersion: number;
  compiledHtml: string | null;
}

export interface TemplateVersion {
  id: string;
  name: string;
  version: number;
  status: TemplateStatus;
  publishedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  bodies: TemplateBody[];
}

export interface PreviewResult {
  subject: string;
  html: string;
}

// Variables globales toujours disponibles (cf. GLOBAL_VARIABLES côté backend).
export const GLOBAL_VARIABLES = ['appName', 'supportEmail', 'currentYear'];
