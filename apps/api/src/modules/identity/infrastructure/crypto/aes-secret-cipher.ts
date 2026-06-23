import { Injectable } from '@nestjs/common';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { SecretCipherPort } from '../../domain/ports/secret-cipher.port';

/** AES-256-GCM. Format stocké : base64(iv).base64(tag).base64(ciphertext). */
@Injectable()
export class AesSecretCipher implements SecretCipherPort {
  private readonly key: Buffer;

  constructor() {
    // Clé dédiée si fournie, sinon dérivée du JWT_SECRET (SHA-256 → 32 octets).
    // `||` (et non `??`) pour qu'une variable définie mais vide (ex. MFA_ENC_KEY=
    // en docker) bascule bien sur le secret suivant.
    const material = process.env.MFA_ENC_KEY || process.env.JWT_SECRET || '';
    if (!material) throw new Error('MFA_ENC_KEY ou JWT_SECRET requis pour chiffrer les secrets MFA');
    this.key = createHash('sha256').update(material).digest();
  }

  encrypt(plain: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const ciphertext = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${iv.toString('base64')}.${tag.toString('base64')}.${ciphertext.toString('base64')}`;
  }

  decrypt(payload: string): string {
    const [ivB64, tagB64, dataB64] = payload.split('.');
    if (!ivB64 || !tagB64 || !dataB64) throw new Error('Payload chiffré invalide');
    const decipher = createDecipheriv('aes-256-gcm', this.key, Buffer.from(ivB64, 'base64'));
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
    return Buffer.concat([
      decipher.update(Buffer.from(dataB64, 'base64')),
      decipher.final(),
    ]).toString('utf8');
  }
}
