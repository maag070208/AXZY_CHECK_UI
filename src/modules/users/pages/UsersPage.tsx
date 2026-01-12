import { useEffect, useState } from "react";
import { getUsers, User } from "../services/UserService";
import { CreateUserWizard } from "../components/CreateUserWizard";
import { ITButton, ITDialog, ITLoader, ITTable } from "axzy_ui_system";

const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    setIsModalOpen(false);
    fetchUsers();
  };

  if (loading) return <div className="flex justify-center p-10"><ITLoader /></div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Gestión de Usuarios</h1>
        <ITButton onClick={() => setIsModalOpen(true)}>Nuevo Usuario</ITButton>
      </div>

      <ITTable
        data={users as any[]}
        columns={[
          { key: "id", label: "ID", type: "number", sortable: true },
          { key: "name", label: "Nombre", type: "string", sortable: true },
          { key: "lastName", label: "Apellido", type: "string", sortable: true },
          { key: "email", label: "Email", type: "string", sortable: true },
          { key: "role", label: "Rol", type: "string", sortable: true },
        ]}
        itemsPerPageOptions={[5, 10, 20]}
        defaultItemsPerPage={10}
        title="Usuarios"
      />

      <ITDialog 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Alta de Usuario"
        className="!w-full !max-w-4xl" // Custom width
        useFormHeader={true}
      >
         <CreateUserWizard 
            onCancel={() => setIsModalOpen(false)} 
            onSuccess={handleSuccess} 
         />
      </ITDialog>
    </div>
  );
};

export default UsersPage;
