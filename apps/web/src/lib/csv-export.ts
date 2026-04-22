'use client';

function escapeCsv(v: unknown): string {
  const s = v === null || v === undefined ? '' : String(v);
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function downloadCsv<T extends Record<string, unknown>>(rows: T[], filename: string): void {
  if (rows.length === 0) {
    downloadBlob(new Blob(['﻿'], { type: 'text/csv;charset=utf-8' }), filename);
    return;
  }
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(';'),
    ...rows.map(r => headers.map(h => escapeCsv(r[h])).join(';')),
  ];
  const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  downloadBlob(blob, filename);
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
