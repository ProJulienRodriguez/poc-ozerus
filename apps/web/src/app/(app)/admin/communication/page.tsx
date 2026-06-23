import { getTranslations } from 'next-intl/server';
import { TemplatesList } from './templates-list';

export default async function CommunicationPage() {
  const t = await getTranslations('communication.list');
  return (
    <div>
      <div className="page-head">
        <h1 className="oz-h1">{t('title')}</h1>
        <p className="hint" style={{ marginTop: 8, maxWidth: 680 }}>{t('subtitle')}</p>
      </div>
      <TemplatesList />
    </div>
  );
}
