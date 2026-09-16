import Link from 'next/link';
import {
  Shield,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  FileText,
  AlertTriangle,
  Building2,
  GraduationCap,
  Globe2,
  Search,
  ArrowRight,
  Sparkles,
  MapPin,
  TrendingUp,
} from 'lucide-react';

export const metadata = {
  title: 'Metodología y Trazabilidad Científica | SecureAdapt',
  description:
    'Sustentación metodológica del banco de escenarios de ingeniería social basado exclusivamente en incidentes reales documentados.',
};

export default function MetodologiaPage() {
  const fuentesPrincipales = [
    {
      entidad: 'Anti-Phishing Working Group (APWG)',
      cobertura: 'Reportes trimestrales globales de tendencias de phishing y vectores de cebo.',
      url: 'https://apwg.org/',
      casos: 'Patrones de urgencia de 2h, smishing de paquetería y cebos USB corporativos.',
    },
    {
      entidad: 'FBI Internet Crime Complaint Center (IC3)',
      cobertura: 'Informes anuales de delincuencia cibernética y Business Email Compromise (BEC).',
      url: 'https://www.ic3.gov/',
      casos: 'Fraudes al CEO, suplantación de nóminas de RRHH y desvío de facturación.',
    },
    {
      entidad: 'U.S. Department of Justice (DOJ)',
      cobertura: 'Casos judiciales federales con evidencia pericial y sentencias firmes.',
      url: 'https://www.justice.gov/',
      casos: 'Caso Evaldas Rimasauskas ($100M+ a Google/Facebook) y autores del Caso Twitter 2020.',
    },
    {
      entidad: 'Group-IB & Okta Security',
      cobertura: 'Análisis forense de campañas de vishing y fatiga por autenticación multifactor.',
      url: 'https://www.group-ib.com/',
      casos: 'Scattered Spider (MGM Resorts, Caesars Entertainment) y Campaña 0ktapus (Twilio).',
    },
    {
      entidad: 'RSA Security (Blog oficial Uri Rivner) & F-Secure',
      cobertura: 'Análisis detallado de la brecha de día cero a SecurID en 2011.',
      url: 'https://blogs.rsa.com/',
      casos: 'Spear phishing con 2011 Recruitment Plan.xls y suplantación de Beyond.com.',
    },
    {
      entidad: 'ESET Latinoamérica (WeLiveSecurity) & Diario Gestión',
      cobertura: 'Monitoreo de amenazas bancarias y phishing focalizado en entidades peruanas.',
      url: 'https://www.welivesecurity.com/la-es/',
      casos: 'Clonación de banca por internet BCP y alertas de robo de credenciales.',
    },
    {
      entidad: 'Universidad Autónoma del Perú (Tesis 2024)',
      cobertura: 'Investigación académica "El delito de phishing en las entidades financieras del Perú".',
      url: 'https://repositorio.autonoma.edu.pe/',
      casos: 'Estadísticas peruanas 2024, smishing bancario y vulnerabilidad regional.',
    },
    {
      entidad: 'Indecopi Perú & Divindat - PNP',
      cobertura: 'Alertas ciudadanas contra estafas digitales, bonos falsos y compras online.',
      url: 'https://www.gob.pe/indecopi',
      casos: 'Suplantación de subsidios del Estado, sorteos falsos y soporte Microsoft apócrifo.',
    },
  ];

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Top Header */}
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-surface-200">
        <div className="page-container flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-surface-900">
            <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-brand-600/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="font-black text-surface-900">SecureAdapt</span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                Metodología
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="btn-secondary btn-sm">
              Dashboard
            </Link>
            <Link href="/entrenamiento" className="btn-primary btn-sm">
              Entrenar ahora
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Banner */}
      <section className="bg-gradient-to-b from-brand-900 via-brand-800 to-surface-900 text-white py-16 lg:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="page-container relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-brand-500/20 border border-brand-400/30 text-brand-200 rounded-full px-4 py-1 text-xs font-bold uppercase tracking-wider mb-5">
              <GraduationCap className="w-4 h-4 text-brand-300" />
              Sustento Científico y Experimental
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
              Metodología del Banco de Escenarios: Casos Reales Documentados
            </h1>
            <p className="mt-5 text-base md:text-lg text-surface-200 leading-relaxed font-normal">
              A diferencia de las plataformas tradicionales que utilizan simulaciones inventadas o
              genéricas, <strong>SecureAdapt</strong> fundamenta el 100% de su banco experimental en
              técnicas extraídas de <strong>incidentes reales documentados públicamente</strong> por
              organismos internacionales de ciberseguridad, autoridades judiciales y reportes
              técnicos corporativos.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="page-container py-12 space-y-12">
        {/* Contexto Local Perú */}
        <section className="card p-6 sm:p-8 border-brand-200/60 bg-gradient-to-br from-white to-brand-50/30">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
              <MapPin className="w-6 h-6" />
            </div>
            <div className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-black text-surface-900 tracking-tight">
                Contexto Local y Relevancia en el Perú
              </h2>
              <p className="text-sm text-surface-700 leading-relaxed">
                De acuerdo con la investigación académica{' '}
                <em className="font-semibold text-surface-900">
                  "El delito de phishing en las entidades financieras del Perú"
                </em>{' '}
                (Universidad Autónoma del Perú, 2024), en el territorio peruano se registraron{' '}
                <strong className="text-brand-700">~31.5 millones de intentos de phishing</strong>{' '}
                durante el último periodo anual, consolidando al país como uno de los principales
                focos de ataques de ingeniería social en la región andina.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-white border border-surface-200 shadow-xs">
                  <p className="text-2xl font-black text-rose-600">~31.5M</p>
                  <p className="text-xs font-medium text-surface-500 mt-1">
                    Intentos de phishing registrados en Perú (2024).
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-white border border-surface-200 shadow-xs">
                  <p className="text-2xl font-black text-brand-600">La Libertad</p>
                  <p className="text-xs font-medium text-surface-500 mt-1">
                    Una de las regiones con mayor concentración de reportes ante Indecopi y PNP.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-white border border-surface-200 shadow-xs">
                  <p className="text-2xl font-black text-amber-600">SMS y Banca</p>
                  <p className="text-xs font-medium text-surface-500 mt-1">
                    Canales predilectos de suplantación para vaciado de cuentas y créditos no autorizados.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Principio Metodológico */}
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-black text-surface-900 tracking-tight">
              Diseño del Banco Experimental
            </h2>
            <p className="text-sm text-surface-600 mt-1">
              Criterios de construcción para asegurar validez interna y externa en el estudio universitario.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card p-6 border-surface-200 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                1
              </div>
              <h3 className="font-bold text-base text-surface-900">
                Recreación de Técnicas Reales
              </h3>
              <p className="text-xs text-surface-600 leading-relaxed">
                Ningún escenario reproduce texto protegido o confidencial copiado textualmente. Se
                recrea con exactitud la <em>técnica de persuasión, vector psicológico y canal</em>{' '}
                utilizado por los cibercriminales en el incidente original documentado.
              </p>
            </div>

            <div className="card p-6 border-surface-200 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                2
              </div>
              <h3 className="font-bold text-base text-surface-900">
                Trazabilidad y Referenciación
              </h3>
              <p className="text-xs text-surface-600 leading-relaxed">
                Cada escenario de ataque cuenta de forma obligatoria con su metadato de{' '}
                <strong>fuente oficial</strong> (organismo, año y medio emisor). Tanto participantes
                como jurados evaluadores pueden auditar el origen verificable de los casos.
              </p>
            </div>

            <div className="card p-6 border-surface-200 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                3
              </div>
              <h3 className="font-bold text-base text-surface-900">
                Escenarios de Control Legítimos
              </h3>
              <p className="text-xs text-surface-600 leading-relaxed">
                Para medir con rigor experimental los <strong>falsos positivos</strong> (sesgo de
                paranoia), el banco incluye interacciones legítimas modeladas a partir de las guías
                oficiales de prevención publicadas por el sector bancario (ej. BCP) y normas ISO 27001.
              </p>
            </div>
          </div>
        </section>

        {/* Modelo Bidimensional */}
        <section className="card p-6 sm:p-8 space-y-6">
          <div>
            <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">
              Algoritmo Adaptativo
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-surface-900 mt-1">
              Taxonomía Bidimensional: Categoría × Vector Psicológico
            </h2>
            <p className="text-sm text-surface-600 mt-1">
              A diferencia de modelos unidimensionales que sólo clasifican por medio (email, teléfono),
              SecureAdapt analiza la técnica de manipulación cognitiva subyacente.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-3">
              <h3 className="font-bold text-surface-800 text-sm flex items-center gap-2">
                <Globe2 className="w-4 h-4 text-brand-600" />
                Dimensión 1: Categorías de Ataque (Canales)
              </h3>
              <ul className="space-y-2 text-xs text-surface-700">
                <li className="p-2.5 rounded-lg bg-surface-50 border border-surface-200">
                  <strong>Phishing:</strong> Comunicaciones por correo o enlaces web suplantando entidades de confianza.
                </li>
                <li className="p-2.5 rounded-lg bg-surface-50 border border-surface-200">
                  <strong>Vishing:</strong> Ingeniería social por llamadas de voz y explotación de soporte técnico.
                </li>
                <li className="p-2.5 rounded-lg bg-surface-50 border border-surface-200">
                  <strong>Smishing:</strong> Mensajes SMS móviles con enlaces a portales clonados (nuevo vector crítico).
                </li>
                <li className="p-2.5 rounded-lg bg-surface-50 border border-surface-200">
                  <strong>Pretexting:</strong> Escenarios elaborados, reconocimiento previo (LinkedIn) y usurpación.
                </li>
                <li className="p-2.5 rounded-lg bg-surface-50 border border-surface-200">
                  <strong>Baiting:</strong> Cebos tentadores (USB abandonadas, hojas de sueldos o software gratis).
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-surface-800 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-600" />
                Dimensión 2: Vectores Psicológicos (Gatilladores Cognitivos)
              </h3>
              <ul className="space-y-2 text-xs text-surface-700">
                <li className="p-2.5 rounded-lg bg-rose-50/60 border border-rose-200/60">
                  <strong>Urgencia:</strong> Plazos límites artificiales (ej. 2 horas) que anulan la verificación.
                </li>
                <li className="p-2.5 rounded-lg bg-indigo-50/60 border border-indigo-200/60">
                  <strong>Autoridad:</strong> Figuras de mando, TI corporativo, directores o entidades recaudadoras.
                </li>
                <li className="p-2.5 rounded-lg bg-cyan-50/60 border border-cyan-200/60">
                  <strong>Confianza:</strong> Suplantación de proveedores reales, colegas o marcas bancarias conocidas.
                </li>
                <li className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-200/60">
                  <strong>Recompensa:</strong> Bonos del Estado, devoluciones tributarias o premios económicos.
                </li>
                <li className="p-2.5 rounded-lg bg-red-50/60 border border-red-200/60">
                  <strong>Amenaza:</strong> Miedo a embargos judiciales, cancelación de servicios o bloqueos.
                </li>
                <li className="p-2.5 rounded-lg bg-fuchsia-50/60 border border-fuchsia-200/60">
                  <strong>Curiosidad:</strong> Deseo de acceder a planes salariales confidenciales o filtraciones.
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Matriz de Fuentes Documentadas */}
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-black text-surface-900 tracking-tight">
              Matriz de Fuentes Documentales Primarias
            </h2>
            <p className="text-sm text-surface-600 mt-1">
              Catálogo de entidades y repositorios utilizados para la extracción de casos reales.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fuentesPrincipales.map((f) => (
              <div
                key={f.entidad}
                className="card p-5 border-surface-200 flex flex-col justify-between hover:border-brand-300 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-surface-900 text-sm">{f.entidad}</h3>
                    <a
                      href={f.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-600 hover:text-brand-800 text-xs font-semibold flex items-center gap-1"
                    >
                      Sitio Oficial <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <p className="text-xs text-surface-500 mt-1.5">{f.cobertura}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-surface-100">
                  <p className="text-[11px] text-surface-600 font-medium">
                    <strong className="text-surface-800">Casos en el banco:</strong> {f.casos}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA final */}
        <section className="p-8 rounded-3xl bg-brand-600 text-white text-center space-y-4 shadow-xl shadow-brand-600/20">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Experimenta el Entrenamiento Adaptativo
          </h2>
          <p className="text-sm text-brand-100 max-w-xl mx-auto leading-relaxed">
            Inicia una sesión de 10 escenarios reales para poner a prueba tu capacidad de detección y
            obtener tu perfil de riesgo cruzado.
          </p>
          <div className="pt-2">
            <Link
              href="/entrenamiento"
              className="inline-flex items-center gap-2 bg-white text-brand-700 font-bold px-6 py-3 rounded-2xl shadow-md hover:bg-surface-50 transition-all active:scale-95"
            >
              Comenzar sesión de entrenamiento
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
