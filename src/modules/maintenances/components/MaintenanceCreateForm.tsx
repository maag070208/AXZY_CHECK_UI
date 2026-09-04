import { ITButton, ITLoader } from "@axzydev/axzy_ui_system";
import { GoogleMapComponent } from "@core/components/GoogleMapComponent";
import { ICatalogItem } from "@app/core/types/catalog.types";
import { useState, useRef, useEffect } from "react";
import { FaCamera, FaMapMarkerAlt, FaTimes, FaUpload, FaVideo, FaWrench } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { showToast } from "@app/core/store/toast/toast.slice";
import { createMaintenance, uploadMaintenanceFile, MaintenanceMediaItem } from "../services/MaintenanceService";

interface CreateMediaItem {
  id: string;
  file: File;
  preview: string;
  type: 'IMAGE' | 'VIDEO';
  uploading: boolean;
  error: boolean;
  uploaded?: MaintenanceMediaItem;
}

interface MaintenanceCreateFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categoriesCatalog: ICatalogItem[];
  typesCatalog: ICatalogItem[];
}

const MaintenanceCreateForm = ({ isOpen, onClose, onSuccess, typesCatalog }: MaintenanceCreateFormProps) => {
  const dispatch = useDispatch();

  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [typeId, setTypeId] = useState<number | null>(null);
  const [description, setDescription] = useState("");
  const [media, setMedia] = useState<CreateMediaItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [mapLat, setMapLat] = useState<number>(32.4608);
  const [mapLng, setMapLng] = useState<number>(-116.9247);
  const [mapTouched, setMapTouched] = useState(false);
  const fileInputPhotoRef = useRef<HTMLInputElement>(null);
  const fileInputVideoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setMapLat(position.coords.latitude);
        setMapLng(position.coords.longitude);
        setMapTouched(true);
      },
      () => {},
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
    );
  }, [isOpen]);

  if (!isOpen) return null;

  const resetForm = () => {
    setCategoryId(null);
    setTypeId(null);
    setDescription("");
    setMedia([]);
    setSubmitting(false);
    setMapLat(32.4608);
    setMapLng(-116.9247);
    setMapTouched(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleFileSelect = (mode: 'photo' | 'video') => {
    if (mode === 'photo' && fileInputPhotoRef.current) {
      fileInputPhotoRef.current.click();
    } else if (mode === 'video' && fileInputVideoRef.current) {
      fileInputVideoRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, fileType: 'IMAGE' | 'VIDEO') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const tempId = Date.now().toString();
    const preview = URL.createObjectURL(file);

    setMedia(prev => [...prev, { id: tempId, file, preview, type: fileType, uploading: true, error: false }]);

    const uploaded = await uploadMaintenanceFile(file);

    setMedia(prev =>
      prev.map(item => {
        if (item.id === tempId) {
          if (uploaded) {
            return { ...item, uploading: false, uploaded };
          } else {
            return { ...item, uploading: false, error: true };
          }
        }
        return item;
      })
    );

    if (uploaded) {
      dispatch(showToast({ message: "Evidencia subida correctamente", type: "success" }));
    } else {
      dispatch(showToast({ message: "Error al subir archivo", type: "error" }));
    }

    if (fileInputPhotoRef.current) fileInputPhotoRef.current.value = "";
    if (fileInputVideoRef.current) fileInputVideoRef.current.value = "";
  };

  const removeMedia = (id: string) => {
    setMedia(prev => {
      const item = prev.find(m => m.id === id);
      if (item) URL.revokeObjectURL(item.preview);
      return prev.filter(m => m.id !== id);
    });
  };

  const handleSubmit = async () => {
    // categoryId se deriva automáticamente al elegir el tipo (ver ajuste_2
    // punto 1), asi que basta con validar que haya un tipo seleccionado.
    if (!typeId || !categoryId) {
      dispatch(showToast({ message: "Selecciona el tipo de mantenimiento", type: "warning" }));
      return;
    }

    const pending = media.some(m => m.uploading);
    if (pending) {
      dispatch(showToast({ message: "Hay archivos subiéndose, por favor espera", type: "warning" }));
      return;
    }

    const selectedType = typesCatalog.find(t => Number(t.id) === typeId);

    const validMedia: MaintenanceMediaItem[] = media
      .filter(m => m.uploaded)
      .map(m => m.uploaded!);

    setSubmitting(true);

    const res = await createMaintenance({
      title: selectedType?.value || "Mantenimiento",
      categoryId: categoryId as number,
      typeId: typeId as number,
      description,
      media: validMedia,
      latitude: mapTouched ? mapLat : undefined,
      longitude: mapTouched ? mapLng : undefined,
    });

    setSubmitting(false);

    if (res.success) {
      dispatch(showToast({ message: "Reporte enviado con éxito", type: "success" }));
      resetForm();
      onSuccess();
    } else {
      dispatch(showToast({ message: "Error al enviar el reporte", type: "error" }));
    }
  };

  const isUploading = media.some(m => m.uploading);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 pt-20 sm:pt-20">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-100">

        <div className="px-6 py-5 flex justify-between items-center bg-white border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500">
              <FaWrench size={14} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Nuevo Reporte de Mantenimiento</h3>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-red-500 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-white space-y-6">

          {/* 1. Tipo de Mantenimiento — la categoría se deriva automáticamente
              del tipo elegido (ya no se pide por separado, ver ajuste_2 punto 1). */}
          <div>
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-[1.5px] mb-3 flex items-center gap-2">
              <span className="w-1 h-3 bg-amber-400 rounded-full"></span>
              Tipo de Mantenimiento
            </label>
            <div className="flex flex-wrap gap-2">
              {typesCatalog.map(type => {
                const isSelected = typeId === Number(type.id);
                return (
                  <button
                    key={type.id}
                    onClick={() => {
                      setTypeId(Number(type.id));
                      setCategoryId(Number(type.categoryId));
                    }}
                    className={`px-4 py-2.5 text-sm font-semibold rounded-xl border transition-all duration-200 ${
                      isSelected
                        ? 'bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-200 scale-[1.02]'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-amber-300 hover:text-amber-700 hover:bg-amber-50/50'
                    }`}
                  >
                    {type.value}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Evidence */}
          <div>
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-[1.5px] mb-3 flex items-center gap-2">
              <span className="w-1 h-3 bg-indigo-400 rounded-full"></span>
              Evidencia
            </label>

            <input
              ref={fileInputPhotoRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileChange(e, 'IMAGE')}
            />
            <input
              ref={fileInputVideoRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => handleFileChange(e, 'VIDEO')}
            />

            <div className="flex gap-3 mb-3">
              <button
                onClick={() => handleFileSelect('photo')}
                className="flex-1 h-[80px] flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50 hover:border-emerald-400 transition-all duration-200 group"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                  <FaCamera className="text-emerald-600" size={14} />
                </div>
                <span className="text-xs font-bold text-emerald-700">Subir Foto</span>
              </button>
              <button
                onClick={() => handleFileSelect('video')}
                className="flex-1 h-[80px] flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/30 hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 group"
              >
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                  <FaVideo className="text-slate-600" size={14} />
                </div>
                <span className="text-xs font-bold text-slate-600">Subir Video</span>
              </button>
            </div>

            {media.length > 0 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {media.map((item) => (
                  <div key={item.id} className="relative flex-shrink-0 group">
                    {item.type === 'IMAGE' ? (
                      <img src={item.preview} alt="Evidencia" className="w-20 h-20 rounded-xl object-cover border border-slate-200 shadow-sm" />
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-200 shadow-sm">
                        <FaVideo className="text-white opacity-80" size={18} />
                      </div>
                    )}
                    {item.uploading && (
                      <div className="absolute inset-0 rounded-xl bg-black/50 flex items-center justify-center backdrop-blur-[1px]">
                        <ITLoader size="sm" />
                      </div>
                    )}
                    {item.error && (
                      <div className="absolute inset-0 rounded-xl bg-red-500/30 flex items-center justify-center backdrop-blur-[1px]">
                        <FaTimes className="text-white drop-shadow" size={16} />
                      </div>
                    )}
                    {!item.uploading && (
                      <button
                        onClick={() => removeMedia(item.id)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white rounded-full shadow-md border border-slate-200 flex items-center justify-center text-red-400 hover:text-red-600 hover:border-red-200 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <FaTimes size={9} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. Description */}
          <div>
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-[1.5px] mb-3 flex items-center gap-2">
              <span className="w-1 h-3 bg-orange-400 rounded-full"></span>
              Observaciones
            </label>
            <textarea
              placeholder="Describe el problema encontrado..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder-slate-400 resize-none focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-50 focus:bg-white transition-all"
            />
          </div>

          {/* 4. Location Map */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-[1.5px] flex items-center gap-2">
                <span className="w-1 h-3 bg-emerald-400 rounded-full"></span>
                Ubicación
              </label>
              <div className={`flex items-center gap-3 text-[10px] font-semibold transition-opacity ${mapTouched ? 'opacity-100' : 'opacity-40'}`}>
                <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg">
                  <FaMapMarkerAlt className="text-emerald-500" size={9} />
                  <span className="font-mono text-slate-600">{mapLat.toFixed(6)}</span>
                </span>
                <span className="font-mono text-slate-600">{mapLng.toFixed(6)}</span>
              </div>
            </div>
            <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-inner">
              <GoogleMapComponent
                lat={mapLat}
                lng={mapLng}
                isEditable={true}
                onLocationSelect={(lat: number, lng: number) => {
                  setMapLat(lat);
                  setMapLng(lng);
                  setMapTouched(true);
                }}
                height="220px"
              />
              {!mapTouched && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-xl shadow-lg border border-slate-200 text-xs font-bold text-slate-500 flex items-center gap-2">
                    <FaMapMarkerAlt className="text-emerald-500" size={12} />
                    Haz click o arrastra el pin para marcar la ubicación
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Actions */}
        <div className="px-6 py-4 flex justify-end gap-3 border-t border-slate-100 bg-slate-50/50 flex-shrink-0">
          <ITButton
            variant="outlined"
            color="secondary"
            className="px-6 !rounded-xl"
            onClick={handleClose}
            disabled={submitting}
          >
            Cancelar
          </ITButton>
          <ITButton
            variant="filled"
            color="primary"
            className="px-8 !rounded-xl shadow-lg shadow-amber-200"
            onClick={handleSubmit}
            disabled={submitting || !categoryId || !typeId || isUploading}
          >
            {submitting ? (
              <span className="flex items-center gap-2"><ITLoader size="sm" /> Enviando...</span>
            ) : isUploading ? (
              <span className="flex items-center gap-2"><FaUpload /> Subiendo...</span>
            ) : (
              <span className="flex items-center gap-2"><FaUpload size={12} /> Enviar Reporte</span>
            )}
          </ITButton>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceCreateForm;
