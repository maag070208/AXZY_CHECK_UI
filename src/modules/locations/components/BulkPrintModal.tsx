import { showToast } from "@app/core/store/toast/toast.slice";
import { ITButton, ITDialog, ITInput } from "@axzydev/axzy_ui_system";
import { useCallback, useEffect, useState } from "react";
import {
  FaFilter,
  FaMapMarkerAlt,
  FaPlus,
  FaSearch,
  FaTimes,
} from "react-icons/fa";
import { useDispatch } from "react-redux";
import { Location, getPaginatedLocations } from "../service/locations.service";
import { Zone, getZones } from "../service/zones.service";

interface BulkPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (ids: string[]) => void;
}

export const BulkPrintModal = ({
  isOpen,
  onClose,
  onConfirm,
}: BulkPrintModalProps) => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState<"SEARCH" | "SELECTED">("SEARCH");
  const [bulkFilterZone, setBulkFilterZone] = useState<string>("");
  const [bulkFilterSearch, setBulkFilterSearch] = useState<string>("");
  const [allZones, setAllZones] = useState<Zone[]>([]);
  const [locationsToChoose, setLocationsToChoose] = useState<Location[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [animateBadge, setAnimateBadge] = useState(false);

  useEffect(() => {
    if (selectedIds.length > 0) {
      setAnimateBadge(true);
      const timer = setTimeout(() => setAnimateBadge(false), 500);
      return () => clearTimeout(timer);
    }
  }, [selectedIds.length]);

  const fetchBulkLocations = useCallback(async () => {
    const res = await getPaginatedLocations({
      page: 1,
      limit: 1000,
      search: bulkFilterSearch,
      zoneId: bulkFilterZone || undefined,
    });
    if (res.success && res.data) {
      setLocationsToChoose(res.data.rows);
    }
  }, [bulkFilterSearch, bulkFilterZone]);

  useEffect(() => {
    if (isOpen) {
      getZones().then((res) => {
        if (res.success) setAllZones(res.data || []);
      });
      fetchBulkLocations();
    }
  }, [isOpen, fetchBulkLocations]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(fetchBulkLocations, 300);
      return () => clearTimeout(timer);
    }
  }, [bulkFilterSearch, bulkFilterZone, isOpen, fetchBulkLocations]);

  const handleConfirm = () => {
    if (selectedIds.length === 0) {
      dispatch(
        showToast({
          message: "Selecciona al menos una ubicación",
          type: "warning",
        }),
      );
      return;
    }
    onConfirm(selectedIds);
  };

  return (
    <ITDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Impresión Masiva de QRs"
      className="max-w-4xl w-full"
    >
      <div className="flex flex-col h-[80vh]">
        <div className="flex px-6 border-b border-slate-100 bg-white sticky top-0 z-10">
          <button
            onClick={() => setActiveTab("SEARCH")}
            className={`px-6 py-3 text-[11px] font-bold tracking-widest transition-all border-b-2 ${
              activeTab === "SEARCH"
                ? "border-emerald-500 text-emerald-600"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            BUSCAR Y AGREGAR
          </button>
          <button
            onClick={() => setActiveTab("SELECTED")}
            className={`px-6 py-3 text-[11px] font-bold tracking-widest transition-all border-b-2 flex items-center gap-2 ${
              activeTab === "SELECTED"
                ? "border-emerald-500 text-emerald-600"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            SELECCIONADOS
            <span
              className={`px-1.5 py-0.5 rounded-full text-[9px] transition-all duration-300 ${animateBadge ? "scale-150 rotate-12" : "scale-100"} ${
                selectedIds.length > 0
                  ? "bg-emerald-100 text-emerald-600"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              {selectedIds.length}
            </span>
          </button>
        </div>

        {activeTab === "SEARCH" && (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <FaFilter className="text-emerald-500" /> RECURRENTE (ZONA)
              </label>
              <select
                value={bulkFilterZone}
                onChange={(e) => setBulkFilterZone(e.target.value)}
                className="w-full h-[42px] px-4 rounded-xl border border-slate-200 bg-white text-sm font-medium outline-none transition-all focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Todas las zonas</option>
                {allZones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <FaSearch className="text-emerald-500" /> BUSCAR POR NOMBRE
              </label>
              <ITInput
                placeholder="Filtrar por nombre..."
                name="bulkSearch"
                value={bulkFilterSearch}
                onChange={(e) => setBulkFilterSearch(e.target.value)}
                onBlur={() => {}}
                className="!py-2 !h-[42px] !rounded-xl border-slate-200"
              />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {activeTab === "SEARCH" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {locationsToChoose.map((loc) => (
                <label
                  key={loc.id}
                  className={`group flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                    selectedIds.includes(loc.id)
                      ? "border-emerald-200 bg-emerald-50/40"
                      : "border-slate-100 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(loc.id)}
                    onChange={(e) => {
                      if (e.target.checked)
                        setSelectedIds([...selectedIds, loc.id]);
                      else
                        setSelectedIds(
                          selectedIds.filter((id) => id !== loc.id),
                        );
                    }}
                    className="hidden"
                  />
                  <div
                    className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                      selectedIds.includes(loc.id)
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : "border-slate-300 bg-white"
                    }`}
                  >
                    {selectedIds.includes(loc.id) && (
                      <FaPlus size={8} className="rotate-45" />
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${selectedIds.includes(loc.id) ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"}`}
                    >
                      <FaMapMarkerAlt size={14} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-700">
                        {loc.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                        {loc.zone?.name || "General"} • Consecutivo: {loc.spot}
                      </span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {locationsToChoose
                .filter((l) => selectedIds.includes(l.id))
                .map((loc) => (
                  <div
                    key={loc.id}
                    className="flex items-center justify-between p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
                        <FaMapMarkerAlt size={14} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-700">
                          {loc.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                          {loc.zone?.name || "General"}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        setSelectedIds(
                          selectedIds.filter((id) => id !== loc.id),
                        )
                      }
                      className="text-red-400 hover:text-red-600 p-2"
                    >
                      <FaTimes size={14} />
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <div className="flex gap-2">
            <ITButton
              size="small"
              variant="ghost"
              onClick={() =>
                setSelectedIds(
                  Array.from(
                    new Set([
                      ...selectedIds,
                      ...locationsToChoose.map((l) => l.id),
                    ]),
                  ),
                )
              }
              className="text-emerald-600 font-bold text-[11px] uppercase tracking-wider"
            >
              Agregar Resultados
            </ITButton>
            <ITButton
              size="small"
              variant="ghost"
              onClick={() => setSelectedIds([])}
              className="text-slate-400 font-bold text-[11px] uppercase tracking-wider"
            >
              Limpiar
            </ITButton>
          </div>
          <div className="flex gap-3">
            <ITButton
              variant="outlined"
              color="secondary"
              onClick={onClose}
              className="!rounded-xl px-6"
            >
              Cancelar
            </ITButton>
            <ITButton
              color="primary"
              onClick={handleConfirm}
              className="!rounded-xl px-8 shadow-lg shadow-emerald-100"
            >
              Confirmar Impresión ({selectedIds.length})
            </ITButton>
          </div>
        </div>
      </div>
    </ITDialog>
  );
};
