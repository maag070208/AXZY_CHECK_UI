import { ITButton, ITDataTable, ITDialog, ITFlex, ITInput, ITPage, ITSearchSelect, ITText } from "@axzydev/axzy_ui_system";
import { FaPlus, FaQrcode, FaIdBadge, FaBan, FaSignInAlt, FaSignOutAlt, FaTimes, FaUser, FaMotorcycle, FaSync, FaFilter } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useCallback, useMemo, useState } from "react";
import { showToast } from "@app/core/store/toast/toast.slice";
import { getPaginatedInvitations, createInvitation, updateInvitationStatus, Invitation } from "../services/invitations.service";
import { InvitationForm } from "../components/InvitationForm";
import { InvitationQRPrint } from "../components/InvitationQRPrint";
import dayjs from "dayjs";
import { useCatalog } from "@app/core/hooks/catalog.hook";

const InvitationsPage = () => {
    const [refreshKey, setRefreshKey] = useState(0);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [viewingQr, setViewingQr] = useState<Invitation | null>(null);
    const [updatingStatusOf, setUpdatingStatusOf] = useState<{inv: Invitation, status: string} | null>(null);
    const [scanningCode, setScanningCode] = useState<{inv: Invitation, type: 'ENTERED' | 'EXITED'} | null>(null);
    const [codeInput, setCodeInput] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const { data: statusCatalog } = useCatalog('invitation_status');
    
    const dispatch = useDispatch();
    const auth = useSelector((state: any) => state.auth);
    
    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setRefreshKey(prev => prev + 1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, statusFilter]);

    const externalFilters = useMemo(() => {
        const f: any = {};
        if (searchTerm && searchTerm.trim().length > 0) f.search = searchTerm.trim();
        if (statusFilter && statusFilter !== 'ALL') f.status = statusFilter;
        return f;
    }, [searchTerm, statusFilter]);


    const memoizedFetch = useCallback((params: any) => {
        return getPaginatedInvitations(params);
    }, []);

    const handleCreate = async (data: any) => {
        data.createdById = auth.id;
        try {
            const res = await createInvitation(data);
            if (res.success) {
                dispatch(showToast({ message: "Invitación generada exitosamente", type: "success" }));
                setIsCreateModalOpen(false);
                setRefreshKey(prev => prev + 1);
                // Optionally show the QR immediately after generating
                if (res.data) setViewingQr(res.data);
            } else {
                dispatch(showToast({ message: res.messages?.[0] || "Error al generar invitación", type: "error" }));
            }
        } catch (error: any) {
            dispatch(showToast({ message: error.messages?.[0] || "Error en el sistema", type: "error" }));
        }
    };

    const confirmStatusUpdate = async () => {
        if (!updatingStatusOf) return;
        try {
            const res = await updateInvitationStatus(updatingStatusOf.inv.id, updatingStatusOf.status);
            if (res.success) {
                dispatch(showToast({ message: "Estado de la invitación actualizado", type: "success" }));
                setUpdatingStatusOf(null);
                setRefreshKey(prev => prev + 1);
            } else {
                dispatch(showToast({ message: res.messages?.[0] || "Error al actualizar estado", type: "error" }));
            }
        } catch (error: any) {
            dispatch(showToast({ message: error.messages?.[0] || "Error de red", type: "error" }));
        }
    };

    const confirmScanningCode = async () => {
        if (!scanningCode) return;
        if (codeInput !== scanningCode.inv.code) {
            dispatch(showToast({ message: "El código insertado no coincide con este pase", type: "error" }));
            return;
        }

        try {
            const res = await updateInvitationStatus(scanningCode.inv.id, scanningCode.type);
            if (res.success) {
                dispatch(showToast({ message: `Pase marcado como ${scanningCode.type === 'ENTERED' ? 'Ingresado' : 'Módulo de Salida'}`, type: "success" }));
                setScanningCode(null);
                setCodeInput("");
                setRefreshKey(prev => prev + 1);
            } else {
                dispatch(showToast({ message: res.messages?.[0] || "Error", type: "error" }));
            }
        } catch {
            dispatch(showToast({ message: "Error de red", type: "error" }));
        }
    };

    const getStatusUI = (status: string) => {
        switch(status) {
            case 'PENDING': return <ITText as="span" className="bg-amber-100 text-amber-700 font-bold px-2 py-1 rounded text-xs border border-amber-200">En Espera</ITText>;
            case 'ENTERED': return <ITText as="span" className="bg-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded text-xs border border-emerald-200">Dentro (Ingresó)</ITText>;
            case 'EXITED': return <ITText as="span" className="bg-slate-100 text-slate-500 font-bold px-2 py-1 rounded text-xs border border-slate-200">Completado (Salió)</ITText>;
            case 'EXPIRED': return <ITText as="span" className="bg-red-100 text-red-600 font-bold px-2 py-1 rounded text-xs border border-red-200">Expirada</ITText>;
            case 'CANCELLED': return <ITText as="span" className="bg-red-100 text-red-600 font-bold px-2 py-1 rounded text-xs border border-red-200 line-through">Revocada</ITText>;
            default: return <ITText as="span" className="text-slate-400">{status}</ITText>;
        }
    };

    const columns = useMemo(() => [
        { 
            key: "code", 
            label: "Pase", 
            type: "string", 
            render: (row: Invitation) => (
                <ITFlex direction="column" className="font-mono bg-slate-100 text-slate-700 font-bold px-2 py-1 rounded inline-block text-sm border border-slate-200">
                    {row.code}
                </ITFlex>
            )
        },
        { 
            key: "guestName", 
            label: "Invitado Destino", 
            type: "string", 
            sortable: false,
            render: (row: Invitation) => (
                <ITFlex direction="column">
                    <ITFlex align="center" gap={2} className="flex items-center gap-2 mb-0.5">
                        <ITFlex direction="column" className="font-bold text-slate-800">{row.guestName}</ITFlex>
                        {row.type?.name === 'PROV' ? (
                            <ITText as="span" className="bg-indigo-50 text-indigo-600 text-[10px] font-bold px-1.5 py-0.5 rounded border border-indigo-100 flex items-center gap-1"><FaMotorcycle /> {row.type.value}</ITText>
                        ) : (
                            <ITText as="span" className="bg-slate-100 text-slate-500 text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-200 flex items-center gap-1"><FaUser /> {row.type?.value || 'Visita'}</ITText>
                        )}
                    </ITFlex>
                    <ITFlex direction="column" className="text-xs text-slate-500 font-medium">Destino: {row.property?.identifier}</ITFlex>
                    <ITFlex direction="column" className="text-xs text-slate-400 mt-1">Autorizó: {row.createdBy?.name} {row.createdBy?.lastName}</ITFlex>
                </ITFlex>
            )
        },
        { 
            key: "validRange", 
            label: "Vigencia", 
            type: "string",
            render: (row: Invitation) => (
                <ITFlex direction="column" className="text-xs text-slate-600">
                    <ITFlex direction="column" className="font-medium">De: {dayjs(row.validFrom).format('DD MMM YYYY')}</ITFlex>
                    <ITFlex direction="column">Al: {dayjs(row.validUntil).format('DD MMM YYYY')}</ITFlex>
                </ITFlex>
            )
        },
        {
            key: "status",
            label: "Estatus",
            type: "string",
            render: (row: Invitation) => getStatusUI(row.status)
        },
        {
            key: "logs",
            label: "Entrada / Salida",
            type: "string",
            render: (row: Invitation) => (
                <ITFlex direction="column" className="text-xs text-slate-600">
                    <ITFlex direction="column">
                        <ITText as="span" className="font-medium text-slate-500 w-6 inline-block">In:</ITText>
                        {row.entryTime ? <ITText as="span" className="text-emerald-600 font-medium">{dayjs(row.entryTime).format('DD MMM HH:mm')}</ITText> : <ITText as="span" className="text-slate-300">-</ITText>}
                    </ITFlex>
                    <ITFlex direction="column">
                        <ITText as="span" className="font-medium text-slate-500 w-6 inline-block">Out:</ITText>
                        {row.exitTime ? <ITText as="span" className="text-slate-600 font-medium">{dayjs(row.exitTime).format('DD MMM HH:mm')}</ITText> : <ITText as="span" className="text-slate-300">-</ITText>}
                    </ITFlex>
                </ITFlex>
            )
        },
        {
            key: "actions",
            label: "Acciones",
            type: "actions",
            actions: (row: Invitation) => (
                <ITFlex align="center" gap={2} className="flex items-center gap-2">
                    <ITButton 
                        onClick={() => setViewingQr(row)} 
                        size="sm" 
                        variant="solid" 
                       
                        title="Ver Gafete QR"
                    >
                        <FaQrcode />
                    </ITButton>
                    {row.status === 'PENDING' && (
                        <ITFlex gap={1} className="flex gap-1 ml-2 border-l pl-2 border-slate-200">
                           <ITButton onClick={() => { setScanningCode({inv: row, type: 'ENTERED'}); setCodeInput("AXZ-"); }} size="sm" variant="ghost" title="Aprobar Ingreso Escaneando">
                               <FaSignInAlt />
                           </ITButton>
                           <ITButton onClick={() => setUpdatingStatusOf({inv: row, status: 'CANCELLED'})} size="sm" variant="ghost" title="Revocar Accesos">
                               <FaBan />
                           </ITButton>
                        </ITFlex>
                    )}

                    {row.status === 'ENTERED' && (
                        <ITFlex gap={1} className="flex gap-1 ml-2 border-l pl-2 border-slate-200">
                           <ITButton onClick={() => { setScanningCode({inv: row, type: 'EXITED'}); setCodeInput("AXZ-"); }} size="sm" variant="ghost" title="Aprobar Salida">
                               <FaSignOutAlt />
                           </ITButton>
                        </ITFlex>
                    )}
                </ITFlex>
            )
        }
    ], []);

    return (
        <ITPage
      className="m-0! px-4! max-w-screen!"
      noPadding
      title="Directorio de Invitados"
      breadcrumbs={[{ label: "Inicio", href: "#/home" }, { label: "Directorio de Invitados" }]}
      description="Generación y control de pases de acceso mediante código QR"
      icon={<FaIdBadge size={20} />}
      iconColor="#065911"
      actions={
<ITFlex align="center" gap={3} className="flex gap-3 items-center">
                    <ITFlex direction="column" className="w-64 relative">
                        <ITInput
                            placeholder="Buscar código o invitado..."
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
                               
                            />
                        )}
                    </ITFlex>
                    <ITFlex align="center" className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-2">
                        <FaFilter className="text-slate-400 text-xs mr-2" />
                        <ITSearchSelect
                            value={statusFilter}
                            onChange={(value) => {
                                setStatusFilter(String(value));
                                setRefreshKey(prev => prev + 1);
                            }}
                            options={[
                                { label: "Todos los estados", value: "ALL" },
                                ...statusCatalog.map(s => ({ label: s.value, value: s.name })),
                            ]}
                            clearable={false}
                            className="min-w-[160px]"
                        />
                    </ITFlex>
                    <ITButton
                        onClick={() => setRefreshKey(prev => prev + 1)}
                        color="secondary"
                        variant="outlined"
                       
                        size="md"
                        title="Refrescar datos"
                    >
                        <ITFlex align="center" gap={2}><FaSync className={`text-xs text-slate-500`} />
                        <ITText as="span" className="text-xs font-bold text-slate-500">Refrescar</ITText></ITFlex>
                    </ITButton>
                    <ITButton
                        onClick={() => setIsCreateModalOpen(true)}
                        color="primary"
                        size="md"
                       
                    >
                        <ITFlex align="center" gap={2}><FaPlus className="text-xs" />
                        <ITText as="span">Crear Pase</ITText></ITFlex>
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
                    externalFilters={externalFilters as any}
                    title=""
                />
            </ITFlex>

            {/* Modals */}
            <ITDialog 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)} 
                title=""
                className="max-w-xl"
            >
                <InvitationForm 
                    onSubmit={handleCreate} 
                    onCancel={() => setIsCreateModalOpen(false)} 
                />
            </ITDialog>

            <ITDialog 
                isOpen={!!viewingQr} 
                onClose={() => setViewingQr(null)} 
                title=""
                className="max-w-md bg-transparent shadow-none border-none p-0"
            >
                {viewingQr && (
                    <InvitationQRPrint invitation={viewingQr} onClose={() => setViewingQr(null)} />
                )}
            </ITDialog>

            <ITDialog 
                isOpen={!!updatingStatusOf} 
                onClose={() => setUpdatingStatusOf(null)} 
                title="Aviso de Seguridad"
            >
                <ITFlex direction="column" className="p-6">
                    <ITText as="p" className="text-slate-700 mb-6">
                        Estás a punto de alterar el estado operativo del pase <strong>{updatingStatusOf?.inv.code}</strong> a un estado de <strong>REVOCADO (CANCELLED)</strong>.
                        El acceso con este código QR o código alfa será permanentemente denegado en caseta. ¿Proceder?
                    </ITText>
                    <ITFlex justify="end" gap={3} className="flex justify-end gap-3">
                        <ITButton variant="outlined" onClick={() => setUpdatingStatusOf(null)}>Volver</ITButton>
                        <ITButton onClick={confirmStatusUpdate}>Revocar Pase</ITButton>
                    </ITFlex>
                </ITFlex>
            </ITDialog>

            <ITDialog 
                isOpen={!!scanningCode} 
                onClose={() => setScanningCode(null)} 
                title={scanningCode?.type === 'ENTERED' ? "Validación de Acceso" : "Validación de Salida"}
                className="max-w-2xl"
            >
                <ITFlex direction="column" className="p-0">
                    {/* Premium Header Card */}
                    {scanningCode && (
                        <ITFlex direction="column" className={`relative overflow-hidden p-6 sm:p-8 ${scanningCode.type === 'ENTERED' ? 'bg-gradient-to-br from-emerald-900 via-emerald-800 to-slate-900' : 'bg-gradient-to-br from-slate-800 to-slate-900'}`}>
                            {/* Decorative background elements */}
                            <ITFlex direction="column" className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl"></ITFlex>
                            <ITFlex direction="column" className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-48 h-48 bg-emerald-500/20 rounded-full blur-2xl"></ITFlex>

                            <ITFlex direction="column" align="start" justify="between" gap={6} className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                <ITFlex direction="column">
                                    <ITFlex align="center" gap={2} className="flex items-center gap-2 mb-2">
                                        <ITFlex direction="column" className={`w-2 h-2 rounded-full animate-pulse ${scanningCode.type === 'ENTERED' ? 'bg-emerald-400' : 'bg-slate-400'}`}></ITFlex>
                                        <ITText as="p" className="text-[10px] text-emerald-200/80 font-bold uppercase tracking-[0.2em]">Invitado Autorizado</ITText>
                                    </ITFlex>
                                    <ITText as="p" className="text-3xl font-black text-white tracking-tight drop-shadow-md">{scanningCode.inv.guestName}</ITText>
                                </ITFlex>
                                <ITFlex direction="column" className="md:text-right bg-black/20 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
                                    <ITText as="p" className="text-[10px] text-emerald-200/80 font-bold uppercase tracking-[0.2em] mb-1">Destino</ITText>
                                    <ITText as="p" className="text-xl font-bold text-white tracking-wide">{scanningCode.inv.property?.identifier}</ITText>
                                    <ITText as="p" className="text-sm text-emerald-100/70 font-medium">{scanningCode.inv.property?.name}</ITText>
                                </ITFlex>
                            </ITFlex>
                            
                            {scanningCode.inv.notes && (
                                <ITFlex direction="column" className="mt-6 p-4 bg-black/30 border border-amber-400/20 rounded-xl relative z-10 backdrop-blur-md">
                                    <ITText as="span" className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block mb-1">Info. Vehículo / Notas:</ITText>
                                    <ITText as="p" className="text-sm text-amber-50 font-medium">{scanningCode.inv.notes}</ITText>
                                </ITFlex>
                            )}

                            <ITFlex align="center" justify="between" gap={4} className="mt-6 pt-5 border-t border-white/10 flex flex-wrap gap-4 justify-between items-center text-xs text-emerald-100/60 relative z-10">
                                <ITText as="span" className="flex items-center gap-2">
                                    <ITText as="span" className="font-bold text-emerald-100/40">Emitió:</ITText> 
                                    <ITText as="span" className="bg-white/10 px-2 py-1 rounded-md text-white/90">{scanningCode.inv.createdBy?.name} {scanningCode.inv.createdBy?.lastName}</ITText>
                                </ITText>
                                <ITText as="span" className="flex items-center gap-2 font-mono">
                                    <ITText as="span" className="font-bold text-emerald-100/40">Vigencia:</ITText> 
                                    {dayjs(scanningCode.inv.validFrom).format('DD MMM')} ~ {dayjs(scanningCode.inv.validUntil).format('DD MMM')}
                                </ITText>
                            </ITFlex>
                        </ITFlex>
                    )}

                    {/* Scanner Section */}
                    <ITFlex direction="column" className="p-6 sm:p-8 bg-slate-50">
                        <ITFlex direction="column" className="text-center mb-6">
                            <ITText as="p" className="text-slate-500 text-sm font-medium">
                                Por favor, posicione la lectora frontalmente o teclee el código para validar la integridad matemática del pase.
                            </ITText>
                        </ITFlex>
                        
                        <ITFlex direction="column" className="max-w-md mx-auto mb-8 relative group">
                            {/* Animated scanner frame */}
                            <ITFlex direction="column" className={`absolute inset-0 rounded-2xl border-2 transition-all duration-500 ${codeInput ? 'border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.3)]' : 'border-dashed border-slate-300 group-hover:border-slate-400'}`}></ITFlex>
                            
                            <ITFlex direction="column" align="center" className="relative p-6 flex flex-col items-center bg-white rounded-2xl">
                                <ITFlex direction="column" className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 ${codeInput ? 'bg-emerald-50 text-emerald-500 scale-110 shadow-lg shadow-emerald-100' : 'bg-slate-50 text-slate-300'}`}>
                                    <FaQrcode className="text-3xl" />
                                </ITFlex>
                                <input
                                    type="text"
                                    autoFocus
                                    placeholder="Escribe AXZ-XXXX..."
                                    value={codeInput}
                                    onChange={(e) => {
                                        let val = e.target.value.toUpperCase();
                                        if (!val.startsWith('AXZ-')) val = 'AXZ-'; 
                                        setCodeInput(val);
                                    }}
                                    onKeyDown={(e) => { if(e.key === 'Enter') confirmScanningCode(); }}
                                    className="bg-slate-50/50 border-2 border-slate-100 text-center text-2xl sm:text-3xl font-mono tracking-[0.2em] font-black text-slate-800 rounded-xl px-4 py-4 outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 w-full transition-all uppercase placeholder:font-sans placeholder:text-lg placeholder:tracking-normal placeholder:font-medium placeholder:text-slate-300"
                                />
                            </ITFlex>
                        </ITFlex>

                        <ITFlex justify="end" gap={3} className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
                            <ITButton
                                variant="text"
                                color="gray"
                                onClick={() => setScanningCode(null)}
                               
                            >
                                Cancelar
                            </ITButton>
                            <ITButton
                                onClick={confirmScanningCode}
                                color={scanningCode?.type === 'ENTERED' ? 'success' : 'gray'}
                               
                            >
                                {scanningCode?.type === 'ENTERED' ? 'Autorizar y Dar Acceso' : 'Cerrar Visita (Salida)'}
                            </ITButton>
                        </ITFlex>
                    </ITFlex>
                </ITFlex>
            </ITDialog>

        </ITPage>
    );
};

export default InvitationsPage;
