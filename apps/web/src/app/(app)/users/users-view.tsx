'use client';

import { useEffect, useRef, useState } from 'react';
import type { User } from '@/mocks/types';
import { createUser, deleteUser, getUsers, updateUser } from '@/lib/local-store';
import { useLocalStore } from '@/lib/use-local-store';

function useOzInput(defaultValue = ''): [string, (el: any) => void, (v: string) => void] {
  const [value, setValue] = useState(defaultValue);
  const ref = useRef<any>(null);
  const setRef = (el: any) => {
    if (ref.current === el) return;
    if (ref.current) ref.current.removeEventListener('ozInput', ref.current._ozHandler);
    ref.current = el;
    if (el) {
      const handler = (ev: CustomEvent<string>) => setValue(ev.detail);
      el._ozHandler = handler;
      el.addEventListener('ozInput', handler);
      el.value = value;
    }
  };
  const setExternal = (v: string) => { setValue(v); if (ref.current) ref.current.value = v; };
  return [value, setRef, setExternal];
}

export function UsersView() {
  const users = useLocalStore(() => getUsers());
  const [inviteOpen, setInviteOpen] = useState(false);
  const [menuFor, setMenuFor] = useState<string | null>(null);

  return (
    <div>
      <div className="page-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="oz-micro oz-muted">Administration</div>
          <h1 className="oz-h1">Utilisateurs</h1>
          <p className="hint" style={{ marginTop: 8 }}>{users.length} utilisateur{users.length > 1 ? 's' : ''}</p>
        </div>
        <oz-button variant="primary" onClick={() => setInviteOpen(true)}>
          <oz-icon slot="leading" name="plus" size={14} />Inviter un utilisateur
        </oz-button>
      </div>
      <oz-card padding="none">
        {users.map((u, i) => (
          <div key={u.id} style={{
            display: 'flex', alignItems: 'center', gap: 16,
            padding: '14px 20px',
            borderBottom: i < users.length - 1 ? '1px solid var(--oz-line-2)' : 'none',
            position: 'relative',
          }}>
            <oz-avatar name={u.name} size={36} tone={u.role === 'admin' ? 'ochre' : 'forest'} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{u.name}</div>
              <div style={{ fontSize: 11, color: 'var(--oz-ink-3)' }}>{u.email} · {u.org}</div>
            </div>
            <oz-tag tone={u.role === 'admin' ? 'ochre' : 'forest'} variant="soft">{u.role}</oz-tag>
            <div style={{ width: 120, textAlign: 'right', fontFamily: 'var(--oz-font-mono)', fontSize: 12, color: 'var(--oz-ink-3)' }}>{u.lastSeen}</div>
            <button
              type="button"
              aria-label="Actions"
              onClick={() => setMenuFor(v => v === u.id ? null : u.id)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: 6, color: 'var(--oz-ink-3)',
                display: 'flex', alignItems: 'center',
              }}
            >
              <oz-icon name="more" size={16} />
            </button>
            {menuFor === u.id && <UserActionMenu user={u} onClose={() => setMenuFor(null)} />}
          </div>
        ))}
      </oz-card>

      {inviteOpen && <InviteUserModal onClose={() => setInviteOpen(false)} />}
    </div>
  );
}

function UserActionMenu({ user, onClose }: { user: User; onClose: () => void }) {
  useEffect(() => {
    const close = () => onClose();
    const t = setTimeout(() => window.addEventListener('click', close, { once: true }), 0);
    return () => { clearTimeout(t); window.removeEventListener('click', close); };
  }, [onClose]);

  const toggleRole = () => {
    updateUser(user.id, { role: user.role === 'admin' ? 'partner' : 'admin' });
    onClose();
  };
  const onRemove = () => {
    if (confirm(`Supprimer ${user.name} ?`)) deleteUser(user.id);
    onClose();
  };

  return (
    <div
      onClick={e => e.stopPropagation()}
      style={{
        position: 'absolute', top: '100%', right: 16,
        marginTop: 4, minWidth: 200,
        background: 'var(--oz-white)', border: '1px solid var(--oz-line)',
        borderRadius: 'var(--oz-r-2)', boxShadow: 'var(--oz-sh-2)',
        zIndex: 10, padding: 4,
      }}
    >
      <MenuItem label={`Définir comme ${user.role === 'admin' ? 'partenaire' : 'admin'}`} onClick={toggleRole} />
      <MenuItem label="Supprimer" onClick={onRemove} danger />
    </div>
  );
}

function MenuItem({ label, onClick, danger }: { label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'block', width: '100%', textAlign: 'left',
        background: 'none', border: 'none', cursor: 'pointer',
        padding: '8px 10px', borderRadius: 'var(--oz-r-2)',
        fontSize: 13, fontFamily: 'inherit',
        color: danger ? 'var(--oz-danger)' : 'var(--oz-ink)',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = danger ? 'var(--oz-danger-soft)' : 'var(--oz-sand)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
    >{label}</button>
  );
}

function InviteUserModal({ onClose }: { onClose: () => void }) {
  const [name, nameRef] = useOzInput('');
  const [email, emailRef] = useOzInput('');
  const [org, orgRef] = useOzInput('Cabinet Helios');
  const [role, setRole] = useState<'partner' | 'admin'>('partner');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (name.trim().length < 2) { setError('Nom requis.'); return; }
    if (!email.includes('@')) { setError('Email invalide.'); return; }
    createUser({ name: name.trim(), email: email.trim().toLowerCase(), role, org: org.trim() || 'Cabinet Helios' });
    onClose();
  };

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(31,29,27,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 100,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--oz-white)', borderRadius: 'var(--oz-r-4)',
        maxWidth: 480, width: '100%', boxShadow: 'var(--oz-sh-3)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--oz-line)' }}>
          <div style={{ flex: 1, fontSize: 16, fontWeight: 500 }}>Inviter un utilisateur</div>
          <button type="button" onClick={onClose} aria-label="Fermer"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: 'var(--oz-ink-3)' }}>
            <oz-icon name="x" size={16} />
          </button>
        </div>
        <form onSubmit={onSubmit} className="stack" style={{ padding: 20 }} noValidate>
          <oz-input ref={nameRef} label="Nom complet" placeholder="Prénom Nom" />
          <oz-input ref={emailRef} label="Email" placeholder="prenom.nom@cabinet.fr" type="email" />
          <oz-input ref={orgRef} label="Organisation" placeholder="Cabinet Helios" />
          <div>
            <div className="oz-micro oz-muted" style={{ marginBottom: 6 }}>Rôle</div>
            <select value={role} onChange={e => setRole(e.target.value as any)}
              style={{ width: '100%', height: 38, padding: '0 12px', background: 'var(--oz-white)', border: '1px solid var(--oz-line)', borderRadius: 'var(--oz-r-2)', fontFamily: 'inherit', fontSize: 14 }}>
              <option value="partner">Partenaire</option>
              <option value="admin">Administrateur</option>
            </select>
          </div>
          {error && <div className="err">{error}</div>}
          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <oz-button type="button" variant="ghost" onClick={onClose}>Annuler</oz-button>
            <oz-button type="submit" variant="primary">
              <oz-icon slot="leading" name="check" size={14} />Inviter
            </oz-button>
          </div>
        </form>
      </div>
    </div>
  );
}
