/* Constantes du domaine identity. */
export const ACTIVATION_TTL_MS = 4 * 24 * 60 * 60 * 1000; // 4 jours
export const PASSWORD_RESET_TTL_MS = 24 * 60 * 60 * 1000; // 24 heures
export const INVITE_TTL_MS = 4 * 24 * 60 * 60 * 1000; // 4 jours

/** Lockout : verrou temporaire après N échecs consécutifs. */
export const MAX_FAILED_LOGINS = 5;
export const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

/** MFA. */
export const MFA_RECOVERY_CODES_COUNT = 10;
export const TRUSTED_DEVICE_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 jours

/** Nombre d'entrées renvoyées par le journal d'activité personnel. */
export const ACTIVITY_LOG_LIMIT = 50;

/** Base d'URL du front pour construire les liens email (activation, reset). */
export function frontBaseUrl(): string {
  return (process.env.FRONT_ORIGIN ?? 'http://localhost:4321').split(',')[0]!.trim();
}
