import { showToast } from "@app/core/store/toast/toast.slice";
import { ITBadget, ITButton, ITDataTable, ITDatePicker, ITDialog, ITPage , ITSearchSelect , ITInput , ITFlex } from "@axzydev/axzy_ui_system";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FaClock, FaEye, FaStop, FaSync, FaTimesCircle, FaUser } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getRoutesList } from "../../routes/services/RoutesService";
import { getUsers } from "../../users/services/UserService";
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

const PROGRESS_BAR_COLOR: Record<string, string> = {
  MALO: "bg-red-500",
  MEDIO: "bg-amber-500",
  ALTO: "bg-sky-500",
  EXCELENTE: "bg-emerald-500",
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
    console.log('--- PARÁMETROS ENVIADOS A LA API ---', params);
    return getPaginatedRounds(params);
  }, []);

  // Config IDs Map
  const [routesMap, setRoutesMap] = useState<Record<number, string>>({});
  const navigate = useNavigate();

  // Start Round Modal State
  const [guards, setGuards] = useState<any[]>([]);

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

    getUsers().then((res) => {
      if (res.success && res.data) {
        const onlyGuards = res.data.filter((u: any) => {
            const roleName = typeof u.role === 'object' ? u.role.name : u.role;
            return roleName === "GUARD" || roleName === "SHIFT" || roleName === "MAINT";
        });
        setGuards(onlyGuards);
      }
    });
  }, []);


  const handleEndRound = (roundId: number) => {
    setRoundToFinishId(roundId);
  };

  const confirmEndRound = async () => {
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
        sortable: true,
      },
      {
        key: "recurringConfiguration",
        label: "Ronda",
        type: "string",
        sortable: true,
        render: (row: any) => (
          <span className="font-semibold text-slate-700">
            {row.recurringConfiguration?.title ||
              routesMap[row.recurringConfigurationId] ||
              "Ronda General"}
          </span>
        ),
      },
      {
        key: "guard",
        label: "Guardia",
        type: "string",
        render: (row: IRound) => (
          <div className="font-medium text-slate-700">
            {row.guard.name} {row.guard.lastName}
          </div>
        ),
      },
      {
        key: "startTime",
        label: "Inicio",
        type: "string",
        sortable: true,
        render: (row: IRound) => (
          <span className="text-slate-600 text-sm">
            {new Date(row.startTime).toLocaleString()}
          </span>
        ),
      },
      {
        key: "endTime",
        label: "Fin",
        type: "string",
        sortable: true,
        render: (row: IRound) => (
          <span className="text-slate-600 text-sm">
            {row.endTime ? new Date(row.endTime).toLocaleString() : "-"}
          </span>
        ),
      },
      {
        key: "status",
        label: "Estado",
        type: "string",
        sortable: true,
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
            return <span className="text-xs text-slate-300">—</span>;
          }
          return (
            <div className="min-w-[120px]">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1">
                <span>{row.scannedCount}/{row.totalLocations} puntos</span>
                <span>{row.progressPercent}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${PROGRESS_BAR_COLOR[row.progressStatus ?? "MALO"]}`}
                  style={{ width: `${row.progressPercent}%` }}
                />
              </div>
            </div>
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
            <span className="text-xs text-slate-300">—</span>
          ),
      },
      {
        key: "actions",
        label: "Acciones",
        type: "actions",
        actions: (row: IRound) => (
          <div className="flex gap-2">
            <ITButton
              onClick={() => navigate(`/rounds/${row.id}`)}
              size="sm"
              color="primary"
              variant="outlined"
             
              title="Ver detalles"
            >
              <FaEye />
            </ITButton>

            {row.status === "IN_PROGRESS" && (
              <ITButton
                onClick={() => handleEndRound(row.id)}
                size="sm"
                color="danger"
                variant="filled"
               
                title="Finalizar Ronda (Admin)"
              >
                <FaStop />
              </ITButton>
            )}
          </div>
        ),
      },
    ],
    [routesMap, navigate, guards],
  );

  return (
    <ITPage
      className="m-0! px-4! max-w-screen!"
      noPadding
      title="Historial de recorridos"
      breadcrumbs={[{ label: "Inicio", href: "#/home" }, { label: "Operación" }, { label: "Historial de recorridos" }]}
      description="Historial y supervisión de recorridos de seguridad"
      icon={<FaClock size={20} />}
      iconColor="#065911"
      actions={
<div className="flex items-center gap-3">
            <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Buscar Guardia</label>
                <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 h-[42px] min-w-[240px] shadow-sm focus-within:border-emerald-500/50 transition-all">
                    <FaUser className="text-slate-300 text-xs mr-2" />
                    <ITInput
                        name="searchRound"
                        placeholder="Nombre o usuario..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        containerClassName="w-full"
                        className="!bg-transparent !border-0 !shadow-none !p-0 text-sm font-bold text-slate-600"
                    />
                    {searchTerm.length > 0 && (
                        <ITButton
                            variant="icon-only"
                            color="gray"
                            size="sm"
                            onClick={() => setSearchTerm("")}
                            icon={<FaTimesCircle className="text-xs" />}
                            title="Limpiar búsqueda"
                           
                        />
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Estado</label>
                <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 h-[42px] min-w-[150px] shadow-sm">
                    <ITSearchSelect
                        value={statusFilter}
                        onChange={(value) => {
                            setStatusFilter(String(value));
                            setRefreshKey(prev => prev + 1);
                        }}
                        options={[
                            { label: "Todos", value: "ALL" },
                            { label: "En curso", value: "IN_PROGRESS" },
                            { label: "Finalizadas", value: "COMPLETED" },
                        ]}
                        clearable={false}
                        className="w-full"
                    />
                </div>
            </div>

            <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Periodo</label>
                <div className="flex items-center gap-3">
          <ITDatePicker
            label=""
            name="date"
            value={selectedDate as any}
            range
            onChange={(e) => {
              const val = e.target.value as any;

              if (Array.isArray(val)) {
                // El DatePicker regresa strings ISO, los convertimos a Date para la UI
                const parsedDates = val.map((d) => (d ? new Date(d) : null));
                setSelectedDate(parsedDates);
                
                // Si el rango se completó (dos fechas seleccionadas), refrescamos la tabla
                if (parsedDates[0] && parsedDates[1]) {
                    setRefreshKey(prev => prev + 1);
                }
              } else if (val) {
                // Caso un solo día o string ISO directo
                const date = new Date(val);
                setSelectedDate([date, date]);
                setRefreshKey(prev => prev + 1);
              } else {
                // Caso limpiar filtro
                setSelectedDate(null);
                setRefreshKey(prev => prev + 1);
              }
            }}
            className="text-sm text-slate-600 outline-none font-medium"
          />
          <ITButton
                onClick={() => setRefreshKey(prev => prev + 1)}
                color="secondary"
                variant="outlined"
               
                size="md"
                title="Actualizar tabla"
              >
                <ITFlex align="center" gap={2}><FaSync className={`text-xs text-slate-500`} />
                <span className="text-xs font-bold text-slate-600">Refrescar</span></ITFlex>
          </ITButton>
                </div>
            </div>
        </div>
      }
    >

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <ITDataTable
          defaultItemsPerPage={50}
          itemsPerPageOptions={[25, 50, 100]}
          layout="fixed"
          density="compact"
          virtualized
          virtualizedMaxHeight={400}
          rowHeight={50}
          key={refreshKey}
          columns={memoizedColumns as any}
          fetchData={memoizedFetch as any}
          externalFilters={externalFilters}
        />
      </div>


      {/* End Round Confirmation Modal */}
      <ITDialog
        isOpen={!!roundToFinishId}
        onClose={() => setRoundToFinishId(null)}
        title="Confirmar Finalización"
      >
        <div className="p-6">
          <p className="text-[#1b1b1f] text-base mb-6">
            ¿Seguro que deseas FINALIZAR esta ronda manualmente? Esta acción no
            se puede deshacer.
          </p>
          <div className="flex justify-end gap-3">
            <ITButton
              variant="outlined"
              color="secondary"
              onClick={() => setRoundToFinishId(null)}
            >
              Cancelar
            </ITButton>
            <ITButton variant="solid" color="danger" onClick={confirmEndRound}>
              Finalizar Ronda
            </ITButton>
          </div>
        </div>
      </ITDialog>
    </ITPage>
  );
};

export default RoundsPage;
