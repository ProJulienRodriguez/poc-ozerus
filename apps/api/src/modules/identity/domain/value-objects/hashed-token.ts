import { timingSafeEqual } from 'crypto';

/** Token (activation / réinitialisation) porté par le compte, hashé au repos.
   On ne stocke jamais le token en clair ; la comparaison est à temps constant. */
export class HashedToken {
  private constructor(
    readonly hash: string,
    readonly expiresAt: Date,
  ) {}

  static of(hash: string, expiresAt: Date): HashedToken {
    return new HashedToken(hash, expiresAt);
  }

  /** Reconstruit depuis le snapshot (hash + expiry nullables côté ligne). */
  static fromRow(hash: string | null, expiresAt: Date | null): HashedToken | null {
    return hash && expiresAt ? new HashedToken(hash, expiresAt) : null;
  }

  isExpired(now: Date): boolean {
    return now.getTime() > this.expiresAt.getTime();
  }

  matches(candidateHash: string): boolean {
    if (candidateHash.length !== this.hash.length) return false;
    return timingSafeEqual(Buffer.from(candidateHash), Buffer.from(this.hash));
  }
}
