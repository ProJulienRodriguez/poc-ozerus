import { Query } from '@nestjs/cqrs';
import { Role, UserStatus } from '@prisma/client';

export interface AdminAccountView {
  id: string;
  name: string;
  initials: string;
  email: string;
  role: Role;
  status: UserStatus;
  createdAt: Date;
  mfaEnabled: boolean;
  locked: boolean;
  lockedUntil: Date | null;
}

/** (Admin) Liste des comptes avec compteurs d'activité. */
export class ListAccountsQuery extends Query<AdminAccountView[]> {}
