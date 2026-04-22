import { LoginForm } from './login-form';

export default function LoginPage() {
  return (
    <main className="auth-bg">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px 40px',
            background: 'var(--oz-forest)',
            borderRadius: 'var(--oz-r-2)',
            boxShadow: 'var(--oz-sh-2)',
            marginBottom: 16,
          }}>
            <img src="/logo.avif" alt="Ozerus" style={{ height: 48, width: 'auto' }} />
          </div>
          <div className="oz-micro oz-muted">Extranet partenaire</div>
        </div>
        <LoginForm />
        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 11, color: 'var(--oz-ink-4)' }}>
          Démo POC · Code MFA&nbsp;: <span className="oz-mono">123456</span>
        </div>
      </div>
    </main>
  );
}
