import { getTranslations } from 'next-intl/server';
import { SecurityView } from './security-view';

export default async function SecurityPage() {
  const t = await getTranslations('security');
  return (
    <div>
      <div className="page-head">
        <h1 className="oz-h1">{t('title')}</h1>
        <p className="hint" style={{ marginTop: 8, maxWidth: 640 }}>{t('pageSubtitle')}</p>
      </div>
      <SecurityView />
    </div>
  );
}
