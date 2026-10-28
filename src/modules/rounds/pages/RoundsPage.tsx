import { showToast } from "@app/core/store/toast/toast.slice";
import {
  ITBadget,
  ITButton,
  ITCard,
  ITDataTable,
  ITDatePicker,
  ITDialog,
  ITFlex,
  ITGrid,
  ITInput,
  ITPage,
  ITProgress,
  ITSearchSelect,
  ITText,
} from "@axzydev/axzy_ui_system";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FaClock, FaEye, FaStop, FaSync, FaTimesCircle, FaUser } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getRoutesList } from "../../routes/services/RoutesService";
import {
  endRound,
  getPaginatedRounds,
  IRound,
} from "../services/RoundsService";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import tz from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(tz);

/** Umbrales de "Desempeño" del historial de recorridos: qué tanto de la
 *  ruta cubrió el guardia (0-33% MALO, 33-67% MEDIO, 67-99% ALTO, 100%
 *  EXCELENTE) — calculado por la API en `progressStatus`. */
const PROGRESS_BADGE_COLOR: Record<string, "danger" | "warning" | "primary" | "success"> = {
  MALO: "danger",
  MEDIO: "warning",
  ALTO: "primary",
  EXCELENTE: "success",
};

const PROGRESS_COLOR: Record<string, "danger" | "warning" | "info" | "success"> = {
  MALO: "danger",
  MEDIO: "warning",
  ALTO: "info",
  EXCELENTE: "success",
};

const RoundsPage = () => {
  const [selectedDate, setSelectedDate] = useState<any>([
    dayjs().tz("America/Tijuana").toDate(),
    dayjs().tz("America/Tijuana").toDate(),
  ]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [refreshKey, setRefreshKey] = useState(0);
  const dispatch = useDispatch();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setRefreshKey(prev => prev + 1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Snappy & 100% Guaranteed sync.
  const externalFilters = useMemo(() => {
    const filters: any = { refreshKey };

    if (Array.isArray(selectedDate) && selectedDate[0] && selectedDate[1]) {
      // Usamos ISO para que el backend reciba strings limpios
      filters.date = [
        dayjs(selectedDate[0]).tz("America/Tijuana").startOf("day").format(),
        dayjs(selectedDate[1]).tz("America/Tijuana").endOf("day").format(),
      ];
    }

    if (searchTerm && searchTerm.trim().length > 0) {
        filters.search = searchTerm.trim();
    }

    if (statusFilter && statusFilter !== 'ALL') {
        filters.status = statusFilter;
    }

    return filters;
  }, [selectedDate, refreshKey, searchTerm, statusFilter]);

  // Envolvemos el fetch para ver qué se manda exactamente
  const memoizedFetch = useCallback((params: any) => {
    return getPaginatedRounds(params);
  }, []);

  // Config IDs Map
  const [routesMap, setRoutesMap] = useState<Record<number, string>>({});
  const navigate = useNavigate();

  // End Round Confirmation Modal State
  const [roundToFinishId, setRoundToFinishId] = useState<number | null>(null);

  // Fetch Routes to build Map and Guards for Filter
  useEffect(() => {
    getRoutesList().then((res) => {
      if (res.success && res.data) {
        const map: Record<number, string> = {};
        res.data.forEach((r: any) => {
          map[r.id] = r.title;
        });
        setRoutesMap(map);
      }
    });
  }, []);


  const handleEndRound = (roundId: number) => {
    setRoundToFinishId(roundId);
  };

  const confirmEndRound = async () => {
    /* v8 ignore next -- guarda defensiva: el botón solo existe con una ronda por finalizar */
    if (!roundToFinishId) return;

    try {
      const res = await endRound(roundToFinishId);
      setRoundToFinishId(null);
      if (res.success) {
        dispatch(
          showToast({
            message: "Ronda finalizada correctamente",
            type: "success",
          }),
        );
        setRefreshKey((prev) => prev + 1);
      } else {
        dispatch(
          showToast({
            message: res.messages?.join("\n") || "Error al finalizar ronda",
            type: "error",
          }),
        );
      }
    } catch {
      setRoundToFinishId(null);
      dispatch(
        showToast({ message: "Error al finalizar ronda", type: "error" }),
      );
    }
  };

  const memoizedColumns = useMemo(
    () => [
      {
        key: "id",
        label: "ID",
        type: "number",
        sortable: false,
        width: 60,
      },
      {
        key: "recurringConfiguration",
        label: "Ronda",
        type: "string",
        sortable: false,
        render: (row: any) => (
          <ITText as="span" className="font-semibold text-slate-700 dark:text-slate-200">
            {row.recurringConfiguration?.title ||
              routesMap[row.recurringConfigurationId] ||
              "Ronda General"}
          </ITText>
        ),
      },
      {
        key: "guard",
        label: "Guardia",
        type: "string",
        render: (row: IRound) => (
          <ITText as="span" className="font-medium text-slate-700 dark:text-slate-200">
            {row.guard.name} {row.guard.lastName}
          </ITText>
        ),
      },
      {
        key: "startTime",
        label: "Inicio",
        type: "string",
        sortable: false,
        render: (row: IRound) => (
          <ITText as="span" className="text-sm text-slate-600 dark:text-slate-300">
            {new Date(row.startTime).toLocaleString()}
          </ITText>
        ),
      },
      {
        key: "endTime",
        label: "Fin",
        type: "string",
        sortable: false,
        render: (row: IRound) => (
          <ITText as="span" className="text-sm text-slate-600 dark:text-slate-300">
            {row.endTime ? new Date(row.endTime).toLocaleString() : "-"}
          </ITText>
        ),
      },
      {
        key: "status",
        label: "Estado",
        type: "string",
        sortable: false,
        render: (row: IRound) => (
          <ITBadget
            color={row.status === "COMPLETED" ? "secondary" : "warning"}
            variant="filled"
            size="sm"
          >
            {row.status === "COMPLETED" ? "FINALIZADA" : "EN CURSO"}
          </ITBadget>
        ),
      },
      {
        key: "progressPercent",
        label: "Avance",
        type: "string",
        render: (row: IRound) => {
          if (row.totalLocations == null || row.progressPercent == null) {
            return <ITText as="span" className="text-xs text-slate-300">—</ITText>;
          }
          return (
            <ITFlex direction="column" className="min-w-[120px]">
              <ITFlex align="center" justify="between" className="mb-1">
                <ITText as="span" className="text-[10px] font-bold text-slate-500">
                  {row.scannedCount}/{row.totalLocations} puntos
                </ITText>
                <ITText as="span" className="text-[10px] font-bold text-slate-500">
                  {row.progressPercent}%
                </ITText>
              </ITFlex>
              <ITProgress
                value={row.progressPercent}
                max={100}
                color={PROGRESS_COLOR[row.progressStatus ?? "MALO"]}
                size="sm"
              />
            </ITFlex>
          );
        },
      },
      {
        key: "progressStatus",
        label: "Desempeño",
        type: "string",
        render: (row: IRound) =>
          row.progressStatus ? (
            <ITBadget color={PROGRESS_BADGE_COLOR[row.progressStatus]} variant="filled" size="sm">
              {row.progressStatus}
            </ITBadget>
          ) : (
            <ITText as="span" className="text-xs text-slate-300">—</ITText>
          ),
      },
      {
        key: "actions",
        label: "Acciones",
        type: "actions",
        actions: (row: IRound) => (
          <ITFlex align="center" gap={2}>
            <ITButton
              onClick={() => navigate(`/rounds/${row.id}`)}
              size="md"
              color="primary"
              variant="icon-only"
              icon={<FaEye />}
              ariaLabel="Ver detalles"
              title="Ver detalles"
            />

            {row.status === "IN_PROGRESS" && (
              <ITButton
                onClick={() => handleEndRound(row.id)}
                size="md"
                color="danger"
                variant="icon-only"
                icon={<FaStop />}
                ariaLabel="Finalizar ronda"
                title="Finalizar ronda"
              />
            )}
          </ITFlex>
        ),
      },
    ],
    [routesMap, navigate],
  );

  return (
    <ITPage
      className="m-0! mx-auto! max-w-[1600px]! px-6! bg-slate-50 mb-8"
      noPadding
      title="Historial de recorridos"
      breadcrumbs={[{ label: "Inicio", href: "#/home" }, { label: "Operación" }, { label: "Historial de recorridos" }]}
      description="Historial y supervisión de recorridos de seguridad. Solo los escaneos con al menos una foto cuentan para Avance y Desempeño."
      icon={<FaClock size={20} />}
    >
      <ITFlex direction="column" gap={5} className="w-full pb-10 pt-5">
        <ITCard className="rounded-3xl" contentClassName="p-4!">
          <ITGrid container columns={12} spacing={3}>
            <ITGrid item xs={12} md={4}>
              <ITFlex direction="column" gap={1}>
                <ITText as="p" className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  Buscar guardia
                </ITText>
                <ITFlex align="center" gap={1}>
                  <ITInput
                    name="searchRound"
                    placeholder="Nombre o usuario..."
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

            <ITGrid item xs={12} sm={6} md={3}>
              <ITFlex direction="column" gap={1}>
                <ITText as="p" className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  Estado
                </ITText>
                <ITSearchSelect
                  value={statusFilter}
                  onChange={(value) => {
                    setStatusFilter(String(value));
                    setRefreshKey((prev) => prev + 1);
                  }}
                  options={[
                    { label: "Todos", value: "ALL" },
                    { label: "En curso", value: "IN_PROGRESS" },
                    { label: "Finalizadas", value: "COMPLETED" },
                  ]}
                  clearable={false}
                  className="w-full"
                />
              </ITFlex>
            </ITGrid>

            <ITGrid item xs={12} sm={6} md={4}>
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

                      if (parsedDates[0] && parsedDates[1]) {
                        setRefreshKey((prev) => prev + 1);
                      }
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
          columns={memoizedColumns as any}
          fetchData={memoizedFetch as any}
          externalFilters={externalFilters}
        />
      </ITFlex>

      <ITDialog
        isOpen={!!roundToFinishId}
        onClose={() => setRoundToFinishId(null)}
        title="Confirmar finalización"
      >
        <ITFlex direction="column" gap={4}>
          <ITText as="p" className="text-sm text-slate-600 dark:text-slate-300">
            ¿Seguro que deseas finalizar esta ronda manualmente? Esta acción no se puede deshacer.
          </ITText>
          <ITFlex justify="end" gap={2}>
            <ITButton
              variant="outlined"
              color="secondary"
              onClick={() => setRoundToFinishId(null)}
            >
              Cancelar
            </ITButton>
            <ITButton color="danger" onClick={confirmEndRound}>
              Finalizar ronda
            </ITButton>
          </ITFlex>
        </ITFlex>
      </ITDialog>
    </ITPage>
  );
};

export default RoundsPage;
