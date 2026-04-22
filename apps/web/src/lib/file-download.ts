'use client';

import { downloadBlob } from './csv-export';

export function downloadText(content: string, filename: string, mime = 'text/plain;charset=utf-8'): void {
  downloadBlob(new Blob([content], { type: mime }), filename);
}

export function sanitizeFilename(s: string): string {
  return s.replace(/[^a-zA-Z0-9-_]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64) || 'fichier';
}
