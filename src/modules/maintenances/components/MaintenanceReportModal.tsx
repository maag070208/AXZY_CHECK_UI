import { ITBadget, ITButton, ITDatePicker, ITDialog, ITFlex, ITLoader, ITSearchSelect, ITText } from "@axzydev/axzy_ui_system";
import { showToast } from "@app/core/store/toast/toast.slice";
import { AppState } from "@app/core/store/store";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import {
    FaCalendarAlt,
    FaCheckSquare,
    FaExclamationTriangle,
    FaFileAlt,
    FaFileImage,
    FaFilePdf,
    FaFilter,
    FaMapMarkerAlt,
    FaSquare,
    FaTimes,
} from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import {
    downloadMaintenancesPdf,
    getMaintenances,
    Maintenance,
    MaintenancePdfFilters,
} from "../services/MaintenanceService";

interface MaintenanceReportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const getCurrentMonthRange = (): [Date, Date] => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return [start, end];
};

type StatusFilter = "ALL" | "PENDING" | "ATTENDED";

const MaintenanceReportModal = ({ isOpen, onClose }: MaintenanceReportModalProps) => {
    const dispatch = useDispatch();
    const auth = useSelector((state: AppState) => state.auth);
    const isAdmin = auth.role === 'ADMIN';

    const [dateRange, setDateRange] = useState<any>(() => getCurrentMonthRange());
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
    const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set());
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [includeImages, setIncludeImages] = useState(true);
    const [includeLocation, setIncludeLocation] = useState(true);

    useEffect(() => {
        if (!isOpen) {
            return;
        }
        const initialRange = getCurrentMonthRange();
        setDateRange(initialRange);
        setStatusFilter("ALL");
        setSelectedIds(new Set());
        setIncludeImages(true);
        setIncludeLocation(true);

        let cancelled = false;
        const fetchMaintenances = async () => {
            setLoading(true);
            try {
                const res = await getMaintenances({ startDate: initialRange[0], endDate: initialRange[1] });
                if (cancelled) {
                    return;
                }
                if (res.success && Array.isArray(res.data)) {
                    setMaintenances(res.data);
                    setSelectedIds(new Set(res.data.map((m) => m.id)));
                } else {
                    setMaintenances([]);
                    setSelectedIds(new Set());
                }
            } catch {
                if (!cancelled) {
                    setMaintenances([]);
                    setSelectedIds(new Set());
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };
        fetchMaintenances();
        return () => {
            cancelled = true;
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }
        if (!Array.isArray(dateRange) || !dateRange[0] || !dateRange[1]) {
            return;
        }
        const start = dateRange[0] as Date;
        const end = dateRange[1] as Date;

        let cancelled = false;
        const fetchMaintenances = async () => {
            setLoading(true);
            try {
                const res = await getMaintenances({ startDate: start, endDate: end });
                if (cancelled) {
                    return;
                }
                if (res.success && Array.isArray(res.data)) {
                    setMaintenances(res.data);
                    setSelectedIds(new Set(res.data.map((m) => m.id)));
                } else {
                    setMaintenances([]);
                    setSelectedIds(new Set());
                }
            } catch {
                if (!cancelled) {
                    setMaintenances([]);
                    setSelectedIds(new Set());
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };
        fetchMaintenances();
        return () => {
            cancelled = true;
        };
    }, [dateRange, isOpen]);

    const filteredMaintenances = useMemo(() => {
        if (statusFilter === "ALL") return maintenances;
        return maintenances.filter((m) => m.status === statusFilter);
    }, [maintenances, statusFilter]);

    const allFilteredSelected = useMemo(
        () => filteredMaintenances.length > 0 && filteredMaintenances.every((m) => selectedIds.has(m.id)),
        [filteredMaintenances, selectedIds],
    );

    const toggleMaintenance = (id: number) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const toggleAllFiltered = () => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (allFilteredSelected) {
                filteredMaintenances.forEach((m) => next.delete(m.id));
            } else {
                filteredMaintenances.forEach((m) => next.add(m.id));
            }
            return next;
        });
    };

    const clearSelection = () => setSelectedIds(new Set());

    const handleClose = () => {
        if (generating) return;
        onClose();
    };

    const handleGenerate = async () => {
        if (!Array.isArray(dateRange) || !dateRange[0] || !dateRange[1]) {
            dispatch(showToast({ message: "Selecciona un rango de fechas válido", type: "warning" }));
            return;
        }
        const start = dateRange[0] as Date;
        const end = dateRange[1] as Date;
        if (selectedIds.size === 0) {
            dispatch(showToast({ message: "Selecciona al menos un mantenimiento para incluir en el reporte", type: "warning" }));
            return;
        }

        const filters: MaintenancePdfFilters = {
            startDate: start,
            endDate: end,
            ids: Array.from(selectedIds),
            includeImages,
            includeLocation,
        };

        setGenerating(true);
        const res = await downloadMaintenancesPdf(filters);
        setGenerating(false);

        if (res.success) {
            dispatch(showToast({ message: "Reporte PDF generado correctamente", type: "success" }));
            onClose();
        } else {
            dispatch(showToast({ message: res.message || "Error al generar el PDF", type: "error" }));
        }
    };

    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !generating) onClose();
        };
        document.addEventListener("keydown", onKey);
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = "";
        };
    }, [isOpen, generating, onClose]);

    if (!isOpen) return null;
    if (typeof document === "undefined") return null;

    const startDate = Array.isArray(dateRange) ? dateRange[0] as Date | null : null;
    const endDate = Array.isArray(dateRange) ? dateRange[1] as Date | null : null;

    const modalContent = (
        <>
            <ITDialog isOpen={isOpen} onClose={handleClose} title="Generar Reporte de Mantenimientos" className="max-w-4xl max-h-[90vh] flex flex-col">
                <ITText as="p" className="text-xs text-slate-500 mb-4">Configura el rango y selecciona los mantenimientos a incluir.</ITText>
                    <ITFlex direction="column" className="p-6 overflow-y-auto flex-1 bg-slate-50/30">
                        <ITFlex direction="column" className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <ITFlex direction="column">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                                    <FaCalendarAlt className="text-emerald-500" /> Rango de fechas
                                </label>
                                <ITDatePicker
                                    name="reportDateRange"
                                    value={dateRange as any}
                                    range
                                    onChange={(e) => {
                                        const val = e.target.value as any;
                                        if (Array.isArray(val)) {
                                            const parsedDates = val.map((d) => (d ? new Date(d) : null));
                                            setDateRange(parsedDates);
                                        } else if (val) {
                                            const date = new Date(val);
                                            setDateRange([date, date]);
                                        } else {
                                            setDateRange(null);
                                        }
                                    }}
                                    className="text-sm text-slate-600 outline-none font-medium h-[42px] !border-slate-200"
                                />
                            </ITFlex>
                            <ITFlex direction="column">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                                    <FaFilter className="text-emerald-500" /> Estado
                                </label>
                                <ITSearchSelect
                                    name="statusFilter"
                                    value={statusFilter}
                                    onChange={(val) => setStatusFilter(val as StatusFilter)}
                                    options={[
                                        { value: "ALL", label: "Todos los estados" },
                                        { value: "PENDING", label: "Solo pendientes" },
                                        { value: "ATTENDED", label: "Solo atendidos" },
                                    ]}
                                />
                            </ITFlex>
                        </ITFlex>
    
                        <ITFlex direction="column" className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
                            <label
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                                    includeImages
                                        ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                                        : "bg-slate-50 border-slate-200 text-slate-500"
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 accent-emerald-600 cursor-pointer"
                                    checked={includeImages}
                                    onChange={(e) => setIncludeImages(e.target.checked)}
                                />
                                <FaFileImage className={`text-sm ${includeImages ? "text-emerald-600" : "text-slate-400"}`} />
                                <ITFlex direction="column" className="flex-1">
                                    <ITText as="p" className="text-sm font-bold leading-tight">Adjuntar imágenes</ITText>
                                    <ITText as="p" className="text-[11px] opacity-75">Incluye la evidencia fotográfica y de video de cada mantenimiento.</ITText>
                                </ITFlex>
                            </label>
                            <label
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                                    includeLocation
                                        ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                                        : "bg-slate-50 border-slate-200 text-slate-500"
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 accent-emerald-600 cursor-pointer"
                                    checked={includeLocation}
                                    onChange={(e) => setIncludeLocation(e.target.checked)}
                                />
                                <FaMapMarkerAlt className={`text-sm ${includeLocation ? "text-emerald-600" : "text-slate-400"}`} />
                                <ITFlex direction="column" className="flex-1">
                                    <ITText as="p" className="text-sm font-bold leading-tight">Adjuntar ubicación</ITText>
                                    <ITText as="p" className="text-[11px] opacity-75">Incluye coordenadas GPS y enlace a Google Maps.</ITText>
                                </ITFlex>
                            </label>
                        </ITFlex>
    
                        <ITFlex align="center" gap={3} className="flex flex-wrap items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 mb-3">
                            <ITFlex direction="column" className="text-sm text-slate-600">
                                <ITText as="span" className="font-bold text-slate-800">{selectedIds.size}</ITText>
                                {" "}de{" "}
                                <ITText as="span" className="font-bold text-slate-800">{filteredMaintenances.length}</ITText>
                                {" "}seleccionado{selectedIds.size === 1 ? "" : "s"}
                                <ITText as="span" className="text-slate-400 ml-2">
                                    {startDate && endDate
                                        ? `(${dayjs(startDate).format("DD/MM/YYYY")} — ${dayjs(endDate).format("DD/MM/YYYY")})`
                                        : "(selecciona un rango)"}
                                </ITText>
                            </ITFlex>
                            <ITFlex align="center" gap={2} className="ml-auto flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={toggleAllFiltered}
                                    disabled={filteredMaintenances.length === 0}
                                    className="text-xs font-bold text-emerald-700 hover:text-emerald-900 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                                >
                                    {allFilteredSelected ? <FaCheckSquare /> : <FaSquare />}
                                    {allFilteredSelected ? "Quitar todos" : "Seleccionar todos"}
                                </button>
                                {selectedIds.size > 0 && (
                                    <button
                                        type="button"
                                        onClick={clearSelection}
                                        className="text-xs font-bold text-slate-400 hover:text-red-500 flex items-center gap-1"
                                    >
                                        <FaTimes size={10} /> Limpiar
                                    </button>
                                )}
                            </ITFlex>
                        </ITFlex>
    
                        <ITFlex direction="column" className="border border-slate-100 rounded-xl overflow-hidden">
                            <ITFlex direction="column" className="max-h-[320px] overflow-y-auto bg-white">
                                {loading ? (
                                    <ITFlex align="center" justify="center" gap={3} className="flex items-center justify-center py-16 text-slate-400 gap-3">
                                        <ITLoader size="sm" />
                                        <ITText as="span" className="text-sm">Cargando mantenimientos del rango...</ITText>
                                    </ITFlex>
                                ) : filteredMaintenances.length === 0 ? (
                                    <ITFlex direction="column" className="py-16 text-center text-slate-400">
                                        <FaExclamationTriangle className="mx-auto mb-2 text-slate-300" />
                                        <ITText as="p" className="text-sm font-medium">No se encontraron mantenimientos en el rango seleccionado.</ITText>
                                    </ITFlex>
                                ) : (
                                    <ul className="divide-y divide-slate-100">
                                        {filteredMaintenances.map((m) => {
                                            const checked = selectedIds.has(m.id);
                                            return (
                                                <li
                                                    key={m.id}
                                                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors ${
                                                        checked ? "bg-emerald-50/40" : "hover:bg-slate-50"
                                                    }`}
                                                    onClick={() => toggleMaintenance(m.id)}
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleMaintenance(m.id);
                                                        }}
                                                        className="mt-0.5 text-emerald-600 hover:text-emerald-700"
                                                        title={checked ? "Quitar del reporte" : "Incluir en el reporte"}
                                                    >
                                                        {checked ? <FaCheckSquare size={18} /> : <FaSquare size={18} className="text-slate-300" />}
                                                    </button>
                                                    <ITFlex direction="column" className="flex-1 min-w-0">
                                                        <ITFlex align="center" gap={2} className="flex items-center gap-2 flex-wrap">
                                                            <ITText as="span" className="text-[10px] font-bold text-slate-400">#{m.id}</ITText>
                                                            <ITText as="p" className="font-bold text-slate-800 text-sm line-clamp-1">{m.title}</ITText>
                                                            <ITBadget
                                                                color={m.status === 'ATTENDED' ? 'success' : 'warning'}
                                                                size="sm"
                                                                variant="filled"
                                                            >
                                                                {m.status === 'ATTENDED' ? 'Atendido' : 'Pendiente'}
                                                            </ITBadget>
                                                        </ITFlex>
                                                        <ITFlex align="center" gap={3} className="flex items-center gap-3 mt-1 text-[11px] text-slate-500 flex-wrap">
                                                            <ITText as="span" className="font-semibold">{m.category || 'General'}</ITText>
                                                            <ITText as="span">{dayjs(m.createdAt).format("DD/MM/YYYY HH:mm")}</ITText>
                                                            <ITText as="span">
                                                                Por: {m.guard?.name} {m.guard?.lastName ?? ""}
                                                            </ITText>
                                                            {m.media && m.media.length > 0 && (
                                                                <ITText as="span" className="flex items-center gap-1 text-blue-500">
                                                                    <FaFileAlt /> {m.media.length}
                                                                </ITText>
                                                            )}
                                                            {m.latitude && m.longitude && (
                                                                <ITText as="span" className="flex items-center gap-1 text-emerald-500">
                                                                    <FaMapMarkerAlt /> GPS
                                                                </ITText>
                                                            )}
                                                        </ITFlex>
                                                    </ITFlex>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </ITFlex>
                        </ITFlex>
                    </ITFlex>
    
                    <ITFlex align="center" justify="between" gap={3} className="px-6 py-4 border-t border-slate-100 bg-white rounded-b-2xl flex justify-between items-center gap-3">
                        <ITText as="p" className="text-[11px] text-slate-400">
                            {isAdmin ? "Generarás el reporte con permisos de administrador." : "El reporte se genera con los permisos del usuario autenticado."}
                        </ITText>
                        <ITFlex gap={3} className="flex gap-3">
                            <ITButton
                                variant="outlined"
                                color="secondary"
                               
                                onClick={handleClose}
                                disabled={generating}
                            >
                                Cancelar
                            </ITButton>
                            <ITButton
                                variant="filled"
                                color="primary"
                               
                                onClick={handleGenerate}
                                disabled={selectedIds.size === 0 || generating}
                            >
                                {generating ? <ITLoader size="sm" /> : <FaFilePdf />}
                                <ITText as="span">{generating ? "Generando..." : "Generar Reporte PDF"}</ITText>
                            </ITButton>
                        </ITFlex>
                    </ITFlex>
            </ITDialog>
            <ITDialog isOpen={generating} onClose={() => undefined} title="Generando reporte PDF" className="max-w-sm">
                <ITFlex direction="column" align="center" gap={4} className="flex flex-col items-center gap-4 py-4">
                    <ITLoader size="lg" />
                    <ITText as="p" className="text-xs text-slate-500">Por favor no cierres esta ventana.</ITText>
                </ITFlex>
            </ITDialog>
        </>
    );

    return modalContent;
};

export default MaintenanceReportModal;
