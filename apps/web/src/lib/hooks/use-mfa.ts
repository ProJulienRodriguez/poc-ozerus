'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { mfaApi, type MfaEnrollData, type TrustedDevice } from '@/lib/api/mfa-api';
import { useOzInput } from '@/lib/hooks/use-oz-input';
import { useAsyncGuard } from '@/lib/hooks/use-async-guard';

export type MfaMode = 'idle' | 'enrolling';

/**
 * Encapsule l'état et les actions de la gestion 2FA (statut, enrôlement,
 * désactivation, régénération des codes de récupération, appareils de confiance).
 * Le composant n'a plus qu'à brancher le rendu sur les valeurs retournées.
 */
export function useMfa() {
  const t = useTranslations('security');
  const tc = useTranslations('common');
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [mode, setMode] = useState<MfaMode>('idle');
  const [enroll, setEnroll] = useState<MfaEnrollData | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [devices, setDevices] = useState<TrustedDevice[]>([]);
  const { busy, error, setError, run } = useAsyncGuard(tc('error'));

  const [code, codeRef, resetCode] = useOzInput();
  const [disableCode, disableRef, resetDisable] = useOzInput();

  async function refresh() {
    const status = await mfaApi.status();
    setEnabled(status.enabled);
    if (status.enabled) setDevices(await mfaApi.listTrustedDevices());
  }

  useEffect(() => {
    run(refresh).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startEnroll = () =>
    run(async () => {
      setEnroll(await mfaApi.enroll());
      setMode('enrolling');
    });

  const cancelEnroll = () => {
    setMode('idle');
    setEnroll(null);
    setError(null);
  };

  const confirmEnroll = () => {
    if (code.trim().length < 6) { setError(t('codeRequired6')); return; }
    return run(async () => {
      const res = await mfaApi.confirm(code.trim());
      setRecoveryCodes(res.recoveryCodes);
      setMode('idle');
      setEnroll(null);
      resetCode('');
      await refresh();
    });
  };

  const disableMfa = () => {
    if (disableCode.trim().length < 6) { setError(t('codeRequiredDisable')); return; }
    return run(async () => {
      await mfaApi.disable(disableCode.trim());
      resetDisable('');
      setRecoveryCodes(null);
      await refresh();
    });
  };

  const regenerate = () => {
    if (disableCode.trim().length < 6) { setError(t('codeRequiredRegen')); return; }
    return run(async () => {
      const res = await mfaApi.regenerateRecoveryCodes(disableCode.trim());
      setRecoveryCodes(res.recoveryCodes);
      resetDisable('');
    });
  };

  const revokeDevice = (id: string) =>
    run(async () => {
      await mfaApi.revokeTrustedDevice(id);
      await refresh();
    });

  return {
    loading, enabled, mode, enroll, recoveryCodes, devices,
    busy, error,
    codeRef, disableRef,
    startEnroll, cancelEnroll, confirmEnroll, disableMfa, regenerate, revokeDevice,
  };
}
