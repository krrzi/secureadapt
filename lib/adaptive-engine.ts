/**
 * SecureAdapt — Motor de Entrenamiento Adaptativo Bidimensional (2D)
 *
 * Dimensiones:
 * 1. Categoría de Ataque: phishing | vishing | smishing | pretexting | baiting
 * 2. Vector Psicológico: urgencia | autoridad | confianza | recompensa | amenaza | curiosidad
 *
 * Reglas de Adaptabilidad:
 * - Detección de vulnerabilidad: 2+ fallos en una categoría O vector incrementan su frecuencia en la siguiente sesión (hasta 4x).
 * - Progresión de dificultad: 3+ aciertos consecutivos en una categoría aumentan el nivel (bajo -> medio -> alto).
 * - Perfil de riesgo cruzado: calcula la intersección (Categoría + Vector) con menor desempeño.
 * - Filtro anti-repetición: prioriza escenarios no vistos en las últimas respuestas del usuario.
 */

import type {
  Escenario,
  Categoria,
  VectorPsicologico,
  Dificultad,
  AdaptiveConfig,
  MetricasCategoria,
  MetricasVector,
  PerfilRiesgoCruzado,
  Badge,
} from './types';

// ── Constantes ────────────────────────────────────────────────

export const CATEGORIAS: Categoria[] = [
  'phishing',
  'vishing',
  'smishing',
  'pretexting',
  'baiting',
];

export const VECTORES_PSICOLOGICOS: VectorPsicologico[] = [
  'urgencia',
  'autoridad',
  'confianza',
  'recompensa',
  'amenaza',
  'curiosidad',
];

export const DIFICULTADES: Dificultad[] = ['bajo', 'medio', 'alto'];

// ── Construcción de Configuración Adaptativa 2D ───────────────

export function buildAdaptiveConfig2D(
  metricasCat: MetricasCategoria[],
  metricasVec: MetricasVector[],
  totalScenarios: number = 10,
  historialReciente: Array<{
    categoria: Categoria;
    vector_psicologico: VectorPsicologico;
    es_correcta: boolean;
  }> = []
): AdaptiveConfig {
  const categoryWeights: Record<Categoria, number> = {
    phishing: 1,
    vishing: 1,
    smishing: 1,
    pretexting: 1,
    baiting: 1,
  };

  const vectorWeights: Record<VectorPsicologico, number> = {
    urgencia: 1,
    autoridad: 1,
    confianza: 1,
    recompensa: 1,
    amenaza: 1,
    curiosidad: 1,
  };

  const preferredDifficulty: Record<Categoria, Dificultad> = {
    phishing: 'bajo',
    vishing: 'bajo',
    smishing: 'bajo',
    pretexting: 'bajo',
    baiting: 'bajo',
  };

  // 1. Analizar fallos y rachas en Categorías
  for (const m of metricasCat) {
    const cat = m.categoria;
    const fallos = m.total - m.correctas;

    // Regla 1: 2+ fallos en la categoría → aumentar peso
    if (fallos >= 2) {
      const mult = fallos >= 4 ? 3 : 2;
      categoryWeights[cat] = Math.min(categoryWeights[cat] * mult, 4);
    }

    // Regla adicional: si la precisión es < 50% con al menos 2 intentos
    if (m.total >= 2 && m.precision_pct < 50) {
      categoryWeights[cat] = Math.min(categoryWeights[cat] * 1.5, 4);
    }
  }

  // 2. Analizar fallos en Vectores Psicológicos
  for (const v of metricasVec) {
    const vec = v.vector;
    const fallos = v.total - v.correctas;

    // Regla 1 aplicada a vectores: 2+ fallos en el vector → aumentar peso
    if (fallos >= 2) {
      const mult = fallos >= 4 ? 3 : 2;
      vectorWeights[vec] = Math.min(vectorWeights[vec] * mult, 4);
    }

    if (v.total >= 2 && v.precision_pct < 50) {
      vectorWeights[vec] = Math.min(vectorWeights[vec] * 1.5, 4);
    }
  }

  // 3. Progresión de dificultad basada en rachas de aciertos
  if (historialReciente.length > 0) {
    const streaks = computeCategoryStreaks(historialReciente);
    for (const cat of CATEGORIAS) {
      const correctStreak = streaks[cat]?.correctas ?? 0;
      if (correctStreak >= 6) {
        preferredDifficulty[cat] = 'alto';
      } else if (correctStreak >= 3) {
        preferredDifficulty[cat] = 'medio';
      }
    }
  }

  // Encontrar categoría y vector de enfoque primario
  let primaryFocusCategory: Categoria | undefined = undefined;
  let maxCatWeight = 1;
  for (const cat of CATEGORIAS) {
    if (categoryWeights[cat] > maxCatWeight) {
      maxCatWeight = categoryWeights[cat];
      primaryFocusCategory = cat;
    }
  }

  let primaryFocusVector: VectorPsicologico | undefined = undefined;
  let maxVecWeight = 1;
  for (const vec of VECTORES_PSICOLOGICOS) {
    if (vectorWeights[vec] > maxVecWeight) {
      maxVecWeight = vectorWeights[vec];
      primaryFocusVector = vec;
    }
  }

  return {
    totalScenarios,
    categoryWeights,
    vectorWeights,
    preferredDifficulty,
    primaryFocusCategory,
    primaryFocusVector,
  };
}

// ── Selección de Escenarios Adaptativos ───────────────────────

export function selectScenarios2D(
  allScenarios: Escenario[],
  config: AdaptiveConfig,
  recentScenarioIds: string[] = []
): Escenario[] {
  const { totalScenarios, categoryWeights, vectorWeights, preferredDifficulty } = config;
  const activeScenarios = allScenarios.filter((s) => s.activo);

  if (activeScenarios.length === 0) return [];

  // Excluir escenarios vistos muy recientemente (últimos 20) si hay suficiente stock
  const recent = new Set(recentScenarioIds.slice(0, 20));
  const poolFresh = activeScenarios.filter((s) => !recent.has(s.id));
  const pool = poolFresh.length >= totalScenarios ? poolFresh : activeScenarios;

  // Asignar puntuación de relevancia a cada escenario según la combinación de pesos 2D
  const scored = pool.map((s) => {
    const wCat = categoryWeights[s.categoria] ?? 1;
    const wVec = vectorWeights[s.vector_psicologico] ?? 1;
    const prefDiff = preferredDifficulty[s.categoria] ?? 'bajo';
    const diffBonus = s.dificultad === prefDiff ? 1.5 : 1;

    // Pequeño factor aleatorio para asegurar dinamismo sin alterar prioridades
    const jitter = 0.85 + Math.random() * 0.3;
    const score = (wCat * 1.5 + wVec * 1.2) * diffBonus * jitter;

    return { escenario: s, score };
  });

  // Ordenar por relevancia calculada
  scored.sort((a, b) => b.score - a.score);

  // Garantizar cobertura mínima de diversidad: al menos 1 escenario de cada categoría si existe
  const selected: Escenario[] = [];
  const selectedIds = new Set<string>();

  for (const cat of CATEGORIAS) {
    const match = scored.find(
      (item) => item.escenario.categoria === cat && !selectedIds.has(item.escenario.id)
    );
    if (match) {
      selected.push(match.escenario);
      selectedIds.add(match.escenario.id);
    }
  }

  // Garantizar al menos 2 escenarios legítimos de control (es_ataque = false) para medir falsos positivos
  const legitimos = scored.filter(
    (item) => !item.escenario.es_ataque && !selectedIds.has(item.escenario.id)
  );
  for (let i = 0; i < Math.min(2, legitimos.length); i++) {
    selected.push(legitimos[i].escenario);
    selectedIds.add(legitimos[i].escenario.id);
  }

  // Completar el resto de los cupos con los escenarios con mayor puntuación adaptativa
  for (const item of scored) {
    if (selected.length >= totalScenarios) break;
    if (!selectedIds.has(item.escenario.id)) {
      selected.push(item.escenario);
      selectedIds.add(item.escenario.id);
    }
  }

  // Si aún faltan cupos (por filtros), rellenar desde activeScenarios
  if (selected.length < totalScenarios) {
    const remaining = activeScenarios.filter((s) => !selectedIds.has(s.id));
    for (const s of shuffleArray(remaining)) {
      if (selected.length >= totalScenarios) break;
      selected.push(s);
      selectedIds.add(s.id);
    }
  }

  // Barajar el orden final para que no sea predecible para el sujeto experimental
  return shuffleArray(selected).slice(0, totalScenarios);
}

// ── Perfil de Riesgo Cruzado (Categoría × Vector) ────────────

export function computeCrossRiskProfile(
  respuestasConEscenario: Array<{
    es_correcta: boolean;
    categoria: Categoria;
    vector_psicologico: VectorPsicologico;
  }>
): PerfilRiesgoCruzado[] {
  const map = new Map<string, { total: number; fallos: number }>();

  for (const r of respuestasConEscenario) {
    const key = `${r.categoria}::${r.vector_psicologico}`;
    const prev = map.get(key) ?? { total: 0, fallos: 0 };
    prev.total += 1;
    if (!r.es_correcta) prev.fallos += 1;
    map.set(key, prev);
  }

  const profiles: PerfilRiesgoCruzado[] = [];
  for (const [key, val] of Array.from(map.entries())) {
    const [categoria, vector] = key.split('::') as [Categoria, VectorPsicologico];
    const tasa_fallo_pct = val.total > 0 ? Math.round((val.fallos / val.total) * 1000) / 10 : 0;
    const precision_pct = 100 - tasa_fallo_pct;
    profiles.push({
      categoria,
      vector,
      total: val.total,
      fallos: val.fallos,
      tasa_fallo_pct,
      precision_pct,
    });
  }

  // Ordenar por mayor tasa de fallo y luego por mayor número de fallos
  profiles.sort((a, b) => {
    if (b.tasa_fallo_pct !== a.tasa_fallo_pct) {
      return b.tasa_fallo_pct - a.tasa_fallo_pct;
    }
    return b.fallos - a.fallos;
  });

  return profiles;
}

// ── Cálculo de Rachas por Historial ──────────────────────────

export function computeCategoryStreaks(
  respuestas: Array<{ categoria: Categoria; es_correcta: boolean }>
): Record<Categoria, { correctas: number; incorrectas: number }> {
  const streaks: Record<Categoria, { correctas: number; incorrectas: number }> = {
    phishing: { correctas: 0, incorrectas: 0 },
    vishing: { correctas: 0, incorrectas: 0 },
    smishing: { correctas: 0, incorrectas: 0 },
    pretexting: { correctas: 0, incorrectas: 0 },
    baiting: { correctas: 0, incorrectas: 0 },
  };

  const reversed = [...respuestas].reverse();

  for (const cat of CATEGORIAS) {
    const catAnswers = reversed.filter((r) => r.categoria === cat);
    let correctStreak = 0;
    let incorrectStreak = 0;

    for (const answer of catAnswers) {
      if (answer.es_correcta) {
        if (incorrectStreak === 0) correctStreak++;
        else break;
      } else {
        if (correctStreak === 0) incorrectStreak++;
        else break;
      }
    }

    streaks[cat] = { correctas: correctStreak, incorrectas: incorrectStreak };
  }

  return streaks;
}

// ── Cálculo de Falsos Positivos y Falsos Negativos ────────────

export function calcularErrores(
  respuestas: Array<{
    respuesta_usuario: boolean;
    respuesta_correcta: boolean;
    es_ataque: boolean;
  }>
) {
  let falsosPositivos = 0; // Marcado como ataque cuando era legítimo (paranoia)
  let falsosNegativos = 0; // Marcado como legítimo cuando era ataque (vulnerabilidad crítica)
  let verdaderosPositivos = 0;
  let verdaderosNegativos = 0;

  for (const r of respuestas) {
    const dijoAtaque = r.respuesta_usuario;
    const esAtaque = r.es_ataque;

    if (dijoAtaque && !esAtaque) {
      falsosPositivos++;
    } else if (!dijoAtaque && esAtaque) {
      falsosNegativos++;
    } else if (dijoAtaque && esAtaque) {
      verdaderosPositivos++;
    } else {
      verdaderosNegativos++;
    }
  }

  const total = respuestas.length;
  const tasaFalsosPositivosPct =
    total > 0 ? Math.round((falsosPositivos / total) * 1000) / 10 : 0;
  const tasaFalsosNegativosPct =
    total > 0 ? Math.round((falsosNegativos / total) * 1000) / 10 : 0;

  return {
    falsosPositivos,
    falsosNegativos,
    verdaderosPositivos,
    verdaderosNegativos,
    tasaFalsosPositivosPct,
    tasaFalsosNegativosPct,
  };
}

// ── Metadatos Visuales y UI ───────────────────────────────────

export function getCategoryMeta(cat: Categoria) {
  const meta: Record<
    Categoria,
    { label: string; color: string; bg: string; border: string; desc: string }
  > = {
    phishing: {
      label: 'Phishing',
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
      desc: 'Engaño mediante correo electrónico o sitios web fraudulentos para robar credenciales.',
    },
    vishing: {
      label: 'Vishing',
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      desc: 'Ingeniería social por llamada telefónica o interacción de voz para manipular a la víctima.',
    },
    smishing: {
      label: 'Smishing',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      desc: 'Mensajes SMS fraudulentos dirigidos a teléfonos móviles con enlaces maliciosos.',
    },
    pretexting: {
      label: 'Pretexting',
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      desc: 'Creación de un escenario o identidad falsa elaborada para ganarse la confianza de la víctima.',
    },
    baiting: {
      label: 'Baiting',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      desc: 'Uso de cebos tentadores (archivos de interés, memorias USB, premios) para infectar equipos.',
    },
  };
  return meta[cat] ?? meta.phishing;
}

export function getVectorMeta(vector: VectorPsicologico) {
  const meta: Record<
    VectorPsicologico,
    { label: string; color: string; bg: string; border: string; desc: string }
  > = {
    urgencia: {
      label: 'Urgencia',
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      desc: 'Impone plazos inmediatos para anular el pensamiento reflexivo.',
    },
    autoridad: {
      label: 'Autoridad',
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      border: 'border-indigo-200',
      desc: 'Suplanta jefaturas, TI o entidades gubernamentales para exigir acatamiento.',
    },
    confianza: {
      label: 'Confianza',
      color: 'text-cyan-600',
      bg: 'bg-cyan-50',
      border: 'border-cyan-200',
      desc: 'Aprovecha relaciones previas, colegas o marcas de alta reputación.',
    },
    recompensa: {
      label: 'Recompensa',
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      desc: 'Promete dinero, subsidios, premios o software gratuito.',
    },
    amenaza: {
      label: 'Amenaza',
      color: 'text-red-700',
      bg: 'bg-red-50',
      border: 'border-red-300',
      desc: 'Genera miedo a multas legales, bloqueos de cuenta o despidos.',
    },
    curiosidad: {
      label: 'Curiosidad',
      color: 'text-fuchsia-600',
      bg: 'bg-fuchsia-50',
      border: 'border-fuchsia-200',
      desc: 'Despierta el deseo de descubrir información confidencial o restringida.',
    },
  };
  return meta[vector] ?? meta.urgencia;
}

export function getDifficultyMeta(diff: Dificultad) {
  const meta: Record<Dificultad, { label: string; color: string; bg: string }> = {
    bajo: { label: 'Básico', color: 'text-green-700', bg: 'bg-green-50' },
    medio: { label: 'Intermedio', color: 'text-amber-700', bg: 'bg-amber-50' },
    alto: { label: 'Avanzado', color: 'text-red-700', bg: 'bg-red-50' },
  };
  return meta[diff] ?? meta.bajo;
}

// ── Sistema de Insignias y Logros ────────────────────────────

export function evaluateBadges(
  respuestas: Array<{
    es_correcta: boolean;
    categoria: Categoria;
    vector_psicologico: VectorPsicologico;
  }>,
  totalSesiones: number
): Badge[] {
  const correctasPorCat: Record<Categoria, number> = {
    phishing: 0,
    vishing: 0,
    smishing: 0,
    pretexting: 0,
    baiting: 0,
  };

  const correctasPorVector: Record<VectorPsicologico, number> = {
    urgencia: 0,
    autoridad: 0,
    confianza: 0,
    recompensa: 0,
    amenaza: 0,
    curiosidad: 0,
  };

  for (const r of respuestas) {
    if (r.es_correcta) {
      correctasPorCat[r.categoria] = (correctasPorCat[r.categoria] ?? 0) + 1;
      correctasPorVector[r.vector_psicologico] =
        (correctasPorVector[r.vector_psicologico] ?? 0) + 1;
    }
  }

  const badges: Badge[] = [
    {
      id: 'primera-sesion',
      titulo: 'Primer Paso Ciberseguro',
      descripcion: 'Completa tu primera sesión de entrenamiento experimental.',
      icono: '🎯',
      desbloqueado: totalSesiones >= 1,
      progresoActual: Math.min(totalSesiones, 1),
      progresoMeta: 1,
    },
    {
      id: 'anti-bec',
      titulo: 'Detective anti-BEC',
      descripcion: 'Detecta con éxito 3 ataques de phishing basados en confianza o fraude corporativo.',
      icono: '🕵️‍♂️',
      desbloqueado: correctasPorCat.phishing >= 3,
      progresoActual: Math.min(correctasPorCat.phishing, 3),
      progresoMeta: 3,
    },
    {
      id: 'experto-vishing',
      titulo: 'Inmune a la Voz',
      descripcion: 'Supera 3 escenarios reales de vishing y suplantación telefónica/MFA.',
      icono: '📞',
      desbloqueado: correctasPorCat.vishing >= 3,
      progresoActual: Math.min(correctasPorCat.vishing, 3),
      progresoMeta: 3,
    },
    {
      id: 'escudo-smishing',
      titulo: 'Escudo contra Smishing',
      descripcion: 'Identifica correctamente 3 mensajes SMS fraudulentos.',
      icono: '💬',
      desbloqueado: correctasPorCat.smishing >= 3,
      progresoActual: Math.min(correctasPorCat.smishing, 3),
      progresoMeta: 3,
    },
    {
      id: 'cazador-pretexting',
      titulo: 'Cazador de Pretextos',
      descripcion: 'Descubre 3 intentos de pretexting e ingeniería social preparatoria.',
      icono: '🎭',
      desbloqueado: correctasPorCat.pretexting >= 3,
      progresoActual: Math.min(correctasPorCat.pretexting, 3),
      progresoMeta: 3,
    },
    {
      id: 'inmune-urgencia',
      titulo: 'Mente Serena',
      descripcion: 'Responde acertadamente a 5 escenarios con vector de urgencia extrema o amenaza.',
      icono: '🧘',
      desbloqueado:
        correctasPorVector.urgencia + correctasPorVector.amenaza >= 5,
      progresoActual: Math.min(
        correctasPorVector.urgencia + correctasPorVector.amenaza,
        5
      ),
      progresoMeta: 5,
    },
    {
      id: 'veterano-seguridad',
      titulo: 'Analista Certificado',
      descripcion: 'Completa al menos 3 sesiones de entrenamiento adaptativo.',
      icono: '🎓',
      desbloqueado: totalSesiones >= 3,
      progresoActual: Math.min(totalSesiones, 3),
      progresoMeta: 3,
    },
  ];

  return badges;
}

// ── Función Utilitaria de Barajado ───────────────────────────

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
