import { Query } from '@nestjs/cqrs';
import { Role } from '@prisma/client';

export type InviteInfo =
  | { valid: false; reason: string }
  | { valid: true; email: string | null; role: Role };

/** Infos publiques d'une invitation (page /register), sans rien révéler de trop. */
export class GetInviteInfoQuery extends Query<InviteInfo> {
  constructor(public readonly token: string) {
    super();
  }
}
