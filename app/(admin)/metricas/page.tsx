import { createClient } from '@/lib/supabase/server';
import {
  Users,
  Target,
  TrendingUp,
  AlertTriangle,
  Trophy,
  Activity,
} from 'lucide-react';
import type { Categoria } from '@/lib/types';

type PerfilRow = {
  id: string;
  user_id: string;
  rol: string;
  nombre: string | null;
  email: string | null;
  created_at: string;
};

type SesionAggr = {
  usuario_id: string;
  count: number;
};
type RespuestaAggr = {
  usuario_id: string;
  total: number;
  correctas: number;
};

type CatFallo = {
  categoria: Categoria;
  incorrectas: number;
  total: number;
};

const CAT_LABELS: Record<Categoria, string> = {
  phishing: 'Phishing',
  pretexting: 'Pretexting',
  baiting: 'Baiting',
  vishing: 'Vishing',
};

export default async function AdminMetricasPage() {
  const supabase = createClient();

  // ── 1. KPIs básicos ──
  const [{ count: usuariosCount }, { count: respuestasCount }, { count: sesionesCount }] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true }),
      supabase
        .from('respuestas')
        .select('id', { count: 'exact', head: true }),
      supabase
        .from('sesiones')
        .select('id', { count: 'exact', head: true })
        .not('finalizada_en', 'is', null),
    ]);

  // Precisión global (cuidado: no hay RPC avg, calculamos con 2 queries)
  const { count: correctasCount } = await supabase
    .from('respuestas')
    .select('id', { count: 'exact', head: true })
    .eq('es_correcta', true);

  const precisionGlobal =
    (respuestasCount ?? 0) > 0
      ? Math.round(
          ((correctasCount ?? 0) / (respuestasCount ?? 1)) * 1000
        ) / 10
      : 0;

  // ── 2. Categoría con más fallos ──
  const { data: respuestasCatRaw } = await supabase
    .from('respuestas')
    .select(
      `
      es_correcta,
      escenarios:escenario_id (categoria)
      `
    );

  type RJoin = {
    es_correcta: boolean;
    escenarios: { categoria: Categoria } | null;
  };

  const byCat = new Map<Categoria, { total: number; incorrectas: number }>();
  for (const r of (respuestasCatRaw as RJoin[] | null) ?? []) {
    const c = r.escenarios?.categoria;
    if (!c) continue;
    const prev = byCat.get(c) ?? { total: 0, incorrectas: 0 };
    prev.total += 1;
    if (!r.es_correcta) prev.incorrectas += 1;
    byCat.set(c, prev);
  }
  const categorias: CatFallo[] = Array.from(byCat.entries()).map(
    ([categoria, v]) => ({
      categoria,
      total: v.total,
      incorrectas: v.incorrectas,
    })
  );
  categorias.sort((a, b) => b.incorrectas - a.incorrectas);
  const catMasFallos = categorias[0] ?? null;

  // ── 3. Tabla usuarios con progreso ──
  const { data: perfiles } = await supabase
    .from('profiles')
    .select('id, user_id, rol, nombre, email, created_at')
    .order('created_at', { ascending: false });

  const { data: sesionesPorUsuarioRaw } = await supabase
    .from('sesiones')
    .select('usuario_id, finalizada_en');

  type SRow = { usuario_id: string; finalizada_en: string | null };
  const sesionesPorUsuario = new Map<string, number>();
  for (const s of (sesionesPorUsuarioRaw as SRow[] | null) ?? []) {
    if (s.finalizada_en === null) continue;
    sesionesPorUsuario.set(
      s.usuario_id,
      (sesionesPorUsuario.get(s.usuario_id) ?? 0) + 1
    );
  }

  const { data: respPorUsuarioRaw } = await supabase.from('respuestas').select(
    'usuario_id, es_correcta'
  );
  type RRow = { usuario_id: string; es_correcta: boolean };
  const respAggr = new Map<string, { total: number; correctas: number }>();
  for (const r of (respPorUsuarioRaw as RRow[] | null) ?? []) {
    const prev = respAggr.get(r.usuario_id) ?? { total: 0, correctas: 0 };
    prev.total += 1;
    if (r.es_correcta) prev.correctas += 1;
    respAggr.set(r.usuario_id, prev);
  }

  type FilaUsuario = {
    nombre: string;
    email: string | null;
    rol: string;
    sesiones: number;
    respuestas: number;
    precision: number;
    fechaRegistro: string;
  };
  const filas: FilaUsuario[] = ((perfiles as PerfilRow[] | null) ?? []).map(
    (p) => {
      const r = respAggr.get(p.user_id) ?? { total: 0, correctas: 0 };
      return {
        nombre: p.nombre ?? p.email ?? 'Usuario',
        email: p.email,
        rol: p.rol,
        sesiones: sesionesPorUsuario.get(p.user_id) ?? 0,
        respuestas: r.total,
        precision:
          r.total > 0 ? Math.round((r.correctas / r.total) * 1000) / 10 : 0,
        fechaRegistro: p.created_at,
      };
    }
  );
  // Ordenar por más sesiones completadas primero
  filas.sort((a, b) => b.sesiones - a.sesiones);

  return (
    <div className="space-y-7 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">Métricas globales</h1>
          <p className="section-subtitle">
            Estadísticas agregadas de todos los usuarios de la plataforma
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-surface-500 font-medium">Usuarios</p>
              <p className="text-3xl font-black text-surface-900 mt-1">
                {usuariosCount ?? 0}
              </p>
              <p className="text-xs text-surface-400 mt-1">
                Registrados en total
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-surface-500 font-medium">
                Respuestas totales
              </p>
              <p className="text-3xl font-black text-surface-900 mt-1">
                {respuestasCount ?? 0}
              </p>
              <p className="text-xs text-surface-400 mt-1">Escenarios resueltos</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-surface-500 font-medium">Precisión global</p>
              <p className="text-3xl font-black text-surface-900 mt-1">
                {precisionGlobal}%
              </p>
              <p className="text-xs text-surface-400 mt-1">Media de todos los usuarios</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-success-50 text-success-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-surface-500 font-medium">
                Sesiones completadas
              </p>
              <p className="text-3xl font-black text-surface-900 mt-1">
                {sesionesCount ?? 0}
              </p>
              <p className="text-xs text-surface-400 mt-1">Sesiones finalizadas</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-warning-50 text-warning-600 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Highlight: categoría con más fallos */}
      <div
        className={`card p-6 border-l-4 ${
          catMasFallos ? 'border-l-danger-500 bg-danger-50/40' : ''
        }`}
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-danger-100 text-danger-600 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-surface-400">
                Punto débil a reforzar
              </p>
              <h3 className="text-2xl font-black text-surface-900 mt-1">
                {catMasFallos
                  ? CAT_LABELS[catMasFallos.categoria]
                  : 'Aún no hay suficientes datos'}
              </h3>
              <p className="text-sm text-surface-500 mt-1 max-w-2xl">
                {catMasFallos
                  ? `${catMasFallos.incorrectas} respuestas incorrectas de ${catMasFallos.total} totales (${Math.round(
                      (catMasFallos.incorrectas / catMasFallos.total) * 100
                    )}% de fallo). Prioriza añadir más escenarios y explicaciones en esta categoría.`
                  : 'Completa al menos 10 respuestas entre todos los usuarios para ver análisis.'}
              </p>
            </div>
          </div>
          {catMasFallos && (
            <div className="text-right">
              <p className="text-4xl font-black text-danger-600">
                {Math.round(
                  (catMasFallos.incorrectas / catMasFallos.total) * 100
                )}
                <span className="text-lg align-super">%</span>
              </p>
              <p className="text-xs text-surface-400 mt-0.5">Tasa de fallo</p>
            </div>
          )}
        </div>
      </div>

      {/* Desglose categorías */}
      {categorias.length > 0 && (
        <div className="card p-6">
          <h2 className="font-bold text-surface-800 mb-4">
            Fallos por categoría
          </h2>
          <div className="space-y-3">
            {categorias.map((c) => {
              const pctFallo =
                c.total > 0 ? (c.incorrectas / c.total) * 100 : 0;
              return (
                <div key={c.categoria} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-surface-700">
                      {CAT_LABELS[c.categoria]}
                    </span>
                    <span className="text-surface-500 text-xs">
                      {c.incorrectas} fallos / {c.total} respuestas — fallo{' '}
                      {Math.round(pctFallo)}%
                    </span>
                  </div>
                  <div className="w-full bg-surface-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-warning-400 to-danger-500"
                      style={{ width: `${pctFallo}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabla usuarios */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-surface-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-surface-800">Progreso por usuario</h2>
            <p className="text-xs text-surface-400 mt-0.5">
              Ordenado por sesiones completadas
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-surface-400">
            <Trophy className="w-3.5 h-3.5 text-warning-500" />
            {filas.length} usuarios
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-50 text-surface-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left py-3 px-5 font-semibold">Usuario</th>
                <th className="text-right py-3 px-4 font-semibold">Rol</th>
                <th className="text-right py-3 px-4 font-semibold">
                  Sesiones
                </th>
                <th className="text-right py-3 px-4 font-semibold">
                  Respuestas
                </th>
                <th className="text-right py-3 px-5 font-semibold">
                  Precisión
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {filas.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-14 text-center text-surface-400"
                  >
                    No hay usuarios registrados aún.
                  </td>
                </tr>
              )}
              {filas.map((u, i) => {
                const precColor =
                  u.precision >= 70
                    ? 'text-success-600'
                    : u.precision >= 50
                    ? 'text-warning-600'
                    : 'text-danger-600';
                const precBg =
                  u.precision >= 70
                    ? 'bg-success-50'
                    : u.precision >= 50
                    ? 'bg-warning-50'
                    : 'bg-danger-50';
                return (
                  <tr
                    key={`${u.email}-${i}`}
                    className="hover:bg-surface-50 transition-colors"
                  >
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl ${precBg} flex items-center justify-center font-bold ${precColor}`}
                        >
                          {u.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-surface-800 truncate max-w-xs">
                            {u.nombre}
                          </p>
                          <p className="text-xs text-surface-400 truncate max-w-xs">
                            {u.email ?? 'Sin email'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {u.rol === 'admin' ? (
                        <span className="badge bg-brand-100 text-brand-700 font-semibold">
                          Admin
                        </span>
                      ) : (
                        <span className="badge bg-surface-100 text-surface-600 font-medium">
                          Usuario
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-surface-600 font-medium tabular-nums">
                      {u.sesiones}
                    </td>
                    <td className="py-3 px-4 text-right text-surface-600 font-medium tabular-nums">
                      {u.respuestas}
                    </td>
                    <td className="py-3 px-5 text-right">
                      <span
                        className={`inline-flex items-center justify-end min-w-[64px] font-bold tabular-nums ${precColor}`}
                      >
                        {u.respuestas > 0 ? `${u.precision.toFixed(0)}%` : '—'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
