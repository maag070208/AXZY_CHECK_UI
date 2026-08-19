import { useCallback, useEffect, useMemo, useState } from "react";
import { ITBadget, ITButton, ITDataTable, ITDialog, ITInput, ITLoader } from "@axzydev/axzy_ui_system";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "@app/core/store/store";
import { showToast } from "@app/core/store/toast/toast.slice";
import { FaCheck, FaFilter, FaSync } from "react-icons/fa";
import dayjs from "dayjs";
import {
  getPaginatedShiftChecks,
  ShiftCheck,
  signShiftCheck,
} from "../services/ShiftCheckService";

const ShiftCheckPage = () => {
  const dispatch = useDispatch();
  const auth = useSelector((state: AppState) => state.auth);
  const isAdminOrShift = auth.role === "ADMIN" || auth.role === "SHIFT";

  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [signingId, setSigningId] = useState<string | null>(null);
  const [deliveredUsername, setDeliveredUsername] = useState("");
  const [deliveredPassword, setDeliveredPassword] = useState("");
  const [receivedUsername, setReceivedUsername] = useState("");
  const [receivedPassword, setReceivedPassword] = useState("");

  const externalFilters = useMemo(() => {
    const f: Record<string, string> = {};
    if (searchTerm.trim()) f.search = searchTerm.trim();
    if (statusFilter !== "ALL") f.status = statusFilter;
    return f;
  }, [searchTerm, statusFilter]);

  const memoizedFetch = useCallback(
    (params: Record<string, unknown>) => getPaginatedShiftChecks(params),
    [],
  );

  useEffect(() => {
    const t = setTimeout(() => setRefreshKey((p) => p + 1), 400);
    return () => clearTimeout(t);
  }, [searchTerm, statusFilter]);

  const confirmSign = async () => {
    if (!signingId) return;
    const res = await signShiftCheck(signingId, {
      deliveredUsername,
      deliveredPassword,
      receivedUsername,
      receivedPassword,
    });
    setSigningId(null);
    setDeliveredUsername("");
    setDeliveredPassword("");
    setReceivedUsername("");
    setReceivedPassword("");
    if (res.success) {
      dispatch(showToast({ message: "Verificación firmada", type: "success" }));
      setRefreshKey((p) => p + 1);
    } else {
      dispatch(showToast({ message: res.messages?.[0] ?? "Error al firmar", type: "error" }));
    }
  };

  const columns = useMemo(
    () => [
      { key: "shiftDate", label: "Fecha", type: "string", sortable: true, render: (row: ShiftCheck) => (
        <div className="flex flex-col text-xs">
          <span className="font-medium text-slate-700">{dayjs(row.shiftDate).format("DD/MM/YYYY")}</span>
          <span className="text-slate-400">{row.shiftType}</span>
        </div>
      ) },
      {
        key: "user",
        label: "Elemento",
        type: "string",
        render: (row: ShiftCheck) => (
          <div>
            <p className="font-medium text-slate-800 text-sm">
              {row.user ? `${row.user.name} ${row.user.lastName ?? ""}`.trim() : `#${row.userId}`}
            </p>
            <p className="text-xs text-slate-400">@{row.user?.username ?? "—"}</p>
          </div>
        ),
      },
      {
        key: "delayMinutes",
        label: "Puntualidad",
        type: "number",
        render: (row: ShiftCheck) =>
          row.isAbsent ? (
            <ITBadget color="danger" size="small">Falta</ITBadget>
          ) : row.isLate ? (
            <ITBadget color="warning" size="small">Retardo {row.delayMinutes} min</ITBadget>
          ) : (
            <ITBadget color="success" size="small">Puntual</ITBadget>
          ),
      },
      {
        key: "status",
        label: "Estado",
        type: "string",
        sortable: true,
        render: (row: ShiftCheck) => (
          <ITBadget
            color={row.status === "SIGNED" ? "success" : row.status === "COMPLETED" ? "primary" : "secondary"}
            size="small"
            variant="filled"
          >
            {row.status === "SIGNED" ? "Firmado" : row.status === "COMPLETED" ? "Completo" : "Borrador"}
          </ITBadget>
        ),
      },
      {
        key: "createdBy",
        label: "Capturado por",
        type: "string",
        render: (row: ShiftCheck) => (
          <span className="text-xs text-slate-600">
            {row.createdBy ? `${row.createdBy.name} ${row.createdBy.lastName ?? ""}`.trim() : `#${row.createdById}`}
          </span>
        ),
      },
      {
        key: "actions",
        label: "Acciones",
        type: "actions",
        actions: (row: ShiftCheck) => (
          <div className="flex items-center gap-2">
            <ITButton
              size="small"
              color="success"
              variant="filled"
              className="!p-2"
              title="Firmar (RF-05)"
              disabled={row.status === "SIGNED"}
              onClick={() => setSigningId(row.id)}
            >
              <FaCheck />
            </ITButton>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="p-6 bg-[#f8fafc] min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Verificación de Cambio de Turno</h1>
          <p className="text-slate-500 text-sm mt-1">Puntualidad, uniforme, aseo y entrega de turno</p>
        </div>
        <div className="flex gap-3 items-center">
          <div className="w-64 relative">
            <ITInput
              placeholder="Buscar por nombre..."
              name="search"
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              onBlur={() => {}}
              className="!py-2 !h-[42px] !rounded-xl border-slate-100 !pr-10 bg-white"
            />
          </div>
          <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-2">
            <FaFilter className="text-slate-400 text-xs mr-2" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-sm font-medium text-slate-700 outline-none"
            >
              <option value="ALL">Todos</option>
              <option value="DRAFT">Borrador</option>
              <option value="COMPLETED">Completo</option>
              <option value="SIGNED">Firmado</option>
            </select>
          </div>
          <ITButton
            onClick={() => setRefreshKey((p) => p + 1)}
            color="secondary"
            variant="outlined"
            className="h-[42px] px-4 !rounded-xl border-slate-200"
            size="small"
          >
            <FaSync className="text-xs text-slate-500" />
            <span className="text-xs font-bold text-slate-500 ml-2">Refrescar</span>
          </ITButton>
        </div>
      </div>

      {!isAdminOrShift && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 mb-4 text-sm">
          Estás viendo el módulo en modo lectura. La captura solo está disponible para ADMIN/SHIFT (también en la APP móvil).
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <ITDataTable
          key={`${refreshKey}`}
          fetchData={memoizedFetch as any}
          columns={columns as any}
          externalFilters={externalFilters as any}
          defaultItemsPerPage={10}
          title=""
        />
      </div>

      <ITDialog
        isOpen={!!signingId}
        onClose={() => setSigningId(null)}
        title="Firma (Opción A: username + password)"
        className="!max-w-lg"
      >
        <div className="p-4 space-y-3">
          <p className="text-xs text-slate-500">
            Se validarán las credenciales del que ENTREGA y del que RECIBE contra <code>User.password</code> (bcrypt).
          </p>
          <div className="grid grid-cols-2 gap-3">
            <ITInput
              name="deliveredUsername"
              placeholder="Username ENTREGADOR"
              value={deliveredUsername}
              onChange={(e: any) => setDeliveredUsername(e.target.value)}
              onBlur={() => {}}
            />
            <ITInput
              name="deliveredPassword"
              type="password"
              placeholder="Password ENTREGADOR"
              value={deliveredPassword}
              onChange={(e: any) => setDeliveredPassword(e.target.value)}
              onBlur={() => {}}
            />
            <ITInput
              name="receivedUsername"
              placeholder="Username RECEPTOR"
              value={receivedUsername}
              onChange={(e: any) => setReceivedUsername(e.target.value)}
              onBlur={() => {}}
            />
            <ITInput
              name="receivedPassword"
              type="password"
              placeholder="Password RECEPTOR"
              value={receivedPassword}
              onChange={(e: any) => setReceivedPassword(e.target.value)}
              onBlur={() => {}}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <ITButton variant="outlined" onClick={() => setSigningId(null)}>
              Cancelar
            </ITButton>
            <ITButton variant="filled" color="success" onClick={confirmSign}>
              Firmar
            </ITButton>
          </div>
        </div>
      </ITDialog>

      {signingId && <div className="hidden"><ITLoader /></div>}
    </div>
  );
};

export default ShiftCheckPage;
