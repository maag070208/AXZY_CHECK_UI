import {
  ITButton,
  ITDataTable,
  ITDialog,
  ITInput,
} from "@axzydev/axzy_ui_system";
import { useCallback, useState } from "react";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import {
  getZones,
  createZone,
  updateZone,
  deleteZone,
  Zone,
} from "../service/zones.service";
import { useDispatch } from "react-redux";
import { showToast } from "@app/core/store/toast/toast.slice";

const ZonesPage = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [name, setName] = useState("");
  const dispatch = useDispatch();

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
    const res = editingZone
      ? await updateZone(editingZone.id, { name })
      : await createZone({ name });

    if (res.success) {
      dispatch(
        showToast({
          message: `Zona ${editingZone ? "actualizada" : "creada"} correctamente`,
          type: "success",
        }),
      );
      setIsModalOpen(false);
      setEditingZone(null);
      setName("");
      setRefreshKey((prev) => prev + 1);
    } else {
      dispatch(
        showToast({
          message: res.error || "Error al guardar zona",
          type: "error",
        }),
      );
    }
  };

  const columns = [
    {
      key: "id",
      label: "ID",
      render: (row: Zone) => (
        <span className="font-bold text-slate-500">#{row.id}</span>
      ),
    },
    {
      key: "name",
      label: "Nombre",
      render: (row: Zone) => (
        <span className="font-bold text-slate-800">{row.name}</span>
      ),
    },
    {
      key: "locations",
      label: "Ubicaciones",
      render: (row: Zone) => (
        <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full text-xs font-bold">
          {row._count?.locations || 0} ubicaciones
        </span>
      ),
    },
    {
      key: "actions",
      label: "Acciones",
      render: (row: Zone) => (
        <div className="flex items-center gap-2">
          <ITButton
            onClick={() => {
              setEditingZone(row);
              setName(row.name);
              setIsModalOpen(true);
            }}
            variant="ghost"
            size="small"
            className="text-slate-400 hover:text-slate-600"
          >
            <FaEdit />
          </ITButton>
          <ITButton
            onClick={async () => {
              if (window.confirm("¿Estás seguro?")) {
                const res = await deleteZone(row.id);
                if (res.success) {
                  dispatch(
                    showToast({ message: "Zona eliminada", type: "success" }),
                  );
                  setRefreshKey((prev) => prev + 1);
                }
              }
            }}
            variant="ghost"
            size="small"
            className="text-red-300 hover:text-red-500"
          >
            <FaTrash />
          </ITButton>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 bg-[#f8fafc] min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
            Zonas
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Gestión de áreas para ubicaciones
          </p>
        </div>
        <ITButton
          onClick={() => {
            setEditingZone(null);
            setName("");
            setIsModalOpen(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl h-[42px] px-6 shadow-lg shadow-emerald-100 transition-all flex items-center gap-2"
        >
          <FaPlus className="text-xs" />
          <span>Nueva Zona</span>
        </ITButton>
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
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
            <ITButton
              variant="outlined"
              color="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </ITButton>
            <ITButton
              onClick={handleSave}
              className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 px-8"
            >
              {editingZone ? "Actualizar" : "Crear"}
            </ITButton>
          </div>
        </div>
      </ITDialog>
    </div>
  );
};

export default ZonesPage;
