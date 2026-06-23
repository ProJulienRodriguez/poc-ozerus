import type { CSSProperties } from 'react';

// Styles de champs partagés par l'éditeur de templates et ses sous-composants.
export const labelStyle: CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 };

export const inputStyle: CSSProperties = {
  width: '100%', padding: '8px 10px', border: '1px solid var(--oz-line)', borderRadius: 6, fontSize: 14, boxSizing: 'border-box',
};

export const selectStyle: CSSProperties = {
  padding: '6px 8px', border: '1px solid var(--oz-line)', borderRadius: 6, fontSize: 13, background: '#fff',
};

export const chipStyle: CSSProperties = {
  padding: '3px 8px', border: '1px solid var(--oz-line)', borderRadius: 999, fontSize: 11,
  background: 'var(--oz-bg-soft, #f5f5f0)', cursor: 'pointer', fontFamily: 'monospace',
};

export function tabStyle(active: boolean): CSSProperties {
  return {
    padding: '6px 14px', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer',
    border: `1px solid ${active ? 'var(--oz-forest)' : 'var(--oz-line)'}`,
    background: active ? 'var(--oz-forest)' : '#fff',
    color: active ? '#fff' : 'var(--oz-ink-2, #333)',
  };
}
