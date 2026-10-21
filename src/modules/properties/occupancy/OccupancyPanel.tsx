import { ITBadget, ITButton, ITFlex, ITLoader, ITText } from "@axzydev/axzy_ui_system";
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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    setLoadError(null);
    try {
      const res: any = await getOccupancy(propertyId);
      if (res.success === false) {
        setView(null);
        setLoadError(res.messages?.[0] ?? "No se pudo cargar la ocupación");
      } else {
        setView(res.data ?? null);
      }
    } catch (error: any) {
      setView(null);
      setLoadError(error?.messages?.[0] ?? "No se pudo cargar la ocupación");
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    void load(true);
  }, [load]);

  if (loading) return <ITFlex justify="center" className="flex justify-center p-6"><ITLoader size="sm" /></ITFlex>;

  if (loadError) {
    return (
      <section className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8 space-y-4">
        <ITText as="h2" className="text-lg font-bold text-slate-800">Ocupación</ITText>
        <ITText as="p" role="alert" className="text-sm text-red-600">{loadError}</ITText>
        <ITButton size="sm" variant="outlined" onClick={() => void load(true)}>Reintentar</ITButton>
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8 space-y-6">
      <ITFlex align="center" justify="between" gap={4} className="flex items-center justify-between gap-4">
        <ITFlex direction="column">
          <ITText as="h2" className="text-lg font-bold text-slate-800">Ocupación</ITText>
          <ITText as="p" className="text-sm text-slate-500">
            {view.residentCount} residente(s){view.maxResidents !== null ? ` de ${view.maxResidents} máximo` : ""}
          </ITText>
        </ITFlex>
        <ITFlex align="center" gap={3} className="flex items-center gap-3">
          <ITBadget size="sm" variant="filled" color="primary">{view.status?.name ?? "Sin estado"}</ITBadget>
          <ITButton size="sm" onClick={() => setModalOpen(true)}>Cambiar ocupación</ITButton>
        </ITFlex>
      </ITFlex>

      {view.overcrowded && (
        <p role="alert" className="text-sm text-red-700 bg-red-50 rounded-xl px-4 py-2">
          Sobreocupación: hay más residentes que el máximo permitido.
        </p>
      )}

      {view.current && (
        <ITText as="p" className="text-sm text-slate-600">
          Vigente desde <strong>{fmt(view.current.startDate)}</strong>
          {view.current.tenant ? ` · Inquilino: ${view.current.tenant.firstName} ${view.current.tenant.lastName ?? ""}` : ""}
          {view.current.owner ? ` · Propietario que habita: ${view.current.owner.firstName}` : ""}
        </ITText>
      )}

      <ITFlex direction="column">
        <ITText as="h3" className="text-sm font-semibold text-slate-700 mb-2">Historial</ITText>
        <ul className="divide-y divide-slate-100 text-sm">
          {view.history.map((p) => (
            <li key={p.id} className="py-2 flex justify-between gap-4">
              <ITText as="span">{p.status.name}{p.tenant ? ` · ${p.tenant.firstName}` : ""}</ITText>
              <ITText as="span" className="text-slate-500">{fmt(p.startDate)} → {p.endDate ? fmt(p.endDate) : "vigente"}</ITText>
            </li>
          ))}
          {view.history.length === 0 && <li className="py-2 text-slate-400">Sin historial</li>}
        </ul>
      </ITFlex>

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
