import { ITButton, ITDataTable, ITDialog, ITInput } from "@axzydev/axzy_ui_system";
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
        } catch (error: any) {
            dispatch(showToast({ message: "Error de red", type: "error" }));
        }
    };

    const getStatusUI = (status: string) => {
        switch(status) {
            case 'PENDING': return <span className="bg-amber-100 text-amber-700 font-bold px-2 py-1 rounded text-xs border border-amber-200">En Espera</span>;
            case 'ENTERED': return <span className="bg-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded text-xs border border-emerald-200">Dentro (Ingresó)</span>;
            case 'EXITED': return <span className="bg-slate-100 text-slate-500 font-bold px-2 py-1 rounded text-xs border border-slate-200">Completado (Salió)</span>;
            case 'EXPIRED': return <span className="bg-red-100 text-red-600 font-bold px-2 py-1 rounded text-xs border border-red-200">Expirada</span>;
            case 'CANCELLED': return <span className="bg-red-100 text-red-600 font-bold px-2 py-1 rounded text-xs border border-red-200 line-through">Revocada</span>;
            default: return <span className="text-slate-400">{status}</span>;
        }
    };

    const columns = useMemo(() => [
        { 
            key: "code", 
            label: "Pase", 
            type: "string", 
            render: (row: Invitation) => (
                <div className="font-mono bg-slate-100 text-slate-700 font-bold px-2 py-1 rounded inline-block text-sm border border-slate-200">
                    {row.code}
                </div>
            )
        },
        { 
            key: "guestName", 
            label: "Invitado Destino", 
            type: "string", 
            sortable: true,
            render: (row: Invitation) => (
                <div>
                    <div className="flex items-center gap-2 mb-0.5">
                        <div className="font-bold text-slate-800">{row.guestName}</div>
                        {row.type?.name === 'PROV' ? (
                            <span className="bg-indigo-50 text-indigo-600 text-[10px] font-bold px-1.5 py-0.5 rounded border border-indigo-100 flex items-center gap-1"><FaMotorcycle /> {row.type.value}</span>
                        ) : (
                            <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-200 flex items-center gap-1"><FaUser /> {row.type?.value || 'Visita'}</span>
                        )}
                    </div>
                    <div className="text-xs text-slate-500 font-medium">Destino: {row.property?.identifier}</div>
                    <div className="text-xs text-slate-400 mt-1">Autorizó: {row.createdBy?.name} {row.createdBy?.lastName}</div>
                </div>
            )
        },
        { 
            key: "validRange", 
            label: "Vigencia", 
            type: "string",
            render: (row: Invitation) => (
                <div className="text-xs text-slate-600">
                    <div className="font-medium">De: {dayjs(row.validFrom).format('DD MMM YYYY')}</div>
                    <div>Al: {dayjs(row.validUntil).format('DD MMM YYYY')}</div>
                </div>
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
                <div className="text-xs text-slate-600">
                    <div>
                        <span className="font-medium text-slate-500 w-6 inline-block">In:</span>
                        {row.entryTime ? <span className="text-emerald-600 font-medium">{dayjs(row.entryTime).format('DD MMM HH:mm')}</span> : <span className="text-slate-300">-</span>}
                    </div>
                    <div>
                        <span className="font-medium text-slate-500 w-6 inline-block">Out:</span>
                        {row.exitTime ? <span className="text-slate-600 font-medium">{dayjs(row.exitTime).format('DD MMM HH:mm')}</span> : <span className="text-slate-300">-</span>}
                    </div>
                </div>
            )
        },
        {
            key: "actions",
            label: "Acciones",
            type: "actions",
            actions: (row: Invitation) => (
                <div className="flex items-center gap-2">
                    <ITButton 
                        onClick={() => setViewingQr(row)} 
                        size="small" 
                        variant="solid" 
                        className="bg-emerald-500 hover:bg-emerald-600 text-white border-none shadow"
                        title="Ver Gafete QR"
                    >
                        <FaQrcode />
                    </ITButton>
                    {row.status === 'PENDING' && (
                        <div className="flex gap-1 ml-2 border-l pl-2 border-slate-200">
                           <ITButton onClick={() => { setScanningCode({inv: row, type: 'ENTERED'}); setCodeInput("AXZ-"); }} size="small" variant="ghost" className="text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50" title="Aprobar Ingreso Escaneando">
                               <FaSignInAlt />
                           </ITButton>
                           <ITButton onClick={() => setUpdatingStatusOf({inv: row, status: 'CANCELLED'})} size="small" variant="ghost" className="text-red-400 hover:text-red-600" title="Revocar Accesos">
                               <FaBan />
                           </ITButton>
                        </div>
                    )}

                    {row.status === 'ENTERED' && (
                        <div className="flex gap-1 ml-2 border-l pl-2 border-slate-200">
                           <ITButton onClick={() => { setScanningCode({inv: row, type: 'EXITED'}); setCodeInput("AXZ-"); }} size="small" variant="ghost" className="text-slate-400 hover:text-slate-700 hover:bg-slate-100" title="Aprobar Salida">
                               <FaSignOutAlt />
                           </ITButton>
                        </div>
                    )}
                </div>
            )
        }
    ], []);

    return (
        <div className="p-6 bg-[#f8fafc] min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <div>
                   <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
                        <FaIdBadge className="text-emerald-600" />
                        Directorio de Invitados
                   </h1>
                   <p className="text-slate-500 text-sm mt-1">Generación y control de pases de acceso mediante código QR</p>
                </div>
                <div className="flex gap-3 items-center">
                    <div className="w-64 relative">
                        <ITInput
                            placeholder="Buscar código o invitado..."
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
                            >
                                <FaTimes size={14} />
                            </button>
                        )}
                    </div>
                    <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-2">
                        <FaFilter className="text-slate-400 text-xs mr-2" />
                        <select 
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setRefreshKey(prev => prev + 1);
                            }}
                            className="bg-transparent text-sm font-medium text-slate-700 outline-none min-w-[120px]"
                        >
                            <option value="ALL">Todos los estados</option>
                            {statusCatalog.map(s => (
                                <option key={s.id} value={s.name}>{s.value}</option>
                            ))}
                        </select>
                    </div>
                    <ITButton
                        onClick={() => setRefreshKey(prev => prev + 1)}
                        color="secondary"
                        variant="outlined"
                        className="h-[42px] px-3 !rounded-xl border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-2"
                        size="small"
                        title="Refrescar datos"
                    >
                        <FaSync className={`text-xs text-slate-500`} />
                        <span className="text-xs font-bold text-slate-500">Refrescar</span>
                    </ITButton>
                    <button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 hover:scale-105 transition-all"
                    >
                        <FaPlus className="text-xs" />
                        <span>Crear Pase</span>
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <ITDataTable
                    key={refreshKey}
                    columns={columns as any}
                    fetchData={memoizedFetch as any}
                    externalFilters={externalFilters as any}
                    defaultItemsPerPage={10}
                    title=""
                />
            </div>

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
                <div className="p-6">
                    <p className="text-slate-700 mb-6">
                        Estás a punto de alterar el estado operativo del pase <strong>{updatingStatusOf?.inv.code}</strong> a un estado de <strong>REVOCADO (CANCELLED)</strong>.
                        El acceso con este código QR o código alfa será permanentemente denegado en caseta. ¿Proceder?
                    </p>
                    <div className="flex justify-end gap-3">
                        <ITButton variant="outlined" onClick={() => setUpdatingStatusOf(null)}>Volver</ITButton>
                        <ITButton className="bg-red-600 text-white border-red-600" onClick={confirmStatusUpdate}>Revocar Pase</ITButton>
                    </div>
                </div>
            </ITDialog>

            <ITDialog 
                isOpen={!!scanningCode} 
                onClose={() => setScanningCode(null)} 
                title={scanningCode?.type === 'ENTERED' ? "Validación de Acceso" : "Validación de Salida"}
                className="max-w-2xl"
            >
                <div className="p-0">
                    {/* Premium Header Card */}
                    {scanningCode && (
                        <div className={`relative overflow-hidden p-6 sm:p-8 ${scanningCode.type === 'ENTERED' ? 'bg-gradient-to-br from-emerald-900 via-emerald-800 to-slate-900' : 'bg-gradient-to-br from-slate-800 to-slate-900'}`}>
                            {/* Decorative background elements */}
                            <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
                            <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-48 h-48 bg-emerald-500/20 rounded-full blur-2xl"></div>

                            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className={`w-2 h-2 rounded-full animate-pulse ${scanningCode.type === 'ENTERED' ? 'bg-emerald-400' : 'bg-slate-400'}`}></div>
                                        <p className="text-[10px] text-emerald-200/80 font-bold uppercase tracking-[0.2em]">Invitado Autorizado</p>
                                    </div>
                                    <p className="text-3xl font-black text-white tracking-tight drop-shadow-md">{scanningCode.inv.guestName}</p>
                                </div>
                                <div className="md:text-right bg-black/20 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
                                    <p className="text-[10px] text-emerald-200/80 font-bold uppercase tracking-[0.2em] mb-1">Destino</p>
                                    <p className="text-xl font-bold text-white tracking-wide">{scanningCode.inv.property?.identifier}</p>
                                    <p className="text-sm text-emerald-100/70 font-medium">{scanningCode.inv.property?.name}</p>
                                </div>
                            </div>
                            
                            {scanningCode.inv.notes && (
                                <div className="mt-6 p-4 bg-black/30 border border-amber-400/20 rounded-xl relative z-10 backdrop-blur-md">
                                    <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block mb-1">Info. Vehículo / Notas:</span>
                                    <p className="text-sm text-amber-50 font-medium">{scanningCode.inv.notes}</p>
                                </div>
                            )}

                            <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap gap-4 justify-between items-center text-xs text-emerald-100/60 relative z-10">
                                <span className="flex items-center gap-2">
                                    <span className="font-bold text-emerald-100/40">Emitió:</span> 
                                    <span className="bg-white/10 px-2 py-1 rounded-md text-white/90">{scanningCode.inv.createdBy?.name} {scanningCode.inv.createdBy?.lastName}</span>
                                </span>
                                <span className="flex items-center gap-2 font-mono">
                                    <span className="font-bold text-emerald-100/40">Vigencia:</span> 
                                    {dayjs(scanningCode.inv.validFrom).format('DD MMM')} ~ {dayjs(scanningCode.inv.validUntil).format('DD MMM')}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Scanner Section */}
                    <div className="p-6 sm:p-8 bg-slate-50">
                        <div className="text-center mb-6">
                            <p className="text-slate-500 text-sm font-medium">
                                Por favor, posicione la lectora frontalmente o teclee el código para validar la integridad matemática del pase.
                            </p>
                        </div>
                        
                        <div className="max-w-md mx-auto mb-8 relative group">
                            {/* Animated scanner frame */}
                            <div className={`absolute inset-0 rounded-2xl border-2 transition-all duration-500 ${codeInput ? 'border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.3)]' : 'border-dashed border-slate-300 group-hover:border-slate-400'}`}></div>
                            
                            <div className="relative p-6 flex flex-col items-center bg-white rounded-2xl">
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 ${codeInput ? 'bg-emerald-50 text-emerald-500 scale-110 shadow-lg shadow-emerald-100' : 'bg-slate-50 text-slate-300'}`}>
                                    <FaQrcode className="text-3xl" />
                                </div>
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
                            </div>
                        </div>

                        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
                            <button 
                                onClick={() => setScanningCode(null)}
                                className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-200/50 transition-all border-2 border-transparent w-full sm:w-auto"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={confirmScanningCode}
                                className={`px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all border-2 border-transparent w-full sm:w-auto flex items-center justify-center gap-2 ${
                                    scanningCode?.type === 'ENTERED' 
                                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/30 hover:shadow-emerald-500/50' 
                                    : 'bg-slate-800 hover:bg-slate-700 shadow-slate-800/30'
                                }`}
                            >
                                {scanningCode?.type === 'ENTERED' ? 'Autorizar y Dar Acceso' : 'Cerrar Visita (Salida)'}
                            </button>
                        </div>
                    </div>
                </div>
            </ITDialog>

        </div>
    );
};

export default InvitationsPage;
