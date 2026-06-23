import { randomBytes } from 'node:crypto';

/** Génère des codes de secours lisibles au format XXXX-XXXX (base32 sans ambiguïté). */
export function generateRecoveryCodes(count: number): string[] {
  const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // sans I, L, O, 0, 1
  const pick = (n: number): string => {
    const bytes = randomBytes(n);
    let out = '';
    for (let i = 0; i < n; i++) out += ALPHABET[bytes[i]! % ALPHABET.length];
    return out;
  };
  return Array.from({ length: count }, () => `${pick(4)}-${pick(4)}`);
}

/** Normalise un code saisi (majuscules, sans espaces) avant comparaison. */
export function normalizeRecoveryCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, '');
}
