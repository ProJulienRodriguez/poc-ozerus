import { z } from 'zod';

const localeSchema = z.string().regex(/^[a-z]{2}(-[A-Z]{2})?$/, 'Locale invalide (ex: "fr", "en", "fr-CA")');
const nameSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9_]+$/, 'Le nom doit être en snake_case (a-z, 0-9, _)');
const alignSchema = z.enum(['left', 'center', 'right']);

const marks = {
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
  underline: z.boolean().optional(),
  strike: z.boolean().optional(),
};

const mailInlineSchema = z.union([
  z.object({ type: z.literal('text'), value: z.string(), ...marks }),
  z.object({ type: z.literal('variable'), name: z.string(), ...marks }),
  z.object({ type: z.literal('link'), href: z.string(), value: z.string() }),
]);

const mailBlockSchema = z.union([
  z.object({
    type: z.literal('heading'),
    level: z.union([z.literal(1), z.literal(2)]),
    content: z.array(mailInlineSchema),
    align: alignSchema.optional(),
  }),
  z.object({
    type: z.literal('paragraph'),
    content: z.array(mailInlineSchema),
    note: z.enum(['muted', 'faint']).optional(),
    align: alignSchema.optional(),
  }),
  z.object({
    type: z.literal('button'),
    label: z.string(),
    href: z.string(),
    align: alignSchema.optional(),
  }),
]);

const variablesSchema = z.array(z.string()).default([]);
const samplesSchema = z.record(z.string(), z.string());
const bodyStateSchema = z.record(z.string(), z.unknown()).nullable();
const previewVariablesSchema = z.record(z.string(), z.union([z.string(), z.number(), z.boolean()]));

const bodyFields = {
  subject: z.string().min(1).max(998),
  blocks: z.array(mailBlockSchema).min(1).optional(),
  bodyMjml: z.string().min(1).optional(),
  bodyState: bodyStateSchema.optional(),
  samples: samplesSchema.optional(),
  variables: variablesSchema,
};

export const createTemplateSchema = z.object({
  name: nameSchema,
  bodies: z
    .array(z.object({ locale: localeSchema, ...bodyFields }))
    .min(1),
});

export const updateBodySchema = z.object(bodyFields);

export const addLocaleSchema = z.object({
  locale: localeSchema,
  copyFrom: localeSchema.optional(),
  subject: z.string().min(1).max(998).optional(),
  blocks: z.array(mailBlockSchema).min(1).optional(),
  bodyMjml: z.string().min(1).optional(),
  bodyState: bodyStateSchema.optional(),
  samples: samplesSchema.optional(),
  variables: z.array(z.string()).optional(),
});

export const updateSamplesSchema = z.object({ samples: samplesSchema });

export const previewDraftSchema = z.object({
  subject: z.string(),
  blocks: z.array(mailBlockSchema).min(1).optional(),
  bodyMjml: z.string().optional(),
  variables: previewVariablesSchema.optional(),
});

export const testSendSchema = z.object({
  templateName: nameSchema,
  locale: localeSchema,
  to: z.string().email(),
  variables: previewVariablesSchema.optional(),
  templateVersion: z.number().int().min(1).optional(),
});

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateBodyInput = z.infer<typeof updateBodySchema>;
export type AddLocaleInput = z.infer<typeof addLocaleSchema>;
export type PreviewDraftInput = z.infer<typeof previewDraftSchema>;
export type TestSendInput = z.infer<typeof testSendSchema>;
