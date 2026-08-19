import { ITButton, ITLoader } from "@axzydev/axzy_ui_system";
import { useEffect, useRef, useState } from "react";
import { FaComments, FaPaperPlane } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useNovedades } from "../hooks/useNovedades";
import { NovedadesMessage } from "../components/NovedadesMessage";

/**
 * @description Pantalla completa de novedades: historial persistido + streaming
 * en tiempo real por Ably, con composer para publicar.
 */
const NovedadesPage = () => {
  const navigate = useNavigate();
  const { messages, connected, loading, canPublish, send, user } = useNovedades();
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleSend = async () => {
    if (!draft.trim() || sending) return;
    setSending(true);
    const ok = await send(draft);
    setSending(false);
    if (ok) setDraft("");
  };

  const roleLabel = (role: string) => {
    const labels: Record<string, string> = {
      ADMIN: "Administrador",
      LIDER: "Líder",
      GUARD: "Guardia",
      SHIFT: "Jefe de Turno",
      MAINT: "Mantenimiento",
    };
    return labels[role] || role;
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-sm">
              <FaComments className="text-lg" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Novedades</h2>
              <p className="text-xs text-slate-400 font-medium">Comunicación operativa en tiempo real</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/home")}
              className="text-xs font-bold text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm"
            >
              Volver
            </button>
            <span
              className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-full ${
                connected ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-emerald-500" : "bg-slate-400"} animate-pulse`} />
              {connected ? "En vivo" : "Desconectado"}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col" style={{ height: "calc(100vh - 200px)" }}>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 bg-slate-50/60">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <ITLoader size="md" />
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-slate-400 font-medium">
                Aún no hay novedades. Publica la primera.
              </div>
            ) : (
              messages.map((novedad) => (
                <NovedadesMessage
                  key={novedad.id}
                  novedad={novedad}
                  isOwn={Number(novedad.userId) === Number(user.id)}
                />
              ))
            )}
          </div>

          <div className="border-t border-slate-100 p-4 bg-white flex items-center gap-3">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void handleSend();
                }
              }}
              placeholder={
                canPublish
                  ? "Escribe una novedad..."
                  : "Solo lectura (tu rol no puede publicar)"
              }
              disabled={!canPublish}
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:opacity-50"
            />
            <ITButton
              variant="primary"
              onClick={() => void handleSend()}
              disabled={!canPublish || !draft.trim() || sending}
            >
              <div className="flex items-center gap-2">
                <FaPaperPlane className="text-xs" />
                {sending ? "Enviando..." : "Enviar"}
              </div>
            </ITButton>
          </div>
        </div>

        <p className="text-center text-[10px] text-slate-400 font-medium">
          Publicando como <span className="font-bold text-slate-500">{user.name} ({roleLabel(user.role ?? "")})</span>
        </p>
      </div>
    </div>
  );
};

export default NovedadesPage;
