/* Port de persistance des comptes. L'adapter Prisma vit dans infrastructure/. */
import { Prisma, User } from '@prisma/client';
import { Account } from '../account.aggregate';

export const ACCOUNT_REPOSITORY = Symbol('ACCOUNT_REPOSITORY');

export interface AccountRepositoryPort {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  /** Recherche par hash du token d'activation (porté par le compte). */
  findByConfirmationTokenHash(hash: string): Promise<User | null>;
  /** Recherche par hash du token de réinitialisation (porté par le compte). */
  findByResetTokenHash(hash: string): Promise<User | null>;

  /** Insère un nouvel agrégat (création par un admin PENDING, ou inscription ACTIVE). */
  insertAccount(account: Account, tx?: Prisma.TransactionClient): Promise<void>;

  /** Persiste le snapshot d'un agrégat existant. N'écrit que les champs stables qu'il
      gère (jamais les compteurs de lockout — cf. frontière de concurrence dans Account). */
  saveAccount(account: Account, tx?: Prisma.TransactionClient): Promise<void>;

  /** Compteurs de sécurité (lockout) — opérations ATOMIQUES dédiées (concurrence login). */
  incrementFailedLogin(id: string): Promise<number>;
  lock(id: string, until: Date): Promise<void>;
  resetLoginCounters(id: string, tx?: Prisma.TransactionClient): Promise<void>;

  /** Suppression RGPD : purge l'utilisateur et ses données liées (cascades Prisma). */
  delete(id: string, tx?: Prisma.TransactionClient): Promise<void>;
}
