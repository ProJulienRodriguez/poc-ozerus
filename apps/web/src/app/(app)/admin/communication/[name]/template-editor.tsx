'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { communicationApi } from '@/lib/api/communication-api';
import {
  GLOBAL_VARIABLES,
  type PreviewResult,
  type TemplateTypeDefinition,
  type TemplateVersion,
} from '@/lib/communication-types';
import {
  type EditorBlock,
  type MailAlign,
  blocksFromBodyState,
  detectVariables,
  editorToMailBlocks,
  mailBlocksToEditor,
  newBlock,
} from '@/lib/mail-blocks';
import { moveItem } from '@/lib/array-utils';
import { useAsyncGuard } from '@/lib/hooks/use-async-guard';
import { useFlash } from '@/lib/hooks/use-flash';
import { chipStyle, inputStyle, labelStyle, selectStyle, tabStyle } from '@/lib/ui/form-styles';

type Focus = { kind: 'subject' } | { kind: 'block'; id: string } | null;

export function TemplateEditor({ name }: { name: string }) {
  const t = useTranslations('communication');
  const tc = useTranslations('common');
  const [def, setDef] = useState<TemplateTypeDefinition | null>(null);
  const [versions, setVersions] = useState<TemplateVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, flash] = useFlash();
  const { busy, error, setError, run } = useAsyncGuard(tc('error'));

  const [versionId, setVersionId] = useState<string | null>(null);
  const [locale, setLocale] = useState<string>('fr');
  const [subject, setSubject] = useState('');
  const [blocks, setBlocks] = useState<EditorBlock[]>([]);
  const [samples, setSamples] = useState<Record<string, string>>({});
  const [focus, setFocus] = useState<Focus>(null);

  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [testTo, setTestTo] = useState('');
  const [testResult, setTestResult] = useState<string | null>(null);

  const current = versions.find((v) => v.id === versionId) ?? null;
  const editable = current?.status === 'DRAFT';
  const hasDraft = versions.some((v) => v.status === 'DRAFT');
  const published = versions.find((v) => v.status === 'PUBLISHED') ?? null;

  async function reload(selectName?: string) {
    const [cat, vers] = await Promise.all([communicationApi.getCatalog(), communicationApi.getTimeline(name)]);
    setDef(cat.find((c) => c.name === name) ?? null);
    setVersions(vers);
    const draft = vers.find((v) => v.status === 'DRAFT');
    const pub = vers.find((v) => v.status === 'PUBLISHED');
    const chosen = vers.find((v) => v.name === selectName && v.status === 'DRAFT') ?? draft ?? pub ?? vers[vers.length - 1] ?? null;
    setVersionId(chosen?.id ?? null);
    return chosen;
  }

  useEffect(() => {
    run(reload).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  // Charge le corps (locale) de la version sélectionnée dans l'éditeur.
  useEffect(() => {
    if (!current) return;
    const body = current.bodies.find((b) => b.locale === locale) ?? current.bodies[0];
    if (!body) { setSubject(''); setBlocks([]); return; }
    if (body.locale !== locale) setLocale(body.locale);
    setSubject(body.subject);
    const mb = blocksFromBodyState(body.bodyState);
    setBlocks(mb ? mailBlocksToEditor(mb) : []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versionId, locale, versions]);

  // Valeurs d'exemple initiales depuis le contrat de variables du type.
  useEffect(() => {
    if (!def) return;
    setSamples((prev) => {
      const next = { ...prev };
      for (const v of def.variables) if (!(v.name in next)) next[v.name] = `«${v.name}»`;
      for (const g of GLOBAL_VARIABLES) if (!(g in next)) next[g] = g === 'currentYear' ? '2026' : `«${g}»`;
      return next;
    });
  }, [def]);

  const availableVars = useMemo(
    () => [...(def?.variables.map((v) => v.name) ?? []), ...GLOBAL_VARIABLES],
    [def],
  );

  function insertVariable(varName: string) {
    const token = `{{${varName}}}`;
    if (focus?.kind === 'subject') {
      setSubject((s) => s + token);
    } else if (focus?.kind === 'block') {
      setBlocks((bs) => bs.map((b) => {
        if (b.id !== focus.id) return b;
        if (b.type === 'button') return { ...b, label: b.label + token };
        return { ...b, text: b.text + token };
      }));
    } else {
      flash(t('editor.insertFocusHint'));
    }
  }

  function patchBlock(id: string, patch: Partial<EditorBlock>) {
    setBlocks((bs) => bs.map((b) => (b.id === id ? ({ ...b, ...patch } as EditorBlock) : b)));
  }

  const createDraft = () =>
    run(async () => {
      const source = published ?? versions[versions.length - 1];
      if (!source) throw new Error(t('editor.noSource'));
      const bodies = source.bodies.map((b) => {
        const mb = blocksFromBodyState(b.bodyState);
        return {
          locale: b.locale,
          subject: b.subject,
          variables: b.variables,
          ...(mb ? { blocks: mb } : { bodyMjml: b.bodyMjml }),
        };
      });
      await communicationApi.create(name, bodies);
      await reload(name);
      flash(t('editor.draftCreated'));
    });

  const saveBody = () =>
    run(async () => {
      if (!current) return;
      await communicationApi.updateBody(name, current.version, locale, {
        subject,
        blocks: editorToMailBlocks(blocks),
        variables: detectVariables(subject, blocks),
        samples,
      });
      await reload(name);
      flash(t('editor.saved'));
    });

  const doPreview = () =>
    run(async () => {
      setPreview(await communicationApi.preview({ subject, blocks: editorToMailBlocks(blocks), variables: samples }));
    });

  const publish = () =>
    run(async () => {
      if (!current) return;
      await communicationApi.publish(name, current.version);
      await reload();
      flash(t('editor.published'));
    });

  const archive = () =>
    run(async () => {
      if (!current) return;
      await communicationApi.archive(name, current.version);
      await reload();
      flash(t('editor.archived'));
    });

  const addLocale = () =>
    run(async () => {
      if (!current) return;
      const loc = window.prompt(t('editor.addLangPrompt'), 'en');
      if (!loc) return;
      await communicationApi.addLocale(name, current.version, { locale: loc, copyFrom: locale });
      await reload(name);
      setLocale(loc);
      flash(t('editor.langAdded', { loc }));
    });

  const testSend = () =>
    run(async () => {
      setTestResult(null);
      const res = await communicationApi.testSend({ templateName: name, locale, to: testTo, variables: samples });
      setTestResult(res.status === 'sent' ? t('editor.testSent', { to: testTo }) : t('editor.testFailed', { error: res.error ?? '' }));
    });

  if (loading) return <oz-card padding="lg"><div className="hint">{tc('loading')}</div></oz-card>;
  if (!def) return <oz-card padding="lg"><div className="err">{t('editor.unknownType')}</div></oz-card>;

  return (
    <div className="stack" style={{ gap: 16 }}>
      {/* Barre de version / statut */}
      <oz-card padding="lg">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <strong>{def.label}</strong>
            <div className="hint" style={{ fontSize: 12, marginTop: 2 }}>
              {current ? `${t('editor.versionLabel', { version: current.version })} · ${t(`status.${current.status}`)}` : t('editor.noVersion')}
              {def.protected && ` · ${t('editor.protectedNote')}`}
            </div>
          </div>
          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            <select value={versionId ?? ''} onChange={(e) => setVersionId(e.target.value)} style={selectStyle}>
              {versions.map((v) => (
                <option key={v.id} value={v.id}>v{v.version} — {t(`status.${v.status}`)}</option>
              ))}
            </select>
            {!hasDraft && (
              <oz-button variant="primary" onClick={createDraft} disabled={busy || undefined}>{t('editor.createDraft')}</oz-button>
            )}
            {editable && (
              <>
                <oz-button variant="ghost" onClick={saveBody} disabled={busy || undefined}>{tc('save')}</oz-button>
                <oz-button variant="primary" onClick={publish} disabled={busy || undefined}>{t('editor.publish')}</oz-button>
              </>
            )}
            {current?.status === 'PUBLISHED' && !def.protected && (
              <oz-button variant="danger" onClick={archive} disabled={busy || undefined}>{t('editor.archive')}</oz-button>
            )}
          </div>
        </div>
        {notice && <div style={{ marginTop: 10, color: 'var(--oz-forest)', fontSize: 13 }}>{notice}</div>}
        {error && <div className="err" style={{ marginTop: 10 }}>{error}</div>}
      </oz-card>

      {/* Onglets de langue */}
      {current && (
        <div className="row" style={{ gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {current.bodies.map((b) => (
            <button key={b.locale} type="button" onClick={() => setLocale(b.locale)} style={tabStyle(b.locale === locale)}>
              {b.locale.toUpperCase()}
            </button>
          ))}
          {editable && (
            <button type="button" className="link-btn" onClick={addLocale} disabled={busy}>{t('editor.addLang')}</button>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 280px', gap: 16, alignItems: 'start' }}>
        {/* Colonne édition */}
        <oz-card padding="lg">
          <label style={labelStyle}>{t('editor.subject')}</label>
          <input
            value={subject}
            disabled={!editable}
            onChange={(e) => setSubject(e.target.value)}
            onFocus={() => setFocus({ kind: 'subject' })}
            style={inputStyle}
          />

          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', margin: '16px 0 8px' }}>
            <label style={{ ...labelStyle, margin: 0 }}>{t('editor.body')}</label>
          </div>

          <div className="stack" style={{ gap: 10 }}>
            {blocks.map((b, idx) => (
              <BlockRow
                key={b.id}
                block={b}
                idx={idx}
                count={blocks.length}
                editable={editable}
                onFocus={() => setFocus({ kind: 'block', id: b.id })}
                onPatch={(p) => patchBlock(b.id, p)}
                onMove={(d) => setBlocks((bs) => moveItem(bs, idx, d))}
                onRemove={() => setBlocks((bs) => bs.filter((x) => x.id !== b.id))}
              />
            ))}
            {blocks.length === 0 && <div className="hint">{t('editor.noBlocks')}</div>}
          </div>

          {editable && (
            <div className="row" style={{ gap: 8, marginTop: 12 }}>
              <oz-button variant="ghost" size="sm" onClick={() => setBlocks((bs) => [...bs, newBlock('heading')])}>{t('editor.addHeading')}</oz-button>
              <oz-button variant="ghost" size="sm" onClick={() => setBlocks((bs) => [...bs, newBlock('paragraph')])}>{t('editor.addParagraph')}</oz-button>
              <oz-button variant="ghost" size="sm" onClick={() => setBlocks((bs) => [...bs, newBlock('button')])}>{t('editor.addButton')}</oz-button>
            </div>
          )}
        </oz-card>

        {/* Colonne latérale */}
        <div className="stack" style={{ gap: 16 }}>
          <oz-card padding="lg" heading={t('editor.variables')}>
            <p className="hint" style={{ fontSize: 11, marginBottom: 8 }}>{t('editor.variablesHint')}</p>
            <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
              {availableVars.map((v) => {
                const required = def.variables.find((d) => d.name === v)?.required;
                return (
                  <button key={v} type="button" onClick={() => insertVariable(v)} disabled={!editable} style={chipStyle}>
                    {v}{required ? ' *' : ''}
                  </button>
                );
              })}
            </div>
          </oz-card>

          <oz-card padding="lg" heading={t('editor.samples')}>
            <p className="hint" style={{ fontSize: 11, marginBottom: 8 }}>{t('editor.samplesHint')}</p>
            <div className="stack" style={{ gap: 6 }}>
              {availableVars.map((v) => (
                <div key={v}>
                  <label style={{ fontSize: 11, color: 'var(--oz-ink-3)' }}>{v}</label>
                  <input value={samples[v] ?? ''} onChange={(e) => setSamples((s) => ({ ...s, [v]: e.target.value }))} style={{ ...inputStyle, padding: '6px 8px' }} />
                </div>
              ))}
            </div>
          </oz-card>

          <oz-card padding="lg" heading={t('editor.previewTest')}>
            <div className="stack" style={{ gap: 8 }}>
              <oz-button variant="ghost" onClick={doPreview} disabled={busy || undefined}>{t('editor.preview')}</oz-button>
              <input value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder={t('editor.testEmailPlaceholder')} style={inputStyle} />
              <oz-button variant="ghost" onClick={testSend} disabled={busy || !testTo || undefined}>{t('editor.sendTest')}</oz-button>
              {testResult && <div className="hint" style={{ fontSize: 12 }}>{testResult}</div>}
            </div>
          </oz-card>
        </div>
      </div>

      {preview && (
        <oz-card padding="lg" heading={t('editor.previewTitle', { subject: preview.subject })}>
          <iframe
            title="preview"
            srcDoc={preview.html}
            style={{ width: '100%', height: 520, border: '1px solid var(--oz-line)', borderRadius: 8, background: '#fff' }}
          />
        </oz-card>
      )}
    </div>
  );
}

function BlockRow({
  block, idx, count, editable, onFocus, onPatch, onMove, onRemove,
}: {
  block: EditorBlock;
  idx: number;
  count: number;
  editable: boolean;
  onFocus: () => void;
  onPatch: (p: Partial<EditorBlock>) => void;
  onMove: (d: -1 | 1) => void;
  onRemove: () => void;
}) {
  const t = useTranslations('communication.blocks');
  const typeLabel = block.type === 'heading' ? t('heading') : block.type === 'paragraph' ? t('paragraph') : t('button');

  return (
    <div style={{ border: '1px solid var(--oz-line)', borderRadius: 8, padding: 10 }}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--oz-ink-3)' }}>{typeLabel}</span>
        {editable && (
          <div className="row" style={{ gap: 4 }}>
            <button type="button" className="link-btn" disabled={idx === 0} onClick={() => onMove(-1)} title={t('moveUp')}>↑</button>
            <button type="button" className="link-btn" disabled={idx === count - 1} onClick={() => onMove(1)} title={t('moveDown')}>↓</button>
            <button type="button" className="link-btn" onClick={onRemove} title={t('remove')}>✕</button>
          </div>
        )}
      </div>

      {block.type === 'button' ? (
        <div className="stack" style={{ gap: 6 }}>
          <input value={block.label} disabled={!editable} onFocus={onFocus} onChange={(e) => onPatch({ label: e.target.value })} placeholder={t('labelPlaceholder')} style={inputStyle} />
          <input value={block.href} disabled={!editable} onChange={(e) => onPatch({ href: e.target.value })} placeholder={t('linkPlaceholder')} style={inputStyle} />
        </div>
      ) : (
        <textarea
          value={block.text}
          disabled={!editable}
          onFocus={onFocus}
          onChange={(e) => onPatch({ text: e.target.value })}
          rows={block.type === 'heading' ? 1 : 3}
          style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
        />
      )}

      {editable && (
        <div className="row" style={{ gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
          {block.type === 'heading' && (
            <select value={block.level} onChange={(e) => onPatch({ level: Number(e.target.value) as 1 | 2 })} style={selectStyle}>
              <option value={1}>{t('level1')}</option>
              <option value={2}>{t('level2')}</option>
            </select>
          )}
          <select value={block.align} onChange={(e) => onPatch({ align: e.target.value as MailAlign })} style={selectStyle}>
            <option value="left">{t('alignLeft')}</option>
            <option value="center">{t('alignCenter')}</option>
            <option value="right">{t('alignRight')}</option>
          </select>
          {block.type === 'paragraph' && (
            <select value={block.note ?? ''} onChange={(e) => onPatch({ note: (e.target.value || undefined) as any })} style={selectStyle}>
              <option value="">{t('noteNormal')}</option>
              <option value="muted">{t('noteMuted')}</option>
              <option value="faint">{t('noteFaint')}</option>
            </select>
          )}
        </div>
      )}
    </div>
  );
}
