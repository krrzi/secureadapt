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
import { Swords, Target, Clock, AlertTriangle, Flame, TrendingUp, ShieldOff } from 'lucide-react';
import Link from 'next/link';

interface DashboardClientProps {
  nombre: string;
  metricas: any[];
  sesiones: any[];
  falsosPositivos: number;
  falsosNegativos: number;
  racha: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  phishing: 'Phishing',
  pretexting: 'Pretexting',
  baiting: 'Baiting',
  vishing: 'Vishing',
};

const CATEGORY_COLORS: Record<string, string> = {
  phishing: '#ef4444',
  pretexting: '#f97316',
  baiting: '#eab308',
  vishing: '#a855f7',
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
    success: 'bg-success-50 text-success-600',
    warning: 'bg-warning-50 text-warning-600',
    danger: 'bg-danger-50 text-danger-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-surface-500 font-medium">{label}</p>
          <p className="text-3xl font-black text-surface-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-surface-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color] ?? colorMap.brand}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export function DashboardClient({
  nombre,
  metricas,
  sesiones,
  falsosPositivos,
  falsosNegativos,
  racha,
}: DashboardClientProps) {
  // Compute overall precision
  const totalRespuestas = metricas.reduce((s: number, m: any) => s + (m.total ?? 0), 0);
  const totalCorrectas = metricas.reduce((s: number, m: any) => s + (m.correctas ?? 0), 0);
  const precisionGeneral =
    totalRespuestas > 0 ? ((totalCorrectas / totalRespuestas) * 100).toFixed(1) : '0';

  // Average response time (ms → seconds)
  const tiempoPromedio =
    metricas.length > 0
      ? (
          metricas.reduce((s: number, m: any) => s + (m.tiempo_promedio_ms ?? 0), 0) /
          metricas.length /
          1000
        ).toFixed(1)
      : '0';

  // Bar chart data (category precision)
  const barData = metricas.map((m: any) => ({
    name: CATEGORY_LABELS[m.categoria] ?? m.categoria,
    'Precisión (%)': Math.round(m.precision_pct ?? 0),
    fill: CATEGORY_COLORS[m.categoria] ?? '#6366f1',
  }));

  // Line chart data (precision per session)
  const lineData = [...(sesiones ?? [])]
    .reverse()
    .slice(-10)
    .map((s: any, i: number) => ({
      sesion: `#${i + 1}`,
      'Precisión (%)': Math.round(s.precision_pct ?? 0),
    }));

  const hasSessions = sesiones.length > 0;
  const hasMetrics = metricas.length > 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">Hola, {nombre} 👋</h1>
          <p className="section-subtitle">
            Aquí está tu progreso en entrenamiento de ingeniería social
          </p>
        </div>
        <Link href="/entrenamiento" className="btn-primary">
          <Swords className="w-4 h-4" />
          Entrenar ahora
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Target className="w-5 h-5" />}
          label="Precisión general"
          value={`${precisionGeneral}%`}
          sub={`${totalCorrectas}/${totalRespuestas} correctas`}
          color="brand"
        />
        <StatCard
          icon={<Clock className="w-5 h-5" />}
          label="Tiempo promedio"
          value={`${tiempoPromedio}s`}
          sub="Por escenario"
          color="success"
        />
        <StatCard
          icon={<Flame className="w-5 h-5" />}
          label="Racha actual"
          value={racha}
          sub="Sesiones seguidas ≥60%"
          color="warning"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Sesiones totales"
          value={sesiones.length}
          sub="Sesiones completadas"
          color="purple"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar: precision by category */}
        <div className="card p-6">
          <h2 className="font-bold text-surface-800 mb-1">Precisión por categoría</h2>
          <p className="text-xs text-surface-400 mb-4">Porcentaje de respuestas correctas</p>
          {hasMetrics ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#64748b' }} unit="%" />
                <Tooltip formatter={(v: number) => [`${v}%`, 'Precisión']} />
                <Bar dataKey="Precisión (%)" radius={[6, 6, 0, 0]}>
                  {barData.map((entry, index) => (
                    <rect key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex flex-col items-center justify-center text-surface-300">
              <Target className="w-8 h-8 mb-2" />
              <p className="text-sm">Completa una sesión para ver datos</p>
            </div>
          )}
        </div>

        {/* Line: precision over time */}
        <div className="card p-6">
          <h2 className="font-bold text-surface-800 mb-1">Evolución por sesión</h2>
          <p className="text-xs text-surface-400 mb-4">Últimas 10 sesiones</p>
          {hasSessions && lineData.length > 1 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={lineData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="sesion" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#64748b' }} unit="%" />
                <Tooltip formatter={(v: number) => [`${v}%`, 'Precisión']} />
                <Line
                  type="monotone"
                  dataKey="Precisión (%)"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex flex-col items-center justify-center text-surface-300">
              <TrendingUp className="w-8 h-8 mb-2" />
              <p className="text-sm">Necesitas al menos 2 sesiones</p>
            </div>
          )}
        </div>
      </div>

      {/* False positives / negatives */}
      <div className="card p-6">
        <h2 className="font-bold text-surface-800 mb-1">Errores de clasificación</h2>
        <p className="text-xs text-surface-400 mb-5">
          Tipos de error más costosos en seguridad real
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-danger-50 rounded-xl p-4 border border-danger-100">
            <div className="flex items-center gap-2 mb-1">
              <ShieldOff className="w-5 h-5 text-danger-600" />
              <span className="font-semibold text-danger-700 text-sm">Falsos negativos</span>
            </div>
            <p className="text-3xl font-black text-danger-600">{falsosNegativos}</p>
            <p className="text-xs text-danger-500 mt-1">
              Ataques reales marcados como legítimos — el error más peligroso
            </p>
          </div>
          <div className="bg-warning-50 rounded-xl p-4 border border-warning-100">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-5 h-5 text-warning-600" />
              <span className="font-semibold text-warning-700 text-sm">Falsos positivos</span>
            </div>
            <p className="text-3xl font-black text-warning-600">{falsosPositivos}</p>
            <p className="text-xs text-warning-500 mt-1">
              Mensajes legítimos marcados como ataques — desconfianza excesiva
            </p>
          </div>
        </div>
      </div>

      {/* Recent sessions */}
      {hasSessions && (
        <div className="card p-6">
          <h2 className="font-bold text-surface-800 mb-4">Sesiones recientes</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-100">
                  <th className="text-left py-2 pr-4 text-surface-400 font-medium">Fecha</th>
                  <th className="text-right py-2 pr-4 text-surface-400 font-medium">Escenarios</th>
                  <th className="text-right py-2 pr-4 text-surface-400 font-medium">Correctas</th>
                  <th className="text-right py-2 text-surface-400 font-medium">Precisión</th>
                </tr>
              </thead>
              <tbody>
                {sesiones.slice(0, 8).map((s: any) => {
                  const pct = s.precision_pct ?? 0;
                  const color =
                    pct >= 70 ? 'text-success-600' : pct >= 50 ? 'text-warning-600' : 'text-danger-600';
                  return (
                    <tr key={s.id} className="border-b border-surface-50 hover:bg-surface-50">
                      <td className="py-3 pr-4 text-surface-500">
                        {new Date(s.iniciada_en).toLocaleDateString('es-MX', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 pr-4 text-right text-surface-600">{s.total_escenarios}</td>
                      <td className="py-3 pr-4 text-right text-surface-600">{s.correctas}</td>
                      <td className={`py-3 text-right font-semibold ${color}`}>
                        {Math.round(pct)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CTA if no sessions */}
      {!hasSessions && (
        <div className="card p-8 text-center">
          <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Swords className="w-8 h-8 text-brand-500" />
          </div>
          <h3 className="font-bold text-surface-800 text-lg">¡Aún no has entrenado!</h3>
          <p className="text-surface-500 text-sm mt-2 max-w-sm mx-auto">
            Completa tu primera sesión de entrenamiento para ver tus estadísticas y métricas aquí.
          </p>
          <Link href="/entrenamiento" className="btn-primary mt-5 inline-flex">
            Comenzar primer sesión
          </Link>
        </div>
      )}
    </div>
  );
}
