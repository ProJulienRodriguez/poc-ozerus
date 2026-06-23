/* Port de chiffrement symétrique des secrets MFA (AES-256-GCM en infra). */
export const SECRET_CIPHER = Symbol('SECRET_CIPHER');

export interface SecretCipherPort {
  encrypt(plain: string): string;
  decrypt(payload: string): string;
}
