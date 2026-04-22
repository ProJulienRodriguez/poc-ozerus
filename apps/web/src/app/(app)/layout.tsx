import { redirect } from 'next/navigation';
import { fetchMe, readToken } from '@/lib/auth';
import { AppShell } from './app-shell';

export default async function AuthedLayout({ children }: { children: React.ReactNode }) {
  const token = readToken();
  if (!token) redirect('/login');
  const user = await fetchMe(token);
  if (!user) redirect('/login');
  return <AppShell user={user}>{children}</AppShell>;
}
