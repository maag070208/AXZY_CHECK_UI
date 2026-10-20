import { ITDropdownMenu, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import type { ReactNode } from "react";
import {
  FaArrowDown,
  FaArrowUp,
  FaChevronDown,
  FaEllipsisV,
  FaExclamationCircle,
  FaPen,
  FaPlus,
  FaPowerOff,
  FaSearch,
  FaSyncAlt,
  FaTimes,
  FaTrash,
} from "react-icons/fa";
import { MdPlaylistAdd } from "react-icons/md";
import type { CatalogCategory, CatalogType } from "../services/CatalogAdminService";
import {
  cx,
  getCategoryColor,
  getCategoryIcon,
  getCategoryTint,
} from "./catalogVisuals";

interface CatalogCategoryCardProps {
  category: CatalogCategory;
  expanded: boolean;
  types: CatalogType[] | undefined;
  typesLoading: boolean;
  typesError: string | null;
  typeQuery: string;
  busyKey: string | null;
  isFirst: boolean;
  isLast: boolean;
  onToggle: () => void;
  onEditCategory: () => void;
  onToggleCategory: () => void;
  onMoveCategory: (direction: -1 | 1) => void;
  onDeleteCategory: () => void;
  onAddType: () => void;
  onEditType: (type: CatalogType) => void;
  onToggleType: (type: CatalogType) => void;
  onMoveType: (type: CatalogType, direction: -1 | 1) => void;
  onDeleteType: (type: CatalogType) => void;
  onTypeQueryChange: (value: string) => void;
  onReloadTypes: () => void;
}

type IconButtonProps = {
  label: string;
  onClick: () => void;
  children: ReactNode;
  tone?: "default" | "primary" | "danger";
  size?: "sm" | "xs";
  disabled?: boolean;
};

const IconButton = ({ label, onClick, children, tone = "default", size = "sm", disabled }: IconButtonProps) => (
  <button
    type="button"
    title={label}
    aria-label={label}
    onClick={onClick}
    disabled={disabled}
    className={cx(
      "inline-flex items-center justify-center rounded-lg border border-transparent text-slate-400 transition-colors",
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#065911]/30",
      size === "sm" ? "h-[30px] w-[30px]" : "h-7 w-7",
      tone === "primary" && "hover:bg-[#065911]/10 hover:text-[#065911]",
      tone === "danger" && "hover:bg-rose-50 hover:text-rose-600",
      tone === "default" && "hover:bg-slate-100 hover:text-slate-700",
      disabled && "pointer-events-none opacity-40",
    )}
  >
    {children}
  </button>
);

const TypeSearch = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) => (
  <ITFlex direction="column" className="relative">
    <FaSearch
      size={9}
      className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
    />
    <input
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Filtrar tipos..."
      aria-label="Filtrar tipos de esta categoría"
      className="h-8 w-40 rounded-lg border border-slate-200 bg-white pl-7 pr-7 text-[11px] font-medium text-slate-600 outline-none transition-colors placeholder:text-slate-400 focus:border-[#065911]/40 focus:ring-2 focus:ring-[#065911]/10"
    />
    {value && (
      <button
        type="button"
        aria-label="Limpiar búsqueda de tipos"
        onClick={() => onChange("")}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
      >
        <FaTimes size={8} />
      </button>
    )}
  </ITFlex>
);

/**
 * Category card. Shows the category identity, status and type count, and
 * expands into the list of types with per-type actions.
 */
export const CatalogCategoryCard = ({
  category,
  expanded,
  types,
  typesLoading,
  typesError,
  typeQuery,
  busyKey,
  isFirst,
  isLast,
  onToggle,
  onEditCategory,
  onToggleCategory,
  onMoveCategory,
  onDeleteCategory,
  onAddType,
  onEditType,
  onToggleType,
  onMoveType,
  onDeleteType,
  onTypeQueryChange,
  onReloadTypes,
}: CatalogCategoryCardProps) => {
  const color = getCategoryColor(category.color, category.type);
  const CategoryIcon = getCategoryIcon(category.icon);
  const totalTypes = category._count?.types ?? types?.length ?? 0;
  const categoryBusy = busyKey === `cat-${category.id}`;
  const panelId = `category-types-${category.id}`;

  const fullTypes = types ?? [];
  const normalizedQuery = typeQuery.trim().toLowerCase();
  const filteredTypes = normalizedQuery
    ? fullTypes.filter(
        (type) =>
          type.value.toLowerCase().includes(normalizedQuery) ||
          type.name.toLowerCase().includes(normalizedQuery),
      )
    : fullTypes;

  const categoryMenuItems = [
    {
      id: "edit",
      label: "Editar categoría",
      icon: <FaPen size={11} />,
      onClick: onEditCategory,
    },
    {
      id: "toggle",
      label: category.active ? "Desactivar categoría" : "Reactivar categoría",
      icon: category.active ? <FaPowerOff size={11} /> : <FaSyncAlt size={11} />,
      onClick: onToggleCategory,
      disabled: categoryBusy,
    },
    {
      id: "move-up",
      label: "Mover arriba",
      icon: <FaArrowUp size={11} />,
      onClick: () => onMoveCategory(-1),
      disabled: isFirst || categoryBusy,
      divider: true,
    },
    {
      id: "move-down",
      label: "Mover abajo",
      icon: <FaArrowDown size={11} />,
      onClick: () => onMoveCategory(1),
      disabled: isLast || categoryBusy,
    },
    ...(!category.active
      ? [
          {
            id: "delete",
            label: "Eliminar permanentemente",
            icon: <FaTrash size={11} />,
            onClick: onDeleteCategory,
            danger: true,
            divider: true,
          },
        ]
      : []),
  ];

  return (
    <article
      className={cx(
        "flex flex-col overflow-hidden rounded-2xl bg-white transition-all",
        expanded
          ? "shadow-lg shadow-slate-200/60"
          : category.active
            ? "shadow-sm hover:shadow-md"
            : "bg-rose-50/30 shadow-sm hover:shadow-md",
      )}
    >
      <ITFlex align="start" gap={3} className="flex items-start gap-3 p-4">
        <ITFlex align="center" justify="center"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border"
          style={getCategoryTint(color)}
        >
          <CategoryIcon size={19} />
        </ITFlex>

        <ITFlex direction="column" className="min-w-0 flex-1 pt-0.5">
          <ITFlex align="center" className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <ITText as="h3" className="break-words text-[16px] font-black leading-tight text-slate-800">
              {category.value}
            </ITText>
            {!category.active && (
              <ITText as="span" className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-rose-500 ring-1 ring-inset ring-rose-100">
                Inactiva
              </ITText>
            )}
          </ITFlex>
          <ITFlex align="center" className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            <ITText as="span" className="max-w-[190px] truncate rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-slate-500">
              {category.name}
            </ITText>
            <ITText as="span" className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
              {totalTypes} {totalTypes === 1 ? "tipo" : "tipos"}
            </ITText>
          </ITFlex>
        </ITFlex>

        <ITFlex align="center" className="flex shrink-0 items-center gap-0.5">
          <IconButton label="Editar categoría" onClick={onEditCategory} tone="primary">
            <FaPen size={11} />
          </IconButton>
          <ITDropdownMenu
            items={categoryMenuItems}
            trigger={<FaEllipsisV size={12} />}
            triggerLabel="Acciones de la categoría"
            className="!h-[30px] !w-[30px] !rounded-lg !p-0 text-slate-400 hover:!bg-slate-100 hover:!text-slate-700"
          />
        </ITFlex>
      </ITFlex>

      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={panelId}
        className={cx(
          "flex w-full items-center justify-between gap-3 border-t px-4 py-2.5 text-left transition-colors",
          expanded ? "border-slate-100 bg-slate-50/70" : "border-slate-100 hover:bg-slate-50/70",
        )}
      >
        <ITText as="span" className="inline-flex items-center gap-1.5">
          <ITText as="span"
            className={cx(
              "h-1.5 w-1.5 rounded-full",
              category.active ? "bg-emerald-500" : "bg-rose-400",
            )}
          />
          <ITText as="span"
            className={cx(
              "text-[10px] font-black uppercase tracking-widest",
              category.active ? "text-emerald-700" : "text-rose-500",
            )}
          >
            {category.active ? "Activa" : "Inactiva"}
          </ITText>
        </ITText>

        <ITText as="span" className="inline-flex items-center gap-2 text-[11.5px] font-bold text-slate-500">
          {expanded ? "Ocultar tipos" : "Ver tipos"}
          <ITText as="span" className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-black text-slate-600">
            {totalTypes}
          </ITText>
          <FaChevronDown
            size={9}
            className={cx("text-slate-400 transition-transform duration-200", expanded && "rotate-180")}
          />
        </ITText>
      </button>

      {expanded && (
        <div id={panelId} className="border-t border-slate-100 bg-slate-50/60 !p-3.5">
          <ITFlex align="center" gap={2} className="mb-2.5 flex flex-wrap items-center gap-2">
            <ITText as="span" className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Tipos
            </ITText>
            <ITText as="span" className="rounded-full border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
              {fullTypes.length}
            </ITText>

            <ITFlex align="center" className="ml-auto flex items-center gap-1.5">
              {fullTypes.length > 3 && (
                <TypeSearch value={typeQuery} onChange={onTypeQueryChange} />
              )}
              <button
                type="button"
                onClick={onAddType}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#065911]/25 bg-white px-2.5 text-[11px] font-bold text-[#065911] transition-colors hover:bg-[#065911]/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#065911]/30"
              >
                <FaPlus size={8} /> Nuevo tipo
              </button>
            </ITFlex>
          </ITFlex>

          {typesLoading && (
            <ITFlex direction="column" className="space-y-1.5">
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="h-11 animate-pulse rounded-xl border border-slate-100 bg-white"
                />
              ))}
            </ITFlex>
          )}

          {!typesLoading && typesError && (
            <ITFlex align="center" gap={2} className="flex items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2.5 text-[11px] font-semibold text-rose-600">
              <FaExclamationCircle size={12} className="shrink-0" />
              <ITText as="span" className="flex-1">{typesError}</ITText>
              <button
                type="button"
                onClick={onReloadTypes}
                className="shrink-0 rounded-md px-1.5 py-0.5 font-bold underline underline-offset-2 hover:bg-rose-100"
              >
                Reintentar
              </button>
            </ITFlex>
          )}

          {!typesLoading && !typesError && fullTypes.length === 0 && (
            <ITFlex direction="column" className="rounded-xl border border-dashed border-slate-300 bg-white/70 px-4 py-5 text-center">
              <MdPlaylistAdd size={22} className="mx-auto mb-1.5 text-slate-300" />
              <ITText as="p" className="text-xs font-bold text-slate-600">Sin tipos todavía</ITText>
              <ITText as="p" className="mt-0.5 text-[11px] text-slate-400">
                Agrega el primer tipo de esta categoría.
              </ITText>
              <button
                type="button"
                onClick={onAddType}
                className="mt-2 text-[11px] font-bold text-[#065911] underline underline-offset-2 hover:text-[#04400c]"
              >
                Agregar tipo
              </button>
            </ITFlex>
          )}

          {!typesLoading && !typesError && fullTypes.length > 0 && filteredTypes.length === 0 && (
            <ITFlex direction="column" className="rounded-xl border border-dashed border-slate-300 bg-white/70 px-4 py-5 text-center">
              <ITText as="p" className="text-[11px] font-semibold text-slate-500">
                Ningún tipo coincide con “{typeQuery}”.
              </ITText>
              <button
                type="button"
                onClick={() => onTypeQueryChange("")}
                className="mt-1.5 text-[11px] font-bold text-[#065911] underline underline-offset-2"
              >
                Limpiar búsqueda
              </button>
            </ITFlex>
          )}

          {!typesLoading && !typesError && filteredTypes.length > 0 && (
            <ITFlex direction="column" className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              {filteredTypes.map((type, index) => {
                const fullIndex = fullTypes.findIndex((item) => item.id === type.id);
                const typeBusy = busyKey === `type-${type.id}`;
                const typeMenuItems = [
                  {
                    id: "edit",
                    label: "Editar tipo",
                    icon: <FaPen size={11} />,
                    onClick: () => onEditType(type),
                  },
                  {
                    id: "toggle",
                    label: type.active ? "Desactivar tipo" : "Reactivar tipo",
                    icon: type.active ? <FaPowerOff size={11} /> : <FaSyncAlt size={11} />,
                    onClick: () => onToggleType(type),
                    disabled: typeBusy,
                  },
                  {
                    id: "move-up",
                    label: "Mover arriba",
                    icon: <FaArrowUp size={11} />,
                    onClick: () => onMoveType(type, -1),
                    disabled: fullIndex <= 0 || typeBusy,
                    divider: true,
                  },
                  {
                    id: "move-down",
                    label: "Mover abajo",
                    icon: <FaArrowDown size={11} />,
                    onClick: () => onMoveType(type, 1),
                    disabled: fullIndex >= fullTypes.length - 1 || typeBusy,
                  },
                  ...(!type.active
                    ? [
                        {
                          id: "delete",
                          label: "Eliminar permanentemente",
                          icon: <FaTrash size={11} />,
                          onClick: () => onDeleteType(type),
                          danger: true,
                          divider: true,
                        },
                      ]
                    : []),
                ];

                return (
                  <div
                    key={type.id}
                    className={cx(
                      "flex items-center gap-2.5 px-3 py-2 transition-colors hover:bg-slate-50/80",
                      index > 0 && "border-t border-slate-100",
                      !type.active && "bg-slate-50/40",
                    )}
                  >
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <ITFlex direction="column" className="min-w-0 flex-1">
                      <ITFlex align="center" className="flex items-center gap-1.5">
                        <ITText as="p"
                          className={cx(
                            "truncate text-[13px] font-semibold",
                            type.active ? "text-slate-700" : "text-slate-500",
                          )}
                        >
                          {type.value}
                        </ITText>
                        {!type.active && (
                          <ITText as="span" className="shrink-0 rounded-full bg-rose-50 px-1.5 py-0.5 text-[8.5px] font-black uppercase tracking-wider text-rose-500 ring-1 ring-inset ring-rose-100">
                            Inactivo
                          </ITText>
                        )}
                      </ITFlex>
                      <ITText as="p" className="truncate font-mono text-[9px] uppercase tracking-wide text-slate-400">
                        {type.name}
                      </ITText>
                    </ITFlex>

                    <ITFlex align="center" className="flex shrink-0 items-center gap-0.5">
                      <IconButton
                        label="Editar tipo"
                        onClick={() => onEditType(type)}
                        tone="primary"
                        size="xs"
                      >
                        <FaPen size={9} />
                      </IconButton>
                      <ITDropdownMenu
                        items={typeMenuItems}
                        trigger={<FaEllipsisV size={10} />}
                        triggerLabel={`Acciones del tipo ${type.value}`}
                        className="!h-7 !w-7 !rounded-lg !p-0 text-slate-400 hover:!bg-slate-100 hover:!text-slate-700"
                      />
                    </ITFlex>
                  </div>
                );
              })}
            </ITFlex>
          )}
        </div>
      )}
    </article>
  );
};
