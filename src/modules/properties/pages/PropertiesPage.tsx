import { showToast } from "@app/core/store/toast/toast.slice";
import { ITBadget, ITButton, ITDataTable, ITDialog, ITInput } from "@axzydev/axzy_ui_system";
import { useCatalog } from "@app/core/hooks/catalog.hook";
import QRCode from "qrcode";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FaBuilding, FaEdit, FaEye, FaHome, FaMapMarkedAlt, FaPlus, FaQrcode, FaSync, FaTimes, FaTrash } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { PropertyForm } from "../components/PropertyForm";
import { createProperty, deleteProperty, getPaginatedProperties, Property, updateProperty } from "../service/properties.service";

const PropertiesPage = () => {
    const [refreshKey, setRefreshKey] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingProperty, setEditingProperty] = useState<Property | null>(null);
    const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);

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
            const qrDataUrl = await QRCode.toDataURL(JSON.stringify({
                id: property.id,
                identifier: property.identifier,
                type: 'PROPERTY'
            }), { width: 300 });

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
        } catch (e) {
            dispatch(showToast({ message: "Error al generar QR", type: "error" }));
        }
    };

    const columns = useMemo(() => [
        { 
            key: "identifier", 
            label: "ID Único", 
            type: "string", 
            sortable: true,
            render: (row: any) => (
                <div className="font-bold text-slate-800 bg-slate-50 px-2 py-1 rounded inline-block">
                    {row.identifier}
                </div>
            )
        },
        { 
            key: "name", 
            label: "Nombre / Referencia", 
            type: "string", 
            sortable: true,
            render: (row: any) => <div className="font-medium text-slate-700">{row.name}</div>
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
                <div className="flex items-center gap-2 text-slate-500 italic">
                    {row.type?.name === 'CASA' ? <FaHome className="text-emerald-500" /> : <FaBuilding className="text-blue-500" />}
                    {row.type?.name || '---'}
                </div>
            )
        },
        { 
            key: "mainStreet", 
            label: "Ubicación", 
            type: "string",
            render: (row: any) => (
                <div className="text-xs text-slate-500">
                    <p className="font-bold">{row.mainStreet}</p>
                    {row.betweenStreets && <p>E/ {row.betweenStreets}</p>}
                </div>
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
                    <ITBadget size="small" variant="filled" color={status.color}>
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
                <div className="flex items-center gap-2">
                    <ITButton 
                        onClick={() => navigate(`/properties/${row.id}`)} 
                        size="small" 
                        variant="outlined" 
                        color="secondary" 
                        title="Ver Detalles"
                    >
                        <FaEye />
                    </ITButton>
                    <ITButton onClick={() => handlePrintQR(row)} size="small" variant="outlined" color="primary" title="Imprimir QR de Ronda">
                        <FaQrcode />
                    </ITButton>
                    <ITButton 
                        onClick={() => {
                            if (row.latitude && row.longitude) {
                                window.open(`https://www.google.com/maps?q=${row.latitude},${row.longitude}`, '_blank');
                            } else {
                                dispatch(showToast({ message: "Propiedad sin coordenadas GPS", type: "warning" }));
                            }
                        }} 
                        size="small" 
                        variant="outlined" 
                        color="secondary" 
                        title="Ver en Google Maps"
                    >
                        <FaMapMarkedAlt />
                    </ITButton>
                    <ITButton onClick={() => setEditingProperty(row)} size="small" variant="ghost" className="text-slate-400 hover:text-slate-600">
                        <FaEdit />
                    </ITButton>
                    <ITButton onClick={() => setPropertyToDelete(row)} size="small" variant="ghost" className="text-red-300 hover:text-red-500">
                        <FaTrash />
                    </ITButton>
                </div>
            )
        }
    ], [propertyTypes, loadingTypes, errorTypes]);

    return (
        <div className="p-6 bg-[#f8fafc] min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <div>
                   <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Propiedades</h1>
                   <p className="text-slate-500 text-sm mt-1">Gestión de casas y departamentos (Catálogo Habitacional)</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-64 relative">
                        <ITInput
                            placeholder="Buscar por ID o nombre..."
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
                        onClick={() => setRefreshKey(prev => prev + 1)}
                        color="secondary"
                        variant="outlined"
                        className="h-[42px] px-3 !rounded-xl border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-2"
                        size="small"
                        title="Actualizar tabla"
                    >
                        <FaSync className={`text-xs text-slate-500`} />
                        <span className="text-xs font-bold text-slate-500">Actualizar</span>
                    </ITButton>
                    <button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 h-[42px] rounded-xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 hover:scale-105 transition-all"
                    >
                        <FaPlus className="text-xs" />
                        <span>Agregar Propiedad</span>
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <ITDataTable
                    key={refreshKey}
                    columns={columns as any}
                    fetchData={memoizedFetch as any}
                    externalFilters={externalFilters}
                    defaultItemsPerPage={10}
                    title=""
                />
            </div>

            {/* Modals */}
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
                title="Confirmar Eliminación"
            >
                <div className="p-6">
                    <p className="text-slate-700 mb-6">¿Estás seguro de eliminar la propiedad <span className="font-bold">{propertyToDelete?.identifier}</span>?</p>
                    <div className="flex justify-end gap-3">
                        <ITButton variant="outlined" onClick={() => setPropertyToDelete(null)}>Cancelar</ITButton>
                        <ITButton className="bg-red-600 text-white" onClick={confirmDelete}>Eliminar</ITButton>
                    </div>
                </div>
            </ITDialog>
        </div>
    );
};

export default PropertiesPage;
