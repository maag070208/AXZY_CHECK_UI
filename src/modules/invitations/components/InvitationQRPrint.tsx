import React, { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Invitation } from "../services/invitations.service";
import LOGO from "@assets/logo.svg";
import { ITBadget, ITButton, ITCard, ITFlex, ITGrid, ITImage, ITText } from "@axzydev/axzy_ui_system";
import { FaPrint, FaWhatsapp } from "react-icons/fa";
import { toBlob } from "html-to-image";
import { useDispatch } from "react-redux";
import { showToast } from "@app/core/store/toast/toast.slice";

interface Props {
  invitation: Invitation;
  onClose: () => void;
}

const statusColor = (status: string) => {
  switch (status) {
    case "PENDING": return "warning";
    case "ENTERED": return "success";
    case "EXITED": return "secondary";
    case "CANCELLED":
    case "EXPIRED": return "danger";
    default: return "secondary";
  }
};

const statusLabel = (status: string) => {
  switch (status) {
    case "PENDING": return "En espera";
    case "ENTERED": return "Dentro";
    case "EXITED": return "Completado";
    case "CANCELLED": return "Revocado";
    case "EXPIRED": return "Expirado";
    default: return status;
  }
};

export const InvitationQRPrint: React.FC<Props> = ({ invitation, onClose }) => {
  const dispatch = useDispatch();
  const ticketRef = useRef<HTMLDivElement>(null);
  const sharingRef = useRef(false);
  const [qrUrl, setQrUrl] = useState<string>("");
  const [shareBlob, setShareBlob] = useState<Blob | null>(null);
  const [shareNotice, setShareNotice] = useState<"copied" | "downloaded" | null>(null);

  useEffect(() => {
    QRCode.toDataURL(invitation.code, {
      width: 400,
      margin: 2,
      color: { dark: "#020617", light: "#ffffff" },
    })
      .then(setQrUrl)
      .catch(console.error);
  }, [invitation.code]);

  const handlePrint = () => window.print();
  const buildPassImage = async (): Promise<Blob | null> => {
    if (!ticketRef.current) return null;
    return await toBlob(ticketRef.current, {
      pixelRatio: 2,
      cacheBust: true,
      backgroundColor: "#eef2f6",
    });
  };

  useEffect(() => {
    if (!qrUrl) return;
    let active = true;
    const timer = setTimeout(() => {
      buildPassImage()
        .then((blob) => {
          if (active) setShareBlob(blob);
        })
        .catch(() => undefined);
    }, 700);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [qrUrl, invitation.code]);

  const whatsAppMessage = () =>
    [
      "Pase de acceso CheckApp",
      `Invitado: ${invitation.guestName}`,
      `Código: ${invitation.code}`,
      `Destino: ${invitation.property?.identifier ?? ""} ${invitation.property?.name ?? ""}`.trim(),
      `Vigencia: ${from} al ${until}`,
    ].join("\n");

  const openWhatsApp = () => {
    setShareNotice(null);
    window.open(`https://wa.me/?text=${encodeURIComponent(whatsAppMessage())}`, "_blank", "noopener");
  };

  const handleWhatsApp = async () => {
    if (sharingRef.current) return;
    sharingRef.current = true;
    const message = whatsAppMessage();

    try {
      const blob = shareBlob ?? (await buildPassImage());
      if (blob) {
        const file = new File([blob], `pase-${invitation.code}.png`, { type: "image/png" });
        const nav = navigator as Navigator & {
          share?: (data?: ShareData) => Promise<void>;
        };

        const isMobile =
          /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
          window.matchMedia("(pointer: coarse)").matches;

        // En móvil abre la hoja nativa y permite mandar la imagen a WhatsApp.
        // En desktop se evita: el "Copiar" del share sheet duplica la imagen.
        if (isMobile && nav.share) {
          try {
            await nav.share({ files: [file], text: message, title: "Pase de acceso" } as ShareData);
            return;
          } catch (error: any) {
            if (error?.name === "AbortError") return;
          }
        }

        // En desktop WhatsApp Web no acepta archivos por URL: copiamos la imagen
        // al portapapeles para que se pegue directo en el chat.
        if (navigator.clipboard && typeof ClipboardItem !== "undefined") {
          try {
            await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
            dispatch(showToast({ message: "Imagen copiada. Pégala en WhatsApp con Ctrl+V.", type: "info" }));
            setShareNotice("copied");
            return;
          } catch {
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `pase-${invitation.code}.png`;
            link.click();
            URL.revokeObjectURL(url);
            dispatch(showToast({ message: "Imagen descargada. Adjúntala en WhatsApp.", type: "info" }));
            setShareNotice("downloaded");
            return;
          }
        } else {
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `pase-${invitation.code}.png`;
          link.click();
          URL.revokeObjectURL(url);
          dispatch(showToast({ message: "Imagen descargada. Adjúntala en WhatsApp.", type: "info" }));
          setShareNotice("downloaded");
          return;
        }
      }
    } catch (error: any) {
      if (error?.name === "AbortError") return;
    } finally {
      sharingRef.current = false;
    }

    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener");
  };

  const from = new Date(invitation.validFrom).toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
  const until = new Date(invitation.validUntil).toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
  const isProv = invitation.type?.name === "PROV";

  return (
    <ITFlex direction="column" align="center" gap={4} className="w-full bg-slate-100 p-3 sm:p-4">
      <ITFlex
        ref={ticketRef}
        direction="column"
        className="ticket w-full max-w-[360px] overflow-hidden rounded-3xl bg-white shadow-2xl print:shadow-none print:w-[380px]"
      >
        <ITFlex direction="column" className="bg-gradient-to-br from-emerald-700 to-emerald-500 p-5 text-white">
          <ITFlex align="start" justify="between" gap={2}>
            <ITImage src={LOGO} alt="CheckApp" className="h-8 w-auto brightness-0 invert" />
            <ITBadget color={isProv ? "primary" : "secondary"} variant="filled" size="sm">
              {isProv ? "Proveedor" : "Visita"}
            </ITBadget>
          </ITFlex>
          <ITText as="h2" className="mt-4 text-xl font-black uppercase tracking-wide">
            Pase de acceso
          </ITText>
          <ITText as="p" className="text-[9px] font-bold uppercase tracking-[0.25em] text-emerald-100/80">
            CheckApp Security
          </ITText>
        </ITFlex>

        <ITFlex direction="column" gap={3} className="p-5">
          <ITFlex justify="center">
            <ITFlex align="center" justify="center" className="rounded-2xl bg-slate-50 p-2.5">
              {qrUrl ? (
                <ITImage src={qrUrl} alt={`QR ${invitation.code}`} fit="contain" className="h-40 w-40 sm:h-44 sm:w-44" />
              ) : (
                <ITText as="p" className="flex h-40 w-40 items-center justify-center text-xs text-slate-400">
                  Generando QR...
                </ITText>
              )}
            </ITFlex>
          </ITFlex>

          <ITFlex justify="center">
            <ITFlex className="rounded-lg bg-slate-100 px-4 py-1.5">
              <ITText as="span" className="font-mono text-sm font-black tracking-[0.18em] text-slate-700">
                {invitation.code}
              </ITText>
            </ITFlex>
          </ITFlex>

          <ITFlex direction="column" align="center" gap={0.5}>
            <ITText as="p" className="text-[9px] font-black uppercase tracking-widest text-slate-400">Invitado</ITText>
            <ITText as="p" className="text-center text-lg font-black leading-tight text-slate-900">{invitation.guestName}</ITText>
          </ITFlex>

          <ITGrid container columns={12} spacing={2}>
            <ITGrid item xs={6}>
              <ITFlex direction="column" gap={0.5} className="h-full rounded-xl bg-slate-50 p-2.5">
                <ITText as="p" className="text-[8px] font-black uppercase tracking-widest text-slate-400">Destino</ITText>
                <ITText as="p" className="text-xs font-bold text-slate-800">{invitation.property?.identifier || "—"}</ITText>
                <ITText as="p" className="text-[10px] text-slate-500">{invitation.property?.name || "Sin propiedad"}</ITText>
              </ITFlex>
            </ITGrid>
            <ITGrid item xs={6}>
              <ITFlex direction="column" gap={0.5} className="h-full rounded-xl bg-slate-50 p-2.5">
                <ITText as="p" className="text-[8px] font-black uppercase tracking-widest text-slate-400">Autorizó</ITText>
                <ITText as="p" className="text-xs font-bold text-slate-800">
                  {invitation.createdBy?.name} {invitation.createdBy?.lastName}
                </ITText>
              </ITFlex>
            </ITGrid>
            <ITGrid item xs={6}>
              <ITFlex direction="column" gap={0.5} className="h-full rounded-xl bg-slate-50 p-2.5">
                <ITText as="p" className="text-[8px] font-black uppercase tracking-widest text-slate-400">Vigencia</ITText>
                <ITText as="p" className="text-xs font-bold text-slate-800">{from} → {until}</ITText>
              </ITFlex>
            </ITGrid>
            <ITGrid item xs={6}>
              <ITFlex direction="column" gap={0.5} className="h-full rounded-xl bg-slate-50 p-2.5">
                <ITText as="p" className="text-[8px] font-black uppercase tracking-widest text-slate-400">Estado</ITText>
                <ITBadget color={statusColor(invitation.status) as any} variant="filled" size="sm">
                  {statusLabel(invitation.status)}
                </ITBadget>
              </ITFlex>
            </ITGrid>
          </ITGrid>

          <ITText as="p" className="text-center text-[10px] font-medium text-slate-400">
            Presentar este código en caseta de seguridad.
          </ITText>
        </ITFlex>
      </ITFlex>

      {shareNotice && (
        <ITCard className="w-full max-w-[360px] rounded-2xl border-0! bg-emerald-50! shadow-none!" contentClassName="space-y-2 p-4!">
          <ITText as="p" className="text-sm font-black text-emerald-900 dark:text-emerald-200">
            {shareNotice === "copied" ? "Imagen copiada" : "Imagen descargada"}
          </ITText>
          <ITText as="p" className="text-xs leading-relaxed text-emerald-800">
            {shareNotice === "copied"
              ? "La imagen del pase ya está en el portapapeles. Abre WhatsApp y pégala con Ctrl+V."
              : "La imagen se descargó. Abre WhatsApp y adjúntala al chat."}
          </ITText>
          <ITFlex justify="end" gap={2}>
            <ITButton variant="outlined" color="secondary" size="sm" onClick={() => setShareNotice(null)}>
              Cerrar
            </ITButton>
            <ITButton color="primary" size="sm" onClick={openWhatsApp}>
              Abrir WhatsApp
            </ITButton>
          </ITFlex>
        </ITCard>
      )}

      <ITGrid container columns={12} spacing={2} className="w-full max-w-[360px] print:hidden">
        <ITGrid item xs={4}>
          <ITButton color="success" icon={<FaWhatsapp />} onClick={handleWhatsApp} className="w-full">
            WhatsApp
          </ITButton>
        </ITGrid>
        <ITGrid item xs={4}>
          <ITButton color="primary" icon={<FaPrint />} onClick={handlePrint} className="w-full">
            PDF
          </ITButton>
        </ITGrid>
        <ITGrid item xs={4}>
          <ITButton variant="outlined" color="secondary" onClick={onClose} className="w-full">
            Cerrar
          </ITButton>
        </ITGrid>
      </ITGrid>

      <style>{`
        @media print {
          @page { size: portrait; margin: 0; }
          html, body { height: auto !important; min-height: 100% !important; background: #ffffff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body * { visibility: hidden; }
          .ticket, .ticket * { visibility: visible; }
          .ticket { position: fixed !important; left: 50% !important; top: 2cm !important; transform: translateX(-50%) !important; width: 380px !important; box-shadow: none !important; border-radius: 12px !important; margin: 0 !important; z-index: 999999 !important; background: white !important; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </ITFlex>
  );
};
