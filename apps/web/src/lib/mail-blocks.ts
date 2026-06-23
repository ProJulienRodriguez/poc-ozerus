// Modèle de blocs côté éditeur, aligné sur le contrat backend (mail-block.types.ts).
// L'éditeur manipule le texte en clair (avec {{variables}}) ; la conversion
// vers/depuis les MailInline du backend est faite ici.

export type MailAlign = 'left' | 'center' | 'right';

export type MailInline =
  | { type: 'text'; value: string }
  | { type: 'variable'; name: string }
  | { type: 'link'; href: string; value: string };

export type MailBlock =
  | { type: 'heading'; level: 1 | 2; content: MailInline[]; align?: MailAlign }
  | { type: 'paragraph'; content: MailInline[]; note?: 'muted' | 'faint'; align?: MailAlign }
  | { type: 'button'; label: string; href: string; align?: MailAlign };

// Représentation d'édition : le contenu texte est une simple chaîne avec {{vars}}.
export type EditorBlock =
  | { id: string; type: 'heading'; level: 1 | 2; text: string; align: MailAlign }
  | { id: string; type: 'paragraph'; text: string; note?: 'muted' | 'faint'; align: MailAlign }
  | { id: string; type: 'button'; label: string; href: string; align: MailAlign };

let counter = 0;
export function blockId(): string {
  counter += 1;
  return `b${Date.now().toString(36)}${counter}`;
}

const VAR_RE = /\{\{(\w+)\}\}/g;

/** "Bonjour {{name}}" -> [text, variable, ...]. */
export function textToInlines(text: string): MailInline[] {
  const out: MailInline[] = [];
  let last = 0;
  for (const m of text.matchAll(VAR_RE)) {
    const idx = m.index ?? 0;
    if (idx > last) out.push({ type: 'text', value: text.slice(last, idx) });
    out.push({ type: 'variable', name: m[1] });
    last = idx + m[0].length;
  }
  if (last < text.length) out.push({ type: 'text', value: text.slice(last) });
  return out.length ? out : [{ type: 'text', value: '' }];
}

/** Inverse : reconstruit le texte éditable depuis les inlines. */
export function inlinesToText(content: MailInline[]): string {
  return content
    .map((i) => {
      if (i.type === 'text') return i.value;
      if (i.type === 'variable') return `{{${i.name}}}`;
      return i.value; // link : on garde le libellé
    })
    .join('');
}

export function editorToMailBlocks(blocks: EditorBlock[]): MailBlock[] {
  return blocks.map((b) => {
    if (b.type === 'button') {
      return { type: 'button', label: b.label, href: b.href, align: b.align };
    }
    if (b.type === 'heading') {
      return { type: 'heading', level: b.level, content: textToInlines(b.text), align: b.align };
    }
    return { type: 'paragraph', content: textToInlines(b.text), note: b.note, align: b.align };
  });
}

export function mailBlocksToEditor(blocks: MailBlock[]): EditorBlock[] {
  return blocks.map((b) => {
    if (b.type === 'button') {
      return { id: blockId(), type: 'button', label: b.label, href: b.href, align: b.align ?? 'left' };
    }
    if (b.type === 'heading') {
      return { id: blockId(), type: 'heading', level: b.level, text: inlinesToText(b.content), align: b.align ?? 'left' };
    }
    return { id: blockId(), type: 'paragraph', text: inlinesToText(b.content), note: b.note, align: b.align ?? 'left' };
  });
}

/** Extrait depuis bodyState (stocké par le backend) la liste de blocs. */
export function blocksFromBodyState(bodyState: Record<string, unknown> | null): MailBlock[] | null {
  if (bodyState && Array.isArray((bodyState as { blocks?: unknown }).blocks)) {
    return (bodyState as { blocks: MailBlock[] }).blocks;
  }
  return null;
}

/** Variables ({{xxx}}) référencées dans le sujet et les blocs. */
export function detectVariables(subject: string, blocks: EditorBlock[]): string[] {
  const found = new Set<string>();
  const scan = (s: string) => {
    for (const m of s.matchAll(VAR_RE)) found.add(m[1]);
  };
  scan(subject);
  for (const b of blocks) {
    if (b.type === 'button') {
      scan(b.label);
      scan(b.href);
    } else {
      scan(b.text);
    }
  }
  return [...found];
}

export function newBlock(type: EditorBlock['type']): EditorBlock {
  if (type === 'heading') return { id: blockId(), type: 'heading', level: 2, text: 'Titre', align: 'left' };
  if (type === 'button') return { id: blockId(), type: 'button', label: 'Action', href: '{{activationLink}}', align: 'center' };
  return { id: blockId(), type: 'paragraph', text: 'Texte du paragraphe.', align: 'left' };
}
