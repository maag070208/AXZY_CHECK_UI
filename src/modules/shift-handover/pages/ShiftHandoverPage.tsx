import {
  ITBadget,
  ITButton,
  ITCard,
  ITDataTable,
  ITDialog,
  ITFlex,
  ITGrid,
  ITPage,
  ITText,
} from "@axzydev/axzy_ui_system";
import { useCallback, useState } from "react";
import {
  FaBook,
  FaBroadcastTower,
  FaCheck,
  FaClipboardList,
  FaEye,
  FaKey,
  FaPhone,
  FaPlus,
  FaSwatchbook,
  FaTabletAlt,
  FaTimes,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getPaginatedShiftHandovers, getShiftHandoverDetail } from "../services/ShiftHandoverService";
import { PersonAvatar } from "@app/core/components/PersonAvatar";
import { useRolePalette } from "@app/core/hooks/useRolePalette";

const CHECKLIST_LABELS: { key: string; label: string; icon: React.ComponentType<{ className?: string; size?: number }> }[] = [
  { key: "checklistPhones", label: "Teléfonos", icon: FaPhone },
  { key: "checklistTablet", label: "Tablet", icon: FaTabletAlt },
  { key: "checklistRadios", label: "Radios", icon: FaBroadcastTower },
  { key: "checklistKeys", label: "Llaves", icon: FaKey },
  { key: "checklistLogbook", label: "Bitácora", icon: FaBook },
  { key: "checklistConsignas", label: "Consignas", icon: FaClipboardList },
];

const ShiftHandoverPage = () => {
  const palette = useRolePalette();
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

  const elements = detail?.elements || [];
  const punctualCount = elements.filter((e: any) => e.punctual).length;
  const isNocturno = detail?.shiftType === "NOCTURNO";

  return (
    <ITPage
      className="m-0! mx-auto! max-w-[1600px]! px-6! bg-slate-50 mb-8"
      noPadding
      title="Entrega de Turno"
      breadcrumbs={[{ label: "Inicio", href: "#/home" }, { label: "Operación" }, { label: "Entrega de Turno" }]}
      description="Historial de reportes de cambio de turno (caseta, elementos y checklist de verificación)."
      icon={<FaSwatchbook size={20} />}
      iconColor={palette.primary}
      actions={
        <ITButton onClick={() => navigate("/shift-handover/nuevo")} color="primary" size="md" icon={<FaPlus />}>
          Nueva entrega de turno
        </ITButton>
      }
    >
      <ITFlex direction="column" gap={5} className="w-full pb-10 pt-5">
        <ITDataTable
          defaultItemsPerPage={50}
          itemsPerPageOptions={[25, 50, 100]}
          layout="fixed"
          density="compact"
          showViewToggle={false}
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
                <ITText as="span" className="text-xs font-bold text-slate-700 dark:text-slate-200">
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
                  color={row.shiftType === "NOCTURNO" ? "primary" : "success"}
                  variant="filled"
                  size="sm"
                >
                  {row.shiftType === "NOCTURNO" ? "Nocturno" : "Matutino"}
                </ITBadget>
              ),
            },
            {
              key: "createdBy",
              label: "JEFE OPERATIVO",
              type: "string",
              render: (row: any) => (
                <ITText as="span" className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {row.createdBy?.name} {row.createdBy?.lastName}
                </ITText>
              ),
            },
            {
              key: "elements",
              label: "ELEMENTOS",
              type: "number",
              render: (row: any) => (
                <ITText as="span" className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  {row._count?.elements || 0}
                </ITText>
              ),
            },
            {
              key: "reportedToAdmin",
              label: "NOVEDADES REPORTADAS",
              type: "string",
              render: (row: any) => (
                <ITBadget color={row.reportedToAdmin ? "success" : "danger"} variant="filled" size="sm">
                  {row.reportedToAdmin ? "Sí" : "No"}
                </ITBadget>
              ),
            },
            {
              key: "actions",
              label: "ACCIONES",
              type: "actions",
              actions: (row: any) => (
                <ITFlex align="center" gap={2}>
                  <ITButton
                    onClick={() => openDetail(row.id)}
                    size="md"
                    color="secondary"
                    variant="icon-only"
                    icon={<FaEye />}
                    ariaLabel="Ver detalles"
                    title="Ver detalles"
                  />
                </ITFlex>
              ),
            },
          ]}
        />
      </ITFlex>

      <ITDialog
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        title="Detalle de entrega de turno"
        className="max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        {detail && (
          <ITFlex direction="column" gap={4}>
            <ITFlex align="start" justify="between" gap={3} wrap="wrap">
              <ITFlex align="center" gap={3}>
                <ITFlex
                  align="center"
                  justify="center"
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl ${
                    isNocturno ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200" : "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400"
                  }`}
                >
                  {isNocturno ? "🌙" : "☀️"}
                </ITFlex>
                <ITFlex direction="column">
                  <ITText as="h3" className="text-lg font-black text-slate-900 dark:text-white">
                    Turno {isNocturno ? "Nocturno" : "Matutino"}
                  </ITText>
                  <ITText as="p" className="text-xs capitalize text-slate-500">
                    {new Date(detail.handoverDate).toLocaleDateString("es-MX", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </ITText>
                </ITFlex>
              </ITFlex>

              <ITBadget color={detail.reportedToAdmin ? "success" : "warning"} variant="filled" size="sm">
                {detail.reportedToAdmin ? "Novedades reportadas" : "Novedades no reportadas"}
              </ITBadget>
            </ITFlex>

            <ITGrid container columns={12} spacing={3}>
              {[
                { value: elements.length, label: "Elementos", bg: palette.soft, fg: palette.primary },
                { value: punctualCount, label: "Puntuales", bg: palette.soft, fg: palette.primary },
                { value: detail.credentialsCount ?? "—", label: "Credenciales", bg: "#E0F2FE", fg: "#0369A1" },
                { value: detail.tarjetonesCount ?? "—", label: "Tarjetones", bg: "#FFFBEB", fg: "#B45309" },
              ].map((stat) => (
                <ITGrid item xs={6} lg={3} key={stat.label}>
                  <ITCard className="h-full rounded-2xl border-0! bg-slate-50/40! shadow-none!" contentClassName="p-3!">
                    <ITFlex align="center" gap={2}>
                      <ITText as="span" style={{ backgroundColor: stat.bg, color: stat.fg }} className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-black">
                        {stat.value}
                      </ITText>
                      <ITText as="span" className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                        {stat.label}
                      </ITText>
                    </ITFlex>
                  </ITCard>
                </ITGrid>
              ))}
            </ITGrid>

            <ITGrid container columns={12} spacing={4}>
              <ITGrid item xs={12} lg={6}>
                <ITCard title="Jefe y caseta" className="h-full rounded-2xl border-0! bg-slate-50/40! shadow-none!" contentClassName="space-y-4 p-4!">
                  <ITFlex align="center" gap={3}>
                    <PersonAvatar
                      name={`${detail.createdBy?.name ?? ""} ${detail.createdBy?.lastName ?? ""}`.trim()}
                      photoUrl={detail.createdBy?.photoUrl}
                      size={40}
                    />
                    <ITFlex direction="column">
                      <ITText as="p" className="text-[9px] font-black uppercase tracking-widest text-slate-400">Jefe operativo</ITText>
                      <ITText as="p" className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        {detail.createdBy?.name} {detail.createdBy?.lastName}
                      </ITText>
                    </ITFlex>
                  </ITFlex>

                  <ITFlex direction="column" gap={2}>
                    <ITFlex justify="between">
                      <ITText as="span" className="text-xs text-slate-500">Credenciales</ITText>
                      <ITText as="span" className="text-xs font-bold text-slate-800 dark:text-slate-100">{detail.credentialsCount ?? "—"}</ITText>
                    </ITFlex>
                    <ITFlex justify="between">
                      <ITText as="span" className="text-xs text-slate-500">Tarjetones</ITText>
                      <ITText as="span" className="text-xs font-bold text-slate-800 dark:text-slate-100">{detail.tarjetonesCount ?? "—"}</ITText>
                    </ITFlex>
                    <ITFlex direction="column" gap={1} className="rounded-xl bg-white p-3 dark:bg-slate-900/40">
                      <ITText as="span" className="text-[9px] font-black uppercase tracking-widest text-slate-400">Novedades</ITText>
                      <ITText as="p" className="text-xs text-slate-600 dark:text-slate-300">{detail.novedades || "Sin novedades"}</ITText>
                    </ITFlex>
                  </ITFlex>
                </ITCard>
              </ITGrid>

              <ITGrid item xs={12} lg={6}>
                <ITCard title="Verificación de entrega" className="h-full rounded-2xl border-0! bg-slate-50/40! shadow-none!" contentClassName="space-y-2 p-4!">
                  {CHECKLIST_LABELS.map((item) => {
                    const ok = !!detail[item.key];
                    return (
                      <ITFlex key={item.key} align="center" gap={2} className="rounded-lg bg-white px-3 py-2 dark:bg-slate-900/40">
                        <item.icon className={ok ? palette.primaryTextClass : "text-slate-300"} size={12} />
                        <ITText as="span" className="flex-1 text-xs font-semibold text-slate-700 dark:text-slate-200">{item.label}</ITText>
                        <ITFlex
                          align="center"
                          justify="center"
                          style={{ backgroundColor: ok ? palette.primary : "#F1F5F9", color: ok ? "#FFFFFF" : "#94A3B8" }}
                          className="flex h-4 w-4 items-center justify-center rounded"
                        >
                          {ok ? <FaCheck size={8} /> : <FaTimes size={8} />}
                        </ITFlex>
                      </ITFlex>
                    );
                  })}
                </ITCard>
              </ITGrid>
            </ITGrid>

            <ITCard title={`Elementos (${elements.length})`} className="rounded-2xl border-0! bg-slate-50/40! shadow-none!" contentClassName="space-y-2 p-4!">
              {elements.length === 0 ? (
                <ITText as="p" className="py-6 text-center text-xs text-slate-400">Sin elementos registrados.</ITText>
              ) : (
                elements.map((el: any) => (
                  <ITFlex key={el.id} align="center" gap={3} className="rounded-xl bg-white px-3 py-2.5 dark:bg-slate-900/40">
                    <PersonAvatar
                      name={`${el.guard?.name ?? ""} ${el.guard?.lastName ?? ""}`.trim()}
                      photoUrl={el.guard?.photoUrl}
                      size={36}
                    />
                    <ITFlex direction="column" className="min-w-0 flex-1">
                      <ITText as="p" className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">
                        {el.guard?.name} {el.guard?.lastName}
                      </ITText>
                      <ITText as="p" className="text-[11px] text-slate-400">
                        Entrada: {el.entryTime}
                        {el.observations ? ` · ${el.observations}` : ""}
                      </ITText>
                    </ITFlex>
                    <ITBadget color={el.punctual ? "success" : "warning"} variant="filled" size="sm">
                      {el.punctual ? "Puntual" : "Retraso"}
                    </ITBadget>
                  </ITFlex>
                ))
              )}
            </ITCard>
          </ITFlex>
        )}
      </ITDialog>
    </ITPage>
  );
};

export default ShiftHandoverPage;
