import { cookies } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';

// Locales supportées. La bascule se fait via le cookie NEXT_LOCALE (pas de
// routing par segment d'URL : le front reste mono-URL, FR par défaut).
export const LOCALES = ['fr', 'en'] as const;
export const DEFAULT_LOCALE = 'fr';
export type AppLocale = (typeof LOCALES)[number];

function resolveLocale(value: string | undefined): AppLocale {
  return (LOCALES as readonly string[]).includes(value ?? '') ? (value as AppLocale) : DEFAULT_LOCALE;
}

export default getRequestConfig(async () => {
  const locale = resolveLocale(cookies().get('NEXT_LOCALE')?.value);
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
