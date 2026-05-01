import { showToast } from "@app/core/store/toast/toast.slice";
import { FaAddressBook, FaEdit, FaIdCard, FaPhone, FaPlus, FaSync, FaTimes, FaTrash, FaUserShield } from "react-icons/fa";
import { ITButton, ITDataTable, ITDialog, ITInput } from "@axzydev/axzy_ui_system";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { ResidentContactsManager } from "../components/ResidentContactsManager";
import { ResidentForm } from "../components/ResidentForm";
import { ResidentUser, createResident, deleteResident, getPaginatedResidents, updateResident } from "../services/residents.service";
import { useCatalog } from "@app/core/hooks/catalog.hook";

const ResidentsPage = () => {
    const [refreshKey, setRefreshKey] = useState(0);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingResident, setEditingResident] = useState<ResidentUser | null>(null);
    const [residentToDelete, setResidentToDelete] = useState<ResidentUser | null>(null);
    const [viewingIne, setViewingIne] = useState<ResidentUser | null>(null);
    const [managingContacts, setManagingContacts] = useState<ResidentUser | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    
    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setRefreshKey(prev => prev + 1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const externalFilters = useMemo(() => {
        return { search: searchTerm };
    }, [searchTerm]);
    
    const { data: propertiesCatalog, loading: loadingProperties } = useCatalog('property');
    
    const dispatch = useDispatch();

    const memoizedFetch = useCallback((params: any) => {
        return getPaginatedResidents(params);
    }, []);

    const handleCreate = async (data: any) => {
        try {
            const res = await createResident(data);
            if (res.success) {
                dispatch(showToast({ message: "Residente agregado exitosamente", type: "success" }));
                setIsCreateModalOpen(false);
                setRefreshKey(prev => prev + 1);
            } else {
                dispatch(showToast({ message: res.messages?.[0] || "Error al crear", type: "error" }));
            }
        } catch (error: any) {
            dispatch(showToast({ message: error.messages?.[0] || "Error al crear residente", type: "error" }));
        }
    };

    const handleUpdate = async (data: any) => {
        if (!editingResident) return;
        try {
            const res = await updateResident(editingResident.id, data);
            if (res.success) {
                dispatch(showToast({ message: "Residente actualizado", type: "success" }));
                setEditingResident(null);
                setRefreshKey(prev => prev + 1);
            } else {
                dispatch(showToast({ message: res.messages?.[0] || "Error al actualizar", type: "error" }));
            }
        } catch (error: any) {
            dispatch(showToast({ message: error.messages?.[0] || "Error al actualizar residente", type: "error" }));
        }
    };

    const confirmDelete = async () => {
        if (!residentToDelete) return;
        try {
            const res = await deleteResident(residentToDelete.id);
            if (res.success) {
                dispatch(showToast({ message: "Residente eliminado", type: "success" }));
                setResidentToDelete(null);
                setRefreshKey(prev => prev + 1);
            } else {
                dispatch(showToast({ message: res.messages?.[0] || "Error al eliminar", type: "error" }));
            }
        } catch (error: any) {
            dispatch(showToast({ message: error.messages?.[0] || "Error al eliminar residente", type: "error" }));
        }
    };

    const columns = useMemo(() => [
        { 
            key: "name", 
            label: "Residente", 
            type: "string", 
            sortable: true,
            render: (row: ResidentUser) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold border border-slate-200">
                        {row.name.charAt(0)}{row.lastName?.charAt(0) || ''}
                    </div>
                    <div>
                        <div className="font-bold text-slate-800">{row.name} {row.lastName}</div>
                        <div className="text-xs text-slate-500 font-medium">@{row.username}</div>
                    </div>
                </div>
            )
        },
        { 
            key: "propertyId", 
            label: "Propiedad", 
            type: "string", 
            filter: "catalog",
            catalogOptions: {
                data: propertiesCatalog,
                loading: loadingProperties
            },
            render: (row: ResidentUser) => (
                row.property ? (
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-emerald-50 text-emerald-700 font-bold text-xs rounded border border-emerald-100">
                            {row.property.identifier}
                        </span>
                        <span className="text-sm font-medium text-slate-600 truncate max-w-[150px]" title={row.property.name}>
                            {row.property.name}
                        </span>
                    </div>
                ) : (
                    <span className="text-xs italic text-slate-400">Sin Asignar</span>
                )
            )
        },
        { 
            key: "contact", 
            label: "Contacto", 
            type: "string",
            render: (row: ResidentUser) => (
                <div className="text-sm text-slate-600">
                    {row.residentProfile?.phoneNumber ? (
                        <div className="flex items-center gap-1.5 font-medium">
                            <FaPhone className="text-slate-400 text-xs" />
                            {row.residentProfile.phoneNumber}
                        </div>
                    ) : <span className="text-xs text-slate-400 italic">No registrado</span>}
                    {row.residentProfile?.email && <div className="text-xs text-slate-400 mt-0.5">{row.residentProfile.email}</div>}
                </div>
            )
        },
        {
            key: "security",
            label: "Seguridad",
            type: "string",
            render: (row: ResidentUser) => (
                <div className="text-sm text-slate-600">
                    {row.residentProfile?.emergencyPhone ? (
                        <div className="flex items-center gap-1.5 font-medium">
                            <FaPhone className="text-red-400 text-xs" />
                            <span className="text-red-600">{row.residentProfile.emergencyPhone}</span>
                        </div>
                    ) : <span className="text-xs text-slate-400 italic">No registrado</span>}
                    {row.residentProfile?.emergencyContact && <div className="text-xs text-slate-400 mt-0.5 truncate max-w-[140px]" title={row.residentProfile.emergencyContact}>{row.residentProfile.emergencyContact}</div>}
                </div>
            )
        },
        {
            key: "actions",
            label: "Acciones",
            type: "actions",
            actions: (row: ResidentUser) => (
                <div className="flex items-center gap-2">
                    <ITButton 
                        onClick={() => setViewingIne(row)} 
                        size="small" 
                        variant={row.residentProfile?.ineFrontUrl ? "solid" : "outlined"} 
                        className={row.residentProfile?.ineFrontUrl ? "bg-emerald-500 hover:bg-emerald-600 border-none text-white" : "border-slate-300 text-slate-400 hover:text-slate-500 hover:bg-slate-50"}
                        title="Ver Identificación"
                    >
                        <FaIdCard />
                    </ITButton>
                    <ITButton 
                        onClick={() => setManagingContacts(row)} 
                        size="small" 
                        variant="outlined" 
                        className="border-emerald-200 text-emerald-500 hover:bg-emerald-50"
                        title="Agenda de Contactos"
                    >
                        <FaAddressBook />
                    </ITButton>
                    <ITButton onClick={() => setEditingResident(row)} size="small" variant="ghost" className="text-slate-400 hover:text-slate-600">
                        <FaEdit />
                    </ITButton>
                    <ITButton onClick={() => setResidentToDelete(row)} size="small" variant="ghost" className="text-red-300 hover:text-red-500">
                        <FaTrash />
                    </ITButton>
                </div>
            )
        }
    ], [propertiesCatalog, loadingProperties]);

    return (
        <div className="p-6 bg-[#f8fafc] min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <div>
                   <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
                        <FaUserShield className="text-emerald-600" />
                        Directorio de Residentes
                   </h1>
                   <p className="text-slate-500 text-sm mt-1">Gestión de usuarios vecinales, expedientes y controles de acceso</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-64 relative">
                        <ITInput
                            placeholder="Buscar residente..."
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
                        <FaSync className="text-xs text-slate-500" />
                        <span className="text-xs font-bold text-slate-500">Actualizar</span>
                    </ITButton>
                    <button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 h-[42px] rounded-xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 hover:scale-105 transition-all"
                    >
                        <FaPlus className="text-xs" />
                        <span>Alta de Residente</span>
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
                title="Nuevo Residente"
                className="w-[768px] max-w-[95vw]"
            >
                <ResidentForm 
                    onSubmit={handleCreate} 
                    onCancel={() => setIsCreateModalOpen(false)} 
                />
            </ITDialog>

            <ITDialog 
                isOpen={!!editingResident} 
                onClose={() => setEditingResident(null)} 
                title={`Editar Expediente: ${editingResident?.name}`}
                className="w-[768px] max-w-[95vw]"
            >
                <ResidentForm 
                    initialData={editingResident}
                    onSubmit={handleUpdate} 
                    onCancel={() => setEditingResident(null)} 
                />
            </ITDialog>

            <ITDialog 
                isOpen={!!residentToDelete} 
                onClose={() => setResidentToDelete(null)} 
                title="Confirmar Eliminación"
            >
                <div className="p-6">
                    <p className="text-slate-700 mb-6">¿Estás seguro de eliminar el expediente de <span className="font-bold">{residentToDelete?.name} {residentToDelete?.lastName}</span>? Esta acción inhabilitará su acceso a la plataforma.</p>
                    <div className="flex justify-end gap-3">
                        <ITButton variant="outlined" onClick={() => setResidentToDelete(null)}>Cancelar</ITButton>
                        <ITButton className="bg-red-600 text-white border-red-600" onClick={confirmDelete}>Eliminar Expediente</ITButton>
                    </div>
                </div>
            </ITDialog>

            {/* INE Viewer Modal */}
            <ITDialog
                isOpen={!!viewingIne}
                onClose={() => setViewingIne(null)}
                title={`Identificación: ${viewingIne?.name} ${viewingIne?.lastName}`}
                className="max-w-4xl"
            >
                <div className="p-6 bg-slate-50 min-h-[300px]">
                    {viewingIne?.residentProfile?.ineFrontUrl || viewingIne?.residentProfile?.ineBackUrl ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {viewingIne.residentProfile.ineFrontUrl && (
                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 tracking-wider mb-2 uppercase">INE Frontal</h4>
                                    <div className="rounded-xl overflow-hidden shadow border border-slate-200 hover:scale-105 transition-transform duration-300">
                                        <img src={viewingIne.residentProfile.ineFrontUrl} alt="Frente" className="w-full h-auto" />
                                    </div>
                                </div>
                            )}
                            {viewingIne.residentProfile.ineBackUrl && (
                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 tracking-wider mb-2 uppercase">INE Reverso</h4>
                                    <div className="rounded-xl overflow-hidden shadow border border-slate-200 hover:scale-105 transition-transform duration-300">
                                        <img src={viewingIne.residentProfile.ineBackUrl} alt="Reverso" className="w-full h-auto" />
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-12 text-slate-400">
                            <FaIdCard className="text-6xl mb-4 text-slate-200" />
                            <h3 className="text-lg font-medium text-slate-500">Sin identificaciones archivadas</h3>
                            <p className="text-sm">Edita el expediente para subir fotografías del INE.</p>
                        </div>
                    )}
                </div>
                <div className="p-4 bg-white border-t border-slate-100 flex justify-end">
                    <ITButton variant="outlined" color="secondary" onClick={() => setViewingIne(null)}>Cerrar Visor</ITButton>
                </div>
            </ITDialog>

            {/* Contacts Manager Modal */}
            <ResidentContactsManager 
                resident={managingContacts}
                isOpen={!!managingContacts}
                onClose={() => setManagingContacts(null)}
            />

        </div>
    );
};

export default ResidentsPage;
