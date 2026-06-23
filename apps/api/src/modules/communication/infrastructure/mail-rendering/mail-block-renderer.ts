import { EMAIL_COLORS, wrapEmailMjml } from './wrap-email-mjml';
import type { MailBlock, MailInline } from './mail-block.types';

const HEADING_STYLE: Record<1 | 2, string> = {
  1: `margin:0;font-size:24px;font-weight:600;color:${EMAIL_COLORS.textHeading};`,
  2: `margin:0;font-size:20px;font-weight:600;color:${EMAIL_COLORS.textHeading};`,
};

function escapeText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function applyMarks(
  out: string,
  span: { bold?: boolean; italic?: boolean; underline?: boolean; strike?: boolean },
): string {
  let result = out;
  if (span.bold) {
    result = `<strong>${result}</strong>`;
  }
  if (span.italic) {
    result = `<em>${result}</em>`;
  }
  if (span.underline) {
    result = `<u>${result}</u>`;
  }
  if (span.strike) {
    result = `<s>${result}</s>`;
  }
  return result;
}

function renderInline(span: MailInline): string {
  if (span.type === 'variable') {
    return applyMarks(`{{${span.name}}}`, span);
  }
  if (span.type === 'link') {
    return `<a href="${escapeAttr(span.href)}">${escapeText(span.value)}</a>`;
  }
  return applyMarks(escapeText(span.value), span);
}

function renderContent(content: MailInline[]): string {
  return content.map(renderInline).join('');
}

function alignAttr(align?: string): string {
  return align && align !== 'left' ? ` align="${align}"` : '';
}

function renderBlock(block: MailBlock): string {
  switch (block.type) {
    case 'heading':
      return `<mj-text${alignAttr(block.align)}><h${block.level} style="${HEADING_STYLE[block.level]}">${renderContent(block.content)}</h${block.level}></mj-text>`;
    case 'paragraph': {
      const align = alignAttr(block.align);
      if (block.note === 'muted') {
        return `<mj-text font-size="14px" color="${EMAIL_COLORS.textMuted}"${align}>${renderContent(block.content)}</mj-text>`;
      }
      if (block.note === 'faint') {
        return `<mj-text font-size="12px" color="${EMAIL_COLORS.textFaint}"${align}>${renderContent(block.content)}</mj-text>`;
      }
      return `<mj-text${align}>${renderContent(block.content)}</mj-text>`;
    }
    case 'button':
      return `<mj-button href="${escapeAttr(block.href)}"${block.align ? ` align="${block.align}"` : ''}>${escapeText(block.label)}</mj-button>`;
    default: {
      const exhaustive: never = block;
      throw new Error(`Bloc d'email inconnu: ${JSON.stringify(exhaustive)}`);
    }
  }
}

/** Rend le corps en blocs canonique dans le document MJML brandé complet. */
export function renderBlocksToMjml(blocks: MailBlock[]): string {
  const inner = blocks.map((block) => `        ${renderBlock(block)}`).join('\n');
  return wrapEmailMjml(inner);
}
