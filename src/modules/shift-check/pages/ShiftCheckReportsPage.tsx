import { useEffect, useState } from "react";
import { ITButton, ITDatePicker, ITInput, ITLoader } from "@axzydev/axzy_ui_system";
import { FaCalendarAlt, FaDownload, FaFilePdf, FaSync, FaUser } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { showToast } from "@app/core/store/toast/toast.slice";
import {
    downloadShiftCheckPdf,
    downloadShiftCheckElementPdf,
    getShiftCheckSummary,
    ShiftSummaryMetrics,
} from "../services/ShiftCheckReportsService";

const getCurrentMonthRange = (): [Date, Date] => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return [start, end];
};

const ShiftCheckReportsPage = () => {
    const dispatch = useDispatch();
    const [dateRange, setDateRange] = useState<any>(() => getCurrentMonthRange());
    const [summary, setSummary] = useState<ShiftSummaryMetrics | null>(null);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [elementUserId, setElementUserId] = useState<string>("");

    const fetchSummary = async () => {
        if (!Array.isArray(dateRange) || !dateRange[0] || !dateRange[1]) return;
        setLoading(true);
        const res = await getShiftCheckSummary(dateRange[0] as Date, dateRange[1] as Date);
        setLoading(false);
        if (res.success && res.data) {
            setSummary(res.data);
        } else {
            dispatch(showToast({ message: res.messages?.[0] ?? "Error al cargar resumen", type: "error" }));
        }
    };

    useEffect(() => {
        fetchSummary();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateRange]);

    const handleGenerateGeneral = async () => {
        if (!Array.isArray(dateRange) || !dateRange[0] || !dateRange[1]) {
            dispatch(showToast({ message: "Selecciona un rango válido", type: "warning" }));
            return;
        }
        setGenerating(true);
        const res = await downloadShiftCheckPdf({
            startDate: dateRange[0] as Date,
            endDate: dateRange[1] as Date,
            includeImages: false,
            includeLocation: false,
        });
        setGenerating(false);
        if (res.success) {
            dispatch(showToast({ message: "Reporte general generado", type: "success" }));
        } else {
            dispatch(showToast({ message: res.message || "Error al generar PDF", type: "error" }));
        }
    };

    const handleGenerateElement = async () => {
        const uid = Number(elementUserId);
        if (!Number.isInteger(uid) || uid <= 0) {
            dispatch(showToast({ message: "Ingresa un ID de elemento válido", type: "warning" }));
            return;
        }
        if (!Array.isArray(dateRange) || !dateRange[0] || !dateRange[1]) {
            dispatch(showToast({ message: "Selecciona un rango válido", type: "warning" }));
            return;
        }
        setGenerating(true);
        const res = await downloadShiftCheckElementPdf(
            uid,
            dateRange[0] as Date,
            dateRange[1] as Date);
        setGenerating(false);
        if (res.success) {
            dispatch(showToast({ message: "Expediente generado", type: "success" }));
        } else {
            dispatch(showToast({ message: res.message || "Error al generar PDF", type: "error" }));
        }
    };

    return (
        <div className="p-6 bg-[#f8fafc] min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Reportes de Verificación de Turno</h1>
                    <p className="text-slate-500 text-sm mt-1">Asistencia, puntualidad y expedientes individuales</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
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
                                    setDateRange(val.map((d: any) => (d ? new Date(d): null)));
                                } else if (val) {
                                    setDateRange([new Date(val), new Date(val)]);
                                } else {
                                    setDateRange(null);
                                }
                            }}
                            onBlur={() => {}}
                            className="text-sm text-slate-600 outline-none font-medium h-[42px] !border-slate-200"
                        />
                    </div>
                    <div>
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                            <FaUser className="text-emerald-500" /> ID elemento (expediente)
                        </label>
                        <ITInput
                            name="elementUserId"
                            placeholder="Ej. 42"
                            value={elementUserId}
                            onChange={(e: any) => setElementUserId(e.target.value)}
                            onBlur={() => {}}
                        />
                    </div>
                </div>
                <div className="flex flex-wrap gap-3">
                    <ITButton
                        onClick={handleGenerateGeneral}
                        color="primary"
                        variant="filled"
                        disabled={generating}
                        className="h-[42px] px-4 !rounded-xl flex items-center gap-2"
                        size="small"
                    >
                        {generating ? <ITLoader size="sm" />: <FaFilePdf />}
                        <span className="text-xs font-bold">Reporte General</span>
                    </ITButton>
                    <ITButton
                        onClick={handleGenerateElement}
                        color="primary"
                        variant="outlined"
                        disabled={generating}
                        className="h-[42px] px-4 !rounded-xl border-emerald-200 text-emerald-700 flex items-center gap-2"
                        size="small"
                    >
                        {generating ? <ITLoader size="sm" />: <FaDownload />}
                        <span className="text-xs font-bold">Expediente Individual</span>
                    </ITButton>
                    <ITButton
                        onClick={fetchSummary}
                        color="secondary"
                        variant="outlined"
                        disabled={loading}
                        className="h-[42px] px-4 !rounded-xl border-slate-200 flex items-center gap-2"
                        size="small"
                    >
                        <FaSync className="text-xs text-slate-500" />
                        <span className="text-xs font-bold text-slate-500">Refrescar resumen</span>
                    </ITButton>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-12">
                    <ITLoader size="lg" />
                </div>
            ): summary ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Card title="Total verificaciones" value={summary.total} color="slate" />
                    <Card title="Firmadas" value={summary.signed} color="emerald" />
                    <Card title="Con retardo" value={summary.lateCount} color="amber" />
                    <Card title="Faltas" value={summary.absentCount} color="red" />
                </div>
            ): null}

            {summary && summary.perUser.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100">
                        <h2 className="text-lg font-bold text-slate-800">Consolidado por elemento</h2>
                    </div>
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="text-left px-6 py-2 font-bold text-slate-600">Elemento</th>
                                <th className="text-right px-6 py-2 font-bold text-slate-600">Total</th>
                                <th className="text-right px-6 py-2 font-bold text-slate-600">Firmadas</th>
                                <th className="text-right px-6 py-2 font-bold text-slate-600">Retardos</th>
                                <th className="text-right px-6 py-2 font-bold text-slate-600">Faltas</th>
                                <th className="text-right px-6 py-2 font-bold text-slate-600">Uniforme no cumplido</th>
                                <th className="px-6 py-2" />
                            </tr>
                        </thead>
                        <tbody>
                            {summary.perUser.map((u) => (
                                <tr key={u.userId} className="border-t border-slate-100">
                                    <td className="px-6 py-3 font-medium text-slate-800">{u.userName}</td>
                                    <td className="px-6 py-3 text-right text-slate-700">{u.total}</td>
                                    <td className="px-6 py-3 text-right text-emerald-700 font-bold">{u.signed}</td>
                                    <td className="px-6 py-3 text-right text-amber-700 font-bold">{u.late}</td>
                                    <td className="px-6 py-3 text-right text-red-700 font-bold">{u.absent}</td>
                                    <td className="px-6 py-3 text-right text-violet-700 font-bold">{u.uniformFails}</td>
                                    <td className="px-6 py-3 text-right">
                                        <ITButton
                                            size="small"
                                            variant="outlined"
                                            color="primary"
                                            onClick={() => {
                                                setElementUserId(String(u.userId));
                                                setTimeout(handleGenerateElement, 100);
                                            }}
                                        >
                                            <FaDownload className="text-xs" />
                                        </ITButton>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

const Card = ({ title, value, color }: { title: string; value: number; color: string }) => {
    const colors: Record<string, string> = {
        slate: "border-slate-200 text-slate-800",
        emerald: "border-emerald-200 text-emerald-700",
        amber: "border-amber-200 text-amber-700",
        red: "border-red-200 text-red-700",
    };
    return (
        <div className={`bg-white border rounded-2xl p-5 shadow-sm ${colors[color] ?? colors.slate}`}>
            <p className="text-xs font-bold uppercase tracking-wider opacity-70">{title}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
    );
};

export default ShiftCheckReportsPage;
