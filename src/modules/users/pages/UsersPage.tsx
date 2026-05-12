import { ModuleHeader } from "@app/core/components/ModuleHeader";
import { ITTripleFilter } from "@app/core/components/ITTripleFilter";
import { showToast } from "@app/core/store/toast/toast.slice";
import { TResult } from "@app/core/types/TResult";
import {
  ITBadget,
  ITButton,
  ITDataTable,
  ITDialog,
  ITInput,
} from "@axzydev/axzy_ui_system";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaClock,
  FaEdit,
  FaKey,
  FaPlus,
  FaSync,
  FaTimes,
  FaTrash,
} from "react-icons/fa";
import { useDispatch } from "react-redux";
import { ChangePasswordModal } from "../components/ChangePasswordModal";
import { CreateUserWizard } from "../components/CreateUserWizard";
import { deleteUser, getPaginatedUsers, User } from "../services/UserService";
import { USERS_MODULE } from "../users.constants";

const UsersPage = () => {
  const dispatch = useDispatch();
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [changingPasswordUser, setChangingPasswordUser] = useState<User | null>(
    null,
  );
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [activeFilter, setActiveFilter] = useState<
    "all" | "active" | "inactive"
  >("active");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setRefreshKey((prev) => prev + 1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, activeFilter]);

  const memoizedFetch = useCallback(
    async (params: any) => {
      const result = await getPaginatedUsers({
        ...params,
        search: searchTerm,
        filters: {
          ...params.filters,
          active: activeFilter,
        },
      });
      if (result.success && result.data) {
        return { data: result.data.rows, total: result.data.total };
      }
      return { data: [], total: 0 };
    },
    [searchTerm, activeFilter],
  );

  const refreshTable = () => setRefreshKey((prev) => prev + 1);

  const handleSuccess = () => {
    setIsCreateModalOpen(false);
    setEditingUser(null);
    setChangingPasswordUser(null);
    refreshTable();
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      const res = await deleteUser(userToDelete.id);
      if (res.success) {
        dispatch(showToast({ message: "Usuario eliminado", type: "success" }));
        setUserToDelete(null);
        refreshTable();
      }
    } catch (error) {
      const result = error as TResult<void>;
      dispatch(
        showToast({
          message: result.error || "Error al eliminar usuario",
          type: "error",
        }),
      );
    }
  };

  const headerActions = (
    <>
      <div className="w-64 relative">
        <ITInput
          placeholder="Buscar usuario..."
          name="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onBlur={() => {}}
          className="!py-2 !h-[42px] !rounded-xl !pr-10 bg-white shadow-sm border-slate-100"
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
      <ITTripleFilter
        value={activeFilter}
        onChange={setActiveFilter}
        options={[
          { label: "Todos", value: "all" },
          { label: "Activos", value: "active" },
          { label: "Inactivos", value: "inactive" },
        ]}
      />
      <ITButton
        onClick={refreshTable}
        color="secondary"
        variant="outlined"
        className="h-[42px] !rounded-xl border-slate-200"
      >
        <div className="flex items-center gap-2">
          <FaSync
            className={`text-xs ${refreshKey % 2 === 0 ? "" : "rotate-180"} transition-transform duration-500`}
          />
          <span className="text-xs font-bold">Actualizar</span>
        </div>
      </ITButton>
      <ITButton
        onClick={() => setIsCreateModalOpen(true)}
        color="primary"
        className="h-[42px] !rounded-xl px-6 bg-emerald-600 shadow-lg shadow-emerald-100"
      >
        <div className="flex items-center gap-2">
          <FaPlus className="text-xs" />
          <span className="font-bold">Nuevo Usuario</span>
        </div>
      </ITButton>
    </>
  );

  const columns = useMemo(
    () => [
      {
        key: "user",
        label: "USUARIO",
        render: (row: User) => (
          <div className="flex items-center gap-3 py-2">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold border border-slate-200 text-sm uppercase">
              {row.name.charAt(0)}
              {row.lastName?.charAt(0) || ""}
            </div>
            <div>
              <div className="font-bold text-slate-800 text-sm">
                {row.name} {row.lastName}
              </div>
              <div className="text-xs text-slate-500 font-medium lowercase">
                @{row.username}
              </div>
            </div>
          </div>
        ),
      },
      {
        key: "role",
        label: "ROL / CATEGORÍA",
        render: (row: User) => {
          const roleName = row.role?.name || "";
          const roleValue = row.role?.value || "S/R";

          let badgeColor:
            | "primary"
            | "success"
            | "danger"
            | "warning"
            | "info"
            | "purple" = "info";

          if (roleName === "ADMIN") badgeColor = "primary";
          if (roleName === "GUARD") badgeColor = "success";
          if (roleName === "SHIFT") badgeColor = "purple";
          if (roleName === "MAINT") badgeColor = "warning";
          if (roleName === "RESDN") badgeColor = "info";

          return <ITBadget label={roleValue} color={badgeColor} />;
        },
      },
      {
        key: "schedule",
        label: "TURNO / ACCESO",
        render: (row: User) =>
          row.schedule ? (
            <div className="text-sm text-slate-600">
              <div className="flex items-center gap-1.5 font-bold text-slate-700">
                <FaClock className="text-emerald-500 text-xs" />
                {row.schedule.name}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 ml-4 font-bold uppercase tracking-wider">
                {row.schedule.startTime} - {row.schedule.endTime}
              </div>
            </div>
          ) : (
            <ITBadget label="Sin Horario" color="danger" />
          ),
      },
      {
        key: "status",
        label: "ESTADO",
        render: (row: User) => (
          <ITBadget
            label={row.active ? "ACTIVO" : "INACTIVO"}
            color={row.active ? "success" : "danger"}
          />
        ),
      },
      {
        key: "actions",
        label: "ACCIONES",
        type: "actions",
        actions: (row: User) => (
          <div className="flex items-center gap-1">
            <ITButton
              onClick={() => setChangingPasswordUser(row)}
              size="small"
              variant="ghost"
              className="text-emerald-500 hover:bg-emerald-50"
              title="Contraseña"
            >
              <FaKey size={14} />
            </ITButton>
            <ITButton
              onClick={() => setEditingUser(row)}
              size="small"
              variant="ghost"
              className="text-slate-400 hover:text-blue-600"
              title="Editar"
            >
              <FaEdit size={14} />
            </ITButton>
            <ITButton
              onClick={() => setUserToDelete(row)}
              size="small"
              variant="ghost"
              className="text-slate-300 hover:text-red-500"
              title="Eliminar"
            >
              <FaTrash size={14} />
            </ITButton>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <ModuleHeader {...USERS_MODULE} actions={headerActions} />

      <div className="mt-6 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <ITDataTable
          key={refreshKey}
          columns={columns as any}
          fetchData={memoizedFetch as any}
          defaultItemsPerPage={10}
        />
      </div>

      <ITDialog
        isOpen={isCreateModalOpen || !!editingUser}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingUser(null);
        }}
        title={
          editingUser ? `Editar Usuario: ${editingUser.name}` : "Nuevo Usuario"
        }
      >
        <div className="p-4 max-w-3xl mx-auto">
          <CreateUserWizard
            userToEdit={editingUser || undefined}
            onCancel={() => {
              setIsCreateModalOpen(false);
              setEditingUser(null);
            }}
            onSuccess={handleSuccess}
          />
        </div>
      </ITDialog>

      <ITDialog
        isOpen={!!changingPasswordUser}
        onClose={() => setChangingPasswordUser(null)}
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
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        title="Confirmar Eliminación"
      >
        <div className="p-6 text-center">
          <p className="text-slate-600 mb-8">
            ¿Estás seguro de eliminar a{" "}
            <span className="font-bold text-slate-800">
              {userToDelete?.name} {userToDelete?.lastName}
            </span>
            ?<br />
            Esta acción inhabilitará su acceso de forma permanente.
          </p>
          <div className="flex justify-center gap-3">
            <ITButton
              variant="outlined"
              color="secondary"
              onClick={() => setUserToDelete(null)}
            >
              Cancelar
            </ITButton>
            <ITButton color="danger" onClick={confirmDelete}>
              Eliminar Usuario
            </ITButton>
          </div>
        </div>
      </ITDialog>
    </div>
  );
};

export default UsersPage;
