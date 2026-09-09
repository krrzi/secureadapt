/**
 * SecureAdapt — Adaptive Training Engine
 *
 * Selects a personalized set of scenarios per session based on:
 * 1. Category weighting (fail 2+ → increase frequency)
 * 2. Difficulty progression (3+ correct streaks → increase difficulty)
 * 3. Anti-repetition (avoids recently seen scenarios)
 */

import type {
  Escenario,
  Categoria,
  Dificultad,
  AdaptiveWeights,
  AdaptiveConfig,
  CategoryStats,
  MetricasCategoria,
} from './types';

// ── Constants ────────────────────────────────────────────────

const CATEGORIAS: Categoria[] = ['phishing', 'pretexting', 'baiting', 'vishing'];

const DEFAULT_WEIGHTS: AdaptiveWeights = {
  phishing: 1,
  pretexting: 1,
  baiting: 1,
  vishing: 1,
};

const DIFFICULTY_ORDER: Dificultad[] = ['bajo', 'medio', 'alto'];

// ── Public API ───────────────────────────────────────────────

/**
 * Builds the adaptive configuration for the next session
 * based on the user's historical performance metrics.
 */
export function buildAdaptiveConfig(
  metricas: MetricasCategoria[],
  totalScenarios: number = 10
): AdaptiveConfig {
  const weights = { ...DEFAULT_WEIGHTS };
  const preferredDifficulty: Record<Categoria, Dificultad> = {
    phishing: 'bajo',
    pretexting: 'bajo',
    baiting: 'bajo',
    vishing: 'bajo',
  };

  for (const m of metricas) {
    const cat = m.categoria;
    const stats = computeCategoryStats(m);

    // Rule 1: 2+ consecutive failures → increase category frequency
    if (stats.racha_incorrectas >= 2) {
      weights[cat] = Math.min(weights[cat] * 2, 4); // cap at 4x
    }

    // Rule 2: 3+ consecutive correct → increase difficulty
    if (stats.racha_correctas >= 3) {
      const currentIdx = DIFFICULTY_ORDER.indexOf(preferredDifficulty[cat]);
      preferredDifficulty[cat] =
        DIFFICULTY_ORDER[Math.min(currentIdx + 1, DIFFICULTY_ORDER.length - 1)];
    }

    // Rule 3: Below 50% accuracy → also increase weight slightly
    if (m.precision_pct < 50 && stats.total >= 3) {
      weights[cat] = Math.min(weights[cat] * 1.5, 4);
    }
  }

  return { totalScenarios, weights, preferredDifficulty };
}

/**
 * Selects scenarios for a session using adaptive weights.
 * Guarantees variety: at least 1 scenario from each category (if available).
 */
export function selectScenarios(
  allScenarios: Escenario[],
  config: AdaptiveConfig,
  recentScenarioIds: string[] = []
): Escenario[] {
  const { totalScenarios, weights, preferredDifficulty } = config;
  const activeScenarios = allScenarios.filter((s) => s.activo);

  // Filter out recently seen scenarios (last 2 sessions worth)
  const recent = new Set(recentScenarioIds.slice(0, 20));
  const available = activeScenarios.filter((s) => !recent.has(s.id));

  // Fall back to all scenarios if too few available
  const pool = available.length >= totalScenarios ? available : activeScenarios;

  // Build weighted pool by category
  const byCategory: Record<Categoria, Escenario[]> = {
    phishing: [],
    pretexting: [],
    baiting: [],
    vishing: [],
  };

  for (const scenario of pool) {
    byCategory[scenario.categoria].push(scenario);
  }

  // Sort each category by preferred difficulty (preferred first, then others)
  for (const cat of CATEGORIAS) {
    byCategory[cat].sort((a, b) => {
      const prefDiff = preferredDifficulty[cat];
      if (a.dificultad === prefDiff && b.dificultad !== prefDiff) return -1;
      if (b.dificultad === prefDiff && a.dificultad !== prefDiff) return 1;
      return 0;
    });
  }

  // Calculate slot allocation based on weights
  const totalWeight = CATEGORIAS.reduce((sum, cat) => sum + weights[cat], 0);
  const slots: Record<Categoria, number> = {
    phishing: 0,
    pretexting: 0,
    baiting: 0,
    vishing: 0,
  };

  // First pass: proportional allocation (at least 1 per category)
  let remaining = totalScenarios;
  for (const cat of CATEGORIAS) {
    const catSlots = Math.max(
      1,
      Math.round((weights[cat] / totalWeight) * totalScenarios)
    );
    slots[cat] = catSlots;
    remaining -= catSlots;
  }

  // Adjust if over/under
  if (remaining > 0) {
    // Add extra to highest-weight category
    const maxCat = CATEGORIAS.reduce((a, b) =>
      weights[a] > weights[b] ? a : b
    );
    slots[maxCat] += remaining;
  } else if (remaining < 0) {
    // Remove from lowest-weight category
    const minCat = CATEGORIAS.reduce((a, b) =>
      weights[a] < weights[b] ? a : b
    );
    slots[minCat] = Math.max(1, slots[minCat] + remaining);
  }

  // Select scenarios from each category
  const selected: Escenario[] = [];
  for (const cat of CATEGORIAS) {
    const catScenarios = byCategory[cat];
    const needed = Math.min(slots[cat], catScenarios.length);
    const shuffled = shuffleArray([...catScenarios]);
    selected.push(...shuffled.slice(0, needed));
  }

  // Fill remaining slots if a category had fewer scenarios than needed
  if (selected.length < totalScenarios) {
    const remaining_pool = pool.filter((s) => !selected.find((sel) => sel.id === s.id));
    const extra = shuffleArray(remaining_pool).slice(0, totalScenarios - selected.length);
    selected.push(...extra);
  }

  // Shuffle final selection to avoid predictable ordering
  return shuffleArray(selected).slice(0, totalScenarios);
}

/**
 * Computes streak statistics from aggregated metrics.
 * Note: True streaks require per-answer data. This approximates from aggregate stats.
 */
function computeCategoryStats(m: MetricasCategoria): CategoryStats {
  const precision = m.precision_pct / 100;
  const racha_correctas = precision >= 0.8 && m.total >= 3 ? 3 : 0;
  const racha_incorrectas = precision < 0.4 && m.total >= 2 ? 2 : 0;

  return {
    categoria: m.categoria,
    total: m.total,
    correctas: m.correctas,
    racha_correctas,
    racha_incorrectas,
  };
}

/**
 * Computes precise consecutive streaks from ordered answer history.
 * Use this for accurate streak detection when you have full response data.
 */
export function computeStreaksFromHistory(
  respuestas: Array<{ categoria: Categoria; es_correcta: boolean }>
): Record<Categoria, { correctas: number; incorrectas: number }> {
  const streaks: Record<Categoria, { correctas: number; incorrectas: number }> = {
    phishing: { correctas: 0, incorrectas: 0 },
    pretexting: { correctas: 0, incorrectas: 0 },
    baiting: { correctas: 0, incorrectas: 0 },
    vishing: { correctas: 0, incorrectas: 0 },
  };

  // Process in reverse (most recent first)
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

// ── Utilities ────────────────────────────────────────────────

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Calculates false positive and false negative rates.
 * - False Positive: Marked as attack when it's legitimate
 * - False Negative: Marked as legitimate when it's an attack
 */
export function calcularErrores(
  respuestas: Array<{
    respuesta_usuario: boolean;
    respuesta_correcta: boolean;
    es_ataque: boolean;
  }>
) {
  let falsosPositivos = 0;
  let falsosNegativos = 0;
  let verdaderosPositivos = 0;
  let verdaderosNegativos = 0;

  for (const r of respuestas) {
    const marcadoComoAtaque = r.respuesta_usuario;
    const esAtaque = r.es_ataque;

    if (marcadoComoAtaque && !esAtaque) falsosPositivos++;
    else if (!marcadoComoAtaque && esAtaque) falsosNegativos++;
    else if (marcadoComoAtaque && esAtaque) verdaderosPositivos++;
    else verdaderosNegativos++;
  }

  return { falsosPositivos, falsosNegativos, verdaderosPositivos, verdaderosNegativos };
}

/**
 * Returns display label and color class for a category.
 */
export function getCategoryMeta(cat: Categoria) {
  const meta: Record<Categoria, { label: string; color: string; bg: string }> = {
    phishing: { label: 'Phishing', color: 'text-red-600', bg: 'bg-red-100' },
    pretexting: { label: 'Pretexting', color: 'text-orange-600', bg: 'bg-orange-100' },
    baiting: { label: 'Baiting', color: 'text-yellow-600', bg: 'bg-yellow-100' },
    vishing: { label: 'Vishing', color: 'text-purple-600', bg: 'bg-purple-100' },
  };
  return meta[cat];
}

export function getDifficultyMeta(diff: Dificultad) {
  const meta: Record<Dificultad, { label: string; color: string }> = {
    bajo: { label: 'Bajo', color: 'text-green-600' },
    medio: { label: 'Medio', color: 'text-yellow-600' },
    alto: { label: 'Alto', color: 'text-red-600' },
  };
  return meta[diff];
}
