import { ITBadget, ITButton, ITDatePicker, ITLoader, ITSelect } from "@axzydev/axzy_ui_system";
import { showToast } from "@app/core/store/toast/toast.slice";
import { AppState } from "@app/core/store/store";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
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
import { downloadIncidentsPdf, getIncidents, Incident, IncidentPdfFilters } from "../services/IncidentService";

interface IncidentReportModalProps {
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

const IncidentReportModal = ({ isOpen, onClose }: IncidentReportModalProps) => {
    const dispatch = useDispatch();
    const auth = useSelector((state: AppState) => state.auth);
    const isAdmin = auth.role === 'ADMIN';

    const [dateRange, setDateRange] = useState<any>(() => getCurrentMonthRange());
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
    const [incidents, setIncidents] = useState<Incident[]>([]);
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
        const fetchIncidents = async () => {
            setLoading(true);
            try {
                const res = await getIncidents({ startDate: initialRange[0], endDate: initialRange[1] });
                if (cancelled) {
                    return;
                }
                if (res.success && Array.isArray(res.data)) {
                    setIncidents(res.data);
                    setSelectedIds(new Set(res.data.map((i) => i.id)));
                } else {
                    setIncidents([]);
                    setSelectedIds(new Set());
                }
            } catch {
                if (!cancelled) {
                    setIncidents([]);
                    setSelectedIds(new Set());
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };
        fetchIncidents();
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
        const fetchIncidents = async () => {
            setLoading(true);
            try {
                const res = await getIncidents({ startDate: start, endDate: end });
                if (cancelled) {
                    return;
                }
                if (res.success && Array.isArray(res.data)) {
                    setIncidents(res.data);
                    setSelectedIds(new Set(res.data.map((i) => i.id)));
                } else {
                    setIncidents([]);
                    setSelectedIds(new Set());
                }
            } catch {
                if (!cancelled) {
                    setIncidents([]);
                    setSelectedIds(new Set());
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };
        fetchIncidents();
        return () => {
            cancelled = true;
        };
    }, [dateRange, isOpen]);

    const filteredIncidents = useMemo(() => {
        if (statusFilter === "ALL") return incidents;
        return incidents.filter((i) => i.status === statusFilter);
    }, [incidents, statusFilter]);

    const allFilteredSelected = useMemo(
        () => filteredIncidents.length > 0 && filteredIncidents.every((i) => selectedIds.has(i.id)),
        [filteredIncidents, selectedIds],
    );

    const toggleIncident = (id: number) => {
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
                filteredIncidents.forEach((i) => next.delete(i.id));
            } else {
                filteredIncidents.forEach((i) => next.add(i.id));
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
            dispatch(showToast({ message: "Selecciona al menos una incidencia para incluir en el reporte", type: "warning" }));
            return;
        }

        const filters: IncidentPdfFilters = {
            startDate: start,
            endDate: end,
            ids: Array.from(selectedIds),
            includeImages,
            includeLocation,
        };

        setGenerating(true);
        const res = await downloadIncidentsPdf(filters);
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
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={handleClose}
            />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col border border-slate-100 animate-in fade-in zoom-in duration-200">
                <div className="px-6 py-4 flex justify-between items-center bg-white border-b border-slate-100 z-10 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <FaFilePdf />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Generar Reporte de Incidencias</h3>
                            <p className="text-xs text-slate-500">Configura el rango y selecciona las incidencias a incluir.</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={generating}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-red-500 transition-all disabled:opacity-50"
                        title="Cerrar"
                    >
                        <FaTimes />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 bg-slate-50/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
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
                        </div>
                        <div>
                            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                                <FaFilter className="text-emerald-500" /> Estado
                            </label>
                            <ITSelect
                                name="statusFilter"
                                value={statusFilter}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                                    setStatusFilter(e.target.value as StatusFilter)
                                }
                                options={[
                                    { value: "ALL", label: "Todos los estados" },
                                    { value: "PENDING", label: "Solo pendientes" },
                                    { value: "ATTENDED", label: "Solo atendidas" },
                                ]}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
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
                            <div className="flex-1">
                                <p className="text-sm font-bold leading-tight">Adjuntar imágenes</p>
                                <p className="text-[11px] opacity-75">Incluye la evidencia fotográfica y de video de cada incidencia.</p>
                            </div>
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
                            <div className="flex-1">
                                <p className="text-sm font-bold leading-tight">Adjuntar ubicación</p>
                                <p className="text-[11px] opacity-75">Incluye coordenadas GPS y enlace a Google Maps.</p>
                            </div>
                        </label>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 mb-3">
                        <div className="text-sm text-slate-600">
                            <span className="font-bold text-slate-800">{selectedIds.size}</span>
                            {" "}de{" "}
                            <span className="font-bold text-slate-800">{filteredIncidents.length}</span>
                            {" "}seleccionada{selectedIds.size === 1 ? "" : "s"}
                            <span className="text-slate-400 ml-2">
                                {startDate && endDate
                                    ? `(${dayjs(startDate).format("DD/MM/YYYY")} — ${dayjs(endDate).format("DD/MM/YYYY")})`
                                    : "(selecciona un rango)"}
                            </span>
                        </div>
                        <div className="ml-auto flex items-center gap-2">
                            <button
                                type="button"
                                onClick={toggleAllFiltered}
                                disabled={filteredIncidents.length === 0}
                                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                            >
                                {allFilteredSelected ? <FaCheckSquare /> : <FaSquare />}
                                {allFilteredSelected ? "Quitar todas" : "Seleccionar todas"}
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
                        </div>
                    </div>

                    <div className="border border-slate-100 rounded-xl overflow-hidden">
                        <div className="max-h-[320px] overflow-y-auto bg-white">
                            {loading ? (
                                <div className="flex items-center justify-center py-16 text-slate-400 gap-3">
                                    <ITLoader size="sm" />
                                    <span className="text-sm">Cargando incidencias del rango...</span>
                                </div>
                            ) : filteredIncidents.length === 0 ? (
                                <div className="py-16 text-center text-slate-400">
                                    <FaExclamationTriangle className="mx-auto mb-2 text-slate-300" />
                                    <p className="text-sm font-medium">No se encontraron incidencias en el rango seleccionado.</p>
                                </div>
                            ) : (
                                <ul className="divide-y divide-slate-100">
                                    {filteredIncidents.map((incident) => {
                                        const checked = selectedIds.has(incident.id);
                                        return (
                                            <li
                                                key={incident.id}
                                                className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors ${
                                                    checked ? "bg-emerald-50/40" : "hover:bg-slate-50"
                                                }`}
                                                onClick={() => toggleIncident(incident.id)}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleIncident(incident.id);
                                                    }}
                                                    className="mt-0.5 text-emerald-600 hover:text-emerald-700"
                                                    title={checked ? "Quitar del reporte" : "Incluir en el reporte"}
                                                >
                                                    {checked ? <FaCheckSquare size={18} /> : <FaSquare size={18} className="text-slate-300" />}
                                                </button>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-[10px] font-bold text-slate-400">#{incident.id}</span>
                                                        <p className="font-bold text-slate-800 text-sm line-clamp-1">{incident.title}</p>
                                                        <ITBadget
                                                            color={incident.status === 'ATTENDED' ? 'success' : 'danger'}
                                                            size="small"
                                                            variant="filled"
                                                        >
                                                            {incident.status === 'ATTENDED' ? 'Atendida' : 'Pendiente'}
                                                        </ITBadget>
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500 flex-wrap">
                                                        <span className="font-semibold">
                                                            {incident.category?.value ?? "General"}
                                                            {incident.type ? ` · ${incident.type.value}` : ""}
                                                        </span>
                                                        <span>{dayjs(incident.createdAt).format("DD/MM/YYYY HH:mm")}</span>
                                                        <span>
                                                            Por: {incident.guard?.name} {incident.guard?.lastName ?? ""}
                                                        </span>
                                                        {incident.media && incident.media.length > 0 && (
                                                            <span className="flex items-center gap-1 text-blue-500">
                                                                <FaFileAlt /> {incident.media.length}
                                                            </span>
                                                        )}
                                                        {incident.latitude && incident.longitude && (
                                                            <span className="flex items-center gap-1 text-emerald-500">
                                                                <FaMapMarkerAlt /> GPS
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-slate-100 bg-white rounded-b-2xl flex justify-between items-center gap-3">
                    <p className="text-[11px] text-slate-400">
                        {isAdmin ? "Generarás el reporte con permisos de administrador." : "El reporte se genera con los permisos del usuario autenticado."}
                    </p>
                    <div className="flex gap-3">
                        <ITButton
                            variant="outlined"
                            color="secondary"
                            className="px-6"
                            onClick={handleClose}
                            disabled={generating}
                        >
                            Cancelar
                        </ITButton>
                        <ITButton
                            variant="filled"
                            color="primary"
                            className="px-6 flex items-center gap-2"
                            onClick={handleGenerate}
                            disabled={selectedIds.size === 0 || generating}
                        >
                            {generating ? <ITLoader size="sm" /> : <FaFilePdf />}
                            <span>{generating ? "Generando..." : "Generar Reporte PDF"}</span>
                        </ITButton>
                    </div>
                </div>
            </div>

            {generating && (
                <div
                    className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-slate-900/70 backdrop-blur-sm cursor-wait"
                    role="alert"
                    aria-busy="true"
                    aria-live="assertive"
                >
                    <div className="bg-white rounded-2xl shadow-2xl px-8 py-7 flex flex-col items-center gap-4 border border-slate-100 min-w-[300px]">
                        <div className="relative w-16 h-16 flex items-center justify-center">
                            <span className="absolute inset-0 rounded-full border-4 border-emerald-100" />
                            <span className="absolute inset-0 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin" />
                            <FaFilePdf className="text-emerald-600 text-2xl" />
                        </div>
                        <div className="text-center">
                            <p className="text-base font-bold text-slate-800">Generando reporte PDF</p>
                            <p className="text-xs text-slate-500 mt-1">Por favor no cierres esta ventana.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default IncidentReportModal;
