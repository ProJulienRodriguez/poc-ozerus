import { getTranslations } from 'next-intl/server';
import { TemplateEditor } from './template-editor';

export default async function TemplateDetailPage({ params }: { params: { name: string } }) {
  const t = await getTranslations('communication.editor');
  return (
    <div>
      <div className="page-head">
        <div className="oz-micro oz-muted">
          <a href="/admin/communication" style={{ color: 'var(--oz-forest-700)', textDecoration: 'underline' }}>{t('breadcrumb')}</a> / {params.name}
        </div>
        <h1 className="oz-h1" style={{ marginTop: 4 }}>{t('pageTitle')}</h1>
      </div>
      <TemplateEditor name={params.name} />
    </div>
  );
}
