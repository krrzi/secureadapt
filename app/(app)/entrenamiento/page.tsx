'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@/lib/supabase/client';
import { buildAdaptiveConfig, selectScenarios } from '@/lib/adaptive-engine';
import { ScenarioCard } from '@/components/training/ScenarioCard';
import { ResultModal } from '@/components/training/ResultModal';
import { ProgressBar } from '@/components/training/ProgressBar';
import { useTimer, TimerDisplay } from '@/components/training/Timer';
import type { Escenario, AnswerRecord, MetricasCategoria, Categoria } from '@/lib/types';
import { CheckCircle, XCircle, Trophy, RotateCcw, BarChart2, AlertCircle, Loader2, Brain } from 'lucide-react';

const SCENARIOS_PER_SESSION = 10;

// ── Onboarding Modal ─────────────────────────────────────────
function OnboardingModal({ onStart }: { onStart: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full animate-slide-up">
        <div className="p-6 border-b border-surface-100">
          <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center mb-4">
            <Brain className="w-7 h-7 text-brand-600" />
          </div>
          <h2 className="text-xl font-bold text-surface-900">¿Cómo funciona el entrenamiento?</h2>
          <p className="text-sm text-surface-500 mt-1">Lee esto antes de tu primera sesión</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-3">
            {[
              { icon: '📧', title: 'Analiza el escenario', desc: 'Se te mostrará un email, mensaje o descripción de llamada telefónica.' },
              { icon: '🤔', title: 'Decide rápido', desc: 'Indica si crees que es un ataque de ingeniería social o un mensaje legítimo. El tiempo importa.' },
              { icon: '📚', title: 'Aprende del resultado', desc: 'Verás la explicación de por qué es o no es un ataque, con señales específicas a identificar.' },
              { icon: '🧠', title: 'El sistema se adapta', desc: 'Si fallas en una categoría, recibirás más ejercicios de esa área. Si mejoras, subirá la dificultad.' },
            ].map((step) => (
              <div key={step.title} className="flex gap-3">
                <span className="text-2xl flex-shrink-0">{step.icon}</span>
                <div>
                  <p className="font-semibold text-sm text-surface-800">{step.title}</p>
                  <p className="text-xs text-surface-500 mt-0.5">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-6 pt-0">
          <button onClick={onStart} className="btn-primary w-full btn-lg">
            ¡Comenzar entrenamiento!
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Session Results ───────────────────────────────────────────
function SessionResults({ answers, onRestart, onGoToDashboard }: {
  answers: AnswerRecord[];
  onRestart: () => void;
  onGoToDashboard: () => void;
}) {
  const correctas = answers.filter((a) => a.es_correcta).length;
  const precision = (correctas / answers.length) * 100;
  const tiempoPromedio = answers.reduce((s, a) => s + a.tiempo_respuesta_ms, 0) / answers.length;

  const categoriaStats = ['phishing', 'pretexting', 'baiting', 'vishing'].map((cat) => {
    const catAnswers = answers.filter((a) => a.escenario.categoria === cat);
    if (catAnswers.length === 0) return null;
    const catCorrectas = catAnswers.filter((a) => a.es_correcta).length;
    return {
      cat,
      total: catAnswers.length,
      correctas: catCorrectas,
      pct: (catCorrectas / catAnswers.length) * 100,
    };
  }).filter(Boolean);

  const emoji = precision >= 90 ? '🏆' : precision >= 70 ? '🎯' : precision >= 50 ? '📈' : '💪';

  return (
    <div className="max-w-2xl mx-auto animate-slide-up">
      <div className="card overflow-hidden">
        {/* Header */}
        <div className={`p-8 text-center ${precision >= 70 ? 'bg-success-50' : precision >= 50 ? 'bg-warning-50' : 'bg-danger-50'}`}>
          <div className="text-5xl mb-3">{emoji}</div>
          <h2 className="text-2xl font-bold text-surface-900">Sesión completada</h2>
          <p className="text-4xl font-black mt-2 text-brand-600">{precision.toFixed(0)}%</p>
          <p className="text-surface-500 text-sm mt-1">de precisión</p>
          <div className="flex justify-center gap-6 mt-4 text-sm">
            <div className="text-center">
              <p className="font-bold text-success-600">{correctas}</p>
              <p className="text-surface-400">Correctas</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-danger-600">{answers.length - correctas}</p>
              <p className="text-surface-400">Incorrectas</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-brand-600">{(tiempoPromedio / 1000).toFixed(1)}s</p>
              <p className="text-surface-400">Tiempo prom.</p>
            </div>
          </div>
        </div>

        {/* Category breakdown */}
        <div className="p-6 space-y-3">
          <h3 className="font-semibold text-surface-700 text-sm uppercase tracking-wide">Por categoría</h3>
          {categoriaStats.map((stat) => stat && (
            <div key={stat.cat} className="flex items-center gap-3">
              <span className="text-xs font-medium text-surface-500 w-24 capitalize">{stat.cat}</span>
              <div className="flex-1 bg-surface-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${stat.pct >= 70 ? 'bg-success-500' : stat.pct >= 50 ? 'bg-warning-500' : 'bg-danger-500'}`}
                  style={{ width: `${stat.pct}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-surface-600 w-16 text-right">
                {stat.correctas}/{stat.total} ({stat.pct.toFixed(0)}%)
              </span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="p-6 pt-0 flex gap-3">
          <button onClick={onRestart} className="btn-secondary flex-1 flex items-center gap-2">
            <RotateCcw className="w-4 h-4" /> Nueva sesión
          </button>
          <button onClick={onGoToDashboard} className="btn-primary flex-1 flex items-center gap-2">
            <BarChart2 className="w-4 h-4" /> Ver dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Training Page ────────────────────────────────────────
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

  // Initialize session
  const initSession = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUserId(user.id);

      // Check if this is first session (show onboarding)
      const { count } = await supabase
        .from('sesiones')
        .select('id', { count: 'exact', head: true })
        .eq('usuario_id', user.id);

      if (count === 0) setShowOnboarding(true);

      // Fetch user's category metrics for adaptive algorithm
      // (join directo respuestas + escenarios; sustituye a view metricas_usuario_categoria)
      const { data: respuestasCat } = await supabase
        .from('respuestas')
        .select('es_correcta, tiempo_respuesta_ms, escenarios:escenario_id (categoria)')
        .eq('usuario_id', user.id);

      type RJoin = {
        es_correcta: boolean;
        tiempo_respuesta_ms: number;
        escenarios: { categoria: Categoria } | null;
      };

      const byCat = new Map<
        Categoria,
        { total: number; correctas: number; tiempoAcumMs: number }
      >();

      for (const r of (respuestasCat as RJoin[] | null) ?? []) {
        const cat = r.escenarios?.categoria;
        if (!cat) continue;
        const prev = byCat.get(cat) ?? { total: 0, correctas: 0, tiempoAcumMs: 0 };
        prev.total += 1;
        if (r.es_correcta) prev.correctas += 1;
        prev.tiempoAcumMs += r.tiempo_respuesta_ms ?? 0;
        byCat.set(cat, prev);
      }

      const metricasForEngine: MetricasCategoria[] = Array.from(byCat.entries()).map(
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

      // Fetch recent scenario IDs to avoid repetition
      const { data: recentRespuestas } = await supabase
        .from('respuestas')
        .select('escenario_id')
        .eq('usuario_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      const recentIds = recentRespuestas?.map((r) => r.escenario_id) ?? [];

      // Fetch all active scenarios
      const { data: allScenarios, error: scenError } = await supabase
        .from('escenarios')
        .select('*')
        .eq('activo', true);

      if (scenError) throw scenError;
      if (!allScenarios || allScenarios.length < 4) {
        setError('No hay suficientes escenarios disponibles. Contacta al administrador.');
        return;
      }

      // Build adaptive config and select scenarios
      const config = buildAdaptiveConfig(metricasForEngine, SCENARIOS_PER_SESSION);
      const selected = selectScenarios(allScenarios as Escenario[], config, recentIds);

      // Create session in DB
      const newSesionId = uuidv4();
      const { error: sesionError } = await supabase.from('sesiones').insert({
        id: newSesionId,
        usuario_id: user.id,
        total_escenarios: selected.length,
        correctas: 0,
      });

      if (sesionError) throw sesionError;

      setScenarios(selected);
      setSesionId(newSesionId);
      setCurrentIndex(0);
      setAnswers([]);
      setIsComplete(false);

      if (count !== 0) {
        timer.start();
      }
    } catch (err: any) {
      setError(err.message ?? 'Error al inicializar la sesión');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { initSession(); }, []);

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

    // Save to DB
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
    const nextIndex = currentIndex + 1;

    if (nextIndex >= scenarios.length) {
      // Session complete — finalize in DB
      const correctas = [...answers].filter((a) => a.es_correcta).length +
        (pendingAnswer?.es_correcta ? 1 : 0);

      if (sesionId) {
        await supabase
          .from('sesiones')
          .update({
            finalizada_en: new Date().toISOString(),
            correctas,
          })
          .eq('id', sesionId);
      }
      setIsComplete(true);
    } else {
      setCurrentIndex(nextIndex);
      timer.start();
    }
  };

  // ── Render ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-3">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
        <p className="text-surface-500 text-sm">Preparando tu sesión adaptativa...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <div className="card p-6 text-center">
          <AlertCircle className="w-10 h-10 text-danger-500 mx-auto mb-3" />
          <h3 className="font-semibold text-surface-800">Error al cargar</h3>
          <p className="text-sm text-surface-500 mt-1">{error}</p>
          <button onClick={initSession} className="btn-primary mt-4">
            Intentar de nuevo
          </button>
        </div>
      </div>
    );
  }

  if (isComplete) {
    return (
      <SessionResults
        answers={answers}
        onRestart={() => {
          setIsComplete(false);
          initSession();
        }}
        onGoToDashboard={() => router.push('/dashboard')}
      />
    );
  }

  const currentScenario = scenarios[currentIndex];
  const correctasHasta = answers.filter((a) => a.es_correcta).length;

  return (
    <div className="max-w-3xl mx-auto">
      {showOnboarding && <OnboardingModal onStart={handleOnboardingStart} />}

      {/* Session header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold text-surface-900">Sesión de entrenamiento</h1>
            <p className="text-sm text-surface-400">Motor adaptativo activo</p>
          </div>
          <TimerDisplay elapsed={timer.elapsed} />
        </div>
        <ProgressBar
          current={currentIndex}
          total={scenarios.length}
          correctas={correctasHasta}
        />
      </div>

      {/* Scenario card */}
      {currentScenario && (
        <ScenarioCard
          key={currentScenario.id}
          escenario={currentScenario}
          onAnswer={handleAnswer}
          isAnswering={!!pendingAnswer}
        />
      )}

      {/* Result modal */}
      {pendingAnswer && (
        <ResultModal
          answer={pendingAnswer}
          onNext={handleNext}
          isLastScenario={currentIndex === scenarios.length - 1}
        />
      )}
    </div>
  );
}
