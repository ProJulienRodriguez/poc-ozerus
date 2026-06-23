'use client';

import { apiGet, apiPost, apiPut } from '@/lib/client-api';
import type {
  PreviewResult,
  TemplateTypeDefinition,
  TemplateTypeSummary,
  TemplateVersion,
} from '@/lib/communication-types';
import type { MailBlock } from '@/lib/mail-blocks';

// Service typé pour l'admin des templates email. Centralise les chaînes
// d'endpoints (/admin/communication/templates/...) au-dessus de client-api.
const BASE = '/admin/communication/templates';

export interface BodyPayload {
  subject: string;
  blocks?: MailBlock[];
  bodyMjml?: string;
  variables: string[];
  samples?: Record<string, string>;
}

export const communicationApi = {
  listTypes: () => apiGet<TemplateTypeSummary[]>(`${BASE}/types`),
  getCatalog: () => apiGet<TemplateTypeDefinition[]>(`${BASE}/catalog`),
  getTimeline: (name: string) => apiGet<TemplateVersion[]>(`${BASE}/${name}`),

  create: (name: string, bodies: Array<{ locale: string } & Partial<BodyPayload>>) =>
    apiPost<TemplateVersion>(BASE, { name, bodies }),

  updateBody: (name: string, version: number, locale: string, payload: BodyPayload) =>
    apiPut<TemplateVersion>(`${BASE}/${name}/versions/${version}/bodies/${locale}`, payload),

  addLocale: (name: string, version: number, body: { locale: string; copyFrom?: string }) =>
    apiPost<TemplateVersion>(`${BASE}/${name}/versions/${version}/bodies`, body),

  preview: (input: { subject: string; blocks: MailBlock[]; variables: Record<string, string> }) =>
    apiPost<PreviewResult>(`${BASE}/preview`, input),

  publish: (name: string, version: number) =>
    apiPost<TemplateVersion>(`${BASE}/${name}/versions/${version}/publish`),

  archive: (name: string, version: number) =>
    apiPost<TemplateVersion>(`${BASE}/${name}/versions/${version}/archive`),

  testSend: (input: {
    templateName: string;
    locale: string;
    to: string;
    variables: Record<string, string>;
  }) => apiPost<{ status: 'sent' | 'failed'; messageId?: string; error?: string }>(`${BASE}/test-send`, input),
};
