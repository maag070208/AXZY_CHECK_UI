import { ITBadget, ITButton, ITCard, ITDataTable, ITDialog, ITFlex, ITGrid, ITInput, ITPage, ITSearchSelect, ITText, ITTextarea } from "@axzydev/axzy_ui_system";
import { FaPlus, FaQrcode, FaIdBadge, FaBan, FaSignInAlt, FaSignOutAlt, FaTimes, FaSync } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useCallback, useMemo, useState } from "react";
import { showToast } from "@app/core/store/toast/toast.slice";
import { getPaginatedInvitations, createInvitation, updateInvitationStatus, Invitation } from "../services/invitations.service";
import { invitationTypeLabel } from "../invitation-type-label";
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
    const [revokeReason, setRevokeReason] = useState("");
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
        if (updatingStatusOf.status === "CANCELLED" && !revokeReason.trim()) {
            dispatch(showToast({ message: "Escribe el motivo de la revocación", type: "warning" }));
            return;
        }
        try {
            const res = await updateInvitationStatus(updatingStatusOf.inv.id, updatingStatusOf.status, revokeReason.trim() || undefined);
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
            case 'PENDING': return <ITBadget color="warning" variant="filled" size="sm">En espera</ITBadget>;
            case 'ENTERED': return <ITBadget color="success" variant="filled" size="sm">Dentro</ITBadget>;
            case 'EXITED': return <ITBadget color="secondary" variant="filled" size="sm">Completado</ITBadget>;
            case 'EXPIRED': return <ITBadget color="danger" variant="filled" size="sm">Expirada</ITBadget>;
            case 'CANCELLED': return <ITBadget color="danger" variant="filled" size="sm">Revocada</ITBadget>;
            default: return <ITBadget color="secondary" variant="filled" size="sm">{status}</ITBadget>;
        }
    };

    const columns = useMemo(() => [
        { 
            key: "code", 
            label: "Pase", 
            type: "string", 
            render: (row: Invitation) => (
                <ITBadget color="secondary" variant="filled" size="sm" className="font-mono">
                    {row.code}
                </ITBadget>
            )
        },
        { 
            key: "guestName", 
            label: "Invitado Destino", 
            type: "string", 
            sortable: false,
            render: (row: Invitation) => (
                <ITFlex align="center" gap={1} className="min-w-0">
                    <ITText as="span" className="truncate font-bold text-slate-800 dark:text-slate-100">
                        {row.guestName}
                    </ITText>
                    <ITText as="span" className="shrink-0 text-[10px] text-slate-400">
                        {row.property?.identifier}
                    </ITText>
                </ITFlex>
            )
        },
        {
            key: "type",
            label: "Tipo",
            type: "string",
            render: (row: Invitation) => (
                <ITBadget color={row.type?.name === "PROV" ? "primary" : "secondary"} variant="filled" size="sm">
                    {invitationTypeLabel(row.type)}
                </ITBadget>
            )
        },
        { 
            key: "validRange", 
            label: "Vigencia", 
            type: "string",
            render: (row: Invitation) => (
                <ITText as="span" className="text-xs font-medium text-slate-600">
                    {dayjs(row.validFrom).format("DD MMM")} → {dayjs(row.validUntil).format("DD MMM")}
                </ITText>
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
            label: "Registro",
            type: "string",
            render: (row: Invitation) => (
                <ITText as="span" className="whitespace-nowrap text-[11px] text-slate-500">
                    In: {row.entryTime ? dayjs(row.entryTime).format("DD MMM HH:mm") : "—"} · Out: {row.exitTime ? dayjs(row.exitTime).format("DD MMM HH:mm") : "—"}
                </ITText>
            )
        },
        {
            key: "actions",
            label: "Acciones",
            type: "actions",
            actions: (row: Invitation) => (
                <ITFlex align="center" gap={2}>
                    <ITButton
                        onClick={() => setViewingQr(row)}
                        size="md"
                        variant="icon-only"
                        color="primary"
                        icon={<FaQrcode />}
                        ariaLabel="Ver gafete QR"
                        title="Ver gafete QR"
                    />
                    {row.status === 'PENDING' && (
                        <>
                            <ITButton
                                onClick={() => { setScanningCode({inv: row, type: 'ENTERED'}); setCodeInput("AXZ-"); }}
                                size="md"
                                variant="icon-only"
                                color="secondary"
                                icon={<FaSignInAlt />}
                                ariaLabel="Aprobar ingreso"
                                title="Aprobar ingreso"
                            />
                            <ITButton
                                onClick={() => { setRevokeReason(""); setUpdatingStatusOf({inv: row, status: 'CANCELLED'}); }}
                                size="md"
                                variant="icon-only"
                                color="danger"
                                icon={<FaBan />}
                                ariaLabel="Revocar acceso"
                                title="Revocar acceso"
                            />
                        </>
                    )}
                    {row.status === 'ENTERED' && (
                        <ITButton
                            onClick={() => { setScanningCode({inv: row, type: 'EXITED'}); setCodeInput("AXZ-"); }}
                            size="md"
                            variant="icon-only"
                            color="secondary"
                            icon={<FaSignOutAlt />}
                            ariaLabel="Aprobar salida"
                            title="Aprobar salida"
                        />
                    )}
                </ITFlex>
            )
        }
    ], []);

    return (
        <ITPage
      className="m-0! mx-auto! max-w-[1600px]! px-6! bg-slate-50 mb-8"
      noPadding
      title="Directorio de Invitados"
      breadcrumbs={[{ label: "Inicio", href: "#/home" }, { label: "Directorio de Invitados" }]}
      description="Generación y control de pases de acceso mediante código QR"
      icon={<FaIdBadge size={20} />}
      actions={
        <ITButton color="primary" size="md" icon={<FaPlus />} onClick={() => setIsCreateModalOpen(true)}>
          Crear pase
        </ITButton>
      }
    >
      <ITFlex direction="column" gap={5} className="w-full pb-10 pt-5">
        <ITCard className="rounded-3xl" contentClassName="p-4!">
          <ITGrid container columns={12} spacing={3} className="items-end">
            <ITGrid item xs={12} md={6}>
              <ITFlex direction="column" gap={1}>
                <ITText as="p" className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  Buscar pase
                </ITText>
                <ITFlex align="center" gap={1}>
                  <ITInput
                    placeholder="Buscar código o invitado..."
                    name="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onBlur={() => {}}
                    iconLeft={<FaQrcode />}
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
              </ITFlex>
            </ITGrid>
            <ITGrid item xs={12} md={4}>
              <ITFlex direction="column" gap={1}>
                <ITText as="p" className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  Estado
                </ITText>
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
                />
              </ITFlex>
            </ITGrid>
            <ITGrid item xs={12} md={2}>
              <ITFlex align="end" justify="end" className="h-full">
                <ITButton
                  onClick={() => setRefreshKey(prev => prev + 1)}
                  color="secondary"
                  variant="icon-only"
                  size="md"
                  icon={<FaSync />}
                  ariaLabel="Refrescar datos"
                  title="Refrescar datos"
                />
              </ITFlex>
            </ITGrid>
          </ITGrid>
        </ITCard>

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
          externalFilters={externalFilters as any}
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
                <ITFlex direction="column" gap={4}>
                    <ITText as="p" className="text-sm text-slate-600 dark:text-slate-300">
                        Estás a punto de alterar el estado del pase{" "}
                        <ITText as="span" className="font-bold">{updatingStatusOf?.inv.code}</ITText> a{" "}
                        <ITText as="span" className="font-bold">REVOCADO</ITText>. El acceso con este código QR
                        quedará denegado permanentemente en caseta. ¿Proceder?
                    </ITText>
                    <ITTextarea
                        name="revokeReason"
                        label="Motivo de la revocación"
                        rows={3}
                        value={revokeReason}
                        onChange={(value: string) => setRevokeReason(value)}
                        placeholder="Ej. El invitado canceló, datos incorrectos, intento de acceso no autorizado..."
                    />
                    <ITFlex justify="end" gap={2}>
                        <ITButton variant="outlined" color="secondary" onClick={() => setUpdatingStatusOf(null)}>
                            Volver
                        </ITButton>
                        <ITButton color="danger" onClick={confirmStatusUpdate} disabled={!revokeReason.trim()}>
                            Revocar pase
                        </ITButton>
                    </ITFlex>
                </ITFlex>
            </ITDialog>

            <ITDialog
                isOpen={!!scanningCode}
                onClose={() => setScanningCode(null)}
                title={scanningCode?.type === "ENTERED" ? "Validación de acceso" : "Validación de salida"}
                className="max-w-lg w-full"
            >
                {scanningCode && (
                    <ITFlex direction="column" gap={4}>
                        <ITCard className="rounded-2xl border-0! bg-[var(--color-primary-50)]! shadow-none!" contentClassName="p-4!">
                            <ITFlex align="center" gap={3}>
                                <ITFlex
                                    align="center"
                                    justify="center"
                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-black text-white"
                                >
                                    {scanningCode.inv.guestName.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase()}
                                </ITFlex>
                                <ITFlex direction="column" className="min-w-0 flex-1">
                                    <ITText as="p" className="text-[9px] font-black uppercase tracking-widest text-[var(--color-primary-700)]">
                                        Invitado autorizado
                                    </ITText>
                                    <ITText as="p" className="truncate text-lg font-black text-[var(--color-primary)] dark:text-emerald-100">
                                        {scanningCode.inv.guestName}
                                    </ITText>
                                </ITFlex>
                                <ITBadget color={scanningCode.inv.type?.name === "PROV" ? "primary" : "secondary"} variant="filled" size="sm">
                                    {scanningCode.inv.type?.name === "PROV" ? "Proveedor" : "Visita"}
                                </ITBadget>
                            </ITFlex>

                            <ITGrid container columns={12} spacing={2} className="mt-3">
                                <ITGrid item xs={6}>
                                    <ITFlex direction="column" gap={0.5} className="rounded-xl bg-white/70 p-2.5 dark:bg-slate-900/40">
                                        <ITText as="p" className="text-[8px] font-black uppercase tracking-widest text-slate-400">Destino</ITText>
                                        <ITText as="p" className="text-xs font-bold text-slate-800 dark:text-slate-100">{scanningCode.inv.property?.identifier}</ITText>
                                        <ITText as="p" className="text-[10px] text-slate-500">{scanningCode.inv.property?.name}</ITText>
                                    </ITFlex>
                                </ITGrid>
                                <ITGrid item xs={6}>
                                    <ITFlex direction="column" gap={0.5} className="rounded-xl bg-white/70 p-2.5 dark:bg-slate-900/40">
                                        <ITText as="p" className="text-[8px] font-black uppercase tracking-widest text-slate-400">Vigencia</ITText>
                                        <ITText as="p" className="text-xs font-bold text-slate-800 dark:text-slate-100">
                                            {dayjs(scanningCode.inv.validFrom).format("DD MMM")} → {dayjs(scanningCode.inv.validUntil).format("DD MMM")}
                                        </ITText>
                                    </ITFlex>
                                </ITGrid>
                                <ITGrid item xs={6}>
                                    <ITFlex direction="column" gap={0.5} className="rounded-xl bg-white/70 p-2.5 dark:bg-slate-900/40">
                                        <ITText as="p" className="text-[8px] font-black uppercase tracking-widest text-slate-400">Autorizó</ITText>
                                        <ITText as="p" className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">
                                            {scanningCode.inv.createdBy?.name} {scanningCode.inv.createdBy?.lastName}
                                        </ITText>
                                    </ITFlex>
                                </ITGrid>
                                <ITGrid item xs={6}>
                                    <ITFlex direction="column" gap={0.5} className="rounded-xl bg-white/70 p-2.5 dark:bg-slate-900/40">
                                        <ITText as="p" className="text-[8px] font-black uppercase tracking-widest text-slate-400">Acción</ITText>
                                        <ITBadget color={scanningCode.type === "ENTERED" ? "success" : "secondary"} variant="filled" size="sm">
                                            {scanningCode.type === "ENTERED" ? "Dar acceso" : "Registrar salida"}
                                        </ITBadget>
                                    </ITFlex>
                                </ITGrid>
                            </ITGrid>
                        </ITCard>

                        {scanningCode.inv.notes && (
                            <ITCard className="rounded-2xl border-0! bg-amber-50! shadow-none!" contentClassName="p-3!">
                                <ITText as="p" className="text-[8px] font-black uppercase tracking-widest text-amber-700">Notas / vehículo</ITText>
                                <ITText as="p" className="mt-1 text-xs text-amber-800">{scanningCode.inv.notes}</ITText>
                            </ITCard>
                        )}

                        <ITCard className="rounded-2xl" contentClassName="p-4!">
                            <ITFlex direction="column" align="center" gap={3}>
                                <ITFlex
                                    align="center"
                                    justify="center"
                                    className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-primary-50)] text-[var(--color-primary)] dark:bg-emerald-950/30 dark:text-emerald-400"
                                >
                                    <FaQrcode size={20} />
                                </ITFlex>
                                <ITText as="p" className="text-center text-xs text-slate-500">
                                    Escanea o teclea el código del pase para validar el acceso.
                                </ITText>
                                <ITInput
                                    name="code"
                                    value={codeInput}
                                    onChange={(e) => {
                                        let val = e.target.value.toUpperCase();
                                        if (!val.startsWith("AXZ-")) val = "AXZ-";
                                        setCodeInput(val);
                                    }}
                                    onKeyDown={(e: any) => {
                                        if (e.key === "Enter") confirmScanningCode();
                                    }}
                                    placeholder="AXZ-XXXX"
                                    className="w-full text-center font-mono text-xl font-black tracking-[0.2em]"
                                />
                                <ITFlex justify="end" gap={2} className="w-full">
                                    <ITButton variant="outlined" color="secondary" onClick={() => setScanningCode(null)}>
                                        Cancelar
                                    </ITButton>
                                    <ITButton color="primary" onClick={confirmScanningCode}>
                                        {scanningCode.type === "ENTERED" ? "Autorizar acceso" : "Registrar salida"}
                                    </ITButton>
                                </ITFlex>
                            </ITFlex>
                        </ITCard>
                    </ITFlex>
                )}
            </ITDialog>

        </ITPage>
    );
};

export default InvitationsPage;
