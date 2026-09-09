import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { User, Calendar, Target, Award } from 'lucide-react';
import Link from 'next/link';
import type { Categoria } from '@/lib/types';

type SesionRow = {
  id: string;
  iniciada_en: string;
  finalizada_en: string | null;
  total_escenarios: number;
  correctas: number;
};

type SesionVista = SesionRow & {
  precision_pct: number;
  duracion_segundos: number | null;
};

export default async function PerfilPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // ── 1. Perfil ──
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  // ── 2. Sesiones ──
  const { data: sesionesRaw } = await supabase
    .from('sesiones')
    .select('*')
    .eq('usuario_id', user.id)
    .order('iniciada_en', { ascending: false });

  const sesiones: SesionVista[] = ((sesionesRaw as SesionRow[] | null) ?? []).map(
    (s) => {
      const precision_pct =
        s.total_escenarios > 0
          ? Math.round((s.correctas / s.total_escenarios) * 1000) / 10
          : 0;
      let duracion_segundos: number | null = null;
      if (s.finalizada_en) {
        duracion_segundos = Math.round(
          (new Date(s.finalizada_en).getTime() -
            new Date(s.iniciada_en).getTime()) /
            1000
        );
      }
      return { ...s, precision_pct, duracion_segundos };
    }
  );

  // ── 3. Métricas por categoría ──
  const { data: respuestasJoin } = await supabase
    .from('respuestas')
    .select('es_correcta, tiempo_respuesta_ms, escenarios:escenario_id (categoria)')
    .eq('usuario_id', user.id);

  type RJoin = {
    es_correcta: boolean;
    tiempo_respuesta_ms: number;
    escenarios: { categoria: Categoria } | null;
  };

  const byCat = new Map<
    Categoria,
    { total: number; correctas: number }
  >();

  for (const r of (respuestasJoin as RJoin[] | null) ?? []) {
    const cat = r.escenarios?.categoria;
    if (!cat) continue;
    const prev = byCat.get(cat) ?? { total: 0, correctas: 0 };
    prev.total += 1;
    if (r.es_correcta) prev.correctas += 1;
    byCat.set(cat, prev);
  }

  const metricas = Array.from(byCat.entries()).map(([categoria, m]) => ({
    categoria,
    total: m.total,
    correctas: m.correctas,
    precision_pct:
      m.total > 0 ? Math.round((m.correctas / m.total) * 1000) / 10 : 0,
  }));

  const totalRespuestas = metricas.reduce((s, m) => s + m.total, 0);
  const totalCorrectas = metricas.reduce((s, m) => s + m.correctas, 0);
  const precisionGeneral =
    totalRespuestas > 0
      ? ((totalCorrectas / totalRespuestas) * 100).toFixed(1)
      : '0';

  const memberSince = new Date(
    profile?.created_at ?? (user as any).created_at ?? Date.now()
  );

  const catLabels: Record<Categoria, string> = {
    phishing: 'Phishing',
    pretexting: 'Pretexting',
    baiting: 'Baiting',
    vishing: 'Vishing',
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Profile header */}
      <div className="card p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-brand-100 rounded-2xl flex items-center justify-center flex-shrink-0">
            <User className="w-8 h-8 text-brand-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-surface-900 truncate">
                {profile?.nombre ?? 'Usuario'}
              </h1>
              {profile?.rol === 'admin' && (
                <span className="badge bg-brand-100 text-brand-700">Admin</span>
              )}
            </div>
            <p className="text-surface-500 text-sm mt-0.5 truncate">
              {user.email}
            </p>
            <div className="flex items-center gap-1.5 text-surface-400 text-xs mt-2">
              <Calendar className="w-3.5 h-3.5" />
              Miembro desde{' '}
              {memberSince.toLocaleDateString('es-MX', {
                month: 'long',
                year: 'numeric',
              })}
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-surface-100">
          <div className="text-center">
            <p className="text-2xl font-black text-brand-600">
              {sesiones.length}
            </p>
            <p className="text-xs text-surface-400 mt-0.5">Sesiones</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-brand-600">
              {precisionGeneral}%
            </p>
            <p className="text-xs text-surface-400 mt-0.5">Precisión</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-brand-600">
              {totalRespuestas}
            </p>
            <p className="text-xs text-surface-400 mt-0.5">Respuestas</p>
          </div>
        </div>
      </div>

      {/* Category performance */}
      {metricas.length > 0 && (
        <div className="card p-6">
          <h2 className="font-bold text-surface-800 mb-4">
            Rendimiento por categoría
          </h2>
          <div className="space-y-3">
            {metricas.map((m) => {
              const pct = m.precision_pct ?? 0;
              const color =
                pct >= 70
                  ? 'bg-success-500'
                  : pct >= 50
                  ? 'bg-warning-500'
                  : 'bg-danger-500';
              return (
                <div key={m.categoria} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-surface-700">
                      {catLabels[m.categoria]}
                    </span>
                    <span className="text-surface-500 text-xs">
                      {m.correctas}/{m.total} correctas — {Math.round(pct)}%
                    </span>
                  </div>
                  <div className="w-full bg-surface-100 rounded-full h-2">
                    <div
                      className={`${color} h-2 rounded-full transition-all duration-700`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Session history */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-surface-800">Historial de sesiones</h2>
          <Link href="/entrenamiento" className="btn-primary btn-sm">
            Nueva sesión
          </Link>
        </div>

        {sesiones.length === 0 ? (
          <div className="text-center py-8">
            <Award className="w-10 h-10 text-surface-200 mx-auto mb-2" />
            <p className="text-surface-400 text-sm">
              Aún no has completado ninguna sesión.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {sesiones.map((s, i) => {
              const pct = s.precision_pct ?? 0;
              const color =
                pct >= 70
                  ? 'text-success-600'
                  : pct >= 50
                  ? 'text-warning-600'
                  : 'text-danger-600';
              const bgColor =
                pct >= 70
                  ? 'bg-success-50'
                  : pct >= 50
                  ? 'bg-warning-50'
                  : 'bg-danger-50';
              const durMin = s.duracion_segundos
                ? Math.floor(s.duracion_segundos / 60)
                : null;
              const durSec = s.duracion_segundos
                ? s.duracion_segundos % 60
                : null;

              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-surface-100 hover:bg-surface-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 ${bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}
                    >
                      <Target className={`w-4 h-4 ${color}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-surface-700">
                        Sesión {sesiones.length - i}
                      </p>
                      <p className="text-xs text-surface-400">
                        {new Date(s.iniciada_en).toLocaleDateString('es-MX', {
                          weekday: 'short',
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {durMin !== null && (
                          <> · {durMin}m {durSec}s</>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-black ${color}`}>
                      {Math.round(pct)}%
                    </p>
                    <p className="text-xs text-surface-400">
                      {s.correctas}/{s.total_escenarios}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
