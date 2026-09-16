import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardClient } from './DashboardClient';
import type {
  Categoria,
  VectorPsicologico,
  MetricasCategoria,
  MetricasVector,
  CasoSuperado,
} from '@/lib/types';
import {
  calcularErrores,
  computeCrossRiskProfile,
} from '@/lib/adaptive-engine';

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

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // ── 1. Respuestas del usuario con datos de escenario ──────
  const { data: respuestasJoin } = await supabase
    .from('respuestas')
    .select(
      `
      id, es_correcta, tiempo_respuesta_ms, created_at,
      respuesta_usuario, respuesta_correcta,
      escenarios:escenario_id (
        id, titulo, categoria, vector_psicologico, es_ataque, fuente, fuente_url
      )
      `
    )
    .eq('usuario_id', user.id)
    .order('created_at', { ascending: false });

  type RespuestaJoin = {
    id: string;
    es_correcta: boolean;
    tiempo_respuesta_ms: number;
    created_at: string;
    respuesta_usuario: boolean;
    respuesta_correcta: boolean;
    escenarios: {
      id: string;
      titulo: string;
      categoria: Categoria;
      vector_psicologico: VectorPsicologico;
      es_ataque: boolean;
      fuente: string | null;
      fuente_url: string | null;
    } | null;
  };

  const respuestas = (respuestasJoin as RespuestaJoin[] | null) ?? [];

  // ── 2. Métricas por Categoría ──────────────────────────────
  const byCategoria = new Map<
    Categoria,
    { total: number; correctas: number; tiempoAcumMs: number }
  >();

  // ── 3. Métricas por Vector Psicológico ─────────────────────
  const byVector = new Map<
    VectorPsicologico,
    { total: number; correctas: number }
  >();

  // ── 4. Casos Reales Superados ──────────────────────────────
  const casosSuperadosMap = new Map<string, CasoSuperado>();

  // ── 5. Datos para Perfil Cruzado y Errores ────────────────
  const paraPerfilCruzado: Array<{
    es_correcta: boolean;
    categoria: Categoria;
    vector_psicologico: VectorPsicologico;
  }> = [];

  const paraErrores: Array<{
    respuesta_usuario: boolean;
    respuesta_correcta: boolean;
    es_ataque: boolean;
  }> = [];

  for (const r of respuestas) {
    if (!r.escenarios) continue;
    const { id: escId, titulo, categoria, vector_psicologico, es_ataque, fuente, fuente_url } =
      r.escenarios;

    // Métricas por categoría
    const prevC = byCategoria.get(categoria) ?? {
      total: 0,
      correctas: 0,
      tiempoAcumMs: 0,
    };
    prevC.total += 1;
    if (r.es_correcta) prevC.correctas += 1;
    prevC.tiempoAcumMs += r.tiempo_respuesta_ms ?? 0;
    byCategoria.set(categoria, prevC);

    // Métricas por vector
    const prevV = byVector.get(vector_psicologico) ?? { total: 0, correctas: 0 };
    prevV.total += 1;
    if (r.es_correcta) prevV.correctas += 1;
    byVector.set(vector_psicologico, prevV);

    // Perfil cruzado
    paraPerfilCruzado.push({
      es_correcta: r.es_correcta,
      categoria,
      vector_psicologico,
    });

    // Errores
    paraErrores.push({
      respuesta_usuario: r.respuesta_usuario,
      respuesta_correcta: r.respuesta_correcta,
      es_ataque,
    });

    // Casos reales superados (ataques reales detectados correctamente con fuente)
    if (r.es_correcta && es_ataque && fuente && !casosSuperadosMap.has(escId)) {
      casosSuperadosMap.set(escId, {
        id: escId,
        titulo,
        categoria,
        vector_psicologico,
        fuente,
        fuente_url,
        tiempo_respuesta_ms: r.tiempo_respuesta_ms,
        fecha: r.created_at,
      });
    }
  }

  const metricasCategoria: MetricasCategoria[] = Array.from(
    byCategoria.entries()
  ).map(([categoria, m]) => ({
    categoria,
    total: m.total,
    correctas: m.correctas,
    precision_pct:
      m.total > 0 ? Math.round((m.correctas / m.total) * 1000) / 10 : 0,
    tiempo_promedio_ms:
      m.total > 0 ? Math.round(m.tiempoAcumMs / m.total) : 0,
  }));

  const metricasVector: MetricasVector[] = Array.from(byVector.entries()).map(
    ([vector, m]) => ({
      vector,
      total: m.total,
      correctas: m.correctas,
      precision_pct:
        m.total > 0 ? Math.round((m.correctas / m.total) * 1000) / 10 : 0,
    })
  );

  const perfilCruzado = computeCrossRiskProfile(paraPerfilCruzado);
  const errores = calcularErrores(paraErrores);
  const casosSuperados = Array.from(casosSuperadosMap.values());

  // ── 6. Sesiones de usuario ─────────────────────────────────
  const { data: sesionesRaw } = await supabase
    .from('sesiones')
    .select('*')
    .eq('usuario_id', user.id)
    .order('iniciada_en', { ascending: false })
    .limit(25);

  const sesiones: SesionConMetricasLocal[] = (
    (sesionesRaw as SesionRow[] | null) ?? []
  ).map((s) => {
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
  });

  // Calcular racha de sesiones completadas con precisión >= 70%
  let racha = 0;
  for (const s of sesiones) {
    if (s.finalizada_en && s.precision_pct >= 70) {
      racha++;
    } else {
      break;
    }
  }

  // ── 7. Perfil de Usuario ───────────────────────────────────
  const { data: perfil } = await supabase
    .from('profiles')
    .select('nombre, rol')
    .eq('user_id', user.id)
    .maybeSingle();

  return (
    <DashboardClient
      nombre={perfil?.nombre ?? user.email ?? 'Usuario'}
      metricasCategoria={metricasCategoria}
      metricasVector={metricasVector}
      perfilCruzado={perfilCruzado}
      sesiones={sesiones}
      falsosPositivos={errores.falsosPositivos}
      falsosNegativos={errores.falsosNegativos}
      casosSuperados={casosSuperados}
      racha={racha}
    />
  );
}
