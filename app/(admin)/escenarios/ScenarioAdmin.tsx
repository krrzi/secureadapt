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
  Mail,
  Phone,
  MessageSquare,
  Package,
  Search,
  Filter,
  ExternalLink,
  BookOpen,
  Eye,
  EyeOff,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  getCategoryMeta,
  getVectorMeta,
  getDifficultyMeta,
  CATEGORIAS,
  VECTORES_PSICOLOGICOS,
  DIFICULTADES,
} from '@/lib/adaptive-engine';
import type {
  Escenario,
  Categoria,
  VectorPsicologico,
  Dificultad,
} from '@/lib/types';

type EscenarioForm = {
  titulo: string;
  contenido: string;
  categoria: Categoria;
  vector_psicologico: VectorPsicologico;
  dificultad: Dificultad;
  es_ataque: boolean;
  explicacion: string;
  fuente: string;
  fuente_url: string;
  activo: boolean;
};

const EMPTY_FORM: EscenarioForm = {
  titulo: '',
  contenido: '',
  categoria: 'phishing',
  vector_psicologico: 'urgencia',
  dificultad: 'bajo',
  es_ataque: true,
  explicacion: '',
  fuente: '',
  fuente_url: '',
  activo: true,
};

export function ScenarioAdmin({
  initialEscenarios,
}: {
  initialEscenarios: Escenario[];
}) {
  const supabase = createClient();
  const [escenarios, setEscenarios] = useState<Escenario[]>(initialEscenarios);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<'all' | Categoria>('all');
  const [filterVec, setFilterVec] = useState<'all' | VectorPsicologico>('all');
  const [filterDiff, setFilterDiff] = useState<'all' | Dificultad>('all');
  const [filterTipo, setFilterTipo] = useState<'all' | 'ataque' | 'legitimo'>('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EscenarioForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<
    null | { type: 'success' | 'error'; msg: string }
  >(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // Filtrado de escenarios
  const filtered = escenarios.filter((e) => {
    if (filterCat !== 'all' && e.categoria !== filterCat) return false;
    if (filterVec !== 'all' && e.vector_psicologico !== filterVec) return false;
    if (filterDiff !== 'all' && e.dificultad !== filterDiff) return false;
    if (filterTipo === 'ataque' && !e.es_ataque) return false;
    if (filterTipo === 'legitimo' && e.es_ataque) return false;

    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      e.titulo.toLowerCase().includes(s) ||
      e.contenido.toLowerCase().includes(s) ||
      e.explicacion.toLowerCase().includes(s) ||
      (e.fuente && e.fuente.toLowerCase().includes(s))
    );
  });

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const handleOpenEdit = (esc: Escenario) => {
    setEditingId(esc.id);
    setForm({
      titulo: esc.titulo,
      contenido: esc.contenido,
      categoria: esc.categoria,
      vector_psicologico: esc.vector_psicologico ?? 'urgencia',
      dificultad: esc.dificultad,
      es_ataque: esc.es_ataque,
      explicacion: esc.explicacion,
      fuente: esc.fuente ?? '',
      fuente_url: esc.fuente_url ?? '',
      activo: esc.activo,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validación obligatoria: si es ataque, debe tener fuente documentada
    if (form.es_ataque && !form.fuente.trim()) {
      setToast({
        type: 'error',
        msg: 'Validación obligatoria: Todo escenario de ataque debe contar con su fuente real documentada.',
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        titulo: form.titulo.trim(),
        contenido: form.contenido.trim(),
        categoria: form.categoria,
        vector_psicologico: form.vector_psicologico,
        dificultad: form.dificultad,
        es_ataque: form.es_ataque,
        explicacion: form.explicacion.trim(),
        fuente: form.fuente.trim() || null,
        fuente_url: form.fuente_url.trim() || null,
        activo: form.activo,
      };

      if (editingId) {
        // Update
        const { data, error } = await supabase
          .from('escenarios')
          .update(payload)
          .eq('id', editingId)
          .select()
          .single();

        if (error) throw error;
        setEscenarios((prev) =>
          prev.map((item) => (item.id === editingId ? (data as Escenario) : item))
        );
        setToast({ type: 'success', msg: 'Escenario actualizado con éxito.' });
      } else {
        // Create
        const { data, error } = await supabase
          .from('escenarios')
          .insert(payload)
          .select()
          .single();

        if (error) throw error;
        setEscenarios((prev) => [data as Escenario, ...prev]);
        setToast({ type: 'success', msg: 'Escenario real creado con éxito.' });
      }

      setModalOpen(false);
    } catch (err: any) {
      setToast({
        type: 'error',
        msg: err.message ?? 'Error al guardar el escenario.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('escenarios').delete().eq('id', id);
      if (error) throw error;

      setEscenarios((prev) => prev.filter((item) => item.id !== id));
      setToast({ type: 'success', msg: 'Escenario eliminado correctamente.' });
    } catch (err: any) {
      setToast({
        type: 'error',
        msg: err.message ?? 'Error al eliminar el escenario.',
      });
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const handleToggleActivo = async (esc: Escenario) => {
    try {
      const { error } = await supabase
        .from('escenarios')
        .update({ activo: !esc.activo })
        .eq('id', esc.id);

      if (error) throw error;
      setEscenarios((prev) =>
        prev.map((item) =>
          item.id === esc.id ? { ...item, activo: !esc.activo } : item
        )
      );
    } catch (err: any) {
      setToast({ type: 'error', msg: err.message ?? 'Error al actualizar estado.' });
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-xl flex items-center gap-3 border text-sm font-semibold animate-slide-up ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600" />
          )}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-surface-900 tracking-tight">
            Gestión del Banco de Escenarios
          </h1>
          <p className="text-xs sm:text-sm text-surface-500 mt-1">
            Administración de casos documentados con categorización bidimensional y fuentes oficiales.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="btn-primary flex items-center gap-2 shadow-md shadow-brand-600/20 py-2.5 px-4 rounded-xl"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Escenario Real</span>
        </button>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="card p-5 border-surface-200 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-surface-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por título, técnica, explicación o fuente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10 text-xs sm:text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          {/* Canal */}
          <div>
            <label className="text-[10px] font-bold text-surface-500 uppercase tracking-wider block mb-1">
              Canal / Categoría
            </label>
            <select
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value as any)}
              className="input text-xs py-1.5"
            >
              <option value="all">Todas las categorías</option>
              {CATEGORIAS.map((cat) => (
                <option key={cat} value={cat}>
                  {getCategoryMeta(cat).label}
                </option>
              ))}
            </select>
          </div>

          {/* Vector */}
          <div>
            <label className="text-[10px] font-bold text-surface-500 uppercase tracking-wider block mb-1">
              Vector Psicológico
            </label>
            <select
              value={filterVec}
              onChange={(e) => setFilterVec(e.target.value as any)}
              className="input text-xs py-1.5"
            >
              <option value="all">Todos los vectores</option>
              {VECTORES_PSICOLOGICOS.map((vec) => (
                <option key={vec} value={vec}>
                  {getVectorMeta(vec).label}
                </option>
              ))}
            </select>
          </div>

          {/* Dificultad */}
          <div>
            <label className="text-[10px] font-bold text-surface-500 uppercase tracking-wider block mb-1">
              Dificultad
            </label>
            <select
              value={filterDiff}
              onChange={(e) => setFilterDiff(e.target.value as any)}
              className="input text-xs py-1.5"
            >
              <option value="all">Todas las dificultades</option>
              {DIFICULTADES.map((d) => (
                <option key={d} value={d}>
                  {getDifficultyMeta(d).label}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo */}
          <div>
            <label className="text-[10px] font-bold text-surface-500 uppercase tracking-wider block mb-1">
              Tipo de Caso
            </label>
            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value as any)}
              className="input text-xs py-1.5"
            >
              <option value="all">Todos los tipos</option>
              <option value="ataque">Ataque Real</option>
              <option value="legitimo">Control Legítimo</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-surface-500 pt-2 border-t border-surface-100">
          <span>Mostrando {filtered.length} de {escenarios.length} escenarios en total</span>
          {(filterCat !== 'all' || filterVec !== 'all' || filterDiff !== 'all' || filterTipo !== 'all' || search) && (
            <button
              onClick={() => {
                setFilterCat('all');
                setFilterVec('all');
                setFilterDiff('all');
                setFilterTipo('all');
                setSearch('');
              }}
              className="text-brand-600 hover:text-brand-800 font-bold"
            >
              Restablecer filtros
            </button>
          )}
        </div>
      </div>

      {/* Tabla de Escenarios */}
      <div className="card overflow-hidden border-surface-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-surface-50 border-b border-surface-200 text-surface-600 text-[11px] font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">Escenario</th>
                <th className="p-4">Canal & Vector</th>
                <th className="p-4">Nivel</th>
                <th className="p-4">Tipo</th>
                <th className="p-4">Fuente Real</th>
                <th className="p-4">Estado</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200">
              {filtered.map((esc) => {
                const catMeta = getCategoryMeta(esc.categoria);
                const vecMeta = getVectorMeta(esc.vector_psicologico);
                const diffMeta = getDifficultyMeta(esc.dificultad);

                return (
                  <tr key={esc.id} className="hover:bg-surface-50/70 transition-colors">
                    <td className="p-4 max-w-xs">
                      <p className="font-bold text-surface-900 leading-snug">
                        {esc.titulo}
                      </p>
                      <p className="text-[11px] text-surface-500 line-clamp-1 mt-0.5 font-mono">
                        {esc.contenido}
                      </p>
                    </td>

                    <td className="p-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <span
                          className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${catMeta.bg} ${catMeta.color} ${catMeta.border}`}
                        >
                          {catMeta.label}
                        </span>
                        <div>
                          <span
                            className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border ${vecMeta.bg} ${vecMeta.color} ${vecMeta.border}`}
                          >
                            {vecMeta.label}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 whitespace-nowrap">
                      <span className={`badge bg-surface-100 ${diffMeta.color} text-xs font-semibold`}>
                        {diffMeta.label}
                      </span>
                    </td>

                    <td className="p-4 whitespace-nowrap">
                      {esc.es_ataque ? (
                        <span className="badge bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[11px]">
                          Ataque
                        </span>
                      ) : (
                        <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[11px]">
                          Legítimo
                        </span>
                      )}
                    </td>

                    <td className="p-4 max-w-xs">
                      {esc.fuente ? (
                        <div className="space-y-0.5">
                          <p className="text-xs text-surface-700 font-medium line-clamp-2">
                            {esc.fuente}
                          </p>
                          {esc.fuente_url && (
                            <a
                              href={esc.fuente_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-brand-600 hover:text-brand-800 font-bold inline-flex items-center gap-1"
                            >
                              Enlace <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-surface-400 text-xs italic">
                          Control legítimo
                        </span>
                      )}
                    </td>

                    <td className="p-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleActivo(esc)}
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                          esc.activo
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-surface-200 text-surface-600 hover:bg-surface-300'
                        }`}
                        title="Clic para activar/desactivar"
                      >
                        {esc.activo ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>

                    <td className="p-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(esc)}
                          className="p-1.5 rounded-lg text-surface-600 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                          title="Editar escenario"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(esc.id)}
                          className="p-1.5 rounded-lg text-surface-600 hover:text-danger-600 hover:bg-danger-50 transition-colors"
                          title="Eliminar escenario"
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-surface-200 overflow-hidden my-8 animate-slide-up">
            <div className="p-6 bg-surface-50 border-b border-surface-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-surface-900">
                  {editingId ? 'Editar Escenario' : 'Crear Nuevo Escenario Real'}
                </h3>
                <p className="text-xs text-surface-500 mt-0.5">
                  Los escenarios de ataque deben incluir obligatoriamente su referencia real documentada.
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-surface-500 hover:bg-surface-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs sm:text-sm">
              {/* Título */}
              <div>
                <label className="block text-xs font-bold text-surface-700 uppercase tracking-wider mb-1">
                  Título del Escenario *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Plan de Reclutamiento 2011 (Caso RSA SecurID)"
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  className="input text-xs sm:text-sm"
                />
              </div>

              {/* Canal y Vector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-surface-700 uppercase tracking-wider mb-1">
                    Canal / Categoría *
                  </label>
                  <select
                    value={form.categoria}
                    onChange={(e) => setForm({ ...form, categoria: e.target.value as any })}
                    className="input text-xs sm:text-sm"
                  >
                    {CATEGORIAS.map((cat) => (
                      <option key={cat} value={cat}>
                        {getCategoryMeta(cat).label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-surface-700 uppercase tracking-wider mb-1">
                    Vector Psicológico *
                  </label>
                  <select
                    value={form.vector_psicologico}
                    onChange={(e) =>
                      setForm({ ...form, vector_psicologico: e.target.value as any })
                    }
                    className="input text-xs sm:text-sm"
                  >
                    {VECTORES_PSICOLOGICOS.map((vec) => (
                      <option key={vec} value={vec}>
                        {getVectorMeta(vec).label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dificultad y Tipo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-surface-700 uppercase tracking-wider mb-1">
                    Dificultad *
                  </label>
                  <select
                    value={form.dificultad}
                    onChange={(e) => setForm({ ...form, dificultad: e.target.value as any })}
                    className="input text-xs sm:text-sm"
                  >
                    {DIFICULTADES.map((d) => (
                      <option key={d} value={d}>
                        {getDifficultyMeta(d).label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-surface-700 uppercase tracking-wider mb-1">
                    Naturaleza del Escenario
                  </label>
                  <div className="flex items-center gap-4 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-xs">
                      <input
                        type="radio"
                        name="es_ataque"
                        checked={form.es_ataque}
                        onChange={() => setForm({ ...form, es_ataque: true })}
                        className="text-rose-600"
                      />
                      <span className="text-rose-700">Ataque Real</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-xs">
                      <input
                        type="radio"
                        name="es_ataque"
                        checked={!form.es_ataque}
                        onChange={() => setForm({ ...form, es_ataque: false })}
                        className="text-emerald-600"
                      />
                      <span className="text-emerald-700">Control Legítimo</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Contenido simulado */}
              <div>
                <label className="block text-xs font-bold text-surface-700 uppercase tracking-wider mb-1">
                  Contenido Recreado (Texto, Correo o Transcripción) *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Escribe la simulación del mensaje recreando la técnica..."
                  value={form.contenido}
                  onChange={(e) => setForm({ ...form, contenido: e.target.value })}
                  className="input font-mono text-xs"
                />
              </div>

              {/* Explicación */}
              <div>
                <label className="block text-xs font-bold text-surface-700 uppercase tracking-wider mb-1">
                  Explicación Pedagógica *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explica qué técnica se utiliza y por qué es o no un ataque..."
                  value={form.explicacion}
                  onChange={(e) => setForm({ ...form, explicacion: e.target.value })}
                  className="input text-xs sm:text-sm"
                />
              </div>

              {/* Fuente Documentada (Obligatoria si es_ataque = true) */}
              <div
                className={`p-4 rounded-2xl border ${
                  form.es_ataque
                    ? 'bg-brand-50/60 border-brand-200'
                    : 'bg-surface-50 border-surface-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-brand-900">
                    Fuente Oficial Documentada {form.es_ataque && '(Obligatoria para Ataques) *'}
                  </label>
                  {form.es_ataque && (
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                      Requisito Académico
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  required={form.es_ataque}
                  placeholder="Ej: Twitter Inc., Comunicado Oficial de Incidentes (julio 2020) & U.S. DOJ"
                  value={form.fuente}
                  onChange={(e) => setForm({ ...form, fuente: e.target.value })}
                  className="input text-xs sm:text-sm bg-white mb-2"
                />

                <input
                  type="url"
                  placeholder="URL opcional de referencia (https://...)"
                  value={form.fuente_url}
                  onChange={(e) => setForm({ ...form, fuente_url: e.target.value })}
                  className="input text-xs sm:text-sm bg-white"
                />
              </div>

              {/* Activo switch */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="activo"
                  checked={form.activo}
                  onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                  className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                />
                <label htmlFor="activo" className="text-xs font-bold text-surface-700 cursor-pointer">
                  Escenario disponible para el motor adaptativo de entrenamiento
                </label>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-surface-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-secondary"
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary flex items-center gap-2"
                  disabled={saving}
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingId ? 'Guardar Cambios' : 'Crear Escenario'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmar Eliminación */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 border border-surface-200 text-center space-y-4 animate-slide-up">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-surface-900">
                ¿Eliminar este escenario?
              </h3>
              <p className="text-xs text-surface-500 mt-1">
                Esta acción es irreversible y eliminará este escenario del banco experimental.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                className="btn-danger flex-1"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
