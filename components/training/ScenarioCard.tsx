'use client';

import {
  ShieldAlert,
  ShieldCheck,
  Mail,
  Phone,
  MessageSquare,
  AlertTriangle,
  Package,
  Clock,
  Briefcase,
  HeartHandshake,
  Gift,
  Flame,
  Search,
  BookMarked,
} from 'lucide-react';
import type { Escenario, Categoria, VectorPsicologico } from '@/lib/types';
import {
  getCategoryMeta,
  getVectorMeta,
  getDifficultyMeta,
} from '@/lib/adaptive-engine';

interface ScenarioCardProps {
  escenario: Escenario;
  onAnswer: (esAtaque: boolean) => void;
  isAnswering: boolean;
}

function CategoryIcon({ categoria }: { categoria: Categoria }) {
  const icons: Record<Categoria, React.ReactNode> = {
    phishing: <Mail className="w-4 h-4" />,
    vishing: <Phone className="w-4 h-4" />,
    smishing: <MessageSquare className="w-4 h-4" />,
    pretexting: <AlertTriangle className="w-4 h-4" />,
    baiting: <Package className="w-4 h-4" />,
  };
  return icons[categoria] ?? <Mail className="w-4 h-4" />;
}

function VectorIcon({ vector }: { vector: VectorPsicologico }) {
  const icons: Record<VectorPsicologico, React.ReactNode> = {
    urgencia: <Clock className="w-3.5 h-3.5" />,
    autoridad: <Briefcase className="w-3.5 h-3.5" />,
    confianza: <HeartHandshake className="w-3.5 h-3.5" />,
    recompensa: <Gift className="w-3.5 h-3.5" />,
    amenaza: <Flame className="w-3.5 h-3.5" />,
    curiosidad: <Search className="w-3.5 h-3.5" />,
  };
  return icons[vector] ?? <Clock className="w-3.5 h-3.5" />;
}

export function ScenarioCard({
  escenario,
  onAnswer,
  isAnswering,
}: ScenarioCardProps) {
  const catMeta = getCategoryMeta(escenario.categoria);
  const vecMeta = getVectorMeta(escenario.vector_psicologico);
  const diffMeta = getDifficultyMeta(escenario.dificultad);

  return (
    <div className="card overflow-hidden shadow-xl border-surface-200 animate-slide-up">
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-surface-50 to-white border-b border-surface-200">
        <div className="flex items-center justify-between flex-wrap gap-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Categoría */}
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${catMeta.bg} ${catMeta.color} ${catMeta.border}`}
            >
              <CategoryIcon categoria={escenario.categoria} />
              {catMeta.label}
            </span>

            {/* Vector Psicológico */}
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${vecMeta.bg} ${vecMeta.color} ${vecMeta.border}`}
              title={vecMeta.desc}
            >
              <VectorIcon vector={escenario.vector_psicologico} />
              Vector: {vecMeta.label}
            </span>

            {/* Dificultad */}
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-surface-100 ${diffMeta.color}`}
            >
              Nivel {diffMeta.label}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-brand-700 bg-brand-50 px-2.5 py-1 rounded-md font-semibold border border-brand-100">
            <BookMarked className="w-3.5 h-3.5 text-brand-600" />
            Caso Real Documentado
          </div>
        </div>

        <h2 className="mt-4 text-xl font-black text-surface-900 tracking-tight leading-snug">
          {escenario.titulo}
        </h2>
      </div>

      {/* Recreated Situation / Technique Display */}
      <div className="p-6">
        <div className="bg-surface-900 text-surface-100 rounded-2xl p-5 border border-surface-800 shadow-inner font-mono text-xs sm:text-sm leading-relaxed overflow-x-auto whitespace-pre-wrap selection:bg-brand-600 selection:text-white">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-surface-800 text-surface-400 font-sans text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/80 inline-block" />
              <span className="ml-2 font-mono text-[11px] text-surface-400">
                simulador://caso-recreado
              </span>
            </span>
            <span className="uppercase text-[10px] tracking-wider text-surface-400 font-bold">
              {escenario.categoria} · {escenario.vector_psicologico}
            </span>
          </div>
          {escenario.contenido}
        </div>
      </div>

      {/* Decision Buttons */}
      <div className="px-6 pb-6 pt-2">
        <p className="text-center text-xs font-semibold text-surface-500 uppercase tracking-wider mb-3">
          ¿Cómo clasificas esta interacción?
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <button
            onClick={() => onAnswer(false)}
            disabled={isAnswering}
            className="group relative flex items-center justify-center gap-2.5 rounded-2xl py-4 px-6 font-bold text-sm sm:text-base transition-all duration-200
              bg-emerald-50 text-emerald-800 border-2 border-emerald-200
              hover:bg-emerald-100 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/10
              focus:outline-none focus:ring-4 focus:ring-emerald-200
              disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            <ShieldCheck className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform" />
            <span>Es una interacción legítima</span>
          </button>

          <button
            onClick={() => onAnswer(true)}
            disabled={isAnswering}
            className="group relative flex items-center justify-center gap-2.5 rounded-2xl py-4 px-6 font-bold text-sm sm:text-base transition-all duration-200
              bg-rose-50 text-rose-800 border-2 border-rose-200
              hover:bg-rose-100 hover:border-rose-400 hover:shadow-lg hover:shadow-rose-500/10
              focus:outline-none focus:ring-4 focus:ring-rose-200
              disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            <ShieldAlert className="w-5 h-5 text-rose-600 group-hover:scale-110 transition-transform" />
            <span>Es un ataque de ingeniería social</span>
          </button>
        </div>
      </div>
    </div>
  );
}
