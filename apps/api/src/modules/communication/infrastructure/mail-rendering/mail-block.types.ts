/**
 * Modèle de blocs canonique pour les corps d'email — contrat d'échange entre
 * l'éditeur (front) et le moteur de rendu. Volontairement découplé du format
 * interne de l'éditeur pour survivre à un changement d'éditeur.
 */

export type MailAlign = 'left' | 'center' | 'right';

interface InlineMarks {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
}

export type MailInline =
  | ({ type: 'text'; value: string } & InlineMarks)
  | ({ type: 'variable'; name: string } & InlineMarks)
  | { type: 'link'; href: string; value: string };

export type MailBlock =
  | { type: 'heading'; level: 1 | 2; content: MailInline[]; align?: MailAlign }
  | { type: 'paragraph'; content: MailInline[]; note?: 'muted' | 'faint'; align?: MailAlign }
  | { type: 'button'; label: string; href: string; align?: MailAlign };

export interface MailBody {
  blocks: MailBlock[];
}
