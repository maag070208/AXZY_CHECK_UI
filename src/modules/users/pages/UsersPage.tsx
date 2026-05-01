import { useCatalog } from "@app/core/hooks/catalog.hook";
import { showToast } from "@app/core/store/toast/toast.slice";
import { ITButton, ITDataTable, ITDialog } from "@axzydev/axzy_ui_system";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FaClock, FaEdit, FaKey, FaPlus, FaSync, FaTimes, FaTrash, FaUserShield } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { ChangePasswordModal } from "../components/ChangePasswordModal";
import { CreateUserWizard } from "../components/CreateUserWizard";
import { deleteUser, getPaginatedUsers, User } from "../services/UserService";

const UsersPage = () => {
    const dispatch = useDispatch();
    const [refreshKey, setRefreshKey] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    
    // Catalog for roles filter
    const { data: rolesCatalog, loading: loadingRoles } = useCatalog('role');

    // Modal States
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [changingPasswordUser, setChangingPasswordUser] = useState<User | null>(null);
    const [userToDeleteId, setUserToDeleteId] = useState<number | null>(null);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setRefreshKey(prev => prev + 1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const externalFilters = useMemo(() => {
        return { name: searchTerm };
    }, [searchTerm]);

    const memoizedFetch = useCallback((params: any) => {
        return getPaginatedUsers(params);
    }, []);

    const refreshTable = () => setRefreshKey(prev => prev + 1);

    const handleSuccess = () => {
        setIsCreateModalOpen(false);
        setEditingUser(null);
        setChangingPasswordUser(null);
        refreshTable();
    };

    const confirmDelete = async () => {
        if (!userToDeleteId) return;
        const res = await deleteUser(userToDeleteId);
        setUserToDeleteId(null);
        if (res.success) {
            dispatch(showToast({ message: "Usuario eliminado", type: "success" }));
            refreshTable();
        } else {
            dispatch(showToast({ message: "Error al eliminar usuario", type: "error" }));
        }
    };

    return (
        <div className="p-6 bg-[#f8fafc] min-h-screen">
            {/* Header following the screenshot exactly */}
            <div className="flex justify-between items-center mb-8">
                <div>
                   <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
                        <FaUserShield className="text-emerald-600" />
                        Directorio de Usuarios
                   </h1>
                   <p className="text-slate-500 text-sm mt-1">Gestión de usuarios vecinales, expedientes y controles de acceso</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-64 relative">
                        <input 
                            type="text"
                            placeholder="Buscar usuario..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full py-2 h-[42px] px-4 pr-10 bg-white border border-slate-100 rounded-xl outline-none text-sm focus:border-emerald-500 transition-all shadow-sm font-medium text-slate-600"
                        />
                        {searchTerm && (
                            <button 
                                onClick={() => setSearchTerm("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                            >
                                <FaTimes size={14} />
                            </button>
                        )}
                    </div>
                    <ITButton
                        onClick={refreshTable}
                        color="secondary"
                        variant="outlined"
                        className="h-[42px] px-3 !rounded-xl border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-2"
                        size="small"
                    >
                        <FaSync className={`text-xs text-slate-500 ${refreshKey % 2 === 0 ? '' : 'rotate-180'}`} />
                        <span className="text-xs font-bold text-slate-500">Actualizar</span>
                    </ITButton>
                    <button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 h-[42px] rounded-xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 hover:scale-105 transition-all"
                    >
                        <FaPlus className="text-xs" />
                        <span>Nuevo Usuario</span>
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <ITDataTable
                    key={refreshKey}
                    fetchData={memoizedFetch as any}
                    externalFilters={externalFilters}
                    defaultItemsPerPage={10}
                    title=""
                    columns={[
                        {
                            key: "user",
                            label: "USUARIO",
                            type: "string",
                            sortable: true,
                            render: (row: User) => (
                                <div className="flex items-center gap-3 py-2">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold border border-slate-200 text-sm">
                                        {row.name.charAt(0)}{row.lastName?.charAt(0) || ''}
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-800 text-sm">{row.name} {row.lastName}</div>
                                        <div className="text-xs text-slate-500 font-medium">@{row.username}</div>
                                    </div>
                                </div>
                            )
                        },
                        {
                            key: "roleId",
                            label: "ROL / CATEGORÍA",
                            type: "string",
                            filter: "catalog",
                            catalogOptions: {
                                data: rolesCatalog,
                                loading: loadingRoles
                            },
                            render: (row: User) => {
                                const roleName = row.role?.name || '';
                                const roleValue = row.role?.value || 'S/R';
                                
                                let badgeClass = "bg-slate-50 text-slate-500 border-slate-100"; // Default
                                
                                if (roleName === 'ADMIN') badgeClass = "bg-blue-50 text-blue-700 border-blue-100";
                                if (roleName === 'GUARD') badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-100";
                                if (roleName === 'SHIFT') badgeClass = "bg-indigo-50 text-indigo-700 border-indigo-100";
                                if (roleName === 'MAINT') badgeClass = "bg-amber-50 text-amber-700 border-amber-100";
                                if (roleName === 'RESDN') badgeClass = "bg-slate-50 text-slate-500 border-slate-100";

                                return (
                                    <div className="flex items-center">
                                        <span className={`px-2 py-1 font-bold text-[10px] rounded border uppercase tracking-wider ${badgeClass}`}>
                                            {roleValue}
                                        </span>
                                    </div>
                                );
                            }
                        },
                        {
                            key: "schedule",
                            label: "TURNO / ACCESO",
                            type: "string",
                            render: (row: User) => (
                                row.schedule ? (
                                    <div className="text-sm text-slate-600">
                                        <div className="flex items-center gap-1.5 font-medium">
                                            <FaClock className="text-slate-400 text-xs" />
                                            {row.schedule.name}
                                        </div>
                                        <div className="text-xs text-slate-400 mt-0.5 ml-5">{row.schedule.startTime} - {row.schedule.endTime}</div>
                                    </div>
                                ) : (
                                    <span className="text-xs italic text-slate-400">Sin Horario</span>
                                )
                            )
                        },
                        {
                            key: "status",
                            label: "ESTADO",
                            type: "string",
                            render: (row: User) => (
                                <div className="text-sm text-slate-600">
                                    <div className={`flex items-center gap-1.5 font-medium ${row.active ? 'text-emerald-600' : 'text-slate-400'}`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${row.active ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                        {row.active ? 'Activo' : 'Inactivo'}
                                    </div>
                                </div>
                            )
                        },
                        {
                            key: "actions",
                            label: "ACCIONES",
                            type: "actions",
                            actions: (row: User) => (
                                <div className="flex items-center gap-2">
                                    <ITButton 
                                        onClick={() => setChangingPasswordUser(row)} 
                                        size="small" 
                                        variant="outlined" 
                                        className="border-emerald-200 text-emerald-500 hover:bg-emerald-50"
                                        title="Contraseña"
                                    >
                                        <FaKey />
                                    </ITButton>
                                    <ITButton 
                                        onClick={() => setEditingUser(row)} 
                                        size="small" 
                                        variant="ghost" 
                                        className="text-slate-400 hover:text-slate-600"
                                        title="Editar"
                                    >
                                        <FaEdit />
                                    </ITButton>
                                    <ITButton 
                                        onClick={() => setUserToDeleteId(row.id)} 
                                        size="small" 
                                        variant="ghost" 
                                        className="text-red-300 hover:text-red-500"
                                        title="Eliminar"
                                    >
                                        <FaTrash />
                                    </ITButton>
                                </div>
                            )
                        }
                    ] as any}
                />
            </div>

            {/* Modals matching the high-end style */}
            <ITDialog 
                isOpen={isCreateModalOpen || !!editingUser} 
                onClose={() => {
                    setIsCreateModalOpen(false);
                    setEditingUser(null);
                }} 
                title={editingUser ? `Editar Usuario: ${editingUser.name}` : "Nuevo Usuario"}
                className="!w-full !max-w-4xl"
            >
                <CreateUserWizard 
                    userToEdit={editingUser || undefined}
                    onCancel={() => {
                        setIsCreateModalOpen(false);
                        setEditingUser(null);
                    }} 
                    onSuccess={handleSuccess} 
                />
            </ITDialog>

            <ITDialog
                isOpen={!!changingPasswordUser}
                onClose={() => setChangingPasswordUser(null)}
                className="!w-full !max-w-lg"
                title="Cambiar Contraseña"
            >
                {changingPasswordUser && (
                    <ChangePasswordModal
                        user={changingPasswordUser}
                        onCancel={() => setChangingPasswordUser(null)}
                        onSuccess={handleSuccess}
                    />
                )}
            </ITDialog>

            <ITDialog 
                isOpen={!!userToDeleteId} 
                onClose={() => setUserToDeleteId(null)} 
                title="Confirmar Eliminación"
            >
                <div className="p-6">
                    <p className="text-slate-700 mb-6">¿Estás seguro de eliminar el usuario seleccionado? Esta acción inhabilitará su acceso a la plataforma de forma permanente.</p>
                    <div className="flex justify-end gap-3">
                        <ITButton variant="outlined" onClick={() => setUserToDeleteId(null)}>Cancelar</ITButton>
                        <ITButton className="bg-red-600 text-white border-red-600" onClick={confirmDelete}>Eliminar Usuario</ITButton>
                    </div>
                </div>
            </ITDialog>
        </div>
    );
};

export default UsersPage;
