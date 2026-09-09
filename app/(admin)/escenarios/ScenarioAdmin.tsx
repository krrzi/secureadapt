'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Mail,
  Phone,
  Package,
  Search,
  Filter,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  getCategoryMeta,
  getDifficultyMeta,
} from '@/lib/adaptive-engine';
import type {
  Escenario,
  Categoria,
  Dificultad,
} from '@/lib/types';

type EscenarioForm = {
  titulo: string;
  contenido: string;
  categoria: Categoria;
  dificultad: Dificultad;
  es_ataque: boolean;
  explicacion: string;
  activo: boolean;
};

const EMPTY_FORM: EscenarioForm = {
  titulo: '',
  contenido: '',
  categoria: 'phishing',
  dificultad: 'bajo',
  es_ataque: true,
  explicacion: '',
  activo: true,
};

function CategoryBadge({ categoria }: { categoria: Categoria }) {
  const meta = getCategoryMeta(categoria);
  const I = {
    phishing: Mail,
    pretexting: AlertTriangle,
    baiting: Package,
    vishing: Phone,
  }[categoria];
  return (
    <span
      className={`badge ${meta.bg} ${meta.color} flex items-center gap-1 w-fit`}
    >
      <I className="w-3.5 h-3.5" />
      {meta.label}
    </span>
  );
}

export function ScenarioAdmin({
  initialEscenarios,
}: {
  initialEscenarios: Escenario[];
}) {
  const supabase = createClient();
  const [escenarios, setEscenarios] = useState<Escenario[]>(initialEscenarios);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<'all' | Categoria>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EscenarioForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<
    | null
    | { type: 'success' | 'error'; msg: string }
  >(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const filtered = escenarios.filter((e) => {
    if (filterCat !== 'all' && e.categoria !== filterCat) return false;
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      e.titulo.toLowerCase().includes(s) ||
      e.contenido.toLowerCase().includes(s) ||
      e.explicacion.toLowerCase().includes(s)
    );
  });

  const stats = {
    total: escenarios.length,
    activos: escenarios.filter((e) => e.activo).length,
    ataques: escenarios.filter((e) => e.es_ataque).length,
  };

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(e: Escenario) {
    setEditingId(e.id);
    setForm({
      titulo: e.titulo,
      contenido: e.contenido,
      categoria: e.categoria,
      dificultad: e.dificultad,
      es_ataque: e.es_ataque,
      explicacion: e.explicacion,
      activo: e.activo,
    });
    setModalOpen(true);
  }

  async function handleSubmit() {
    if (!form.titulo.trim() || !form.contenido.trim() || !form.explicacion.trim()) {
      setToast({
        type: 'error',
        msg: 'Faltan campos obligatorios (título, contenido, explicación).',
      });
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const { error } = await supabase
          .from('escenarios')
          .update(form)
          .eq('id', editingId);
        if (error) throw error;
        setEscenarios((prev) =>
          prev.map((p) =>
            p.id === editingId ? ({ ...p, ...form } as Escenario) : p
          )
        );
        setToast({ type: 'success', msg: 'Escenario actualizado correctamente' });
      } else {
        const { data, error } = await supabase
          .from('escenarios')
          .insert([form])
          .select()
          .single<Escenario>();
        if (error) throw error;
        if (data) setEscenarios((prev) => [data, ...prev]);
        setToast({ type: 'success', msg: 'Escenario creado correctamente' });
      }
      setModalOpen(false);
    } catch (err: any) {
      setToast({
        type: 'error',
        msg: err?.message ?? 'Error al guardar. Verifica RLS (solo admin puede editar).',
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, hardDelete: boolean) {
    try {
      if (hardDelete) {
        const { error } = await supabase
          .from('escenarios')
          .delete()
          .eq('id', id);
        if (error) throw error;
        setEscenarios((prev) => prev.filter((p) => p.id !== id));
        setToast({ type: 'success', msg: 'Escenario eliminado definitivamente' });
      } else {
        const { error } = await supabase
          .from('escenarios')
          .update({ activo: false })
          .eq('id', id);
        if (error) throw error;
        setEscenarios((prev) =>
          prev.map((p) =>
            p.id === id ? ({ ...p, activo: false } as Escenario) : p
          )
        );
        setToast({ type: 'success', msg: 'Escenario desactivado (soft delete)' });
      }
    } catch (err: any) {
      setToast({ type: 'error', msg: err?.message ?? 'Error al eliminar' });
    } finally {
      setConfirmDeleteId(null);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="section-title">Gestión de escenarios</h1>
          <p className="section-subtitle">
            {stats.total} escenarios · {stats.activos} activos · {stats.ataques} marcados como ataque
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="w-4 h-4" />
          Nuevo escenario
        </button>
      </div>

      {/* Stats mini */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4">
          <p className="text-xs text-surface-400 font-medium">Totales</p>
          <p className="text-2xl font-black text-surface-900 mt-1">
            {stats.total}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-surface-400 font-medium">Activos</p>
          <p className="text-2xl font-black text-success-600 mt-1">
            {stats.activos}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-surface-400 font-medium">Ataques</p>
          <p className="text-2xl font-black text-danger-600 mt-1">
            {stats.ataques}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-surface-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título, contenido o explicación…"
            className="input pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-surface-400" />
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value as 'all' | Categoria)}
            className="input w-auto sm:w-40"
          >
            <option value="all">Todas</option>
            <option value="phishing">Phishing</option>
            <option value="pretexting">Pretexting</option>
            <option value="baiting">Baiting</option>
            <option value="vishing">Vishing</option>
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-50 text-surface-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left py-3 px-4 font-semibold">Título</th>
                <th className="text-left py-3 px-3 font-semibold">Categoría</th>
                <th className="text-left py-3 px-3 font-semibold">Dificultad</th>
                <th className="text-center py-3 px-3 font-semibold">Ataque</th>
                <th className="text-center py-3 px-3 font-semibold">Activo</th>
                <th className="text-right py-3 px-4 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-surface-400">
                    No hay escenarios para estos filtros.
                  </td>
                </tr>
              )}
              {filtered.map((e) => {
                const dMeta = getDifficultyMeta(e.dificultad);
                return (
                  <tr
                    key={e.id}
                    className={`hover:bg-surface-50 transition-colors ${
                      !e.activo ? 'opacity-50' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="font-semibold text-surface-800 line-clamp-1 max-w-sm">
                        {e.titulo}
                      </div>
                      <div className="text-xs text-surface-400 line-clamp-1 max-w-sm mt-0.5">
                        {e.contenido}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <CategoryBadge categoria={e.categoria} />
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`badge bg-surface-100 font-semibold ${dMeta.color}`}
                      >
                        {dMeta.label}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {e.es_ataque ? (
                        <span className="badge bg-danger-100 text-danger-700">
                          Sí
                        </span>
                      ) : (
                        <span className="badge bg-success-100 text-success-700">
                          No
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {e.activo ? (
                        <CheckCircle2 className="w-5 h-5 text-success-500 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-surface-300 mx-auto" />
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1.5 justify-end">
                        <button
                          title="Editar"
                          onClick={() => openEdit(e)}
                          className="p-2 rounded-lg text-surface-500 hover:bg-brand-50 hover:text-brand-600 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          title={e.activo ? 'Eliminar' : 'Eliminar definitivo'}
                          onClick={() => setConfirmDeleteId(e.id)}
                          className="p-2 rounded-lg text-surface-500 hover:bg-danger-50 hover:text-danger-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear / Editar */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="sticky top-0 bg-white border-b border-surface-100 p-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-surface-900">
                  {editingId ? 'Editar escenario' : 'Nuevo escenario'}
                </h2>
                <p className="text-xs text-surface-400">
                  {editingId ? 'Modifica los campos y guarda los cambios' : 'Añade un escenario nuevo al banco de entrenamiento'}
                </p>
              </div>
              <button
                title="Cerrar"
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-lg text-surface-400 hover:bg-surface-100 hover:text-surface-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="label">Título del escenario *</label>
                  <input
                    className="input"
                    value={form.titulo}
                    onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                    placeholder="Ej: Urgente: Confirmar datos de tu cuenta"
                  />
                </div>

                <div>
                  <label className="label">Categoría *</label>
                  <select
                    className="input"
                    value={form.categoria}
                    onChange={(e) =>
                      setForm({ ...form, categoria: e.target.value as Categoria })
                    }
                  >
                    <option value="phishing">Phishing (email/web)</option>
                    <option value="pretexting">Pretexting (falsa identidad)</option>
                    <option value="baiting">Baiting (anzuelo físico/digital)</option>
                    <option value="vishing">Vishing (por teléfono)</option>
                  </select>
                </div>
                <div>
                  <label className="label">Dificultad *</label>
                  <select
                    className="input"
                    value={form.dificultad}
                    onChange={(e) =>
                      setForm({ ...form, dificultad: e.target.value as Dificultad })
                    }
                  >
                    <option value="bajo">Bajo</option>
                    <option value="medio">Medio</option>
                    <option value="alto">Alto</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="label">Contenido simulado *</label>
                  <p className="text-xs text-surface-400 mb-1.5">
                    Texto tal cual lo verá el usuario (email, mensaje, guión de llamada…).
                  </p>
                  <textarea
                    className="input min-h-40 font-mono text-xs leading-relaxed"
                    value={form.contenido}
                    onChange={(e) =>
                      setForm({ ...form, contenido: e.target.value })
                    }
                    placeholder="Asunto: Tu factura vence hoy..."
                  />
                </div>

                <div className="md:col-span-2 flex flex-col sm:flex-row gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.es_ataque}
                      onChange={(e) =>
                        setForm({ ...form, es_ataque: e.target.checked })
                      }
                      className="w-4 h-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span className="text-sm text-surface-700 font-medium">
                      Este escenario <strong className="text-danger-600">SÍ es un ataque real</strong>
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.activo}
                      onChange={(e) =>
                        setForm({ ...form, activo: e.target.checked })
                      }
                      className="w-4 h-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span className="text-sm text-surface-700 font-medium">Escenario activo (visible en entrenamiento)</span>
                  </label>
                </div>

                <div className="md:col-span-2">
                  <label className="label">Explicación didáctica *</label>
                  <p className="text-xs text-surface-400 mb-1.5">
                    Se muestra después de la respuesta del usuario. Explica señales de detección y por qué es o no ataque.
                  </p>
                  <textarea
                    className="input min-h-32"
                    value={form.explicacion}
                    onChange={(e) =>
                      setForm({ ...form, explicacion: e.target.value })
                    }
                    placeholder="Señales claras: 1) el dominio no coincide, 2) urgencia, 3) petición de datos sensibles..."
                  />
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-surface-100 p-5 flex justify-end gap-2">
              <button
                onClick={() => setModalOpen(false)}
                disabled={saving}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="btn-primary flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Guardando…
                  </>
                ) : editingId ? (
                  'Guardar cambios'
                ) : (
                  'Crear escenario'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmación Delete */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-slide-up">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-danger-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-danger-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-surface-900">Eliminar escenario</h3>
                <p className="text-sm text-surface-500 mt-1">
                  Elige cómo quieres proceder. Recomendamos desactivarlo (soft delete) para no romper el historial de respuestas existente.
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-col sm:flex-row gap-2 sm:justify-end">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId, false)}
                className="btn-secondary border-warning-200 text-warning-700 hover:bg-warning-50"
              >
                Solo desactivar
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId, true)}
                className="btn-danger"
              >
                Eliminar definitivamente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-[70] px-4 py-3 rounded-xl shadow-lg animate-slide-up flex items-center gap-2 text-sm font-medium ${
            toast.type === 'success'
              ? 'bg-success-600 text-white'
              : 'bg-danger-600 text-white'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
