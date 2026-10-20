import { FileTypeEnum, ITButton, ITDialog, ITDropfile } from "@axzydev/axzy_ui_system";
import { useState } from "react";
import { ImportResult, ImportRow, importProperties, parseImportCsv } from "./occupancy.service";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onDone: () => void;
}

const TEMPLATE = "identifier,name,mainStreet,kind,occupancy,floor,unitNumber\nCASA-001,Casa 1,Calle Aries,HOUSE,VACANT,,\nDEP-101,Depto 101,Av. Central,APARTMENT,VACANT,1,101";

/** Importación de propiedades desde CSV (T-A1-07). Las filas inválidas se reportan; las válidas se crean. */
export const ImportPropertiesModal = ({ isOpen, onClose, onDone }: Props) => {
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setRows([]);
    setFileName("");
    setResult(null);
    setError(null);
  };

  const onFile = async (file: File | undefined) => {
    reset();
    if (!file) return;
    setFileName(file.name);
    setRows(parseImportCsv(await file.text()));
  };

  const send = async () => {
    setBusy(true);
    setError(null);
    try {
      const res: any = await importProperties(rows);
      if (res.success === false) setError(res.messages?.[0] ?? "No se pudo importar");
      else {
        setResult(res.data);
        if (res.data.created > 0) onDone();
      }
    } catch (e: any) {
      setError(e?.messages?.[0] ?? "No se pudo importar");
    } finally {
      setBusy(false);
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "propiedades-plantilla.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ITDialog isOpen={isOpen} onClose={() => { reset(); onClose(); }} title="Importar propiedades (CSV)" className="w-[680px] max-w-[95vw]">
      <div className="space-y-4 p-2">
        <p className="text-sm text-slate-500">
          Columnas: identifier, name, mainStreet, kind (HOUSE, APARTMENT, COMMERCIAL, LOT, COMMON), occupancy (VACANT, OWNER_OCCUPIED, …), floor, unitNumber.
        </p>
        <ITButton variant="ghost" onClick={downloadTemplate}>Descargar plantilla</ITButton>
        <ITDropfile
          view="drop"
          acceptedFileTypes={[FileTypeEnum.CSV]}
          onFileSelect={(file) => void onFile(file ?? undefined)}
        />
        {fileName && <p className="text-sm text-slate-600">{fileName}: {rows.length} fila(s)</p>}

        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

        {result && (
          <div className="space-y-2 text-sm">
            <p className="text-emerald-700 font-semibold">Creadas: {result.created}</p>
            {result.errors.length > 0 && (
              <ul className="list-disc pl-5 text-red-700">
                {result.errors.map((e) => (
                  <li key={e.row}>Fila {e.row}: {e.messages.join("; ")}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <ITButton variant="outlined" onClick={() => { reset(); onClose(); }}>Cerrar</ITButton>
          <ITButton onClick={() => void send()} disabled={busy || rows.length === 0}>
            {busy ? "Importando…" : "Importar"}
          </ITButton>
        </div>
      </div>
    </ITDialog>
  );
};
