'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { TOKEN_COOKIE, MFA_CODE, encodeToken, resolveUser } from '@/lib/auth';

export interface LoginStartResult { ok: true; challengeId: string; hint: string }
export interface LoginStartError { ok: false; message: string }

const CHALLENGE_COOKIE = 'oz_challenge';

export async function startLoginAction(_: unknown, form: FormData): Promise<LoginStartResult | LoginStartError> {
  const email = (form.get('email') ?? '').toString().trim();
  const password = (form.get('password') ?? '').toString();
  if (!email || !email.includes('@')) return { ok: false, message: 'Adresse email invalide.' };
  if (password.length < 4) return { ok: false, message: 'Mot de passe trop court (min. 4).' };

  const challengeId = `mfa-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  cookies().set(CHALLENGE_COOKIE, JSON.stringify({ challengeId, email: email.toLowerCase(), exp: Date.now() + 5 * 60 * 1000 }), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 5 * 60,
  });
  return { ok: true, challengeId, hint: `Code MFA envoyé (utilisez ${MFA_CODE} pour la démo)` };
}

export interface MfaResult { ok: true }
export interface MfaError { ok: false; message: string }

export async function completeMfaAction(_: unknown, form: FormData): Promise<MfaResult | MfaError> {
  const challengeId = (form.get('challengeId') ?? '').toString();
  const code = (form.get('code') ?? '').toString().trim();
  if (!challengeId || !code) return { ok: false, message: 'Code manquant.' };

  const raw = cookies().get(CHALLENGE_COOKIE)?.value;
  if (!raw) return { ok: false, message: 'Session MFA introuvable.' };
  let payload: { challengeId: string; email: string; exp: number };
  try { payload = JSON.parse(raw); } catch { return { ok: false, message: 'Session MFA illisible.' }; }
  if (payload.challengeId !== challengeId) return { ok: false, message: 'Session MFA ne correspond pas.' };
  if (payload.exp < Date.now()) return { ok: false, message: 'Session MFA expirée.' };
  if (code !== MFA_CODE) return { ok: false, message: 'Code MFA incorrect.' };

  const user = resolveUser(payload.email);
  cookies().set(TOKEN_COOKIE, encodeToken(user), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 12,
  });
  cookies().delete(CHALLENGE_COOKIE);
  redirect('/dashboard');
}

export async function logoutAction() {
  cookies().delete(TOKEN_COOKIE);
  cookies().delete(CHALLENGE_COOKIE);
  redirect('/login');
}
