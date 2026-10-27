import { AppState } from "@app/core/store/store";
import { showToast } from "@app/core/store/toast/toast.slice";
import {
  ITBadget,
  ITButton,
  ITCard,
  ITDataTable,
  ITDialog,
  ITFlex,
  ITImage,
  ITInput,
  ITPage,
  ITText,
} from "@axzydev/axzy_ui_system";
import { createBrandedLocationQrDataUrl } from "@core/utils/brandedLocationQr";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FaEdit, FaPlus, FaPrint, FaQrcode, FaSearch, FaSearchLocation, FaSync, FaTimes, FaTrash } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { LocationForm } from "../components/LocationForm";
import { createLocation, deleteLocation, getPaginatedLocations, Location, updateLocation } from "../service/locations.service";

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
  const [locationToDelete, setLocationToDelete] = useState<Location | null>(null);
  const [qrPreview, setQrPreview] = useState<{ location: Location; dataUrl: string } | null>(null);

  const memoizedFetch = useCallback((params: any) => {
    return getPaginatedLocations(params);
  }, []);

  const externalFilters = useMemo(() => {
    return { name: searchTerm };
  }, [searchTerm]);

  const handleCreate = async (data: { aisle: string; spot: string; number: string }) => {
    await createLocation(data);
    setIsModalOpen(false);
    setRefreshKey((prev) => prev + 1);
  };

  const handleEdit = async (data: { aisle: string; spot: string; number: string }) => {
    /* v8 ignore next -- guarda defensiva: el formulario solo existe con una ubicación en edición */
    if (!editingLocation) return;
    const name = `${data.aisle}-${data.spot}-${data.number}`;
    await updateLocation(editingLocation.id, { ...data, name });
    setEditingLocation(null);
    setRefreshKey((prev) => prev + 1);
  };

  const handleDelete = (location: Location) => {
    setLocationToDelete(location);
  };

  const confirmDelete = async () => {
    /* v8 ignore next -- guarda defensiva: el botón solo existe con una ubicación por eliminar */
    if (!locationToDelete) return;
    try {
      const res = await deleteLocation(locationToDelete.id);
      setLocationToDelete(null);
      if (res && res.success) {
        dispatch(showToast({ message: "Ubicación eliminada correctamente", type: "success" }));
        setRefreshKey((prev) => prev + 1);
      } else {
        dispatch(showToast({ message: res?.messages?.join(", ") || "Error al eliminar", type: "error" }));
      }
    } catch (e: any) {
      dispatch(showToast({ message: e.message || "Error al eliminar", type: "error" }));
    }
  };

  const openQr = async (location: Location) => {
    try {
      const dataUrl = await createBrandedLocationQrDataUrl(location.id);
      setQrPreview({ location, dataUrl });
    } catch (error) {
      console.error("Error generating QR", error);
      dispatch(showToast({ message: "Error al generar el código QR", type: "error" }));
    }
  };

  const printQr = () => {
    /* v8 ignore next -- guarda defensiva: el botón Imprimir solo existe con un QR abierto */
    if (!qrPreview) return;
    const { location, dataUrl } = qrPreview;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      dispatch(showToast({ message: "Por favor habilita los pop-ups para imprimir.", type: "warning" }));
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>QR ${location.name}</title>
          <style>
            @page { size: A4; margin: 12mm; }
            * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #F4F9F6; font-family: Arial, sans-serif; }
            .card { width: 92mm; border-radius: 24px; overflow: hidden; background: #fff; box-shadow: 0 18px 50px rgba(15, 23, 42, .16); }
            .head { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 14px 18px; background: #12A36F; color: #fff; }
            .brand { font-size: 18px; font-weight: 900; letter-spacing: -.02em; }
            .tag { padding: 5px 10px; border-radius: 999px; background: rgba(255, 255, 255, .2); font-size: 8px; font-weight: 900; letter-spacing: .09em; }
            .body { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 18px 18px 16px; text-align: center; }
            .qr { display: block; line-height: 0; }
            img { display: block; width: 62mm; height: 62mm; }
            h1 { font-size: 26px; margin: 4px 0 0; color: #0F172A; letter-spacing: -.03em; }
            .pill { padding: 5px 12px; border-radius: 999px; background: #E8F7EF; color: #065911; font-size: 10px; font-weight: 800; }
            .hint { margin: 0; max-width: 62mm; color: #64748B; font-size: 11px; line-height: 1.45; font-weight: 600; }
            .foot { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 10px 18px; border-top: 1px dashed #E6EEE9; color: #94A3B8; font-size: 8px; font-weight: 700; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="head"><span class="brand">CheckApp</span><span class="tag">PUNTO DE ESCANEO</span></div>
            <div class="body">
              <div class="qr"><img src="${dataUrl}" alt="QR ${location.name}" /></div>
              <h1>${location.name}</h1>
              <span class="pill">Sección ${location.aisle} · #${location.spot}</span>
              <p class="hint">Escanea este código para verificar el punto de control.</p>
            </div>
            <div class="foot"><span>CheckApp Security</span><span>powered by axzy.dev</span></div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); }
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const columns = useMemo(
    () => [
      {
        key: "id",
        label: "ID",
        type: "number",
        width: 90,
        sortable: false,
        render: (row: any) => (
          <ITText as="span" className="inline-flex rounded-lg bg-slate-50 px-2 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            {row.id}
          </ITText>
        ),
      },
      {
        key: "name",
        label: "Ubicación",
        type: "string",
        sortable: false,
        render: (row: Location) => (
          <ITText as="span" className="font-bold text-slate-800 dark:text-slate-100">
            {row.name}
          </ITText>
        ),
      },
      {
        key: "aisle",
        label: "Sección",
        type: "string",
        width: 140,
        sortable: false,
        render: (row: any) => (
          <ITText as="span" className="font-medium text-slate-600 dark:text-slate-300">
            {row.aisle}
          </ITText>
        ),
      },
      {
        key: "spot",
        label: "# Consecutivo",
        type: "string",
        width: 150,
        sortable: false,
        render: (row: any) => (
          <ITText as="span" className="text-slate-500 dark:text-slate-400">
            {row.spot}
          </ITText>
        ),
      },
      {
        key: "number",
        label: "Referencia",
        type: "string",
        width: 140,
        sortable: false,
        render: (row: any) => (
          <ITText as="span" className="text-xs italic text-slate-400">
            {row.number}
          </ITText>
        ),
      },
      {
        key: "actions",
        label: "Acciones",
        type: "actions",
        width: 150,
        actions: (row: Location) => (
          <ITFlex align="center" gap={2}>
            <ITButton
              onClick={() => openQr(row)}
              size="md"
              variant="icon-only"
              color="primary"
              icon={<FaQrcode />}
              ariaLabel="Ver código QR"
              title="Ver código QR"
            />
            {user?.role !== "OPERATOR" && (
              <>
                <ITButton
                  onClick={() => setEditingLocation(row)}
                  size="md"
                  variant="icon-only"
                  color="secondary"
                  icon={<FaEdit />}
                  ariaLabel="Editar"
                  title="Editar"
                />
                <ITButton
                  onClick={() => handleDelete(row)}
                  size="md"
                  variant="icon-only"
                  color="danger"
                  icon={<FaTrash />}
                  ariaLabel="Eliminar"
                  title="Eliminar"
                />
              </>
            )}
          </ITFlex>
        ),
      },
    ],
    [user],
  );

  return (
    <ITPage
      className="m-0! mx-auto! max-w-[1600px]! px-6! bg-slate-50"
      noPadding
      title="Ubicaciones"
      breadcrumbs={[{ label: "Inicio", href: "#/home" }, { label: "Operación" }, { label: "Ubicaciones" }]}
      description="Gestión de zonas y puntos de control"
      icon={<FaSearchLocation size={20} />}
      actions={
        <ITFlex align="center" gap={2} wrap="wrap" justify="end" className="w-full justify-end">
          <ITFlex align="center" gap={1} className="w-64 shrink-0">
            <ITInput
              name="search"
              placeholder="Buscar por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onBlur={() => {}}
              iconLeft={<FaSearch />}
              size="md"
            />
            {searchTerm && (
              <ITButton
                variant="icon-only"
                color="secondary"
                size="sm"
                icon={<FaTimes size={12} />}
                ariaLabel="Limpiar búsqueda"
                title="Limpiar búsqueda"
                onClick={() => setSearchTerm("")}
              />
            )}
          </ITFlex>
          <ITButton
            onClick={() => setRefreshKey((prev) => prev + 1)}
            color="secondary"
            size="md"
            variant="icon-only"
            icon={<FaSync />}
            ariaLabel="Actualizar"
            title="Actualizar"
          />
          {user?.role !== "OPERATOR" && (
            <ITButton onClick={() => setIsModalOpen(true)} color="primary" size="md" icon={<FaPlus />}>
              Nueva ubicación
            </ITButton>
          )}
        </ITFlex>
      }
    >
      <ITFlex direction="column" gap={5} className="w-full pb-10 pt-5">
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
          columns={columns as any}
          fetchData={memoizedFetch as any}
          externalFilters={externalFilters}
        />
      </ITFlex>

      <ITDialog isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nueva ubicación" className="max-w-lg w-full">
        <LocationForm onSubmit={handleCreate} onCancel={() => setIsModalOpen(false)} />
      </ITDialog>

      <ITDialog isOpen={!!editingLocation} onClose={() => setEditingLocation(null)} title="Editar ubicación" className="max-w-lg w-full">
        {editingLocation && (
          <LocationForm
            initialData={editingLocation}
            onSubmit={handleEdit}
            onCancel={() => setEditingLocation(null)}
          />
        )}
      </ITDialog>

      <ITDialog
        isOpen={!!qrPreview}
        onClose={() => setQrPreview(null)}
        title="Código QR"
        className="max-w-md w-full"
      >
        {qrPreview && (
          <ITFlex direction="column" gap={4}>
            <ITCard className="overflow-hidden rounded-3xl border-0! shadow-xl!" contentClassName="p-0!">
              <ITFlex align="center" justify="between" gap={2} className="bg-[#2F9E68] px-5 py-4">
                <ITText as="p" className="text-lg font-black text-white">CheckApp</ITText>
                <ITBadget color="secondary" variant="filled" size="sm" className="bg-white/20! text-white!">
                  PUNTO DE ESCANEO
                </ITBadget>
              </ITFlex>

              <ITFlex direction="column" align="center" gap={3} className="px-6 py-6">
                <ITImage
                  src={qrPreview.dataUrl}
                  alt={`Código QR de ${qrPreview.location.name}`}
                  fit="contain"
                  className="h-64 w-64"
                />
                <ITText as="p" className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  {qrPreview.location.name}
                </ITText>
                <ITBadget color="success" variant="filled" size="sm">
                  Sección {qrPreview.location.aisle} · #{qrPreview.location.spot}
                </ITBadget>
                <ITText as="p" className="text-center text-xs text-slate-500">
                  Escanea este código para verificar el punto de control.
                </ITText>
              </ITFlex>

              <ITFlex align="center" justify="between" gap={2} className="border-t border-dashed border-slate-200 px-5 py-3">
                <ITText as="span" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  CheckApp Security
                </ITText>
                <ITText as="span" className="text-[10px] font-semibold text-slate-400">
                  powered by axzy.dev
                </ITText>
              </ITFlex>
            </ITCard>
            <ITFlex justify="end" gap={2}>
              <ITButton variant="outlined" color="secondary" onClick={() => setQrPreview(null)}>
                Cerrar
              </ITButton>
              <ITButton color="primary" icon={<FaPrint />} onClick={printQr}>
                Imprimir
              </ITButton>
            </ITFlex>
          </ITFlex>
        )}
      </ITDialog>

      <ITDialog isOpen={!!locationToDelete} onClose={() => setLocationToDelete(null)} title="Confirmar eliminación">
        <ITFlex direction="column" gap={4}>
          <ITText as="p" className="text-sm text-slate-600 dark:text-slate-300">
            ¿Estás seguro de que deseas eliminar la zona{" "}
            <ITText as="span" className="font-bold text-rose-600">
              {locationToDelete?.name}
            </ITText>
            ? Esta acción no se puede deshacer.
          </ITText>
          <ITFlex justify="end" gap={2}>
            <ITButton variant="outlined" color="secondary" onClick={() => setLocationToDelete(null)}>
              Cancelar
            </ITButton>
            <ITButton color="danger" onClick={confirmDelete}>
              Eliminar
            </ITButton>
          </ITFlex>
        </ITFlex>
      </ITDialog>
    </ITPage>
  );
};

export default LocationsPage;
