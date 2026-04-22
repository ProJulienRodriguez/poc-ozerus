import { fetchMe, readToken } from '@/lib/auth';
import { NewReportForm } from './new-report-form';

export default async function NewReportPage() {
  const token = readToken();
  const user = token ? await fetchMe(token) : null;
  const author = user?.name ?? 'Utilisateur';
  return (
    <div>
      <div className="page-head">
        <div className="oz-micro oz-muted">
          <a href="/reports" style={{ color: 'var(--oz-forest-700)', textDecoration: 'underline' }}>Reporting</a> / Nouveau
        </div>
        <h1 className="oz-h1">Créer un reporting</h1>
        <p className="hint" style={{ marginTop: 8, maxWidth: 640 }}>
          Choisissez le type, le client et la période. Le document sera généré en arrière-plan.
        </p>
      </div>
      <NewReportForm author={author} />
    </div>
  );
}
