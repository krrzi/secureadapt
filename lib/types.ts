// ── Global Types for SecureAdapt ─────────────────────────────

export type Categoria = 'phishing' | 'pretexting' | 'baiting' | 'vishing';
export type Dificultad = 'bajo' | 'medio' | 'alto';
export type Rol = 'usuario' | 'admin';

export interface Profile {
  id: string;
  user_id: string;
  rol: Rol;
  nombre: string | null;
  created_at: string;
}

export interface Escenario {
  id: string;
  titulo: string;
  contenido: string;
  categoria: Categoria;
  dificultad: Dificultad;
  es_ataque: boolean;
  explicacion: string;
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

export interface MetricasGlobalesCategoria {
  categoria: Categoria;
  total_respuestas: number;
  correctas: number;
  precision_pct: number;
  usuarios_activos: number;
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

export interface TrainingState {
  sesionId: string;
  escenarios: Escenario[];
  currentIndex: number;
  startTime: number;         // timestamp ms cuando se mostró el escenario actual
  answers: AnswerRecord[];
  isComplete: boolean;
}

export interface AnswerRecord {
  escenario: Escenario;
  respuesta_usuario: boolean;
  es_correcta: boolean;
  tiempo_respuesta_ms: number;
}

// ── Adaptive Engine ───────────────────────────────────────────

export interface CategoryStats {
  categoria: Categoria;
  total: number;
  correctas: number;
  racha_correctas: number;   // consecutive correct answers
  racha_incorrectas: number; // consecutive incorrect answers
}

export interface AdaptiveWeights {
  phishing: number;
  pretexting: number;
  baiting: number;
  vishing: number;
}

export interface AdaptiveConfig {
  totalScenarios: number;
  weights: AdaptiveWeights;
  preferredDifficulty: Record<Categoria, Dificultad>;
}
