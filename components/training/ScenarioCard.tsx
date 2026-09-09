'use client';

import { ShieldAlert, ShieldCheck, Mail, Phone, AlertTriangle, Package } from 'lucide-react';
import type { Escenario } from '@/lib/types';
import { getCategoryMeta, getDifficultyMeta } from '@/lib/adaptive-engine';

interface ScenarioCardProps {
  escenario: Escenario;
  onAnswer: (esAtaque: boolean) => void;
  isAnswering: boolean;
}

function CategoryIcon({ categoria }: { categoria: Escenario['categoria'] }) {
  const icons = {
    phishing: <Mail className="w-5 h-5" />,
    pretexting: <AlertTriangle className="w-5 h-5" />,
    baiting: <Package className="w-5 h-5" />,
    vishing: <Phone className="w-5 h-5" />,
  };
  return icons[categoria];
}

export function ScenarioCard({ escenario, onAnswer, isAnswering }: ScenarioCardProps) {
  const catMeta = getCategoryMeta(escenario.categoria);
  const diffMeta = getDifficultyMeta(escenario.dificultad);

  return (
    <div className="card animate-slide-up">
      {/* Header */}
      <div className="p-5 border-b border-surface-100">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className={`badge ${catMeta.bg} ${catMeta.color}`}>
              <CategoryIcon categoria={escenario.categoria} />
              {catMeta.label}
            </span>
            <span className={`badge bg-surface-100 ${diffMeta.color}`}>
              Nivel {diffMeta.label}
            </span>
          </div>
          <div className="text-xs text-surface-400 font-medium uppercase tracking-wide">
            Analiza este mensaje
          </div>
        </div>
        <h2 className="mt-3 text-lg font-bold text-surface-800">{escenario.titulo}</h2>
      </div>

      {/* Content */}
      <div className="p-5">
        <pre className="whitespace-pre-wrap font-sans text-sm text-surface-700 leading-relaxed bg-surface-50 rounded-xl p-4 border border-surface-200 min-h-32">
          {escenario.contenido}
        </pre>
      </div>

      {/* Actions */}
      <div className="px-5 pb-5 grid grid-cols-2 gap-3">
        <button
          onClick={() => onAnswer(false)}
          disabled={isAnswering}
          className="flex items-center justify-center gap-2 rounded-xl py-4 px-6 font-semibold text-sm transition-all duration-200
            bg-success-50 text-success-700 border-2 border-success-200
            hover:bg-success-100 hover:border-success-400
            focus:outline-none focus:ring-2 focus:ring-success-400 focus:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ShieldCheck className="w-5 h-5" />
          Es legítimo
        </button>
        <button
          onClick={() => onAnswer(true)}
          disabled={isAnswering}
          className="flex items-center justify-center gap-2 rounded-xl py-4 px-6 font-semibold text-sm transition-all duration-200
            bg-danger-50 text-danger-700 border-2 border-danger-200
            hover:bg-danger-100 hover:border-danger-400
            focus:outline-none focus:ring-2 focus:ring-danger-400 focus:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ShieldAlert className="w-5 h-5" />
          Es un ataque
        </button>
      </div>

      <p className="px-5 pb-4 text-center text-xs text-surface-400">
        Decide si este mensaje es un ataque de ingeniería social o legítimo
      </p>
    </div>
  );
}
