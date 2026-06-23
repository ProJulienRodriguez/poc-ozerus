/* Port des codes de secours MFA (hashés, usage unique). Adapter Prisma en infra. */
export const RECOVERY_CODE_REPOSITORY = Symbol('RECOVERY_CODE_REPOSITORY');

export interface RecoveryCodeRepositoryPort {
  replaceForUser(userId: string, codeHashes: string[]): Promise<void>;
  /** Consomme un code valide (le marque utilisé). Vrai si un code a été consommé. */
  consume(userId: string, codeHash: string): Promise<boolean>;
  removeAllForUser(userId: string): Promise<void>;
}
