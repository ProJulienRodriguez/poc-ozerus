'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { AuthUser } from '@/lib/auth';
import { logoutAction } from '@/app/actions/auth';
import { PRODUCTS } from '@/mocks/products';
import { PORTFOLIO } from '@/mocks/portfolio';
import { getNotifications, getReports, getUnreadCount, getUsers, markAllNotificationsRead, markNotificationRead } from '@/lib/local-store';
import { useLocalStore } from '@/lib/use-local-store';
import type { Notification } from '@/mocks/types';
import { downloadCsv } from '@/lib/csv-export';

interface NavItem { id: string; icon: string; label: string; href: string; admin?: boolean; }

const NAV: NavItem[] = [
  { id: 'dashboard', icon: 'dashboard', label: 'Tableau de bord', href: '/dashboard' },
  { id: 'products', icon: 'products', label: 'Offre produits', href: '/products' },
  { id: 'portfolio', icon: 'portfolio', label: 'Portefeuilles', href: '/portfolio' },
  { id: 'reports', icon: 'reporting', label: 'Reporting', href: '/reports' },
  { id: 'users', icon: 'users', label: 'Utilisateurs', href: '/users', admin: false },
];

const HEADINGS: Record<string, string> = {
  dashboard: 'Tableau de bord',
  products: 'Offre produits',
  portfolio: 'Portefeuilles',
  reports: 'Reporting',
  users: 'Utilisateurs',
};

interface SearchHit { label: string; hint: string; href: string; kind: 'Produit' | 'Client' | 'Reporting' | 'Utilisateur' }

function buildHits(q: string, reports: ReturnType<typeof getReports>, users: ReturnType<typeof getUsers>): SearchHit[] {
  const n = q.trim().toLowerCase();
  if (!n) return [];
  const hits: SearchHit[] = [];
  for (const p of PRODUCTS) {
    if (p.isin.toLowerCase().includes(n) || p.name.toLowerCase().includes(n) || p.under.toLowerCase().includes(n)) {
      hits.push({ label: p.name, hint: `${p.isin} · ${p.under}`, href: `/products/${p.isin}`, kind: 'Produit' });
    }
  }
  for (const c of PORTFOLIO.positions) {
    if (c.client.toLowerCase().includes(n)) {
      hits.push({ label: c.client, hint: `${c.products} produit${c.products > 1 ? 's' : ''}`, href: '/portfolio', kind: 'Client' });
    }
  }
  for (const r of reports) {
    if (r.title.toLowerCase().includes(n) || r.client.toLowerCase().includes(n)) {
      hits.push({ label: r.title, hint: `${r.client} · ${r.period}`, href: '/reports', kind: 'Reporting' });
    }
  }
  for (const u of users) {
    if (u.name.toLowerCase().includes(n) || u.email.toLowerCase().includes(n)) {
      hits.push({ label: u.name, hint: `${u.email} · ${u.role}`, href: '/users', kind: 'Utilisateur' });
    }
  }
  return hits.slice(0, 8);
}

export function AppShell({ user, children }: { user: AuthUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [navOpen, setNavOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const searchRef = useRef<any>(null);
  const searchBoxRef = useRef<HTMLDivElement | null>(null);
  const bellBoxRef = useRef<HTMLDivElement | null>(null);

  const reports = useLocalStore(() => getReports());
  const users = useLocalStore(() => getUsers());
  const notifications = useLocalStore(() => getNotifications());
  const unreadCount = useLocalStore(() => getUnreadCount());

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem('oz-nav-collapsed') : null;
    if (saved === '1') setCollapsed(true);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed(v => {
      const next = !v;
      try { window.localStorage.setItem('oz-nav-collapsed', next ? '1' : '0'); } catch {}
      return next;
    });
  };

  const activeId = useMemo(() => {
    const seg = (pathname.split('/')[1] ?? 'dashboard');
    return NAV.find(n => n.id === seg)?.id ?? 'dashboard';
  }, [pathname]);

  const heading = HEADINGS[activeId] ?? 'Ozerus';

  useEffect(() => { setNavOpen(false); }, [pathname]);

  const go = (href: string) => { router.push(href); setNavOpen(false); };

  const hits = useMemo(() => buildHits(searchQ, reports, users), [searchQ, reports, users]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!searchBoxRef.current?.contains(e.target as Node)) setSearchOpen(false);
      if (!bellBoxRef.current?.contains(e.target as Node)) setNotifOpen(false);
    };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, []);

  const onExportCurrent = () => {
    const date = new Date().toISOString().slice(0, 10);
    if (activeId === 'products') {
      downloadCsv(PRODUCTS.map(p => ({ ISIN: p.isin, Nom: p.name, Emetteur: p.issuer, Coupon: p.coupon, Protection: p.prot, Maturite: p.matur, Valorisation: p.val })), `produits-${date}.csv`);
    } else if (activeId === 'portfolio') {
      downloadCsv(PORTFOLIO.positions.map(p => ({ Client: p.client, Encours_EUR: p.aum, Produits: p.products })), `portefeuilles-${date}.csv`);
    } else if (activeId === 'reports') {
      downloadCsv(reports.map(r => ({ Titre: r.title, Type: r.kind, Client: r.client, Periode: r.period, Date: r.createdAt, Auteur: r.author, Statut: r.status })), `reports-${date}.csv`);
    } else if (activeId === 'users') {
      downloadCsv(users.map(u => ({ Nom: u.name, Email: u.email, Role: u.role, Organisation: u.org, Derniere_Connexion: u.lastSeen })), `utilisateurs-${date}.csv`);
    } else {
      downloadCsv(PRODUCTS.slice(0, 5).map(p => ({ ISIN: p.isin, Nom: p.name, Valorisation: p.val, Variation: p.delta })), `dashboard-${date}.csv`);
    }
  };

  const pickHit = (h: SearchHit) => {
    setSearchOpen(false);
    setSearchQ('');
    if (searchRef.current) searchRef.current.value = '';
    router.push(h.href);
  };

  return (
    <div className={`shell${collapsed ? ' shell--collapsed' : ''}`}>
      <div
        className="app-aside-overlay"
        data-open={navOpen ? 'true' : 'false'}
        onClick={() => setNavOpen(false)}
        aria-hidden="true"
      />
      <aside className="app-aside" data-open={navOpen ? 'true' : 'false'}>
        <button
          type="button"
          className="app-aside-toggle"
          onClick={toggleCollapsed}
          title={collapsed ? 'Déplier le menu' : 'Replier le menu'}
          aria-label={collapsed ? 'Déplier le menu' : 'Replier le menu'}
          aria-expanded={!collapsed}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {collapsed ? <path d="M9 6l6 6-6 6" /> : <path d="M15 6l-6 6 6 6" />}
          </svg>
        </button>

        <div className="app-aside-brand">
          <div className="app-aside-logo">
            <img src="/logo.avif" alt="Ozerus" />
          </div>
          <oz-tag tone="forest" variant="soft">extranet</oz-tag>
        </div>

        <div>
          <div className="oz-micro app-nav-section" style={{ color: 'var(--oz-ink-4)', padding: '4px 10px 8px' }}>Espace partenaire</div>
          <div className="app-nav">
            {NAV.filter(n => !n.admin || user.role === 'admin').map(n => (
              <a
                key={n.id}
                href={n.href}
                title={n.label}
                onClick={(e) => { e.preventDefault(); go(n.href); }}
                className={`app-nav-item${n.id === activeId ? ' app-nav-item--active' : ''}`}
              >
                <oz-icon name={n.icon} size={15} />
                <span className="app-nav-label">{n.label}</span>
              </a>
            ))}
          </div>
        </div>

        <form action={logoutAction} className="app-user-card">
          <oz-avatar name={user.name} size={32} tone="navy" />
          <div className="app-user-info">
            <div className="app-user-name">{user.name}</div>
            <div className="app-user-org">{user.org}</div>
          </div>
          <button type="submit" title="Se déconnecter" aria-label="Se déconnecter" className="app-user-logout">
            <oz-icon name="logout" size={16} />
          </button>
        </form>
      </aside>

      <div className="shell-main">
        <div className="app-header">
          <button
            type="button"
            className="app-header-menu-btn"
            aria-label="Ouvrir le menu"
            aria-expanded={navOpen}
            onClick={() => setNavOpen(v => !v)}
          >
            {navOpen
              ? <oz-icon name="x" size={18} />
              : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              )}
          </button>
          <div className="app-header-title">{heading}</div>

          <div className="app-header-search" style={{ position: 'relative' }} ref={searchBoxRef}>
            <oz-input
              size="sm"
              placeholder="Rechercher un ISIN, produit, client…"
              ref={(el: any) => {
                searchRef.current = el;
                if (el && !el._wired) {
                  el._wired = true;
                  el.addEventListener('ozInput', (ev: CustomEvent<string>) => {
                    setSearchQ(ev.detail);
                    setSearchOpen(Boolean(ev.detail.trim()));
                  });
                  el.addEventListener('focus', () => { if (searchQ.trim()) setSearchOpen(true); });
                }
              }}
            >
              <oz-icon slot="leading" name="search" size={14} />
            </oz-input>
            {searchOpen && hits.length > 0 && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
                background: 'var(--oz-white)', border: '1px solid var(--oz-line)',
                borderRadius: 'var(--oz-r-2)', boxShadow: 'var(--oz-sh-2)',
                zIndex: 20, padding: 4, maxHeight: 380, overflowY: 'auto',
              }}>
                {hits.map(h => (
                  <button
                    key={`${h.kind}-${h.label}-${h.href}`}
                    type="button"
                    onClick={() => pickHit(h)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      width: '100%', textAlign: 'left',
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: '8px 10px', borderRadius: 'var(--oz-r-2)',
                      fontFamily: 'inherit',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--oz-sand)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--oz-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--oz-ink-3)' }}>{h.hint}</div>
                    </div>
                    <oz-tag tone="neutral" variant="soft">{h.kind}</oz-tag>
                  </button>
                ))}
              </div>
            )}
            {searchOpen && hits.length === 0 && searchQ.trim() && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
                background: 'var(--oz-white)', border: '1px solid var(--oz-line)',
                borderRadius: 'var(--oz-r-2)', padding: '12px 14px', fontSize: 12,
                color: 'var(--oz-ink-3)', zIndex: 20,
              }}>Aucun résultat pour « {searchQ} ».</div>
            )}
          </div>

          <div className="app-header-spacer" />

          <div style={{ position: 'relative' }} ref={bellBoxRef}>
            <oz-button variant="ghost" size="sm" onClick={() => setNotifOpen(v => !v)}>
              <oz-icon slot="leading" name="bell" size={15} />
              {unreadCount > 0 && <span className="oz-mono" style={{ fontSize: 11 }}>{unreadCount}</span>}
            </oz-button>
            {notifOpen && (
              <NotificationsPanel
                notifications={notifications}
                unreadCount={unreadCount}
                onRead={(id) => markNotificationRead(id)}
                onReadAll={() => markAllNotificationsRead()}
              />
            )}
          </div>

          <span className="app-header-action--desktop">
            <oz-button variant="outline" size="sm" onClick={onExportCurrent}>
              <oz-icon slot="leading" name="download" size={14} />Exporter
            </oz-button>
          </span>
          <oz-button variant="primary" size="sm" onClick={() => router.push('/reports/new')}>
            <oz-icon slot="leading" name="plus" size={14} />
            <span className="app-header-action-label">Nouveau reporting</span>
          </oz-button>
        </div>

        <div className="shell-body">{children}</div>
      </div>
    </div>
  );
}

function NotificationsPanel({
  notifications, unreadCount, onRead, onReadAll,
}: {
  notifications: Notification[];
  unreadCount: number;
  onRead: (id: string) => void;
  onReadAll: () => void;
}) {
  return (
    <div style={{
      position: 'absolute', top: 'calc(100% + 6px)', right: 0,
      width: 360, maxWidth: 'calc(100vw - 32px)',
      background: 'var(--oz-white)', border: '1px solid var(--oz-line)',
      borderRadius: 'var(--oz-r-2)', boxShadow: 'var(--oz-sh-2)',
      zIndex: 20, overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid var(--oz-line)' }}>
        <div style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>Notifications {unreadCount > 0 ? `(${unreadCount})` : ''}</div>
        {unreadCount > 0 && (
          <button type="button" onClick={onReadAll} className="link-btn" style={{ fontSize: 12 }}>Tout marquer lu</button>
        )}
      </div>
      <div style={{ maxHeight: 420, overflowY: 'auto' }}>
        {notifications.length === 0 && <div style={{ padding: 16, fontSize: 12, color: 'var(--oz-ink-3)' }}>Aucune notification.</div>}
        {notifications.map(n => (
          <button
            key={n.id}
            type="button"
            onClick={() => !n.read && onRead(n.id)}
            style={{
              display: 'flex', gap: 10,
              width: '100%', textAlign: 'left',
              background: n.read ? 'transparent' : 'var(--oz-forest-50)',
              border: 'none', cursor: n.read ? 'default' : 'pointer',
              padding: '10px 14px',
              borderBottom: '1px solid var(--oz-line-2)',
              fontFamily: 'inherit',
            }}
          >
            <div style={{
              width: 8, height: 8, marginTop: 6, borderRadius: '50%',
              background: n.read ? 'transparent' : 'var(--oz-forest)',
              flexShrink: 0,
            }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--oz-ink)' }}>{n.title}</div>
              <div style={{ fontSize: 12, color: 'var(--oz-ink-2)', marginTop: 2 }}>{n.body}</div>
              <div className="oz-mono" style={{ fontSize: 11, color: 'var(--oz-ink-4)', marginTop: 4 }}>{n.date}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
