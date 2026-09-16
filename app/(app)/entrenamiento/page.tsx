'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@/lib/supabase/client';
import {
  buildAdaptiveConfig2D,
  selectScenarios2D,
  getCategoryMeta,
  getVectorMeta,
} from '@/lib/adaptive-engine';
import { ScenarioCard } from '@/components/training/ScenarioCard';
import { ResultModal } from '@/components/training/ResultModal';
import { ProgressBar } from '@/components/training/ProgressBar';
import { useTimer, TimerDisplay } from '@/components/training/Timer';
import type {
  Escenario,
  AnswerRecord,
  MetricasCategoria,
  MetricasVector,
  Categoria,
  VectorPsicologico,
} from '@/lib/types';
import {
  RotateCcw,
  BarChart2,
  Brain,
  Shield,
  BookOpen,
  ArrowRight,
  Flame,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

const SCENARIOS_PER_SESSION = 10;

// ── Modal de Onboarding ──────────────────────────────────────
function OnboardingModal({ onStart }: { onStart: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-surface-200 animate-slide-up">
        <div className="p-6 sm:p-7 bg-gradient-to-br from-brand-50 to-white border-b border-surface-200">
          <div className="w-12 h-12 bg-brand-600 rounded-2xl flex items-center justify-center mb-4 text-white shadow-md shadow-brand-600/20">
            <Brain className="w-7 h-7" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-surface-900 tracking-tight">
            Entrenamiento Adaptativo 2D
          </h2>
          <p className="text-xs sm:text-sm text-surface-600 mt-1 font-medium">
            Basado en casos reales documentados de ingeniería social
          </p>
        </div>

        <div className="p-6 sm:p-7 space-y-4 text-left">
          {[
            {
              icon: '📚',
              title: 'Casos Reales Documentados',
              desc: 'No son simulaciones inventadas. Cada escenario recrea técnicas reales documentadas por APWG, FBI IC3, Group-IB y la banca peruana.',
            },
            {
              icon: '🧠',
              title: 'Evaluación Bidimensional',
              desc: 'El sistema evalúa tanto el Canal (Phishing, Vishing, Smishing, Pretexting, Baiting) como el Vector Psicológico (Urgencia, Autoridad, Confianza, etc.).',
            },
            {
              icon: '⚡',
              title: 'Adaptación a tus Puntos Ciegos',
              desc: 'Si fallas 2+ veces en un vector o categoría, el sistema priorizará esos casos para entrenar tu debilidad. Si aciertas de forma continua, aumentará la dificultad.',
            },
            {
              icon: '⏱️',
              title: 'El Tiempo de Decisión Cuenta',
              desc: 'Un cronómetro medirá tu tiempo de reacción. Piensa críticamente antes de decidir si el mensaje es legítimo o un ataque.',
            },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-3.5">
              <span className="text-2xl flex-shrink-0 mt-0.5">{item.icon}</span>
              <div>
                <p className="font-bold text-sm text-surface-900">{item.title}</p>
                <p className="text-xs text-surface-500 mt-0.5 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 sm:p-7 pt-0">
          <button
            onClick={onStart}
            className="btn-primary w-full btn-lg rounded-2xl shadow-lg shadow-brand-600/20 flex items-center justify-center gap-2"
          >
            <span>¡Iniciar Sesión de Entrenamiento!</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Resultados de la Sesión ──────────────────────────────────
function SessionResults({
  answers,
  onRestart,
  onGoToDashboard,
}: {
  answers: AnswerRecord[];
  onRestart: () => void;
  onGoToDashboard: () => void;
}) {
  const correctas = answers.filter((a) => a.es_correcta).length;
  const precision = Math.round((correctas / answers.length) * 100);
  const tiempoPromedio =
    answers.reduce((s, a) => s + a.tiempo_respuesta_ms, 0) / answers.length;

  const cats: Categoria[] = ['phishing', 'vishing', 'smishing', 'pretexting', 'baiting'];
  const catStats = cats
    .map((cat) => {
      const filtered = answers.filter((a) => a.escenario.categoria === cat);
      if (filtered.length === 0) return null;
      const c = filtered.filter((a) => a.es_correcta).length;
      return {
        cat,
        total: filtered.length,
        correctas: c,
        pct: Math.round((c / filtered.length) * 100),
      };
    })
    .filter(Boolean);

  const emoji =
    precision >= 90 ? '🏆' : precision >= 70 ? '🎯' : precision >= 50 ? '📈' : '💪';

  return (
    <div className="max-w-2xl mx-auto animate-slide-up">
      <div className="card overflow-hidden shadow-2xl border-surface-200">
        {/* Score Header */}
        <div
          className={`p-8 text-center border-b ${
            precision >= 70
              ? 'bg-emerald-50/80 border-emerald-200'
              : precision >= 50
              ? 'bg-amber-50/80 border-amber-200'
              : 'bg-rose-50/80 border-rose-200'
          }`}
        >
          <div className="text-5xl mb-3">{emoji}</div>
          <h2 className="text-2xl font-black text-surface-900 tracking-tight">
            Sesión Completada
          </h2>
          <p className="text-5xl font-black mt-2 text-brand-600 tracking-tight">
            {precision}%
          </p>
          <p className="text-xs uppercase tracking-widest text-surface-500 font-bold mt-1">
            Precisión de Detección
          </p>

          <div className="flex justify-center gap-8 mt-6 pt-6 border-t border-surface-200/60 text-sm">
            <div className="text-center">
              <p className="text-xl font-black text-emerald-600">{correctas}</p>
              <p className="text-xs text-surface-500 font-medium">Aciertos</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-black text-rose-600">
                {answers.length - correctas}
              </p>
              <p className="text-xs text-surface-500 font-medium">Fallos</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-black text-brand-600">
                {(tiempoPromedio / 1000).toFixed(1)}s
              </p>
              <p className="text-xs text-surface-500 font-medium">Tiempo prom.</p>
            </div>
          </div>
        </div>

        {/* Desglose por Categoría */}
        <div className="p-6 sm:p-7 space-y-4">
          <h3 className="font-bold text-surface-800 text-xs uppercase tracking-wider">
            Rendimiento por Canal de Ataque
          </h3>
          <div className="space-y-3">
            {catStats.map((stat) => {
              if (!stat) return null;
              const meta = getCategoryMeta(stat.cat);
              return (
                <div key={stat.cat} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-surface-700 capitalize">
                      {meta.label}
                    </span>
                    <span className="font-semibold text-surface-500">
                      {stat.correctas}/{stat.total} ({stat.pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-surface-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-700 ${
                        stat.pct >= 70
                          ? 'bg-emerald-500'
                          : stat.pct >= 50
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${stat.pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 sm:p-7 pt-0 flex flex-col sm:flex-row gap-3">
          <button
            onClick={onRestart}
            className="btn-secondary flex-1 flex items-center justify-center gap-2 py-3 rounded-xl"
          >
            <RotateCcw className="w-4 h-4" />
            Nueva sesión adaptativa
          </button>
          <button
            onClick={onGoToDashboard}
            className="btn-primary flex-1 flex items-center justify-center gap-2 py-3 rounded-xl shadow-md shadow-brand-600/20"
          >
            <BarChart2 className="w-4 h-4" />
            Ver mi perfil de riesgo
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Página Principal de Entrenamiento ─────────────────────────
export default function EntrenamientoPage() {
  const router = useRouter();
  const supabase = createClient();
  const timer = useTimer();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [scenarios, setScenarios] = useState<Escenario[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [pendingAnswer, setPendingAnswer] = useState<AnswerRecord | null>(null);
  const [sesionId, setSesionId] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const initSession = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUserId(user.id);

      // Verificar si es su primera sesión para mostrar el onboarding
      const { count: sessionCount } = await supabase
        .from('sesiones')
        .select('id', { count: 'exact', head: true })
        .eq('usuario_id', user.id);

      if (sessionCount === 0) {
        setShowOnboarding(true);
      }

      // Obtener respuestas previas con categorías y vectores para el motor adaptativo 2D
      const { data: historialRaw } = await supabase
        .from('respuestas')
        .select(
          `
          es_correcta,
          escenario_id,
          escenarios:escenario_id (categoria, vector_psicologico)
        `
        )
        .eq('usuario_id', user.id)
        .order('created_at', { ascending: false });

      type JoinHistorial = {
        es_correcta: boolean;
        escenario_id: string;
        escenarios: {
          categoria: Categoria;
          vector_psicologico: VectorPsicologico;
        } | null;
      };

      const historial = (historialRaw as JoinHistorial[] | null) ?? [];

      // Métricas por categoría
      const byCat = new Map<Categoria, { total: number; correctas: number }>();
      const byVec = new Map<VectorPsicologico, { total: number; correctas: number }>();
      const historialParaStreaks: Array<{
        categoria: Categoria;
        vector_psicologico: VectorPsicologico;
        es_correcta: boolean;
      }> = [];

      for (const h of historial) {
        if (!h.escenarios) continue;
        const { categoria, vector_psicologico } = h.escenarios;

        historialParaStreaks.push({
          categoria,
          vector_psicologico,
          es_correcta: h.es_correcta,
        });

        // Agrupar categoría
        const prevC = byCat.get(categoria) ?? { total: 0, correctas: 0 };
        prevC.total += 1;
        if (h.es_correcta) prevC.correctas += 1;
        byCat.set(categoria, prevC);

        // Agrupar vector
        const prevV = byVec.get(vector_psicologico) ?? { total: 0, correctas: 0 };
        prevV.total += 1;
        if (h.es_correcta) prevV.correctas += 1;
        byVec.set(vector_psicologico, prevV);
      }

      const metricasCat: MetricasCategoria[] = Array.from(byCat.entries()).map(
        ([categoria, m]) => ({
          categoria,
          total: m.total,
          correctas: m.correctas,
          precision_pct:
            m.total > 0 ? Math.round((m.correctas / m.total) * 1000) / 10 : 0,
          tiempo_promedio_ms: 0,
        })
      );

      const metricasVec: MetricasVector[] = Array.from(byVec.entries()).map(
        ([vector, m]) => ({
          vector,
          total: m.total,
          correctas: m.correctas,
          precision_pct:
            m.total > 0 ? Math.round((m.correctas / m.total) * 1000) / 10 : 0,
        })
      );

      // Obtener todos los escenarios activos del banco real
      const { data: allScenariosRaw, error: scenErr } = await supabase
        .from('escenarios')
        .select('*')
        .eq('activo', true);

      if (scenErr) throw scenErr;
      if (!allScenariosRaw || allScenariosRaw.length < 5) {
        setError('No hay suficientes escenarios reales en la base de datos.');
        return;
      }

      const allScenarios = allScenariosRaw as Escenario[];

      // Escenarios recientes para evitar repetición inmediata
      const recentIds = historial.slice(0, 20).map((h) => h.escenario_id);

      // Construir configuración adaptativa bidimensional y seleccionar
      const config2D = buildAdaptiveConfig2D(
        metricasCat,
        metricasVec,
        SCENARIOS_PER_SESSION,
        historialParaStreaks
      );

      const selected = selectScenarios2D(allScenarios, config2D, recentIds);

      // Crear registro de sesión en la base de datos
      const newSesionId = uuidv4();
      const { error: sessionInsertErr } = await supabase.from('sesiones').insert({
        id: newSesionId,
        usuario_id: user.id,
        total_escenarios: selected.length,
        correctas: 0,
      });

      if (sessionInsertErr) throw sessionInsertErr;

      setScenarios(selected);
      setSesionId(newSesionId);
      setCurrentIndex(0);
      setAnswers([]);
      setIsComplete(false);

      if (sessionCount !== 0) {
        timer.start();
      }
    } catch (err: any) {
      setError(err.message ?? 'Error al inicializar sesión');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initSession();
  }, [initSession]);

  const handleOnboardingStart = () => {
    setShowOnboarding(false);
    timer.start();
  };

  const handleAnswer = async (esAtaque: boolean) => {
    if (!sesionId || !userId || currentIndex >= scenarios.length) return;

    const tiempoMs = timer.stop();
    const escenario = scenarios[currentIndex];
    const esCorrecta = esAtaque === escenario.es_ataque;

    const record: AnswerRecord = {
      escenario,
      respuesta_usuario: esAtaque,
      es_correcta: esCorrecta,
      tiempo_respuesta_ms: tiempoMs,
    };

    // Guardar respuesta en Supabase
    await supabase.from('respuestas').insert({
      sesion_id: sesionId,
      escenario_id: escenario.id,
      usuario_id: userId,
      respuesta_usuario: esAtaque,
      respuesta_correcta: escenario.es_ataque,
      es_correcta: esCorrecta,
      tiempo_respuesta_ms: tiempoMs,
    });

    setPendingAnswer(record);
    setAnswers((prev) => [...prev, record]);
  };

  const handleNext = async () => {
    setPendingAnswer(null);

    if (currentIndex + 1 >= scenarios.length) {
      // Sesión completa
      const totalCorrectas = answers.filter((a) => a.es_correcta).length;
      if (sesionId) {
        await supabase
          .from('sesiones')
          .update({
            finalizada_en: new Date().toISOString(),
            correctas: totalCorrectas,
          })
          .eq('id', sesionId);
      }
      setIsComplete(true);
    } else {
      setCurrentIndex((prev) => prev + 1);
      timer.start();
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-4">
        <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-4" />
        <p className="font-bold text-surface-800 text-base">
          Calibrando motor adaptativo bidimensional...
        </p>
        <p className="text-xs text-surface-400 mt-1">
          Analizando histórico de fallos y seleccionando casos reales documentados.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 card text-center space-y-4">
        <p className="text-sm font-bold text-rose-600">{error}</p>
        <button onClick={initSession} className="btn-primary btn-sm">
          Reintentar
        </button>
      </div>
    );
  }

  if (isComplete) {
    return (
      <SessionResults
        answers={answers}
        onRestart={initSession}
        onGoToDashboard={() => router.push('/dashboard')}
      />
    );
  }

  const currentScenario = scenarios[currentIndex];

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Onboarding para nuevos usuarios */}
      {showOnboarding && <OnboardingModal onStart={handleOnboardingStart} />}

      {/* Barra de progreso y cronómetro */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <ProgressBar
            current={currentIndex + 1}
            total={scenarios.length}
            correctas={answers.filter((a) => a.es_correcta).length}
          />
        </div>
        <div className="flex-shrink-0">
          <TimerDisplay elapsed={timer.elapsed} />
        </div>
      </div>

      {/* Tarjeta del Escenario Actual */}
      {currentScenario && (
        <ScenarioCard
          escenario={currentScenario}
          onAnswer={handleAnswer}
          isAnswering={pendingAnswer !== null}
        />
      )}

      {/* Modal de Resultado y Retroalimentación con Fuente Real */}
      {pendingAnswer && (
        <ResultModal
          answer={pendingAnswer}
          onNext={handleNext}
          isLastScenario={currentIndex + 1 >= scenarios.length}
        />
      )}
    </div>
  );
}
