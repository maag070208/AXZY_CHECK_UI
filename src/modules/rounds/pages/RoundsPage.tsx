import { useEffect, useState } from "react";
import { getRounds, IRound } from "../services/RoundsService";
import { ITBadget, ITButton, ITTable, ITLoader } from "axzy_ui_system";
import { FaEye, FaCalendarAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const RoundsPage = () => {
    const [rounds, setRounds] = useState<IRound[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
    const navigate = useNavigate();

    const fetchRounds = async () => {
        setLoading(true);
        const res = await getRounds(selectedDate);
        if (res.success && res.data) {
            setRounds(res.data);
        }
        setLoading(false);
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
                                        color={row.status === "COMPLETED" ? "success" : "warning"}
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
                                )
                            }
                        ]}
                         itemsPerPageOptions={[10, 20]}
                        defaultItemsPerPage={20}
                        title=""
                    />
                )}
            </div>
        </div>
    );
};

export default RoundsPage;
