import './globals.css';
import type { Metadata, Viewport } from 'next';
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <DsLoader />
        {children}
      </body>
    </html>
  );
}
