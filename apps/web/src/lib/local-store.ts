'use client';

import { REPORTS } from '@/mocks/reports';
import { USERS } from '@/mocks/users';
import { NOTIFICATIONS } from '@/mocks/notifications';
import type { Notification, Report, User } from '@/mocks/types';

const STORAGE_KEY = 'oz-local-store-v1';
const STORE_EVENT = 'oz:store-change';

interface StoreShape {
  reports: Report[];
  users: User[];
  notifications: Notification[];
}

function seed(): StoreShape {
  return {
    reports: structuredClone(REPORTS),
    users: structuredClone(USERS),
    notifications: structuredClone(NOTIFICATIONS),
  };
}

let forceSeed = false;
export function readSeeded<T>(fn: () => T): T {
  forceSeed = true;
  try { return fn(); } finally { forceSeed = false; }
}

function read(): StoreShape {
  if (forceSeed || typeof window === 'undefined') return seed();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const fresh = seed();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      return fresh;
    }
    return JSON.parse(raw) as StoreShape;
  } catch {
    return seed();
  }
}

function write(next: StoreShape) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(STORE_EVENT));
  } catch {}
}

export const storeEvent = STORE_EVENT;

export function getReports(): Report[] {
  return [...read().reports].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export function createReport(input: { title: string; kind: Report['kind']; client: string; period: string; author: string }): Report {
  const s = read();
  const now = new Date().toISOString().slice(0, 10);
  const nextId = `r-${1000 + s.reports.length + 1}-${Date.now().toString(36).slice(-4)}`;
  const report: Report = {
    id: nextId,
    title: input.title,
    kind: input.kind,
    client: input.client,
    period: input.period,
    createdAt: now,
    status: 'pending',
    sizeKb: 0,
    author: input.author,
  };
  s.reports.unshift(report);
  write(s);
  setTimeout(() => {
    const s2 = read();
    const t = s2.reports.find(r => r.id === nextId);
    if (t) {
      t.status = 'ready';
      t.sizeKb = Math.round(200 + Math.random() * 400);
      write(s2);
    }
  }, 2000);
  return report;
}
export function deleteReport(id: string) {
  const s = read();
  s.reports = s.reports.filter(r => r.id !== id);
  write(s);
}

export function getUsers(): User[] {
  return read().users;
}
export function createUser(input: { name: string; email: string; role: User['role']; org: string }): User {
  const s = read();
  const user: User = {
    id: `u-${Date.now().toString(36)}`,
    name: input.name,
    email: input.email,
    role: input.role,
    org: input.org,
    lastSeen: new Date().toISOString().slice(0, 10),
  };
  s.users = [user, ...s.users];
  write(s);
  return user;
}
export function updateUser(id: string, patch: Partial<User>) {
  const s = read();
  s.users = s.users.map(u => u.id === id ? { ...u, ...patch } : u);
  write(s);
}
export function deleteUser(id: string) {
  const s = read();
  s.users = s.users.filter(u => u.id !== id);
  write(s);
}

export function getNotifications(): Notification[] {
  return read().notifications;
}
export function getUnreadCount(): number {
  return read().notifications.filter(n => !n.read).length;
}
export function markNotificationRead(id: string) {
  const s = read();
  s.notifications = s.notifications.map(n => n.id === id ? { ...n, read: true } : n);
  write(s);
}
export function markAllNotificationsRead() {
  const s = read();
  s.notifications = s.notifications.map(n => ({ ...n, read: true }));
  write(s);
}

export function resetStore() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(STORE_EVENT));
}
