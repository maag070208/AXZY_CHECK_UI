import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { jsPDF } from "jspdf";
import { FaDownload, FaTimes } from "react-icons/fa";

interface PrintQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  route: any;
}

interface QrItem {
  id: number;
  name: string;
  dataUrl: string;
}

/** @description Descarga un PDF (A4) con todos los QR de la ruta. */
const downloadPdf = (title: string, qrCodes: QrItem[]) => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = 210;
  const pageH = 297;
  const margin = 10;
  const cols = 3;
  const cellW = (pageW - margin * 2) / cols;
  const qrSize = 45;
  const cellH = qrSize + 14;
  const headerH = 22;
  const rowsPerPage = Math.floor((pageH - headerH - margin) / cellH);
  const itemsPerPage = cols * rowsPerPage;

  const drawHeader = () => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(title, pageW / 2, 14, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`${qrCodes.length} puntos de control`, pageW / 2, 20, { align: "center" });
  };

  const addQrAt = (qr: QrItem, x: number, y: number) => {
    doc.addImage(qr.dataUrl, "PNG", x, y, qrSize, qrSize);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(qr.name, x + cellW / 2, y + qrSize + 6, { align: "center", maxWidth: cellW - 4 });
  };

  drawHeader();

  qrCodes.forEach((qr, i) => {
    const indexInPage = i % itemsPerPage;
    if (i > 0 && indexInPage === 0) {
      doc.addPage();
      drawHeader();
    }
    const col = indexInPage % cols;
    const row = Math.floor(indexInPage / cols);
    const cx = margin + col * cellW;
    const cy = headerH + row * cellH;
    addQrAt(qr, cx + (cellW - qrSize) / 2, cy);
  });

  doc.save(`${title || "rutas"}-qr.pdf`);
};

/**
 * @description Modal que genera los códigos QR de todos los puntos de una ruta
 * y permite imprimirlos en una sola hoja (varias por página).
 */
const PrintQrModal = ({ isOpen, onClose, route }: PrintQrModalProps) => {
  const [qrCodes, setQrCodes] = useState<QrItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !route) return;
    let active = true;
    setLoading(true);

    const locations = route.recurringLocations || [];
    const tasks = locations.map(async (loc: any) => {
      const locationId = loc.location?.id ?? loc.locationId;
      const text = JSON.stringify({ id: Number(locationId) });
      const dataUrl = await QRCode.toDataURL(text, { width: 240, margin: 1 });
      return {
        id: loc.id,
        name: loc.location?.name || `Punto ${locationId}`,
        dataUrl,
      };
    });

    Promise.all(tasks)
      .then(items => {
        if (active) {
          setQrCodes(items);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, route]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      {/* MODAL EN PANTALLA */}
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Imprimir QR</h3>
            <p className="text-xs text-slate-400 font-medium">{route?.title}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
          >
            <FaTimes size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {loading ? (
            <p className="text-center text-slate-400 py-16">Generando códigos QR...</p>
          ) : qrCodes.length === 0 ? (
            <p className="text-center text-slate-400 py-16">Esta ruta no tiene puntos registrados.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {qrCodes.map(qr => (
                <div key={qr.id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col items-center gap-2">
                  <img src={qr.dataUrl} alt={qr.name} className="w-full max-w-[180px]" />
                  <p className="text-xs font-bold text-slate-700 text-center uppercase">{qr.name}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-white">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => downloadPdf(route?.title || "rutas", qrCodes)}
            disabled={loading || qrCodes.length === 0}
            className="px-5 py-2.5 rounded-xl bg-[#065911] text-white text-sm font-bold hover:bg-[#04400c] flex items-center gap-2 disabled:opacity-50 transition-colors"
          >
            <FaDownload /> Descargar PDF
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default PrintQrModal;
