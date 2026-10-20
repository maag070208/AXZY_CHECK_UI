import { ITBadget, ITButton, ITDataTable, ITDialog, ITFlex, ITPage, ITText } from "@axzydev/axzy_ui_system";
import { useCallback, useState } from "react";
import {
  FaBook,
  FaBroadcastTower,
  FaClipboardList,
  FaEye,
  FaKey,
  FaPhone,
  FaPlus,
  FaSwatchbook,
  FaTabletAlt,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import {
  getPaginatedShiftHandovers,
  getShiftHandoverDetail,
} from "../services/ShiftHandoverService";

const CHECKLIST_LABELS: { key: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "checklistPhones", label: "Teléfonos", icon: FaPhone },
  { key: "checklistTablet", label: "Tablet", icon: FaTabletAlt },
  { key: "checklistRadios", label: "Radios", icon: FaBroadcastTower },
  { key: "checklistKeys", label: "Llaves", icon: FaKey },
  { key: "checklistLogbook", label: "Bitácora", icon: FaBook },
  { key: "checklistConsignas", label: "Consignas", icon: FaClipboardList },
];

/**
 * "4.2 Entrega de turno" — historial + detalle desde WEB. La captura ahora
 * vive en su propia pantalla (`/shift-handover/nuevo`).
 */
const ShiftHandoverPage = () => {
  const navigate = useNavigate();
  const [detail, setDetail] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const memoizedFetch = useCallback((params: any) => getPaginatedShiftHandovers(params), []);

  const openDetail = async (id: number) => {
    const res = await getShiftHandoverDetail(id);
    if (res.success) {
      setDetail(res.data);
      setDetailOpen(true);
    }
  };

  return (
    <ITPage
      className="m-0! px-4! max-w-screen!"
      noPadding
      title="Entrega de Turno"
      breadcrumbs={[{ label: "Inicio", href: "#/home" }, { label: "Operación" }, { label: "Entrega de Turno" }]}
      description="Historial de reportes de cambio de turno (caseta, elementos y checklist de verificación)."
      icon={<FaSwatchbook size={20} />}
      iconColor="#065911"
      actions={
<ITButton onClick={() => navigate("/shift-handover/nuevo")} color="primary" size="md">
          <ITFlex align="center" gap={2}><FaPlus size={12} /> Nueva Entrega de Turno
        </ITFlex></ITButton>
      }
    >

      <ITFlex direction="column" className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <ITDataTable
          defaultItemsPerPage={50}
          itemsPerPageOptions={[25, 50, 100]}
          layout="fixed"
          density="compact"
          virtualized
          virtualizedMaxHeight={400}
          rowHeight={50}
          fetchData={memoizedFetch as any}
          title=""
          columns={[
            {
              key: "handoverDate",
              label: "FECHA",
              type: "string",
              render: (row: any) => (
                <ITText as="span" className="text-xs font-bold text-slate-700">
                  {new Date(row.handoverDate).toLocaleDateString("es-MX")}
                </ITText>
              ),
            },
            {
              key: "shiftType",
              label: "TURNO",
              type: "string",
              render: (row: any) => (
                <ITBadget
                  label={row.shiftType === "NOCTURNO" ? "Nocturno" : "Matutino"}
                  color={row.shiftType === "NOCTURNO" ? "primary" : "success"}
                  variant="filled"
                />
              ),
            },
            {
              key: "createdBy",
              label: "JEFE OPERATIVO",
              type: "string",
              render: (row: any) => (
                <ITText as="span" className="text-xs font-semibold text-slate-600">
                  {row.createdBy?.name} {row.createdBy?.lastName}
                </ITText>
              ),
            },
            {
              key: "elements",
              label: "ELEMENTOS",
              type: "number",
              render: (row: any) => <ITText as="span" className="text-xs">{row._count?.elements || 0}</ITText>,
            },
            {
              key: "reportedToAdmin",
              label: "NOVEDADES REPORTADAS",
              type: "string",
              render: (row: any) => (
                <ITBadget
                  label={row.reportedToAdmin ? "Sí" : "No"}
                  color={row.reportedToAdmin ? "success" : "danger"}
                  variant="filled"
                />
              ),
            },
            {
              key: "actions",
              label: "Acciones",
              type: "actions",
              actions: (row: any) => (
                <ITFlex align="center" gap={2} className="flex items-center gap-2">
                  <ITButton
                    onClick={() => openDetail(row.id)}
                    size="sm"
                    color="secondary"
                    variant="outlined"
                   
                    title="Ver detalles"
                  >
                    <FaEye />
                  </ITButton>
                </ITFlex>
              ),
            },
          ]}
        />
      </ITFlex>

      {/* Detalle de solo lectura */}
      <ITDialog isOpen={detailOpen} onClose={() => setDetailOpen(false)} title="Detalle de entrega de turno" className="!max-w-3xl">
        {detail && (
          <ITFlex direction="column" className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
            {(() => {
              const isNocturno = detail.shiftType === "NOCTURNO";
              const reported = detail.reportedToAdmin;
              const elements = detail.elements || [];
              const punctualCount = elements.filter((e: any) => e.punctual).length;
              const init = (n?: string, l?: string | null) =>
                `${(n || "?").charAt(0)}${(l || "").charAt(0) || ""}`.toUpperCase();

              const stat = (value: any, label: string, color: string) => (
                <ITFlex align="center" gap={3} className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4 flex items-center gap-3">
                  <ITFlex direction="column" className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center text-sm font-black flex-shrink-0`}>
                    {value ?? "—"}
                  </ITFlex>
                  <ITText as="p" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</ITText>
                </ITFlex>
              );

              return (
                <>
                  {/* Banner */}
                  <ITFlex direction="column"
                    className={`rounded-3xl p-6 text-white ${
                      isNocturno ? "bg-slate-900" : "bg-[#065911]"
                    }`}
                  >
                    <ITFlex align="center" gap={4} className="flex items-center gap-4">
                      <ITFlex align="center" justify="center" className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center text-2xl">
                        {isNocturno ? "🌙" : "☀️"}
                      </ITFlex>
                      <ITFlex direction="column" className="flex-1">
                        <ITText as="p" className="text-2xl font-black">Turno {isNocturno ? "Nocturno" : "Matutino"}</ITText>
                        <ITText as="p" className="text-white/75 text-sm font-medium capitalize">
                          {new Date(detail.handoverDate).toLocaleDateString("es-MX", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </ITText>
                      </ITFlex>
                    </ITFlex>
                    <ITFlex direction="column"
                      className={`inline-flex items-center gap-2 mt-5 rounded-full px-4 py-1.5 text-xs font-black ${
                        reported ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {reported ? "✓ Novedades reportadas" : "⚠ Novedades NO reportadas"}
                    </ITFlex>
                  </ITFlex>

                  {/* Jefe operativo */}
                  <ITFlex align="center" gap={3} className="flex items-center gap-3 bg-white border border-slate-100 rounded-2xl p-4">
                    <ITFlex align="center" justify="center" className="w-11 h-11 rounded-full bg-[#065911] text-white font-black flex items-center justify-center">
                      {init(detail.createdBy?.name, detail.createdBy?.lastName)}
                    </ITFlex>
                    <ITFlex direction="column">
                      <ITText as="p" className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Jefe Operativo</ITText>
                      <ITText as="p" className="text-sm font-bold text-slate-800">
                        {detail.createdBy?.name} {detail.createdBy?.lastName}
                      </ITText>
                    </ITFlex>
                  </ITFlex>

                  {/* Stats */}
                  <ITFlex direction="column" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {stat(elements.length, "Elementos", "bg-emerald-100 text-[#065911]")}
                    {stat(punctualCount, "Puntuales", "bg-green-100 text-green-700")}
                    {stat(detail.credentialsCount ?? "—", "Credenciales", "bg-sky-100 text-sky-700")}
                    {stat(detail.tarjetonesCount ?? "—", "Tarjetones", "bg-amber-100 text-amber-700")}
                  </ITFlex>

                  {/* Caseta */}
                  <ITFlex direction="column" className="bg-white border border-slate-100 rounded-2xl p-5">
                    <ITText as="p" className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Caseta</ITText>
                    <ITFlex direction="column" className="space-y-2 text-sm">
                      <ITText as="p" className="text-slate-600">
                        <ITText as="span" className="font-bold text-slate-800">Credenciales:</ITText> {detail.credentialsCount ?? "—"}
                      </ITText>
                      <ITText as="p" className="text-slate-600">
                        <ITText as="span" className="font-bold text-slate-800">Tarjetones:</ITText> {detail.tarjetonesCount ?? "—"}
                      </ITText>
                      <ITText as="p" className="text-slate-600">
                        <ITText as="span" className="font-bold text-slate-800">Novedades:</ITText>{" "}
                        {detail.novedades || "Sin novedades"}
                      </ITText>
                    </ITFlex>
                  </ITFlex>

                  {/* Verificación */}
                  <ITFlex direction="column" className="bg-white border border-slate-100 rounded-2xl p-5">
                    <ITText as="p" className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                      Verificación de entrega
                    </ITText>
                    <ITFlex direction="column" className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                      {CHECKLIST_LABELS.map((item) => {
                        const ok = !!detail[item.key];
                        return (
                          <div
                            key={item.key}
                            className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm ${
                              ok
                                ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                                : "bg-slate-50 border-slate-100 text-slate-400"
                            }`}
                          >
                            <item.icon className={ok ? "text-emerald-600" : "text-slate-400"} />
                            <ITText as="span" className="flex-1 font-semibold">{item.label}</ITText>
                            {ok ? "✓" : "✕"}
                          </div>
                        );
                      })}
                    </ITFlex>
                  </ITFlex>

                  {/* Elementos */}
                  <ITFlex direction="column">
                    <ITText as="p" className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                      Elementos ({elements.length})
                    </ITText>
                    {elements.length === 0 ? (
                      <ITText as="p" className="text-sm text-slate-400 text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        Sin elementos registrados.
                      </ITText>
                    ) : (
                      <ITFlex direction="column" className="space-y-2">
                        {elements.map((el: any) => (
                          <div
                            key={el.id}
                            className="flex items-center gap-3 bg-white border border-slate-100 rounded-2xl px-4 py-3"
                          >
                            <ITFlex align="center" justify="center" className="w-10 h-10 rounded-full bg-emerald-50 text-[#065911] font-black flex items-center justify-center text-xs border border-emerald-100">
                              {init(el.guard?.name, el.guard?.lastName)}
                            </ITFlex>
                            <ITFlex direction="column" className="flex-1 min-w-0">
                              <ITText as="p" className="text-sm font-bold text-slate-800">
                                {el.guard?.name} {el.guard?.lastName}
                              </ITText>
                              <ITText as="p" className="text-xs text-slate-400">
                                Entrada: {el.entryTime}
                                {el.observations ? ` · ${el.observations}` : ""}
                              </ITText>
                            </ITFlex>
                            <ITText as="span"
                              className={`text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider ${
                                el.punctual ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {el.punctual ? "Puntual" : "Retraso"}
                            </ITText>
                          </div>
                        ))}
                      </ITFlex>
                    )}
                  </ITFlex>
                </>
              );
            })()}
          </ITFlex>
        )}
      </ITDialog>
    </ITPage>
  );
};

export default ShiftHandoverPage;