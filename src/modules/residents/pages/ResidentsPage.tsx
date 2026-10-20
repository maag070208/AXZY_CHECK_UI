import { showToast } from "@app/core/store/toast/toast.slice";
import { FaAddressBook, FaEdit, FaIdCard, FaPhone, FaPlus, FaSync, FaTimes, FaTrash, FaUserShield } from "react-icons/fa";
import { ITButton, ITDataTable, ITDialog, ITFlex, ITInput, ITPage, ITText } from "@axzydev/axzy_ui_system";
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
                <ITFlex align="center" gap={3} className="flex items-center gap-3">
                    <ITFlex align="center" justify="center" className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold border border-slate-200">
                        {row.name.charAt(0)}{row.lastName?.charAt(0) || ''}
                    </ITFlex>
                    <ITFlex direction="column">
                        <ITFlex direction="column" className="font-bold text-slate-800">{row.name} {row.lastName}</ITFlex>
                        <ITFlex direction="column" className="text-xs text-slate-500 font-medium">@{row.username}</ITFlex>
                    </ITFlex>
                </ITFlex>
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
                    <ITFlex align="center" gap={2} className="flex items-center gap-2">
                        <ITText as="span" className="px-2 py-1 bg-emerald-50 text-emerald-700 font-bold text-xs rounded border border-emerald-100">
                            {row.property.identifier}
                        </ITText>
                        <span className="text-sm font-medium text-slate-600 truncate max-w-[150px]" title={row.property.name}>
                            {row.property.name}
                        </span>
                    </ITFlex>
                ) : (
                    <ITText as="span" className="text-xs italic text-slate-400">Sin Asignar</ITText>
                )
            )
        },
        { 
            key: "contact", 
            label: "Contacto", 
            type: "string",
            render: (row: ResidentUser) => (
                <ITFlex direction="column" className="text-sm text-slate-600">
                    {row.residentProfile?.phoneNumber ? (
                        <ITFlex align="center" className="flex items-center gap-1.5 font-medium">
                            <FaPhone className="text-slate-400 text-xs" />
                            {row.residentProfile.phoneNumber}
                        </ITFlex>
                    ) : <ITText as="span" className="text-xs text-slate-400 italic">No registrado</ITText>}
                    {row.residentProfile?.email && <ITFlex direction="column" className="text-xs text-slate-400 mt-0.5">{row.residentProfile.email}</ITFlex>}
                </ITFlex>
            )
        },
        {
            key: "security",
            label: "Seguridad",
            type: "string",
            render: (row: ResidentUser) => (
                <ITFlex direction="column" className="text-sm text-slate-600">
                    {row.residentProfile?.emergencyPhone ? (
                        <ITFlex align="center" className="flex items-center gap-1.5 font-medium">
                            <FaPhone className="text-red-400 text-xs" />
                            <ITText as="span" className="text-red-600">{row.residentProfile.emergencyPhone}</ITText>
                        </ITFlex>
                    ) : <ITText as="span" className="text-xs text-slate-400 italic">No registrado</ITText>}
                    {row.residentProfile?.emergencyContact && <div className="text-xs text-slate-400 mt-0.5 truncate max-w-[140px]" title={row.residentProfile.emergencyContact}>{row.residentProfile.emergencyContact}</div>}
                </ITFlex>
            )
        },
        {
            key: "actions",
            label: "Acciones",
            type: "actions",
            actions: (row: ResidentUser) => (
                <ITFlex align="center" gap={2} className="flex items-center gap-2">
                    <ITButton 
                        onClick={() => setViewingIne(row)} 
                        size="sm" 
                        variant={row.residentProfile?.ineFrontUrl ? "solid" : "outlined"} 
                       
                        title="Ver Identificación"
                    >
                        <FaIdCard />
                    </ITButton>
                    <ITButton 
                        onClick={() => setManagingContacts(row)} 
                        size="sm" 
                        variant="outlined" 
                       
                        title="Agenda de Contactos"
                    >
                        <FaAddressBook />
                    </ITButton>
                    <ITButton onClick={() => setEditingResident(row)} size="sm" variant="ghost">
                        <FaEdit />
                    </ITButton>
                    <ITButton onClick={() => setResidentToDelete(row)} size="sm" variant="ghost">
                        <FaTrash />
                    </ITButton>
                </ITFlex>
            )
        }
    ], [propertiesCatalog, loadingProperties]);

    return (
        <ITPage
      className="m-0! px-4! max-w-screen!"
      noPadding
      title="Directorio de Residentes"
      breadcrumbs={[{ label: "Inicio", href: "#/home" }, { label: "Directorio de Residentes" }]}
      description="Gestión de usuarios vecinales, expedientes y controles de acceso"
      icon={<FaUserShield size={20} />}
      iconColor="#065911"
      actions={
<ITFlex align="center" gap={3} className="flex items-center gap-3">
                    <ITFlex direction="column" className="w-64 relative">
                        <ITInput
                            placeholder="Buscar residente..."
                            name="search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onBlur={() => {}}
                            className="!py-2 !h-[42px] !rounded-xl border-slate-100 !pr-10 bg-white"
                        />
                        {searchTerm && (
                            <ITButton
                                variant="icon-only"
                                color="gray"
                                size="sm"
                                onClick={() => setSearchTerm("")}
                                icon={<FaTimes size={14} />}
                                title="Limpiar búsqueda"
                               
                            />
                        )}
                    </ITFlex>
                    <ITButton
                        onClick={() => setRefreshKey(prev => prev + 1)}
                        color="secondary"
                        variant="outlined"
                       
                        size="md"
                        title="Actualizar tabla"
                    >
                        <ITFlex align="center" gap={2}><FaSync className="text-xs text-slate-500" />
                        <ITText as="span" className="text-xs font-bold text-slate-500">Actualizar</ITText></ITFlex>
                    </ITButton>
                    <ITButton
                        onClick={() => setIsCreateModalOpen(true)}
                        color="primary"
                        size="md"
                       
                    >
                        <ITFlex align="center" gap={2}><FaPlus className="text-xs" />
                        <ITText as="span">Alta de Residente</ITText></ITFlex>
                    </ITButton>
                </ITFlex>
      }
    >

            <ITFlex direction="column" className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <ITDataTable
                  defaultItemsPerPage={50}
                  itemsPerPageOptions={[25, 50, 100]}
                  layout="fixed"
                  density="compact"
                  virtualized
                  virtualizedMaxHeight={400}
                  rowHeight={50}
                    key={refreshKey}
                    columns={columns as any}
                    fetchData={memoizedFetch as any}
                    externalFilters={externalFilters}
                    title=""
                />
            </ITFlex>

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
                <ITFlex direction="column" className="p-6">
                    <ITText as="p" className="text-slate-700 mb-6">¿Estás seguro de eliminar el expediente de <ITText as="span" className="font-bold">{residentToDelete?.name} {residentToDelete?.lastName}</ITText>? Esta acción inhabilitará su acceso a la plataforma.</ITText>
                    <ITFlex justify="end" gap={3} className="flex justify-end gap-3">
                        <ITButton variant="outlined" onClick={() => setResidentToDelete(null)}>Cancelar</ITButton>
                        <ITButton onClick={confirmDelete}>Eliminar Expediente</ITButton>
                    </ITFlex>
                </ITFlex>
            </ITDialog>

            {/* INE Viewer Modal */}
            <ITDialog
                isOpen={!!viewingIne}
                onClose={() => setViewingIne(null)}
                title={`Identificación: ${viewingIne?.name} ${viewingIne?.lastName}`}
                className="max-w-4xl"
            >
                <ITFlex direction="column" className="p-6 bg-slate-50 min-h-[300px]">
                    {viewingIne?.residentProfile?.ineFrontUrl || viewingIne?.residentProfile?.ineBackUrl ? (
                        <ITFlex direction="column" className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {viewingIne.residentProfile.ineFrontUrl && (
                                <ITFlex direction="column">
                                    <ITText as="h4" className="text-xs font-bold text-slate-400 tracking-wider mb-2 uppercase">INE Frontal</ITText>
                                    <ITFlex direction="column" className="rounded-xl overflow-hidden shadow border border-slate-200 hover:scale-105 transition-transform duration-300">
                                        <img src={viewingIne.residentProfile.ineFrontUrl} alt="Frente" className="w-full h-auto" />
                                    </ITFlex>
                                </ITFlex>
                            )}
                            {viewingIne.residentProfile.ineBackUrl && (
                                <ITFlex direction="column">
                                    <ITText as="h4" className="text-xs font-bold text-slate-400 tracking-wider mb-2 uppercase">INE Reverso</ITText>
                                    <ITFlex direction="column" className="rounded-xl overflow-hidden shadow border border-slate-200 hover:scale-105 transition-transform duration-300">
                                        <img src={viewingIne.residentProfile.ineBackUrl} alt="Reverso" className="w-full h-auto" />
                                    </ITFlex>
                                </ITFlex>
                            )}
                        </ITFlex>
                    ) : (
                        <ITFlex direction="column" align="center" justify="center" className="flex flex-col items-center justify-center p-12 text-slate-400">
                            <FaIdCard className="text-6xl mb-4 text-slate-200" />
                            <ITText as="h3" className="text-lg font-medium text-slate-500">Sin identificaciones archivadas</ITText>
                            <ITText as="p" className="text-sm">Edita el expediente para subir fotografías del INE.</ITText>
                        </ITFlex>
                    )}
                </ITFlex>
                <ITFlex justify="end" className="p-4 bg-white border-t border-slate-100 flex justify-end">
                    <ITButton variant="outlined" color="secondary" onClick={() => setViewingIne(null)}>Cerrar Visor</ITButton>
                </ITFlex>
            </ITDialog>

            {/* Contacts Manager Modal */}
            <ResidentContactsManager 
                resident={managingContacts}
                isOpen={!!managingContacts}
                onClose={() => setManagingContacts(null)}
            />

        </ITPage>
    );
};

export default ResidentsPage;
