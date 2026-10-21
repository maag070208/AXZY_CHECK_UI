import { ITBadget, ITButton, ITCard, ITCheckbox, ITDatePicker, ITDialog, ITFlex, ITGrid, ITLoader, ITSearchSelect, ITSlideToggle, ITText } from "@axzydev/axzy_ui_system";
import { showToast } from "@app/core/store/toast/toast.slice";
import { AppState } from "@app/core/store/store";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import {
    FaExclamationTriangle,
    FaFileAlt,
    FaFilePdf,
    FaMapMarkerAlt,
    FaTimes,
} from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { downloadClubsPdf, getClubs, ClubItem, ClubPdfFilters } from "../services/ClubService";

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
        const fetchItems = async () => {
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
        fetchItems();
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
        const fetchItems = async () => {
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
        fetchItems();
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
            dispatch(showToast({ message: "Selecciona al menos un reporte para incluir en el reporte", type: "warning" }));
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
            <ITDialog isOpen={isOpen} onClose={handleClose} title="Generar reporte de casa club" className="max-w-4xl max-h-[90vh] flex flex-col">
                <ITFlex direction="column" gap={4} className="min-h-0">
                    <ITText as="p" className="text-xs text-slate-500">
                        Configura el rango, filtra y selecciona los reportes a incluir.
                    </ITText>

                    <ITGrid container columns={12} spacing={3}>
                        <ITGrid item xs={12} md={6}>
                            <ITFlex direction="column" gap={1}>
                                <ITText as="p" className="text-[9px] font-black uppercase tracking-widest text-slate-400">Rango de fechas</ITText>
                                <ITDatePicker
                                    name="reportDateRange"
                                    value={dateRange as any}
                                    range
                                    onChange={(e) => {
                                        const val = e.target.value as any;
                                        if (Array.isArray(val)) {
                                            setDateRange(val.map((d) => (d ? new Date(d) : null)));
                                        } else if (val) {
                                            const date = new Date(val);
                                            setDateRange([date, date]);
                                        } else {
                                            setDateRange(null);
                                        }
                                    }}
                                />
                            </ITFlex>
                        </ITGrid>
                        <ITGrid item xs={12} md={6}>
                            <ITFlex direction="column" gap={1}>
                                <ITText as="p" className="text-[9px] font-black uppercase tracking-widest text-slate-400">Estado</ITText>
                                <ITSearchSelect
                                    name="statusFilter"
                                    value={statusFilter}
                                    onChange={(val) => setStatusFilter(val as StatusFilter)}
                                    options={[
                                        { value: "ALL", label: "Todos los estados" },
                                        { value: "PENDING", label: "Solo pendientes" },
                                        { value: "ATTENDED", label: "Solo atendidas" },
                                    ]}
                                    clearable={false}
                                />
                            </ITFlex>
                        </ITGrid>
                    </ITGrid>

                    <ITGrid container columns={12} spacing={3}>
                        <ITGrid item xs={12} md={6}>
                            <ITCard className="h-full rounded-2xl border-0! bg-emerald-50/60! shadow-none!" contentClassName="p-3!">
                                <ITFlex align="center" gap={3}>
                                    <ITSlideToggle isOn={includeImages} onToggle={setIncludeImages} size="sm" ariaLabel="Adjuntar imágenes" />
                                    <ITFlex direction="column">
                                        <ITText as="p" className="text-xs font-bold text-emerald-900">Adjuntar imágenes</ITText>
                                        <ITText as="p" className="text-[10px] text-emerald-700/80">Incluye fotos y videos de cada incidencia.</ITText>
                                    </ITFlex>
                                </ITFlex>
                            </ITCard>
                        </ITGrid>
                        <ITGrid item xs={12} md={6}>
                            <ITCard className="h-full rounded-2xl border-0! bg-emerald-50/60! shadow-none!" contentClassName="p-3!">
                                <ITFlex align="center" gap={3}>
                                    <ITSlideToggle isOn={includeLocation} onToggle={setIncludeLocation} size="sm" ariaLabel="Adjuntar ubicación" />
                                    <ITFlex direction="column">
                                        <ITText as="p" className="text-xs font-bold text-emerald-900">Adjuntar ubicación</ITText>
                                        <ITText as="p" className="text-[10px] text-emerald-700/80">Incluye GPS y enlace a Google Maps.</ITText>
                                    </ITFlex>
                                </ITFlex>
                            </ITCard>
                        </ITGrid>
                    </ITGrid>

                    <ITCard className="rounded-2xl" contentClassName="p-3!">
                        <ITFlex align="center" justify="between" gap={3} wrap="wrap">
                            <ITFlex direction="column">
                                <ITText as="p" className="text-xs text-slate-600">
                                    <ITText as="span" className="font-bold text-slate-900">{selectedIds.size}</ITText> de{" "}
                                    <ITText as="span" className="font-bold text-slate-900">{filteredClubs.length}</ITText> seleccionadas
                                </ITText>
                                <ITText as="p" className="text-[10px] text-slate-400">
                                    {startDate && endDate
                                        ? `${dayjs(startDate).format("DD/MM/YYYY")} — ${dayjs(endDate).format("DD/MM/YYYY")}`
                                        : "Selecciona un rango"}
                                </ITText>
                            </ITFlex>
                            <ITFlex align="center" gap={3} wrap="wrap">
                                <ITCheckbox
                                    checked={allFilteredSelected}
                                    onChange={toggleAllFiltered}
                                    disabled={filteredClubs.length === 0}
                                    label={<ITText as="span" className="text-xs font-bold text-slate-600">Seleccionar todas</ITText>}
                                />
                                {selectedIds.size > 0 && (
                                    <ITButton variant="text" color="danger" size="sm" icon={<FaTimes />} onClick={clearSelection}>
                                        Limpiar
                                    </ITButton>
                                )}
                            </ITFlex>
                        </ITFlex>
                    </ITCard>

                    <ITCard className="rounded-2xl" contentClassName="p-2!">
                        {loading ? (
                            <ITFlex align="center" justify="center" gap={2} className="py-14">
                                <ITLoader size="sm" />
                                <ITText as="span" className="text-sm text-slate-400">Cargando incidencias...</ITText>
                            </ITFlex>
                        ) : filteredClubs.length === 0 ? (
                            <ITFlex direction="column" align="center" className="py-14 text-slate-400">
                                <FaExclamationTriangle className="mb-2 text-slate-300" />
                                <ITText as="p" className="text-sm font-medium">No hay reportes en el rango seleccionado.</ITText>
                            </ITFlex>
                        ) : (
                            <ITFlex direction="column" gap={1} className="max-h-[320px] overflow-y-auto">
                                {filteredClubs.map((incident) => {
                                    const checked = selectedIds.has(incident.id);
                                    return (
                                        <ITFlex
                                            key={incident.id}
                                            align="center"
                                            gap={3}
                                            className={`rounded-xl p-3 transition-colors ${checked ? "bg-emerald-50/70" : "bg-slate-50/60"}`}
                                        >
                                            <ITCheckbox
                                                checked={checked}
                                                onChange={() => toggleClub(incident.id)}
                                                label={<ITText as="span" className="sr-only">Incluir reporte</ITText>}
                                            />
                                            <ITFlex direction="column" className="min-w-0 flex-1">
                                                <ITFlex align="center" gap={2} wrap="wrap">
                                                    <ITText as="span" className="text-[10px] font-bold text-slate-400">#{incident.id}</ITText>
                                                    <ITText as="span" className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">{incident.title}</ITText>
                                                    <ITBadget color={incident.status === "ATTENDED" ? "success" : "warning"} size="sm" variant="filled">
                                                        {incident.status === "ATTENDED" ? "Atendido" : "Pendiente"}
                                                    </ITBadget>
                                                </ITFlex>
                                                <ITFlex align="center" gap={2} wrap="wrap">
                                                    <ITText as="span" className="text-[10px] font-semibold text-slate-500">
                                                        {incident.category?.value ?? "General"}
                                                        {incident.type ? ` · ${incident.type.value}` : ""}
                                                    </ITText>
                                                    <ITText as="span" className="text-[10px] text-slate-400">
                                                        {dayjs(incident.createdAt).format("DD/MM/YYYY HH:mm")}
                                                    </ITText>
                                                    <ITText as="span" className="text-[10px] text-slate-400">
                                                        {incident.guard?.name} {incident.guard?.lastName ?? ""}
                                                    </ITText>
                                                    {incident.media && incident.media.length > 0 && (
                                                        <ITText as="span" className="flex items-center gap-1 text-[10px] text-blue-500">
                                                            <FaFileAlt size={9} /> {incident.media.length}
                                                        </ITText>
                                                    )}
                                                    {incident.latitude && incident.longitude && (
                                                        <ITText as="span" className="flex items-center gap-1 text-[10px] text-emerald-500">
                                                            <FaMapMarkerAlt size={9} /> GPS
                                                        </ITText>
                                                    )}
                                                </ITFlex>
                                            </ITFlex>
                                        </ITFlex>
                                    );
                                })}
                            </ITFlex>
                        )}
                    </ITCard>

                    <ITFlex align="center" justify="between" gap={3} wrap="wrap">
                        <ITText as="p" className="text-[10px] text-slate-400">
                            {isAdmin ? "Reporte con permisos de administrador." : "Reporte con los permisos del usuario."}
                        </ITText>
                        <ITFlex align="center" gap={2}>
                            <ITButton variant="outlined" color="secondary" size="md" onClick={handleClose} disabled={generating}>
                                Cancelar
                            </ITButton>
                            <ITButton
                                color="primary"
                                size="md"
                                onClick={handleGenerate}
                                disabled={selectedIds.size === 0 || generating}
                            >
                                <ITFlex align="center" gap={2}>
                                    {generating ? "Generando..." : "Generar reporte PDF"}
                                    <FaFilePdf />
                                </ITFlex>
                            </ITButton>
                        </ITFlex>
                    </ITFlex>
                </ITFlex>
            </ITDialog>

            <ITDialog isOpen={generating} onClose={() => undefined} title="Generando reporte PDF" className="max-w-sm">
                <ITFlex direction="column" align="center" gap={3} className="py-4">
                    <ITLoader size="lg" />
                    <ITText as="p" className="text-xs text-slate-500">No cierres esta ventana.</ITText>
                </ITFlex>
            </ITDialog>
        </>
    );

    return modalContent;
};

export default ClubReportModal;
