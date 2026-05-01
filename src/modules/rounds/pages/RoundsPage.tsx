import { showToast } from "@app/core/store/toast/toast.slice";
import {
  ITBadget,
  ITButton,
  ITDataTable,
  ITDatePicker,
  ITDialog,
} from "@axzydev/axzy_ui_system";
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
    } catch (e) {
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
            size="small"
          >
            {row.status === "COMPLETED" ? "FINALIZADA" : "EN CURSO"}
          </ITBadget>
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
              size="small"
              color="primary"
              variant="outlined"
              className="!p-2"
              title="Ver detalles"
            >
              <FaEye />
            </ITButton>

            {row.status === "IN_PROGRESS" && (
              <ITButton
                onClick={() => handleEndRound(row.id)}
                size="small"
                color="danger"
                variant="filled"
                className="!p-2"
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
    <div className="p-6 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
            <FaClock className="text-blue-500" />
            Historial de recorridos
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Historial y supervisión de recorridos de seguridad
          </p>
        </div>
        <div className="flex items-center gap-3">
            <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Buscar Guardia</label>
                <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 h-[42px] min-w-[240px] shadow-sm focus-within:border-emerald-500/50 transition-all">
                    <FaUser className="text-slate-300 text-xs mr-2" />
                    <input 
                        type="text"
                        placeholder="Nombre o usuario..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-transparent text-sm font-bold text-slate-600 outline-none w-full placeholder:text-slate-300 placeholder:font-normal"
                    />
                    {searchTerm.length > 0 && (
                        <button 
                            onClick={() => setSearchTerm("")}
                            className="text-slate-300 hover:text-red-400 transition-all"
                            title="Limpiar búsqueda"
                        >
                            <FaTimesCircle className="text-xs" />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Estado</label>
                <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 h-[42px] min-w-[150px] shadow-sm">
                    <select 
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setRefreshKey(prev => prev + 1);
                        }}
                        className="bg-transparent text-sm font-bold text-slate-600 outline-none w-full"
                    >
                        <option value="ALL">Todos</option>
                        <option value="IN_PROGRESS">En curso</option>
                        <option value="COMPLETED">Finalizadas</option>
                    </select>
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
                className="h-[42px] px-3 !rounded-xl border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-2"
                size="small"
                title="Actualizar tabla"
              >
                <FaSync className={`text-xs text-slate-500`} />
                <span className="text-xs font-bold text-slate-600">Refrescar</span>
          </ITButton>
                </div>
            </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <ITDataTable
          key={refreshKey}
          columns={memoizedColumns as any}
          fetchData={memoizedFetch as any}
          externalFilters={externalFilters}
          defaultItemsPerPage={10}
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
    </div>
  );
};

export default RoundsPage;
