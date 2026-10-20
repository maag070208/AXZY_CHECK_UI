import { ITLoader } from "@axzydev/axzy_ui_system";
import { useEffect, useState } from "react";
import { getOccupancyStats, OccupancyStats } from "./occupancy.service";

/** Conteos de ocupación del residencial (dashboard de A1). */
export const OccupancyDashboard = () => {
  const [stats, setStats] = useState<OccupancyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // El cliente lanza el cuerpo en respuestas no 2xx: sin catch el spinner nunca se apaga.
    getOccupancyStats()
      .then((res) => setStats(res.data ?? null))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center p-4"><ITLoader size="sm" /></div>;
  if (!stats) return null;

  const max = Math.max(1, ...stats.byStatus.map((s) => s.count));
  return (
    <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-wide text-slate-400">Propiedades</p>
        <p className="text-3xl font-bold text-slate-800">{stats.properties}</p>
        <p className="text-sm text-slate-500">{stats.residents} residentes</p>
        {stats.overcrowded > 0 && <p className="text-sm text-red-600">{stats.overcrowded} sobreocupada(s)</p>}
      </div>
      <div className="lg:col-span-3 space-y-2">
        {stats.byStatus.map((s) => (
          <div key={s.code} className="flex items-center gap-3 text-sm">
            <span className="w-44 text-slate-600">{s.name}</span>
            <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
              <div className="bg-primary-500 h-2" style={{ width: `${(s.count / max) * 100}%` }} />
            </div>
            <span className="w-10 text-right font-semibold text-slate-700">{s.count}</span>
          </div>
        ))}
      </div>
    </section>
  );
};
