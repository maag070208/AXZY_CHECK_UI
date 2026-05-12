import { IconType } from "react-icons";

interface ModuleHeaderProps {
  title: string;
  subtitle?: string;
  icon: IconType;
  actions?: React.ReactNode;
}

export const ModuleHeader = ({
  title,
  subtitle,
  icon: Icon,
  actions,
}: ModuleHeaderProps) => {
  return (
    <div className="flex flex-col gap-6 mb-8">
      {/* Contenedor Superior: Icono + Títulos */}
      <div className="flex items-center gap-4">
        <div className="p-3.5 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 text-emerald-600 shrink-0">
          <Icon size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Contenedor Inferior: Acciones */}
      {actions && (
        <div className="flex flex-wrap items-center gap-3 w-full sm:justify-end border-t border-slate-100 dark:border-slate-800 pt-4 md:border-none md:pt-0">
          {actions}
        </div>
      )}
    </div>
  );
};
