/* Agrégat Invite (invitation d'inscription).

   Même convention « snapshot » que Account : l'entité Prisma est la source de vérité,
   les events sont publiés après le commit DB. Pas d'event store.
*/
import { randomUUID } from 'crypto';
import { AggregateRoot } from '@nestjs/cqrs';
import { Invite as InviteRow, Role } from '@prisma/client';
import { InviteCreatedEvent } from './events/invite-created.event';
import {
  InviteAlreadyUsedException,
  InviteEmailMismatchException,
  InviteExpiredException,
} from './exceptions/identity.exceptions';

interface CreateInviteProps {
  createdById: string;
  email: string | null;
  role: Role;
  expiresAt: Date;
  now: Date;
}

/** Projection de persistance d'une invitation (hors id). Consommée par le repository. */
export interface InviteSnapshot {
  email: string | null;
  role: Role;
  createdById: string;
  usedAt: Date | null;
  expiresAt: Date;
  createdAt: Date;
}

export class Invite extends AggregateRoot {
  private _email!: string | null;
  private _role!: Role;
  private _createdById!: string;
  private _usedAt!: Date | null;
  private _expiresAt!: Date;
  private _createdAt!: Date;

  private constructor(public readonly id: string) {
    super();
  }

  static fromRow(row: InviteRow): Invite {
    const invite = new Invite(row.id);
    invite._email = row.email;
    invite._role = row.role;
    invite._createdById = row.createdById;
    invite._usedAt = row.usedAt;
    invite._expiresAt = row.expiresAt;
    invite._createdAt = row.createdAt;
    return invite;
  }

  static create(props: CreateInviteProps): Invite {
    const invite = new Invite(randomUUID());
    invite._email = props.email;
    invite._role = props.role;
    invite._createdById = props.createdById;
    invite._usedAt = null;
    invite._expiresAt = props.expiresAt;
    invite._createdAt = props.now;
    // Invitation nominative → notification email. Les invitations « ouvertes »
    // (sans email) sont partagées manuellement et n'émettent pas d'event.
    if (props.email) {
      invite.apply(new InviteCreatedEvent(invite.id, props.email, props.role));
    }
    return invite;
  }

  /** Projection de persistance (consommée par le repository). */
  snapshot(): InviteSnapshot {
    return {
      email: this._email,
      role: this._role,
      createdById: this._createdById,
      usedAt: this._usedAt,
      expiresAt: this._expiresAt,
      createdAt: this._createdAt,
    };
  }

  /** Consommation par un invité. Invariants : non utilisée, non expirée, email correspond. */
  use(email: string, now: Date): void {
    if (this._usedAt) throw new InviteAlreadyUsedException();
    if (this._expiresAt < now) throw new InviteExpiredException();
    if (this._email && this._email !== email) throw new InviteEmailMismatchException();
    this._usedAt = now;
  }

  /** Révocation : interdite si déjà utilisée (la suppression elle-même est faite par le repo). */
  ensureRevocable(): void {
    if (this._usedAt) throw new InviteAlreadyUsedException();
  }
}
