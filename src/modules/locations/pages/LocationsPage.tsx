import { AppState } from "@app/core/store/store";
import { showToast } from "@app/core/store/toast/toast.slice";
import {
  ITButton,
  ITDataTable,
  ITDialog,
  ITInput,
} from "@axzydev/axzy_ui_system";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaCar,
  FaEdit,
  FaFilter,
  FaMapMarkerAlt,
  FaPlus,
  FaQrcode,
  FaSearch,
  FaSync,
  FaTimes,
  FaTrash,
} from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { LocationForm } from "../components/LocationForm";
import {
  createLocation,
  deleteLocation,
  getBulkQRPDF,
  getPaginatedLocations,
  Location,
  updateLocation,
} from "../service/locations.service";
import { getZones, Zone } from "../service/zones.service";

const LocationsPage = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Debounce search to trigger refresh
  useEffect(() => {
    const timer = setTimeout(() => {
      setRefreshKey((prev) => prev + 1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const dispatch = useDispatch();
  const user = useSelector((state: AppState) => state.auth);

  /* Filters/Modals State */
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [viewingLocation, setViewingLocation] = useState<Location | null>(null);
  const [locationToDelete, setLocationToDelete] = useState<Location | null>(
    null,
  );

  /* Bulk Print Selection State */
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [locationsToChoose, setLocationsToChoose] = useState<Location[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [allZones, setAllZones] = useState<Zone[]>([]);
  const [bulkFilterZone, setBulkFilterZone] = useState<string>("");
  const [bulkFilterSearch, setBulkFilterSearch] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"SEARCH" | "SELECTED">("SEARCH");
  const [animateBadge, setAnimateBadge] = useState(false);

  // Trigger badge animation when selection count changes
  useEffect(() => {
    if (selectedIds.length > 0) {
      setAnimateBadge(true);
      const timer = setTimeout(() => setAnimateBadge(false), 500);
      return () => clearTimeout(timer);
    }
  }, [selectedIds.length]);

  const memoizedFetch = useCallback((params: any) => {
    return getPaginatedLocations(params);
  }, []);

  const externalFilters = useMemo(() => {
    return { name: searchTerm };
  }, [searchTerm]);

  const handleCreate = async (data: any) => {
    await createLocation(data);
    setIsModalOpen(false);
    setRefreshKey((prev) => prev + 1);
  };

  const handleSaveAndContinue = async (data: any) => {
    await createLocation(data);
    setRefreshKey((prev) => prev + 1);
    dispatch(
      showToast({
        message: "Ubicación guardada, continúa con la siguiente",
        type: "success",
      }),
    );
  };

  const openBulkPrintModal = async () => {
    setIsBulkModalOpen(true);
    // Fetch zones for dropdown
    const zoneRes = await getZones();
    if (zoneRes.success) setAllZones(zoneRes.data || []);

    // Initial fetch of locations
    fetchBulkLocations();
  };

  const fetchBulkLocations = async () => {
    const res = await getPaginatedLocations({
      page: 1,
      limit: 1000,
      filters: {
        name: bulkFilterSearch,
        zoneId: bulkFilterZone ? Number(bulkFilterZone) : undefined,
      },
    });
    if (res.data) {
      setLocationsToChoose(res.data);
    }
  };

  useEffect(() => {
    if (isBulkModalOpen) {
      const timer = setTimeout(() => {
        fetchBulkLocations();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [bulkFilterSearch, bulkFilterZone, isBulkModalOpen]);

  const handleBulkPrintQR = async () => {
    try {
      if (selectedIds.length === 0) {
        dispatch(
          showToast({
            message: "Selecciona al menos una ubicación",
            type: "warning",
          }),
        );
        return;
      }

      dispatch(showToast({ message: "Generando PDF...", type: "info" }));

      const blob = await getBulkQRPDF(selectedIds);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `QRs_${new Date().getTime()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);

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

  const handleEdit = async (data: any) => {
    if (!editingLocation) return;
    await updateLocation(editingLocation.id, data);
    setEditingLocation(null);
    setRefreshKey((prev) => prev + 1);
  };

  const handleDelete = (location: Location) => {
    setLocationToDelete(location);
  };

  const confirmDelete = async () => {
    if (!locationToDelete) return;
    try {
      const res = await deleteLocation(locationToDelete.id);
      setLocationToDelete(null);
      if (res && res.success) {
        dispatch(
          showToast({ message: "Ubicación eliminada", type: "success" }),
        );
        setRefreshKey((prev) => prev + 1);
      }
    } catch (e: any) {
      dispatch(showToast({ message: "Error al eliminar", type: "error" }));
    }
  };

  const handlePrintQR = async (location: Location) => {
    try {
      dispatch(showToast({ message: "Generando QR...", type: "info" }));

      const blob = await getBulkQRPDF([location.id]);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `QR_${location.name}_${new Date().getTime()}.pdf`,
      );
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);

      dispatch(
        showToast({ message: "QR generado correctamente", type: "success" }),
      );
    } catch (error) {
      dispatch(showToast({ message: "Error al generar QR", type: "error" }));
    }
  };

  const columns = useMemo(
    () => [
      {
        key: "id",
        label: "ID",
        type: "number",
        sortable: true,
        render: (row: any) => (
          <div className="font-bold text-slate-800 bg-slate-50 px-2 py-1 rounded inline-block text-xs">
            {row.id}
          </div>
        ),
      },
      {
        key: "name",
        label: "Ubicación",
        type: "string",
        sortable: true,
        render: (row: Location) => (
          <div className="font-bold text-slate-800">{row.name}</div>
        ),
      },
      {
        key: "zone",
        label: "Zona",
        type: "string",
        render: (row: Location) => (
          <div className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded inline-block">
            {row.zone?.name || "N/A"}
          </div>
        ),
      },
      {
        key: "aisle",
        label: "Sección",
        type: "string",
        sortable: true,
        render: (row: any) => (
          <div className="text-slate-600 font-medium">{row.aisle}</div>
        ),
      },
      {
        key: "spot",
        label: "# Consecutivo",
        type: "string",
        sortable: true,
        render: (row: any) => <div className="text-slate-500">{row.spot}</div>,
      },
      {
        key: "number",
        label: "Referencia",
        type: "string",
        sortable: true,
        render: (row: any) => (
          <div className="text-xs text-slate-400 italic">{row.number}</div>
        ),
      },
      {
        key: "actions",
        label: "Acciones",
        type: "actions",
        actions: (row: Location) => (
          <div className="flex items-center gap-2">
            <ITButton
              onClick={() => handlePrintQR(row)}
              size="small"
              variant="outlined"
              color="primary"
              className="!p-2"
              title="Imprimir QR"
            >
              <FaQrcode />
            </ITButton>
            {user?.role !== "OPERATOR" && (
              <>
                <ITButton
                  onClick={() => setEditingLocation(row)}
                  size="small"
                  variant="ghost"
                  className="!p-2 text-slate-400 hover:text-slate-600"
                  title="Editar"
                >
                  <FaEdit />
                </ITButton>
                <ITButton
                  onClick={() => handleDelete(row)}
                  size="small"
                  variant="ghost"
                  className="!p-2 text-red-300 hover:text-red-500"
                  title="Eliminar"
                >
                  <FaTrash />
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
    <div className="p-6 bg-[#f8fafc] min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
            Ubicaciones
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Gestión de zonas y puntos de control
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-64 relative">
            <ITInput
              placeholder="Buscar por nombre..."
              name="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onBlur={() => {}}
              className="!py-2 !h-[42px] !rounded-xl border-slate-100 !pr-10 bg-white"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                title="Limpiar búsqueda"
              >
                <FaTimes size={14} />
              </button>
            )}
          </div>
          <ITButton
            onClick={openBulkPrintModal}
            color="primary"
            variant="outlined"
            className="h-[42px] px-4 !rounded-xl border-emerald-200 text-emerald-600 hover:bg-emerald-50 transition-all flex items-center gap-2"
            size="small"
            title="Imprimir todos los QR filtrados"
          >
            <FaQrcode className="text-xs" />
            <span className="text-xs font-bold">Imprimir QRs</span>
          </ITButton>
          <ITButton
            onClick={() => setRefreshKey((prev) => prev + 1)}
            color="secondary"
            variant="outlined"
            className="h-[42px] px-3 !rounded-xl border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-2"
            size="small"
            title="Actualizar tabla"
          >
            <FaSync className={`text-xs text-slate-500`} />
            <span className="text-xs font-bold text-slate-500">Actualizar</span>
          </ITButton>
          {user?.role !== "OPERATOR" && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 h-[42px] rounded-xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 hover:scale-105 transition-all"
            >
              <FaPlus className="text-xs" />
              <span>Nueva Ubicación</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <ITDataTable
          key={refreshKey}
          columns={columns as any}
          fetchData={memoizedFetch as any}
          externalFilters={externalFilters}
          defaultItemsPerPage={10}
        />
      </div>

      {/* Create Modal */}
      <ITDialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nueva Locación"
        className="max-w-2xl w-full"
      >
        <LocationForm
          onSubmit={handleCreate}
          onSaveAndContinue={handleSaveAndContinue}
          onCancel={() => setIsModalOpen(false)}
        />
      </ITDialog>

      {/* Edit Modal */}
      <ITDialog
        isOpen={!!editingLocation}
        onClose={() => setEditingLocation(null)}
        title="Editar Locación"
      >
        {editingLocation && (
          <LocationForm
            initialData={editingLocation}
            onSubmit={handleEdit}
            onCancel={() => setEditingLocation(null)}
          />
        )}
      </ITDialog>

      {/* View Cars Modal */}
      <ITDialog
        isOpen={!!viewingLocation}
        onClose={() => setViewingLocation(null)}
        title={`Autos en ${viewingLocation?.name}`}
        className="max-w-3xl w-full"
      >
        <div className="p-4">
          {viewingLocation?.entries && viewingLocation.entries.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
              {viewingLocation.entries.map((entry: any) => (
                <div
                  key={entry.id}
                  className="border rounded-lg p-3 flex gap-3 items-center bg-gray-50 border-[#e1e4d5]"
                >
                  <div className="bg-[#f1f6eb] p-2.5 rounded-full text-[#065911]">
                    <FaCar />
                  </div>
                  <div>
                    <p className="font-bold text-[#1b1b1f]">
                      {entry.brand} {entry.model}
                    </p>
                    <p className="text-sm text-[#54634d]">
                      Placas:{" "}
                      <span className="font-mono font-bold">
                        {entry.plates}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500">
                      Color: {entry.color}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500">
              <p>No hay vehículos en esta zona.</p>
            </div>
          )}
          <div className="mt-6 flex justify-end">
            <ITButton
              color="secondary"
              onClick={() => setViewingLocation(null)}
            >
              Cerrar
            </ITButton>
          </div>
        </div>
      </ITDialog>

      {/* Delete Confirmation Modal */}
      <ITDialog
        isOpen={!!locationToDelete}
        onClose={() => setLocationToDelete(null)}
        title="Confirmar Eliminación"
      >
        <div className="p-6">
          <p className="text-[#1b1b1f] text-base mb-6">
            ¿Estás seguro de que deseas eliminar la zona{" "}
            <span className="font-bold text-red-600">
              {locationToDelete?.name}
            </span>
            ? Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end gap-3">
            <ITButton
              variant="outlined"
              color="secondary"
              onClick={() => setLocationToDelete(null)}
            >
              Cancelar
            </ITButton>
            <ITButton
              variant="solid"
              className="bg-red-600 hover:bg-red-700 text-white border-0"
              onClick={confirmDelete}
            >
              Eliminar
            </ITButton>
          </div>
        </div>
      </ITDialog>

      {/* Bulk Print Selection Modal */}
      <ITDialog
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title="Impresión Masiva de QRs"
        className="max-w-4xl w-full"
      >
        <div className="flex flex-col h-[80vh]">
          {/* Tabs */}
          <div className="flex px-6 border-b border-slate-100 bg-white sticky top-0 z-10">
            <button
              onClick={() => setActiveTab("SEARCH")}
              className={`px-6 py-3 text-[11px] font-bold tracking-widest transition-all border-b-2 ${
                activeTab === "SEARCH"
                  ? "border-emerald-500 text-emerald-600"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              BUSCAR Y AGREGAR
            </button>
            <button
              onClick={() => setActiveTab("SELECTED")}
              className={`px-6 py-3 text-[11px] font-bold tracking-widest transition-all border-b-2 flex items-center gap-2 ${
                activeTab === "SELECTED"
                  ? "border-emerald-500 text-emerald-600"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              SELECCIONADOS
              <span
                className={`px-1.5 py-0.5 rounded-full text-[9px] transition-all duration-300 ${
                  animateBadge ? "scale-150 rotate-12" : "scale-100"
                } ${
                  selectedIds.length > 0
                    ? "bg-emerald-100 text-emerald-600"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {selectedIds.length}
              </span>
            </button>
          </div>

          {/* Header Filters - Only visible in SEARCH tab */}
          {activeTab === "SEARCH" && (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <FaFilter className="text-emerald-500" /> RECURRENTE (ZONA)
                </label>
                <select
                  value={bulkFilterZone}
                  onChange={(e) => setBulkFilterZone(e.target.value)}
                  className="w-full h-[42px] px-4 rounded-xl border border-slate-200 bg-white text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                >
                  <option value="">Todas las zonas</option>
                  {allZones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <FaSearch className="text-emerald-500" /> BUSCAR POR NOMBRE
                </label>
                <ITInput
                  placeholder="Filtrar por nombre..."
                  name="bulkSearch"
                  value={bulkFilterSearch}
                  onChange={(e) => setBulkFilterSearch(e.target.value)}
                  onBlur={() => {}}
                  className="!py-2 !h-[42px] !rounded-xl border-slate-200 bg-white"
                />
              </div>
            </div>
          )}

          {/* Locations List */}
          <div className="flex-1 overflow-y-auto p-6 bg-white">
            {activeTab === "SEARCH" ? (
              <>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                  RESULTADOS ({locationsToChoose.length})
                </h3>

                {locationsToChoose.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                    <FaFilter size={48} className="opacity-20" />
                    <p className="text-sm font-bold uppercase tracking-widest">
                      No se encontraron resultados
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {locationsToChoose.map((loc) => (
                      <label
                        key={loc.id}
                        className={`group flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                          selectedIds.includes(loc.id)
                            ? "border-emerald-200 bg-emerald-50/40 shadow-sm shadow-emerald-100"
                            : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                            selectedIds.includes(loc.id)
                              ? "bg-emerald-500 border-emerald-500"
                              : "border-slate-200 bg-white group-hover:border-slate-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(loc.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedIds([...selectedIds, loc.id]);
                              } else {
                                setSelectedIds(
                                  selectedIds.filter((id) => id !== loc.id),
                                );
                              }
                            }}
                            className="hidden"
                          />
                          {selectedIds.includes(loc.id) && (
                            <FaPlus className="text-white text-[10px] rotate-45" />
                          )}
                        </div>

                        <div className="flex items-center gap-3 flex-1">
                          <div
                            className={`p-2.5 rounded-xl ${selectedIds.includes(loc.id) ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"}`}
                          >
                            <FaMapMarkerAlt size={14} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-700">
                              {loc.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                              {loc.zone?.name || "General"} • {loc.aisle}-
                              {loc.spot}
                            </span>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                  UBICACIONES A IMPRIMIR ({selectedIds.length})
                </h3>

                {selectedIds.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                    <FaQrcode size={48} className="opacity-20" />
                    <p className="text-sm font-bold uppercase tracking-widest">
                      Tu lista está vacía
                    </p>
                    <ITButton
                      size="small"
                      variant="ghost"
                      className="text-emerald-600"
                      onClick={() => setActiveTab("SEARCH")}
                    >
                      Ir a buscar ubicaciones
                    </ITButton>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Filter local locationsToChoose or others that are in selectedIds */}
                    {/* Since we might not have the full objects for all selectedIds in locationsToChoose (if filter changed), 
                        we should ideally have a pool of all objects or fetch them. 
                        For now, let's show what we have in locationsToChoose that matches, 
                        but it's better to maintain a 'selectedObjects' pool.
                    */}
                    {/* Improvement: just show the list of IDs if object is missing, but let's try to match from locationsToChoose */}
                    {locationsToChoose
                      .filter((l) => selectedIds.includes(l.id))
                      .map((loc) => (
                        <div
                          key={loc.id}
                          className="flex items-center justify-between p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-600">
                              <FaMapMarkerAlt size={14} />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-700">
                                {loc.name}
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                                {loc.zone?.name || "General"}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              setSelectedIds(
                                selectedIds.filter((id) => id !== loc.id),
                              )
                            }
                            className="text-red-400 hover:text-red-600 p-2"
                          >
                            <FaTimes size={14} />
                          </button>
                        </div>
                      ))}

                    {/* Handle cases where selected ID is not in current search pool */}
                    {selectedIds
                      .filter(
                        (id) => !locationsToChoose.find((l) => l.id === id),
                      )
                      .map((id) => (
                        <div
                          key={id}
                          className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-slate-200 text-slate-400">
                              <FaMapMarkerAlt size={14} />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-400 italic">
                                Ubicación ID: {id}
                              </span>
                              <span className="text-[10px] text-slate-300 font-bold uppercase tracking-tight">
                                (Fuera de vista actual)
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              setSelectedIds(
                                selectedIds.filter((sid) => sid !== id),
                              )
                            }
                            className="text-red-300 hover:text-red-500 p-2"
                          >
                            <FaTimes size={14} />
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Selection Controls & Footer */}
          <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex gap-2">
              {activeTab === "SEARCH" ? (
                <>
                  <ITButton
                    size="small"
                    variant="ghost"
                    onClick={() => {
                      const currentIds = locationsToChoose.map((l) => l.id);
                      setSelectedIds(
                        Array.from(new Set([...selectedIds, ...currentIds])),
                      );
                    }}
                    className="text-emerald-600 font-bold text-[11px] uppercase tracking-wider px-4"
                  >
                    Agregar Resultados Actuales
                  </ITButton>
                  <ITButton
                    size="small"
                    variant="ghost"
                    onClick={() => setSelectedIds([])}
                    className="text-slate-400 font-bold text-[11px] uppercase tracking-wider px-4"
                  >
                    Limpiar Selección
                  </ITButton>
                </>
              ) : (
                <ITButton
                  size="small"
                  variant="ghost"
                  onClick={() => setSelectedIds([])}
                  className="text-red-400 font-bold text-[11px] uppercase tracking-wider px-4"
                >
                  Vaciar Lista
                </ITButton>
              )}
            </div>

            <div className="flex gap-3">
              <ITButton
                variant="outlined"
                color="secondary"
                onClick={() => setIsBulkModalOpen(false)}
                className="!rounded-xl border-slate-200 px-8 text-slate-500 font-bold uppercase text-[11px] tracking-widest h-[42px]"
              >
                {activeTab === "SEARCH" ? "CERRAR" : "VOLVER"}
              </ITButton>

              {activeTab === "SELECTED" && (
                <ITButton
                  onClick={handleBulkPrintQR}
                  className="!rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white border-0 px-8 font-bold uppercase text-[11px] tracking-widest h-[42px] shadow-lg shadow-emerald-100 disabled:opacity-50 disabled:grayscale transition-all"
                  disabled={selectedIds.length === 0}
                >
                  IMPRIMIR {selectedIds.length} QRS
                </ITButton>
              )}

              {activeTab === "SEARCH" && selectedIds.length > 0 && (
                <ITButton
                  onClick={() => setActiveTab("SELECTED")}
                  className="!rounded-xl bg-slate-800 hover:bg-slate-900 text-white border-0 px-8 font-bold uppercase text-[11px] tracking-widest h-[42px] transition-all"
                >
                  REVISAR ({selectedIds.length})
                </ITButton>
              )}
            </div>
          </div>
        </div>
      </ITDialog>
    </div>
  );
};

export default LocationsPage;
