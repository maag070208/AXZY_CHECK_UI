import { useCallback, useEffect, useMemo, useState } from "react";
import { ITBadget, ITButton, ITCard, ITDataTable, ITFlex, ITGrid, ITInput, ITPage, ITSearchSelect, ITText } from "@axzydev/axzy_ui_system";
import { FaUserShield, FaClipboardList, FaClock, FaEye, FaSync, FaSearch, FaTimes } from "react-icons/fa";
import { getPaginatedUsers, User } from "../../users/services/UserService";
import { getSchedules, Schedule } from "../../schedules/SchedulesService";
import { AssignmentModal } from "../components/AssignmentModal";
import { ViewAssignmentsModal } from "../components/ViewAssignmentsModal";
import { PersonAvatar } from "@app/core/components/PersonAvatar";
import { useRolePalette } from "@app/core/hooks/useRolePalette";

const GuardsPage = () => {
    const palette = useRolePalette();
    const [refreshKey, setRefreshKey] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const [scheduleFilter, setScheduleFilter] = useState("ALL");
    const [pendingFilter, setPendingFilter] = useState("ALL");
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [selectedGuard, setSelectedGuard] = useState<User | null>(null);
    const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    useEffect(() => {
        getSchedules().then(setSchedules).catch(() => setSchedules([]));
    }, []);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setRefreshKey(prev => prev + 1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, scheduleFilter, pendingFilter]);

    const externalFilters = useMemo(() => {
        const filters: Record<string, unknown> = {
            name: searchTerm,
            role: {
                name: {
                    in: ['GUARD', 'SHIFT', 'MAINT']
                }
            }
        };
        if (scheduleFilter !== "ALL") filters.scheduleId = scheduleFilter;
        if (pendingFilter !== "ALL") filters.pendingTasks = pendingFilter === "PENDING";
        return filters;
    }, [searchTerm, scheduleFilter, pendingFilter]);

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

    const roleNameOf = (row: any) => {
        if (typeof row.role === "object" && row.role) return String(row.role.name ?? row.role.value ?? "").toUpperCase();
        return String(row.role ?? "").toUpperCase();
    };

    const roleBadgeColor = (row: any) => {
        const role = roleNameOf(row);
        if (role === "MAINT") return "warning";
        if (role === "SHIFT") return "info";
        return "primary";
    };

    return (
        <ITPage
      className="m-0! mx-auto! max-w-[1600px]! px-6! bg-slate-50"
      noPadding
      title="Módulo de Guardias"
      breadcrumbs={[{ label: "Inicio", href: "#/home" }, { label: "Personal" }, { label: "Módulo de Guardias" }]}
      description="Gestión de personal operativo, turnos y controles de seguridad"
      icon={<FaUserShield size={20} />}
      iconColor={palette.primary}
    >

            <ITFlex direction="column" gap={5} className="w-full pb-10 pt-5">
                <ITCard className="rounded-3xl" contentClassName="p-4!">
                    <ITGrid container columns={12} spacing={3} className="items-end">
                        <ITGrid item xs={12} md={4}>
                            <ITFlex direction="column" gap={1}>
                                <ITText as="p" className="text-[9px] font-black uppercase tracking-widest text-slate-400">Buscar guardia</ITText>
                                <ITFlex align="center" gap={1}>
                                    <ITInput name="searchGuard" placeholder="Buscar guardia..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} iconLeft={<FaSearch />} size="md" />
                                    {searchTerm && <ITButton variant="icon-only" color="secondary" size="sm" onClick={() => setSearchTerm("")} icon={<FaTimes size={12} />} ariaLabel="Limpiar búsqueda" title="Limpiar búsqueda" />}
                                </ITFlex>
                            </ITFlex>
                        </ITGrid>
                        <ITGrid item xs={12} sm={6} md={3}>
                            <ITFlex direction="column" gap={1}>
                                <ITText as="p" className="text-[9px] font-black uppercase tracking-widest text-slate-400">Turno</ITText>
                                <ITSearchSelect value={scheduleFilter} onChange={(value) => setScheduleFilter(String(value))} options={[{ label: "Todos los turnos", value: "ALL" }, ...schedules.map((schedule) => ({ label: schedule.name, value: String(schedule.id) }))]} clearable={false} />
                            </ITFlex>
                        </ITGrid>
                        <ITGrid item xs={12} sm={6} md={3}>
                            <ITFlex direction="column" gap={1}>
                                <ITText as="p" className="text-[9px] font-black uppercase tracking-widest text-slate-400">Tareas</ITText>
                                <ITSearchSelect value={pendingFilter} onChange={(value) => setPendingFilter(String(value))} options={[{ label: "Todas", value: "ALL" }, { label: "Con pendientes", value: "PENDING" }, { label: "Sin pendientes", value: "NONE" }]} clearable={false} />
                            </ITFlex>
                        </ITGrid>
                        <ITGrid item xs={12} md={2}>
                            <ITFlex align="end" justify="end" className="h-full">
                                <ITButton onClick={refreshTable} variant="icon-only" color="secondary" size="md" icon={<FaSync />} ariaLabel="Actualizar" title="Actualizar" />
                            </ITFlex>
                        </ITGrid>
                    </ITGrid>
                </ITCard>

                <ITDataTable
                  defaultItemsPerPage={50}
                  itemsPerPageOptions={[25, 50, 100]}
                  layout="fixed"
                  density="compact"
                  showViewToggle={false}
                  virtualized
                  virtualizedMaxHeight={400}
                  rowHeight={50}
                    key={refreshKey}
                    fetchData={memoizedFetch as any}
                    externalFilters={externalFilters as any}
                    columns={[
                        {
                            key: "user",
                            label: "GUARDIA",
                            type: "string",
                            render: (row: any) => (
                                <ITFlex align="center" gap={3} className="flex items-center gap-3 py-2">
                                    <PersonAvatar
                                        name={`${row.name} ${row.lastName ?? ""}`.trim()}
                                        photoUrl={row.photoUrl}
                                        size={40}
                                    />
                                    <ITFlex direction="column">
                                        <ITFlex direction="column" className="font-bold text-slate-800 text-sm uppercase">{row.name} {row.lastName}</ITFlex>
                                        <ITFlex direction="column" className="text-xs text-slate-500 font-medium">@{row.username}</ITFlex>
                                    </ITFlex>
                                </ITFlex>
                            )
                        },
                        {
                            key: "role",
                            label: "CATEGORÍA",
                            type: "string",
                            render: (row: any) => {
                                const roleValue = typeof row.role === 'object' ? row.role.value : row.role;
                                return (
                                    <ITFlex align="center" className="flex items-center">
                                        <ITBadget color={roleBadgeColor(row) as any} variant="filled" size="sm">
                                            {roleValue}
                                        </ITBadget>
                                    </ITFlex>
                                );
                            }
                        },
                        {
                            key: "schedule",
                            label: "TURNO",
                            type: "string",
                            render: (row: any) => (
                                row.schedule ? (
                                    <ITFlex direction="column" className="text-sm text-slate-600">
                                        <ITFlex align="center" className="flex items-center gap-1.5 font-bold text-slate-700 text-xs uppercase">
                                            {row.schedule.name}
                                        </ITFlex>
                                        <ITFlex align="center" gap={1} className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                                            <FaClock className="text-[10px]" /> {row.schedule.startTime} - {row.schedule.endTime}
                                        </ITFlex>
                                    </ITFlex>
                                ) : (
                                    <ITText as="span" className="text-[11px] italic text-slate-300">Sin Horario</ITText>
                                )
                            )
                        },
                        {
                            key: "activity",
                            label: "ACTIVIDAD",
                            type: "string",
                            render: (row: any) => (
                                <ITFlex direction="column" className="text-sm text-slate-600">
                                    <ITFlex direction="column" className="font-bold text-xs">Tareas: {row.assignments?.length || 0}</ITFlex>
                                    {/* <div className="mt-1">
                                        <ITBadget 
                                            color={row.isLoggedIn ? "success" : "secondary"} 
                                            size="sm" 
                                            variant="filled" 
                                            className="!px-2 !py-0.5 !rounded-md"
                                        >
                                            <span className="text-[9px] font-black uppercase tracking-tighter">
                                                {row.isLoggedIn ? 'En Sesión' : 'Off-line'}
                                            </span>
                                        </ITBadget>
                                    </div> */}
                                </ITFlex>
                            )
                        },
                        {
                            key: "actions",
                            label: "ACCIONES",
                            type: "actions",
                            actions: (row: any) => (
                                <ITFlex align="center" gap={2}>
                                    <ITButton
                                        onClick={() => handleViewAssignments(row)}
                                        size="md"
                                        variant="icon-only"
                                        color="primary"
                                        icon={<FaEye />}
                                        ariaLabel="Ver tareas"
                                        title="Ver tareas"
                                    />
                                    <ITButton
                                        onClick={() => handleOpenAssignment(row)}
                                        size="md"
                                        variant="icon-only"
                                        color="secondary"
                                        icon={<FaClipboardList />}
                                        ariaLabel="Asignar tarea"
                                        title="Asignar tarea"
                                    />
                                </ITFlex>
                            )
                        }
                    ]}
                />
            </ITFlex>

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
        </ITPage>
    );
};

export default GuardsPage;
