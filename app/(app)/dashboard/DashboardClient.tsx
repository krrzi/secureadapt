'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import {
  Target,
  Clock,
  AlertTriangle,
  Flame,
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  Swords,
  BookOpen,
  ExternalLink,
  BrainCircuit,
  Sparkles,
  Award,
} from 'lucide-react';
import Link from 'next/link';
import type {
  MetricasCategoria,
  MetricasVector,
  PerfilRiesgoCruzado,
  CasoSuperado,
} from '@/lib/types';
import {
  getCategoryMeta,
  getVectorMeta,
} from '@/lib/adaptive-engine';

interface DashboardClientProps {
  nombre: string;
  metricasCategoria: MetricasCategoria[];
  metricasVector: MetricasVector[];
  perfilCruzado: PerfilRiesgoCruzado[];
  sesiones: any[];
  falsosPositivos: number;
  falsosNegativos: number;
  casosSuperados: CasoSuperado[];
  racha: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  phishing: '#ef4444',
  vishing: '#a855f7',
  smishing: '#3b82f6',
  pretexting: '#f59e0b',
  baiting: '#10b981',
};

const VECTOR_COLORS: Record<string, string> = {
  urgencia: '#e11d48',
  autoridad: '#4f46e5',
  confianza: '#06b6d4',
  recompensa: '#d97706',
  amenaza: '#b91c1c',
  curiosidad: '#c026d3',
};

function StatCard({
  icon,
  label,
  value,
  sub,
  color = 'brand',
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  const colorMap: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-600',
    success: 'bg-emerald-50 text-emerald-600',
    warning: 'bg-amber-50 text-amber-600',
    danger: 'bg-rose-50 text-rose-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="card p-5 border-surface-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-surface-500 uppercase tracking-wider">
            {label}
          </p>
          <p className="text-3xl font-black text-surface-900 mt-1 tracking-tight">
            {value}
          </p>
          {sub && <p className="text-xs text-surface-400 mt-1 font-medium">{sub}</p>}
        </div>
        <div
          className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-xs ${
            colorMap[color] ?? colorMap.brand
          }`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

export function DashboardClient({
  nombre,
  metricasCategoria,
  metricasVector,
  perfilCruzado,
  sesiones,
  falsosPositivos,
  falsosNegativos,
  casosSuperados,
  racha,
}: DashboardClientProps) {
  // Precisión global acumulada
  const totalRespuestas = metricasCategoria.reduce(
    (sum, m) => sum + (m.total ?? 0),
    0
  );
  const totalCorrectas = metricasCategoria.reduce(
    (sum, m) => sum + (m.correctas ?? 0),
    0
  );
  const precisionGeneral =
    totalRespuestas > 0
      ? ((totalCorrectas / totalRespuestas) * 100).toFixed(1)
      : '0';

  // Tiempo de respuesta promedio
  const tiempoPromedioS =
    metricasCategoria.length > 0
      ? (
          metricasCategoria.reduce(
            (sum, m) => sum + (m.tiempo_promedio_ms ?? 0),
            0
          ) /
          metricasCategoria.length /
          1000
        ).toFixed(1)
      : '0';

  // Peor combinación de riesgo cruzado
  const puntoCiego =
    perfilCruzado.length > 0 && perfilCruzado[0].fallos > 0
      ? perfilCruzado[0]
      : null;

  // Datos para gráfico de categorías
  const dataCategorias = metricasCategoria.map((m) => {
    const meta = getCategoryMeta(m.categoria);
    return {
      name: meta.label,
      'Precisión (%)': Math.round(m.precision_pct ?? 0),
      fill: CATEGORY_COLORS[m.categoria] ?? '#4f46e5',
    };
  });

  // Datos para gráfico de vectores
  const dataVectores = metricasVector.map((v) => {
    const meta = getVectorMeta(v.vector);
    return {
      name: meta.label,
      'Precisión (%)': Math.round(v.precision_pct ?? 0),
      fill: VECTOR_COLORS[v.vector] ?? '#4f46e5',
    };
  });

  // Datos para gráfico de evolución por sesión
  const dataEvolucion = [...(sesiones ?? [])]
    .reverse()
    .slice(-10)
    .map((s, i) => ({
      sesion: `S${i + 1}`,
      'Precisión (%)': Math.round(s.precision_pct ?? 0),
    }));

  const hasData = totalRespuestas > 0;

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header del Dashboard */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-surface-900 tracking-tight">
            Panel de Desempeño Adaptativo
          </h1>
          <p className="text-xs sm:text-sm text-surface-500 mt-1">
            Bienvenido, <strong className="text-surface-800">{nombre}</strong>. Aquí puedes
            monitorear tu perfil de riesgo cruzado y los casos documentados superados.
          </p>
        </div>
        <Link
          href="/entrenamiento"
          className="btn-primary flex items-center gap-2 shadow-md shadow-brand-600/20 py-2.5 px-5 rounded-xl font-bold text-sm"
        >
          <Swords className="w-4 h-4" />
          Nueva Sesión
        </Link>
      </div>

      {/* Alerta de Punto Vulnerable Cruzado */}
      {puntoCiego && (
        <div className="card p-5 sm:p-6 border-amber-300 bg-gradient-to-r from-amber-50/90 via-orange-50/50 to-white shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-md">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded-md">
                  Vulnerabilidad Prioritaria Detectada por el Motor 2D
                </span>
                <span className="text-xs font-bold text-amber-900">
                  {puntoCiego.fallos} fallos registrados ({puntoCiego.tasa_fallo_pct}% de error)
                </span>
              </div>
              <h3 className="text-lg font-black text-surface-900">
                Tu mayor debilidad actual es:{' '}
                <span className="text-amber-700 underline decoration-amber-400 decoration-2">
                  {getCategoryMeta(puntoCiego.categoria).label} + Vector{' '}
                  {getVectorMeta(puntoCiego.vector).label}
                </span>
              </h3>
              <p className="text-xs text-surface-600 leading-relaxed">
                El motor adaptativo priorizará automáticamente escenarios reales que combinen este
                canal y vector psicológico en tus próximas sesiones para fortalecer tu resistencia
                cognitiva.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Métricas Principales (KPI Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Target className="w-6 h-6" />}
          label="Precisión Global"
          value={`${precisionGeneral}%`}
          sub={`${totalCorrectas} aciertos de ${totalRespuestas} evaluaciones`}
          color="brand"
        />
        <StatCard
          icon={<Clock className="w-6 h-6" />}
          label="Tiempo Promedio"
          value={`${tiempoPromedioS}s`}
          sub="Velocidad media de decisión"
          color="purple"
        />
        <StatCard
          icon={<BookOpen className="w-6 h-6" />}
          label="Casos Reales Superados"
          value={casosSuperados.length}
          sub="Ataques documentados identificados"
          color="success"
        />
        <StatCard
          icon={<Flame className="w-6 h-6" />}
          label="Racha de Efectividad"
          value={racha}
          sub="Sesiones seguidas con ≥ 70%"
          color="warning"
        />
      </div>

      {/* Gráficos Bidimensionales: Categorías y Vectores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico 1: Precisión por Categoría */}
        <div className="card p-6 border-surface-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-surface-900 text-sm">
                Precisión por Canal de Ataque
              </h3>
              <p className="text-xs text-surface-400">
                Eficacia en los 5 canales evaluados
              </p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2 py-1 rounded-md">
              Dimensión 1
            </span>
          </div>

          {dataCategorias.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataCategorias} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(val: any) => [`${val}%`, 'Precisión']}
                    contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Bar dataKey="Precisión (%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-xs text-surface-400">
              Aún no hay datos de categorías. Completa una sesión para visualizarlos.
            </div>
          )}
        </div>

        {/* Gráfico 2: Precisión por Vector Psicológico */}
        <div className="card p-6 border-surface-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-surface-900 text-sm">
                Precisión por Vector Psicológico
              </h3>
              <p className="text-xs text-surface-400">
                Resistencia a gatilladores cognitivos
              </p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-1 rounded-md">
              Dimensión 2
            </span>
          </div>

          {dataVectores.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataVectores} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(val: any) => [`${val}%`, 'Precisión']}
                    contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Bar dataKey="Precisión (%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-xs text-surface-400">
              Aún no hay datos de vectores psicológicos. Completa una sesión para visualizarlos.
            </div>
          )}
        </div>
      </div>

      {/* Gráfico de Evolución Temporal y Cuadrante de Errores */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Evolución en el tiempo */}
        <div className="card p-6 border-surface-200 lg:col-span-2">
          <h3 className="font-bold text-surface-900 text-sm mb-1">
            Evolución de Precisión en el Tiempo
          </h3>
          <p className="text-xs text-surface-400 mb-4">
            Porcentaje de acierto en las últimas 10 sesiones
          </p>

          {dataEvolucion.length > 0 ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dataEvolucion} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="sesion" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(val: any) => [`${val}%`, 'Precisión']}
                    contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Precisión (%)"
                    stroke="#4f46e5"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#4f46e5' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center text-xs text-surface-400">
              Completa al menos 1 sesión para observar la curva de aprendizaje.
            </div>
          )}
        </div>

        {/* Análisis de Tipos de Error (Paranoia vs Vulnerabilidad) */}
        <div className="card p-6 border-surface-200 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-surface-900 text-sm mb-1">
              Perfil de Errores de Decisión
            </h3>
            <p className="text-xs text-surface-400 mb-4">
              Distribución de fallos según sesgo
            </p>

            <div className="space-y-4">
              {/* Falso Positivo */}
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    Falsos Positivos (Paranoia)
                  </span>
                  <span className="text-lg font-black text-amber-800">
                    {falsosPositivos}
                  </span>
                </div>
                <p className="text-[11px] text-amber-700/90 mt-1">
                  Mensajes legítimos que clasificaste erróneamente como ataques.
                </p>
              </div>

              {/* Falso Negativo */}
              <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    Falsos Negativos (Vulnerabilidad)
                  </span>
                  <span className="text-lg font-black text-rose-800">
                    {falsosNegativos}
                  </span>
                </div>
                <p className="text-[11px] text-rose-700/90 mt-1">
                  Ataques reales que dejaste pasar considerándolos legítimos.
                </p>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-surface-400 italic pt-4">
            El objetivo del entrenamiento es minimizar especialmente los falsos negativos.
          </p>
        </div>
      </div>

      {/* Catálogo de Casos Reales Superados */}
      <div className="card p-6 sm:p-8 border-surface-200 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-black text-surface-900 tracking-tight">
                Casos Reales Documentados que Has Superado
              </h2>
            </div>
            <p className="text-xs text-surface-500 mt-1">
              Registro trazable de incidentes de seguridad reales que identificaste con éxito.
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-surface-100 text-surface-700 rounded-full w-fit">
            {casosSuperados.length} superados
          </span>
        </div>

        {casosSuperados.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {casosSuperados.map((caso) => {
              const catMeta = getCategoryMeta(caso.categoria);
              const vecMeta = getVectorMeta(caso.vector_psicologico);
              return (
                <div
                  key={caso.id}
                  className="p-4 rounded-2xl border border-surface-200 bg-surface-50/50 hover:bg-white hover:border-brand-300 transition-all flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${catMeta.bg} ${catMeta.color} ${catMeta.border}`}
                      >
                        {catMeta.label}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${vecMeta.bg} ${vecMeta.color} ${vecMeta.border}`}
                      >
                        {vecMeta.label}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-surface-900 leading-snug">
                      {caso.titulo}
                    </h4>
                    <p className="text-xs text-surface-500 mt-2 font-medium">
                      <strong>Fuente oficial:</strong> {caso.fuente}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-surface-200/60 flex items-center justify-between text-[11px] text-surface-400">
                    <span>Tiempo de respuesta: {(caso.tiempo_respuesta_ms / 1000).toFixed(1)}s</span>
                    {caso.fuente_url && (
                      <a
                        href={caso.fuente_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-600 hover:text-brand-800 font-semibold flex items-center gap-1"
                      >
                        Ver reporte <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center bg-surface-50 rounded-2xl border border-dashed border-surface-200">
            <BookOpen className="w-10 h-10 text-surface-300 mx-auto mb-2" />
            <p className="text-xs text-surface-500 font-medium">
              Aún no has superado escenarios de ataque real.
            </p>
            <Link
              href="/entrenamiento"
              className="btn-primary btn-sm mt-3 inline-flex items-center gap-1.5"
            >
              Comenzar primer entrenamiento
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
