/* Port de révocation des refresh tokens (adapter Prisma dans infrastructure/). */
export const REVOKED_TOKEN_REPOSITORY = Symbol('REVOKED_TOKEN_REPOSITORY');

export interface RevokedTokenRepositoryPort {
  /** Marque un token (hashé) comme révoqué jusqu'à son expiration. */
  revoke(tokenHash: string, expiresAt: Date): Promise<void>;
  isRevoked(tokenHash: string): Promise<boolean>;
  /** Purge des entrées expirées (cron). */
  purgeExpired(now: Date): Promise<number>;
}
