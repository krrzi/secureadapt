# SecureAdapt — Especificación de Completación

## Problema

El proyecto SecureAdapt está parcialmente generado. Existe estructura base, tipado, motor adaptativo funcional, layouts, auth base y UI de entrenamiento/dashboard, pero carece de piezas CRÍTICAS sin las cuales el proyecto no puede correr: no hay esquema de Supabase (tablas/RLS/views/triggers), no hay landing page, no existen las páginas de admin, el dashboard apunta a vistas SQL inexistentes y el registro no crea el perfil de usuario. El objetivo es llevar el proyecto del ~45% actual al 100% de cumplimiento del spec original.

## Usuarios

- **Usuario (rol: `usuario`)**: Persona que entrena contra ataques de ingeniería social. Tiene acceso a entrenamiento, dashboard propio, perfil.
- **Admin (rol: `admin`)**: Gestor que crea/edita/elimina escenarios y visualiza métricas globales de todos los usuarios.

## Objetivos

1. Que el proyecto compile y corra con `npm install && npm run dev` sin errores de configuración ni rutas rotas.
2. Cumplir el 100% del spec original (stack, auth/roles, CRUD escenarios, motor adaptativo real, registros, dashboards, extras de UI/UX).
3. Que el despliegue en Vercel requiera solo variables de entorno de Supabase.

## No-objetivos

- No agregar features fuera del spec original (ej: chat, gamificación extra, integración de email transaccional, etc.).
- No reemplazar Supabase Auth ni Postgres por otro proveedor.
- No reescribir en Pages Router ni cambiar la pila tecnológica.

---

## AUDITORÍA DEL ESTADO ACTUAL (Línea base)

### Leyenda: ✅ FUNCIONAL / ⚠️ A MEDIAS / ❌ ROTO / 🚫 NO EXISTE

#### Configuración del proyecto
| Archivo | Estado | Notas |
|---|---|---|
| `package.json` | ✅ FUNCIONAL | Deps correctas: Next 14, Supabase SSR/JS, Recharts, Lucide, UUID. |
| `tsconfig.json` | ✅ FUNCIONAL | Paths `@/*`, strict mode activado. |
| `tailwind.config.js` | ✅ FUNCIONAL | Paleta brand/danger/success/warning/surface + animaciones + fuente Inter. |
| `next.config.js` | ✅ FUNCIONAL | (mínimo, no necesita más). |
| `.env.example` | ⚠️ A MEDIAS | Falta indicar cómo crear tablas/RLS en Supabase. Vars presentes son correctas. |
| `middleware.ts` | ⚠️ A MEDIAS | Lógica de protección OK, pero `/` es pública sin landing page existente. Check admin `/admin/*` correcto. |

#### Tipado y librerías
| Archivo | Estado | Notas |
|---|---|---|
| `lib/types.ts` | ✅ FUNCIONAL | Todos los tipos del spec + extensiones para vistas/dashboards. |
| `lib/supabase/client.ts` | ✅ FUNCIONAL | Browser client correcto. |
| `lib/supabase/server.ts` | ✅ FUNCIONAL | Server client correcto con cookies. |
| `lib/adaptive-engine.ts` | ✅ FUNCIONAL | **Lógica REAL**: `buildAdaptiveConfig` (reglas 2 fallos → peso ×2; 3 aciertos → dificultad↑; <50% precision → peso ×1.5), `selectScenarios` (asignación ponderada por slots + anti-repetición), `computeStreaksFromHistory`, `calcularErrores` FP/FN. No es UI sin lógica. |

#### Layouts y autenticación
| Archivo | Estado | Notas |
|---|---|---|
| `app/layout.tsx` | ✅ FUNCIONAL | Root + Google Fonts Inter. |
| `app/globals.css` | ✅ FUNCIONAL | Utility classes de alta calidad: `.btn-primary/.btn-secondary/.btn-danger`, `.card`, `.input`, `.badge`, `.page-container`. |
| `app/(auth)/layout.tsx` | ✅ FUNCIONAL | |
| `app/(auth)/login/page.tsx` | ✅ FUNCIONAL | Login + loading + error states. |
| `app/(auth)/registro/page.tsx` | ⚠️ A MEDIAS | Valida password 8+ chars, llama signUp con `options.data.nombre`. **PERO no crea fila en `profiles`**: depende de trigger SQL que NO EXISTE. |
| `app/(app)/layout.tsx` | ✅ FUNCIONAL | Obtiene user y profile; inyecta Navbar. |
| `app/(admin)/layout.tsx` | ✅ FUNCIONAL | Verifica `rol === 'admin'`. |
| `components/layout/Navbar.tsx` | ⚠️ A MEDIAS | Links correctos, responsive mobile. **Links /admin/escenarios y /admin/metricas apuntan a páginas NO EXISTENTES.** |

#### Dashboard de usuario y entrenamiento
| Archivo | Estado | Notas |
|---|---|---|
| `app/(app)/dashboard/page.tsx` | ❌ ROTO | Consulta `metricas_usuario_categoria` (view) y `sesiones_con_metricas` (view) — **ninguna existe en Supabase**. Cálculo FP/FN está bien (pero lee `respuesta_correcta` que es campo correcto). |
| `app/(app)/dashboard/DashboardClient.tsx` | ✅ FUNCIONAL | 4 StatCards, BarChart por categoría, LineChart por sesión, tarjetas FP/FN, tabla sesiones recientes, empty state con CTA entrenar. Todo conecta correctamente vía props. |
| `app/(app)/entrenamiento/page.tsx` | ❌ ROTO | También consulta `metricas_usuario_categoria`. Por lo resto: onboarding modal ✅, Timer ✅, ProgressBar ✅, ResultModal ✅, inserciones `sesiones` y `respuestas` ✅. |
| `app/(app)/perfil/page.tsx` | ❌ ROTO | Consulta las 2 mismas views inexistentes. UI por lo demás está completa. |
| `components/training/*.tsx` (4) | ✅ FUNCIONAL | ProgressBar, ResultModal, ScenarioCard, Timer (hook). 100% funcionales. |

#### Páginas / secciones MISSING
| Ruta / Archivo | Estado | Notas |
|---|---|---|
| `app/page.tsx` (Landing page) | 🚫 NO EXISTE | El spec pide landing explicando propósito. Middleware marca `/` como pública. |
| `app/(admin)/escenarios/page.tsx` (CRUD) | 🚫 NO EXISTE | El spec pide CRUD completo de escenarios (crear, editar, eliminar) desde panel admin. |
| `app/(admin)/metricas/page.tsx` (Admin dashboard) | 🚫 NO EXISTE | Especifica: métricas agregadas, categoría con más fallos GLOBAL, tabla usuarios + progreso. |
| `supabase/migrations/*.sql` (Esquema + seed) | 🚫 NO EXISTE | **Pieza más crítica del proyecto.** Sin esto no hay tablas `profiles`, `escenarios`, `sesiones`, `respuestas`, ni políticas RLS, ni vistas, ni trigger auto-profile, ni datos seed de 20 escenarios. |

---

## Requisitos Funcionales (derivados del spec original)

### 1. Stack y deploy
- Next.js 14 App Router + TypeScript + Tailwind + Supabase Auth/Postgres/RLS + Recharts.
- Deploy target Vercel: variables de entorno son solo `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

### 2. Autenticación y roles
- Registro/login con email+password vía Supabase Auth.
- 2 roles: `usuario`, `admin` almacenado en `profiles.rol`.
- Al registrar usuario se crea automáticamente fila `profiles` (trigger SQL on `auth.users`).
- Middleware protege rutas `/login`, `/registro` públicas; resto requiere auth; `/admin/*` requiere `rol=admin`.
- Primer usuario registrado manualmente puede promoverse vía SQL a admin (documentado).

### 3. Banco de escenarios
- Mínimo 20 escenarios (seed) distribuidos: 5 phishing, 5 pretexting, 5 baiting, 5 vishing.
- Cada escenario: `titulo`, `contenido`, `categoria`, `dificultad` (bajo/medio/alto), `es_ataque` (bool), `explicacion`, `activo` (bool).
- Panel admin `/admin/escenarios`: listar, crear, editar, eliminar (soft con `activo=false` o hard delete).

### 4. Motor de entrenamiento adaptativo
- Track aciertos/fallos por categoría + usuario (tabla `respuestas`).
- Regla 1: 2+ fallos consecutivos en categoría → frecuencia aumentada (peso ×2).
- Regla 2: 3+ aciertos consecutivos en categoría → dificultad sube un nivel.
- Regla 3: <50% precisión y ≥3 respuestas → peso ×1.5 adicional.
- Sesiones: configurable (10 escenarios por defecto).
- Cronómetro por escenario → `tiempo_respuesta_ms`.
- Anti-repetición: evitar escenarios vistos en últimas 20 respuestas.

### 5. Registro de datos (tabla `respuestas`)
Campos: `usuario_id`, `escenario_id`, `respuesta_usuario`, `respuesta_correcta`, `es_correcta`, `tiempo_respuesta_ms`, `sesion_id`, `created_at`.

### 6. Dashboard de usuario (`/dashboard`)
- Precisión general y por categoría (gráfico barras).
- Evolución precisión por sesión (gráfico líneas).
- Tiempo respuesta promedio.
- Falsos positivos vs falsos negativos.
- Racha sesiones ≥60%.
- Sesiones recientes (tabla).

### 7. Dashboard admin (`/admin/metricas`)
- Métricas agregadas todos usuarios (precisión global, respuestas totales, usuarios activos).
- Categoría con más fallos a nivel global.
- Tabla usuarios: email, nombre, total sesiones, precisión general.

### 8. Extras UI/UX
- Landing page `/`: propósito, categorías, CTA registrarse/login.
- Onboarding: antes primera sesión.
- Loading states + error states en toda la app.
- Responsive design.
- Página perfil `/perfil` con historial sesiones + por categoría.

## Requisitos No Funcionales

- **Compilación limpia**: `npm run build` debe pasar sin errores TypeScript.
- **Sin RLS bypass**: todas las consultas a tablas pasan por policies. Ningún insert/update/delete sin policy.
- **Tipado estricto**: no usar `any` excepto donde sea estrictamente necesario y justificado.
- **Vercel-ready**: sin dependencias de archivos locales o rutas absolutas.

## Restricciones

- Solo usar librerías ya presentes en `package.json` (Supabase, Lucide, Recharts, UUID, Next/React/Tailwind).
- No cambiar arquitectura App Router → Pages Router.
- No agregar features fuera del spec.

## Suposiciones

- El usuario ya tiene un proyecto Supabase creado y podrá ejecutar el SQL generado en su SQL Editor.
- El rol `admin` se promueve manualmente vía SQL con `UPDATE profiles SET rol='admin' WHERE user_id='<id>'`.
- El nombre del perfil se toma de `raw_user_meta_data->>'nombre'` cuando Supabase Auth invoca el trigger.

---

## Criterios de Aceptación

### AC-1 (rule): El proyecto compila
`npm install && npm run build` retorna exit code 0 sin errores TypeScript/Eslint críticos.  
**Evidencia**: salida terminal del build.

### AC-2 (rule): Esquema Supabase completo y autocontenido
Existe archivo SQL único con: (a) 4 tablas del spec (profiles, escenarios, sesiones, respuestas), (b) RLS activado + policies por tabla, (c) trigger auto-creación profile al hacer signUp, (d) 2 vistas para métricas, (e) seed 20 escenarios.  
**Evidencia**: archivo `supabase/migrations/0001_init.sql` presente y cada bloque CREATE TABLE/POLICY/TRIGGER/VIEW/INSERT existe.

### AC-3 (rule): Registro crea profile + login + roles funcionan
Nuevo usuario registrado → fila en `profiles` con `rol='usuario'` automáticamente. Login redirige a /dashboard. Acceso a /admin/* sin rol admin redirige a /dashboard. Admin con rol puede navegar /admin/*.  
**Evidencia**: código trigger SQL + middleware.ts + pages registro.

### AC-4 (rule): CRUD escenarios admin funciona
Página `/admin/escenarios` permite: listar escenarios activos, crear nuevo con todos los campos, editar existente, eliminar. Validar que solo admin ve la página (aplica layout admin).  
**Evidencia**: archivo `/app/(admin)/escenarios/page.tsx` existe y contiene formulario + tabla.

### AC-5 (rule): Motor adaptativo real conectado a DB
La página `/entrenamiento` NO consulta vistas inexistentes. Calcula métricas por categoría con queries a `respuestas` + `escenarios`, pasa al engine, selecciona 10 escenarios, inserta `sesiones` y `respuestas` con todos los campos. Onboarding aparece en primera sesión (0 sesiones completadas).  
**Evidencia**: código page entrenamiento + queries dashboard reemplazadas.

### AC-6 (rule): Dashboard usuario con datos reales
`/dashboard` muestra precisión general, por categoría (barras), evolución (líneas), tiempo promedio, FP/FN, racha, tabla sesiones. Todo calculado con joins SQL directos (no views).  
**Evidencia**: code server component page.tsx sin referencias a `metricas_usuario_categoria` ni `sesiones_con_metricas`.

### AC-7 (rule): Dashboard admin con datos reales
`/admin/metricas` muestra KPIs globales, categoría con más fallos, tabla usuarios con progreso. Consultas con RLS policy que permita a admin leer todos los registros.  
**Evidencia**: archivo `/app/(admin)/metricas/page.tsx` existe.

### AC-8 (rule): Landing page + perfil
`/` muestra propósito, categorías, CTA login/registro. `/perfil` muestra header perfil, progreso por categoría, historial sesiones.  
**Evidencia**: `app/page.tsx` existe.

### AC-9 (rubric): Calidad UI/UX responsive
Escala 0-2. 0: broken layouts en mobile. 1: usable pero inconsistente. 2: todos los estados (loading/error/empty) cubiertos, mobile fluido, tipografía y espaciado coherentes en todas las páginas.  
**Umbral de aceptación**: ≥1.5

### AC-10 (rubric): Vercel-ready y documentación mínima
Escala 0-2. 0: requiere steps manuales no documentados. 1: SQL existe, .env.example tiene vars, falta README. 2: SQL listo, .env.example con comentarios, proyecto corre sin más steps que los 3 clásicos (npm install, SQL en Supabase, vars entorno).  
**Umbral de aceptación**: ≥1.5
