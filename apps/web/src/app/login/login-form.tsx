'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { startLoginAction, completeMfaAction } from '@/app/actions/auth';

type Step = 'credentials' | 'mfa';

function useOzInput(defaultValue = ''): [string, (el: any) => void, (v: string) => void] {
  const [value, setValue] = useState(defaultValue);
  const ref = useRef<any>(null);
  const setRef = (el: any) => {
    if (ref.current === el) return;
    if (ref.current) {
      ref.current.removeEventListener('ozInput', ref.current._ozHandler);
    }
    ref.current = el;
    if (el) {
      const handler = (ev: CustomEvent<string>) => setValue(ev.detail);
      el._ozHandler = handler;
      el.addEventListener('ozInput', handler);
      el.value = value;
    }
  };
  return [value, setRef, setValue];
}

export function LoginForm() {
  const [step, setStep] = useState<Step>('credentials');
  const [challengeId, setChallengeId] = useState<string>('');
  const [hint, setHint] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [email, emailRef, setEmail] = useOzInput('marie.laurent@helios.fr');
  const [password, passwordRef] = useOzInput('');
  const [code, codeRef] = useOzInput('');

  // Keep email value in sync with the underlying oz-input on remount
  useEffect(() => { if ((emailRef as any).current) (emailRef as any).current.value = email; }, [email, emailRef]);

  async function onCredentials(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!email.trim()) { setError('Email requis.'); return; }
    if (password.length < 4) { setError('Mot de passe trop court (min. 4 caractères).'); return; }

    const form = new FormData();
    form.set('email', email.trim());
    form.set('password', password);

    startTransition(async () => {
      const res = await startLoginAction(null, form);
      if (!res.ok) { setError(res.message); return; }
      setChallengeId(res.challengeId);
      setHint(res.hint);
      setStep('mfa');
    });
  }

  async function onMfa(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (code.trim().length < 6) { setError('Code à 6 chiffres requis.'); return; }

    const form = new FormData();
    form.set('challengeId', challengeId);
    form.set('code', code.trim());

    startTransition(async () => {
      const res = await completeMfaAction(null, form);
      if (res && 'ok' in res && res.ok === false) setError(res.message);
    });
  }

  if (step === 'credentials') {
    return (
      <oz-card heading="Connexion à l'extranet" subheading="Accédez à votre espace partenaire" padding="lg">
        <form onSubmit={onCredentials} className="stack" noValidate>
          <oz-input ref={emailRef} label="Email" type="email" placeholder="nom@cabinet.fr">
            <oz-icon slot="leading" name="users" size={14} />
          </oz-input>
          <oz-input ref={passwordRef} label="Mot de passe" type="password" placeholder="••••••••" hint="Minimum 4 caractères (démo)" />
          {error && <div className="err">{error}</div>}
          <oz-button type="submit" variant="primary" size="lg" style={{ width: '100%', justifyContent: 'center' }} disabled={pending || undefined}>
            {pending ? 'Connexion…' : 'Continuer'}
            <oz-icon slot="trailing" name="arrow-right" size={14} />
          </oz-button>
          <div className="row" style={{ justifyContent: 'center', gap: 6 }}>
            <oz-icon name="shield" size={12} color="var(--oz-forest)" />
            <span style={{ fontSize: 11, color: 'var(--oz-ink-3)' }}>Connexion sécurisée · MFA requis</span>
          </div>
        </form>
      </oz-card>
    );
  }

  return (
    <oz-card heading="Vérification en deux étapes" subheading={email} padding="lg">
      <form onSubmit={onMfa} className="stack" noValidate>
        <div className="hint">{hint}</div>
        <oz-input ref={codeRef} label="Code de sécurité" placeholder="123456" type="text" hint="6 chiffres reçus par email ou application" />
        {error && <div className="err">{error}</div>}
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <button type="button" className="link-btn" onClick={() => { setStep('credentials'); setError(null); setEmail(email); }}>
            ← Changer d'email
          </button>
          <oz-button type="submit" variant="primary" disabled={pending || undefined}>
            {pending ? 'Vérification…' : 'Se connecter'}
            <oz-icon slot="trailing" name="check" size={14} />
          </oz-button>
        </div>
      </form>
    </oz-card>
  );
}
