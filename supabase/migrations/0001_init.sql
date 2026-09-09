-- ============================================================
-- SecureAdapt v1 — Esquema inicial completo + seed + RLS + views
-- Ejecutar TODO este bloque en Supabase SQL Editor ANTES de usar la app.
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- 1. TABLAS
-- ──────────────────────────────────────────────────────────

create table if not exists public.profiles (
    id          uuid primary key default gen_random_uuid(),
    user_id     uuid not null references auth.users(id) on delete cascade unique,
    rol         text not null default 'usuario' check (rol in ('usuario', 'admin')),
    nombre      text,
    email       text,
    created_at  timestamptz not null default now()
);

create table if not exists public.escenarios (
    id          uuid primary key default gen_random_uuid(),
    titulo      text not null,
    contenido   text not null,
    categoria   text not null check (categoria in ('phishing','pretexting','baiting','vishing')),
    dificultad  text not null check (dificultad in ('bajo','medio','alto')),
    es_ataque   boolean not null,
    explicacion text not null,
    activo      boolean not null default true,
    created_at  timestamptz not null default now()
);

create table if not exists public.sesiones (
    id               uuid primary key default gen_random_uuid(),
    usuario_id       uuid not null references auth.users(id) on delete cascade,
    iniciada_en      timestamptz not null default now(),
    finalizada_en    timestamptz,
    total_escenarios int not null default 0,
    correctas        int not null default 0
);

create table if not exists public.respuestas (
    id                 uuid primary key default gen_random_uuid(),
    sesion_id          uuid not null references public.sesiones(id) on delete cascade,
    escenario_id       uuid not null references public.escenarios(id) on delete cascade,
    usuario_id         uuid not null references auth.users(id) on delete cascade,
    respuesta_usuario  boolean not null,  -- true = el usuario dijo "es ataque"
    respuesta_correcta boolean not null,  -- = escenarios.es_ataque (redundante para analytics)
    es_correcta        boolean not null,  -- = (respuesta_usuario = respuesta_correcta)
    tiempo_respuesta_ms int not null,
    created_at         timestamptz not null default now()
);

create index if not exists idx_respuestas_usuario_categoria on public.respuestas(usuario_id, created_at desc);
create index if not exists idx_sesiones_usuario on public.sesiones(usuario_id, iniciada_en desc);

-- ──────────────────────────────────────────────────────────
-- 2. ROW LEVEL SECURITY
-- ──────────────────────────────────────────────────────────

alter table public.profiles   enable row level security;
alter table public.escenarios enable row level security;
alter table public.sesiones   enable row level security;
alter table public.respuestas enable row level security;

-- Helper: retorna true si el usuario autenticado tiene rol=admin
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where user_id = auth.uid() and rol = 'admin'
  );
$$;

-- ── profiles ───────────────────────────────────────────
-- Dueño puede leer/actualizar el suyo; admin lee/actualiza todos; insert via trigger.
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using ( auth.uid() = user_id or public.is_admin() );

create policy "profiles_update_own_or_admin"
  on public.profiles for update
  using ( auth.uid() = user_id or public.is_admin() );

create policy "profiles_insert_self"
  on public.profiles for insert
  with check ( auth.uid() = user_id );

-- ── escenarios ────────────────────────────────────────
-- Todos los autenticados pueden leer activos; admins CRUD total.
create policy "escenarios_select_auth_active"
  on public.escenarios for select
  using ( auth.role() = 'authenticated' );  -- incluso usuarios ven inactivos? Solo admin ve inactivos.

drop policy if exists "escenarios_select_auth_active" on public.escenarios;
create policy "escenarios_select_regular_users_only_active"
  on public.escenarios for select
  using ( public.is_admin() or activo = true );

create policy "escenarios_insert_admin_only"
  on public.escenarios for insert
  with check ( public.is_admin() );

create policy "escenarios_update_admin_only"
  on public.escenarios for update
  using ( public.is_admin() );

create policy "escenarios_delete_admin_only"
  on public.escenarios for delete
  using ( public.is_admin() );

-- ── sesiones ──────────────────────────────────────────
create policy "sesiones_select_own_or_admin"
  on public.sesiones for select
  using ( auth.uid() = usuario_id or public.is_admin() );

create policy "sesiones_insert_own"
  on public.sesiones for insert
  with check ( auth.uid() = usuario_id );

create policy "sesiones_update_own"
  on public.sesiones for update
  using ( auth.uid() = usuario_id );

-- ── respuestas ────────────────────────────────────────
create policy "respuestas_select_own_or_admin"
  on public.respuestas for select
  using ( auth.uid() = usuario_id or public.is_admin() );

create policy "respuestas_insert_own"
  on public.respuestas for insert
  with check ( auth.uid() = usuario_id );

-- ──────────────────────────────────────────────────────────
-- 3. TRIGGER: auto-crear profile al registrar usuario en auth.users
-- ──────────────────────────────────────────────────────────

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (user_id, rol, nombre, email)
  values (
    new.id,
    'usuario',
    coalesce(new.raw_user_meta_data->>'nombre', new.email),
    new.email
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ──────────────────────────────────────────────────────────
-- 4. VISTAS (compatibilidad con consultas analíticas)
--     Nota: las vistas NO usan RLS automáticamente, así que
--     las filtramos por auth.uid() y solo acceso a admin/owner.
-- ──────────────────────────────────────────────────────────

-- Vista agregada: estadísticas por usuario y categoría
create or replace view public.metricas_usuario_categoria
security_invoker as
select
  r.usuario_id,
  e.categoria,
  count(*)                              as total,
  count(*) filter (where r.es_correcta) as correctas,
  round(100.0 * count(*) filter (where r.es_correcta) / nullif(count(*),0), 1) as precision_pct,
  round(avg(r.tiempo_respuesta_ms), 0)  as tiempo_promedio_ms
from public.respuestas r
join public.escenarios e on e.id = r.escenario_id
where ( r.usuario_id = auth.uid() or public.is_admin() )
group by 1, 2;

-- Vista: sesiones con métricas derivadas
create or replace view public.sesiones_con_metricas
security_invoker as
select
  s.id,
  s.usuario_id,
  s.iniciada_en,
  s.finalizada_en,
  s.total_escenarios,
  s.correctas,
  round(100.0 * s.correctas::numeric / nullif(s.total_escenarios,0), 1)  as precision_pct,
  extract(epoch from (s.finalizada_en - s.iniciada_en))::int             as duracion_segundos
from public.sesiones s
where ( s.usuario_id = auth.uid() or public.is_admin() );

-- ──────────────────────────────────────────────────────────
-- 5. SEED — 20 ESCENARIOS (5 por categoría)
--    Distribución dificultad: 2 bajo / 2 medio / 1 alto (por categoría)
--    ~50% es_ataque por categoría
-- ──────────────────────────────────────────────────────────

insert into public.escenarios (titulo, contenido, categoria, dificultad, es_ataque, explicacion) values
-- ═════════════ PHISHING (5) ═════════════
('URGENTE: Confirmar datos de tu cuenta bancaria',
'Asunto: Confirmación requerida — Tu cuenta será suspendida en 24h

Estimado cliente:

Nuestro sistema ha detectado actividad inusual en su cuenta BBVA. Para evitar el bloqueo permanente, haga clic en el siguiente enlace y verifique sus datos personales y su tarjeta de débito:
👉 http://bbva-verificacion-seguridad.com/login

Atentamente,
Departamento de Seguridad BBVA',
'phishing', 'bajo', true,
'Este es un correo clásico de phishing. Señales claras:
1. URLs sospechosas que no coinciden con el dominio real (bbva.com, nunca bbva-verificacion-*.com).
2. Urgencia extrema ("será suspendida en 24h") para que actúes sin pensar.
3. Petición de datos bancarios por enlace externo: los bancos NUNCA te piden esto por email.
4. Saludo genérico "Estimado cliente", sin tu nombre real.'),

('Tu factura de abril está lista',
'From: facturas@iberdrola.es
Subject: Iberdrola — Factura abril 2025 disponible
To: María González <maria.gonzalez@hotmail.com>

Hola María,

Tu factura de Iberdrola correspondiente al mes de abril ya está disponible para su descarga.

Importe total: 84,62 €
Fecha de emisión: 02/05/2025
Fecha de vencimiento: 16/05/2025

👉 Descargar PDF (adjunto) o ver tu Área de Cliente: https://www.iberdrola.es/areacliente
No es necesario que hagas nada si tienes domiciliado el pago.

Gracias por confiar en Iberdrola.',
'phishing', 'bajo', false,
'Este correo ES LEGÍTIMO.
- Dominio real iberdrola.es (no imitaciones).
- Te dirige al sitio web oficial.
- No te pide datos de pago por email.
- El hecho de que tenga un importe no lo hace peligroso; es normal en facturas reales.
- Te saluda por tu nombre real, no de forma genérica.'),

('Entrega fallida — Reprogramar envío DHL',
'Asunto: DHL Express — Paquete #ES-88472 imposible de entregar

Estimado Cliente,

Su envío no pudo ser entregado hoy por dirección incompleta. Por favor, confirme su domicilio y abone la tasa administrativa de 1,99€ para reprogramar la entrega MAÑANA:
🔗 https://dhl-reprogramar-gestion.es/cargo-paypal

Si no lo hace en 48h su paquete será destruido.

Disculpe las molestias,
DHL Logistics Spain
AVISO: Este correo incluye un archivo Factura_DHL_88472.exe.zip con el comprobante.',
'phishing', 'medio', true,
'Phishing de tipo "entrega fallida" muy común. Señales rojas:
1. Piden pagar una "tasa administrativa" a través de un enlace externo a PayPal.
2. Amenaza de destruir el paquete (urgencia artificial).
3. Incluye un adjunto ejecutable (.exe.zip) — ¡NUNCA abras archivos .zip/.exe de remitentes desconocidos!
4. Remitente y dominio no coinciden con dhl.com oficial.
5. No mencionan tu nombre — no saben quién eres.'),

('Notificación de Microsoft: inicios de sesión inusuales',
'From: Microsoft account team <account-security-noreply@accountprotection.microsoft.com>
To: javier.ramos@gmail.com
Subject: Javier, inicios de sesión nuevos detectados

Javier,

Se detectó un inicio de sesión nuevo en tu cuenta Microsoft desde Chrome en Windows 11, en Madrid (IP: 80.xx.xx.xx) a las 19:42 CET.
Si fuiste tú, puedes ignorar este correo.

Si NO fuiste tú:
👉 Revisa la actividad reciente en tu cuenta
👉 Cambia tu contraseña inmediatamente en account.microsoft.com

Saludos,
Equipo de Microsoft',
'phishing', 'medio', false,
'Este correo es LEGÍTIMO.
- El remitente es el dominio oficial accountprotection.microsoft.com.
- No hay enlaces a dominios sospechosos; te dirige a account.microsoft.com.
- NO te pide hacer clic para ingresar contraseña en el propio email.
- Te saluda personalmente y te da detalles concretos (navegador, hora, ciudad) que solo Microsoft conoce.
- Es el correo estándar que envía Microsoft cuando detecta inicios desde IPs nuevas.'),

('Contrato de trabajo — Búsqueda activa LinkedIn',
'Estimado/a,

He revisado tu perfil en LinkedIn y tu experiencia en ciberseguridad encaja perfectamente con el puesto de "Security Analyst" que tenemos abierto en Deloitte España, con un paquete salarial de 58k + bonus.

Adjunto la descripción del puesto (Contrato_Deloitte.pdf). Por favor, rellena la solicitud aquí antes del viernes:
https://deloitte-es-talent-portal.square.site/entrevista

¿Tienes 15 min esta semana para una primera entrevista por Teams?

Atentamente,
Carla Méndez
Senior Talent Acquisition
Deloitte',
'phishing', 'alto', true,
'Spear phishing de alta calidad, dirigido. Señales a detectar:
1. Cuadratura oferta demasiado perfecta (puesto + salario alto sin haber postulado).
2. El enlace no va a deloitte.com, va a square.site (un subdominio de terceros cualquiera puede usarlo).
3. El nombre de la reclutadora es plausible, pero al escribir a Deloitte RRHH nunca confirmarían su existencia.
4. Archivo .pdf adjunto con posiblemente macros o enlaces internos.
5. LinkedIn se usa hoy en día como fuente de información real, así que conocen tu experiencia — eso NO lo hace legítimo.
Regla: nunca responder ofertas no solicitadas sin verificar el dominio de la empresa y el correo oficial del reclutador.'),

-- ═════════════ PRETEXTING (5) ═════════════
('Llamada: Ayuda urgente, soy el jefe de proyecto',
'Escenario de llamada:

📞 Timbre a las 09:17 de un lunes. Tú eres recepcionista en la oficina.

"¡Hola! Buenos días, soy Carlos, el nuevo jefe de proyecto de la sede de Barcelona. Perdona que te llame así de arriba pero es que hoy mismo presentamos ante cliente y el chico de IT no contesta.
Acabo de llegar desde el aeropuerto, mi portátil no se conecta a la VPN y necesito que me des el usuario y contraseña genérico de soporte que tenéis para estas situaciones — solo 5 minutos, ya sé que no es protocolo pero si no presento la demo hoy el cliente se va.
Si quieres mi correo interno es carlos.garcia@laempresa.es — ya le he dicho a Recursos Humanos que te den las gracias.
¿Nos hacemos el favor?"',
'pretexting', 'medio', true,
'Esto es PRETEXTING clásico (crear un falso contexto para extraer información).
Red flags:
1. Urgencia extrema y presión de negocio ("cliente se va").
2. Pretende ser una persona con autoridad pero no puedes verificar su identidad por teléfono.
3. "Solo 5 minutos" para que minimices el riesgo percibido.
4. Menciona que ya informó a RRHH como técnica de autoridad falsa.
5. Pide credenciales por teléfono: el procedimiento NUNCA es dar claves por voz; si realmente es un empleado, debe abrir ticket IT oficial con verificación de 2 factores.'),

('Ticket IT #8842 — Confirmación de datos de usuario',
'Escenario mensaje interno Teams:

Hola, soy Miguel del departamento IT respondiendo a tu ticket 8842 que abriste ayer sobre el problema de la impresora. Antes de escalarlo a nivel 2 necesito confirmar tus credenciales de Active Directory para reproducir exactamente tu error desde otro equipo:

Usuario AD: ______
Pass AD: ______
Solo 2 minutos, te soluciono el tema en cuanto lo tenga. Gracias!

— Miguel / IT Helpdesk',
'pretexting', 'bajo', true,
'Técnica pretexting: se hace pasar por el servicio IT que TÚ llamaste (falsa familiaridad) para pedirte credenciales.
- IT NUNCA pide contraseñas por mensaje interno. NUNCA. En ninguna empresa seria.
- La excusa de "reproducir error" es una mentira habitual; IT usa cuentas de prueba o se conectan por TeamViewer remoto SIN tu contraseña.
- Si tu realmente abriste un ticket, cierra esta conversación, ve al portal oficial de tickets y responde ahí. O llama al teléfono oficial del helpdesk que tengas guardado.'),

('Entrevista de selección por teléfono — Cuéntame de tu actual empresa',
'Escenario llamada de RRHH:

"Hola soy Lucía de Page Personnel, ¿hablo contigo? Genial, te llamo por el perfil de Jefe de Equipo que tienes publicado en InfoJobs. Antes de pasar a la entrevista técnica, necesito que me cuentes un poco sobre los proyectos en los que estás trabajando AHORA en tu actual empleado:
• ¿Qué base de datos usáis en producción?
• ¿Cómo se llama tu jefe directo y su email corporativo?
• ¿Con qué proveedor cloud estáis?
• ¿Podrías pasarme un pequeño ejemplo de script que hayas hecho en tu puesto para ver tu nivel real?
No te preocupes por la confidencialidad, todo lo que me digas es NDA con Page Personnel."',
'pretexting', 'alto', true,
'Pretexting de reclutamiento: a veces es un competidor o un atacante que quiere inteligencia.
- Pedirte datos de tus proyectos ACTUALES en empresa es red flag — NDA real o no, tu deber de confidencialidad es con tu actual jefe.
- Pedir scripts, credenciales proveedor cloud, o nombre de compañeros sin haber pasado entrevista es muy inusual en búsquedas serias.
- Una consultora de selección legítima te preguntará TU experiencia, no detalles operativos sensibles de tu empresa actual.
- Regla: en primera entrevista no dar NADA que pueda comprometer la seguridad de tu actual compañía.'),

('Padre llamando al colegio: "Necesito el email de la tutora de mi hija"',
'Escenario llamada telefónica a secretaría de colegio:

"Buenos días, soy el padre de Sofía Martínez, clase 3B. Mira, he visto que enviasteis un correo circular ayer a los padres pero a mí no me llegó — es urgente porque Sofía tiene examen de matemáticas mañana y quería preguntar a la tutora qué tema entra.
¿Me puedes pasar el email privado de la profesora Laura? Dile que soy Tomás, el padre de Sofía, ya me conoce. Si quieres mi teléfono es el que tenemos registrado en ficha: 610 555 444.
Mucha prisa, muchas gracias!"',
'pretexting', 'medio', false,
'Sorpresa: este escenario en realidad es LEGÍTIMO y NO es un ataque (es_ataque=false).
- El padre proporciona datos específicos verificables: nombre completo alumno, clase, nombre tutora, teléfono supuestamente registrado.
- Lo que pide es información que la secretaría ya le daría tras VERIFICAR los datos (llamando al número registrado en ficha, no al número que dice él).
- El hecho de que tenga prisa por un examen es normal en padres.
- Señal: no pide información confidencial (expediente, notas, dirección), solo el email de la tutora, que es info pública de centro si lo verifican correctamente.
- Clave del administrador: antes de dar NADA, siempre llama al número de la ficha oficial, no al que te dice el interlocutor.'),

('Contacto de Ciberseguridad del Banco Central',
'Escenario: recibes llamada en el departamento de IT de PYME.

"Buenas tardes, soy David Moreno de la Oficina de Ciberseguridad del Banco de España. Estamos ejecutando una auditoría rápida obligatoria a todas las entidades que procesan transferencias SEPA este trimestre.
Hemos detectado que vuestro sistema no está parcheado contra CVE-2025-1029. Necesito que me des acceso temporal SSH al servidor de pagos durante 30 minutos para aplicar el parche oficial yo mismo.
Si no lo hacéis hoy, la multa empieza en 60.000€ y sale publicada en el BOE.
Cualquier duda mi jefe es el inspector Ricardo Alonso — su ficha está en la web del BdE."',
'pretexting', 'alto', true,
'Pretexting institucional. Técnica del "Inspector Falso".
Red flags críticas:
1. Banco de España NUNCA llama a PYMEs de forma individual para aplicar parches SSH directamente.
2. El BdE NUNCA pide acceso SSH; publica boletines y cada entidad gestiona su propio parcheo.
3. Amenaza con multa inmediata ("hoy") sin ningún procedimiento oficial previo ni comunicación escrita certificada.
4. Mencionar "mi jefe está en la web" es una técnica de autoridad falsa; no sirve como verificación.
Protocolo correcto: colgar, buscar teléfono oficial del BdE en su web pública y preguntar por su departamento de auditoría. NO devolver la llamada al número que te llamó.'),

-- ═════════════ BAITING (5) ═════════════
('USB encontrado en el parking con etiqueta "NÓMINAS 2025 CONFIDENCIAL"',
'Escenario:

Al aparcar tu coche en el parking de la empresa, encuentras en el suelo una memoria USB de color rojo con una etiqueta adhesiva que dice:
📁 "NÓMINAS RRHH 2025 — CONFIDENCIAL — SOLO DIRECTIVOS"

Inmediatamente piensas "le tocará a alguien", pero al día siguiente sigue ahí. Tú trabajas en el departamento financiero y sabes que tu jefe lleva días buscando un USB perdido en reuniones.
¿Qué harías? Este escenario evalúa si enchufarías la memoria USB a tu equipo para ver su contenido o "identificar al dueño".',
'baiting', 'alto', true,
'Esto es BAITING clásico. El atacante coloca un USB malicioso en un lugar donde alguien lo encontrará.
- La etiqueta CONFIDENCIAL / NÓMINAS está puesta a propósito para despertar curiosidad o sentido de "ayudar".
- Si enchufas ese USB en tu ordenador de empresa, puede tener: (a) Rubber Ducky (teclado programado) que ejecuta comandos en 2s, (b) malware autorun, (c) payload que roba credenciales.
- Nunca, jamás, bajo NINGÚN concepto, conectar memorias encontradas a equipos corporativos (ni tuyos personales, por higiene).
- Protocolo correcto: entregar en mano al departamento de IT/seguridad física. Nunca enchufarlo. Ellos lo analizan en equipo aislado o lo destruyen.'),

('Descargar "Plantilla Excel de presupuesto GRATIS — Premium"',
'Escenario:

Estás buscando en Google plantillas Excel de presupuesto mensual. El primer resultado orgánico tiene 4,8 estrellas en reseñas y el título dice:

👉 "Plantilla Excel Presupuesto Familiar 2025 — PREMIUM GRATIS 🔥
+ Macro de presupuesto automático + calculadora de inversiones incluida
Solo descarga disponible vía Google Drive, no en web."

Al entrar, el archivo es: Presupuesto_Premium_2025.xlsm
Al abrir Excel te sale el cartel amarillo: "Habilitar contenido para ver macros".',
'baiting', 'medio', true,
'Baiting con descarga gratuita.
- .xlsm = archivo Excel CON MACROS activas. Las macros son el vector #1 de malware hoy en día en ofimática.
- "Premium gratis", "macro automática" son cebo para que pulses "Habilitar contenido".
- Google Drive no escanea macros de forma exhaustiva, así que el atacante lo sube ahí.
- Regla de oro: NUNCA habilites macros de archivos descargados de internet que no hayan sido firmados digitalmente por una empresa de confianza que conozcas.
- Las plantillas legítimas no necesitan macros; se sirven sin ellos (.xlsx).'),

('Pendrive con logo de empresa en la cafetería',
'Escenario:

Estás en la cafetería de al lado de tu trabajo, pides un café y al levantarte ves en la mesa de al lado un pendrive azul con el logo oficial de tu empresa pegado con pegatinacolor blanco.
Está sin dueño visible. El camarero dice "si quieres guárdalo tú, ya vendrá alguien a por ello".
Tú conoces perfectamente el logo porque lo llevas en la camisa del uniforme.',
'baiting', 'medio', true,
'Baiting híbrido. Red flags:
1. Logo de empresa lo puede imprimir cualquiera con una impresora de pegatinas.
2. El atacante sabe que los empleados, por "bondad" o curiosidad, enchufan memorias de la propia empresa sin sospechar.
3. Al enchufarlo, si es corporativo el sistema sí se monta sin warning extra porque tu antivirus no bloquea "archivos normales".
- Regla: NINGÚN dispositivo encontrado es de fiar aunque tenga tu logo. Solo IT debe manejarlos, en sandbox.
- Distracción: el camarero "no se hace cargo" está puesto para que tu sentido de la responsabilidad tome el relevo y tú lo conectes. No muerdas el anzuelo.'),

('Libro gratuito: "Aprende Python en 7 días — PDF"',
'Escenario:

Un influencer de tecnología que sigues en X (Twitter) publica hilo viral:
🎉 ¡SORTEO + REGALO! 🎉
Para celebrar los 100k seguidores, dejo GRATIS durante 48h mi libro "Python Intermedio" (valor 29€) — edición extendida con código fuente.
🔗 https://bit.ly/AprendePython7diasGratis
Solo pide tu email para enviarte el PDF y tu clave de descarga. No hay catch, disfrútalo!

Comentarios con 400+ "gracias!!! 🚀"',
'baiting', 'bajo', false,
'Controversia, pero este escenario NO ES ATAQUE de baiting (es_ataque=false). Es legítimo.
- Es una estrategia común de captación de leads ("lead magnet"). No en sí mismo malicioso.
- Pide solo email, no datos de pago ni ejecutables.
- El producto es PDF (ejecutable bajo ciertas condiciones, cierto) pero en PDFs gratuitos de autores legítimos no suelen ir exploits.
- Diferenciar baiting de lead magnet: baiting es algo gratuito que TE ENGAÑA para infectar. Lead magnet es trueque legítimo email por contenido real.
- Precaución obvia: abre PDFs sin activar JavaScript y no ejecutes ningún código .py si no revisas antes que no sea keylogger. Pero eso no convierte al incentivo en ataque de ingeniería social.'),

('Oferta de trabajo por correo: Archivo con datos del candidato.exe',
'Escenario:

Te responde un correo de selección: "Hola, gracias por participar en nuestro proceso. Para la segunda fase necesitamos que cumplimentes el formulario ADJUNTO (formulario_candidato.exe). Ejecútalo y rellena tus datos de estudios y experiencia. No te preocupes, es solo un formulario offline que exporta los datos en PDF al finalizar. Cualquier duda, te llamo. Atentamente, Marta Recursos Humanos."',
'baiting', 'alto', true,
'Baiting de extremo peligro. Archivo .exe ADJUNTO bajo excusa de "formulario offline".
- NINGUNA empresa seria en la Tierra envía formularios .exe a candidatos. Existen Google Forms, Typeform, PDFs rellenables y portales.
- El hecho de que "exporte un PDF" es mentira: el exe será un RAT (Remote Access Trojan) que cuando lo ejecutas, al atacante ya tiene tu equipo.
- Cualquier fichero ejecutable (.exe, .msi, .bat, .cmd) recibido por correo de remitente desconocido debe tratarse como infección segura y borrarse inmediatamente.
- Denuncia a la agencia de selección si realmente existe el puesto.'),

-- ═════════════ VISHING (5) ═════════════
('Llamada Hacienda: "Debe 347€, embargamos su nómina mañana"',
'Escenario llamada al móvil personal:

📞 Llamada a tu número desde +34 910 000 000 (falsificación de identificador de llamada, se ve como oficial).
Hola buenas tardes, ¿hablo con Juan? Sí, soy el Inspector Javier Trujillo de la Agencia Tributaria.
Tenemos abierto expediente número 2025-E/AT-88371 por una declaración de la renta del año 2022 que presentó errores y usted debe 347 euros.
Si hoy antes de las 18:00 no abona la cantidad vía código de barras de Correos que le envío ahora mismo por SMS, embargamos el 30% de su nómina a partir del mes que viene sin posibilidad de recurso.
¿A qué correo se lo envía ya mismo?',
'vishing', 'bajo', true,
'VISHING clásico (phishing por voz). Señales claras:
1. AEAT NUNCA, EN NINGÚN CASO, llama por teléfono para cobrar deudas. Siempre lo hace por correo CERTIFICADO, nunca llamada.
2. El número de llamada se falsifica (spoofing) — ver un 910 oficial no garantiza nada.
3. Amenaza de embargo sin notificación previa escrita es ilegal.
4. Piden pago inmediato por SMS código de barras. Las deudas a Hacienda se pagan solo en la web oficial tributaria.es, en bancos o en oficinas AT.
5. Respuesta: "No puedo confirmar ningún dato por teléfono. Si realmente soy yo el interesado, envíeme comunicación escrita certificada a mi domicilio fiscal." Y colgar.'),

('Llamada de tu banco: "Confirmamos la operación sospechosa"',
'Escenario:

📞 Llamada entrante.
"Buenas tardes, soy Sandra del Departamento Antifraude de CaixaBank. ¿Hablamos con tu número de cliente 4455-XXXX-78901? Muy bien. Hemos detectado dos intentos de pago en Amazon por 587€ cada uno desde un móvil en Valencia a las 16:05. Antes de bloquear la tarjeta yo misma, ¿confirmas que NO has sido tú?
Perfecto, para anular la operación tengo que identificarte como propietario. Voy a enviarte un código por SMS al teléfono que tienes registrado. Dígamelo en voz alta, vale?
(Nota: tú estás esperando un paquete importante por Amazon esta semana).',
'vishing', 'medio', true,
'Vishing de tarjeta bancaria. Técnica de envío de código SMS (MFA fatigue / OTP phishing por voz):
- El banco NUNCA te envía un código SMS y te pide que lo digas en voz alta. Ese código es para TI, no para ellos.
- Saber los 4 últimos dígitos de tu tarjeta no prueba nada — hoy en día se consiguen en leaks baratos.
- El hecho de que estés esperando un paquete Amazon es casualidad que ellos aprovechan; pero incluso si lo estuvieras, es irrelevante.
- Protocolo real banco: si antifraude detecta algo, te pregunta SÓLO tu fecha nacimiento, última operación que hiciste, tu código postal. NUNCA tokens, NUNCA CVV, NUNCA OTP.
- Regla simple: cuelgas y llamas TÚ al número impreso al dorso de tu tarjeta. No al número que te llama.'),

('Centro médico: "Confirmamos tu cita de análisis"',
'Escenario:

📞 Llamada del centro médico.
Buenos días, llamo del Centro Médico Virgen de la Salud. ¿Está hablando Ana? Sí.
Tienes cita de analítica de sangre reservada para el próximo miércoles 12 a las 08:30. Llamamos para confirmar asistencia.
¿Confirmas que vendrás?
Para confirmarla necesito tu DNI completo y la dirección de tu casa, que no aparece en ficha.
¿Me lo puedes decir ya mismo?',
'vishing', 'medio', false,
'Lo siento: este NO ES ATAQUE de vishing (es_ataque=false). Es una llamada legítima de confirmación de cita de salud.
Señales de que es real:
1. Te llama un centro médico con el que TÚ ya tienes cita reservada (no inventan una cita).
2. Solo pide confirmación de asistencia + DNI + dirección. Datos que ya deberían tener; el pedido de dirección suele ser fallo de transcripción suya, no un intento de robo.
3. No piden tarjeta, no piden códigos, no hay urgencia, no hay amenazas.
4. Respuesta prudente: puedes decir "muy bien, la confirmo. Si necesitan mis datos me los piden el mismo día de la cita presencial". Dicho educadamente.
- Distinción clave: las estafas por salud sí existen, pero son las que piden "pago por la cita", "anticipo de medicamentos" o "prueba PCR a domicilio". Una confirmación de cita no lo es.'),

('Soporte técnico Google: "Tu cuenta ha sido comprometida"',
'Escenario:

📞 Suena el fijo de casa y una voz muy amable empieza:
"Good morning, this is Tom calling from Google Account Security Center. I see you have an Android linked to <tu email gmail correcto>. Unfortunately, we detected 3 failed login attempts from Nigeria last night. If you want to keep your Google account, you need to go right now to your browser and type WWW-GOOGLE-SECURE-RECOVERY.COM.
There I will guide you step by step to change your recovery password. If you do not do it in the next 10 minutes, I am authorized to permanently suspend your Gmail as per security policy.
Can you type the address I just gave you?"',
'vishing', 'alto', true,
'Vishing internacional. Muchas señales:
1. Google NUNCA llama a usuarios individuales por teléfono, en inglés o en español. Jamás.
2. Los accesos fallidos de Nigeria te los alerta GMAIL DENTRO DE TU BANDEJA, no una llamada fría.
3. Te piden ir a un dominio que NO ES google.com. Cualquier dominio "google-cualquiercosa.com" es estafa.
4. "En 10 minutos suspendemos" = urgencia artificial, la firma del vishing.
5. Correcto respuesta: No entres a ningún sitio, cuelga, abre tu navegador en myaccount.google.com tú SOLO y revisa "Inicios de sesión recientes". Si no hay nada raro, no pasó nada. Si sí, cambia contraseña y activa 2FA ahí mismo.'),

('Entrevista telefónica con prueba técnica de 15 minutos',
'Escenario:

📞 Llamada concertada 2 días antes por correo con StartUp Tech del país, puesto DevOps Junior.
"Hola, ¿hablamos contigo? Soy Álvaro, el Lead DevOps que te escribió por correo el martes pasado. Teníamos la entrevista a las 17h, ¿verdad?
Muy bien: 15 min de presentación, luego 30 min technical challenge. Lo primero — no hay problema — pero para el challenge necesito que te unas a nuestra máquina virtual temporal. Me has dado tú número de WhatsApp, ahora mismo te mando un APK para instalar en tu móvil Android, nos conectamos por TeamViewer QS y tú haces el reto en el entorno virtual; cuando terminas, desinstalas la app sin problema, ¿vale?
El APK no requiere permisos de root y no captura nada privado, tranquilo."',
'vishing', 'alto', true,
'Vishing con excusa de entrevista técnica. El atacante se ha preparado: tiene tu CV, la entrevista estaba concertada oficialmente por correo (posiblemente ha hackeado web RRHH de la startup o se hace pasar por ella).
Red flags que lo delatan:
1. Pedir instalar APK de origen desconocido en tu teléfono personal para una entrevista técnica NO es normal. Las pruebas técnicas reales usan plataformas web como LeetCode, HackerRank, GitPod, o máquinas virtuales AWS LIGHTSAIL a las que accedes por WEB TERMINAL. Nunca instalando apps en tu móvil.
2. TeamViewer QuickSupport = SI TE LO PIDEN, TE ESTÁN DANDO ACCESO TOTAL A TU PANTALLA y los botones — en 30 segundos pueden borrar tus archivos, robar credenciales, instalar malware.
3. "No requiere permisos" es mentira: cualquier APK instalado necesita permisos; TeamViewer pide control total del dispositivo.
- Solución correcta: rechazar educadamente y ofrecer alternativa web. Si insisten, cortar y contactar a la empresa por email oficial (no el correo del supuesto entrevistador).');

-- ============================================================
-- FIN DEL SCRIPT
-- POST-SETUP MANUAL:
-- 1. Promover tu cuenta a admin con:
--    UPDATE public.profiles SET rol='admin' WHERE user_id='<TU USER UUID>';
--    (encuentras tu user UUID en auth.users → id)
-- 2. Listo. Ya puedes: npm install → npm run dev
-- ============================================================
