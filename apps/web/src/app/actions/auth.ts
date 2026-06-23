'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { apiFetch, forwardSetCookies } from '@/lib/server-api';
import { ACCESS_COOKIE, REFRESH_COOKIE } from '@/lib/auth-constants';

export interface LoginMfaPending { ok: true; mfaRequired: true; mfaToken: string; hint: string }
export interface LoginDone { ok: true; mfaRequired: false }
export interface LoginError { ok: false; message: string }
export type LoginResult = LoginMfaPending | LoginDone | LoginError;

async function messageFrom(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json();
    const m = data?.message;
    if (Array.isArray(m)) return m.join(' ');
    if (typeof m === 'string') return m;
  } catch {
    /* corps non JSON */
  }
  return fallback;
}

/** Étape 1 : identifiants. Ouvre la session ou demande le second facteur. */
export async function startLoginAction(_: unknown, form: FormData): Promise<LoginResult> {
  const t = await getTranslations('login');
  const email = (form.get('email') ?? '').toString().trim();
  const password = (form.get('password') ?? '').toString();
  if (!email || !email.includes('@')) return { ok: false, message: t('invalidEmail') };
  if (!password) return { ok: false, message: t('passwordRequired') };

  let res: Response;
  try {
    res = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  } catch {
    return { ok: false, message: t('apiUnreachable') };
  }

  if (res.status === 401) return { ok: false, message: t('invalidCredentials') };
  if (!res.ok) return { ok: false, message: await messageFrom(res, t('loginFailed')) };

  const data = await res.json();
  if (data?.mfaRequired) {
    return {
      ok: true,
      mfaRequired: true,
      mfaToken: data.mfaToken,
      hint: t('mfaPrompt'),
    };
  }

  forwardSetCookies(res);
  redirect('/dashboard');
}

export interface MfaError { ok: false; message: string }

export async function completeMfaAction(_: unknown, form: FormData): Promise<MfaError | void> {
  const t = await getTranslations('login');
  const mfaToken = (form.get('mfaToken') ?? '').toString();
  const code = (form.get('code') ?? '').toString().trim();
  if (!mfaToken) return { ok: false, message: t('mfaSessionLost') };
  if (!code) return { ok: false, message: t('codeRequiredShort') };

  let res: Response;
  try {
    res = await apiFetch('/auth/login/mfa', {
      method: 'POST',
      body: JSON.stringify({ mfaToken, totpCode: code }),
    });
  } catch {
    return { ok: false, message: t('apiUnreachable') };
  }

  if (!res.ok) return { ok: false, message: await messageFrom(res, t('codeInvalid')) };

  forwardSetCookies(res);
  redirect('/dashboard');
}

/** Déconnexion : révoque la session côté API puis efface les cookies locaux. */
export async function logoutAction(): Promise<void> {
  try {
    const res = await apiFetch('/auth/logout', { method: 'POST' });
    forwardSetCookies(res);
  } catch {
    /* on efface localement quoi qu'il arrive */
  }
  cookies().delete(ACCESS_COOKIE);
  cookies().delete(REFRESH_COOKIE);
  redirect('/login');
}
