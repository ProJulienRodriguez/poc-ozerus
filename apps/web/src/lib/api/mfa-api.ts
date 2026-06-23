'use client';

import { apiDelete, apiGet, apiPost } from '@/lib/client-api';

export interface MfaEnrollData {
  otpauthUri: string;
  qrDataUrl: string;
  secret: string;
}

export interface TrustedDevice {
  id: string;
  label: string | null;
  createdAt: string;
  expiresAt: string;
}

// Service typé pour le MFA (/mfa/*) de l'utilisateur connecté.
export const mfaApi = {
  status: () => apiGet<{ enabled: boolean }>('/mfa/status'),
  enroll: () => apiPost<MfaEnrollData>('/mfa/enroll'),
  confirm: (code: string) => apiPost<{ recoveryCodes: string[] }>('/mfa/confirm', { code }),
  disable: (code: string) => apiPost<{ ok: true }>('/mfa/disable', { code }),
  regenerateRecoveryCodes: (code: string) =>
    apiPost<{ recoveryCodes: string[] }>('/mfa/recovery-codes/regenerate', { code }),
  listTrustedDevices: () => apiGet<TrustedDevice[]>('/mfa/trusted-devices'),
  revokeTrustedDevice: (id: string) => apiDelete<{ ok: true }>(`/mfa/trusted-devices/${id}`),
};
