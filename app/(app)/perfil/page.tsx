import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PerfilClient } from './PerfilClient';
import type {
  Categoria,
  VectorPsicologico,
  MetricasCategoria,
} from '@/lib/types';
import { evaluateBadges } from '@/lib/adaptive-engine';

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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // 1. Perfil de usuario
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  // 2. Sesiones completadas
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

  // 3. Respuestas para métricas e insignias
  const { data: respuestasJoin } = await supabase
    .from('respuestas')
    .select(
      `
      es_correcta,
      escenarios:escenario_id (categoria, vector_psicologico)
    `
    )
    .eq('usuario_id', user.id);

  type RJoin = {
    es_correcta: boolean;
    escenarios: {
      categoria: Categoria;
      vector_psicologico: VectorPsicologico;
    } | null;
  };

  const respuestas = (respuestasJoin as RJoin[] | null) ?? [];

  const byCat = new Map<Categoria, { total: number; correctas: number }>();
  const paraBadges: Array<{
    es_correcta: boolean;
    categoria: Categoria;
    vector_psicologico: VectorPsicologico;
  }> = [];

  for (const r of respuestas) {
    if (!r.escenarios) continue;
    const { categoria, vector_psicologico } = r.escenarios;

    const prev = byCat.get(categoria) ?? { total: 0, correctas: 0 };
    prev.total += 1;
    if (r.es_correcta) prev.correctas += 1;
    byCat.set(categoria, prev);

    paraBadges.push({
      es_correcta: r.es_correcta,
      categoria,
      vector_psicologico,
    });
  }

  const metricas: MetricasCategoria[] = Array.from(byCat.entries()).map(
    ([categoria, m]) => ({
      categoria,
      total: m.total,
      correctas: m.correctas,
      precision_pct:
        m.total > 0 ? Math.round((m.correctas / m.total) * 1000) / 10 : 0,
      tiempo_promedio_ms: 0,
    })
  );

  const totalRespuestas = metricas.reduce((s, m) => s + m.total, 0);
  const totalCorrectas = metricas.reduce((s, m) => s + m.correctas, 0);
  const precisionGeneral =
    totalRespuestas > 0
      ? ((totalCorrectas / totalRespuestas) * 100).toFixed(1)
      : '0';

  const badges = evaluateBadges(paraBadges, sesiones.length);

  return (
    <PerfilClient
      profile={profile}
      userEmail={user.email ?? ''}
      sesiones={sesiones}
      metricas={metricas}
      badges={badges}
      totalRespuestas={totalRespuestas}
      precisionGeneral={precisionGeneral}
    />
  );
}
