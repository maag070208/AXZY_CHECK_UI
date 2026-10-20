import { useCatalog } from "@app/core/hooks/catalog.hook";
import { showToast } from "@app/core/store/toast/toast.slice";
import { ITButton, ITDataTable, ITDialog, ITFlex, ITInput, ITPage, ITText } from "@axzydev/axzy_ui_system";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FaClock, FaEdit, FaKey, FaPlus, FaSync, FaTimes, FaTrash, FaUserShield } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { ChangePasswordModal } from "../components/ChangePasswordModal";
import { CreateUserWizard } from "../components/CreateUserWizard";
import { deleteUser, getPaginatedUsers, User } from "../services/UserService";
import { getRoleFilterOptions } from "../utils/role.utils";

const UsersPage = () => {
    const dispatch = useDispatch();
    const [refreshKey, setRefreshKey] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    
    // Catalog for roles filter
    const { data: rolesCatalog, loading: loadingRoles } = useCatalog('role');
    const roleFilterOptions = useMemo(() => getRoleFilterOptions(rolesCatalog), [rolesCatalog]);

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
        <ITPage
      className="m-0! px-4! max-w-screen!"
      noPadding
      title="Directorio de Usuarios"
      breadcrumbs={[{ label: "Inicio", href: "#/home" }, { label: "Personal" }, { label: "Directorio de Usuarios" }]}
      description="Gestión de usuarios vecinales, expedientes y controles de acceso"
      icon={<FaUserShield size={20} />}
      iconColor="#065911"
      actions={
<ITFlex align="center" gap={3} className="flex items-center gap-3">
                    <ITFlex direction="column" className="w-64 relative">
                        <ITInput
                            name="searchUser"
                            placeholder="Buscar usuario..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="!py-2 !h-[42px] !rounded-xl border-slate-100 !pr-10 bg-white"
                        />
                        {searchTerm && (
                            <ITButton
                                variant="icon-only"
                                color="gray"
                                size="sm"
                                onClick={() => setSearchTerm("")}
                                icon={<FaTimes size={14} />}
                               
                            />
                        )}
                    </ITFlex>
                    <ITButton
                        onClick={refreshTable}
                        color="secondary"
                        variant="outlined"
                       
                        size="md"
                    >
                        <ITFlex align="center" gap={2}><FaSync className={`text-xs text-slate-500 ${refreshKey % 2 === 0 ? '' : 'rotate-180'}`} />
                        <ITText as="span" className="text-xs font-bold text-slate-500">Actualizar</ITText></ITFlex>
                    </ITButton>
                    <ITButton
                        onClick={() => setIsCreateModalOpen(true)}
                        color="primary"
                        size="md"
                    >
                        <ITFlex align="center" gap={2}><FaPlus className="text-xs" /> NUEVO USUARIO
                    </ITFlex></ITButton>
                </ITFlex>
      }
    >

            <ITFlex direction="column" className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <ITDataTable
                  defaultItemsPerPage={50}
                  itemsPerPageOptions={[25, 50, 100]}
                  layout="fixed"
                  density="compact"
                  virtualized
                  virtualizedMaxHeight={400}
                  rowHeight={50}
                    key={refreshKey}
                    fetchData={memoizedFetch as any}
                    externalFilters={externalFilters}
                    title=""
                    columns={[
                        {
                            key: "user",
                            label: "USUARIO",
                            type: "string",
                            sortable: true,
                            render: (row: User) => (
                                <ITFlex align="center" gap={3} className="flex items-center gap-3 py-2">
                                    <ITFlex align="center" justify="center" className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold border border-slate-200 text-sm">
                                        {row.name.charAt(0)}{row.lastName?.charAt(0) || ''}
                                    </ITFlex>
                                    <ITFlex direction="column">
                                        <ITFlex direction="column" className="font-bold text-slate-800 text-sm">{row.name} {row.lastName}</ITFlex>
                                        <ITFlex direction="column" className="text-xs text-slate-500 font-medium">@{row.username}</ITFlex>
                                    </ITFlex>
                                </ITFlex>
                            )
                        },
                        {
                            key: "roleId",
                            label: "ROL / CATEGORÍA",
                            type: "string",
                            filter: "search",
                            catalogOptions: {
                                data: roleFilterOptions,
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
                                    <ITFlex align="center" className="flex items-center">
                                        <ITText as="span" className={`px-2 py-1 font-bold text-[10px] rounded border uppercase tracking-wider ${badgeClass}`}>
                                            {roleValue}
                                        </ITText>
                                    </ITFlex>
                                );
                            }
                        },
                        {
                            key: "schedule",
                            label: "TURNO / ACCESO",
                            type: "string",
                            render: (row: User) => (
                                row.schedule ? (
                                    <ITFlex direction="column" className="text-sm text-slate-600">
                                        <ITFlex align="center" className="flex items-center gap-1.5 font-medium">
                                            <FaClock className="text-slate-400 text-xs" />
                                            {row.schedule.name}
                                        </ITFlex>
                                        <ITFlex direction="column" className="text-xs text-slate-400 mt-0.5 ml-5">{row.schedule.startTime} - {row.schedule.endTime}</ITFlex>
                                    </ITFlex>
                                ) : (
                                    <ITText as="span" className="text-xs italic text-slate-400">Sin Horario</ITText>
                                )
                            )
                        },
                        {
                            key: "status",
                            label: "ESTADO",
                            type: "string",
                            render: (row: User) => (
                                <ITFlex direction="column" className="text-sm text-slate-600">
                                    <ITFlex direction="column" className={`flex items-center gap-1.5 font-medium ${row.active ? 'text-emerald-600' : 'text-slate-400'}`}>
                                        <ITFlex direction="column" className={`w-1.5 h-1.5 rounded-full ${row.active ? 'bg-emerald-500' : 'bg-slate-300'}`}></ITFlex>
                                        {row.active ? 'Activo' : 'Inactivo'}
                                    </ITFlex>
                                </ITFlex>
                            )
                        },
                        {
                            key: "actions",
                            label: "ACCIONES",
                            type: "actions",
                            actions: (row: User) => (
                                <ITFlex align="center" gap={2} className="flex items-center gap-2">
                                    <ITButton 
                                        onClick={() => setChangingPasswordUser(row)} 
                                        size="sm" 
                                        variant="outlined" 
                                       
                                        title="Contraseña"
                                    >
                                        <FaKey />
                                    </ITButton>
                                    <ITButton 
                                        onClick={() => setEditingUser(row)} 
                                        size="sm" 
                                        variant="ghost" 
                                       
                                        title="Editar"
                                    >
                                        <FaEdit />
                                    </ITButton>
                                    <ITButton 
                                        onClick={() => setUserToDeleteId(row.id)} 
                                        size="sm" 
                                        variant="ghost" 
                                       
                                        title="Eliminar"
                                    >
                                        <FaTrash />
                                    </ITButton>
                                </ITFlex>
                            )
                        }
                    ] as any}
                />
            </ITFlex>

            {/* Modals matching the high-end style */}
            <ITDialog 
                isOpen={isCreateModalOpen || !!editingUser} 
                onClose={() => {
                    setIsCreateModalOpen(false);
                    setEditingUser(null);
                }} 
                title={editingUser ? `Editar Usuario: ${editingUser.name}` : "Nuevo Usuario"}
                className="!w-full !max-w-2xl"
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
                <ITFlex direction="column" className="p-6">
                    <ITText as="p" className="text-slate-700 mb-6">¿Estás seguro de eliminar el usuario seleccionado? Esta acción inhabilitará su acceso a la plataforma de forma permanente.</ITText>
                    <ITFlex justify="end" gap={3} className="flex justify-end gap-3">
                        <ITButton variant="outlined" onClick={() => setUserToDeleteId(null)}>Cancelar</ITButton>
                        <ITButton onClick={confirmDelete}>Eliminar Usuario</ITButton>
                    </ITFlex>
                </ITFlex>
            </ITDialog>
        </ITPage>
    );
};

export default UsersPage;
