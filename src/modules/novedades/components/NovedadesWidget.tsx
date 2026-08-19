import { FaComments, FaPaperPlane } from "react-icons/fa";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNovedades } from "../hooks/useNovedades";
import { NovedadesMessage } from "./NovedadesMessage";

/**
 * @description Recuadro del dashboard que muestra las novedades más recientes
 * en tiempo real y permite publicar desde el panel de control.
 */
export const NovedadesWidget = () => {
  const navigate = useNavigate();
  const { messages, connected, loading, canPublish, send, user } = useNovedades();
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!draft.trim() || sending) return;
    setSending(true);
    const ok = await send(draft);
    setSending(false);
    if (ok) setDraft("");
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-500">
            <FaComments className="text-sm" />
          </div>
          <h3 className="text-sm font-bold text-slate-700">Novedades en tiempo real</h3>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
              connected ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-emerald-500" : "bg-slate-400"} animate-pulse`} />
            {connected ? "En vivo" : "Sin conexión"}
          </span>
          <button
            onClick={() => navigate("/novedades")}
            className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700"
          >
            Ver todas
          </button>
        </div>
      </div>

      <div className="max-h-56 overflow-y-auto px-5 py-3 bg-slate-50/60">
        {loading ? (
          <p className="text-xs text-slate-400 text-center py-6">Cargando novedades...</p>
        ) : messages.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">Aún no hay novedades.</p>
        ) : (
          messages.slice(-5).map((novedad) => (
            <NovedadesMessage
              key={novedad.id}
              novedad={novedad}
              isOwn={Number(novedad.userId) === Number(user.id)}
            />
          ))
        )}
      </div>

      {canPublish && (
        <div className="border-t border-slate-100 p-3 bg-white flex items-center gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
            placeholder="Publicar una novedad..."
            className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
          <button
            onClick={() => void handleSend()}
            disabled={!draft.trim() || sending}
            className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 transition-colors disabled:opacity-40"
          >
            <FaPaperPlane className="text-xs" />
          </button>
        </div>
      )}
    </div>
  );
};
