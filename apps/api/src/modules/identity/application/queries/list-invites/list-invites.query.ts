import { Query } from '@nestjs/cqrs';
import { Role } from '@prisma/client';

export interface AdminInviteView {
  id: string;
  email: string | null;
  role: Role;
  createdAt: Date;
  expiresAt: Date;
  createdBy: string;
  status: 'active' | 'used' | 'expired';
  registerPath: string;
}

/** (Admin) Liste des invitations avec leur statut. */
export class ListInvitesQuery extends Query<AdminInviteView[]> {}
