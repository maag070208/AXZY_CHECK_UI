import { AppState } from "@app/core/store/store";
import { showToast } from "@app/core/store/toast/toast.slice";
import { TResult } from "@app/core/types/TResult";
import {
  RecurringConfiguration,
  createRecurring,
  deleteRecurring,
  getPaginatedRecurring,
  toggleRecurring,
  updateRecurring,
} from "@app/modules/recurring/service/recurring.service";
import {
  ITBadget,
  ITButton,
  ITDataTable,
  ITDialog,
  ITInput,
} from "@axzydev/axzy_ui_system";
import { useCallback, useState } from "react";
import { FaEdit, FaPlus, FaSync, FaTrash } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";

export const RecurringList = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: AppState) => state.auth);

  const [refreshKey, setRefreshKey] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RecurringConfiguration | null>(
    null,
  );
  const [itemToDelete, setItemToDelete] =
    useState<RecurringConfiguration | null>(null);
  const [title, setTitle] = useState("");

  const memoizedFetch = useCallback(async (params: any) => {
    const res = await getPaginatedRecurring(params);
    if (res.success && res.data) {
      return { data: res.data.rows, total: res.data.total };
    }
    return { data: [], total: 0 };
  }, []);

  const handleSave = async () => {
    if (!title) {
      dispatch(showToast({ message: "El nombre es requerido", type: "error" }));
      return;
    }

    try {
      const res = editingItem
        ? await updateRecurring(editingItem.id, { title })
        : await createRecurring({ title });

      if (res.success) {
        dispatch(
          showToast({
            message: `Configuración ${editingItem ? "actualizada" : "creada"}`,
            type: "success",
          }),
        );
        setIsModalOpen(false);
        setEditingItem(null);
        setTitle("");
        setRefreshKey((prev) => prev + 1);
      }
    } catch (error) {
      const result = error as TResult<void>;
      dispatch(
        showToast({
          message: result.error || "Error al guardar",
          type: "error",
        }),
      );
    }
  };

  const handleToggle = async (id: string) => {
    try {
      const res = await toggleRecurring(id);
      if (res.success) {
        dispatch(showToast({ message: "Estado actualizado", type: "success" }));
        setRefreshKey((prev) => prev + 1);
      }
    } catch (error) {
      const result = error as TResult<void>;
      dispatch(
        showToast({
          message: result.error || "Error al cambiar estado",
          type: "error",
        }),
      );
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      const res = await deleteRecurring(itemToDelete.id);
      if (res.success) {
        dispatch(
          showToast({ message: "Eliminado correctamente", type: "success" }),
        );
        setItemToDelete(null);
        setRefreshKey((prev) => prev + 1);
      }
    } catch (error) {
      const result = error as TResult<void>;
      dispatch(
        showToast({
          message: result.error || "Error al eliminar",
          type: "error",
        }),
      );
    }
  };

  const columns = [
    {
      key: "title",
      label: "Configuración Recurrente",
      render: (row: RecurringConfiguration) => (
        <span className="font-bold text-slate-800">{row.title}</span>
      ),
    },
    {
      key: "locations",
      label: "Puntos vinculados",
      render: (row: RecurringConfiguration) => (
        <ITBadget
          label={`${row._count?.locations || 0} PUNTOS`}
          color="success"
        />
      ),
    },
    {
      key: "actions",
      label: "Acciones",
      type: "actions",
      actions: (row: RecurringConfiguration) => (
        <div className="flex items-center gap-1">
          {user?.role !== "OPERATOR" && (
            <>
              <ITButton
                onClick={() => {
                  setEditingItem(row);
                  setTitle(row.title);
                  setIsModalOpen(true);
                }}
                variant="ghost"
                size="small"
                className="text-slate-400 hover:text-blue-600"
              >
                <FaEdit size={14} />
              </ITButton>
              <ITButton
                onClick={() => setItemToDelete(row)}
                variant="ghost"
                size="small"
                className="text-slate-400 hover:text-red-600"
              >
                <FaTrash size={14} />
              </ITButton>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <ITButton
          onClick={() => setRefreshKey((k) => k + 1)}
          variant="outlined"
          color="secondary"
          className="h-[42px] !rounded-xl border-slate-200 text-slate-500"
        >
          <div className="flex items-center gap-2">
            <FaSync className="mr-2" /> Actualizar
          </div>
        </ITButton>
        {user?.role !== "OPERATOR" && (
          <ITButton
            onClick={() => {
              setEditingItem(null);
              setTitle("");
              setIsModalOpen(true);
            }}
            color="primary"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl h-[42px] px-6 shadow-lg shadow-emerald-100"
          >
            <div className="flex items-center gap-2">
              <FaPlus className="mr-2" /> Nueva Recurrencia
            </div>
          </ITButton>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <ITDataTable
          key={refreshKey}
          columns={columns as any}
          fetchData={memoizedFetch as any}
          defaultItemsPerPage={10}
        />
      </div>

      <ITDialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? "Editar Recurrente" : "Nueva Recurrencia"}
      >
        <div className="p-6 flex flex-col gap-6">
          <ITInput
            label="Nombre de la Recurrencia"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            name="title"
            onBlur={() => {}}
            placeholder="Ej: Ronda Nocturna, Revisión de Perímetro..."
            className="!rounded-xl"
          />
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-50">
            <ITButton
              variant="outlined"
              color="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </ITButton>
            <ITButton
              onClick={handleSave}
              className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 px-8 !rounded-xl"
            >
              {editingItem ? "Actualizar" : "Crear"}
            </ITButton>
          </div>
        </div>
      </ITDialog>

      <ITDialog
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        title="Eliminar Configuración"
      >
        <div className="p-6 text-center">
          <p className="text-slate-600 mb-6">
            ¿Eliminar configuración{" "}
            <span className="font-bold text-slate-800">
              {itemToDelete?.title}
            </span>
            ?
          </p>
          <div className="flex justify-center gap-3">
            <ITButton
              variant="outlined"
              color="secondary"
              onClick={() => setItemToDelete(null)}
            >
              Cancelar
            </ITButton>
            <ITButton color="danger" onClick={confirmDelete}>
              Eliminar
            </ITButton>
          </div>
        </div>
      </ITDialog>
    </div>
  );
};
