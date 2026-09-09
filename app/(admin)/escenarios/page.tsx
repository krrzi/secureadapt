import { createClient } from '@/lib/supabase/server';
import { ScenarioAdmin } from './ScenarioAdmin';
import type { Escenario } from '@/lib/types';

export default async function AdminEscenariosPage() {
  const supabase = createClient();

  const { data: escenariosRaw, error } = await supabase
    .from('escenarios')
    .select('*')
    .order('categoria', { ascending: true })
    .order('dificultad', { ascending: true })
    .order('created_at', { ascending: false });

  const escenarios = (escenariosRaw as Escenario[] | null) ?? [];

  if (error) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="card p-6 text-center">
          <p className="text-danger-600 font-semibold">
            Error al cargar escenarios: {error.message}
          </p>
          <p className="text-sm text-surface-500 mt-1">
            Verifica que las políticas RLS permitan a admin leer la tabla.
          </p>
        </div>
      </div>
    );
  }

  return <ScenarioAdmin initialEscenarios={escenarios} />;
}
