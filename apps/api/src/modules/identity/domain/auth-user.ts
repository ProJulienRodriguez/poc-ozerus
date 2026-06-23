/* Types d'identité partagés — source de vérité (réexportés par l'ancien module
   auth pour compatibilité). Le payload de l'access token = AuthUser. */
import { Role, User } from '@prisma/client';

export interface AuthUser {
  sub: string;
  email: string;
  name: string;
  role: Role;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  initials: string;
}

export function initialsOf(name: string): string {
  return name
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');
}

export function toPublicUser(u: User): PublicUser {
  return { id: u.id, email: u.email, name: u.name, role: u.role, initials: initialsOf(u.name) };
}
