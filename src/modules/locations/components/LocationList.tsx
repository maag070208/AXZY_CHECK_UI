import { ITTripleFilter } from "@app/core/components/ITTripleFilter";
import { AppState } from "@app/core/store/store";
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
  FaEdit,
  FaPlus,
  FaQrcode,
  FaSync,
  FaTimes,
  FaTrash,
} from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";

import {
  createLocation,
  deleteLocation,
  getBulkQRPDF,
  getPaginatedLocations,
  Location,
  updateLocation,
} from "../service/locations.service";
import { BulkPrintModal } from "./BulkPrintModal";
import { LocationForm } from "./LocationForm";

export const LocationList = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: AppState) => state.auth);

  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [locationToDelete, setLocationToDelete] = useState<Location | null>(
    null,
  );
  const [activeFilter, setActiveFilter] = useState<
    "all" | "active" | "inactive"
  >("active");

  // Debounce search like UsersPage
  useEffect(() => {
    const timer = setTimeout(() => {
      setRefreshKey((prev) => prev + 1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, activeFilter]);

  const memoizedFetch = useCallback(
    async (params: any) => {
      const res = await getPaginatedLocations({
        ...params,
        search: searchTerm,
        filters: {
          ...params.filters,
          active: activeFilter,
        },
      });

      if (res.success && res.data) {
        return {
          data: res.data.rows,
          total: res.data.total,
        };
      }

      return { data: [], total: 0 };
    },
    [searchTerm, activeFilter],
  );

  const handleCreate = async (data: any) => {
    try {
      const res = await createLocation(data);
      if (res.success) {
        setIsModalOpen(false);
        setRefreshKey((prev) => prev + 1);
        dispatch(
          showToast({
            message: "Ubicación creada correctamente",
            type: "success",
          }),
        );
      }
    } catch (error) {
      const result = error as TResult<void>;
      dispatch(
        showToast({ message: result.error || "Error al crear", type: "error" }),
      );
    }
  };

  const handleSaveAndNew = async (data: any) => {
    try {
      const res = await createLocation(data);
      if (res.success) {
        setRefreshKey((prev) => prev + 1);
        dispatch(
          showToast({
            message: "Ubicación creada correctamente",
            type: "success",
          }),
        );
      }
    } catch (error) {
      const result = error as TResult<void>;
      dispatch(
        showToast({ message: result.error || "Error al crear", type: "error" }),
      );
    }
  };

  const handleEdit = async (data: any) => {
    if (!editingLocation) return;
    try {
      const res = await updateLocation(editingLocation.id, data);
      if (res.success) {
        setEditingLocation(null);
        setRefreshKey((prev) => prev + 1);
        dispatch(
          showToast({ message: "Ubicación actualizada", type: "success" }),
        );
      }
    } catch (error) {
      const result = error as TResult<void>;
      dispatch(
        showToast({
          message: result.error || "Error al actualizar",
          type: "error",
        }),
      );
    }
  };

  const confirmDelete = async () => {
    if (!locationToDelete) return;
    try {
      const res = await deleteLocation(locationToDelete.id);
      if (res.success) {
        setLocationToDelete(null);
        setRefreshKey((prev) => prev + 1);
        dispatch(
          showToast({ message: "Ubicación eliminada", type: "success" }),
        );
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

  const handlePrintQR = async (location: Location) => {
    try {
      dispatch(showToast({ message: "Generando QR...", type: "info" }));
      const blob = await getBulkQRPDF([location.id]);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `QR_${location.name}_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      dispatch(
        showToast({ message: "QR generado correctamente", type: "success" }),
      );
    } catch (error) {
      dispatch(showToast({ message: "Error al generar QR", type: "error" }));
    }
  };

  const handleBulkPrint = async (ids: string[]) => {
    try {
      dispatch(
        showToast({ message: "Generando impresión masiva...", type: "info" }),
      );
      const blob = await getBulkQRPDF(ids);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Bulk_QRs_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setIsBulkModalOpen(false);
      dispatch(
        showToast({ message: "PDF generado correctamente", type: "success" }),
      );
    } catch (error) {
      dispatch(
        showToast({ message: "Error al generar impresión", type: "error" }),
      );
    }
  };

  const columns = useMemo(
    () => [
      {
        key: "fullName",
        label: "Nombre",
        sortable: true,
        render: (row: Location) => {
          console.log(row);
          return (
            <span className="font-bold text-slate-800">{row.fullName}</span>
          );
        },
      },
      {
        key: "name",
        label: "Ubicación",
        sortable: true,
        render: (row: Location) => (
          <span className="text-slate-600">{row.name || "Sin nombre"}</span>
        ),
      },
      {
        key: "zone",
        label: "Zona",
        render: (row: Location) => (
          <ITBadget label={row.zone?.name || "N/A"} color="success" />
        ),
      },
      {
        key: "recurring",
        label: "Recurrente",
        render: (row: Location) => (
          <ITBadget
            label={row.recurringConfiguration?.title || "Sin Asignar"}
            color="primary"
          />
        ),
      },
      {
        key: "status",
        label: "Estado",
        render: (row: Location) => (
          <ITBadget
            label={row.active ? "ACTIVO" : "INACTIVO"}
            color={row.active ? "success" : "warning"}
          />
        ),
      },
      {
        key: "actions",
        label: "Acciones",
        type: "actions",
        actions: (row: Location) => (
          <div className="flex items-center gap-1">
            <ITButton
              onClick={() => handlePrintQR(row)}
              size="small"
              variant="ghost"
              className="text-slate-400 hover:text-emerald-600"
              title="Imprimir QR"
            >
              <FaQrcode size={14} />
            </ITButton>
            {user?.role !== "OPERATOR" && (
              <>
                <ITButton
                  onClick={() => setEditingLocation(row)}
                  size="small"
                  variant="ghost"
                  className="text-slate-400 hover:text-blue-600"
                  title="Editar"
                >
                  <FaEdit size={14} />
                </ITButton>
                <ITButton
                  onClick={() => setLocationToDelete(row)}
                  size="small"
                  variant="ghost"
                  className="text-slate-400 hover:text-red-600"
                  title="Eliminar"
                >
                  <FaTrash size={14} />
                </ITButton>
              </>
            )}
          </div>
        ),
      },
    ],
    [user],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="w-full md:w-64 relative">
          <ITInput
            placeholder="Buscar ubicación..."
            name="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onBlur={() => {}}
            className="!py-2 !h-[42px] !rounded-xl !pr-10 bg-slate-50 border-transparent focus:bg-white"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
            >
              <FaTimes size={14} />
            </button>
          )}
        </div>
        <div className="flex-1 md:flex-none">
          <ITTripleFilter
            value={activeFilter}
            onChange={setActiveFilter}
            options={[
              { label: "Todos", value: "all" },
              { label: "Activos", value: "active" },
              { label: "Inactivos", value: "inactive" },
            ]}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <ITButton
            onClick={() => setIsBulkModalOpen(true)}
            variant="outlined"
            color="primary"
            className="h-[42px] !rounded-xl flex-1 md:flex-none border-emerald-200 text-emerald-600"
          >
            <div className="flex items-center gap-2">
              <FaQrcode className="mr-2" /> QR Masivo
            </div>
          </ITButton>
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
              onClick={() => setIsModalOpen(true)}
              color="primary"
              className="h-[42px] !rounded-xl px-6 bg-emerald-600 shadow-lg shadow-emerald-100"
            >
              <div className="flex items-center gap-2">
                <FaPlus className="mr-2" /> Nuevo
              </div>
            </ITButton>
          )}
        </div>
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
        title="Nueva Ubicación"
      >
        <LocationForm
          onSubmit={handleCreate}
          onCancel={() => setIsModalOpen(false)}
          onSaveAndNew={handleSaveAndNew}
        />
      </ITDialog>

      <ITDialog
        isOpen={!!editingLocation}
        onClose={() => setEditingLocation(null)}
        title="Editar Ubicación"
      >
        {editingLocation && (
          <LocationForm
            initialData={editingLocation}
            onSubmit={handleEdit}
            onCancel={() => setEditingLocation(null)}
          />
        )}
      </ITDialog>

      <ITDialog
        isOpen={!!locationToDelete}
        onClose={() => setLocationToDelete(null)}
        title="Confirmar Eliminación"
      >
        <div className="p-6 text-center">
          <p className="text-slate-600 mb-6">
            ¿Estás seguro de eliminar{" "}
            <span className="font-bold text-slate-800">
              {locationToDelete?.name}
            </span>
            ?
          </p>
          <div className="flex justify-center gap-3">
            <ITButton
              variant="outlined"
              color="secondary"
              onClick={() => setLocationToDelete(null)}
            >
              Cancelar
            </ITButton>
            <ITButton color="danger" onClick={confirmDelete}>
              Eliminar
            </ITButton>
          </div>
        </div>
      </ITDialog>

      <BulkPrintModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onConfirm={handleBulkPrint}
      />
    </div>
  );
};
