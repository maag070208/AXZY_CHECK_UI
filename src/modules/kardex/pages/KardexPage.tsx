import { MediaCarousel } from "@app/core/components/MediaCarousel";
import { translateScanType } from "@app/core/utils/status.utils";
import {
  ITBadget,
  ITButton,
  ITCard,
  ITDataTable,
  ITDatePicker,
  ITDialog,
  ITDivider,
  ITEmptyState,
  ITFlex,
  ITGrid,
  ITInput,
  ITPage,
  ITSearchSelect,
  ITText,
} from "@axzydev/axzy_ui_system";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FaBook, FaCheck, FaEye, FaFileAlt, FaLayerGroup, FaMapMarkerAlt, FaSync, FaTimesCircle, FaUser } from "react-icons/fa";
import { getPaginatedKardex, KardexEntry } from "../services/KardexService";

const NotesContent = ({ notes }: { notes: string }) => {
  const lines = notes.split("\n");
  return (
    <ITFlex direction="column" gap={2}>
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return null;
        if (trimmed.startsWith("---")) {
          const header = trimmed.replace(/---/g, "").trim();
          return (
            <ITFlex key={i} align="center" gap={2} className="my-1">
              <ITDivider className="flex-1" />
              <ITText as="span" className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                {header}
              </ITText>
              <ITDivider className="flex-1" />
            </ITFlex>
          );
        }
        if (trimmed.startsWith("[ ]") || trimmed.startsWith("[x]")) {
          const checked = trimmed.startsWith("[x]");
          const text = trimmed.replace(/\[.\]/, "").trim();
          return (
            <ITFlex key={i} align="start" gap={2}>
              <ITFlex
                align="center"
                justify="center"
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded ${
                  checked ? "bg-emerald-500 text-white" : "bg-white text-transparent dark:bg-slate-800"
                }`}
              >
                {checked && <FaCheck size={8} />}
              </ITFlex>
              <ITText as="span" className={`text-xs leading-relaxed ${checked ? "text-slate-400 line-through" : "text-slate-700 dark:text-slate-200"}`}>
                {text}
              </ITText>
            </ITFlex>
          );
        }
        return (
          <ITFlex key={i} className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-900/40">
            <ITText as="p" className="text-xs leading-relaxed text-slate-700 dark:text-slate-200">
              {trimmed}
            </ITText>
          </ITFlex>
        );
      })}
    </ITFlex>
  );
};

const KardexPage = () => {
  const today = useMemo(() => dayjs().tz("America/Tijuana").toDate(), []);
  const [selectedDate, setSelectedDate] = useState<any>([today, today]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [refreshKey, setRefreshKey] = useState(0);

  const [viewingEntry, setViewingEntry] = useState<KardexEntry | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setRefreshKey((prev) => prev + 1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const externalFilters = useMemo(() => {
    const filters: any = {};
    if (Array.isArray(selectedDate) && selectedDate[0] && selectedDate[1]) {
      filters.date = [
        dayjs(selectedDate[0]).tz("America/Tijuana").startOf("day").format(),
        dayjs(selectedDate[1]).tz("America/Tijuana").endOf("day").format(),
      ];
    }
    if (searchTerm && searchTerm.trim().length > 0) filters.search = searchTerm.trim();
    if (typeFilter && typeFilter !== "ALL") filters.scanType = typeFilter;
    return filters;
  }, [selectedDate, searchTerm, typeFilter]);

  const memoizedFetch = useCallback((params: any) => getPaginatedKardex(params), []);

  const columns = useMemo(
    () => [
      {
        key: "id",
        label: "ID",
        type: "number",
        sortable: false,
        render: (row: any) => (
          <ITText as="span" className="inline-flex rounded-lg bg-slate-50 px-2 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            #{row.id}
          </ITText>
        ),
      },
      {
        key: "timestamp",
        label: "Fecha/Hora",
        type: "string",
        sortable: false,
        render: (row: any) => (
          <ITText as="span" className="text-sm text-slate-600 dark:text-slate-300">
            {dayjs(row.timestamp).format("DD/MM/YYYY HH:mm")}
          </ITText>
        ),
      },
      {
        key: "userId",
        label: "Usuario",
        type: "string",
        render: (row: any) => (
          <ITFlex direction="column">
            <ITText as="span" className="font-medium text-slate-700 dark:text-slate-200">
              {row.user?.name} {row.user?.lastName || ""}
            </ITText>
            <ITText as="span" className="text-xs text-slate-400">
              {row.user?.username}
            </ITText>
          </ITFlex>
        ),
      },
      {
        key: "location",
        label: "Ubicación",
        type: "string",
        sortable: false,
        render: (row: any) => (
          <ITFlex align="center" gap={2}>
            <FaMapMarkerAlt className="text-indigo-400" size={11} />
            <ITText as="span" className="text-sm text-slate-700 dark:text-slate-200">
              {row.location?.name}
            </ITText>
          </ITFlex>
        ),
      },
      {
        key: "scanType",
        label: "Tipo",
        type: "string",
        sortable: false,
        render: (row: any) => (
          <ITBadget
            color={row.scanType === "ASSIGNMENT" ? "success" : row.scanType === "RECURRING" ? "warning" : "primary"}
            size="sm"
            variant="filled"
          >
            {translateScanType(row.scanType)}
          </ITBadget>
        ),
      },
      {
        key: "media",
        label: "Multimedia",
        type: "string",
        sortable: false,
        render: (row: any) => (
          <ITFlex align="center" gap={2}>
            {row.media && row.media.length > 0 ? (
              <>
                <FaFileAlt className="text-blue-400" size={11} />
                <ITText as="span" className="text-xs font-medium text-slate-500">
                  {row.media.length}
                </ITText>
              </>
            ) : (
              <ITText as="span" className="text-xs text-slate-300">-</ITText>
            )}
          </ITFlex>
        ),
      },
      {
        key: "actions",
        label: "Acciones",
        type: "actions",
        actions: (row: any) => (
          <ITFlex align="center" gap={2}>
            <ITButton
              onClick={() => setViewingEntry(row)}
              size="md"
              color="secondary"
              variant="icon-only"
              icon={<FaEye />}
              ariaLabel="Ver detalle"
              title="Ver detalle"
            />
          </ITFlex>
        ),
      },
    ],
    [],
  );

  return (
    <ITPage
      className="m-0! mx-auto! max-w-[1600px]! px-6! bg-slate-50"
      noPadding
      title="Kardex"
      breadcrumbs={[{ label: "Inicio", href: "#/home" }, { label: "Operación" }, { label: "Kardex" }]}
      description="Historial de actividades y reportes en tiempo real"
      icon={<FaBook size={20} />}
    >
      <ITFlex direction="column" gap={5} className="w-full pb-10 pt-5">
        <ITCard className="rounded-3xl" contentClassName="p-4!">
          <ITGrid container columns={12} spacing={3}>
            <ITGrid item xs={12} md={4}>
              <ITFlex direction="column" gap={1}>
                <ITText as="p" className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  Filtrar por guardia
                </ITText>
                <ITFlex align="center" gap={1}>
                  <ITInput
                    name="searchKardex"
                    placeholder="Nombre de guardia..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onBlur={() => {}}
                    iconLeft={<FaUser />}
                    size="md"
                  />
                  {searchTerm.length > 0 && (
                    <ITButton
                      variant="icon-only"
                      color="secondary"
                      size="sm"
                      onClick={() => setSearchTerm("")}
                      icon={<FaTimesCircle size={12} />}
                      ariaLabel="Limpiar búsqueda"
                      title="Limpiar búsqueda"
                    />
                  )}
                </ITFlex>
              </ITFlex>
            </ITGrid>

            <ITGrid item xs={12} md={3}>
              <ITFlex direction="column" gap={1}>
                <ITText as="p" className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  Tipo de escaneo
                </ITText>
                <ITSearchSelect
                  value={typeFilter}
                  onChange={(value) => {
                    setTypeFilter(String(value));
                    setRefreshKey((prev) => prev + 1);
                  }}
                  options={[
                    { label: "Todos", value: "ALL" },
                    { label: "Ronda", value: "RECURRING" },
                    { label: "Asignada", value: "ASSIGNMENT" },
                    { label: "Libre", value: "FREE" },
                  ]}
                  clearable={false}
                  className="w-full"
                />
              </ITFlex>
            </ITGrid>

            <ITGrid item xs={12} md={4}>
              <ITFlex direction="column" gap={1}>
                <ITText as="p" className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  Periodo
                </ITText>
                <ITDatePicker
                  name="date"
                  value={selectedDate as any}
                  range
                  onChange={(e) => {
                    const val = e.target.value as any;
                    if (Array.isArray(val)) {
                      const parsedDates = val.map((d) => (d ? new Date(d) : null));
                      setSelectedDate(parsedDates);
                      if (parsedDates[0] && parsedDates[1]) setRefreshKey((prev) => prev + 1);
                    } else {
                      const date = new Date(val);
                      setSelectedDate([date, date]);
                      setRefreshKey((prev) => prev + 1);
                    }
                  }}
                  className="w-full"
                />
              </ITFlex>
            </ITGrid>

            <ITGrid item xs={12} md={1}>
              <ITFlex align="end" justify="end" className="h-full">
                <ITButton
                  onClick={() => setRefreshKey((prev) => prev + 1)}
                  color="secondary"
                  variant="icon-only"
                  size="md"
                  icon={<FaSync />}
                  ariaLabel="Actualizar tabla"
                  title="Actualizar tabla"
                />
              </ITFlex>
            </ITGrid>
          </ITGrid>
        </ITCard>

        <ITDataTable
          defaultItemsPerPage={50}
          itemsPerPageOptions={[25, 50, 100]}
          layout="fixed"
          density="compact"
          showViewToggle={false}
          virtualized
          virtualizedMaxHeight={400}
          rowHeight={50}
          key={refreshKey}
          columns={columns as any}
          fetchData={memoizedFetch as any}
          externalFilters={externalFilters}
        />
      </ITFlex>

      <ITDialog
        isOpen={!!viewingEntry}
        onClose={() => setViewingEntry(null)}
        title="Detalle de actividad"
        className="max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        {viewingEntry && (
          <ITFlex direction="column" gap={4}>
            <ITFlex align="center" gap={2} wrap="wrap">
              <ITText as="span" className="text-xs text-slate-500">
                {dayjs(viewingEntry.timestamp).format("DD [de] MMMM, YYYY [a las] HH:mm a")}
              </ITText>
              <ITBadget
                color={viewingEntry.scanType === "ASSIGNMENT" ? "success" : viewingEntry.scanType === "RECURRING" ? "warning" : "primary"}
                variant="filled"
                size="sm"
              >
                {translateScanType(viewingEntry.scanType)}
              </ITBadget>
            </ITFlex>

            <ITGrid container columns={12} spacing={4}>
              <ITGrid item xs={12} lg={8}>
                <ITFlex direction="column" gap={4}>
                  <ITCard
                    title="Evidencia multimedia"
                    className="rounded-2xl border-0! bg-slate-50/40! shadow-none!"
                    contentClassName="p-4!"
                  >
                    {viewingEntry.media && viewingEntry.media.length > 0 ? (
                      <ITFlex className="overflow-hidden rounded-xl">
                        <MediaCarousel media={viewingEntry.media as any} />
                      </ITFlex>
                    ) : (
                      <ITEmptyState
                        icon={<FaFileAlt />}
                        title="Sin evidencia adjunta"
                        description="El usuario no subió fotos ni videos en este reporte."
                        className="py-8"
                      />
                    )}
                  </ITCard>

                  <ITCard
                    title="Observaciones"
                    className="rounded-2xl border-0! bg-slate-50/40! shadow-none!"
                    contentClassName="p-4!"
                  >
                    {viewingEntry.notes ? (
                      <NotesContent notes={viewingEntry.notes} />
                    ) : (
                      <ITFlex align="center" justify="center" gap={2} className="py-6">
                        <FaFileAlt className="text-slate-300" />
                        <ITText as="span" className="text-xs text-slate-400">Sin observaciones registradas</ITText>
                      </ITFlex>
                    )}
                  </ITCard>
                </ITFlex>
              </ITGrid>

              <ITGrid item xs={12} lg={4}>
                <ITFlex direction="column" gap={4}>
                  <ITCard
                    title="Detalles del reporte"
                    className="rounded-2xl border-0! bg-slate-50/40! shadow-none!"
                    contentClassName="space-y-4 p-4!"
                  >
                    <ITFlex align="start" gap={3}>
                      <ITFlex align="center" justify="center" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-950/30 dark:text-sky-400">
                        <FaUser size={12} />
                      </ITFlex>
                      <ITFlex direction="column">
                        <ITText as="p" className="text-[9px] font-black uppercase tracking-widest text-slate-400">Realizado por</ITText>
                        <ITText as="p" className="text-sm font-bold text-slate-800 dark:text-slate-100">
                          {viewingEntry.user?.name} {viewingEntry.user?.lastName || ""}
                        </ITText>
                        <ITText as="p" className="text-[11px] text-slate-500">{viewingEntry.user?.username}</ITText>
                      </ITFlex>
                    </ITFlex>

                    <ITFlex align="start" gap={3}>
                      <ITFlex align="center" justify="center" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                        <FaMapMarkerAlt size={12} />
                      </ITFlex>
                      <ITFlex direction="column">
                        <ITText as="p" className="text-[9px] font-black uppercase tracking-widest text-slate-400">Ubicación</ITText>
                        <ITText as="p" className="text-sm font-bold text-slate-800 dark:text-slate-100">{viewingEntry.location?.name}</ITText>
                        <ITText as="p" className="text-[11px] text-slate-500">Pasillo {viewingEntry.location?.aisle}</ITText>
                      </ITFlex>
                    </ITFlex>

                    <ITFlex align="start" gap={3}>
                      <ITFlex align="center" justify="center" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400">
                        <FaLayerGroup size={12} />
                      </ITFlex>
                      <ITFlex direction="column">
                        <ITText as="p" className="text-[9px] font-black uppercase tracking-widest text-slate-400">Clasificación</ITText>
                        <ITText as="p" className="text-sm font-bold text-slate-800 dark:text-slate-100">{translateScanType(viewingEntry.scanType)}</ITText>
                      </ITFlex>
                    </ITFlex>
                  </ITCard>

                  {viewingEntry.latitude && viewingEntry.longitude ? (
                    <ITCard
                      title="Ubicación GPS"
                      className="rounded-2xl border-0! bg-slate-50/40! shadow-none!"
                      contentClassName="space-y-3 p-4!"
                    >
                      <ITFlex direction="column" gap={1}>
                        <ITText as="p" className="text-[9px] font-black uppercase tracking-widest text-slate-400">Coordenadas</ITText>
                        <ITText as="p" className="font-mono text-xs font-medium text-slate-700 dark:text-slate-200">
                          {Number(viewingEntry.latitude).toFixed(6)}, {Number(viewingEntry.longitude).toFixed(6)}
                        </ITText>
                      </ITFlex>
                      <ITButton
                        variant="text"
                        color="secondary"
                        size="sm"
                        icon={<FaMapMarkerAlt />}
                        onClick={() =>
                          window.open(
                            `https://www.google.com/maps/search/?api=1&query=${viewingEntry.latitude},${viewingEntry.longitude}`,
                            "_blank",
                          )
                        }
                      >
                        Abrir en Google Maps
                      </ITButton>
                    </ITCard>
                  ) : null}
                </ITFlex>
              </ITGrid>
            </ITGrid>
          </ITFlex>
        )}
      </ITDialog>
    </ITPage>
  );
};

export default KardexPage;
