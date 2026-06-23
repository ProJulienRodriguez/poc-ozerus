import { createHash, randomBytes } from 'node:crypto';

/** Hash SHA-256 (hex) — on ne stocke jamais un token en clair en base. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Génère un token opaque aléatoire (activation / reset), URL-safe. */
export function generateOpaqueToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}
