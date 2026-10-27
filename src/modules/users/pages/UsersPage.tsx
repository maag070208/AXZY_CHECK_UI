import { showToast } from "@app/core/store/toast/toast.slice";
import { ITBadget, ITButton, ITCard, ITDataTable, ITDialog, ITFlex, ITGrid, ITInput, ITPage, ITSearchSelect, ITText } from "@axzydev/axzy_ui_system";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FaClock, FaEdit, FaKey, FaPlus, FaSync, FaTimes, FaTrash, FaUserShield } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { useCatalog } from "@app/core/hooks/catalog.hook";
import { ChangePasswordModal } from "../components/ChangePasswordModal";
import { CreateUserWizard } from "../components/CreateUserWizard";
import { deleteUser, getPaginatedUsers, User } from "../services/UserService";
import { PersonAvatar } from "@app/core/components/PersonAvatar";

const UsersPage = () => {
    const dispatch = useDispatch();
    const [refreshKey, setRefreshKey] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("ALL");
    const [activeFilter, setActiveFilter] = useState("ALL");
    
    const { data: rolesCatalog } = useCatalog('role');
    const roleOptions = useMemo(
        () => rolesCatalog.filter((role) => Boolean(role.value)).map((role) => ({ label: role.value, value: String(role.id) })),
        [rolesCatalog],
    );

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
    }, [searchTerm, roleFilter, activeFilter]);

    const externalFilters = useMemo(() => {
        return {
            name: searchTerm,
            ...(roleFilter !== "ALL" && { roleId: roleFilter }),
            ...(activeFilter !== "ALL" && { active: activeFilter === "ACTIVE" }),
        };
    }, [searchTerm, roleFilter, activeFilter]);

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
        /* v8 ignore next -- guarda defensiva: el botón solo existe con un usuario por eliminar */
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
      className="m-0! mx-auto! max-w-[1600px]! px-6! bg-slate-50"
      noPadding
      title="Directorio de Usuarios"
      breadcrumbs={[{ label: "Inicio", href: "#/home" }, { label: "Personal" }, { label: "Directorio de Usuarios" }]}
      description="Gestión de usuarios vecinales, expedientes y controles de acceso"
      icon={<FaUserShield size={20} />}
      actions={
        <ITButton onClick={() => setIsCreateModalOpen(true)} color="primary" size="md">
          <ITFlex align="center" gap={2}>Nuevo usuario<FaPlus /></ITFlex>
        </ITButton>
      }
    >

            <ITFlex direction="column" gap={5} className="w-full pb-10 pt-5">
                <ITCard className="rounded-3xl" contentClassName="p-4!">
                    <ITGrid container columns={12} spacing={3} className="items-end">
                        <ITGrid item xs={12} md={4}>
                            <ITFlex direction="column" gap={1}>
                                <ITText as="p" className="text-[9px] font-black uppercase tracking-widest text-slate-400">Buscar usuario</ITText>
                                <ITFlex align="center" gap={1}>
                                    <ITInput name="searchUser" placeholder="Buscar usuario..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} iconLeft={<FaUserShield />} size="md" />
                                    {searchTerm && <ITButton variant="icon-only" color="secondary" size="sm" onClick={() => setSearchTerm("")} icon={<FaTimes size={12} />} ariaLabel="Limpiar búsqueda" title="Limpiar búsqueda" />}
                                </ITFlex>
                            </ITFlex>
                        </ITGrid>
                        <ITGrid item xs={12} sm={6} md={3}>
                            <ITFlex direction="column" gap={1}>
                                <ITText as="p" className="text-[9px] font-black uppercase tracking-widest text-slate-400">Rol</ITText>
                                <ITSearchSelect value={roleFilter} onChange={(value) => setRoleFilter(String(value))} options={[{ label: "Todos los roles", value: "ALL" }, ...roleOptions]} clearable={false} />
                            </ITFlex>
                        </ITGrid>
                        <ITGrid item xs={12} sm={6} md={3}>
                            <ITFlex direction="column" gap={1}>
                                <ITText as="p" className="text-[9px] font-black uppercase tracking-widest text-slate-400">Estatus</ITText>
                                <ITSearchSelect value={activeFilter} onChange={(value) => setActiveFilter(String(value))} options={[{ label: "Todos", value: "ALL" }, { label: "Activos", value: "ACTIVE" }, { label: "Inactivos", value: "INACTIVE" }]} clearable={false} />
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
                    externalFilters={externalFilters}
                    columns={[
                        {
                            key: "user",
                            label: "USUARIO",
                            type: "string",
                            sortable: false,
                            render: (row: User) => (
                                <ITFlex align="center" gap={3} className="flex items-center gap-3 py-2">
                                    <PersonAvatar
                                        name={`${row.name} ${row.lastName ?? ""}`.trim()}
                                        photoUrl={row.photoUrl}
                                        size={40}
                                    />
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
                            render: (row: User) => {
                                const roleName = row.role?.name || "";
                                const roleValue = row.role?.value || "S/R";
                                const color =
                                  roleName === "ADMIN" ? "primary" :
                                  roleName === "GUARD" ? "success" :
                                  roleName === "SHIFT" ? "info" :
                                  roleName === "MAINT" ? "warning" : "secondary";
                                return <ITBadget color={color as any} variant="filled" size="sm">{roleValue}</ITBadget>;
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
                                <ITBadget color={row.active ? "success" : "secondary"} variant="filled" size="sm">
                                  {row.active ? "Activo" : "Inactivo"}
                                </ITBadget>
                            )
                        },
                        {
                            key: "actions",
                            label: "ACCIONES",
                            type: "actions",
                            actions: (row: User) => (
                                <ITFlex align="center" gap={2}>
                                    <ITButton
                                        onClick={() => setChangingPasswordUser(row)}
                                        size="md"
                                        variant="icon-only"
                                        color="primary"
                                        icon={<FaKey />}
                                        ariaLabel="Cambiar contraseña"
                                        title="Cambiar contraseña"
                                    />
                                    <ITButton
                                        onClick={() => setEditingUser(row)}
                                        size="md"
                                        variant="icon-only"
                                        color="secondary"
                                        icon={<FaEdit />}
                                        ariaLabel="Editar"
                                        title="Editar"
                                    />
                                    <ITButton
                                        onClick={() => setUserToDeleteId(row.id)}
                                        size="md"
                                        variant="icon-only"
                                        color="danger"
                                        icon={<FaTrash />}
                                        ariaLabel="Eliminar"
                                        title="Eliminar"
                                    />
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
                <ITFlex direction="column" gap={4}>
                    <ITText as="p" className="text-sm text-slate-600 dark:text-slate-300">¿Estás seguro de eliminar el usuario seleccionado? Esta acción inhabilitará su acceso a la plataforma de forma permanente.</ITText>
                    <ITFlex justify="end" gap={2}>
                        <ITButton variant="outlined" color="secondary" onClick={() => setUserToDeleteId(null)}>Cancelar</ITButton>
                        <ITButton color="danger" onClick={confirmDelete}>Eliminar usuario</ITButton>
                    </ITFlex>
                </ITFlex>
            </ITDialog>
        </ITPage>
    );
};

export default UsersPage;
