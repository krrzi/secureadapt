// ── Global Types for SecureAdapt ─────────────────────────────

export type Categoria = 'phishing' | 'vishing' | 'smishing' | 'pretexting' | 'baiting';

export type VectorPsicologico =
  | 'urgencia'
  | 'autoridad'
  | 'confianza'
  | 'recompensa'
  | 'amenaza'
  | 'curiosidad';

export type Dificultad = 'bajo' | 'medio' | 'alto';
export type Rol = 'usuario' | 'admin';

export interface Profile {
  id: string;
  user_id: string;
  rol: Rol;
  nombre: string | null;
  email: string | null;
  created_at: string;
}

export interface Escenario {
  id: string;
  titulo: string;
  contenido: string;
  categoria: Categoria;
  vector_psicologico: VectorPsicologico;
  dificultad: Dificultad;
  es_ataque: boolean;
  explicacion: string;
  fuente?: string | null;
  fuente_url?: string | null;
  activo: boolean;
  created_at: string;
}

export interface Sesion {
  id: string;
  usuario_id: string;
  iniciada_en: string;
  finalizada_en: string | null;
  total_escenarios: number;
  correctas: number;
}

export interface Respuesta {
  id: string;
  sesion_id: string;
  escenario_id: string;
  usuario_id: string;
  respuesta_usuario: boolean;
  respuesta_correcta: boolean;
  es_correcta: boolean;
  tiempo_respuesta_ms: number;
  created_at: string;
}

// ── Extended / Joined Types ───────────────────────────────────

export interface RespuestaConEscenario extends Respuesta {
  escenarios: Escenario;
}

export interface SesionConMetricas extends Sesion {
  precision_pct: number;
  duracion_segundos: number | null;
}

// ── Dashboard / Analytics ─────────────────────────────────────

export interface MetricasCategoria {
  categoria: Categoria;
  total: number;
  correctas: number;
  precision_pct: number;
  tiempo_promedio_ms: number;
}

export interface MetricasVector {
  vector: VectorPsicologico;
  total: number;
  correctas: number;
  precision_pct: number;
}

export interface PerfilRiesgoCruzado {
  categoria: Categoria;
  vector: VectorPsicologico;
  total: number;
  fallos: number;
  tasa_fallo_pct: number;
  precision_pct: number;
}

export interface CasoSuperado {
  id: string;
  titulo: string;
  categoria: Categoria;
  vector_psicologico: VectorPsicologico;
  fuente: string;
  fuente_url?: string | null;
  tiempo_respuesta_ms: number;
  fecha: string;
}

export interface UserProgress {
  user_id: string;
  nombre: string | null;
  email: string;
  total_sesiones: number;
  total_respuestas: number;
  precision_general: number;
}

// ── Training Session State ────────────────────────────────────

export interface AnswerRecord {
  escenario: Escenario;
  respuesta_usuario: boolean;
  es_correcta: boolean;
  tiempo_respuesta_ms: number;
}

export interface TrainingState {
  sesionId: string;
  escenarios: Escenario[];
  currentIndex: number;
  startTime: number;
  answers: AnswerRecord[];
  isComplete: boolean;
}

// ── Adaptive Engine Types (2D) ───────────────────────────────

export interface AdaptiveConfig {
  totalScenarios: number;
  categoryWeights: Record<Categoria, number>;
  vectorWeights: Record<VectorPsicologico, number>;
  preferredDifficulty: Record<Categoria, Dificultad>;
  primaryFocusCategory?: Categoria;
  primaryFocusVector?: VectorPsicologico;
}

// ── Badges / Achievements ─────────────────────────────────────

export interface Badge {
  id: string;
  titulo: string;
  descripcion: string;
  icono: string;
  desbloqueado: boolean;
  progresoActual: number;
  progresoMeta: number;
}
