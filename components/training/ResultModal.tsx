'use client';

import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import type { AnswerRecord } from '@/lib/types';
import { getCategoryMeta } from '@/lib/adaptive-engine';

interface ResultModalProps {
  answer: AnswerRecord;
  onNext: () => void;
  isLastScenario: boolean;
}

export function ResultModal({ answer, onNext, isLastScenario }: ResultModalProps) {
  const { escenario, es_correcta, tiempo_respuesta_ms } = answer;
  const categoryMeta = getCategoryMeta(escenario.categoria);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div
          className={`p-6 rounded-t-2xl ${
            es_correcta ? 'bg-success-50' : 'bg-danger-50'
          }`}
        >
          <div className="flex items-center gap-3">
            {es_correcta ? (
              <CheckCircle className="w-8 h-8 text-success-600 flex-shrink-0" />
            ) : (
              <XCircle className="w-8 h-8 text-danger-600 flex-shrink-0" />
            )}
            <div>
              <h3
                className={`text-lg font-bold ${
                  es_correcta ? 'text-success-700' : 'text-danger-700'
                }`}
              >
                {es_correcta ? '¡Correcto!' : 'Incorrecto'}
              </h3>
              <p className="text-sm text-surface-600">
                {escenario.es_ataque
                  ? 'Este era un ataque real'
                  : 'Este era un mensaje legítimo'}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-1.5 text-surface-500">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-mono">
                {(tiempo_respuesta_ms / 1000).toFixed(1)}s
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Category */}
          <div className="flex items-center gap-2">
            <span className="badge bg-surface-100 text-surface-600">
              {categoryMeta.label}
            </span>
            {!es_correcta && (
              <span className="badge bg-danger-100 text-danger-700">
                <AlertTriangle className="w-3 h-3" />
                Necesita práctica
              </span>
            )}
          </div>

          {/* Explanation */}
          <div className="bg-surface-50 rounded-xl p-4 border border-surface-200">
            <h4 className="text-sm font-semibold text-surface-700 mb-2">
              📚 ¿Por qué?
            </h4>
            <p className="text-sm text-surface-600 leading-relaxed">
              {escenario.explicacion}
            </p>
          </div>

          {/* Answer comparison */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface-50 rounded-xl p-3 border border-surface-200">
              <p className="text-xs text-surface-500 mb-1">Tu respuesta</p>
              <p
                className={`font-semibold text-sm ${
                  answer.respuesta_usuario ? 'text-danger-600' : 'text-success-600'
                }`}
              >
                {answer.respuesta_usuario ? '⚠️ Es un ataque' : '✅ Es legítimo'}
              </p>
            </div>
            <div className="bg-surface-50 rounded-xl p-3 border border-surface-200">
              <p className="text-xs text-surface-500 mb-1">Respuesta correcta</p>
              <p
                className={`font-semibold text-sm ${
                  escenario.es_ataque ? 'text-danger-600' : 'text-success-600'
                }`}
              >
                {escenario.es_ataque ? '⚠️ Es un ataque' : '✅ Es legítimo'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <button onClick={onNext} className="btn-primary w-full btn-lg">
            {isLastScenario ? 'Ver resultados finales' : 'Siguiente escenario →'}
          </button>
        </div>
      </div>
    </div>
  );
}
