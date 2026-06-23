import { redirect } from 'next/navigation';
import { fetchMe } from '@/lib/auth';
import { AppShell } from './app-shell';

export default async function AuthedLayout({ children }: { children: React.ReactNode }) {
  const user = await fetchMe();
  if (!user) redirect('/login');
  return <AppShell user={user}>{children}</AppShell>;
}
