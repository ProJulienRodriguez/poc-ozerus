import './globals.css';
import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { DsLoader } from '@/components/ds-loader';

export const metadata: Metadata = {
  title: 'Ozerus — Extranet partenaires',
  description: 'POC extranet Ozerus',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();
  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <DsLoader />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
