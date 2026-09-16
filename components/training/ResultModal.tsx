'use client';

import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ExternalLink,
  BookOpen,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  BrainCircuit,
} from 'lucide-react';
import type { AnswerRecord } from '@/lib/types';
import { getCategoryMeta, getVectorMeta } from '@/lib/adaptive-engine';

interface ResultModalProps {
  answer: AnswerRecord;
  onNext: () => void;
  isLastScenario: boolean;
}

export function ResultModal({
  answer,
  onNext,
  isLastScenario,
}: ResultModalProps) {
  const { escenario, es_correcta, tiempo_respuesta_ms } = answer;
  const categoryMeta = getCategoryMeta(escenario.categoria);
  const vectorMeta = getVectorMeta(escenario.vector_psicologico);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto border border-surface-100 animate-slide-up">
        {/* Header con resultado */}
        <div
          className={`p-6 sm:p-7 rounded-t-3xl border-b ${
            es_correcta
              ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
              : 'bg-rose-50/90 border-rose-200 text-rose-950'
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                  es_correcta
                    ? 'bg-emerald-500 text-white'
                    : 'bg-rose-500 text-white'
                }`}
              >
                {es_correcta ? (
                  <CheckCircle className="w-7 h-7" />
                ) : (
                  <XCircle className="w-7 h-7" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight">
                  {es_correcta ? '¡Identificación Correcta!' : 'Identificación Incorrecta'}
                </h3>
                <p className="text-xs sm:text-sm font-medium opacity-80 mt-0.5">
                  {escenario.es_ataque
                    ? 'Este escenario recrea un ATAQUE REAL de ingeniería social.'
                    : 'Este escenario representa una interacción LEGÍTIMA de control.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur px-3 py-1.5 rounded-full text-xs font-mono font-bold shadow-xs border border-surface-200 text-surface-700">
              <Clock className="w-3.5 h-3.5 text-surface-500" />
              <span>{(tiempo_respuesta_ms / 1000).toFixed(1)}s</span>
            </div>
          </div>
        </div>

        {/* Cuerpo del Modal */}
        <div className="p-6 sm:p-7 space-y-5">
          {/* Comparativa de Respuestas */}
          <div className="grid grid-cols-2 gap-3">
            <div
              className={`p-3.5 rounded-2xl border ${
                answer.respuesta_usuario === escenario.es_ataque
                  ? 'bg-emerald-50/50 border-emerald-200'
                  : 'bg-rose-50/50 border-rose-200'
              }`}
            >
              <p className="text-[11px] font-bold uppercase tracking-wider text-surface-500 mb-1">
                Tu decisión
              </p>
              <p
                className={`text-sm font-bold flex items-center gap-1.5 ${
                  answer.respuesta_usuario
                    ? 'text-rose-700'
                    : 'text-emerald-700'
                }`}
              >
                {answer.respuesta_usuario ? (
                  <ShieldAlert className="w-4 h-4" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
                {answer.respuesta_usuario ? 'Es un ataque' : 'Es legítimo'}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl border bg-surface-50 border-surface-200">
              <p className="text-[11px] font-bold uppercase tracking-wider text-surface-500 mb-1">
                Naturaleza real
              </p>
              <p
                className={`text-sm font-bold flex items-center gap-1.5 ${
                  escenario.es_ataque ? 'text-rose-700' : 'text-emerald-700'
                }`}
              >
                {escenario.es_ataque ? (
                  <ShieldAlert className="w-4 h-4" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
                {escenario.es_ataque ? 'Es un ataque real' : 'Es legítimo'}
              </p>
            </div>
          </div>

          {/* Dimensiones 2D evaluadas */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full border ${categoryMeta.bg} ${categoryMeta.color} ${categoryMeta.border}`}
            >
              Canal: {categoryMeta.label}
            </span>
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full border ${vectorMeta.bg} ${vectorMeta.color} ${vectorMeta.border}`}
            >
              Vector Psicológico: {vectorMeta.label}
            </span>
            {!es_correcta && (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Punto vulnerable detectado
              </span>
            )}
          </div>

          {/* Análisis Pedagógico / Por qué */}
          <div className="bg-surface-50 rounded-2xl p-5 border border-surface-200 space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-surface-700 flex items-center gap-1.5">
              <BrainCircuit className="w-4 h-4 text-brand-600" />
              Análisis de la Técnica
            </h4>
            <p className="text-sm text-surface-700 leading-relaxed font-sans">
              {escenario.explicacion}
            </p>
            <p className="text-xs text-surface-500 italic pt-1">
              <strong>Vector explotado ({vectorMeta.label}):</strong> {vectorMeta.desc}
            </p>
          </div>

          {/* FUENTE DOCUMENTADA REAL */}
          {escenario.fuente && (
            <div className="bg-brand-50/70 border border-brand-200/80 rounded-2xl p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black uppercase tracking-wider text-brand-800">
                    Evidencia y Fuente del Caso Real Documentado
                  </p>
                  <p className="text-xs text-surface-800 font-medium mt-1 leading-relaxed">
                    {escenario.fuente}
                  </p>
                  {escenario.fuente_url && (
                    <a
                      href={escenario.fuente_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-800 underline mt-2 transition-colors"
                    >
                      Consultar informe / comunicado oficial
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer con botón siguiente */}
        <div className="p-6 pt-0">
          <button
            onClick={onNext}
            className="btn-primary w-full btn-lg rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-brand-600/20"
          >
            <span>
              {isLastScenario
                ? 'Ver Análisis y Resultados Finales'
                : 'Continuar al Siguiente Escenario'}
            </span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
