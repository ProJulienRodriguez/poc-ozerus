// Tons couleur par statut (les libellés sont gérés via i18n, pas ici).

export const TEMPLATE_STATUS_TONE: Record<string, string> = {
  PUBLISHED: 'var(--oz-forest)',
  DRAFT: 'var(--oz-ochre, #b8860b)',
  ARCHIVED: 'var(--oz-ink-3)',
};

export const REPORT_STATUS_TONE: Record<string, string> = {
  ready: 'success',
  pending: 'warn',
  failed: 'danger',
};
