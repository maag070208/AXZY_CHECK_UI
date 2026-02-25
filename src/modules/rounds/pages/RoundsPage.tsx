import { useEffect, useState } from "react";
import { getRoutesList } from "../../routes/services/RoutesService";
import { getRounds, IRound, startRound, endRound } from "../services/RoundsService";
import { getUsers } from "../../users/services/UserService";
import { ITBadget, ITButton, ITTable, ITLoader, ITDialog } from "@axzydev/axzy_ui_system";
import { FaEye, FaCalendarAlt, FaPlus, FaStop } from "react-icons/fa";
import { useNavigate } from "react-router-dom";


const RoundsPage = () => {
    const [rounds, setRounds] = useState<IRound[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<string>("");
    
    // Config IDs Map
    const [routesMap, setRoutesMap] = useState<Record<number, string>>({});

    const navigate = useNavigate();

    // Start Round Modal State
    const [isStartModalOpen, setIsStartModalOpen] = useState(false);
    const [guards, setGuards] = useState<any[]>([]);
    const [selectedGuard, setSelectedGuard] = useState<string>("");

    // Fetch Routes to build Map
    useEffect(() => {
        getRoutesList().then(res => {
            if (res.success && res.data) {
                const map: Record<number, string> = {};
                res.data.forEach((r: any) => {
                    map[r.id] = r.title;
                });
                setRoutesMap(map);
            }
        });
    }, []);

    const fetchRounds = async () => {
        setLoading(true);
        const res = await getRounds(selectedDate);
        if (res.success && res.data) {
            setRounds(res.data);
        }
        setLoading(false);
    };

    const handleOpenStartModal = async () => {
        const res = await getUsers();
        if (res.success && res.data) {
             const onlyGuards = res.data.filter((u: any) => u.role === 'GUARD' || u.role === 'SHIFT_GUARD');
             setGuards(onlyGuards);
        }
        setIsStartModalOpen(true);
    };

    // ... handleStartRound and handleEndRound remain same ...
    const handleStartRound = async () => {
        if (!selectedGuard) return;
        
        try {
            const res = await startRound(Number(selectedGuard));
            if (res.success) {
                alert("Ronda iniciada correctamente");
                setIsStartModalOpen(false);
                setSelectedGuard("");
                fetchRounds();
            } else {
                 const msg = res.messages?.join("\n") || "Error al iniciar ronda";
                 alert(msg);
            }
        } catch (e) {
            console.error(e);
            alert("Error de conexión");
        }
    };

    const handleEndRound = async (roundId: number) => {
        if (!window.confirm("¿Seguro que deseas FINALIZAR esta ronda manualmente? Esta acción no se puede deshacer.")) return;

        try {
            const res = await endRound(roundId);
            if (res.success) {
                alert("Ronda finalizada correctamente");
                fetchRounds();
            } else {
                alert(res.messages?.join("\n") || "Error al finalizar ronda");
            }
        } catch (e) {
            alert("Error al finalizar ronda");
        }
    };

    useEffect(() => {
        fetchRounds();
    }, [selectedDate]);

    return (
        <div className="p-6 bg-[#f6fbf4] min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Rondas</h1>
                    <p className="text-slate-500 text-sm mt-1">Historial y supervisión de rondas de seguridad</p>
                </div>
                <div className="flex gap-4">
                     <button 
                        onClick={handleOpenStartModal}
                        className="flex items-center gap-2 bg-[#065911] text-white px-4 py-2 rounded-xl font-medium shadow-sm hover:bg-[#086f16] transition-colors"
                    >
                        <FaPlus className="text-xs" />
                        <span>Nueva Ronda</span>
                    </button>
                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm">
                        <FaCalendarAlt className="text-slate-400" />
                        <input 
                            type="date" 
                            value={selectedDate} 
                            onChange={(e) => setSelectedDate(e.target.value)} 
                            className="text-sm text-slate-600 outline-none font-medium"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                {loading ? (
                    <div className="p-10 flex justify-center"><ITLoader /></div>
                ) : (
                    <ITTable
                        data={rounds as any[]}
                        columns={[
                            { 
                                key: "id", 
                                label: "ID", 
                                type: "number", 
                                sortable: true 
                            },
                            {
                                key: "recurringConfiguration",
                                label: "Ronda",
                                type: "string",
                                sortable: true,
                                render: (row: any) => (
                                    <span className="font-semibold text-slate-700">
                                        {row.recurringConfiguration?.title || routesMap[row.recurringConfigurationId] || "Ronda General"}
                                    </span>
                                )
                            },
                            {
                                key: "guard",
                                label: "Guardia",
                                type: "string",
                                sortable: true,
                                render: (row: IRound) => (
                                    <div className="font-medium text-slate-700">
                                        {row.guard.name} {row.guard.lastName}
                                    </div>
                                )
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
                                )
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
                                )
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
                                )
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
                                )
                            }
                        ]}
                         itemsPerPageOptions={[10, 20]}
                        defaultItemsPerPage={20}
                        title=""
                    />
                )}
            </div>

            {/* Start Round Modal */}
            <ITDialog
                isOpen={isStartModalOpen}
                onClose={() => setIsStartModalOpen(false)}
                title="Iniciar Nueva Ronda"
                className="!w-full !max-w-md"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Seleccionar Guardia</label>
                        <select 
                            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            value={selectedGuard}
                            onChange={(e) => setSelectedGuard(e.target.value)}
                        >
                            <option value="">-- Seleccione --</option>
                            {guards.map((g: any) => (
                                <option key={g.id} value={g.id}>
                                    {g.name} {g.lastName} ({g.username}) - {g.role}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Solo se muestran usuarios con rol GUARD o SHIFT_GUARD.</p>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button 
                            onClick={() => setIsStartModalOpen(false)} 
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={handleStartRound} 
                            disabled={!selectedGuard}
                            className={`px-4 py-2 rounded-lg text-white font-medium ${
                                !selectedGuard ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                            }`}
                        >
                            Iniciar Ronda
                        </button>
                    </div>
                </div>
            </ITDialog>
        </div>
    );
};

export default RoundsPage;
