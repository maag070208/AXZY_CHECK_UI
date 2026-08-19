import dayjs from "dayjs";
import "dayjs/locale/es";
import { Novedad } from "../types/novedades.types";

dayjs.locale("es");

interface NovedadesMessageProps {
  novedad: Novedad;
  isOwn: boolean;
}

/**
 * @description Burbuja individual de una novedad en tiempo real.
 */
export const NovedadesMessage = ({ novedad, isOwn }: NovedadesMessageProps) => (
  <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-3`}>
    <div
      className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm border ${
        isOwn
          ? "bg-emerald-600 text-white border-emerald-600 rounded-br-sm"
          : "bg-white text-slate-700 border-slate-100 rounded-bl-sm"
      }`}
    >
      <div className={`flex items-center gap-2 mb-1 ${isOwn ? "justify-end" : "justify-between"}`}>
        <span className={`text-[10px] font-bold uppercase tracking-wide ${isOwn ? "text-emerald-100" : "text-emerald-600"}`}>
          {novedad.userName}
        </span>
        <span className={`text-[9px] font-medium ${isOwn ? "text-emerald-200/80" : "text-slate-400"}`}>
          {dayjs(novedad.createdAt).format("HH:mm")}
        </span>
      </div>
      <p className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${isOwn ? "text-white" : "text-slate-700"}`}>
        {novedad.message}
      </p>
    </div>
  </div>
);
