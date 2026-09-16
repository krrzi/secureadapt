-- ============================================================
-- SecureAdapt v2.1 — Expansión del Banco de Escenarios Reales
-- Migración 0003: 15 Casos Reales Documentados Adicionales
-- Patrón no-destructivo e idempotente: ON CONFLICT (titulo) DO UPDATE
-- Total acumulado de escenarios en la base de datos: 31 + 15 = 46 escenarios
-- ============================================================

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

-- 1. Ubiquiti Networks (2015)
(
  'Transferencia ejecutiva urgente para subsidiaria internacional (Caso Ubiquiti)',
  'De: Robert Pera (CEO) <robert.pera@ubnt-corp-exec.com>
Para: Director de Finanzas <cfo@ubnt.com>
Asunto: [CONFIDENCIAL / URGENTE] Adquisición estratégica subsidiaria Hong Kong

Estimado colega:

Estamos cerrando un acuerdo de adquisición confidencial de patentes tecnológicas a través de nuestra subsidiaria en Hong Kong para anticiparnos a la competencia en el mercado asiático.

Por razones regulatorias y de estricta reserva bursátil, la transacción debe canalizarse hoy mismo sin pasar por la mesa de aprobaciones general.

Por favor procede inmediatamente con la transferencia interbancaria de $46,700,000 USD a la siguiente cuenta fiduciaria en Taiwán:
Banco: Shanghai Commercial Bank
Beneficiario: International Wireless Components Ltd.
Ref: Adquisición Tecnológica Q3

Confírmame únicamente por esta vía en cuanto la orden sea transmitida para notificar a los auditores externos.',
  'phishing',
  'autoridad',
  'alto',
  true,
  'Caso Ubiquiti Networks (2015): Ataque de Business Email Compromise (BEC) que costó 46.7 millones de dólares. Los atacantes suplantaron la identidad del CEO y de ejecutivos corporativos, aprovechando dominios similares (typosquatting) para ordenar transferencias multimillonarias a cuentas controladas por ciberdelincuentes en el extranjero sin levantar sospechas inmediatas.',
  'U.S. Securities and Exchange Commission (SEC) Form 8-K Filing, KrebsOnSecurity & CSO Online, 2015',
  'https://krebsonsecurity.com/2015/08/tech-firm-ubiquiti-suffers-46m-cyberheist/',
  true
),

-- 2. Reddit (febrero 2023)
(
  'Portal clonado de intranet y captura de sesión 2FA (Caso Reddit)',
  'De: Soporte de Identidad Corporativa <it-announcements@reddit-intranet-portal.com>
Para: dev-team@reddit.com
Asunto: [ACCIÓN REQUERIDA] Actualización del portal interno de documentación

Hola equipo:

Hemos desplegado una actualización crítica en nuestra pasarela de acceso a la intranet corporativa y wikis internas para mitigar problemas de latencia recientes.

Para validar que tu perfil mantenga la sincronización de credenciales con el proveedor de identidad de la empresa, inicia sesión antes del término de la jornada en el portal renovado:

>> https://reddit-intranet-portal.com/sso/login

Se te solicitará ingresar tu usuario corporativo, contraseña y el código de 6 dígitos generado por tu aplicación de autenticación 2FA.',
  'phishing',
  'confianza',
  'alto',
  true,
  'Caso Reddit (febrero 2023): Campaña sofisticada de spear phishing dirigida a empleados. El atacante clonó con exactitud el portal de intranet corporativo y configuró un proxy inverso capaz de capturar en tiempo real credenciales y tokens de segundo factor (2FA/OTP), logrando acceso no autorizado a documentación interna y código fuente.',
  'Reddit Inc., Comunicado oficial del CTO & The Hacker News, 2023',
  'https://thehackernews.com/2023/02/reddit-hacked-phishing-attack-exposed.html',
  true
),

-- 3. Estafa "secuestro virtual" / "hijo en apuros"
(
  'Llamada de extorsión inmediata por familiar retenido (Secuestro Virtual)',
  'Canal: Llamada telefónica desde número desconocido
Voz alterada / llanto de fondo: "¡Papá, por favor ayúdame, me tienen unos hombres armados!"

Interlocutor hostil toma la llamada:
"Escúchame con mucha atención y no cortes la llamada o esto termina mal. Tenemos a tu hijo aquí retenido en una camioneta tras un choque y no vamos a llamar a la policía si colaboras. 

En este momento vas a salir al cajero más cercano o agente bancario y vas a hacer un depósito en efectivo de S/. 5,000 soles a la cuenta que te voy a dictar para liberarlo. 

No intentes llamar a nadie ni alertar a la policía porque tenemos gente vigilando la puerta de tu casa."',
  'vishing',
  'amenaza',
  'alto',
  true,
  'Modalidad de "secuestro virtual" y "familiar en apuros": Ataque de vishing de alto impacto emocional. Los criminales explotan el terror, la urgencia extrema y la confusión mediante grabaciones de llanto o moduladores de voz por IA, impidiendo que la víctima cuelgue para verificar el estado de su familiar antes de efectuar transferencias de dinero no reversibles.',
  'Federal Bureau of Investigation (FBI) Virtual Kidnapping Alerts & Prensa Regional Latam, 2024-2025',
  'https://www.fbi.gov/news/stories/virtual-kidnapping',
  true
),

-- 4. Snapchat (2016)
(
  'Solicitud confidencial de formularios W-2 y nóminas (Caso Snapchat)',
  'De: Evan Spiegel (CEO) <ceo-office@mail-snapchat-internal.net>
Para: Analista de Nómina y Recursos Humanos <payroll@snapchat.com>
Asunto: Solicitud urgente: Información consolidada de nóminas W-2

Hola:

Estoy en una reunión extraordinaria con los asesores tributarios y los auditores externos revisando la planificación de beneficios fiscales de la compañía.

Necesito que me envíes a la brevedad en una hoja de cálculo protegida el listado consolidado de los formularios de nómina W-2 de todos los colaboradores contratados en el último ejercicio fiscal (incluyendo número de Seguro Social, nombres completos y compensaciones).

Por favor remítemelo en respuesta a este correo lo antes posible para no retrasar la sesión.',
  'phishing',
  'autoridad',
  'medio',
  true,
  'Caso Snapchat (2016): Ataque de Business Email Compromise suplantando al director ejecutivo (Evan Spiegel). El atacante indujo a un empleado del área de nóminas a remitir por correo los datos tributarios confidenciales de cientos de empleados (incluyendo salarios y números de Seguro Social), lo que facilitó posteriores fraudes de identidad fiscal.',
  'Snap Inc. Official Security Announcement & Cobertura de Prensa en Ciberseguridad, 2016',
  'https://newsroom.snap.com/',
  true
),

-- 5. Mattel (2015)
(
  'Instrucción de transferencia de fondos del nuevo CEO (Caso Mattel)',
  'De: Christopher Sinclair (CEO) <c.sinclair@mattel-finance-desk.com>
Para: Directora de Finanzas Globales <finance@mattel.com>
Asunto: [CONFIDENCIAL] Pago a proveedor estratégico de manufactura en Wenzhou

Estimada Directora:

Como te comenté brevemente en el traspaso de mando de la dirección ejecutiva, estamos consolidando la relación con nuestro principal socio de manufactura en China para asegurar los despachos de la campaña navideña.

Es fundamental proceder con el pago inicial de reserva de capacidad de planta por $3,000,000 USD mediante transferencia bancaria a la cuenta de Bank of Wenzhou.

Dado que estoy en vuelo internacional y con comunicación limitada, esta autorización cuenta con mi visto bueno prioritario. Adjunto los detalles bancarios de la orden.',
  'phishing',
  'autoridad',
  'alto',
  true,
  'Caso Mattel (2015): Fraude al CEO ejecutado durante un periodo de transición de liderazgo en la multinacional juguetera. El ciberdelincuente investigó los cambios de directiva para redactar un correo persuasivo con el nombre del nuevo CEO, logrando la transferencia de 3 millones de dólares a China (que la empresa logró congelar fortuitamente por un feriado bancario).',
  'Associated Press, Financial Times & Cobertura de Prensa Financiera, 2016',
  'https://apnews.com/',
  true
),

-- 6. FACC Austria (2016)
(
  'Adquisición corporativa confidencial "Fake President" (Caso FACC Austria)',
  'De: Walter Stephan (CEO) <walter.stephan@facc-aerospace-board.com>
Para: Departamento de Contabilidad y Tesorería <accounting@facc.com>
Asunto: [STRICTLY CONFIDENTIAL] Proyecto de expansión y compra de activos

Estimado equipo financiero:

Les escribo directamente bajo estricta cláusula de reserva confidencial. La junta directiva ha aprobado una operación de adquisición de activos de ingeniería aeroespacial que fortalecerá nuestro posicionamiento ante Airbus y Boeing.

Para formalizar la garantía financiera del fideicomiso antes del cierre de mercado de hoy, requerimos transferir €50,000,000 EUR a la cuenta del consorcio receptor en el exterior.

Debido al acuerdo de no divulgación (NDA), ninguna persona fuera de tesorería debe ser notificada hasta la emisión del comunicado de prensa oficial.',
  'phishing',
  'autoridad',
  'alto',
  true,
  'Caso FACC Austria (2016): Uno de los fraudes de "Fake President" más cuantiosos de Europa. Los cibercriminales suplantaron la cuenta de correo del director ejecutivo del fabricante aeroespacial austríaco FACC, convenciendo al área contable de autorizar transferencias por ~50 millones de euros, lo que derivó en la destitución del CEO y el director financiero.',
  'Reuters, Austrian Police Directorate & Prensa Financiera Europea, 2016',
  'https://www.reuters.com/article/us-facc-cybercrime-idUSKCN0UY1PW/',
  true
),

-- 7. Crelan Bank Bélgica (2016)
(
  'Fraude al CEO contra dirección financiera (Caso Crelan Bank)',
  'De: Luc Versele (CEO) <directorgeneral@crelan-banking-group.net>
Para: Gerencia de Tesorería Internacional <treasury@crelan.be>
Asunto: [OPERACIÓN ESPECIAL] Transferencia extraordinaria interbancaria

Estimada Gerencia:

En coordinación con la comisión de activos internacionales, estamos ejecutando una operación especial de balance de liquidez exterior que requiere la dispersión de fondos acumulados hacia cuentas operativas fiduciarias.

A fin de cumplir los requerimientos de encaje antes del corte de compensación de esta tarde, procedan con la dispersión inicial de tramos por un total consolidado de €70,000,000 EUR hacia las instituciones corresponsales indicadas en el anexo cifrado.

Confirmen por esta vía la ejecución de los giros para archivar en el legajo de auditoría de gerencia general.',
  'phishing',
  'autoridad',
  'alto',
  true,
  'Caso Crelan Bank (Bélgica, 2016): Fraude de suplantación de identidad ejecutiva que afectó directamente a una entidad financiera de mediana envergadura. Atacantes con conocimiento de los flujos de comunicación interna suplantaron al director ejecutivo del banco y ordenaron movimientos financieros que costaron ~70 millones de euros.',
  'Crelan Bank Corporate Statement & Reuters Europe, 2016',
  'https://www.reuters.com/',
  true
),

-- 8. Caso Barbara Corcoran (2020)
(
  'Factura de remodelación con error tipográfico en dominio (Caso Corcoran)',
  'De: Christine Elbers (Asistente Ejecutiva) <christine@corcorangroup-realty.com>
Para: Contabilidad Grupo Inmobiliario <pagos@thecorcorangroup.com>
Asunto: Factura pendiente de aprobación: Proyecto de remodelación Alemania

Hola:

Te reenvío la factura revisada por $388,700 USD correspondiente a los honorarios de diseño y contratistas del proyecto inmobiliario en Alemania supervisado por Barbara.

El estudio de arquitectura nos notificó que cambiaron de cuenta bancaria corporativa para recepcionar giros internacionales debido a auditorías fiscales de fin de año. Por favor asegúrate de registrar la nueva cuenta en Wire Transfer:

Banco: Deutsche Handelsbank
IBAN: DE89370400440532013000
Beneficiario: BK Architectural Holdings

Avísame cuando se haya completado la transferencia bancaria.',
  'phishing',
  'confianza',
  'medio',
  true,
  'Caso Barbara Corcoran (2020): La inversionista de Shark Tank casi pierde $400,000 dólares cuando su contadora recibió correos falsos de su asistente real solicitando el pago de una factura legítima de renovación. La diferencia radicaba en un único carácter alterado en el dominio de correo (typosquatting), explotando la confianza y la rutina de trabajo habitual.',
  'CNBC Make It & Forbes, 2020',
  'https://www.cnbc.com/2020/02/26/barbara-corcoran-lost-nearly-400000-in-phishing-scam.html',
  true
),

-- 9. Save the Children USA (2017)
(
  'Facturación apócrifa para proyecto de paneles solares (Caso Save the Children)',
  'De: Director de Operaciones de Campo <solar-projects@savethechildren-org-aid.net>
Para: Finanzas y Donaciones <disbursements@savethechildren.org>
Asunto: Desembolso urgente para centro de salud y paneles solares en Pakistán

Estimado equipo financiero:

Les escribo desde el terreno en Pakistán. Estamos a punto de completar la instalación del sistema de energía solar y refrigeración de vacunas para las clínicas rurales infantiles del proyecto prioritario.

El proveedor de ingeniería local nos solicita la liquidación del hito 3 por un importe de $997,400 USD para liberar el embarque de las baterías especiales antes del fin de semana.

Adjuntamos la factura proforma y las actas de recepción de obra con los nuevos datos bancarios verificados del contratista.',
  'phishing',
  'confianza',
  'alto',
  true,
  'Caso Save the Children USA (2017): Fraude de Business Email Compromise contra una organización benéfica internacional que causó pérdidas de aproximadamente 1 millón de dólares. Los atacantes comprometieron cuentas de correo y crearon historias humanitarias verosímiles sobre compra de equipamiento solar para desviar donaciones hacia cuentas fraudulentas.',
  'Associated Press (AP News) Investigative Report & The Chronicle of Philanthropy, 2018',
  'https://apnews.com/',
  true
),

-- 10. Cisco (2022)
(
  'Compromiso de cuenta personal y fatiga MFA de soporte (Caso Cisco)',
  'Canal: Contacto telefónico + Notificaciones Duo Push repetitivas
Interlocutor: Supuesto Ingeniero de Soporte de Cisco IT Helpdesk

Situación: Tras sincronizar tu navegador en casa, recibes de forma continua alertas de autenticación Duo Security en tu móvil: "¿Apruebas el inicio de sesión?".

Segundos después recibes una llamada:
"Hola, habla Daniel del Centro de Operaciones de Seguridad de Cisco en San José. Hemos detectado una desincronización recurrente en tu agente de Duo MFA que está bloqueando el cortafuegos corporativo. 

Para resetear la sesión de red y evitar la inhabilitación de tu token corporativo, necesito que toques ''Aprobar'' en la siguiente solicitud que aparecerá en tu pantalla mientras corro el diagnóstico de línea."',
  'vishing',
  'confianza',
  'alto',
  true,
  'Caso Cisco (2022): El grupo cibercriminal comprometió inicialmente la cuenta personal de Google de un empleado donde estaban sincronizadas contraseñas corporativas. Luego combinaron vishing persuasivo haciéndose pasar por soporte técnico con bombardeo continuo de notificaciones MFA (MFA Fatigue) hasta convencer al empleado de aprobar el acceso a la VPN empresarial.',
  'Cisco Talos Intelligence Group & Incident Response Analysis, 2022',
  'https://blog.talosintelligence.com/recent-cyber-attack/',
  true
),

-- 11. Mailchimp (2022)
(
  'Ingeniería social contra personal de soporte para clientes cripto (Caso Mailchimp)',
  'De: Auditoría Interna de Herramientas <it-compliance@mailchimp-internal-support.com>
Para: agente.soporte@mailchimp.com
Asunto: [INCIDENCIA CRÍTICA] Revisión de permisos en consola de administración interna

Estimado agente:

Durante el escaneo de seguridad de cuentas con privilegios elevados, se ha detectado que tu perfil de agente de atención al cliente mantiene sesiones abiertas desatendidas en el panel administrativo de cuentas corporativas del sector criptomonedas y finanzas descentralizadas.

Para verificar que tus llaves API y credenciales de soporte no hayan sido expuestas, accede a la consola de auditoría interna y revalida tu clave de red:

>> https://mailchimp-internal-support.com/admin/re-auth

Esta validación es de carácter obligatorio para todo el equipo de soporte técnico de nivel 2.',
  'phishing',
  'confianza',
  'medio',
  true,
  'Caso Mailchimp (2022): Campaña de ingeniería social y spear phishing dirigida específicamente a empleados y contratistas de soporte al cliente. Los atacantes obtuvieron credenciales internas para ingresar a las herramientas de administración corporativa, logrando sustraer datos y listas de correos de usuarios de plataformas de criptomonedas.',
  'Mailchimp Official Security Notice & BleepingComputer, 2022',
  'https://mailchimp.com/about/security/',
  true
),

-- 12. Anthem (2015)
(
  'Spear phishing con dominio apócrifo de recursos humanos (Caso Anthem)',
  'De: Recursos Humanos y Beneficios Médicos <beneficios@we11point-benefits.com>
Para: administrador.sistemas@anthem.com
Asunto: Consulta sobre actualización de póliza de salud y plan de jubilación

Estimado colega:

Te compartimos la tabla comparativa de los ajustes en la cobertura médica corporativa y los aportes al fondo previsional aplicables a partir del siguiente trimestre fiscal.

Puedes descargar y revisar el reporte detallado con las deducciones de nómina en el siguiente enlace de nuestra intranet de beneficios:

http://we11point-benefits.com/plan-salud-2015/documento.php

Por favor corrobora que la categoría asignada a tu cargo corresponda con tu contrato actual.',
  'phishing',
  'curiosidad',
  'alto',
  true,
  'Caso Anthem (2015): Una de las mayores brechas de datos de salud de la historia (afectó a casi 80 millones de personas). Se originó mediante correos de spear phishing dirigidos a administradores de sistemas utilizando dominios maliciosos tipográficos (we11point.com con "11" en lugar de "ll" imitando la matriz WellPoint), descargando malware que capturó credenciales privilegiadas.',
  'Mandiant Threat Research & U.S. Department of Health and Human Services (HHS), 2015',
  'https://www.hhs.gov/',
  true
),

-- 13. Sony Pictures (2014)
(
  'Falsa alerta de seguridad de Apple ID dirigida a ejecutivos (Caso Sony Pictures)',
  'De: Apple Security Verification <service@apple-support-id-verification.com>
Para: ejecutivo.senior@spe.sony.com
Asunto: Su ID de Apple ha sido bloqueado por motivos de seguridad

Estimado cliente:

Le informamos que su cuenta de Apple ID asociada a sus dispositivos corporativos (iPhone / iPad / MacBook) ha sido bloqueada temporalmente debido a múltiples intentos de inicio de sesión no autorizados detectados desde una ubicación inusual.

Para proteger sus respaldos de iCloud, notas y llavero de contraseñas sincronizadas, debe validar sus datos de autenticación de inmediato:

>> [Verificar y desbloquear mi Apple ID ahora](https://apple-support-id-verification.com/restore-account)

Si no realiza esta confirmación en las próximas 24 horas, su cuenta y los respaldos en la nube quedarán congelados de forma permanente.',
  'phishing',
  'autoridad',
  'medio',
  true,
  'Caso Sony Pictures (2014): En los meses previos al ataque devastador de borrado de datos y filtración de películas, atacantes patrocinados por estados ejecutaron campañas dirigidas de spear phishing contra altos ejecutivos de Sony suplantando alertas de seguridad de Apple ID, recolectando contraseñas que les facilitaron el ingreso inicial a la red corporativa.',
  'U.S. Department of Justice (DOJ) Indictment & Novetta Project Blockbuster Report, 2014-2016',
  'https://www.justice.gov/',
  true
),

-- 14. Target (2013)
(
  'Acceso por credenciales de contratista de climatización HVAC (Caso Target)',
  'De: Fazio Mechanical Services Support <portal-vendor@fazio-mechanical-portal.net>
Para: tecnico.refrigeracion@contratista-hvac.com
Asunto: [REVISIÓN DE PROVEEDOR] Acceso a portal de facturación Target Vendor

Estimado técnico:

Como contratista autorizado de sistemas de climatización y refrigeración (HVAC) para las sucursales de Target Corporation, debes validar tus credenciales en el portal electrónico de facturación y monitoreo de instalaciones antes de la inspección mensual de tiendas.

Para registrar tus partes de trabajo y órdenes de compra en el sistema central de Target, actualiza tu certificado de acceso digital aquí:

http://fazio-mechanical-portal.net/target-billing/auth.php

No podrás ingresar reportes de servicio sin haber completado este paso.',
  'pretexting',
  'confianza',
  'alto',
  true,
  'Caso Target (2013): Compromiso masivo que expuso los datos de 40 millones de tarjetas de crédito y débito. Los atacantes no atacaron inicialmente a Target de forma directa; enviaron correos de phishing a un pequeño proveedor externo de climatización (Fazio Mechanical Services). Al robar las credenciales del contratista, ingresaron a la red de Target y se movieron lateralmente hasta los terminales de punto de venta (POS).',
  'KrebsOnSecurity Investigation & U.S. Senate Committee on Commerce Testimony, 2014',
  'https://krebsonsecurity.com/2014/02/target-hackers-got-in-through-hvac-guy/',
  true
),

-- 15. Falsa oferta de "trabajo desde casa"
(
  'Oferta laboral remota con pago previo de kit de inducción',
  'Canal: Anuncio patrocinado en redes sociales / Mensaje directo
Remitente: Reclutamiento y Selección Global Perú

"¡Gran convocatoria laboral para trabajo 100% remoto desde casa! 

Empresa transnacional de logística busca personal para transcripción de pedidos y atención al cliente digital. Sueldo mensual de S/. 2,800 a S/. 3,500 soles, horario flexible de 4 horas diarias, sin experiencia previa.

Requisito indispensable para formalizar la contratación: adquirir el Kit Digital de Inducción y Software de Seguridad Certificado por un costo único reembolsable de S/. 85.00 soles que se reintegrará en tu primera quincena.

Inscríbete y realiza tu pago de activación aquí: http://empleos-remotos-peru.com/postular"',
  'baiting',
  'recompensa',
  'bajo',
  true,
  'Modalidad de cebo masivo (Baiting) y falso empleo documentada recurrentemente en alertas de Indecopi y la División de Investigación de Delitos de Alta Tecnología (Divindat - PNP). Se aprovecha de la necesidad de empleo de los ciudadanos ofreciendo salarios atractivos a cambio de pequeños pagos por adelantado para supuestos "materiales", "pruebas psicológicas" o "kits de inducción".',
  'Indecopi Perú (Alertas de Protección al Consumidor) & Divindat PNP, 2023-2024',
  'https://www.gob.pe/indecopi',
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
