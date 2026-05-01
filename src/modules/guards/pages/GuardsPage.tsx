import { useCallback, useEffect, useMemo, useState } from "react";
import { ITButton, ITDataTable } from "@axzydev/axzy_ui_system";
import { FaUserShield, FaClipboardList, FaClock, FaEye, FaSync, FaSearch, FaTimes } from "react-icons/fa";
import { getPaginatedUsers, User } from "../../users/services/UserService";
import { AssignmentModal } from "../components/AssignmentModal";
import { ViewAssignmentsModal } from "../components/ViewAssignmentsModal";

const GuardsPage = () => {
    const [refreshKey, setRefreshKey] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedGuard, setSelectedGuard] = useState<User | null>(null);
    const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setRefreshKey(prev => prev + 1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const externalFilters = useMemo(() => {
        return { 
            name: searchTerm,
            role: { 
                name: { 
                    in: ['GUARD', 'SHIFT', 'MAINT'] 
                } 
            } 
        };
    }, [searchTerm]);

    const memoizedFetch = useCallback((params: any) => {
        return getPaginatedUsers(params);
    }, []);

    const refreshTable = () => setRefreshKey(prev => prev + 1);

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
        refreshTable();
    };

    return (
        <div className="p-8 bg-[#F8FAFC] min-h-screen">
            {/* Header matching the ResidentsPage feel */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
                        <FaUserShield className="text-[#065911]" />
                        Módulo de Guardias
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Gestión de personal operativo, turnos y controles de seguridad</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="w-64 relative">
                        <input 
                            type="text"
                            placeholder="Buscar guardia..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full py-2 h-[42px] px-4 pr-10 bg-white border border-slate-100 rounded-xl outline-none text-sm focus:border-[#065911] transition-all shadow-sm font-medium text-slate-600"
                        />
                        {searchTerm ? (
                            <button 
                                onClick={() => setSearchTerm("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                            >
                                <FaTimes size={14} />
                            </button>
                        ) : (
                            <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-200" size={14} />
                        )}
                    </div>

                    <ITButton
                        onClick={refreshTable}
                        variant="outlined"
                        color="secondary"
                        className="h-[42px] !px-4 !rounded-xl !border-slate-200 !bg-white hover:!bg-slate-50 transition-all flex items-center gap-2"
                    >
                        <FaSync className={`text-xs text-slate-500 ${refreshKey % 2 === 0 ? '' : 'rotate-180'}`} />
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Actualizar</span>
                    </ITButton>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <ITDataTable
                    key={refreshKey}
                    fetchData={memoizedFetch as any}
                    externalFilters={externalFilters as any}
                    defaultItemsPerPage={10}
                    columns={[
                        {
                            key: "user",
                            label: "GUARDIA",
                            type: "string",
                            render: (row: any) => (
                                <div className="flex items-center gap-3 py-2">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold border border-slate-200 text-sm">
                                        {row.name.charAt(0)}{row.lastName?.charAt(0) || ''}
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-800 text-sm uppercase">{row.name} {row.lastName}</div>
                                        <div className="text-xs text-slate-500 font-medium">@{row.username}</div>
                                    </div>
                                </div>
                            )
                        },
                        {
                            key: "role",
                            label: "CATEGORÍA",
                            type: "string",
                            render: (row: any) => {
                                const roleValue = typeof row.role === 'object' ? row.role.value : row.role;
                                return (
                                    <div className="flex items-center">
                                        <span className="px-2 py-1 bg-[#F1F5F9] text-[#475569] font-bold text-[10px] rounded border border-slate-100 uppercase tracking-wider">
                                            {roleValue}
                                        </span>
                                    </div>
                                );
                            }
                        },
                        {
                            key: "schedule",
                            label: "TURNO",
                            type: "string",
                            render: (row: any) => (
                                row.schedule ? (
                                    <div className="text-sm text-slate-600">
                                        <div className="flex items-center gap-1.5 font-bold text-slate-700 text-xs uppercase">
                                            {row.schedule.name}
                                        </div>
                                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                                            <FaClock className="text-[10px]" /> {row.schedule.startTime} - {row.schedule.endTime}
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-[11px] italic text-slate-300">Sin Horario</span>
                                )
                            )
                        },
                        {
                            key: "activity",
                            label: "ACTIVIDAD",
                            type: "string",
                            render: (row: any) => (
                                <div className="text-sm text-slate-600">
                                    <div className="font-bold text-xs">Tareas: {row.assignments?.length || 0}</div>
                                    {/* <div className="mt-1">
                                        <ITBadget 
                                            color={row.isLoggedIn ? "success" : "secondary"} 
                                            size="small" 
                                            variant="filled" 
                                            className="!px-2 !py-0.5 !rounded-md"
                                        >
                                            <span className="text-[9px] font-black uppercase tracking-tighter">
                                                {row.isLoggedIn ? 'En Sesión' : 'Off-line'}
                                            </span>
                                        </ITBadget>
                                    </div> */}
                                </div>
                            )
                        },
                        {
                            key: "actions",
                            label: "ACCIONES",
                            type: "actions",
                            actions: (row: any) => (
                                <div className="flex items-center gap-2">
                                    <ITButton 
                                        onClick={() => handleViewAssignments(row)} 
                                        size="small" 
                                        variant="outlined" 
                                        className="border-emerald-200 text-emerald-600 hover:bg-emerald-50 !rounded-lg"
                                        title="Ver Tareas"
                                    >
                                        <FaEye />
                                    </ITButton>
                                    <ITButton 
                                        onClick={() => handleOpenAssignment(row)} 
                                        size="small" 
                                        variant="outlined" 
                                        color="secondary"
                                        title="Asignar Tarea"
                                    >
                                        <FaClipboardList />
                                    </ITButton>
                                </div>
                            )
                        }
                    ]}
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
