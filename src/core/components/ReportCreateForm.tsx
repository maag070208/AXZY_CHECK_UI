import { ITButton, ITLoader } from "@axzydev/axzy_ui_system";
import { GoogleMapComponent } from "@core/components/GoogleMapComponent";
import { ICatalogItem } from "@app/core/types/catalog.types";
import { showToast } from "@app/core/store/toast/toast.slice";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { FaCamera, FaCheck, FaMapMarkerAlt, FaSearch, FaTimes, FaUpload, FaVideo } from "react-icons/fa";
import { createPortal } from "react-dom";
import { useDispatch } from "react-redux";

/** Clases completas por acento: Tailwind solo genera clases escritas como literal. */
const ACCENTS = {
  amber: {
    iconBox: "bg-amber-50 text-amber-600",
    chipOn: "bg-amber-500 border-amber-500 text-white shadow-sm",
    chipOff: "hover:border-amber-300 hover:text-amber-700 hover:bg-amber-50/60",
    focus: "focus:border-amber-400 focus:ring-4 focus:ring-amber-50",
    submit: "!bg-amber-500 hover:!bg-amber-600 !border-amber-500",
  },
  red: {
    iconBox: "bg-red-50 text-red-600",
    chipOn: "bg-red-500 border-red-500 text-white shadow-sm",
    chipOff: "hover:border-red-300 hover:text-red-700 hover:bg-red-50/60",
    focus: "focus:border-red-400 focus:ring-4 focus:ring-red-50",
    submit: "!bg-red-500 hover:!bg-red-600 !border-red-500",
  },
  sky: {
    iconBox: "bg-sky-50 text-sky-600",
    chipOn: "bg-sky-500 border-sky-500 text-white shadow-sm",
    chipOff: "hover:border-sky-300 hover:text-sky-700 hover:bg-sky-50/60",
    focus: "focus:border-sky-400 focus:ring-4 focus:ring-sky-50",
    submit: "!bg-sky-500 hover:!bg-sky-600 !border-sky-500",
  },
} as const;

export type ReportAccent = keyof typeof ACCENTS;

export interface ReportMediaItem {
  type: "IMAGE" | "VIDEO";
  url: string;
  key?: string;
}

export interface ReportPayload {
  title: string;
  categoryId: number;
  typeId: number;
  description: string;
  media: ReportMediaItem[];
  latitude?: number;
  longitude?: number;
}

interface PendingMedia {
  id: string;
  preview: string;
  type: "IMAGE" | "VIDEO";
  uploading: boolean;
  error: boolean;
  uploaded?: ReportMediaItem;
}

export interface ReportCreateFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  typesCatalog: ICatalogItem[];
  /** Encabezado: "Nuevo reporte de ..." */
  title: string;
  subtitle: string;
  icon: ReactNode;
  accent: ReportAccent;
  typeLabel: string;
  placeholder: string;
  /** Título que se guarda si el tipo elegido no trae `value`. */
  fallbackTitle: string;
  create: (payload: ReportPayload) => Promise<{ success: boolean }>;
  upload: (file: File) => Promise<ReportMediaItem | null>;
}

const DEFAULT_LAT = 32.4608;
const DEFAULT_LNG = -116.9247;
const SEARCH_THRESHOLD = 14;

const SectionLabel = ({ children, hint }: { children: ReactNode; hint?: ReactNode }) => (
  <div className="flex items-center justify-between mb-2">
    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{children}</label>
    {hint}
  </div>
);

/**
 * Formulario "Nuevo reporte" compartido por Incidencias, Mantenimientos y Casa Club.
 * Solo cambian el acento, los textos y las funciones de crear/subir.
 */
export const ReportCreateForm = ({
  isOpen,
  onClose,
  onSuccess,
  typesCatalog,
  title,
  subtitle,
  icon,
  accent,
  typeLabel,
  placeholder,
  fallbackTitle,
  create,
  upload,
}: ReportCreateFormProps) => {
  const dispatch = useDispatch();
  const a = ACCENTS[accent];

  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [typeId, setTypeId] = useState<number | null>(null);
  const [typeSearch, setTypeSearch] = useState("");
  const [description, setDescription] = useState("");
  const [media, setMedia] = useState<PendingMedia[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [mapLat, setMapLat] = useState(DEFAULT_LAT);
  const [mapLng, setMapLng] = useState(DEFAULT_LNG);
  const [mapTouched, setMapTouched] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    setCategoryId(null);
    setTypeId(null);
    setTypeSearch("");
    setDescription("");
    media.forEach((m) => URL.revokeObjectURL(m.preview));
    setMedia([]);
    setSubmitting(false);
    setMapLat(DEFAULT_LAT);
    setMapLng(DEFAULT_LNG);
    setMapTouched(false);
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setMapLat(p.coords.latitude);
        setMapLng(p.coords.longitude);
        setMapTouched(true);
      },
      () => {},
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 },
    );
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !submitting && handleClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const visibleTypes = useMemo(() => {
    const q = typeSearch.trim().toLowerCase();
    return q ? typesCatalog.filter((t) => String(t.value).toLowerCase().includes(q)) : typesCatalog;
  }, [typesCatalog, typeSearch]);

  if (!isOpen) return null;

  const isUploading = media.some((m) => m.uploading);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>, type: "IMAGE" | "VIDEO") => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setMedia((prev) => [...prev, { id, preview: URL.createObjectURL(file), type, uploading: true, error: false }]);

    const uploaded = await upload(file);
    setMedia((prev) =>
      prev.map((m) => (m.id === id ? { ...m, uploading: false, error: !uploaded, uploaded: uploaded ?? undefined } : m)),
    );
    dispatch(
      showToast(
        uploaded
          ? { message: "Evidencia subida correctamente", type: "success" }
          : { message: "Error al subir archivo", type: "error" },
      ),
    );
  };

  const removeMedia = (id: string) =>
    setMedia((prev) => {
      const item = prev.find((m) => m.id === id);
      if (item) URL.revokeObjectURL(item.preview);
      return prev.filter((m) => m.id !== id);
    });

  const handleSubmit = async () => {
    if (!typeId || !categoryId) {
      dispatch(showToast({ message: `Selecciona ${typeLabel.toLowerCase()}`, type: "warning" }));
      return;
    }
    if (isUploading) {
      dispatch(showToast({ message: "Hay archivos subiéndose, por favor espera", type: "warning" }));
      return;
    }

    const selected = typesCatalog.find((t) => Number(t.id) === typeId);
    setSubmitting(true);
    const res = await create({
      title: selected?.value || fallbackTitle,
      categoryId,
      typeId,
      description,
      media: media.filter((m) => m.uploaded).map((m) => m.uploaded!),
      latitude: mapTouched ? mapLat : undefined,
      longitude: mapTouched ? mapLng : undefined,
    });
    setSubmitting(false);

    if (res.success) {
      dispatch(showToast({ message: "Reporte enviado con éxito", type: "success" }));
      handleClose();
      onSuccess();
    } else {
      dispatch(showToast({ message: "Error al enviar el reporte", type: "error" }));
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !submitting && handleClose()} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-100">
        {/* Encabezado */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${a.iconBox}`}>{icon}</div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-800 leading-tight">{title}</h3>
              <p className="text-[11px] text-slate-400 truncate">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            aria-label="Cerrar"
            className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <FaTimes size={13} />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="px-5 py-4 overflow-y-auto flex-1 space-y-5">
          <section>
            <SectionLabel
              hint={
                typeId ? (
                  <span className="text-[11px] font-semibold text-slate-400">1 seleccionado</span>
                ) : (
                  <span className="text-[11px] font-semibold text-red-400">Requerido</span>
                )
              }
            >
              {typeLabel}
            </SectionLabel>

            {typesCatalog.length > SEARCH_THRESHOLD && (
              <div className="relative mb-2.5">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={11} />
                <input
                  value={typeSearch}
                  onChange={(e) => setTypeSearch(e.target.value)}
                  placeholder="Buscar tipo..."
                  className={`w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 outline-none transition-all ${a.focus}`}
                />
              </div>
            )}

            <div className="flex flex-wrap gap-1.5">
              {visibleTypes.map((type) => {
                const on = typeId === Number(type.id);
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => {
                      setTypeId(Number(type.id));
                      setCategoryId(Number(type.categoryId));
                    }}
                    aria-pressed={on}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      on ? a.chipOn : `bg-white border-slate-200 text-slate-600 ${a.chipOff}`
                    }`}
                  >
                    {on && <FaCheck size={9} />}
                    {type.value}
                  </button>
                );
              })}
              {visibleTypes.length === 0 && <p className="text-xs text-slate-400 py-2">Sin resultados.</p>}
            </div>
          </section>

          <section>
            <SectionLabel hint={<span className="text-[11px] text-slate-400">Opcional</span>}>Evidencia</SectionLabel>
            <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e, "IMAGE")} />
            <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={(e) => handleFile(e, "VIDEO")} />

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => photoRef.current?.click()}
                className="flex items-center gap-2 h-11 px-4 rounded-xl border border-dashed border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-400 transition-colors"
              >
                <FaCamera className="text-emerald-500" size={14} /> Foto
              </button>
              <button
                type="button"
                onClick={() => videoRef.current?.click()}
                className="flex items-center gap-2 h-11 px-4 rounded-xl border border-dashed border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-400 transition-colors"
              >
                <FaVideo className="text-indigo-500" size={14} /> Video
              </button>

              {media.map((item) => (
                <div key={item.id} className="relative group">
                  {item.type === "IMAGE" ? (
                    <img src={item.preview} alt="Evidencia" className="w-11 h-11 rounded-xl object-cover border border-slate-200" />
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-slate-800 flex items-center justify-center">
                      <FaVideo className="text-white opacity-80" size={14} />
                    </div>
                  )}
                  {item.uploading && (
                    <div className="absolute inset-0 rounded-xl bg-black/50 flex items-center justify-center">
                      <ITLoader size="sm" />
                    </div>
                  )}
                  {item.error && (
                    <div className="absolute inset-0 rounded-xl bg-red-500/40 flex items-center justify-center">
                      <FaTimes className="text-white" size={13} />
                    </div>
                  )}
                  {!item.uploading && (
                    <button
                      type="button"
                      onClick={() => removeMedia(item.id)}
                      aria-label="Quitar evidencia"
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white rounded-full shadow border border-slate-200 flex items-center justify-center text-red-400 hover:text-red-600"
                    >
                      <FaTimes size={8} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section>
            <SectionLabel hint={<span className="text-[11px] text-slate-400">Opcional</span>}>Observaciones</SectionLabel>
            <textarea
              placeholder={placeholder}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={`w-full px-3.5 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder-slate-400 resize-none outline-none focus:bg-white transition-all ${a.focus}`}
            />
          </section>

          <section>
            <SectionLabel
              hint={
                <span className={`flex items-center gap-1 text-[10px] font-mono text-slate-500 transition-opacity ${mapTouched ? "opacity-100" : "opacity-40"}`}>
                  <FaMapMarkerAlt className="text-emerald-500" size={9} />
                  {mapLat.toFixed(5)}, {mapLng.toFixed(5)}
                </span>
              }
            >
              Ubicación
            </SectionLabel>
            <div className="relative rounded-xl overflow-hidden border border-slate-200">
              <GoogleMapComponent
                lat={mapLat}
                lng={mapLng}
                isEditable={true}
                onLocationSelect={(lat: number, lng: number) => {
                  setMapLat(lat);
                  setMapLng(lng);
                  setMapTouched(true);
                }}
                height="180px"
              />
              {!mapTouched && (
                <div className="absolute inset-x-0 bottom-2 flex justify-center pointer-events-none">
                  <span className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg shadow border border-slate-200 text-[11px] font-semibold text-slate-500">
                    Toca el mapa o arrastra el pin para marcar la ubicación
                  </span>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Acciones */}
        <div className="px-5 py-3.5 flex justify-end gap-2.5 border-t border-slate-100 bg-slate-50/60 flex-shrink-0">
          <ITButton variant="outlined" color="secondary" className="!rounded-xl" onClick={handleClose} disabled={submitting}>
            Cancelar
          </ITButton>
          <ITButton
            variant="filled"
            color="primary"
            className={`!rounded-xl ${a.submit}`}
            onClick={handleSubmit}
            disabled={submitting || !typeId || isUploading}
          >
            {submitting ? (
              <span className="flex items-center gap-2"><ITLoader size="sm" /> Enviando...</span>
            ) : isUploading ? (
              <span className="flex items-center gap-2"><FaUpload size={11} /> Subiendo...</span>
            ) : (
              <span className="flex items-center gap-2"><FaUpload size={11} /> Enviar reporte</span>
            )}
          </ITButton>
        </div>
      </div>
    </div>,
    document.body,
  );
};
