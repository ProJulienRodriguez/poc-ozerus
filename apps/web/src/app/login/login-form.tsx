'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { startLoginAction, completeMfaAction } from '@/app/actions/auth';
import { useOzInput } from '@/lib/hooks/use-oz-input';

/** Renvoie la clé i18n du premier champ invalide, ou `null` si les identifiants sont valides. */
function credentialsErrorKey(email: string, password: string): string | null {
  if (!email.trim()) return 'emailRequired';
  if (!password) return 'passwordRequired';
  return null;
}

/** Applique le résultat de `startLoginAction` (erreur, ou passage à l'étape MFA). */
function applyLoginResult(
  res: Awaited<ReturnType<typeof startLoginAction>> | void,
  email: string,
  setError: (message: string) => void,
  onMfaRequired: (email: string, token: string, hint: string) => void,
) {
  // Connexion sans MFA : la server action redirige (aucun retour ici).
  if (!res) return;
  if (!res.ok) { setError(res.message); return; }
  if (res.mfaRequired) onMfaRequired(email, res.mfaToken, res.hint);
}

function CredentialsStep({ initialEmail, onMfaRequired }: {
  initialEmail: string;
  onMfaRequired: (email: string, token: string, hint: string) => void;
}) {
  const t = useTranslations('login');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [email, emailRef] = useOzInput(initialEmail);
  const [password, passwordRef] = useOzInput('');

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const errorKey = credentialsErrorKey(email, password);
    if (errorKey) { setError(t(errorKey)); return; }

    const form = new FormData();
    form.set('email', email.trim());
    form.set('password', password);

    startTransition(async () => {
      const res = await startLoginAction(null, form);
      applyLoginResult(res, email.trim(), setError, onMfaRequired);
    });
  }

  return (
    <oz-card heading={t('title')} subheading={t('subtitle')} padding="lg">
      <form onSubmit={onSubmit} className="stack" noValidate>
        <oz-input ref={emailRef} label={t('emailLabel')} type="email" placeholder={t('emailPlaceholder')}>
          <oz-icon slot="leading" name="users" size={14} />
        </oz-input>
        <oz-input ref={passwordRef} label={t('passwordLabel')} type="password" placeholder="••••••••" hint={t('passwordHint')} />
        {error && <div className="err">{error}</div>}
        <oz-button type="submit" variant="primary" size="lg" style={{ width: '100%', justifyContent: 'center' }} disabled={pending || undefined}>
          {pending ? t('connecting') : t('continue')}
          <oz-icon slot="trailing" name="arrow-right" size={14} />
        </oz-button>
        <div className="row" style={{ justifyContent: 'center', gap: 6 }}>
          <oz-icon name="shield" size={12} color="var(--oz-forest)" />
          <span style={{ fontSize: 11, color: 'var(--oz-ink-3)' }}>{t('secureNote')}</span>
        </div>
      </form>
    </oz-card>
  );
}

function MfaStep({ email, mfaToken, hint, onBack }: {
  email: string;
  mfaToken: string;
  hint: string;
  onBack: () => void;
}) {
  const t = useTranslations('login');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [code, codeRef] = useOzInput('');

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (code.trim().length < 6) { setError(t('codeRequired')); return; }

    const form = new FormData();
    form.set('mfaToken', mfaToken);
    form.set('code', code.trim());

    startTransition(async () => {
      // `completeMfaAction` ne renvoie qu'en cas d'erreur (sinon redirection côté serveur).
      const res = await completeMfaAction(null, form);
      if (res) setError(res.message);
    });
  }

  return (
    <oz-card heading={t('mfaTitle')} subheading={email} padding="lg">
      <form onSubmit={onSubmit} className="stack" noValidate>
        <div className="hint">{hint}</div>
        <oz-input ref={codeRef} label={t('codeLabel')} placeholder="123456" type="text" hint={t('codeHint')} />
        {error && <div className="err">{error}</div>}
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <button type="button" className="link-btn" onClick={onBack}>
            {t('changeEmail')}
          </button>
          <oz-button type="submit" variant="primary" disabled={pending || undefined}>
            {pending ? t('verifying') : t('submit')}
            <oz-icon slot="trailing" name="check" size={14} />
          </oz-button>
        </div>
      </form>
    </oz-card>
  );
}

export function LoginForm() {
  const [email, setEmail] = useState('admin@example.invalid');
  const [mfa, setMfa] = useState<{ token: string; hint: string } | null>(null);

  if (mfa) {
    return <MfaStep email={email} mfaToken={mfa.token} hint={mfa.hint} onBack={() => setMfa(null)} />;
  }

  return (
    <CredentialsStep
      initialEmail={email}
      onMfaRequired={(em, token, hint) => { setEmail(em); setMfa({ token, hint }); }}
    />
  );
}
