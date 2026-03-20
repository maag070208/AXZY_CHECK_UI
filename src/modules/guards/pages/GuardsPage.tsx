import { useEffect, useState } from "react";
import { ITBadget, ITButton, ITTable, ITLoader } from "@axzydev/axzy_ui_system";
import { FaUserShield, FaClipboardList, FaClock, FaUser, FaEye } from "react-icons/fa";
import { getUsers, User } from "../../users/services/UserService";
import { AssignmentModal } from "../components/AssignmentModal";
import { ViewAssignmentsModal } from "../components/ViewAssignmentsModal";

const GuardsPage = () => {
    const [guards, setGuards] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedGuard, setSelectedGuard] = useState<User | null>(null);
    const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    const fetchGuards = async () => {
        setLoading(true);
        const res = await getUsers();
        if (res.success && res.data) {
            // Filter users with operative roles
            const onlyGuards = res.data.filter((u: User) => 
                u.role === 'GUARD' || u.role === 'SHIFT_GUARD' || u.role === 'MANTENIMIENTO'
            );
            setGuards(onlyGuards);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchGuards();
    }, []);

    const handleOpenAssignment = (guard: User) => {
        setSelectedGuard(guard);
        setIsAssignmentModalOpen(true);
    };

    const handleViewAssignments = (guard: User) => {
        setSelectedGuard(guard);
        setIsViewModalOpen(true);
    };

    const handleSuccess = () => {
        setIsAssignmentModalOpen(false);
        fetchGuards();
    };

    if (loading) return <div className="flex justify-center p-10"><ITLoader /></div>;

    return (
        <div className="p-6 bg-[#f6fbf4] min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
                        <FaUserShield className="text-[#065911]" />
                        Módulo de Guardias
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Listado de personal operativo y asignaciones especiales
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <ITTable
                    data={guards as any[]}
                    columns={[
                        {
                            key: "user",
                            label: "Guardia",
                            type: "string",
                            render: (row: any) => (
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
                                        <FaUser className="text-sm" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-700">{row.name} {row.lastName}</span>
                                        <span className="text-xs text-slate-400">@{row.username}</span>
                                    </div>
                                </div>
                            )
                        },
                        {
                            key: "role",
                            label: "Rol",
                            type: "string",
                            render: (row: any) => {
                                let color: "primary" | "secondary" | "success" | "warning" | "danger" = "success";
                                if (row.role === 'SHIFT_GUARD') color = "warning";
                                if (row.role === 'MANTENIMIENTO') color = "primary";
                                
                                return (
                                    <ITBadget color={color} size="small" variant="filled" className="uppercase text-[10px] font-bold tracking-wider">
                                        {row.role}
                                    </ITBadget>
                                );
                            }
                        },
                        {
                            key: "schedule",
                            label: "Turno / Horario",
                            type: "string",
                            render: (row: any) => (
                                row.schedule ? (
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-slate-600">{row.schedule.name}</span>
                                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                            <FaClock /> {row.schedule.startTime} - {row.schedule.endTime}
                                        </span>
                                    </div>
                                ) : (
                                    <span className="text-xs text-slate-300">Horario no asignado</span>
                                )
                            )
                        },
                        {
                            key: "status",
                            label: "Estado",
                            type: "string",
                            render: (row: any) => (
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${row.active ? 'bg-green-500' : 'bg-slate-300'} shadow-sm animate-pulse`}></div>
                                    <span className={`text-xs font-semibold ${row.active ? 'text-green-600' : 'text-slate-400'}`}>
                                        {row.active ? 'ACTIVO' : 'INACTIVO'}
                                    </span>
                                </div>
                            )
                        },
                        {
                            key: "actions",
                            label: "Acciones",
                            type: "actions",
                            actions: (row: any) => (
                                <div className="flex items-center gap-2">
                                    <ITButton
                                        onClick={() => handleViewAssignments(row)}
                                        size="small"
                                        variant="outlined"
                                        className="!border-[#065911] !text-[#065911] !rounded-xl !text-[12px] flex items-center gap-2 py-2"
                                    >
                                        <FaEye />
                                        <span>Ver Tareas</span>
                                    </ITButton>
                                    <ITButton
                                        onClick={() => handleOpenAssignment(row)}
                                        size="small"
                                        className="!bg-[#065911] !rounded-xl !text-[12px] flex items-center gap-2 py-2"
                                    >
                                        <FaClipboardList />
                                        <span>Asignar Tarea</span>
                                    </ITButton>
                                </div>
                            )
                        }
                    ]}
                    itemsPerPageOptions={[10, 20, 50]}
                    defaultItemsPerPage={20}
                    title=""
                />
            </div>

            {selectedGuard && (
                <>
                    <AssignmentModal
                        isOpen={isAssignmentModalOpen}
                        onClose={() => setIsAssignmentModalOpen(false)}
                        guardId={selectedGuard.id}
                        guardName={`${selectedGuard.name} ${selectedGuard.lastName}`}
                        onSuccess={handleSuccess}
                    />
                    <ViewAssignmentsModal
                        isOpen={isViewModalOpen}
                        onClose={() => setIsViewModalOpen(false)}
                        guardId={selectedGuard.id}
                        guardName={`${selectedGuard.name} ${selectedGuard.lastName}`}
                    />
                </>
            )}
        </div>
    );
};

export default GuardsPage;
