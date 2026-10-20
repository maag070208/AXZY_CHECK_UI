import { ITBadget, ITButton, ITLoader } from "@axzydev/axzy_ui_system";
import { useCallback, useEffect, useState } from "react";
import { getOccupancy, OccupancyView } from "./occupancy.service";
import { OccupancyModal } from "./OccupancyModal";

interface Props {
  propertyId: number;
  onChanged: () => void;
}

const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString("es-MX") : "—");

/** Ocupación vigente, residentes del hogar e historial de ocupación (A1). */
export const OccupancyPanel = ({ propertyId, onChanged }: Props) => {
  const [view, setView] = useState<OccupancyView | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res: any = await getOccupancy(propertyId);
    setView(res.data ?? null);
    setLoading(false);
  }, [propertyId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <div className="flex justify-center p-6"><ITLoader size="sm" /></div>;
  if (!view) return null;

  return (
    <section className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Ocupación</h2>
          <p className="text-sm text-slate-500">
            {view.residentCount} residente(s){view.maxResidents !== null ? ` de ${view.maxResidents} máximo` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ITBadget size="sm" variant="filled" color="primary">{view.status?.name ?? "Sin estado"}</ITBadget>
          <ITButton size="sm" onClick={() => setModalOpen(true)}>Cambiar ocupación</ITButton>
        </div>
      </div>

      {view.overcrowded && (
        <p role="alert" className="text-sm text-red-700 bg-red-50 rounded-xl px-4 py-2">
          Sobreocupación: hay más residentes que el máximo permitido.
        </p>
      )}

      {view.current && (
        <p className="text-sm text-slate-600">
          Vigente desde <strong>{fmt(view.current.startDate)}</strong>
          {view.current.tenant ? ` · Inquilino: ${view.current.tenant.firstName} ${view.current.tenant.lastName ?? ""}` : ""}
          {view.current.owner ? ` · Propietario que habita: ${view.current.owner.firstName}` : ""}
        </p>
      )}

      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-2">Historial</h3>
        <ul className="divide-y divide-slate-100 text-sm">
          {view.history.map((p) => (
            <li key={p.id} className="py-2 flex justify-between gap-4">
              <span>{p.status.name}{p.tenant ? ` · ${p.tenant.firstName}` : ""}</span>
              <span className="text-slate-500">{fmt(p.startDate)} → {p.endDate ? fmt(p.endDate) : "vigente"}</span>
            </li>
          ))}
          {view.history.length === 0 && <li className="py-2 text-slate-400">Sin historial</li>}
        </ul>
      </div>

      <OccupancyModal
        isOpen={modalOpen}
        propertyId={propertyId}
        currentCode={view.status?.code ?? null}
        onClose={() => setModalOpen(false)}
        onDone={() => {
          void load();
          onChanged();
        }}
      />
    </section>
  );
};
