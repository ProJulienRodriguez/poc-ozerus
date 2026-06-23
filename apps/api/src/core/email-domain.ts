/* Restriction des comptes au domaine interne. Surchageable par env
   (INVITE_EMAIL_DOMAIN) — ex. pour un environnement de test. */
export const ALLOWED_EMAIL_DOMAIN = (process.env.INVITE_EMAIL_DOMAIN ?? 'acelys.fr').toLowerCase();

export const isAllowedEmail = (email: string): boolean =>
  email.toLowerCase().endsWith(`@${ALLOWED_EMAIL_DOMAIN}`);

export const DOMAIN_MESSAGE = `Seules les adresses @${ALLOWED_EMAIL_DOMAIN} sont autorisées`;
