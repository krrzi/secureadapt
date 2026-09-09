# SecureAdapt — Cola de Implementación

## Mapa AC → Tareas

- AC-1: Task 9 (build verificación)
- AC-2: Task 1 (SQL)
- AC-3: Task 1 (trigger) + Task 2 (middleware/layout fix) + Task 6 (queries entrenamiento)
- AC-4: Task 4 (CRUD escenarios) + Task 1 (seed 20)
- AC-5: lib/adaptive-engine.ts (existente) + Task 6 (queries entrenamiento aggregate → MetricasCategoria[])
- AC-6: Task 6 (dashboard fix)
- AC-7: Task 5 (admin métricas)
- AC-8: Task 3 (landing) + Task 6 (perfil queries fix) + entrenamiento onboarding (ya existente)
- AC-9: globals.css / tailwind / todas pages usan utilities
- AC-10: Task 1 (SQL RLS) + Task 9 (build) + Task 8 (env setup)

---

## Task 1: Script SQL completo de Supabase (init)
**Priority**: high  
**Depends on**: (nada)  
**Status**: ✅ completed

### Descripción
Crear `supabase/migrations/0001_init.sql` con:
1. Tabla `profiles` (id PK, user_id FK auth.users, rol default 'usuario', nombre, email, created_at)
2. Tabla `escenarios` (id, titulo, contenido, categoria, dificultad, es_ataque, explicacion, activo bool default true, created_at)
3. Tabla `sesiones` (id, usuario_id FK, iniciada_en timestamptz default now, finalizada_en timestamptz null)
4. Tabla `respuestas` (id PK, sesion_id FK, escenario_id FK, usuario_id FK, respuesta_usuario bool, respuesta_correcta bool, es_correcta bool, tiempo_respuesta_ms int, created_at)
5. RLS ENABLE 4 tablas.
6. 15 POLICIES (profiles/escenarios/sesiones/respuestas) + helper `is_admin()`
7. Trigger + función `handle_new_user` insert profiles (raw_user_meta_data->>'nombre', email)
8. 2 VIEWS `metricas_usuario_categoria` y `sesiones_con_metricas` con security_invoker
9. Seed 20 escenarios 5/5/5/5.

### Test Requirements (TR) — PASS
- ✅ **TR-1.1**: 4 CREATE TABLE + constraints/FKs presentes.
- ✅ **TR-1.2**: 4 `ALTER ... ENABLE RLS` + 15 `CREATE POLICY` + 1 helper `is_admin`.
- ✅ **TR-1.3**: `handle_new_user()` function + `after insert on auth.users` trigger insert profiles(nombre, email, rol='usuario').
- ✅ **TR-1.4**: 20 INSERT `escenarios` — 5 phishing / 5 pretexting / 5 baiting / 5 vishing.

---

## Task 2: Correcciones auth y middleware
**Priority**: high  
**Depends on**: Task 1  
**Status**: ✅ completed

### Descripción
1. `middleware.ts` — público `/`, `/login`, `/registro`; proteger resto; `/admin/*` check RLS profile.rol=admin. (ya existente, NO cambió).
2. `(app)/layout.tsx`: `.single<Profile>()` → `.maybeSingle<Profile>()` + fallback `INSERT profiles(user_id,rol,nombre,email)` si trigger no ejecutó.
3. `(admin)/layout.tsx`: `.single<Profile>()` → `.maybeSingle<Profile>()` + redirect 404 si no es admin.
4. lib/types.ts añade `email: string | null` a Profile.

### Test Requirements — PASS
- ✅ **TR-2.1**: Middleware.ts público /login/registro/; admin check en /admin/*.
- ✅ **TR-2.2**: (app)/layout.tsx + (admin)/layout.tsx usan `.maybeSingle()` y fallback defensivo.

---

## Task 3: Landing page
**Priority**: high  
**Depends on**: Task 2  
**Status**: ✅ completed

### Descripción
Crear `app/page.tsx` (pública): Hero + 4 cards categorías phishing/pretexting/baiting/vishing + sección "Cómo funciona" 3 pasos + CTA final + Footer. Responsive, usa .btn-primary, .btn-lg, .card.

### TR — PASS
- ✅ **TR-3.1**: Archivo `app/page.tsx` existe, contiene 4 cards categorías + CTA Iniciar sesión / Registrarse.

---

## Task 4: Admin CRUD de escenarios
**Priority**: high  
**Depends on**: Task 2  
**Status**: ✅ completed

### Descripción
`app/(admin)/escenarios/page.tsx` (RSC) fetch inicial → `ScenarioAdmin.tsx` (Client):
- Tabla 6 cols: Título / Categoría / Dificultad / Es ataque / Activo / Acciones
- Search bar + filtro por categoría
- 3 stat cards (Total / Activos / Ataques)
- Modal Nuevo / Editar 6 campos (titulo, contenido, categoria, dificultad, es_ataque, activo, explicacion)
- Delete dual soft(activo=false) / hard + toast success/error
- Supabase create/update/delete real.

### TR — PASS
- ✅ **TR-4.1**: page.tsx + ScenarioAdmin.tsx existen. Loading/error states incluídos.
- ✅ **TR-4.2**: Tabla 6 columnas + 3 acciones. Modal form 6+ campos.

---

## Task 5: Admin dashboard métricas
**Priority**: high  
**Depends on**: Task 4  
**Status**: ✅ completed

### Descripción
`app/(admin)/metricas/page.tsx` (RSC):
1. 4 KPI cards: Usuarios / Respuestas / Precisión global % / Sesiones completadas
2. Card destacada "Categoría con más fallos" (respuestas JOIN escenarios, tasa fallo % por categoría)
3. Desglose fallos todas categorías con barras
4. Tabla usuarios: avatar color (precisión), rol badge, #sesiones, #respuestas, precisión%. Orden DESC sesiones.

### TR — PASS
- ✅ **TR-5.1**: Archivo existe. 4 KPIs + 1 highlight card + 1 tabla usuarios 5+ cols.

---

## Task 6: Corregir queries dashboard/perfil/entrenamiento
**Priority**: high  
**Depends on**: Task 1, Task 2  
**Status**: ✅ completed

### Descripción
Eliminar dependencia vistas SQL inexistentes (`metricas_usuario_categoria`, `sesiones_con_metricas`). Sustituir por JOIN directo + aggregation TS Map.

Archivos:
1. `dashboard/page.tsx`: respuestas JOIN escenarios(categoria, es_ataque). Map<Categoria, Metricas>. Sesiones: from sesiones direct. calcularErrores(FP/FN). Rachas sesiones >=60%.
2. `perfil/page.tsx`: mismo patrón. profiles + sesiones + respuestas JOIN(categoria). Rendimiento cat + historial.
3. `entrenamiento/page.tsx`: initSession() aggregate respuestas JOIN categoria → MetricasCategoria[] → buildAdaptiveConfig → selectScenarios. Onboarding si 0 sesiones.

### TR — PASS
- ✅ **TR-6.1**: dashboard/page.tsx NO contiene strings `metricas_usuario_categoria` ni `sesiones_con_metricas`.
- ✅ **TR-6.2**: perfil/page.tsx NO contiene esas 2 strings.
- ✅ **TR-6.3**: entrenamiento/page.tsx NO contiene string `metricas_usuario_categoria`.

---

## Task 7: Revisión Navbar + small polish
**Priority**: medium  
**Depends on**: Tasks 3,4,5  
**Status**: ✅ completed

### Descripción
1. Links Navbar: /admin/escenarios y /admin/metricas YA existen (Task 4/5).
2. Perfiles null-safe (Task 2).
3. Loading/error states en todas pages.
4. globals.css utilities design system completo.
5. Tailwind config shades surface 300/400/500/600 AÑADIDOS (faltaban).

### TR — PASS
- ✅ **TR-7.1**: Ningún link de Navbar da 404. Build con 11 rutas OK confirma que /, /login, /registro, /dashboard, /entrenamiento, /perfil, /escenarios, /metricas todas generan página.

---

## Task 8: Actualizar .env.example + docs SQL step
**Priority**: low  
**Depends on**: Task 1  
**Status**: ✅ completed

### Descripción
Añadir comentarios en .env.example:
1. Pasos setup: Crear Supabase → Copiar URL/ANON → Ejecutar 0001_init.sql SQL Editor → npm install → npm run dev → Promover admin.
2. Comentario deploy Vercel con NEXT_PUBLIC_* vars.

### TR — PASS
- ✅ **TR-8.1**: .env.example incluye comentario con pasos, referencia SQL y UPDATE promover admin.

---

## Task 9: Build verification
**Priority**: high  
**Depends on**: Todas las tasks 1-8  
**Status**: ✅ completed

### Descripción
1. npm install — 430 packages OK (autoprefixer/postcss/tailwindcss añadidos como devDep faltaban)
2. npx tsc --noEmit — 0 errores (implicit any en cookiesToSet fixeado añadiendo tipos)
3. npm run build — exit code 0, 11 rutas compiladas, middleware OK.
4. Fix tailwind shades surface faltantes + caché webpack limpiada.

### TR — PASS
- ✅ **TR-9.1**: `npm run build` exit code 0, 11 páginas generadas, 0 Failed to compile, 0 TS errors.

---

## Resumen prioridades y ejecución:

| Task | Priority | Status |
|---|---|---|
| Task 1 SQL Init | high | ✅ |
| Task 2 Auth fix layouts | high | ✅ |
| Task 3 Landing | high | ✅ |
| Task 4 CRUD Admin escenarios | high | ✅ |
| Task 5 Admin metricas dashboard | high | ✅ |
| Task 6 Fix queries dashboard/perfil/entrenamiento | high | ✅ |
| Task 7 Small polish (shades tailwind) | medium | ✅ |
| Task 8 .env comments setup | low | ✅ |
| Task 9 Build verification | high | ✅ |
