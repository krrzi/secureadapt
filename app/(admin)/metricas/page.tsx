import { createClient } from '@/lib/supabase/server';
import {
  Users,
  Target,
  TrendingUp,
  AlertTriangle,
  Award,
  BookOpen,
  Activity,
  Layers,
  BrainCircuit,
  ShieldAlert,
} from 'lucide-react';
import type { Categoria, VectorPsicologico } from '@/lib/types';
import {
  getCategoryMeta,
  getVectorMeta,
  CATEGORIAS,
  VECTORES_PSICOLOGICOS,
} from '@/lib/adaptive-engine';

type PerfilRow = {
  id: string;
  user_id: string;
  rol: string;
  nombre: string | null;
  email: string | null;
  created_at: string;
};

export default async function AdminMetricasPage() {
  const supabase = createClient();

  // ── 1. KPIs Globales ────────────────────────────────────────
  const [
    { count: usuariosCount },
    { count: respuestasCount },
    { count: sesionesCount },
    { count: correctasCount },
    { count: escenariosCount },
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('respuestas').select('id', { count: 'exact', head: true }),
    supabase.from('sesiones').select('id', { count: 'exact', head: true }).not('finalizada_en', 'is', null),
    supabase.from('respuestas').select('id', { count: 'exact', head: true }).eq('es_correcta', true),
    supabase.from('escenarios').select('id', { count: 'exact', head: true }),
  ]);

  const precisionGlobal =
    (respuestasCount ?? 0) > 0
      ? Math.round(((correctasCount ?? 0) / (respuestasCount ?? 1)) * 1000) / 10
      : 0;

  // ── 2. Respuestas Globales con JOIN a Escenarios ────────────
  const { data: respuestasRaw } = await supabase.from('respuestas').select(`
    es_correcta,
    usuario_id,
    tiempo_respuesta_ms,
    escenarios:escenario_id (
      categoria,
      vector_psicologico,
      fuente
    )
  `);

  type RJoin = {
    es_correcta: boolean;
    usuario_id: string;
    tiempo_respuesta_ms: number;
    escenarios: {
      categoria: Categoria;
      vector_psicologico: VectorPsicologico;
      fuente: string | null;
    } | null;
  };

  const respuestas = (respuestasRaw as RJoin[] | null) ?? [];

  // Fallos por Categoría
  const catStats = new Map<Categoria, { total: number; incorrectas: number }>();
  // Fallos por Vector Psicológico
  const vecStats = new Map<VectorPsicologico, { total: number; incorrectas: number }>();
  // Respuestas por usuario
  const userStats = new Map<string, { total: number; correctas: number }>();

  for (const r of respuestas) {
    // Usuario
    const prevU = userStats.get(r.usuario_id) ?? { total: 0, correctas: 0 };
    prevU.total += 1;
    if (r.es_correcta) prevU.correctas += 1;
    userStats.set(r.usuario_id, prevU);

    if (!r.escenarios) continue;
    const { categoria, vector_psicologico } = r.escenarios;

    // Categoría
    const prevC = catStats.get(categoria) ?? { total: 0, incorrectas: 0 };
    prevC.total += 1;
    if (!r.es_correcta) prevC.incorrectas += 1;
    catStats.set(categoria, prevC);

    // Vector
    const prevV = vecStats.get(vector_psicologico) ?? { total: 0, incorrectas: 0 };
    prevV.total += 1;
    if (!r.es_correcta) prevV.incorrectas += 1;
    vecStats.set(vector_psicologico, prevV);
  }

  // Ordenar categorías por mayor tasa de fallo
  const categoriasRank = CATEGORIAS.map((c) => {
    const s = catStats.get(c) ?? { total: 0, incorrectas: 0 };
    const pct = s.total > 0 ? Math.round((s.incorrectas / s.total) * 1000) / 10 : 0;
    return { categoria: c, ...s, pct_fallo: pct };
  }).sort((a, b) => b.pct_fallo - a.pct_fallo);

  // Ordenar vectores por mayor tasa de fallo
  const vectoresRank = VECTORES_PSICOLOGICOS.map((v) => {
    const s = vecStats.get(v) ?? { total: 0, incorrectas: 0 };
    const pct = s.total > 0 ? Math.round((s.incorrectas / s.total) * 1000) / 10 : 0;
    return { vector: v, ...s, pct_fallo: pct };
  }).sort((a, b) => b.pct_fallo - a.pct_fallo);

  const topPeorCategoria = categoriasRank[0];
  const topPeorVector = vectoresRank[0];

  // ── 3. Trazabilidad Académica: Conteo de Escenarios por Fuente ──
  const { data: todosEscenarios } = await supabase
    .from('escenarios')
    .select('fuente, es_ataque');

  const fuenteCountMap = new Map<string, number>();
  for (const e of todosEscenarios ?? []) {
    if (e.es_ataque && e.fuente) {
      // Normalizar nombre de entidad principal (primer token antes de coma o paréntesis)
      const entidad = e.fuente.split(',')[0].split('(')[0].trim();
      fuenteCountMap.set(entidad, (fuenteCountMap.get(entidad) ?? 0) + 1);
    }
  }

  const fuentesTrazabilidad = Array.from(fuenteCountMap.entries())
    .map(([entidad, count]) => ({ entidad, count }))
    .sort((a, b) => b.count - a.count);

  // ── 4. Lista de Participantes y Progreso ────────────────────
  const { data: profilesRaw } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  const profiles = (profilesRaw as PerfilRow[] | null) ?? [];

  // Sesiones por usuario
  const { data: sesionesUserRaw } = await supabase.from('sesiones').select('usuario_id');
  const userSesionCount = new Map<string, number>();
  for (const s of sesionesUserRaw ?? []) {
    userSesionCount.set(s.usuario_id, (userSesionCount.get(s.usuario_id) ?? 0) + 1);
  }

  const userProgressList = profiles.map((p) => {
    const st = userStats.get(p.user_id) ?? { total: 0, correctas: 0 };
    const precision = st.total > 0 ? Math.round((st.correctas / st.total) * 1000) / 10 : 0;
    return {
      id: p.id,
      nombre: p.nombre ?? 'Sin nombre',
      email: p.email ?? p.user_id.slice(0, 8),
      rol: p.rol,
      sesiones: userSesionCount.get(p.user_id) ?? 0,
      respuestas: st.total,
      precision,
      fecha: new Date(p.created_at).toLocaleDateString('es-PE'),
    };
  });

  return (
    <div className="space-y-8 pb-16 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="badge bg-brand-50 text-brand-700 border border-brand-200 font-bold">
            Módulo de Administración Experimental
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-surface-900 tracking-tight mt-1">
          Métricas Globales de Investigación
        </h1>
        <p className="text-xs sm:text-sm text-surface-500 mt-1">
          Visualización agregada de resultados de sujetos de prueba, puntos de quiebre cognitivo y trazabilidad documental.
        </p>
      </div>

      {/* KPI Cards Globales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 border-surface-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-surface-500 uppercase tracking-wider">
                Participantes Totales
              </p>
              <p className="text-3xl font-black text-surface-900 mt-1">
                {usuariosCount ?? 0}
              </p>
              <p className="text-xs text-surface-400 mt-1">Sujetos de prueba</p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="card p-5 border-surface-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-surface-500 uppercase tracking-wider">
                Sesiones Completadas
              </p>
              <p className="text-3xl font-black text-surface-900 mt-1">
                {sesionesCount ?? 0}
              </p>
              <p className="text-xs text-surface-400 mt-1">Experimentos finalizados</p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Activity className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="card p-5 border-surface-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-surface-500 uppercase tracking-wider">
                Precisión Colectiva
              </p>
              <p className="text-3xl font-black text-surface-900 mt-1">
                {precisionGlobal}%
              </p>
              <p className="text-xs text-surface-400 mt-1">
                {correctasCount ?? 0} de {respuestasCount ?? 0} evaluaciones
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Target className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="card p-5 border-surface-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-surface-500 uppercase tracking-wider">
                Banco Experimental
              </p>
              <p className="text-3xl font-black text-surface-900 mt-1">
                {escenariosCount ?? 0}
              </p>
              <p className="text-xs text-surface-400 mt-1">Casos reales documentados</p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Puntos Críticos Globales (Categoría y Vector con más fallos) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Peor Categoría */}
        <div className="card p-6 border-surface-200 border-l-4 border-l-rose-500">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">
                Canal con Mayor Tasa de Fallo Global
              </span>
              <h3 className="text-xl font-black text-surface-900">
                {topPeorCategoria
                  ? getCategoryMeta(topPeorCategoria.categoria).label
                  : 'N/A'}{' '}
                — {topPeorCategoria?.pct_fallo ?? 0}% de error
              </h3>
              <p className="text-xs text-surface-600 leading-relaxed">
                {topPeorCategoria?.incorrectas ?? 0} respuestas incorrectas de{' '}
                {topPeorCategoria?.total ?? 0} intentos globales en este canal.
              </p>
            </div>
          </div>
        </div>

        {/* Peor Vector */}
        <div className="card p-6 border-surface-200 border-l-4 border-l-indigo-500">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                Gatillador Psicológico más Vulnerable
              </span>
              <h3 className="text-xl font-black text-surface-900">
                Vector{' '}
                {topPeorVector ? getVectorMeta(topPeorVector.vector).label : 'N/A'}{' '}
                — {topPeorVector?.pct_fallo ?? 0}% de error
              </h3>
              <p className="text-xs text-surface-600 leading-relaxed">
                {topPeorVector?.incorrectas ?? 0} respuestas incorrectas de{' '}
                {topPeorVector?.total ?? 0} intentos globales con este sesgo.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Desglose de Fallos por Categoría y Vector */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ranking Canales */}
        <div className="card p-6 border-surface-200 space-y-4">
          <h3 className="font-bold text-sm text-surface-900">
            Tasa de Error por Canal de Ataque
          </h3>
          <div className="space-y-3">
            {categoriasRank.map((c) => {
              const meta = getCategoryMeta(c.categoria);
              return (
                <div key={c.categoria} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-surface-700">{meta.label}</span>
                    <span className="font-semibold text-surface-500">
                      {c.incorrectas} fallos / {c.total} eval. ({c.pct_fallo}% error)
                    </span>
                  </div>
                  <div className="w-full bg-surface-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-rose-500 transition-all duration-500"
                      style={{ width: `${c.pct_fallo}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ranking Vectores */}
        <div className="card p-6 border-surface-200 space-y-4">
          <h3 className="font-bold text-sm text-surface-900">
            Tasa de Error por Vector Psicológico
          </h3>
          <div className="space-y-3">
            {vectoresRank.map((v) => {
              const meta = getVectorMeta(v.vector);
              return (
                <div key={v.vector} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-surface-700">{meta.label}</span>
                    <span className="font-semibold text-surface-500">
                      {v.incorrectas} fallos / {v.total} eval. ({v.pct_fallo}% error)
                    </span>
                  </div>
                  <div className="w-full bg-surface-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-indigo-500 transition-all duration-500"
                      style={{ width: `${v.pct_fallo}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Trazabilidad Académica: Escenarios por Fuente */}
      <div className="card p-6 sm:p-8 border-surface-200 space-y-4">
        <div>
          <h2 className="text-lg font-black text-surface-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-brand-600" />
            Trazabilidad Documental del Banco Experimental
          </h2>
          <p className="text-xs text-surface-500 mt-0.5">
            Distribución de escenarios de ataque según la fuente oficial verificada (para sustentación ante comités de evaluación).
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {fuentesTrazabilidad.map((f) => (
            <div
              key={f.entidad}
              className="p-4 rounded-xl border border-surface-200 bg-surface-50/70 flex items-center justify-between"
            >
              <span className="text-xs font-bold text-surface-800 line-clamp-1 mr-2">
                {f.entidad}
              </span>
              <span className="badge bg-brand-100 text-brand-800 text-xs font-bold">
                {f.count} casos
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabla de Participantes Experimentales */}
      <div className="card overflow-hidden border-surface-200 space-y-4 p-6">
        <h2 className="text-lg font-black text-surface-900 tracking-tight">
          Participantes y Progreso Experimental
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-surface-50 border-b border-surface-200 text-surface-600 text-[11px] font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3">Participante</th>
                <th className="p-3">Rol</th>
                <th className="p-3">Sesiones</th>
                <th className="p-3">Respuestas</th>
                <th className="p-3">Eficacia</th>
                <th className="p-3">Registro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200">
              {userProgressList.map((u) => (
                <tr key={u.id} className="hover:bg-surface-50 transition-colors">
                  <td className="p-3 font-semibold text-surface-800">
                    <div>
                      <p className="font-bold text-surface-900">{u.nombre}</p>
                      <p className="text-xs text-surface-400 font-mono">{u.email}</p>
                    </div>
                  </td>
                  <td className="p-3">
                    <span
                      className={`badge text-[10px] font-bold ${
                        u.rol === 'admin'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-surface-100 text-surface-700'
                      }`}
                    >
                      {u.rol}
                    </span>
                  </td>
                  <td className="p-3 font-bold text-surface-700">{u.sesiones}</td>
                  <td className="p-3 font-bold text-surface-700">{u.respuestas}</td>
                  <td className="p-3">
                    <span
                      className={`font-black ${
                        u.precision >= 70
                          ? 'text-emerald-600'
                          : u.precision >= 50
                          ? 'text-amber-600'
                          : 'text-rose-600'
                      }`}
                    >
                      {u.precision}%
                    </span>
                  </td>
                  <td className="p-3 text-surface-500 text-xs">{u.fecha}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
