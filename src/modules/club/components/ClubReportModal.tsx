import { ITBadget, ITButton, ITDatePicker, ITDialog, ITLoader, ITSearchSelect } from "@axzydev/axzy_ui_system";
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
import { ClubItem, ClubPdfFilters, downloadClubsPdf, getClubs } from "../services/ClubService";

interface ClubReportModalProps {
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

const ClubReportModal = ({ isOpen, onClose }: ClubReportModalProps) => {
    const dispatch = useDispatch();
    const auth = useSelector((state: AppState) => state.auth);
    const isAdmin = auth.role === 'ADMIN';

    const [dateRange, setDateRange] = useState<any>(() => getCurrentMonthRange());
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
    const [clubs, setClubs] = useState<ClubItem[]>([]);
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
        const fetchClubs = async () => {
            setLoading(true);
            try {
                const res = await getClubs({ startDate: initialRange[0], endDate: initialRange[1] });
                if (cancelled) {
                    return;
                }
                if (res.success && Array.isArray(res.data)) {
                    setClubs(res.data);
                    setSelectedIds(new Set(res.data.map((i) => i.id)));
                } else {
                    setClubs([]);
                    setSelectedIds(new Set());
                }
            } catch {
                if (!cancelled) {
                    setClubs([]);
                    setSelectedIds(new Set());
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };
        fetchClubs();
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
        const fetchClubs = async () => {
            setLoading(true);
            try {
                const res = await getClubs({ startDate: start, endDate: end });
                if (cancelled) {
                    return;
                }
                if (res.success && Array.isArray(res.data)) {
                    setClubs(res.data);
                    setSelectedIds(new Set(res.data.map((i) => i.id)));
                } else {
                    setClubs([]);
                    setSelectedIds(new Set());
                }
            } catch {
                if (!cancelled) {
                    setClubs([]);
                    setSelectedIds(new Set());
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };
        fetchClubs();
        return () => {
            cancelled = true;
        };
    }, [dateRange, isOpen]);

    const filteredClubs = useMemo(() => {
        if (statusFilter === "ALL") return clubs;
        return clubs.filter((i) => i.status === statusFilter);
    }, [clubs, statusFilter]);

    const allFilteredSelected = useMemo(
        () => filteredClubs.length > 0 && filteredClubs.every((i) => selectedIds.has(i.id)),
        [filteredClubs, selectedIds],
    );

    const toggleClub = (id: number) => {
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
                filteredClubs.forEach((i) => next.delete(i.id));
            } else {
                filteredClubs.forEach((i) => next.add(i.id));
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
            dispatch(showToast({ message: "Selecciona al menos un reporte para incluir en el PDF", type: "warning" }));
            return;
        }

        const filters: ClubPdfFilters = {
            startDate: start,
            endDate: end,
            ids: Array.from(selectedIds),
            includeImages,
            includeLocation,
        };

        setGenerating(true);
        const res = await downloadClubsPdf(filters);
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
            <ITDialog isOpen={isOpen} onClose={handleClose} title="Generar Reporte de Casa Club" className="max-w-4xl max-h-[90vh] flex flex-col">
                <p className="text-xs text-slate-500 mb-4">Configura el rango y selecciona los reportes a incluir.</p>
                    <div className="p-6 overflow-y-auto flex-1 bg-slate-50/30">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                                    <FaCalendarAlt className="text-sky-500" /> Rango de fechas
                                </label>
                                <ITDatePicker
                                    name="clubReportDateRange"
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
                                    <FaFilter className="text-sky-500" /> Estado
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
                            </div>
                        </div>
    
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
                            <label
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                                    includeImages
                                        ? "bg-sky-50 border-sky-200 text-sky-800"
                                        : "bg-slate-50 border-slate-200 text-slate-500"
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 accent-sky-600 cursor-pointer"
                                    checked={includeImages}
                                    onChange={(e) => setIncludeImages(e.target.checked)}
                                />
                                <FaFileImage className={`text-sm ${includeImages ? "text-sky-600" : "text-slate-400"}`} />
                                <div className="flex-1">
                                    <p className="text-sm font-bold leading-tight">Adjuntar imágenes</p>
                                    <p className="text-[11px] opacity-75">Incluye la evidencia fotográfica y de video de cada reporte.</p>
                                </div>
                            </label>
                            <label
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                                    includeLocation
                                        ? "bg-sky-50 border-sky-200 text-sky-800"
                                        : "bg-slate-50 border-slate-200 text-slate-500"
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 accent-sky-600 cursor-pointer"
                                    checked={includeLocation}
                                    onChange={(e) => setIncludeLocation(e.target.checked)}
                                />
                                <FaMapMarkerAlt className={`text-sm ${includeLocation ? "text-sky-600" : "text-slate-400"}`} />
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
                                <span className="font-bold text-slate-800">{filteredClubs.length}</span>
                                {" "}seleccionado{selectedIds.size === 1 ? "" : "s"}
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
                                    disabled={filteredClubs.length === 0}
                                    className="text-xs font-bold text-sky-700 hover:text-sky-900 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
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
                                        <span className="text-sm">Cargando reportes del rango...</span>
                                    </div>
                                ) : filteredClubs.length === 0 ? (
                                    <div className="py-16 text-center text-slate-400">
                                        <FaExclamationTriangle className="mx-auto mb-2 text-slate-300" />
                                        <p className="text-sm font-medium">No se encontraron reportes en el rango seleccionado.</p>
                                    </div>
                                ) : (
                                    <ul className="divide-y divide-slate-100">
                                        {filteredClubs.map((club) => {
                                            const checked = selectedIds.has(club.id);
                                            return (
                                                <li
                                                    key={club.id}
                                                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors ${
                                                        checked ? "bg-sky-50/40" : "hover:bg-slate-50"
                                                    }`}
                                                    onClick={() => toggleClub(club.id)}
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleClub(club.id);
                                                        }}
                                                        className="mt-0.5 text-sky-600 hover:text-sky-700"
                                                        title={checked ? "Quitar del reporte" : "Incluir en el reporte"}
                                                    >
                                                        {checked ? <FaCheckSquare size={18} /> : <FaSquare size={18} className="text-slate-300" />}
                                                    </button>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="text-[10px] font-bold text-slate-400">#{club.id}</span>
                                                            <p className="font-bold text-slate-800 text-sm line-clamp-1">{club.title}</p>
                                                            <ITBadget
                                                                color={club.status === 'ATTENDED' ? 'success' : 'danger'}
                                                                size="sm"
                                                                variant="filled"
                                                            >
                                                                {club.status === 'ATTENDED' ? 'Atendido' : 'Pendiente'}
                                                            </ITBadget>
                                                        </div>
                                                        <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500 flex-wrap">
                                                            <span className="font-semibold">
                                                                {club.category?.value ?? "General"}
                                                                {club.type ? ` · ${club.type.value}` : ""}
                                                            </span>
                                                            <span>{dayjs(club.createdAt).format("DD/MM/YYYY HH:mm")}</span>
                                                            <span>
                                                                Por: {club.guard?.name} {club.guard?.lastName ?? ""}
                                                            </span>
                                                            {club.media && club.media.length > 0 && (
                                                                <span className="flex items-center gap-1 text-blue-500">
                                                                    <FaFileAlt /> {club.media.length}
                                                                </span>
                                                            )}
                                                            {club.latitude && club.longitude && (
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
            </ITDialog>
            <ITDialog isOpen={generating} onClose={() => undefined} title="Generando reporte PDF" className="max-w-sm">
                <div className="flex flex-col items-center gap-4 py-4">
                    <ITLoader size="lg" />
                    <p className="text-xs text-slate-500">Por favor no cierres esta ventana.</p>
                </div>
            </ITDialog>
        </>
    );

    return modalContent;
};

export default ClubReportModal;
