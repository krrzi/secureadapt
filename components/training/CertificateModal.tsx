'use client';

import { useRef } from 'react';
import { Award, CheckCircle, Download, Printer, Shield, X } from 'lucide-react';

interface CertificateModalProps {
  nombre: string;
  email: string;
  totalSesiones: number;
  precisionGeneral: string;
  onClose: () => void;
}

export function CertificateModal({
  nombre,
  email,
  totalSesiones,
  precisionGeneral,
  onClose,
}: CertificateModalProps) {
  const certificateRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const fechaActual = new Date().toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const codigoValidacion = `SEC-${Math.abs(
    (email + nombre).split('').reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0)
  )
    .toString(16)
    .toUpperCase()
    .slice(0, 8)}-${new Date().getFullYear()}`;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full border border-surface-200 overflow-hidden my-6 animate-slide-up">
        {/* Modal Toolbar (hidden on print) */}
        <div className="p-4 bg-surface-100 border-b border-surface-200 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-brand-600" />
            <span className="text-sm font-bold text-surface-800">
              Certificado de Participación Experimental
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="btn-secondary btn-sm flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Guardar PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-surface-500 hover:text-surface-800 hover:bg-surface-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Body (Printable Area) */}
        <div
          ref={certificateRef}
          className="p-8 sm:p-14 bg-gradient-to-b from-white via-surface-50 to-white text-center relative border-8 border-double border-surface-300 m-4 rounded-2xl shadow-sm"
        >
          {/* Decorative Corner Ornaments */}
          <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-brand-600" />
          <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-brand-600" />
          <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-brand-600" />
          <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-brand-600" />

          {/* Logo & Header */}
          <div className="flex justify-center items-center gap-2 mb-3">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white shadow-md">
              <Shield className="w-6 h-6" />
            </div>
            <span className="text-2xl font-black tracking-tight text-surface-900">
              SecureAdapt
            </span>
          </div>
          <p className="text-xs uppercase tracking-[0.25em] text-brand-700 font-extrabold mb-8">
            Proyecto de Investigación Universitaria en Ciberseguridad Adaptativa
          </p>

          <p className="text-sm uppercase tracking-widest text-surface-400 font-bold mb-2">
            Certificado de Acreditación y Participación
          </p>
          <p className="text-xs text-surface-500 max-w-lg mx-auto mb-6">
            Por haber completado satisfactoriamente el programa de entrenamiento adaptativo contra
            ataques de ingeniería social basado en casos reales documentados.
          </p>

          {/* Recipient */}
          <div className="py-4 my-2 border-y border-surface-200">
            <h2 className="text-2xl sm:text-3xl font-black text-surface-900 tracking-tight">
              {nombre || 'Participante Experimental'}
            </h2>
            <p className="text-xs font-mono text-surface-500 mt-1">{email}</p>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto my-6 text-center">
            <div className="p-3 bg-white rounded-xl border border-surface-200">
              <p className="text-xs text-surface-500 font-medium">Sesiones Completadas</p>
              <p className="text-xl font-black text-brand-600 mt-0.5">{totalSesiones}</p>
            </div>
            <div className="p-3 bg-white rounded-xl border border-surface-200">
              <p className="text-xs text-surface-500 font-medium">Eficacia Global de Detección</p>
              <p className="text-xl font-black text-emerald-600 mt-0.5">{precisionGeneral}%</p>
            </div>
          </div>

          {/* Signatures / Validation */}
          <div className="mt-10 pt-6 border-t border-surface-200 flex flex-col sm:flex-row items-center justify-between text-xs text-surface-500 gap-4">
            <div className="text-left">
              <p className="font-semibold text-surface-700">Comité de Investigación</p>
              <p className="text-[11px] text-surface-400">Plataforma SecureAdapt v2.0</p>
              <p className="text-[11px] text-surface-400">Fecha de emisión: {fechaActual}</p>
            </div>

            <div className="flex items-center gap-2 bg-surface-100 px-3 py-2 rounded-xl border border-surface-200">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <div className="text-left font-mono text-[10px]">
                <p className="font-bold text-surface-700">Código de Verificación:</p>
                <p className="text-surface-500">{codigoValidacion}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
