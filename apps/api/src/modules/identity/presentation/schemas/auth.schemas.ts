import { z } from 'zod';
import { DOMAIN_MESSAGE, isAllowedEmail } from '../../../../core/email-domain';

/** Politique de mot de passe partagée (activation / reset / change). */
const passwordSchema = z
  .string()
  .min(8, 'Au moins 8 caractères')
  .regex(/[A-Z]/, 'Au moins une majuscule')
  .regex(/[0-9]/, 'Au moins un chiffre');

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

/** Inscription via invitation : l'invité définit lui-même son mot de passe. */
export const registerSchema = z.object({
  token: z.string().uuid(),
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email().refine(isAllowedEmail, DOMAIN_MESSAGE),
  password: passwordSchema,
});

/** (Admin) Création d'une invitation. */
export const createInviteSchema = z.object({
  email: z.string().trim().toLowerCase().email().refine(isAllowedEmail, DOMAIN_MESSAGE).optional(),
  role: z.enum(['LEARNER', 'TRAINER']).default('LEARNER'),
});

/** (Admin) Création de compte — l'email doit appartenir au domaine autorisé. */
export const createAccountSchema = z.object({
  email: z.string().trim().toLowerCase().email().refine(isAllowedEmail, DOMAIN_MESSAGE),
  name: z.string().trim().min(2).max(80),
  role: z.enum(['LEARNER', 'TRAINER', 'ADMIN']).default('LEARNER'),
});

export const activateSchema = z.object({
  token: z.string().min(10),
  password: passwordSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  newPassword: passwordSchema,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordSchema,
});

/** Code TOTP à 6 chiffres. */
const totpCodeSchema = z.string().trim().regex(/^\d{6}$/, 'Code à 6 chiffres attendu');

export const confirmMfaSchema = z.object({ code: totpCodeSchema });

/** Désactivation : code TOTP (6 chiffres) ou code de secours (XXXX-XXXX). */
export const disableMfaSchema = z.object({ code: z.string().trim().min(6) });

const mfaChallengeObject = z.object({
  mfaToken: z.string().min(10),
  totpCode: totpCodeSchema.optional(),
  recoveryCode: z.string().trim().min(6).optional(),
  rememberDevice: z.boolean().optional(),
  deviceLabel: z.string().trim().max(100).optional(),
});

export const mfaChallengeSchema = mfaChallengeObject.refine(
  (value: z.infer<typeof mfaChallengeObject>) => value.totpCode || value.recoveryCode,
  { message: 'Fournis un code TOTP ou un code de secours' },
);
