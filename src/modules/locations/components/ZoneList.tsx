import { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaEdit, FaPlus, FaSync, FaTrash } from "react-icons/fa";
import { AppState } from "@app/core/store/store";
import { showToast } from "@app/core/store/toast/toast.slice";
import {
  ITBadget,
  ITButton,
  ITDataTable,
  ITDialog,
  ITInput,
} from "@axzydev/axzy_ui_system";
import { TResult } from "@app/core/types/TResult";
import {
  getZones,
  createZone,
  updateZone,
  deleteZone,
  Zone,
} from "../service/zones.service";

export const ZoneList = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: AppState) => state.auth);

  const [refreshKey, setRefreshKey] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [zoneToDelete, setZoneToDelete] = useState<Zone | null>(null);
  const [name, setName] = useState("");

  const memoizedFetch = useCallback(async () => {
    const res = await getZones();
    if (res.success) {
      return { data: res.data || [], total: res.data?.length || 0 };
    }
    return { data: [], total: 0 };
  }, []);

  const handleSave = async () => {
    if (!name) {
      dispatch(showToast({ message: "El nombre es requerido", type: "error" }));
      return;
    }

    try {
      const res = editingZone
        ? await updateZone(editingZone.id, { name })
        : await createZone({ name });

      if (res.success) {
        dispatch(
          showToast({
            message: `Zona ${editingZone ? "actualizada" : "creada"}`,
            type: "success",
          }),
        );
        setIsModalOpen(false);
        setEditingZone(null);
        setName("");
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

  const confirmDelete = async () => {
    if (!zoneToDelete) return;
    try {
      const res = await deleteZone(zoneToDelete.id);
      if (res.success) {
        dispatch(showToast({ message: "Zona eliminada", type: "success" }));
        setZoneToDelete(null);
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
      key: "name",
      label: "Nombre de la Zona",
      render: (row: Zone) => (
        <span className="font-bold text-slate-800">{row.name}</span>
      ),
    },
    {
      key: "locations",
      label: "Ubicaciones",
      render: (row: Zone) => (
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
      actions: (row: Zone) => (
        <div className="flex items-center gap-1">
          {user?.role !== "OPERATOR" && (
            <>
              <ITButton
                onClick={() => {
                  setEditingZone(row);
                  setName(row.name);
                  setIsModalOpen(true);
                }}
                variant="ghost"
                size="small"
                className="text-slate-400 hover:text-blue-600"
              >
                <FaEdit size={14} />
              </ITButton>
              <ITButton
                onClick={() => setZoneToDelete(row)}
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
              setEditingZone(null);
              setName("");
              setIsModalOpen(true);
            }}
            color="primary"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl h-[42px] px-6 shadow-lg shadow-emerald-100"
          >
            <div className="flex items-center gap-2">
              <FaPlus className="mr-2" /> Nueva Zona
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
        title={editingZone ? "Editar Zona" : "Nueva Zona"}
      >
        <div className="p-6 flex flex-col gap-6">
          <ITInput
            label="Nombre de la Zona"
            value={name}
            onChange={(e) => setName(e.target.value)}
            name="name"
            onBlur={() => {}}
            placeholder="Ej: Zona Norte, Estacionamiento A..."
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
              {editingZone ? "Actualizar" : "Crear"}
            </ITButton>
          </div>
        </div>
      </ITDialog>

      <ITDialog
        isOpen={!!zoneToDelete}
        onClose={() => setZoneToDelete(null)}
        title="Eliminar Zona"
      >
        <div className="p-6 text-center">
          <p className="text-slate-600 mb-6">
            ¿Eliminar zona{" "}
            <span className="font-bold text-slate-800">
              {zoneToDelete?.name}
            </span>
            ?
          </p>
          <div className="flex justify-center gap-3">
            <ITButton
              variant="outlined"
              color="secondary"
              onClick={() => setZoneToDelete(null)}
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
