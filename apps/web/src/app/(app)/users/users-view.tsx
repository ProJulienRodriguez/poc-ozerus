'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { User } from '@/mocks/types';
import { createUser, deleteUser, getUsers, updateUser } from '@/lib/local-store';
import { useLocalStore } from '@/lib/use-local-store';
import { useOzInput } from '@/lib/hooks/use-oz-input';

function UserRow({ user, isLast, menuOpen, onToggleMenu, onCloseMenu }: {
  user: User;
  isLast: boolean;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
}) {
  const t = useTranslations('users');
  const tone = user.role === 'admin' ? 'ochre' : 'forest';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16,
      padding: '14px 20px',
      borderBottom: isLast ? 'none' : '1px solid var(--oz-line-2)',
      position: 'relative',
    }}>
      <oz-avatar name={user.name} size={36} tone={tone} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500 }}>{user.name}</div>
        <div style={{ fontSize: 11, color: 'var(--oz-ink-3)' }}>{user.email} · {user.org}</div>
      </div>
      <oz-tag tone={tone} variant="soft">{user.role}</oz-tag>
      <div style={{ width: 120, textAlign: 'right', fontFamily: 'var(--oz-font-mono)', fontSize: 12, color: 'var(--oz-ink-3)' }}>{user.lastSeen}</div>
      <button
        type="button"
        aria-label={t('actions.label')}
        onClick={onToggleMenu}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          padding: 6, color: 'var(--oz-ink-3)',
          display: 'flex', alignItems: 'center',
        }}
      >
        <oz-icon name="more" size={16} />
      </button>
      {menuOpen && <UserActionMenu user={user} onClose={onCloseMenu} />}
    </div>
  );
}

export function UsersView() {
  const t = useTranslations('users');
  const users = useLocalStore(() => getUsers());
  const [inviteOpen, setInviteOpen] = useState(false);
  const [menuFor, setMenuFor] = useState<string | null>(null);

  return (
    <div>
      <div className="page-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="oz-micro oz-muted">{t('eyebrow')}</div>
          <h1 className="oz-h1">{t('title')}</h1>
          <p className="hint" style={{ marginTop: 8 }}>{t('count', { count: users.length })}</p>
        </div>
        <oz-button variant="primary" onClick={() => setInviteOpen(true)}>
          <oz-icon slot="leading" name="plus" size={14} />{t('invite')}
        </oz-button>
      </div>
      <oz-card padding="none">
        {users.map((u, i) => (
          <UserRow
            key={u.id}
            user={u}
            isLast={i === users.length - 1}
            menuOpen={menuFor === u.id}
            onToggleMenu={() => setMenuFor(v => v === u.id ? null : u.id)}
            onCloseMenu={() => setMenuFor(null)}
          />
        ))}
      </oz-card>

      {inviteOpen && <InviteUserModal onClose={() => setInviteOpen(false)} />}
    </div>
  );
}

function UserActionMenu({ user, onClose }: { user: User; onClose: () => void }) {
  const t = useTranslations('users');
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
    if (confirm(t('confirmDelete', { name: user.name }))) deleteUser(user.id);
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
      <MenuItem label={user.role === 'admin' ? t('actions.setAsPartner') : t('actions.setAsAdmin')} onClick={toggleRole} />
      <MenuItem label={t('actions.delete')} onClick={onRemove} danger />
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
  const t = useTranslations('users');
  const tc = useTranslations('common');
  const [name, nameRef] = useOzInput('');
  const [email, emailRef] = useOzInput('');
  const [org, orgRef] = useOzInput('Cabinet Helios');
  const [role, setRole] = useState<'partner' | 'admin'>('partner');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (name.trim().length < 2) { setError(t('form.errors.nameRequired')); return; }
    if (!email.includes('@')) { setError(t('form.errors.emailInvalid')); return; }
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
          <div style={{ flex: 1, fontSize: 16, fontWeight: 500 }}>{t('invite')}</div>
          <button type="button" onClick={onClose} aria-label={tc('close')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: 'var(--oz-ink-3)' }}>
            <oz-icon name="x" size={16} />
          </button>
        </div>
        <form onSubmit={onSubmit} className="stack" style={{ padding: 20 }} noValidate>
          <oz-input ref={nameRef} label={t('form.nameLabel')} placeholder={t('form.namePlaceholder')} />
          <oz-input ref={emailRef} label={t('form.emailLabel')} placeholder={t('form.emailPlaceholder')} type="email" />
          <oz-input ref={orgRef} label={t('form.orgLabel')} placeholder={t('form.orgPlaceholder')} />
          <div>
            <div className="oz-micro oz-muted" style={{ marginBottom: 6 }}>{t('form.roleLabel')}</div>
            <select value={role} onChange={e => setRole(e.target.value as any)}
              style={{ width: '100%', height: 38, padding: '0 12px', background: 'var(--oz-white)', border: '1px solid var(--oz-line)', borderRadius: 'var(--oz-r-2)', fontFamily: 'inherit', fontSize: 14 }}>
              <option value="partner">{t('roles.partner')}</option>
              <option value="admin">{t('roles.admin')}</option>
            </select>
          </div>
          {error && <div className="err">{error}</div>}
          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <oz-button type="button" variant="ghost" onClick={onClose}>{tc('cancel')}</oz-button>
            <oz-button type="submit" variant="primary">
              <oz-icon slot="leading" name="check" size={14} />{t('inviteSubmit')}
            </oz-button>
          </div>
        </form>
      </div>
    </div>
  );
}
