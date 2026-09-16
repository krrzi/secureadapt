import Link from 'next/link';
import {
  Shield,
  ShieldAlert,
  Mail,
  Phone,
  MessageSquare,
  AlertTriangle,
  Package,
  Target,
  TrendingUp,
  Users,
  ArrowRight,
  CheckCircle2,
  Zap,
  Brain,
  BarChart3,
  BookOpen,
  Award,
  Sparkles,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-50">
      {/* Navbar público */}
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-surface-200">
        <div className="page-container flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5 font-bold text-surface-900">
            <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-brand-600/20">
              <Shield className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-surface-900 text-base leading-none">
                SecureAdapt
              </span>
              <span className="text-[10px] font-semibold text-brand-600 uppercase tracking-wider mt-0.5">
                Investigación Universitaria
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/metodologia"
              className="text-xs sm:text-sm font-semibold text-surface-600 hover:text-brand-600 px-3 py-2 rounded-lg transition-colors hidden sm:block"
            >
              Metodología
            </Link>
            <Link href="/login" className="btn-ghost text-xs sm:text-sm">
              Iniciar sesión
            </Link>
            <Link href="/registro" className="btn-primary btn-sm text-xs sm:text-sm">
              Registrarse
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:py-28">
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-brand-50/70 via-transparent to-transparent -z-10"
        />
        <div
          aria-hidden
          className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-brand-200/40 rounded-full blur-3xl -z-10"
        />

        <div className="page-container relative z-10 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-200 text-brand-700 rounded-full px-4 py-1.5 text-xs font-bold mb-6 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            Entrenamiento Adaptativo Bidimensional · Basado en Casos Reales
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-surface-900 tracking-tight leading-[1.15]">
            Aprende a neutralizar la{' '}
            <span className="text-gradient">ingeniería social</span>{' '}
            con incidentes reales documentados.
          </h1>

          <p className="mt-6 text-base sm:text-lg text-surface-600 max-w-2xl mx-auto leading-relaxed">
            Plataforma universitaria con motor adaptativo bidimensional (Canal × Vector Psicológico).
            Entrena contra spear phishing, llamadas de vishing, ataques por SMS y pretexting extraídos
            de incidentes históricos documentados por APWG, FBI IC3 y la banca peruana.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3.5 justify-center items-center">
            <Link href="/registro" className="btn-primary btn-lg w-full sm:w-auto shadow-lg shadow-brand-600/20">
              Comenzar entrenamiento gratis <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/metodologia" className="btn-secondary btn-lg w-full sm:w-auto flex items-center justify-center gap-2">
              <BookOpen className="w-4 h-4 text-surface-500" />
              Ver sustento metodológico
            </Link>
          </div>

          {/* Key Metric Highlights */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            <div className="card p-4 text-center border-surface-200">
              <p className="text-3xl font-black text-brand-600">31+</p>
              <p className="text-xs font-medium text-surface-500 mt-1">Casos Reales Citados</p>
            </div>
            <div className="card p-4 text-center border-surface-200">
              <p className="text-3xl font-black text-brand-600">5</p>
              <p className="text-xs font-medium text-surface-500 mt-1">Canales de Ataque</p>
            </div>
            <div className="card p-4 text-center border-surface-200">
              <p className="text-3xl font-black text-brand-600">6</p>
              <p className="text-xs font-medium text-surface-500 mt-1">Vectores Psicológicos</p>
            </div>
            <div className="card p-4 text-center border-surface-200">
              <p className="text-3xl font-black text-brand-600">100%</p>
              <p className="text-xs font-medium text-surface-500 mt-1">Adaptabilidad 2D</p>
            </div>
          </div>
        </div>
      </section>

      {/* Los 5 Canales */}
      <section className="page-container py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">
            Cobertura Completa
          </span>
          <h2 className="text-3xl font-black text-surface-900 mt-1">
            Los 5 Canales de Ataque Evaluados
          </h2>
          <p className="text-sm text-surface-500 mt-2">
            Incidentes extraídos de investigaciones forenses de brechas reales de seguridad.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            {
              icon: <Mail className="w-5 h-5 text-red-600" />,
              title: 'Phishing',
              tag: 'Email & Web',
              desc: 'Suplantación de BCP, fraudes BEC a Google/Facebook y spear phishing de RSA SecurID.',
            },
            {
              icon: <Phone className="w-5 h-5 text-purple-600" />,
              title: 'Vishing',
              tag: 'Voz & MFA',
              desc: 'Llamadas de soporte técnico falso en el caso Twitter 2020 y fatiga MFA en Uber 2022.',
            },
            {
              icon: <MessageSquare className="w-5 h-5 text-blue-600" />,
              title: 'Smishing',
              tag: 'SMS Móvil',
              desc: 'Campaña 0ktapus (Twilio), paquetería fraudulenta y alertas falsas de consumo bancario.',
            },
            {
              icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
              title: 'Pretexting',
              tag: 'Reconocimiento',
              desc: 'Scattered Spider vía LinkedIn, usurpación con biometría filtrada y pretextos de RRHH.',
            },
            {
              icon: <Package className="w-5 h-5 text-emerald-600" />,
              title: 'Baiting',
              tag: 'Cebos',
              desc: 'Memorias USB en cafeterías corporativas, falsos sorteos en redes y hojas de sueldos.',
            },
          ].map((cat) => (
            <div key={cat.title} className="card p-5 border-surface-200 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-surface-50 flex items-center justify-center border border-surface-200 mb-3">
                {cat.icon}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md">
                {cat.tag}
              </span>
              <h3 className="font-bold text-base text-surface-900 mt-2">{cat.title}</h3>
              <p className="text-xs text-surface-500 mt-1.5 leading-relaxed">{cat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Características Clave de la Investigación */}
      <section className="bg-white border-y border-surface-200 py-16">
        <div className="page-container">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-black text-surface-900">
              ¿Por qué es una herramienta de investigación real?
            </h2>
            <p className="text-sm text-surface-500 mt-2">
              Diseñada para la experimentación con usuarios reales y publicación científica.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-surface-50 border border-surface-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold">
                <Brain className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-surface-900">
                Adaptación Dinámica 2D
              </h3>
              <p className="text-xs text-surface-600 leading-relaxed">
                Si un participante es vulnerable a la <em>urgencia</em> en llamadas telefónicas, el motor
                intensifica ese cruce exacto y modula la dificultad en tiempo real según sus rachas.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface-50 border border-surface-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-surface-900">
                Cero Ficción: Fuentes Reales
              </h3>
              <p className="text-xs text-surface-600 leading-relaxed">
                Cada respuesta acertada o fallida expone la fuente oficial del incidente (comunicados de
                Twitter, Okta, informes del DOJ o reportes de la PNP en Perú), maximizando el aprendizaje.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface-50 border border-surface-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-surface-900">
                Certificación y Métricas
              </h3>
              <p className="text-xs text-surface-600 leading-relaxed">
                Genera constancias universitarias de participación con código criptográfico e informes
                exhaustivos de falsos positivos vs falsos negativos para el análisis estadístico.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="page-container py-10 text-center text-xs text-surface-400 space-y-2">
        <p>© {new Date().getFullYear()} SecureAdapt · Proyecto de Investigación Universitaria.</p>
        <p className="space-x-3">
          <Link href="/metodologia" className="hover:text-surface-600 underline">
            Metodología Científica
          </Link>
          <span>·</span>
          <Link href="/login" className="hover:text-surface-600 underline">
            Acceso a la Plataforma
          </Link>
        </p>
      </footer>
    </div>
  );
}
