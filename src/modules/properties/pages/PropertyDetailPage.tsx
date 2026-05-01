import { ITButton, ITDialog, ITDataTable, ITBadget, ITLoader } from "@axzydev/axzy_ui_system";
import { useCallback, useEffect, useMemo, useState } from "react";
import { 
    FaArrowLeft, 
    FaBuilding, 
    FaHome, 
    FaMapMarkedAlt, 
    FaUserFriends, 
    FaPhone, 
    FaEnvelope, 
    FaExclamationTriangle, 
    FaEdit, 
    FaQrcode, 
    FaMapMarkerAlt,
    FaCrown,
    FaUser,
    FaEye,
    FaUserShield,
    FaIdCard,
    FaFileAlt
} from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import QRCode from "qrcode";
import { showToast } from "@app/core/store/toast/toast.slice";
import { AppState } from "@app/core/store/store";
import { getPropertyById, Property, updateProperty } from "../service/properties.service";
import { getPaginatedResidents, ResidentUser } from "../../residents/services/residents.service";
import { GoogleMapComponent } from "../../../core/components/GoogleMapComponent";
import { PropertyForm } from "../components/PropertyForm";

const PropertyDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const userRole = useSelector((state: AppState) => state.auth.role);
    const isAdmin = userRole === 'ADMIN' || userRole === 'SHIFT_GUARD';

    const [property, setProperty] = useState<Property | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [residentCount, setResidentCount] = useState<number | null>(null);
    const [viewingResident, setViewingResident] = useState<ResidentUser | null>(null);

    useEffect(() => {
        if (id) {
            fetchData(Number(id));
        }
    }, [id, refreshKey]);

    const fetchData = async (propId: number) => {
        setLoading(true);
        try {
            const res = await getPropertyById(propId);
            if (res.success && res.data) {
                setProperty(res.data);
            } else {
                dispatch(showToast({ message: "No se pudo cargar la propiedad", type: "error" }));
            }
        } catch (error) {
            console.error("Error fetching property:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchResidents = useCallback(async (params: any) => {
        const res = await getPaginatedResidents({
            ...params,
            filters: { ...params.filters, propertyId: Number(id) }
        });
        if (res.data) {
             setResidentCount(res.total);
        }
        return res;
    }, [id]);

    const handleUpdate = async (data: any) => {
        if (!property) return;
        try {
            const res = await updateProperty(property.id, data);
            if (res.success) {
                dispatch(showToast({ message: "Propiedad actualizada", type: "success" }));
                setIsEditModalOpen(false);
                setRefreshKey(prev => prev + 1);
            } else {
                dispatch(showToast({ message: res.messages?.[0] || "Error al actualizar", type: "error" }));
            }
        } catch (error: any) {
            dispatch(showToast({ message: "Error al actualizar propiedad", type: "error" }));
        }
    };

    const handlePrintQR = async () => {
        if (!property) return;
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

    const residentColumns = useMemo(() => [
        { 
            key: "name", 
            label: "Residente", 
            type: "string", 
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
            key: "role", 
            label: "Relación", 
            type: "string", 
            render: (row: ResidentUser) => {
                console.log(row);
                return (
                <div className={`flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider ${row.role === 'OWNER' ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {row.role === 'OWNER' ? <FaCrown className="text-amber-500" /> : <FaUser className="text-emerald-400" />}
                    {row.role === 'OWNER' ? 'Propietario' : 'Inquilino'}
                </div>
            )
            }
        },
        { 
            key: "contact", 
            label: "Contacto", 
            type: "string",
            render: (row: ResidentUser) => (
                <div className="text-xs text-slate-600">
                    {row.residentProfile?.phoneNumber ? (
                        <div className="flex items-center gap-1.5 font-medium">
                            <FaPhone className="text-slate-400" />
                            {row.residentProfile.phoneNumber}
                        </div>
                    ) : (
                         <span className="italic text-slate-400">Sin teléfono</span>
                    )}
                    {row.residentProfile?.email && (
                        <div className="flex items-center gap-1.5 text-slate-400 mt-1">
                            <FaEnvelope className="text-slate-300" />
                            {row.residentProfile.email}
                        </div>
                    )}
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
                        onClick={() => setViewingResident(row)} 
                        size="small" 
                        variant="ghost" 
                        className="text-slate-400 hover:text-emerald-600"
                        title="Ver Detalles"
                    >
                        <FaEye />
                    </ITButton>
                </div>
            )
        }
    ], [navigate]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="text-center">
                <ITLoader size="lg" />
                <p className="mt-4 text-slate-500 font-medium">Cargando expediente de propiedad...</p>
            </div>
        </div>
    );

    if (!property) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="text-center bg-white p-10 rounded-3xl shadow-xl max-w-sm border border-slate-100">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FaExclamationTriangle className="text-red-400 text-3xl" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Propiedad no encontrada</h2>
                <p className="text-slate-500 mb-8">El registro solicitado no existe o ha sido eliminado del catálogo.</p>
                <ITButton color="primary" onClick={() => navigate("/properties")} className="w-full">
                    Volver al listado
                </ITButton>
            </div>
        </div>
    );

    const statusMap: any = {
        'VACNT': { label: 'NO HABITADA', color: 'secondary' },
        'HABIT': { label: 'HABITADA', color: 'success' },
        'RENT': { label: 'EN RENTA', color: 'primary' }
    };
    const statusKey = typeof property.status === 'object' ? property.status.name : property.status;
    const status = (statusKey && statusMap[statusKey]) || { label: 'DESCONOCIDO', color: 'secondary' };

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            {/* Elegant Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
                <div className="max-w-[1600px] mx-auto px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <ITButton 
                            variant="ghost" 
                            onClick={() => navigate("/properties")}
                            className="text-slate-500 hover:text-slate-800 hover:bg-slate-50 p-2"
                        >
                            <FaArrowLeft className="text-lg" />
                        </ITButton>
                        <div className="h-10 w-px bg-slate-200" />
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Propiedad {property.identifier}</h1>
                                <ITBadget size="small" variant="filled" color={status.color}>{status.label}</ITBadget>
                            </div>
                            <p className="text-slate-400 text-sm font-medium">{property.name}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {isAdmin && (
                            <ITButton 
                                variant="outlined" 
                                color="secondary" 
                                onClick={() => setIsEditModalOpen(true)}
                                className="border-slate-200 hover:border-slate-300"
                            >
                                <FaEdit className="mr-2" />
                                Editar
                            </ITButton>
                        )}
                        <ITButton 
                            variant="solid" 
                            color="primary" 
                            onClick={handlePrintQR}
                            className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100 text-white"
                        >
                            <FaQrcode className="mr-2" />
                            Imprimir QR
                        </ITButton>
                    </div>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto px-8 py-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Sidebar: Summary & Metrics */}
                    <div className="lg:col-span-1 space-y-8">
                        <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                {property.type?.name === 'CASA' ? <FaHome size={120} /> : <FaBuilding size={120} />}
                            </div>
                            
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Resumen Ejecutivo</h3>
                            
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                                        <FaUserFriends size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 font-bold uppercase">Residentes activos</p>
                                        <p className="text-xl font-bold text-slate-800">{residentCount ?? '...'}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
                                        {property.type?.name === 'CASA' ? <FaHome size={20} /> : <FaBuilding size={20} />}
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 font-bold uppercase">Tipo de Vivienda</p>
                                        <p className="text-xl font-bold text-slate-800 capitalize">{property.type?.value || '---'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-10 pt-10 border-t border-slate-50 space-y-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <FaMapMarkerAlt className="text-slate-300" />
                                        <h4 className="text-sm font-bold text-slate-700">Ubicación Geográfica</h4>
                                    </div>
                                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100/50">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Calle Principal</p>
                                        <p className="text-sm text-slate-600 font-medium leading-relaxed">{property.mainStreet}</p>
                                        {property.betweenStreets && (
                                            <>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 mt-4">Entre calles / Ref.</p>
                                                <p className="text-sm text-slate-600 italic leading-relaxed">{property.betweenStreets}</p>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {property.latitude && property.longitude ? (
                                    <div className="space-y-4">
                                        <GoogleMapComponent 
                                            lat={property.latitude} 
                                            lng={property.longitude} 
                                            height="220px" 
                                            zoom={17}
                                            className="rounded-[1.5rem]"
                                        />
                                        <ITButton 
                                            variant="ghost" 
                                            className="w-full text-blue-500 hover:bg-blue-50 justify-start h-auto py-3 px-4 rounded-xl"
                                            onClick={() => window.open(`https://www.google.com/maps?q=${property.latitude},${property.longitude}`, '_blank')}
                                        >
                                            <FaMapMarkedAlt className="mr-3" />
                                            <div className="text-left">
                                                <p className="text-[10px] font-bold uppercase tracking-wider">Abrir Navegación</p>
                                                <p className="text-xs font-medium opacity-80 italic">Ver en Google Maps</p>
                                            </div>
                                        </ITButton>
                                    </div>
                                ) : (
                                    <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 flex items-start gap-4">
                                        <FaExclamationTriangle className="text-amber-500 mt-1" />
                                        <div>
                                            <p className="text-sm font-bold text-amber-900 leading-tight">Sin coordenadas GPS</p>
                                            <p className="text-xs text-amber-700 mt-1 leading-relaxed">No hay una geolocalización vinculada para visualizar el mapa.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Main Section: Residents Table */}
                    <div className="lg:col-span-2 space-y-8">
                        <section className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-gradient-to-r from-white to-slate-50/30">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500 shadow-inner">
                                        <FaUserFriends size={22} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-800">Censo de Residentes</h3>
                                        <p className="text-slate-400 text-sm">Gestiona los habitantes vinculados a este expediente</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="p-2">
                                <ITDataTable
                                    key={refreshKey}
                                    columns={residentColumns as any}
                                    fetchData={fetchResidents as any}
                                    defaultItemsPerPage={5}
                                    title=""
                                />
                            </div>
                        </section>
                    </div>

                </div>
            </main>

            {/* Modals */}
            <ITDialog 
                isOpen={isEditModalOpen} 
                onClose={() => setIsEditModalOpen(false)} 
                title="Editar Propiedad"
                className="w-[768px] max-w-[95vw]"
            >
                <PropertyForm 
                    initialData={property}
                    onSubmit={handleUpdate} 
                    onCancel={() => setIsEditModalOpen(false)} 
                />
            </ITDialog>

            {/* Resident Detail Modal - Premium Redesign */}
            <ITDialog
                isOpen={!!viewingResident}
                onClose={() => setViewingResident(null)}
                title=""
                className="w-[1100px] max-w-[95vw] !p-0 overflow-hidden rounded-[2.5rem]"
            >
                <div className="bg-slate-50 min-h-[500px] flex flex-col lg:flex-row">
                    {/* Left Column: Explorer Profile (40%) */}
                    <div className="lg:w-[40%] bg-white p-10 border-r border-slate-100 flex flex-col">
                        <div className="flex items-start justify-between mb-10">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center text-3xl font-black shadow-xl shadow-emerald-100 ring-4 ring-white">
                                    {viewingResident?.name?.charAt(0)}{viewingResident?.lastName?.charAt(0)}
                                </div>
                                <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-xl shadow-lg border-2 border-white">
                                    <FaUserShield size={14} />
                                </div>
                            </div>
                            <ITBadget size="medium" variant="filled" color={viewingResident?.role === 'OWNER' ? 'warning' : 'success'}>
                                {viewingResident?.role === 'OWNER' ? 'PROPIETARIO' : 'RESIDENTE'}
                            </ITBadget>
                        </div>

                        <div className="mb-10">
                            <h3 className="text-3xl font-black text-slate-800 tracking-tight leading-tight">
                                {viewingResident?.name} <br />
                                <span className="text-slate-400">{viewingResident?.lastName}</span>
                            </h3>
                            <div className="flex items-center gap-2 mt-3 bg-slate-50 self-start px-3 py-1.5 rounded-full border border-slate-100">
                                <span className="text-emerald-600 font-bold text-xs uppercase tracking-wider">@{viewingResident?.username}</span>
                            </div>
                        </div>

                        <div className="space-y-8 flex-1">
                            {/* Contact Section */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Canales de Comunicación</h4>
                                <div className="group flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-emerald-200 transition-all duration-300 hover:shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-emerald-500 shadow-sm border border-slate-50">
                                            <FaPhone size={16} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Móvil Personal</p>
                                            <p className="text-sm font-bold text-slate-700">{viewingResident?.residentProfile?.phoneNumber || 'No registrado'}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="group flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 transition-all duration-300 hover:shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-blue-500 shadow-sm border border-slate-50">
                                            <FaEnvelope size={16} />
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Correo Electrónico</p>
                                            <p className="text-sm font-bold text-slate-700 truncate max-w-[180px]">{viewingResident?.residentProfile?.email || 'No registrado'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Emergency Hub */}
                            <div className="relative p-6 rounded-[2rem] bg-gradient-to-br from-red-500 to-red-600 shadow-xl shadow-red-100 overflow-hidden">
                                <FaExclamationTriangle className="absolute -bottom-4 -right-4 text-white opacity-10" size={120} />
                                <h4 className="text-[10px] font-black text-red-100 uppercase tracking-[0.2em] mb-4">Protocolo Emergencia</h4>
                                <div className="space-y-4 relative z-10">
                                    <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
                                        <p className="text-[10px] font-bold text-red-100 uppercase tracking-widest opacity-80">Contacto Responsable</p>
                                        <p className="text-md font-bold text-white mb-1">{viewingResident?.residentProfile?.emergencyContact || 'SIN CONTACTO ASIGNADO'}</p>
                                        <div className="h-px bg-white/20 my-2" />
                                        <p className="text-[10px] font-bold text-red-100 uppercase tracking-widest opacity-80">Teléfono Auxilio</p>
                                        <p className="text-2xl font-black text-white tracking-widest leading-none mt-1">
                                            {viewingResident?.residentProfile?.emergencyPhone || '-- --- ----'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-10">
                            <ITButton variant="ghost" color="secondary" onClick={() => setViewingResident(null)} className="w-full text-slate-400 hover:text-slate-800 py-4 font-bold border-2 border-slate-100 hover:border-slate-300 rounded-2xl transition-all">
                                Cerrar Expediente de Propiedad
                            </ITButton>
                        </div>
                    </div>

                    {/* Right Column: Documentation (60%) */}
                    <div className="flex-1 p-10 lg:p-14 bg-gradient-to-b from-slate-50 to-white overflow-y-auto max-h-[85vh]">
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h4 className="text-xl font-black text-slate-800">Validación Documental</h4>
                                <p className="text-slate-400 text-sm font-medium">Expediente de identidad oficial y verificación</p>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center border border-indigo-100">
                                <FaIdCard size={20} />
                            </div>
                        </div>
                        
                        {viewingResident?.residentProfile?.ineFrontUrl || viewingResident?.residentProfile?.ineBackUrl ? (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                {[
                                    { label: 'Identificación Anversa', url: viewingResident.residentProfile.ineFrontUrl, id: 'front' },
                                    { label: 'Identificación Reversa', url: viewingResident.residentProfile.ineBackUrl, id: 'back' }
                                ].map((doc) => doc.url && (
                                    <div key={doc.id} className="group space-y-4">
                                        <div className="flex items-center justify-between px-2">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{doc.label}</span>
                                            <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">VERIFICADO</span>
                                        </div>
                                        <div className="relative aspect-[3/2] rounded-[2.5rem] overflow-hidden border-8 border-white p-1 bg-white shadow-2xl shadow-slate-200/50 group-hover:shadow-indigo-100 transition-all duration-500 group-hover:-translate-y-2">
                                            <div className="absolute inset-0 bg-slate-800 opacity-0 group-hover:opacity-10 transition-opacity z-10" />
                                            <img src={doc.url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="INE" />
                                            <div className="absolute top-4 right-4 z-20">
                                                <button 
                                                    onClick={() => window.open(doc.url, '_blank')}
                                                    className="w-10 h-10 rounded-full bg-white/90 backdrop-blur shadow-lg flex items-center justify-center text-slate-800 hover:bg-emerald-500 hover:text-white transition-all transform scale-0 group-hover:scale-100"
                                                >
                                                    <FaEye />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-200 text-slate-400 text-center shadow-inner">
                                <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6 ring-8 ring-slate-50/50">
                                    <FaIdCard className="text-slate-200 text-5xl" />
                                </div>
                                <h5 className="text-xl font-black text-slate-700">Sin Documentación</h5>
                                <p className="text-sm max-w-[280px] mt-2 font-medium">Este residente aún no ha completado la carga de su identificación oficial en el sistema.</p>
                            </div>
                        )}

                        {viewingResident?.residentProfile?.notes && (
                            <div className="mt-12 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full -mr-16 -mt-16 blur-3xl" />
                                <div className="flex items-center gap-3 mb-4 relative z-10">
                                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
                                        <FaFileAlt size={14} />
                                    </div>
                                    <h4 className="font-black text-slate-800 tracking-tight uppercase text-xs">Observaciones del Expediente</h4>
                                </div>
                                <p className="text-slate-500 leading-relaxed text-sm font-medium relative z-10 italic">
                                    "{viewingResident.residentProfile.notes}"
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </ITDialog>
        </div>
    );
};

export default PropertyDetailPage;
