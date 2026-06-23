'use client';

import { useTranslations } from 'next-intl';
import type { MfaEnrollData, TrustedDevice } from '@/lib/api/mfa-api';
import { useMfa } from '@/lib/hooks/use-mfa';

type OzRef = (el: any) => void;

function EnrollPanel({ enroll, codeRef, busy, onConfirm, onCancel }: {
  enroll: MfaEnrollData;
  codeRef: OzRef;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations('security');
  const tc = useTranslations('common');
  return (
    <div className="stack" style={{ gap: 12 }}>
      <p className="hint">{t('enrollIntro')}</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={enroll.qrDataUrl} alt={t('qrAlt')} width={180} height={180} style={{ alignSelf: 'center', border: '1px solid var(--oz-line)', borderRadius: 8 }} />
      <div className="hint" style={{ wordBreak: 'break-all' }}>
        {t('manualKey')} <code>{enroll.secret}</code>
      </div>
      <oz-input ref={codeRef} label={t('codeLabel')} placeholder="123456" type="text" />
      <div className="row" style={{ gap: 8 }}>
        <oz-button variant="primary" onClick={onConfirm} disabled={busy || undefined}>
          {t('confirm')}
          <oz-icon slot="trailing" name="check" size={14} />
        </oz-button>
        <button type="button" className="link-btn" onClick={onCancel}>{tc('cancel')}</button>
      </div>
    </div>
  );
}

function ManagePanel({ disableRef, busy, onRegenerate, onDisable }: {
  disableRef: OzRef;
  busy: boolean;
  onRegenerate: () => void;
  onDisable: () => void;
}) {
  const t = useTranslations('security');
  return (
    <div className="stack" style={{ gap: 12 }}>
      <p className="hint">{t('manageIntro')}</p>
      <oz-input ref={disableRef} label={t('codeOrRecoveryLabel')} placeholder="123456" type="text" />
      <div className="row" style={{ gap: 8 }}>
        <oz-button variant="ghost" onClick={onRegenerate} disabled={busy || undefined}>{t('regenerate')}</oz-button>
        <oz-button variant="danger" onClick={onDisable} disabled={busy || undefined}>{t('disable')}</oz-button>
      </div>
    </div>
  );
}

function RecoveryCodesCard({ codes }: { codes: string[] }) {
  const t = useTranslations('security');
  return (
    <oz-card padding="lg" heading={t('recoveryTitle')}>
      <p className="hint" style={{ marginBottom: 12 }}>{t('recoveryIntro')}</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontFamily: 'monospace', fontSize: 14 }}>
        {codes.map((c) => <div key={c}>{c}</div>)}
      </div>
    </oz-card>
  );
}

function TrustedDevicesCard({ devices, busy, onRevoke }: {
  devices: TrustedDevice[];
  busy: boolean;
  onRevoke: (id: string) => void;
}) {
  const t = useTranslations('security');
  return (
    <oz-card padding="lg" heading={t('trustedTitle')}>
      <div className="stack" style={{ gap: 8 }}>
        {devices.map((d) => (
          <div key={d.id} className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div>{d.label ?? t('device')}</div>
              <div className="hint" style={{ fontSize: 11 }}>{t('expiresOn', { date: new Date(d.expiresAt).toLocaleDateString() })}</div>
            </div>
            <button type="button" className="link-btn" onClick={() => onRevoke(d.id)} disabled={busy}>
              {t('revoke')}
            </button>
          </div>
        ))}
      </div>
    </oz-card>
  );
}

export function SecurityView() {
  const t = useTranslations('security');
  const tc = useTranslations('common');
  const mfa = useMfa();

  if (mfa.loading) return <oz-card padding="lg"><div className="hint">{tc('loading')}</div></oz-card>;

  return (
    <div className="stack" style={{ gap: 16, maxWidth: 620 }}>
      <oz-card padding="lg" heading={t('card2faTitle')}>
        <div className="row" style={{ gap: 8, alignItems: 'center', marginBottom: 12 }}>
          <oz-icon name="shield" size={14} color={mfa.enabled ? 'var(--oz-forest)' : 'var(--oz-ink-3)'} />
          <strong>{mfa.enabled ? t('enabled') : t('disabled')}</strong>
        </div>

        {mfa.error && <div className="err" style={{ marginBottom: 12 }}>{mfa.error}</div>}

        {!mfa.enabled && mfa.mode === 'idle' && (
          <oz-button variant="primary" onClick={mfa.startEnroll} disabled={mfa.busy || undefined}>
            {t('activate')}
            <oz-icon slot="trailing" name="arrow-right" size={14} />
          </oz-button>
        )}

        {!mfa.enabled && mfa.mode === 'enrolling' && mfa.enroll && (
          <EnrollPanel
            enroll={mfa.enroll}
            codeRef={mfa.codeRef}
            busy={mfa.busy}
            onConfirm={mfa.confirmEnroll}
            onCancel={mfa.cancelEnroll}
          />
        )}

        {mfa.enabled && (
          <ManagePanel
            disableRef={mfa.disableRef}
            busy={mfa.busy}
            onRegenerate={mfa.regenerate}
            onDisable={mfa.disableMfa}
          />
        )}
      </oz-card>

      {mfa.recoveryCodes && <RecoveryCodesCard codes={mfa.recoveryCodes} />}

      {mfa.enabled && mfa.devices.length > 0 && (
        <TrustedDevicesCard devices={mfa.devices} busy={mfa.busy} onRevoke={mfa.revokeDevice} />
      )}
    </div>
  );
}
