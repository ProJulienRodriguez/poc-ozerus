/* Port TOTP (Time-based One-Time Password). Adapter otplib en infrastructure/. */
export const TOTP_SERVICE = Symbol('TOTP_SERVICE');

export interface TotpServicePort {
  /** Génère un secret base32 pour un nouvel enrôlement. */
  generateSecret(): string;
  /** URI otpauth:// à encoder en QR (Google Authenticator, etc.). */
  keyUri(accountName: string, secret: string): string;
  /** Vérifie un code à 6 chiffres contre le secret (fenêtre de tolérance incluse). */
  verify(token: string, secret: string): boolean;
}
