/* Port des appareils de confiance (sautent le MFA). Adapter Prisma en infra. */
import { TrustedDevice as TrustedDeviceRow } from '@prisma/client';

export const TRUSTED_DEVICE_REPOSITORY = Symbol('TRUSTED_DEVICE_REPOSITORY');

/** Vue d'un appareil de confiance exposée à l'utilisateur (sans donnée sensible). */
export interface TrustedDeviceView {
  id: string;
  label: string | null;
  createdAt: Date;
  expiresAt: Date;
}

export interface TrustedDeviceRepositoryPort {
  add(userId: string, label: string | null, expiresAt: Date): Promise<string>;
  /** Vrai si le device existe, appartient au compte et n'est pas expiré. */
  isValid(userId: string, deviceId: string): Promise<boolean>;
  /** Appareils non expirés du compte, les plus récents d'abord. */
  listForUser(userId: string): Promise<TrustedDeviceView[]>;
  findById(id: string): Promise<TrustedDeviceRow | null>;
  remove(id: string): Promise<void>;
  removeAllForUser(userId: string): Promise<void>;
}
