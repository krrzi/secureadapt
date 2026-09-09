import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Navbar } from '@/components/layout/Navbar';
import type { Profile } from '@/lib/types';

export default async function AppLayout({
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

  let { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle<Profile>();

  // Fallback defensivo: si el trigger de Supabase no creó el profile,
  // lo insertamos aquí una vez para no romper la navegación.
  if (!profile) {
    const { data: inserted } = await supabase
      .from('profiles')
      .insert({
        user_id: user.id,
        rol: 'usuario',
        nombre: user.email,
        email: user.email,
      })
      .select()
      .single<Profile>();
    profile = inserted ?? null;
  }

  return (
    <>
      <Navbar profile={profile} />
      <main className="page-container py-8">{children}</main>
    </>
  );
}
