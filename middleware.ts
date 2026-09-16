import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: any[]) {
          cookiesToSet.forEach(({ name, value }: any) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }: any) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // ── Rutas Públicas (acceso libre sin autenticación) ──────────
  const publicRoutes = ['/', '/login', '/registro', '/metodologia'];
  if (publicRoutes.includes(pathname)) {
    // Si el usuario ya está autenticado y visita login/registro, enviar al dashboard
    if (user && (pathname === '/login' || pathname === '/registro')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return supabaseResponse;
  }

  // ── Rutas Protegidas: Requieren sesión iniciada ─────────────
  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Rutas de Administración: Requieren rol 'admin' ──────────
  // Rutas planas: /escenarios y /metricas (sin prefijo de route group /admin en la URL)
  const adminRoutes = ['/escenarios', '/metricas'];
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));

  if (isAdminRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('rol')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!profile || profile.rol !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
