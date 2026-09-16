'use client';

import { useState } from 'react';
import {
  User,
  Calendar,
  Target,
  Award,
  Swords,
  Download,
  Lock,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import type { Profile, MetricasCategoria, Badge } from '@/lib/types';
import { getCategoryMeta } from '@/lib/adaptive-engine';
import { CertificateModal } from '@/components/training/CertificateModal';

interface PerfilClientProps {
  profile: Profile | null;
  userEmail: string;
  sesiones: any[];
  metricas: MetricasCategoria[];
  badges: Badge[];
  totalRespuestas: number;
  precisionGeneral: string;
}

export function PerfilClient({
  profile,
  userEmail,
  sesiones,
  metricas,
  badges,
  totalRespuestas,
  precisionGeneral,
}: PerfilClientProps) {
  const [showCertificate, setShowCertificate] = useState(false);

  const memberSince = new Date(profile?.created_at ?? Date.now());

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-16">
      {/* Modal del Certificado */}
      {showCertificate && (
        <CertificateModal
          nombre={profile?.nombre ?? userEmail}
          email={userEmail}
          totalSesiones={sesiones.length}
          precisionGeneral={precisionGeneral}
          onClose={() => setShowCertificate(false)}
        />
      )}

      {/* Header del Perfil */}
      <div className="card p-6 sm:p-8 border-surface-200 bg-gradient-to-r from-surface-50 to-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-brand-600 text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-md shadow-brand-600/20 flex-shrink-0">
              {profile?.nombre?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-surface-900">
                  {profile?.nombre ?? 'Participante Experimental'}
                </h1>
                {profile?.rol === 'admin' ? (
                  <span className="badge bg-purple-100 text-purple-700 font-bold">
                    Admin
                  </span>
                ) : (
                  <span className="badge bg-brand-50 text-brand-700 font-bold border border-brand-200">
                    Sujeto Experimental
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-surface-500 font-mono">
                {userEmail}
              </p>
              <p className="text-xs text-surface-400 flex items-center gap-1 mt-1">
                <Calendar className="w-3.5 h-3.5" />
                Miembro desde{' '}
                {memberSince.toLocaleDateString('es-PE', {
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowCertificate(true)}
            className="btn-secondary flex items-center gap-2 text-xs sm:text-sm font-bold py-2.5 px-4 rounded-xl border-brand-200 hover:border-brand-300 hover:bg-brand-50/50 shadow-xs"
          >
            <Award className="w-4 h-4 text-brand-600" />
            <span>Emitir Certificado PDF</span>
          </button>
        </div>

        {/* Resumen numérico */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-surface-200 text-center">
          <div>
            <p className="text-2xl sm:text-3xl font-black text-brand-600">
              {sesiones.length}
            </p>
            <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider mt-0.5">
              Sesiones
            </p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-brand-600">
              {precisionGeneral}%
            </p>
            <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider mt-0.5">
              Precisión
            </p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-brand-600">
              {totalRespuestas}
            </p>
            <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider mt-0.5">
              Respuestas
            </p>
          </div>
        </div>
      </div>

      {/* Sistema de Insignias y Logros */}
      <div className="card p-6 sm:p-8 border-surface-200 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-surface-900 tracking-tight flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              Insignias y Logros de Resistencia
            </h2>
            <p className="text-xs text-surface-500 mt-0.5">
              Reconocimientos obtenidos por identificar técnicas documentadas específicas.
            </p>
          </div>
          <span className="text-xs font-bold text-surface-600 bg-surface-100 px-3 py-1 rounded-full">
            {badges.filter((b) => b.desbloqueado).length} de {badges.length} desbloqueados
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`p-4 rounded-2xl border transition-all ${
                badge.desbloqueado
                  ? 'bg-amber-50/40 border-amber-200/80 shadow-xs'
                  : 'bg-surface-50 border-surface-200 opacity-60'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl flex-shrink-0">{badge.icono}</span>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-surface-900">
                      {badge.titulo}
                    </h3>
                    {badge.desbloqueado ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-surface-400" />
                    )}
                  </div>
                  <p className="text-xs text-surface-600 leading-snug">
                    {badge.descripcion}
                  </p>
                  <div className="pt-2">
                    <div className="flex justify-between text-[10px] text-surface-400 font-bold mb-1">
                      <span>Progreso</span>
                      <span>
                        {badge.progresoActual}/{badge.progresoMeta}
                      </span>
                    </div>
                    <div className="w-full bg-surface-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full ${
                          badge.desbloqueado ? 'bg-amber-500' : 'bg-surface-400'
                        }`}
                        style={{
                          width: `${(badge.progresoActual / badge.progresoMeta) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rendimiento por Canal */}
      {metricas.length > 0 && (
        <div className="card p-6 sm:p-8 border-surface-200 space-y-4">
          <h2 className="text-lg font-black text-surface-900 tracking-tight">
            Eficacia por Canal Evaluado
          </h2>
          <div className="space-y-3">
            {metricas.map((m) => {
              const meta = getCategoryMeta(m.categoria);
              const pct = m.precision_pct ?? 0;
              return (
                <div key={m.categoria} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-surface-700">
                      {meta.label}
                    </span>
                    <span className="text-surface-500 font-medium">
                      {m.correctas}/{m.total} aciertos ({Math.round(pct)}%)
                    </span>
                  </div>
                  <div className="w-full bg-surface-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-700 ${
                        pct >= 70
                          ? 'bg-emerald-500'
                          : pct >= 50
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Historial de Sesiones */}
      <div className="card p-6 sm:p-8 border-surface-200 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-surface-900 tracking-tight">
            Historial de Sesiones
          </h2>
          <Link href="/entrenamiento" className="btn-primary btn-sm">
            Iniciar Nueva Sesión
          </Link>
        </div>

        {sesiones.length === 0 ? (
          <div className="text-center py-10 bg-surface-50 rounded-2xl border border-dashed border-surface-200">
            <Target className="w-10 h-10 text-surface-300 mx-auto mb-2" />
            <p className="text-xs text-surface-500 font-medium">
              Aún no has completado ninguna sesión de entrenamiento adaptativo.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {sesiones.map((s, i) => {
              const pct = s.precision_pct ?? 0;
              const durMin = s.duracion_segundos
                ? Math.floor(s.duracion_segundos / 60)
                : null;
              const durSec = s.duracion_segundos
                ? s.duracion_segundos % 60
                : null;

              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-4 rounded-2xl border border-surface-200 hover:bg-surface-50 transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                        pct >= 70
                          ? 'bg-emerald-50 text-emerald-700'
                          : pct >= 50
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      #{sesiones.length - i}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-surface-800">
                        Sesión de Entrenamiento Adaptativo
                      </p>
                      <p className="text-xs text-surface-400">
                        {new Date(s.iniciada_en).toLocaleDateString('es-PE', {
                          weekday: 'short',
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {durMin !== null && (
                          <span> · Duración: {durMin}m {durSec}s</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p
                      className={`text-lg font-black ${
                        pct >= 70
                          ? 'text-emerald-600'
                          : pct >= 50
                          ? 'text-amber-600'
                          : 'text-rose-600'
                      }`}
                    >
                      {Math.round(pct)}%
                    </p>
                    <p className="text-xs text-surface-400 font-semibold">
                      {s.correctas}/{s.total_escenarios} aciertos
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
