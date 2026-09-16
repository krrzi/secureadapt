-- ============================================================
-- SecureAdapt v2 — Migración a Casos Reales Documentados + 2D Engine
-- Incorpora:
-- 1. Ampliación de categorias: 'phishing','vishing','smishing','pretexting','baiting'
-- 2. Nuevo campo vector_psicologico: 'urgencia','autoridad','confianza','recompensa','amenaza','curiosidad'
-- 3. Campos fuente y fuente_url (con obligatoriedad de fuente para es_ataque = true)
-- 4. Seed no destructivo e idempotente con 31 casos reales documentados (ON CONFLICT DO UPDATE)
-- ============================================================

-- ── 1. MODIFICAR TABLA ESCENARIOS ────────────────────────────

-- Eliminar la restricción de categoría anterior para permitir 'smishing'
alter table public.escenarios drop constraint if exists escenarios_categoria_check;
alter table public.escenarios add constraint escenarios_categoria_check 
  check (categoria in ('phishing', 'vishing', 'smishing', 'pretexting', 'baiting'));

-- Agregar columna vector_psicologico si no existe
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'escenarios' and column_name = 'vector_psicologico'
  ) then
    alter table public.escenarios add column vector_psicologico text not null default 'urgencia'
      check (vector_psicologico in ('urgencia', 'autoridad', 'confianza', 'recompensa', 'amenaza', 'curiosidad'));
  end if;
end $$;

-- Agregar columnas fuente y fuente_url si no existen
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'escenarios' and column_name = 'fuente'
  ) then
    alter table public.escenarios add column fuente text;
  end if;

  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'escenarios' and column_name = 'fuente_url'
  ) then
    alter table public.escenarios add column fuente_url text;
  end if;
end $$;

-- Preservar datos previos: desactivar escenarios antiguos sin fuente para que el motor
-- use los 31 casos reales, sin romper claves foráneas de respuestas existentes
update public.escenarios 
set activo = false 
where fuente is null or length(trim(fuente)) = 0;

-- Asegurar que filas previas de ataque cumplan la restricción antes de activarla
update public.escenarios 
set fuente = 'Registro histórico previo a v2' 
where es_ataque = true and (fuente is null or length(trim(fuente)) = 0);

-- Restricción de obligatoriedad de fuente para escenarios de ataque
alter table public.escenarios drop constraint if exists escenarios_fuente_ataque_check;
alter table public.escenarios add constraint escenarios_fuente_ataque_check
  check (es_ataque = false or (fuente is not null and length(trim(fuente)) > 0));

-- Restricción UNIQUE en titulo para garantizar idempotencia en el seed
alter table public.escenarios drop constraint if exists escenarios_titulo_unique;
alter table public.escenarios add constraint escenarios_titulo_unique unique (titulo);

-- Índices para optimizar el motor adaptativo 2D
create index if not exists idx_escenarios_cat_vec on public.escenarios(categoria, vector_psicologico, activo);

-- ── 2. ACTUALIZAR VISTAS PARA ANALÍTICA ────────────────────────

create or replace view public.metricas_usuario_categoria
with (security_invoker = true) as
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

create or replace view public.metricas_usuario_vector
with (security_invoker = true) as
select
  r.usuario_id,
  e.vector_psicologico,
  count(*)                              as total,
  count(*) filter (where r.es_correcta) as correctas,
  round(100.0 * count(*) filter (where r.es_correcta) / nullif(count(*),0), 1) as precision_pct
from public.respuestas r
join public.escenarios e on e.id = r.escenario_id
where ( r.usuario_id = auth.uid() or public.is_admin() )
group by 1, 2;
-- ── 3. SEED DE LOS 31 CASOS REALES (IDEMPOTENTE CON ON CONFLICT) ──

insert into public.escenarios (
  titulo,
  contenido,
  categoria,
  vector_psicologico,
  dificultad,
  es_ataque,
  explicacion,
  fuente,
  fuente_url,
  activo
) values

-- ═════════════════════════════════════════════════════════════
-- PHISHING (9 casos reales documentados)
-- ═════════════════════════════════════════════════════════════

(
  'Verificación urgente de cuenta por riesgo de suspensión',
  'De: Centro de Seguridad Global <security-alert@service-verify-id9.com>
Para: usuario@organizacion.com
Asunto: [URGENTE] Su cuenta será suspendida en 2 horas

Estimado usuario:

Hemos detectado actividad irregular y múltiples intentos de acceso no autorizados a su buzón de correo desde una dirección IP en el extranjero. 

Para proteger su información, su cuenta ha sido programada para desactivación permanente en un plazo no mayor a 2 HORAS.

Para cancelar esta acción y autenticar su titularidad inmediatamente, haga clic en el siguiente enlace y complete el proceso:
http://service-verify-id9.com/auth/login-confirm

Si no valida su identidad antes del plazo fijado, perderá el acceso a todos sus archivos y mensajes de forma irreversible.',
  'phishing',
  'urgencia',
  'bajo',
  true,
  'Explota un sentido artificial de urgencia y amenaza (plazo estricto de 2 horas) para inducir al usuario a hacer clic en un enlace sin verificar el remitente ni el dominio apócrifo. Patrón clásico documentado por APWG en sus reportes trimestrales de phishing.',
  'Anti-Phishing Working Group (APWG), Phishing Activity Trends Report, 2023-2024',
  'https://apwg.org/trendsreports/',
  true
),

(
  'Notificación de caducidad inminente de contraseña corporativa',
  'De: Mesa de Ayuda TI <soporte-ti@empresa-identity-auth.net>
Para: empleado@corporativo.com
Asunto: Su contraseña de red expira hoy a las 18:00 hrs

Aviso importante del Departamento de Tecnologías de Información:

De acuerdo con la política interna de seguridad de la información (ISO 27001), su contraseña de acceso al directorio activo caduca en la fecha actual.

Para mantener su acceso al correo, carpetas compartidas y VPN sin interrupciones, debe renovar sus credenciales ahora mismo manteniendo su contraseña actual o ingresando una nueva:

>> [Renovar Contraseña en Servidor de Identidad](https://empresa-identity-auth.net/update-password)

Nota: El personal de TI no puede renovar su clave por usted.',
  'phishing',
  'autoridad',
  'medio',
  true,
  'Suplanta la identidad del departamento interno de Helpdesk/TI bajo el principio de autoridad corporativa. El enlace dirige a un portal clonado que recopila la contraseña actual del empleado para acceder a la red corporativa.',
  'Proofpoint / KnowBe4 Threat Research Report, 2023',
  'https://www.proofpoint.com/threat-insight',
  true
),

(
  'Plan de Reclutamiento 2011 (Caso RSA SecurID)',
  'De: Beyond Careers HR <webmaster@beyond.com>
Para: analista.junior@rsa.com
Asunto: 2011 Recruitment Plan

Adjunto: 2011 Recruitment Plan.xls (248 KB)

Estimado colega:

Te remito en archivo adjunto la hoja de cálculo con el plan de contrataciones y escala de incentivos presupuestados para este año fiscal 2011. Por favor revísala con cautela dado el carácter sensible de las asignaciones de personal.

Quedo atento a tus comentarios para consolidar el reporte con gerencia.',
  'phishing',
  'curiosidad',
  'alto',
  true,
  'Caso RSA SecurID (2011): Spear phishing dirigido a empleados de bajo nivel con un archivo Excel malicioso ("2011 Recruitment Plan.xls") que explotó una vulnerabilidad de día cero en Adobe Flash (CVE-2011-0609) incrustada en la hoja de cálculo. El ataque comprometió los algoritmos del token SecurID de RSA.',
  'RSA Security (blog oficial de Uri Rivner), Threatpost y Dark Reading, 2011',
  'https://threatpost.com/anatomy-of-the-rsa-breach/75084/',
  true
),

(
  'Actualización de datos bancarios de proveedor de hardware (Caso BEC)',
  'De: Finanzas Quanta Computer <accounting@quanta-computer-tw.com>
Para: cuentas.pagar@corporativo-tech.com
Asunto: ACTUALIZACIÓN URGENTE: Cuenta receptora para factura #INV-992014

Estimado equipo de Contabilidad:

Por motivos de auditoría fiscal internacional y cierre del trimestre con Citibank Taiwán, les notificamos formalmente que a partir del presente ciclo todas las transferencias de pagos por suministro de servidores deberán efectuarse a nuestra nueva cuenta corporativa en Letonia:

Banco: Euro Pacific Bank
Titular: Quanta Computer Inc. (International Logistics)
IBAN: LV45PARX0012345678901
Concepto: Liquidación de compras de manufactura Q3

Adjuntamos copia del contrato marco sellado y la adenda correspondiente para su registro contable.',
  'phishing',
  'confianza',
  'alto',
  true,
  'Caso Evaldas Rimasauskas (Google y Facebook, 2013-2015): Fraude al CEO/BEC de alta sofisticación. El ciberdelincuente registró una empresa ficticia con nombre idéntico al fabricante real Quanta Computer, envió facturas y contratos auténticos y logró que ambas compañías transfirieran más de $100 millones de dólares.',
  'U.S. Department of Justice (DOJ), Comunicado de Prensa / Cobertura Sophos y SC Media, 2019',
  'https://www.justice.gov/usao-sdny/pr/evaldas-rimasauskas-sentenced-5-years-prison-wire-fraud',
  true
),

(
  'Alerta de bloqueo preventivo de tarjeta Credimás (BCP Perú)',
  'De: Notificaciones BCP <alerta-seguridad@viabcp-validacion-pe.com>
Para: cliente@gmail.com
Asunto: [BCP] Su tarjeta Credimás ha sido temporalmente inhabilitada

Estimado(a) Cliente:

Por motivos de seguridad y conforme a nuestros protocolos de protección antifraude, hemos bloqueado temporalmente sus operaciones por internet tras detectar transacciones no habituales.

Para restablecer el acceso a su Banca por Internet y evitar el bloqueo definitivo en cajeros automáticos, valide su número de tarjeta de 16 dígitos, fecha de vencimiento y clave de 6 dígitos ingresando al portal seguro:

>> https://www.viabcp-validacion-pe.com/banca-por-internet/activar

Banco de Crédito del BCP - Siempre contigo.',
  'phishing',
  'confianza',
  'bajo',
  true,
  'Phishing bancario clásico en Perú suplantando al BCP. Utiliza un dominio similar al oficial (.viabcp-validacion-pe.com en lugar de .viabcp.com) para capturar el número de tarjeta y credenciales de acceso. El BCP nunca solicita claves ni datos confidenciales vía correo electrónico.',
  'ESET Latinoamérica (WeLiveSecurity) & Diario Gestión.pe, 2019',
  'https://www.welivesecurity.com/la-es/2019/04/campana-de-phishing-suplanta-identidad-de-banco-peruano/',
  true
),

(
  'Subsidio económico extraordinario disponible para cobro',
  'De: Plataforma Única Digital del Estado <notificaciones@bono-extraordinario-gob.org>
Para: ciudadano@outlook.com
Asunto: Aprobación de Bono de Apoyo Económico 2024 - Consulte su fecha de abono

Estimado(a) Beneficiario(a):

Se le comunica que ha sido calificado(a) favorablemente para la entrega del Bono Extraordinario de Reactivación Familiar por el monto de S/. 760.00 soles.

Para consultar su modalidad de pago (depósito en cuenta bancaria o billetera digital Yape/Plin), registre su número de DNI y los datos de su tarjeta receptora en el Sistema Integrado:

[CONSULTAR Y COBRAR MI BONO AQUÍ](http://bono-extraordinario-gob.org/padron-nacional)

Plazo límite para registrarse: 48 horas tras la recepción del presente aviso.',
  'phishing',
  'recompensa',
  'bajo',
  true,
  'Modalidad de phishing de alta recurrencia en Perú que suplanta bonos estatales y programas de subsidios públicos. Apela a la necesidad económica y la recompensa inmediata para obtener datos personales y bancarios de las víctimas.',
  'División de Investigación de Delitos de Alta Tecnología (Divindat - PNP), ESAN & RPP, 2023',
  'https://rpp.pe/economia/economia/ciberdelincuencia-cuales-son-las-modalidades-de-estafa-mas-frecuentes-en-el-peru-noticia-1485671',
  true
),

(
  'Problema de facturación: Tu suscripción de streaming será cancelada hoy',
  'De: Centro de Pagos Streaming <billing@netflix-member-billing-pe.com>
Para: usuario@hotmail.com
Asunto: No pudimos procesar tu cuota mensual - Acción requerida

Hola:

Lamentamos informarte que tu entidad bancaria no autorizó el cobro de tu membresía mensual correspondiente a este ciclo.

Para no perder tu historial, listas de reproducción y continuar disfrutando del servicio en tus pantallas simultáneas, actualiza tu medio de pago antes de las 23:59 de hoy:

Actualizar información de pago:
https://netflix-member-billing-pe.com/youraccount/payment

El equipo de soporte.',
  'phishing',
  'amenaza',
  'bajo',
  true,
  'Ataque de phishing masivo en Perú y Latinoamérica que suplanta plataformas de streaming (Netflix, Spotify, etc.). Genera una amenaza de corte inmediato del servicio para que el usuario ingrese apresuradamente los números de su tarjeta de crédito.',
  'RPP Noticias / Análisis de Docencia ESAN en Ciberseguridad, 2023',
  'https://rpp.pe/tecnologia/innovacion/',
  true
),

(
  'Oportunidad de inversión institucional respaldada por IA (Deepfake)',
  'De: Comunicaciones de Inversión Credicorp <presidencia@credicorp-invest-portal.net>
Para: inversionista@empresa.pe
Asunto: Invitación exclusiva: Fondo Tecnológico Credicorp con Rentabilidad Garantizada

Estimado(a):

Le compartimos el mensaje en video de nuestro Director Ejecutivo anunciando la apertura de la nueva plataforma de inversión algorítmica de Credicorp, que permite generar hasta 15% mensual garantizado con respaldo del holding.

[Ver video del CEO de Credicorp y unirse a la plataforma privada]
https://credicorp-invest-portal.net/fondo-ia

Cupos limitados a los primeros 200 participantes verificados.',
  'phishing',
  'autoridad',
  'alto',
  true,
  'Modalidad moderna de estafa de inversión que utiliza videos deepfake generados con inteligencia artificial del CEO de Credicorp/BCP. Se apoya en la máxima autoridad corporativa y la credibilidad institucional para convencer a víctimas de transferir ahorros a billeteras cripto controladas por los atacantes.',
  'Banco de Crédito del Perú (BCP), Comunicado Oficial de Advertencia & Perú Retail, 2025',
  'https://www.viabcp.com/seguridad',
  true
),

(
  'Resolución de cobranza coactiva y embargo preventivo (SUNAT)',
  'De: Notificaciones SUNAT <notificaciones-coactiva@sunat-gob-pe-resolucion.info>
Para: gerente@miempresa.com.pe
Asunto: [NOTIFICACIÓN COACTIVA] Resolución de Ejecución Coactiva N° 011-2024

Señor(a) Contribuyente:

Cumplimos con notificarle la Resolución de Cobranza Coactiva N° 011-2024 por deuda tributaria no subsanada correspondiente al periodo fiscal 2023-12, por el importe total de S/. 14,820.00 soles.

Se ha ordenado la traba de medidas cautelares de embargo en forma de retención sobre sus cuentas bancarias comerciales.

Para visualizar el expediente completo y subsanar la observación antes de que se haga efectiva la orden de embargo en el sistema financiero, ingrese al portal con su Clave SOL:
http://sunat-gob-pe-resolucion.info/expediente-coactivo/login.php',
  'phishing',
  'amenaza',
  'medio',
  true,
  'Ataque de phishing institucional dirigido a empresas y profesionales peruanos, suplantando a la SUNAT. Utiliza el miedo a multas y embargos judiciales para que el contribuyente ingrese sus credenciales de Clave SOL o descargue troyanos bancarios.',
  'Alertas Oficiales de Ciberseguridad SUNAT / Indecopi, 2023-2024',
  'https://www.gob.pe/sunat',
  true
),

-- ═════════════════════════════════════════════════════════════
-- VISHING (5 casos reales documentados)
-- ═════════════════════════════════════════════════════════════

(
  'Llamada interna de soporte técnico de red privada (Caso Twitter 2020)',
  'Canal: Llamada telefónica (Vishing)
Interlocutor: Supuesto Ingeniero de Sistemas de Twitter IT Helpdesk

"Hola Carlos, te llamo directamente desde la mesa de soporte de TI en San Francisco. Estamos migrando los servidores de la VPN interna debido a incidentes de latencia que reportaron varios equipos en trabajo remoto. 

Para que tu acceso no se bloquee durante la sincronización de las 15:00, necesito que vayas a la nueva dirección web que te voy a dictar: twitter-support-vpn.com, y digites tus credenciales del directorio activo para validar que tu perfil está correctamente migrado."',
  'vishing',
  'autoridad',
  'alto',
  true,
  'Caso Twitter (julio 2020): Vishing altamente estructurado. Los atacantes llamaron por teléfono a empleados de Twitter haciéndose pasar por compañeros de soporte técnico de TI, conduciéndolos a páginas web falsas de autenticación corporativa. Tras obtener las credenciales, tomaron control del panel administrativo interno y comprometieron 130 cuentas verificadas de figuras públicas.',
  'Twitter Inc., Comunicado Oficial de Seguridad (julio 2020), DOJ & NPR',
  'https://blog.x.com/en_us/topics/company/2020/an-update-on-our-security-incident',
  true
),

(
  'Bombardeo de notificaciones MFA push y mensaje de soporte (Caso Uber)',
  'Canal: MFA Push continuo + Mensaje por WhatsApp
Interlocutor: Supuesto Operador de Seguridad TI de Uber

Situación: Son las 2:30 AM. Tu teléfono recibe más de 40 notificaciones push consecutivas de la aplicación de autenticación solicitando: "¿Apruebas el inicio de sesión?".

Inmediatamente recibes un mensaje por WhatsApp desde un número con el logo corporativo:
"Hola, disculpa la molestia a esta hora. Detectamos un loop de sincronización en el servidor de autenticación push de tu cuenta de contratista. Por favor presiona ''Aprobar'' en la siguiente notificación para que el sistema detenga el ciclo de reintentos y podamos liberar tu usuario."',
  'vishing',
  'urgencia',
  'alto',
  true,
  'Caso Uber (2022): Técnica de fatiga por MFA (MFA Prompt Bombing). El atacante compró credenciales previas de un contratista y comenzó a enviar oleadas de peticiones de autorización multifactor hasta cansarlo, complementando el ataque con un mensaje de vishing/chat haciéndose pasar por personal de TI hasta que el usuario finalmente aprobó el acceso.',
  'Uber Newsroom, Security Incident Report & Group-IB, 2022',
  'https://www.uber.com/newsroom/security-update/',
  true
),

(
  'Solicitud telefónica de restablecimiento de token MFA (Caso MGM Resorts)',
  'Canal: Llamada a la Mesa de Ayuda de TI (Vishing Inverso)
Atacante suplantando a empleado ante el Helpdesk

El atacante llama al centro de atención a empleados de la empresa:
"Buenos días, habla Daniel Martínez, analista del área de marketing corporativo. Cambié de teléfono móvil esta mañana y perdí la sincronización de mi aplicación Okta Verify para entrar al sistema. Estoy por entrar a una presentación con los directores y necesito urgentemente que reseteen mis factores de autenticación y me proporcionen un código de acceso temporal."',
  'vishing',
  'confianza',
  'alto',
  true,
  'Caso MGM Resorts (2023, grupo Scattered Spider): Los cibercriminales recopilaron en LinkedIn el nombre, cargo y departamento de un empleado real de MGM. Luego llamaron a la mesa de ayuda de soporte técnico de TI haciéndose pasar por dicho empleado para que les restablecieran sus credenciales de MFA, logrando acceso completo a la red corporativa.',
  'MGM Resorts International, Okta Threat Intelligence Bulletin & Group-IB, 2023',
  'https://sec.okta.com/articles/2023/08/cross-tenant-impersonation',
  true
),

(
  'Suplantación ante la mesa de ayuda del proveedor de TI (Caso Caesars)',
  'Canal: Llamada telefónica de ingeniería social
Objetivo: Proveedor externo de servicios gestionados de TI (MSP)

"Hola, soy supervisor de operaciones en la sede central de Caesars. Tenemos una auditoría no programada de cumplimiento de accesos para los casinos y las cuentas de nuestros gerentes de turno están presentando fallas de sincronización. Necesitamos que nos transfieran temporalmente los permisos de administrador sobre el portal de identidades compartidas."',
  'vishing',
  'autoridad',
  'alto',
  true,
  'Caso Caesars Entertainment (2023, grupo Scattered Spider): Vishing dirigido no a la compañía principal sino al Helpdesk de un proveedor externo de servicios gestionados de TI. Al convencer al soporte del proveedor sobre su autoridad ejecutiva, obtuvieron credenciales que costaron millones en rescate.',
  'Caesars Entertainment Form 8-K SEC Filing & Dark Reading, 2023',
  'https://www.sec.gov/edgar/searchedgar/companysearch',
  true
),

(
  'Llamada de detección de infecciones críticas en sistema Windows',
  'Canal: Llamada telefónica a línea fija / celular
Interlocutor: Falso Soporte Técnico de Microsoft

"Buenas tardes, le estamos contactando del centro de soporte técnico global de Microsoft Windows. Nuestros servidores de telemetría en la nube han recibido múltiples alertas de código malicioso activo transmitiendo sus archivos personales desde su computadora personal.

Para aislar la amenaza y limpiar su disco duro antes de que sus cuentas bancarias queden comprometidas, encienda su equipo y diríjase a la página anydesk.com para permitirnos una conexión remota de diagnóstico asistido."',
  'vishing',
  'autoridad',
  'medio',
  true,
  'Modalidad clásica de vishing documentada globalmente por la FTC y la Policía Nacional del Perú (Divindat). El atacante se hace pasar por soporte técnico de Microsoft o Windows y persuade a la víctima para instalar herramientas de administración remota (TeamViewer, AnyDesk) con las que sustrae claves y secuestra el equipo.',
  'Federal Trade Commission (FTC) Tech Support Scams Report & Alertas PNP, 2023',
  'https://consumer.ftc.gov/articles/how-spot-avoid-and-report-tech-support-scams',
  true
),

-- ═════════════════════════════════════════════════════════════
-- SMISHING (3 casos reales documentados)
-- ═════════════════════════════════════════════════════════════

(
  'SMS de expiración de sesión Okta corporativa (Campaña 0ktapus)',
  'Canal: SMS al teléfono móvil corporativo
Remitente: +1 (833) 291-OKTA

SMS: "Twilio IT Notice: Su sesión de Okta SSO ha caducado por motivos de seguridad del protocolo MFA. Para restablecer su acceso al correo de la empresa y a Slack, vuelva a iniciar sesión antes de 15 minutos en: https://twilio-sso-login.com/auth"',
  'smishing',
  'urgencia',
  'alto',
  true,
  'Caso Twilio / Campaña "0ktapus" (2022): Campaña de smishing a gran escala que afectó a más de 130 empresas tecnológicas. Los atacantes enviaron mensajes SMS a números móviles de empleados simulando ser del portal de TI corporativo con enlaces a páginas de phishing de Okta que interceptaban usuario, clave y códigos TOTP en tiempo real.',
  'Twilio Incident Report & ZeroFox Intelligence ("0ktapus Phishing Campaign"), 2022',
  'https://www.twilio.com/en-us/blog/incident-update-2022',
  true
),

(
  'SMS: Imposibilidad de entrega de paquete por dirección incompleta',
  'Canal: SMS en teléfono móvil
Remitente: SERPOST-AVISO

SMS: "[SERPOST PERÚ]: Su paquete con número de seguimiento PE-748921 no pudo ser entregado hoy debido a que la dirección del destinatario está incompleta. Para programar una nueva entrega a domicilio y actualizar sus datos antes de la devolución a almacén central, ingrese a: http://serpost-rastreo-entrega.com/pe"',
  'smishing',
  'urgencia',
  'bajo',
  true,
  'Modalidad de smishing de alta prevalencia documentada en Perú y a nivel internacional. Explota la ansiedad y curiosidad por recibir una compra o paquete, llevando a un formulario que cobra una pequeña "tarifa de reenvío" de S/. 2 a S/. 5 soles, capturando así los datos completos de la tarjeta bancaria.',
  'Alertas de Ciberseguridad Ciudadana & APWG Smishing Trends, 2023-2024',
  'https://apwg.org/',
  true
),

(
  'Alerta BCP SMS: Se ha detectado una compra inusual por S/. 1,850',
  'Canal: SMS en teléfono móvil
Remitente: BCP-ALERTA

SMS: "BCP: Se registró un intento de compra por S/. 1,850.00 en MercadoLibre con su tarjeta de débito. Si NO reconoce este consumo, anule la transacción de inmediato para evitar el cobro ingresando a: https://viabcp-anulaciones-pe.com"',
  'smishing',
  'amenaza',
  'medio',
  true,
  'Modalidad de smishing bancario documentada en investigaciones académicas sobre entidades financieras peruanas. Induce pánico financiero mediante un consumo ficticio de alto valor para que la víctima acceda con urgencia al enlace y entregue sus claves bancarias bajo el pretexto de "anulación".',
  'Tesis "El delito de phishing en las entidades financieras del Perú", Universidad Autónoma del Perú, 2024',
  'https://repositorio.autonoma.edu.pe/',
  true
),

-- ═════════════════════════════════════════════════════════════
-- PRETEXTING (4 casos reales documentados)
-- ═════════════════════════════════════════════════════════════

(
  'Contacto de consultor de talento corroborando organigrama interno',
  'Canal: Mensaje directo en LinkedIn / Red profesional
Remitente: Elena R., "Headhunter Senior en Ciberseguridad & Finanzas"

"Hola Jorge, estuve revisando tu excelente perfil y tu experiencia liderando la infraestructura en tu empresa. Estamos gestionando una búsqueda confidencial de liderazgo tecnológico para un importante grupo bancario.

Antes de coordinar una llamada formal, ¿me podrías confirmar si actualmente le reportas de manera directa a Roberto Quispe en la Gerencia de TI o si las decisiones de arquitectura de la nube las toma el equipo de Seguridad de la Información? Esto para enfocar adecuadamente la propuesta salarial."',
  'pretexting',
  'confianza',
  'alto',
  true,
  'Fase de reconocimiento previa (Scattered Spider / Caso MGM): Los cibercriminales crean perfiles ficticios creíbles en LinkedIn para entablar diálogo con empleados clave. El objetivo es corroborar nombres de jefaturas, dependencias y procesos internos para luego ejecutar un vishing o BEC infalible.',
  'Group-IB Threat Intelligence & Trusona Research, 2023',
  'https://www.group-ib.com/blog/scattered-spider/',
  true
),

(
  'Validación crediticia presencial con información biométrica filtrada',
  'Canal: Interacción en módulo de atención / llamada de seguimiento
Contexto: Caso documentado en Ayacucho (Perú)

Un sujeto se presenta argumentando ser familiar autorizado de un cliente bancario con una copia legalizada de DNI y ficha de datos biométricos sustraídos de una base de datos filtrada:

"Buenas tardes señorita asesora. Vengo de parte del titular del crédito preaprobado. Aquí tengo su ficha de datos y su constancia domiciliaria. Él no puede venir por motivos de salud pero me autorizó a solicitar el desembolso a la cuenta puente que le estoy indicando aquí en el expediente."',
  'pretexting',
  'confianza',
  'alto',
  true,
  'Caso documentado en Ayacucho (Perú, 2025): Uso de pretexting elaborado combinando información de identidad real filtrada con documentos adulterados para convencer al personal financiero de gestionar transferencias y créditos a nombre de víctimas desprevenidas.',
  'Investigación Periodística El Búho & Reportes Judiciales PNP, 2025',
  'https://elbuho.pe/',
  true
),

(
  'Actualización del número de cuenta para depósito de gratificación',
  'De: Recursos Humanos - Nóminas <recursos-humanos@rrhh-portal-gestion.com>
Para: empleado@empresa.com
Asunto: Confirmación urgente de cuenta sueldo para pago de gratificación

Estimado colaborador:

Durante la corrida de prueba para la dispersión de las gratificaciones de este mes, el sistema del banco nos rebotó su cuenta corriente por un error en el código de cuenta interbancario (CCI).

Para asegurar que su abono se efectúe a primera hora de mañana sin retrasos, por favor responda directamente a este correo indicando su número de cuenta completo, entidad bancaria y su DNI para validar la adenda de nómina.',
  'pretexting',
  'autoridad',
  'medio',
  true,
  'Modalidad clásica de pretexting interno documentada en los informes de Business Email Compromise (BEC) del FBI IC3. El atacante crea un pretexto burocrático verosímil haciéndose pasar por RRHH para redirigir pagos o capturar datos financieros personales.',
  'FBI Internet Crime Complaint Center (IC3), Business Email Compromise Report, 2023',
  'https://www.ic3.gov/Media/PDF/AnnualReport/2023_IC3Report.pdf',
  true
),

(
  'Solicitud de confirmación de postulación en portal de empleo',
  'De: Beyond Careers Support <webmaster@beyond.com>
Para: victima@empresa.com
Asunto: Confirmación de recepción de CV y perfil profesional

Estimado candidato:

Le confirmamos que su postulación al proceso de selección estratégica 2011 ha sido recibida con éxito en nuestra plataforma Beyond.com. 

Para validar que sus datos laborales coincidan con los requerimientos de la vacante, por favor descargue el formato de confirmación adjunto y verifique que las secciones marcadas en amarillo estén completas.',
  'pretexting',
  'confianza',
  'alto',
  true,
  'Pretexting del Caso RSA (2011): Para engañar a los filtros de correo y la suspicacia de los empleados, los atacantes suplantaron un dominio legítimo de un portal de empleo real (Beyond.com), construyendo un pretexto laboral creíble que motivó al usuario a abrir el archivo malicioso.',
  'F-Secure Security Labs & Threatpost Analysis on RSA Breach, 2011',
  'https://threatpost.com/',
  true
),

-- ═════════════════════════════════════════════════════════════
-- BAITING (4 casos reales documentados)
-- ═════════════════════════════════════════════════════════════

(
  'Hoja de cálculo filtrada con sueldos y planes de contratación',
  'Ubicación: Carpeta de spam / Correo no deseado
Nombre del archivo: 2011 Recruitment Plan.xls

El correo llegó a la bandeja de correo no deseado con el asunto "2011 Recruitment Plan". Un empleado revisando su spam se percata del archivo adjunto cuyo título sugiere contener los planes salariales, bonos y contrataciones secretas de la directiva para el próximo año.

Por la intensa curiosidad de conocer la información salarial confidencial de la empresa, el empleado decide mover el correo a su bandeja de entrada y abrir la hoja de cálculo.',
  'baiting',
  'curiosidad',
  'alto',
  true,
  'Caso RSA SecurID (2011): Demuestra la técnica de cebo digital (Baiting). El archivo fue etiquetado con un nombre irresistible ("Plan de Contratación 2011") que apeló a la curiosidad humana suficiente para que el empleado rescatara el correo desde la bandeja de spam y ejecutara el exploit.',
  'RSA Security, Blog oficial de Uri Rivner ("Anatomy of an Attack"), 2011',
  'https://blogs.rsa.com/',
  true
),

(
  'Memoria USB encontrada con etiqueta "Auditoría Salarial Q3 - Confidencial"',
  'Ubicación: Sala de descanso / Cafetería de la oficina
Objeto: Memoria USB de 64 GB metálica

En una mesa de la cafetería de la empresa encuentras una memoria USB abandonada. En su reverso tiene una etiqueta adhesiva escrita a mano con el texto: "Auditoría Salarial y Despidos Q3 - Confidencial Gerencia".

Al conectarla a tu computadora de trabajo para ver de quién es y revisar los archivos, Windows abre una carpeta con un archivo ejecutable disfrazado con ícono de Excel llamado "Nomina_Ejecutiva_2024.xlsx.exe".',
  'baiting',
  'curiosidad',
  'medio',
  true,
  'Técnica de cebo físico (Baiting) clásica documentada en pruebas de penetración y reportes de APWG. Dejar memorias USB con etiquetas llamativas en zonas comunes de una empresa tiene una tasa de inserción superior al 45%, ejecutando malware silencioso en la red corporativa.',
  'APWG Social Engineering Testing Guidelines & CompTIA Security Studies, 2022',
  'https://apwg.org/',
  true
),

(
  'Activador y crack de software de diseño profesional gratuito',
  'Ubicación: Foro de descargas / Anuncio patrocinado en buscador
Archivo: Adobe_Master_Collection_2024_Crack_Keygen.zip

"¡Descarga la versión completa de software de diseño profesional totalmente gratis y de por vida! Incluye activador permanente sin costo de suscripción.

Instrucciones: Desactiva tu antivirus durante 5 minutos para que el generador de claves pueda modificar el registro del sistema."',
  'baiting',
  'recompensa',
  'bajo',
  true,
  'Cebo por descarga (Baiting). Ofrecer software comercial o contenido de entretenimiento costoso de forma gratuita a cambio de desactivar las protecciones del sistema es una de las principales vías de infección por ransomware y troyanos ladrones de credenciales (infostealers).',
  'Kaspersky Lab & ESET Threat Intelligence Reports, 2023-2024',
  'https://securelist.com/',
  true
),

(
  'Celebración de aniversario: Gana una de las 500 laptops sorteándose hoy',
  'Canal: Publicación viral en redes sociales / WhatsApp
Mensaje: "¡Cadena de tiendas líder celebra su 30° aniversario en Perú regalando 500 laptops de última generación!

Solo debes ingresar a la ruleta virtual, responder 3 preguntas sencillas y compartir el enlace con 10 amigos en WhatsApp para que tu premio sea despachado a tu domicilio sin ningún costo."',
  'baiting',
  'recompensa',
  'bajo',
  true,
  'Modalidad de cebo masivo reportada frecuentemente en alertas de Indecopi Perú. Suplanta cadenas comerciales de prestigio ofreciendo premios inverosímiles a cambio de propagar enlaces fraudulentos o descargar aplicaciones móviles infectadas con adware y troyanos.',
  'Indecopi Perú (Alertas de Consumo y Protección al Consumidor), 2023',
  'https://www.gob.pe/indecopi',
  true
),

-- ═════════════════════════════════════════════════════════════
-- ESCENARIOS LEGÍTIMOS DE CONTROL (6 escenarios, es_ataque = false)
-- ═════════════════════════════════════════════════════════════

(
  'Aviso informativo: Tu tarjeta de débito vencerá el próximo mes',
  'De: Banco de Crédito BCP <notificaciones@viabcp.com>
Para: cliente@gmail.com
Asunto: Información importante: Tu tarjeta débito vence el 30/10/2024

Estimado(a) Juan Pérez:

Te recordamos que tu tarjeta de débito BCP terminará su vigencia el próximo mes. 

Puedes acercarte a renovarla sin costo en cualquiera de nuestras agencias a nivel nacional presentando únicamente tu documento de identidad (DNI).

Ten en cuenta que:
- El BCP NUNCA te enviará enlaces para ingresar tus claves o datos de tarjeta.
- Esta comunicación es estrictamente informativa y no requiere que realices ningún trámite virtual.',
  'phishing',
  'confianza',
  'bajo',
  false,
  'Escenario legítimo de control. Proviene del dominio oficial del banco (.viabcp.com), no contiene enlaces para introducir claves secretas o códigos token, no utiliza un tono de urgencia artificial ni amenazas, e instruye realizar el trámite presencial con DNI.',
  'Guía Oficial de Prevención de Fraudes BCP & Diario Gestión, 2024',
  'https://www.viabcp.com/seguridad',
  true
),

(
  'Boletín mensual de bienestar y actividades de integración',
  'De: Comunicaciones Internas <comunicaciones@miempresa.com>
Para: todos@miempresa.com
Asunto: Boletín Corporativo: Fechas del taller de bienestar y salud laboral

Estimado equipo:

Les compartimos el cronograma de actividades de integración programadas para este fin de mes:

- Jueves 24: Charla de ergonomía y pausas activas (Auditorio piso 3, 10:00 AM).
- Viernes 25: Jornada de vacunación preventiva (Tópico de salud, 09:00 a 13:00 hrs).

No es necesario registrarse previamente. Los esperamos.',
  'pretexting',
  'confianza',
  'bajo',
  false,
  'Escenario legítimo de control. Mensaje institucional proveniente del dominio de la empresa, sin enlaces externos sospechosos, sin solicitudes de credenciales ni archivos ejecutables adjuntos.',
  'Estándares de Comunicación Corporativa Interna ISO/IEC 27001',
  null,
  true
),

(
  'Confirmación de orden de compra y resumen de entrega',
  'De: Tienda Oficial <pedidos@tiendaoficial.pe>
Para: comprador@gmail.com
Asunto: Confirmación de tu compra #PE-904812

Hola Carlos:

Gracias por tu compra. Hemos recibido tu pedido #PE-904812 y ya se encuentra en preparación para entrega:

- Producto: Teclado inalámbrico silencioso
- Total facturado: S/. 129.00 (Pagado con tarjeta terminada en 4412)
- Entrega estimada: Miércoles 18 de Octubre

Puedes consultar el estado del paquete directamente desde la sección "Mis Pedidos" en nuestra web oficial iniciando sesión normalmente.',
  'phishing',
  'confianza',
  'medio',
  false,
  'Escenario legítimo de control. Responde a una transacción previa del usuario con número de pedido exacto, monto verificado y sin adjuntos sospechosos ni solicitudes de reinicio de contraseñas.',
  'Buenas Prácticas de Comercio Electrónico Seguro (Cámara de Comercio de Lima)',
  null,
  true
),

(
  'Invitación a reunión de seguimiento de proyecto (Google Meet)',
  'De: Andrea Silva (Vía Google Calendar) <calendar-notification@google.com>
Para: equipo.proyecto@empresa.com
Asunto: Invitación: Revisión de Avance de Proyecto @ Mar 17 Oct 2024 11:00 - 11:30

Andrea Silva te ha invitado a:
Revisión de Avance de Proyecto Q4

Cuándo: Martes 17 de Octubre de 2024, 11:00 a 11:30
Dónde: Google Meet (meet.google.com/abc-defg-hij)

Agenda:
1. Revisión de entregables semana 3
2. Dudas y bloqueos del equipo',
  'pretexting',
  'autoridad',
  'medio',
  false,
  'Escenario legítimo de control. Notificación estándar de calendario corporativo proveniente del remitente oficial de Google Calendar, con una sala de reunión estándar y sin adjuntos maliciosos ni enlaces acortados.',
  'Protocolos de Colaboración Segura en Entornos de Trabajo Digital',
  null,
  true
),

(
  'Encuesta anual de clima organizacional y satisfacción laboral',
  'De: Gerencia de Gestión del Talento <talento@corporacion.pe>
Para: colaboradores@corporacion.pe
Asunto: Encuesta Anual de Clima Laboral 2024 (Participación anónima)

Estimado colaborador:

Como parte de nuestro compromiso con la mejora continua de nuestro ambiente de trabajo, te invitamos a responder la Encuesta Anual de Clima Laboral 2024.

La encuesta se encuentra disponible en la intranet corporativa (intranet.corporacion.pe) y toma aproximadamente 10 minutos.

Las respuestas son 100% anónimas y no se requiere registrar correos ni contraseñas. El plazo de participación estará abierto hasta el 31 de este mes.',
  'baiting',
  'recompensa',
  'alto',
  false,
  'Escenario legítimo de control. Comunicación interna de talento humano alojada en la intranet de la organización. Aclara explícitamente el anonimato, no solicita claves y tiene un plazo razonable sin presiones coercitivas.',
  'Protocolos de Evaluación de Clima Laboral y Seguridad de la Información',
  null,
  true
),

(
  'Coordinación para actualización programada de software corporativo',
  'De: Soporte TI <mesadeayuda@corporativo.pe>
Para: empleados@corporativo.pe
Asunto: Mantenimiento programado: Actualización de sistema operativo

Estimado equipo:

Este fin de semana realizaremos la actualización periódica de parches de seguridad en los equipos de cómputo de la empresa.

Recuerda:
1. Deja tu equipo encendido y conectado a la red al retirarte el viernes.
2. La Mesa de Ayuda NUNCA te solicitará tu contraseña por correo, teléfono ni WhatsApp para este proceso.
3. Si alguien te llama solicitando tus credenciales de acceso aduciendo esta actualización, no las entregues y repórtalo inmediatamente al canal de seguridad interno en Slack (#seguridad-reportes).',
  'vishing',
  'autoridad',
  'alto',
  false,
  'Escenario legítimo de control. Mensaje genuino de soporte técnico institucional que previene expresamente sobre técnicas de vishing y phishing, recordando que el personal de TI jamás solicita contraseñas por teléfono o mensajería.',
  'Guía de Soporte Técnico y Arquitectura Zero Trust (NIST SP 800-63)',
  'https://csrc.nist.gov/',
  true
)

on conflict (titulo) do update set
  contenido = excluded.contenido,
  categoria = excluded.categoria,
  vector_psicologico = excluded.vector_psicologico,
  dificultad = excluded.dificultad,
  es_ataque = excluded.es_ataque,
  explicacion = excluded.explicacion,
  fuente = excluded.fuente,
  fuente_url = excluded.fuente_url,
  activo = excluded.activo;
