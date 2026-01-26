import { useEffect, useState } from "react";
import { getUsers, User } from "../services/UserService";
import { CreateUserWizard } from "../components/CreateUserWizard";
import { EditUserModal } from "../components/EditUserModal";
import { ChangePasswordModal } from "../components/ChangePasswordModal";
import { ITButton, ITDialog, ITLoader, ITTable, ITBadget } from "axzy_ui_system";
import { FaUser, FaEdit, FaKey, FaClock, FaPlus } from "react-icons/fa";

const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [changingPasswordUser, setChangingPasswordUser] = useState<User | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    const res = await getUsers();
    if (res.success && res.data) {
        setUsers(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSuccess = () => {
    setIsCreateModalOpen(false);
    setEditingUser(null);
    setChangingPasswordUser(null);
    fetchUsers();
  };

  if (loading) return <div className="flex justify-center p-10"><ITLoader /></div>;

  return (
    <div className="p-6 bg-[#f6fbf4] min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
           <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Gestión de Usuarios</h1>
           <p className="text-slate-500 text-sm mt-1">Administra el acceso y roles de los usuarios del sistema</p>
        </div>
        <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 bg-[#065911] text-white px-4 py-2 rounded-xl font-medium shadow-sm hover:bg-[#086f16] transition-colors"
        >
            <FaPlus className="text-xs" />
            <span>Nuevo Usuario</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <ITTable
            data={users as any[]}
            columns={[
            { key: "id", label: "ID", type: "number", sortable: true },
            { 
                key: "user", 
                label: "Usuario", 
                type: "string", 
                sortable: true,
                render: (row: User) => (
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                            <FaUser className="text-xs" />
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
                sortable: true,
                render: (row: User) => {
                    let color: "primary" | "secondary" | "success" | "warning" | "danger" = "primary";
                    if (row.role === 'ADMIN') color = "purple" as any; // Purple logic might vary in UI system, fallback to warning/primary
                    if (row.role === 'OPERATOR') color = "secondary";
                    if (row.role === 'GUARD') color = "success";
                    if (row.role === 'SHIFT_GUARD') color = "warning";
                    
                    return (
                        <ITBadget color={color} size="small" variant="filled">
                            {row.role}
                        </ITBadget>
                    );
                }
            },
            {
                key: "shift",
                label: "Turno",
                type: "string",
                sortable: false,
                render: (row: User) => (
                    (row.role === 'GUARD' || row.role === 'SHIFT_GUARD') && row.shiftStart ? (
                        <div className="flex items-center gap-1 text-slate-600 text-xs font-medium bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 w-fit">
                            <FaClock className="text-slate-400" />
                            <span>{row.shiftStart} - {row.shiftEnd}</span>
                        </div>
                    ) : (
                        <span className="text-xs text-slate-300">-</span>
                    )
                )
            },
            {
                key: "actions",
                label: "Acciones",
                type: "actions",
                actions: (row: User) => (
                    <div className="flex items-center gap-2">
                        <ITButton
                            onClick={() => setEditingUser(row)}
                            size="small"
                            color='secondary'
                            variant="outlined"
                            className="!p-2"
                            title="Editar usuario"
                        >
                            <FaEdit />
                        </ITButton>
                        <ITButton
                            onClick={() => setChangingPasswordUser(row)}
                            size="small"
                            color='warning'
                            variant="outlined"
                            className="!p-2"
                            title="Cambiar contraseña"
                        >
                            <FaKey />
                        </ITButton>
                    </div>
                )
            }
            ]}
            itemsPerPageOptions={[10, 20, 50]}
            defaultItemsPerPage={10}
            title=""
        />
      </div>

      {/* Create Modal */}
      <ITDialog 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        title="Alta de Usuario"
        className="!w-full !max-w-4xl"
        useFormHeader={true}
      >
         <CreateUserWizard 
            onCancel={() => setIsCreateModalOpen(false)} 
            onSuccess={handleSuccess} 
         />
      </ITDialog>

      {/* Edit Modal */}
      <ITDialog
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title="Editar Usuario"
        className="!w-full !max-w-2xl"
        useFormHeader={true}
      >
        {editingUser && (
            <EditUserModal
                user={editingUser}
                onCancel={() => setEditingUser(null)}
                onSuccess={handleSuccess}
            />
        )}
      </ITDialog>

      {/* CheckApp Style Action: Password Modal */}
      <ITDialog
        isOpen={!!changingPasswordUser}
        onClose={() => setChangingPasswordUser(null)}
        title="Cambiar Contraseña"
        className="!w-full !max-w-lg"
        useFormHeader={true}
      >
        {changingPasswordUser && (
            <ChangePasswordModal
                user={changingPasswordUser}
                onCancel={() => setChangingPasswordUser(null)}
                onSuccess={handleSuccess}
            />
        )}
      </ITDialog>

    </div>
  );
};

export default UsersPage;
