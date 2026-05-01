import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Invitation } from "../services/invitations.service";
import LOGO from "@assets/logo.png";

interface Props {
  invitation: Invitation;
  onClose: () => void;
}

export const InvitationQRPrint: React.FC<Props> = ({ invitation, onClose }) => {
  const [qrUrl, setQrUrl] = useState<string>("");

  useEffect(() => {
    QRCode.toDataURL(invitation.code, {
      width: 400,
      margin: 2,
      color: {
        dark: "#020617",
        light: "#ffffff",
      },
    })
      .then(setQrUrl)
      .catch(console.error);
  }, [invitation.code]);

  const handlePrint = () => window.print();

  const validDate = new Date(invitation.validUntil).toLocaleDateString();

  return (
    <div className="flex flex-col items-center justify-center w-full bg-slate-100 p-2 sm:p-4 overflow-y-auto">

      {/* CARD */}
      <div className="ticket w-full max-w-[320px] sm:max-w-[340px] h-auto bg-white rounded-3xl shadow-2xl border border-slate-200 print:shadow-none print:border-none print:max-w-none print:w-[380px] relative">

        {/* HEADER */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-4 sm:px-5 py-4 flex flex-col items-center text-center relative rounded-t-3xl print:bg-emerald-600 print:text-white print:break-inside-avoid print:exact-color">
          
          <img
            src={LOGO}
            alt="CheckApp"
            className="h-10 sm:h-12 mb-1.5 brightness-0 invert"
          />

          <h1 className="font-black tracking-wide text-base sm:text-lg uppercase">
            Pase de Acceso
          </h1>

          <p className="text-[9px] sm:text-[10px] tracking-widest opacity-90 mt-0.5">
            CHECKAPP SECURITY
          </p>

          <div className="absolute right-3 sm:right-4 top-3 sm:top-4 text-[8px] sm:text-[9px] font-bold bg-white/20 px-2 py-1 rounded-md uppercase border border-white/20">
            {invitation.type?.name === "PROV"
              ? "Proveedor"
              : "Visita"}
          </div>
        </div>

        {/* BODY */}
        <div className="px-5 py-4 flex flex-col items-center">

          {/* QR */}
          <div className="bg-white border-2 border-slate-100 shadow-inner rounded-2xl p-2 mb-3 print:shadow-none print:border-none print:mb-2 print:p-0">
            {qrUrl ? (
              <img src={qrUrl} alt="QR" className="w-36 h-36 sm:w-44 sm:h-44" />
            ) : (
              <div className="w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center text-slate-400 text-xs">
                Generando QR...
              </div>
            )}
          </div>

          {/* CODE */}
          <div className="font-mono font-black tracking-[4px] text-sm sm:text-base bg-slate-100 border border-slate-200 rounded-lg px-4 py-1.5 mb-3 print:bg-white print:border-none print:text-lg">
            {invitation.code}
          </div>

          {/* INVITED */}
          <div className="text-center mb-3 w-full">
            <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">
              Invitado
            </p>
            <p className="text-base sm:text-lg font-black text-slate-800 break-words line-clamp-2 leading-tight">
              {invitation.guestName}
            </p>
          </div>

          {/* DESTINATION */}
          <div className="text-center border-t border-dashed pt-3 w-full print:border-slate-300">
            <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">
              Destino
            </p>

            <p className="font-bold text-slate-700 text-xs sm:text-sm leading-tight">
              {invitation.property?.name || "Sin asignar"}
            </p>

            <p className="text-[9px] sm:text-[10px] text-slate-500 mt-1">
              Autorizó: {invitation.createdBy?.name}{" "}
              {invitation.createdBy?.lastName}
            </p>
          </div>

          {/* VALID DATE */}
          <div className="mt-4 sm:mt-5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] sm:text-[10px] font-bold px-3 py-2 rounded-lg uppercase tracking-widest w-full text-center print:border-none print:bg-transparent print:text-slate-800">
            Válido hasta {validDate}
          </div>
        </div>

        {/* FOOTER */}
        <div className="bg-slate-50 text-center text-[8px] sm:text-[9px] text-slate-500 py-2 border-t rounded-b-3xl print:bg-transparent print:border-none print:pt-0">
          Presentar este código en caseta de seguridad
        </div>
      </div>

      {/* ACTIONS */}
      <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 mt-6 sm:mt-8 w-full max-w-[380px] print:hidden pb-4">

        <button
          onClick={onClose}
          className="px-6 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 font-semibold w-full sm:w-auto"
        >
          Cerrar
        </button>

        <button
          onClick={handlePrint}
          className="px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 w-full sm:w-auto flex-1 flex justify-center"
        >
          Imprimir / Guardar PDF
        </button>

      </div>

      {/* PRINT STYLES */}
      <style>{`
        @media print {
          @page {
            size: portrait;
            margin: 0;
          }

          html, body {
            height: auto !important;
            min-height: 100% !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          body * {
            visibility: hidden;
          }

          .ticket, .ticket * {
            visibility: visible;
          }

          .ticket {
            position: fixed !important;
            left: 50% !important;
            top: 2cm !important;
            transform: translateX(-50%) !important;
            width: 380px !important;
            box-shadow: none !important;
            border-radius: 12px !important;
            border: 1px solid #e2e8f0 !important;
            margin: 0 !important;
            z-index: 999999 !important;
            background: white !important;
          }

          .print\\:exact-color {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};