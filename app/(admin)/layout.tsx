import { redirect } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Navbar } from '@/components/layout/Navbar';
import type { Profile } from '@/lib/types';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle<Profile>();

  if (!profile || profile.rol !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <>
      <Navbar profile={profile} />

      {/* Admin Banner */}
      <div className="bg-brand-600 text-white text-sm">
        <div className="page-container flex items-center gap-2 py-2">
          <ShieldCheck className="w-4 h-4 flex-shrink-0" />
          <span className="font-medium">Panel de Administración</span>
          <span className="text-brand-200 hidden sm:inline">
            — Acceso restringido a administradores
          </span>
        </div>
      </div>

      <main className="page-container py-8">{children}</main>
    </>
  );
}
