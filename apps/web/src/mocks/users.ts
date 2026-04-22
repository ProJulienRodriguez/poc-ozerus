import type { AuthUser, User } from './types';

export const USERS: User[] = [
  { id: 'u-1', name: 'Marie Laurent', email: 'marie.laurent@helios.fr', role: 'partner', org: 'Cabinet Helios', lastSeen: '2026-04-21' },
  { id: 'u-2', name: 'Pierre Dubois', email: 'pierre.dubois@helios.fr', role: 'partner', org: 'Cabinet Helios', lastSeen: '2026-04-20' },
  { id: 'u-3', name: 'Claire Moreau', email: 'claire.moreau@helios.fr', role: 'partner', org: 'Cabinet Helios', lastSeen: '2026-04-18' },
  { id: 'u-99', name: 'Admin Ozerus', email: 'admin@ozerus.fr', role: 'admin', org: 'Ozerus', lastSeen: '2026-04-21' },
];

export const AUTH_USERS: Record<string, AuthUser> = {
  'marie.laurent@helios.fr': { id: 'u-1', email: 'marie.laurent@helios.fr', name: 'Marie Laurent', org: 'Cabinet Helios', role: 'partner' },
  'pierre.dubois@helios.fr': { id: 'u-2', email: 'pierre.dubois@helios.fr', name: 'Pierre Dubois', org: 'Cabinet Helios', role: 'partner' },
  'admin@ozerus.fr': { id: 'u-99', email: 'admin@ozerus.fr', name: 'Admin Ozerus', org: 'Ozerus', role: 'admin' },
};
