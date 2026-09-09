import Link from 'next/link';
import {
  Shield,
  ShieldAlert,
  Mail,
  Phone,
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
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-50">
      {/* Navbar público */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-surface-200">
        <div className="page-container flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5 font-bold text-surface-900">
            <div className="w-9 h-9 bg-brand-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span>SecureAdapt</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="btn-ghost">
              Iniciar sesión
            </Link>
            <Link href="/registro" className="btn-primary btn-sm">
              Registrarse
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-brand-50 to-transparent -z-0"
        />
        <div
          aria-hidden
          className="absolute top-0 left-1/3 w-[400px] h-[400px] bg-brand-200/30 rounded-full blur-3xl -translate-y-1/3 -z-0"
        />
        <div className="page-container relative z-10 py-20 lg:py-28">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-100 text-brand-700 rounded-full px-4 py-1.5 text-xs font-semibold mb-6">
              <Zap className="w-3.5 h-3.5" />
              Proyecto universitario · Entrenamiento adaptativo
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-surface-900 tracking-tight">
              Detecta ataques de{' '}
              <span className="text-gradient">ingeniería social</span>
              <br />
              antes de que te afecten.
            </h1>
            <p className="mt-5 text-lg text-surface-600 max-w-2xl mx-auto leading-relaxed">
              SecureAdapt es una plataforma de entrenamiento personalizada que
              te enseña a identificar phishing, pretexting, baiting y vishing.
              Cuanto más entrenas, mejor se adapta a tus puntos débiles.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/registro" className="btn-primary btn-lg">
                Empezar gratis <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/login" className="btn-secondary btn-lg">
                Ya tengo cuenta
              </Link>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-6 max-w-lg mx-auto">
              <div className="text-center">
                <p className="text-2xl font-black text-brand-600">4</p>
                <p className="text-xs text-surface-500 mt-1">Categorías de ataque</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-brand-600">20+</p>
                <p className="text-xs text-surface-500 mt-1">Escenarios reales</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-brand-600">100%</p>
                <p className="text-xs text-surface-500 mt-1">Adaptable a ti</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categorías */}
      <section className="page-container py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-black text-surface-900">
            Los 4 vectores de ataque más comunes
          </h2>
          <p className="mt-2 text-surface-500">
            Entrenarás contra todos los métodos que usan los atacantes reales
            para engañar a personas en empresas y entornos personales.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              icon: <Mail className="w-6 h-6" />,
              color: 'text-red-600',
              bg: 'bg-red-50 border-red-100',
              iconBg: 'bg-red-100',
              title: 'Phishing',
              desc:
                'Correos y webs falsas que suplantan identidades bancarias, de empresas o contactos conocidos para robar credenciales.',
            },
            {
              icon: <AlertTriangle className="w-6 h-6" />,
              color: 'text-orange-600',
              bg: 'bg-orange-50 border-orange-100',
              iconBg: 'bg-orange-100',
              title: 'Pretexting',
              desc:
                'Inventar una identidad o un contexto falso por teléfono, mensaje o visita para obtener información interna (autoridad falsa, IT fingido, etc.).',
            },
            {
              icon: <Package className="w-6 h-6" />,
              color: 'text-yellow-600',
              bg: 'bg-yellow-50 border-yellow-100',
              iconBg: 'bg-yellow-100',
              title: 'Baiting',
              desc:
                'El "anzuelo": USBs encontrados en oficinas, archivos gratis, ofertas demasiado buenas para ser verdad, todo con malware dentro.',
            },
            {
              icon: <Phone className="w-6 h-6" />,
              color: 'text-purple-600',
              bg: 'bg-purple-50 border-purple-100',
              iconBg: 'bg-purple-100',
              title: 'Vishing',
              desc:
                'Phishing por VOZ. Llamadas que suplantan Hacienda, tu banco o soporte técnico para que reveles datos o instales software remoto.',
            },
          ].map((c) => (
            <div
              key={c.title}
              className={`card p-6 border ${c.bg} hover:-translate-y-1 transition-all duration-200`}
            >
              <div
                className={`w-12 h-12 rounded-xl ${c.iconBg} ${c.color} flex items-center justify-center mb-4`}
              >
                {c.icon}
              </div>
              <h3 className={`text-lg font-bold ${c.color}`}>{c.title}</h3>
              <p className="text-sm text-surface-600 mt-2 leading-relaxed">
                {c.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="bg-surface-900 text-white py-16">
        <div className="page-container">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl font-black">¿Cómo funciona el entrenamiento?</h2>
            <p className="mt-2 text-surface-400">
              Sistema adaptativo que aprende de tus errores para hacerte más fuerte.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                icon: <Target className="w-7 h-7" />,
                title: 'Analiza y decide',
                desc:
                  'Recibes correos, mensajes y guiones de llamada realistas. Tienes que decidir rápidamente si son ataques o mensajes legítimos.',
              },
              {
                step: '02',
                icon: <Brain className="w-7 h-7" />,
                title: 'El algoritmo aprende de ti',
                desc:
                  'Si fallas 2 veces seguidas en phishing, recibirás más escenarios de esa categoría. Si aciertas 3 veces seguidas, la dificultad sube.',
              },
              {
                step: '03',
                icon: <BarChart3 className="w-7 h-7" />,
                title: 'Mejora con datos',
                desc:
                  'Consulta tu dashboard: precisión por categoría, evolución por sesión, falsos positivos/negativos y tu racha actual.',
              },
            ].map((s) => (
              <div
                key={s.step}
                className="relative bg-surface-800 rounded-2xl p-7 border border-surface-700"
              >
                <div className="text-5xl font-black text-brand-400/40 absolute top-4 right-5 select-none">
                  {s.step}
                </div>
                <div className="w-14 h-14 rounded-2xl bg-brand-600/20 text-brand-300 flex items-center justify-center mb-5">
                  {s.icon}
                </div>
                <h3 className="text-xl font-bold">{s.title}</h3>
                <p className="mt-2 text-sm text-surface-400 leading-relaxed">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto text-surface-300">
            {[
              'Cronómetro por escenario para medir tu respuesta',
              '+20 escenarios semilla en 4 categorías distintas',
              'Explicación detallada tras cada respuesta',
              'CRUD de escenarios para el panel administrador',
              'Registro con Supabase Auth con políticas RLS',
              'Panel de administración con métricas globales',
            ].map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-success-400 flex-shrink-0" />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="page-container py-20">
        <div className="card overflow-hidden">
          <div className="p-10 lg:p-14 bg-gradient-to-br from-brand-600 to-brand-700 text-white text-center">
            <Users className="w-12 h-12 text-brand-200 mx-auto mb-5" />
            <h2 className="text-3xl lg:text-4xl font-black">
              Empieza a entrenar hoy mismo
            </h2>
            <p className="mt-3 max-w-xl mx-auto text-brand-100">
              Regístrate gratis y completa tu primera sesión de 10 escenarios
              en menos de 5 minutos. Verás tu progreso desde el primer día.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/registro"
                className="btn bg-white text-brand-700 hover:bg-brand-50 btn-lg font-semibold"
              >
                Crear cuenta gratis <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                className="btn bg-white/10 text-white border border-white/20 hover:bg-white/20 btn-lg font-semibold"
              >
                Iniciar sesión
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-200 bg-white">
        <div className="page-container py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-surface-800">SecureAdapt</p>
              <p className="text-xs text-surface-400">
                Proyecto universitario · Entrenamiento adaptativo
              </p>
            </div>
          </div>
          <div className="text-xs text-surface-400 flex items-center gap-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            Hecho con fines educativos. Desplegable en Vercel + Supabase.
          </div>
        </div>
      </footer>
    </div>
  );
}
