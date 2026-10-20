import { ITButton, ITDialog, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { FaExclamationTriangle, FaPowerOff } from "react-icons/fa";
import type { CatalogCategory, CatalogType } from "../services/CatalogAdminService";
import { getCategoryColor } from "./catalogVisuals";

export type CatalogDeleteTarget =
  | { kind: "category"; category: CatalogCategory }
  | { kind: "type"; type: CatalogType; category: CatalogCategory };

interface CatalogDeleteDialogProps {
  target: CatalogDeleteTarget | null;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * Two-step deletion confirmation: active records are soft-disabled first and
 * can be reactivated; inactive records can only be deleted permanently.
 */
export const CatalogDeleteDialog = ({
  target,
  loading,
  onClose,
  onConfirm,
}: CatalogDeleteDialogProps) => {
  if (!target) return null;

  const isCategory = target.kind === "category";
  const active = isCategory ? target.category.active : target.type.active;
  const label = isCategory ? target.category.value : target.type.value;
  const code = isCategory ? target.category.name : target.type.name;
  const color = getCategoryColor(target.category.color, target.category.type);
  const typeCount = target.category._count?.types ?? 0;

  const title = active
    ? isCategory
      ? "Desactivar categoría"
      : "Desactivar tipo"
    : isCategory
      ? "Eliminar categoría permanentemente"
      : "Eliminar tipo permanentemente";

  return (
    <ITDialog isOpen onClose={loading ? () => undefined : onClose} title={title} className="!w-full !max-w-md">
      <ITFlex direction="column" className="p-6">
        <ITFlex align="start" gap={3} className="flex items-start gap-3">
          <ITFlex direction="column"
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
              active ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"
            }`}
          >
            {active ? <FaPowerOff size={17} /> : <FaExclamationTriangle size={17} />}
          </ITFlex>
          <ITFlex direction="column" className="min-w-0">
            <ITText as="h3" className="text-base font-black leading-tight text-slate-800">
              {active ? "El registro dejará de estar disponible" : "Esta acción no se puede deshacer"}
            </ITText>
            <ITText as="p" className="mt-1 text-[12.5px] leading-relaxed text-slate-500">
              {active
                ? isCategory
                  ? "La categoría y sus tipos se ocultarán de la app para nuevos registros. El historial se conserva y puedes reactivarla cuando quieras."
                  : "El tipo se ocultará de los formularios de la app. Los registros históricos se conservan y puedes reactivarlo cuando quieras."
                : isCategory
                  ? `La categoría se borrará definitivamente${
                      typeCount > 0 ? ` junto con sus ${typeCount} ${typeCount === 1 ? "tipo" : "tipos"}` : ""
                    }.`
                  : "El tipo se borrará definitivamente de la base de datos."}
            </ITText>
          </ITFlex>
        </ITFlex>

        <ITFlex align="center" gap={3} className="mt-5 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/80 !px-3.5 py-3">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-[11px] font-black uppercase"
            style={{ backgroundColor: `${color}1F`, borderColor: `${color}38`, color }}
          >
            {label.charAt(0)}
          </span>
          <ITFlex direction="column" className="min-w-0 flex-1">
            <ITText as="p" className="truncate text-sm font-bold text-slate-700">{label}</ITText>
            <ITText as="p" className="truncate font-mono text-[10px] uppercase tracking-wide text-slate-400">
              {code}
            </ITText>
          </ITFlex>
          <ITText as="span"
            className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
              active ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-500"
            }`}
          >
            {active ? "Activa" : "Inactiva"}
          </ITText>
        </ITFlex>

        {!active && (
          <ITFlex direction="column" className="mt-4 rounded-xl border border-rose-100 bg-rose-50 !px-3.5 py-2.5 text-[11px] leading-relaxed text-rose-600">
            <ITText as="span" className="font-bold">Importante:</ITText>{" "}
            {isCategory
              ? "si la categoría o sus tipos tienen registros históricos asociados, el sistema podría impedir el borrado."
              : "si el tipo tiene incidencias o mantenimientos asociados, el sistema podría impedir el borrado."}
          </ITFlex>
        )}

        <ITFlex justify="end" className="mt-6 flex justify-end gap-2.5">
          <ITButton
            variant="outlined"
            color="secondary"
            onClick={onClose}
            disabled={loading}
           
          >
            Cancelar
          </ITButton>
          <ITButton
            onClick={onConfirm}
            disabled={loading}
           
          >
            {loading ? "Procesando..." : active ? "Desactivar" : "Eliminar permanentemente"}
          </ITButton>
        </ITFlex>
      </ITFlex>
    </ITDialog>
  );
};
