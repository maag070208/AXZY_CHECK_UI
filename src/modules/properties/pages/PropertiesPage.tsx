import { showToast } from "@app/core/store/toast/toast.slice";
import { createBrandedQrDataUrl } from "@core/utils/brandedLocationQr";
import {
  ITBadget,
  ITButton,
  ITDataTable,
  ITDialog,
  ITFlex,
  ITInput,
  ITPage,
  ITSegmentedControl,
  ITText,
} from "@axzydev/axzy_ui_system";
import { useCatalog } from "@app/core/hooks/catalog.hook";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FaBuilding, FaEdit, FaEye, FaHome, FaMapMarkedAlt, FaPlus, FaQrcode, FaSearch, FaSync, FaTimes, FaTrash } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { PropertyForm } from "../components/PropertyForm";
import { OccupancyDashboard } from "../occupancy/OccupancyDashboard";
import { ImportPropertiesModal } from "../occupancy/ImportPropertiesModal";
import { createProperty, deleteProperty, getPaginatedProperties, Property, updateProperty } from "../service/properties.service";

const PropertiesPage = () => {
    const [refreshKey, setRefreshKey] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [editingProperty, setEditingProperty] = useState<Property | null>(null);
    const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);
    const [view, setView] = useState<"summary" | "properties">("summary");

    const { data: propertyTypes, loading: loadingTypes, error: errorTypes } = useCatalog('property_type');

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setRefreshKey(prev => prev + 1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const memoizedFetch = useCallback((params: any) => {
        return getPaginatedProperties(params);
    }, []);

    const externalFilters = useMemo(() => {
        return { identifier: searchTerm };
    }, [searchTerm]);

    const handleCreate = async (data: any) => {
        try {
            const res = await createProperty(data);
            if (res.success) {
                dispatch(showToast({ message: "Propiedad creada exitosamente", type: "success" }));
                setIsCreateModalOpen(false);
                setRefreshKey(prev => prev + 1);
            } else {
                dispatch(showToast({ message: res.messages?.[0] || "Error al crear", type: "error" }));
            }
        } catch (error: any) {
            dispatch(showToast({ message: error.messages?.[0] || "Error al crear propiedad", type: "error" }));
        }
    };

    const handleUpdate = async (data: any) => {
        if (!editingProperty) return;
        try {
            const res = await updateProperty(editingProperty.id, data);
            if (res.success) {
                dispatch(showToast({ message: "Propiedad actualizada", type: "success" }));
                setEditingProperty(null);
                setRefreshKey(prev => prev + 1);
            } else {
                dispatch(showToast({ message: res.messages?.[0] || "Error al actualizar", type: "error" }));
            }
        } catch (error: any) {
            dispatch(showToast({ message: error.messages?.[0] || "Error al actualizar propiedad", type: "error" }));
        }
    };

    const confirmDelete = async () => {
        if (!propertyToDelete) return;
        try {
            const res = await deleteProperty(propertyToDelete.id);
            if (res.success) {
                dispatch(showToast({ message: "Propiedad eliminada", type: "success" }));
                setPropertyToDelete(null);
                setRefreshKey(prev => prev + 1);
            } else {
                dispatch(showToast({ message: res.messages?.[0] || "Error al eliminar", type: "error" }));
            }
        } catch (error: any) {
            dispatch(showToast({ message: error.messages?.[0] || "Error al eliminar propiedad", type: "error" }));
        }
    };

    const handlePrintQR = async (property: Property) => {
        try {
            const qrDataUrl = await createBrandedQrDataUrl(JSON.stringify({
                id: property.id,
                identifier: property.identifier,
                type: 'PROPERTY'
            }), 300);

            const printWindow = window.open('', '_blank');
            if (!printWindow) {
                dispatch(showToast({ message: "Pop-ups bloqueados", type: "warning" }));
                return;
            }

            printWindow.document.write(`
                <html>
                    <head>
                        <style>
                            body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; font-family: sans-serif; }
                            .card { border: 2px solid #10b981; padding: 40px; border-radius: 24px; text-align: center; }
                            img { margin-bottom: 20px; }
                            h1 { font-size: 36px; color: #064e3b; margin: 5px 0; }
                            p { color: #6b7280; font-size: 18px; }
                        </style>
                    </head>
                    <body>
                        <div class="card">
                            <img src="${qrDataUrl}" alt="QR" />
                            <h1>${property.identifier}</h1>
                            <p>${property.name}</p>
                        </div>
                        <script>window.onload = () => { window.print(); window.close(); }</script>
                    </body>
                </html>
            `);
            printWindow.document.close();
        } catch {
            dispatch(showToast({ message: "Error al generar QR", type: "error" }));
        }
    };

    const columns = useMemo(() => [
        {
            key: "identifier",
            label: "ID Único",
            type: "string",
            sortable: false,
            render: (row: any) => (
                <ITFlex direction="column" className="font-bold text-slate-800 bg-slate-50 px-2 py-1 rounded inline-block">
                    {row.identifier}
                </ITFlex>
            )
        },
        {
            key: "name",
            label: "Nombre / Referencia",
            type: "string",
            sortable: false,
            render: (row: any) => <ITFlex direction="column" className="font-medium text-slate-700">{row.name}</ITFlex>
        },
        {
            key: "typeId",
            label: "Tipo",
            type: "catalog",
            filter: 'catalog',
            catalogOptions: {
                data: propertyTypes,
                loading: loadingTypes,
                error: !!errorTypes
            },
            render: (row: any) => (
                <ITFlex align="center" gap={2} className="flex items-center gap-2 text-slate-500 italic">
                    {row.type?.name === 'CASA' ? <FaHome className="text-emerald-500" /> : <FaBuilding className="text-blue-500" />}
                    {row.type?.name || '---'}
                </ITFlex>
            )
        },
        {
            key: "mainStreet",
            label: "Ubicación",
            type: "string",
            render: (row: any) => (
                <ITFlex direction="column" className="text-xs text-slate-500">
                    <ITText as="p" className="font-bold">{row.mainStreet}</ITText>
                    {row.betweenStreets && <ITText as="p">E/ {row.betweenStreets}</ITText>}
                </ITFlex>
            )
        },
        {
            key: "status",
            label: "Estado",
            type: "string",
            render: (row: any) => {
                const statusMap: any = {
                    'VACNT': { label: 'NO HABITADA', color: 'secondary' },
                    'HABIT': { label: 'HABITADA', color: 'success' },
                    'RENT': { label: 'EN RENTA', color: 'primary' }
                };
                const status = statusMap[row.status?.name || 'VACNT'] || { label: 'DESCONOCIDO', color: 'secondary' };
                return (
                    <ITBadget size="sm" variant="filled" color={status.color}>
                        {status.label}
                    </ITBadget>
                );
            }
        },
        {
            key: "actions",
            label: "Acciones",
            type: "actions",
            actions: (row: any) => (
                <ITFlex align="center" gap={2}>
                    <ITButton
                        onClick={() => navigate(`/properties/${row.id}`)}
                        size="md"
                        variant="icon-only"
                        color="secondary"
                        icon={<FaEye />}
                        ariaLabel="Ver detalles"
                        title="Ver detalles"
                    />
                    <ITButton
                        onClick={() => handlePrintQR(row)}
                        size="md"
                        variant="icon-only"
                        color="primary"
                        icon={<FaQrcode />}
                        ariaLabel="Imprimir QR"
                        title="Imprimir QR"
                    />
                    <ITButton
                        onClick={() => {
                            if (row.latitude && row.longitude) {
                                window.open(`https://www.google.com/maps?q=${row.latitude},${row.longitude}`, '_blank');
                            } else {
                                dispatch(showToast({ message: "Propiedad sin coordenadas GPS", type: "warning" }));
                            }
                        }}
                        size="md"
                        variant="icon-only"
                        color="secondary"
                        icon={<FaMapMarkedAlt />}
                        ariaLabel="Ver en Google Maps"
                        title="Ver en Google Maps"
                    />
                    <ITButton
                        onClick={() => setEditingProperty(row)}
                        size="md"
                        variant="icon-only"
                        color="secondary"
                        icon={<FaEdit />}
                        ariaLabel="Editar"
                        title="Editar"
                    />
                    <ITButton
                        onClick={() => setPropertyToDelete(row)}
                        size="md"
                        variant="icon-only"
                        color="danger"
                        icon={<FaTrash />}
                        ariaLabel="Eliminar"
                        title="Eliminar"
                    />
                </ITFlex>
            )
        }
    ], [propertyTypes, loadingTypes, errorTypes]);

    return (
        <ITPage
            className="m-0! mx-auto! max-w-[1600px]! px-6! bg-slate-50"
            noPadding
            title="Propiedades"
            breadcrumbs={[{ label: "Inicio", href: "#/home" }, { label: "Propiedades" }]}
            description="Gestión de casas y departamentos (Catálogo Habitacional)"
            icon={<FaHome size={20} />}
            actions={
                <ITFlex align="center" gap={2} wrap="wrap" justify="end" className="w-full justify-end">
                    <ITFlex align="center" gap={1} className="w-64 shrink-0">
                        <ITInput
                            placeholder="Buscar por ID o nombre..."
                            name="search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onBlur={() => { }}
                            iconLeft={<FaSearch />}
                            size="md"
                        />
                        {searchTerm && (
                            <ITButton
                                variant="icon-only"
                                color="secondary"
                                size="sm"
                                onClick={() => setSearchTerm("")}
                                icon={<FaTimes size={12} />}
                                ariaLabel="Limpiar búsqueda"
                                title="Limpiar búsqueda"
                            />
                        )}
                    </ITFlex>
                    <ITButton
                        onClick={() => setRefreshKey(prev => prev + 1)}
                        color="secondary"
                        variant="icon-only"
                        size="md"
                        icon={<FaSync />}
                        ariaLabel="Actualizar tabla"
                        title="Actualizar tabla"
                    />
                    <ITButton variant="outlined" color="secondary" size="md" onClick={() => setIsImportOpen(true)}>
                        Importar CSV
                    </ITButton>
                    <ITButton onClick={() => setIsCreateModalOpen(true)} color="primary" size="md" icon={<FaPlus />}>
                        Agregar propiedad
                    </ITButton>
                </ITFlex>
            }
        >

            <ITFlex direction="column" gap={5} className="w-full pb-10 pt-5">
                <ITFlex align="center" justify="between" gap={3} wrap="wrap">
                    <ITSegmentedControl
                        size="sm"
                        options={[
                            { value: "summary", label: "Resumen" },
                            { value: "properties", label: "Propiedades" },
                        ]}
                        value={view}
                        onChange={(value) => setView(value as "summary" | "properties")}
                    />
                    <ITText as="span" className="text-[10px] font-semibold text-slate-500">
                        {view === "summary"
                            ? "Vista general de ocupación y estado del catálogo habitacional."
                            : "Listado completo de casas y departamentos."}
                    </ITText>
                </ITFlex>

                {view === "summary" ? (
                    <OccupancyDashboard key={refreshKey} />
                ) : (
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
                        title=""
                    />
                )}
            </ITFlex>

            {/* Modals */}
            <ImportPropertiesModal
                isOpen={isImportOpen}
                onClose={() => setIsImportOpen(false)}
                onDone={() => setRefreshKey((prev) => prev + 1)}
            />

            <ITDialog
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Nueva Propiedad"
                className="max-w-2xl"
            >
                <PropertyForm
                    onSubmit={handleCreate}
                    onCancel={() => setIsCreateModalOpen(false)}
                />
            </ITDialog>

            <ITDialog
                isOpen={!!editingProperty}
                onClose={() => setEditingProperty(null)}
                title="Editar Propiedad"
                className="max-w-2xl"
            >
                <PropertyForm
                    initialData={editingProperty}
                    onSubmit={handleUpdate}
                    onCancel={() => setEditingProperty(null)}
                />
            </ITDialog>

            <ITDialog
                isOpen={!!propertyToDelete}
                onClose={() => setPropertyToDelete(null)}
                title="Eliminar propiedad"
            >
                <ITFlex direction="column" gap={4}>
                    <ITText as="p" className="text-sm text-slate-600 dark:text-slate-300">
                        ¿Estás seguro de eliminar la propiedad{" "}
                        <ITText as="span" className="font-bold">{propertyToDelete?.identifier}</ITText>?
                    </ITText>
                    <ITFlex justify="end" gap={2}>
                        <ITButton variant="outlined" color="secondary" onClick={() => setPropertyToDelete(null)}>
                            Cancelar
                        </ITButton>
                        <ITButton color="danger" onClick={confirmDelete}>
                            Eliminar propiedad
                        </ITButton>
                    </ITFlex>
                </ITFlex>
            </ITDialog>
        </ITPage>
    );
};

export default PropertiesPage;