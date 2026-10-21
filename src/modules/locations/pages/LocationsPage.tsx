import { AppState } from "@app/core/store/store";
import { showToast } from "@app/core/store/toast/toast.slice";
import {
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
import QRCode from "qrcode";
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
      const dataUrl = await QRCode.toDataURL(
        JSON.stringify({
          id: location.id,
          type: "LOCATION",
        }),
        { width: 300 },
      );
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
          <style>
            body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; font-family: Arial, sans-serif; }
            .container { text-align: center; border: 2px solid #000; padding: 40px; border-radius: 20px; }
            img { margin-bottom: 20px; }
            h1 { font-size: 32px; margin: 0; }
            p { font-size: 18px; color: #555; }
          </style>
        </head>
        <body>
          <div class="container">
            <img src="${dataUrl}" alt="QR Code" />
            <h1>${location.name}</h1>
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
      iconColor="#065911"
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
            <ITCard className="rounded-3xl" contentClassName="flex flex-col items-center gap-4 p-6!">
              <ITFlex
                align="center"
                justify="center"
                className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/40"
              >
                <ITImage
                  src={qrPreview.dataUrl}
                  alt={`Código QR de ${qrPreview.location.name}`}
                  fit="contain"
                  className="h-48 w-48"
                />
              </ITFlex>
              <ITFlex direction="column" align="center" gap={1}>
                <ITText as="p" className="text-base font-black text-slate-900 dark:text-white">
                  {qrPreview.location.name}
                </ITText>
                <ITText as="p" className="text-xs text-slate-400">
                  Sección {qrPreview.location.aisle} · #{qrPreview.location.spot} · {qrPreview.location.number}
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
