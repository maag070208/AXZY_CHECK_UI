import { showToast } from "@app/core/store/toast/toast.slice";
import { FaAddressBook, FaEdit, FaEye, FaIdCard, FaPhone, FaPlus, FaSearch, FaSync, FaTimes, FaTrash, FaUserShield } from "react-icons/fa";
import {
    ITButton,
    ITDataTable,
    ITDialog,
    ITFlex,
    ITInput,
    ITPage,
    ITText,
} from "@axzydev/axzy_ui_system";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { ResidentContactsManager } from "../components/ResidentContactsManager";
import { ResidentUser, deleteResident, getPaginatedResidents } from "../services/residents.service";
import { useCatalog } from "@app/core/hooks/catalog.hook";
import { PersonAvatar } from "@app/core/components/PersonAvatar";

const ResidentsPage = () => {
    const [refreshKey, setRefreshKey] = useState(0);
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
    const navigate = useNavigate();

    const memoizedFetch = useCallback((params: any) => {
        return getPaginatedResidents(params);
    }, []);

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
            sortable: false,
            render: (row: ResidentUser) => (
                <ITFlex align="center" gap={3} className="flex items-center gap-3">
                    <PersonAvatar
                        name={`${row.name} ${row.lastName ?? ""}`.trim()}
                        photoUrl={row.photoUrl ?? row.residentProfile?.photoUrl}
                        size={40}
                    />
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
                <ITFlex align="center" gap={2}>
                    <ITButton
                        onClick={() => navigate(`/residents/${row.id}`)}
                        size="md"
                        variant="icon-only"
                        color="primary"
                        icon={<FaEye />}
                        ariaLabel="Ver expediente"
                        title="Ver expediente"
                    />
                    <ITButton
                        onClick={() => setViewingIne(row)}
                        size="md"
                        variant="icon-only"
                        color="purple"
                        icon={<FaIdCard />}
                        ariaLabel="Ver identificación"
                        title="Ver identificación"
                    />
                    <ITButton
                        onClick={() => setManagingContacts(row)}
                        size="md"
                        variant="icon-only"
                        color="info"
                        icon={<FaAddressBook />}
                        ariaLabel="Agenda de contactos"
                        title="Agenda de contactos"
                    />
                    <ITButton
                        onClick={() => navigate(`/residents/${row.id}/editar`)}
                        size="md"
                        variant="icon-only"
                        color="warning"
                        icon={<FaEdit />}
                        ariaLabel="Editar"
                        title="Editar"
                    />
                    <ITButton
                        onClick={() => setResidentToDelete(row)}
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
    ], [propertiesCatalog, loadingProperties]);

    return (
        <ITPage
      className="m-0! mx-auto! max-w-[1600px]! px-6! bg-slate-50"
      noPadding
      title="Directorio de Residentes"
      breadcrumbs={[{ label: "Inicio", href: "#/home" }, { label: "Directorio de Residentes" }]}
      description="Gestión de usuarios vecinales, expedientes y controles de acceso"
      icon={<FaUserShield size={20} />}
      actions={
<ITFlex align="center" gap={2} wrap="wrap" justify="end" className="w-full justify-end">
                    <ITFlex align="center" gap={1} className="w-64 shrink-0">
                        <ITInput
                            placeholder="Buscar residente..."
                            name="search"
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
                    <ITButton
                        onClick={() => navigate("/residents/nuevo")}
                        color="primary"
                        size="md"
                        icon={<FaPlus />}
                    >
                        Alta de residente
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
                isOpen={!!residentToDelete} 
                onClose={() => setResidentToDelete(null)} 
                title="Confirmar Eliminación"
            >
                <ITFlex direction="column" gap={4}>
                    <ITText as="p" className="text-sm text-slate-600 dark:text-slate-300">¿Estás seguro de eliminar el expediente de <ITText as="span" className="font-bold">{residentToDelete?.name} {residentToDelete?.lastName}</ITText>? Esta acción inhabilitará su acceso a la plataforma.</ITText>
                    <ITFlex justify="end" gap={2}>
                        <ITButton variant="outlined" color="secondary" onClick={() => setResidentToDelete(null)}>Cancelar</ITButton>
                        <ITButton color="danger" onClick={confirmDelete}>Eliminar expediente</ITButton>
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
