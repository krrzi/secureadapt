import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardClient } from './DashboardClient';
import type { Categoria, MetricasCategoria } from '@/lib/types';
import { calcularErrores } from '@/lib/adaptive-engine';

type SesionRow = {
  id: string;
  usuario_id: string;
  iniciada_en: string;
  finalizada_en: string | null;
  total_escenarios: number;
  correctas: number;
};

type SesionConMetricasLocal = SesionRow & {
  precision_pct: number;
  duracion_segundos: number | null;
};

export default async function DashboardPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // ── 1. Respuestas con JOIN a escenarios para categorizar ──
  const { data: respuestasJoin } = await supabase
    .from('respuestas')
    .select(
      `
      id, es_correcta, tiempo_respuesta_ms, created_at,
      respuesta_usuario, respuesta_correcta,
      escenarios:escenario_id (categoria, es_ataque)
      `
    )
    .eq('usuario_id', user.id);

  type RespuestaJoin = {
    id: string;
    es_correcta: boolean;
    tiempo_respuesta_ms: number;
    created_at: string;
    respuesta_usuario: boolean;
    respuesta_correcta: boolean;
    escenarios: { categoria: Categoria; es_ataque: boolean } | null;
  };

  const respuestas = (respuestasJoin as RespuestaJoin[] | null) ?? [];

  // ── 2. Métricas por categoría (reemplaza view metricas_usuario_categoria) ──
  const byCategoria = new Map<
    Categoria,
    { total: number; correctas: number; tiempoAcumMs: number }
  >();

  for (const r of respuestas) {
    const cat = r.escenarios?.categoria;
    if (!cat) continue;
    const prev = byCategoria.get(cat) ?? { total: 0, correctas: 0, tiempoAcumMs: 0 };
    prev.total += 1;
    if (r.es_correcta) prev.correctas += 1;
    prev.tiempoAcumMs += r.tiempo_respuesta_ms ?? 0;
    byCategoria.set(cat, prev);
  }

  const metricas: MetricasCategoria[] = Array.from(byCategoria.entries()).map(
    ([categoria, m]) => ({
      categoria,
      total: m.total,
      correctas: m.correctas,
      precision_pct:
        m.total > 0 ? Math.round((m.correctas / m.total) * 1000) / 10 : 0,
      tiempo_promedio_ms:
        m.total > 0 ? Math.round(m.tiempoAcumMs / m.total) : 0,
    })
  );

  // ── 3. Sesiones + calcular precision_pct y duracion ──
  const { data: sesionesRaw } = await supabase
    .from('sesiones')
    .select('*')
    .eq('usuario_id', user.id)
    .order('iniciada_en', { ascending: false })
    .limit(20);

  const sesiones: SesionConMetricasLocal[] = (
    (sesionesRaw as SesionRow[] | null) ?? []
  ).map((s) => {
    const precision_pct =
      s.total_escenarios > 0
        ? Math.round((s.correctas / s.total_escenarios) * 1000) / 10
        : 0;
    let duracion_segundos: number | null = null;
    if (s.finalizada_en) {
      duracion_segundos =
        (new Date(s.finalizada_en).getTime() -
          new Date(s.iniciada_en).getTime()) /
        1000;
      duracion_segundos = Math.round(duracion_segundos);
    }
    return { ...s, precision_pct, duracion_segundos };
  });

  // ── 4. Perfil ──
  const { data: perfil } = await supabase
    .from('profiles')
    .select('nombre, rol')
    .eq('user_id', user.id)
    .maybeSingle();

  // ── 5. Falsos positivos / negativos ──
  const paraErrores = respuestas
    .filter((r) => r.escenarios !== null)
    .map((r) => ({
      respuesta_usuario: r.respuesta_usuario,
      respuesta_correcta: r.respuesta_correcta,
      es_ataque: r.escenarios!.es_ataque,
    }));
  const { falsosPositivos, falsosNegativos } = calcularErrores(paraErrores);

  // ── 6. Racha sesiones completadas (precisión ≥ 60% consecutivas) ──
  let racha = 0;
  for (const s of sesiones) {
    if (s.precision_pct >= 60) racha++;
    else break;
  }

  return (
    <DashboardClient
      nombre={perfil?.nombre ?? 'Usuario'}
      metricas={metricas}
      sesiones={sesiones}
      falsosPositivos={falsosPositivos}
      falsosNegativos={falsosNegativos}
      racha={racha}
    />
  );
}
