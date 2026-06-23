/* Port des invitations. Adapter Prisma en infrastructure/. */
import { Invite as InviteRow, Prisma } from '@prisma/client';
import { Invite } from '../invite.aggregate';

export const INVITE_REPOSITORY = Symbol('INVITE_REPOSITORY');

export interface InviteWithCreator extends InviteRow {
  createdByName: string;
}

export interface InviteRepositoryPort {
  /** Insère une nouvelle invitation (agrégat). */
  insertInvite(invite: Invite, tx?: Prisma.TransactionClient): Promise<void>;
  /** Persiste le snapshot d'une invitation existante (consommation). */
  saveInvite(invite: Invite, tx?: Prisma.TransactionClient): Promise<void>;

  findById(id: string): Promise<InviteRow | null>;
  remove(id: string): Promise<void>;
  list(): Promise<InviteWithCreator[]>;

  /** RGPD : purge toutes les invitations rattachées à un email (effacement compte). */
  deleteByEmail(email: string, tx?: Prisma.TransactionClient): Promise<number>;
  /** Hygiène de conservation : supprime les invitations expirées jamais utilisées. */
  purgeExpired(now: Date): Promise<number>;
}
