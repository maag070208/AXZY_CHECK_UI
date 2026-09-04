import { AppState } from "@app/core/store/store";
import { showToast } from "@app/core/store/toast/toast.slice";
import { ITButton } from "@axzydev/axzy_ui_system";
import * as Ably from "ably";
import { useCallback, useEffect, useRef, useState } from "react";
import { FaComments, FaPaperPlane } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { ChatMessage, getMessages, getRealtimeToken, sendMessage } from "../services/ChatService";

const POLL_INTERVAL_MS = 10000;
const ABLY_CHAT_CHANNEL = "chat:team";

interface ChatPanelProps {
  /** "page" = /chat de pantalla completa; "sidebar" = panel compacto junto al dashboard en vivo (/home). */
  variant?: "page" | "sidebar";
}

/**
 * "4.1 Chat grupal" — lógica compartida entre la página completa (/chat) y
 * el panel lateral del dashboard en vivo (/home), para no duplicar la
 * suscripción a Ably ni el manejo de mensajes en dos lugares. Postgres es
 * la fuente de verdad (persistido vía REST); Ably es solo una mejora en
 * vivo — si no conecta, sigue funcionando por polling cada 10s.
 */
export const ChatPanel = ({ variant = "page" }: ChatPanelProps) => {
  const compact = variant === "sidebar";
  const dispatch = useDispatch();
  const currentUserId = useSelector((state: AppState) => state.auth.id);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const listEndRef = useRef<HTMLDivElement | null>(null);
  const ablyRef = useRef<Ably.Realtime | null>(null);

  const loadMessages = useCallback(async () => {
    const res = await getMessages();
    if (res.success && res.data) {
      // API returns newest-first; render oldest-first.
      setMessages([...res.data].reverse());
    }
  }, []);

  useEffect(() => {
    loadMessages();

    // Polling fallback — always on, cheap, and guarantees the chat works
    // even if Ably never connects.
    const pollTimer = setInterval(loadMessages, POLL_INTERVAL_MS);

    // Best-effort realtime: if Ably can't authenticate (not configured on the
    // API, network blocked, etc.) we just keep relying on the poll above.
    let client: Ably.Realtime | null = null;
    try {
      client = new Ably.Realtime({
        authCallback: async (_tokenParams, callback) => {
          try {
            const res = await getRealtimeToken();
            if (res.success && res.data) {
              callback(null, res.data);
            } else {
              callback("No se pudo obtener el token de tiempo real", null);
            }
          } catch (error) {
            callback(error as Ably.ErrorInfo, null);
          }
        },
      });
      ablyRef.current = client;
      const channel = client.channels.get(ABLY_CHAT_CHANNEL);
      channel.subscribe("new-message", (msg) => {
        const incoming = msg.data as ChatMessage;
        setMessages((prev) => (prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]));
      });
    } catch (error) {
      console.warn("[Chat] Ably no disponible, usando solo polling.", error);
    }

    return () => {
      clearInterval(pollTimer);
      (client?.close() as unknown as Promise<void> | void)?.catch?.(() => {});
    };
  }, [loadMessages]);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async () => {
    const trimmed = draft.trim();
    if (!trimmed || sending) return;

    setSending(true);
    try {
      const res = await sendMessage(trimmed);
      if (res.success && res.data) {
        setMessages((prev) => [...prev, res.data as ChatMessage]);
        setDraft("");
      } else {
        dispatch(showToast({ message: res.messages?.[0] || "No se pudo enviar", type: "error" }));
      }
    } catch (error) {
      const result = error as { messages?: string[] };
      dispatch(showToast({ message: result?.messages?.[0] || "Error de conexión", type: "error" }));
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className={
        compact
          ? "flex flex-col h-full bg-white rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden"
          : "bg-white rounded-2xl shadow-sm border border-slate-100 flex-1 flex flex-col overflow-hidden"
      }
    >
      {compact && (
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <p className="text-[13px] font-black text-slate-800 flex items-center gap-2">
            <FaComments className="text-[#065911]" /> Chat del Equipo
          </p>
          <span className="flex items-center gap-1.5 text-[9px] font-black text-emerald-600 uppercase tracking-wide">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            En vivo
          </span>
        </div>
      )}

      <div
        className={compact ? "flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-2" : "flex-1 min-h-0 overflow-y-auto p-6 space-y-3"}
        style={!compact ? { maxHeight: "60vh" } : undefined}
      >
        {messages.map((msg) => {
          const isOwn = msg.user.id === currentUserId;
          return (
            <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
              <div
                className={`${
                  compact ? "max-w-[85%] rounded-xl px-3 py-2 text-xs" : "max-w-[70%] rounded-2xl px-4 py-2.5 text-sm"
                } ${isOwn ? "bg-[#065911] text-white" : "bg-slate-100 text-slate-800"}`}
              >
                {!isOwn && (
                  <p className={`font-bold uppercase opacity-70 mb-0.5 ${compact ? "text-[8px]" : "text-[10px]"}`}>
                    {msg.user.name} {msg.user.lastName || ""}
                  </p>
                )}
                <p>{msg.message}</p>
                <p className={`mt-1 ${compact ? "text-[8px]" : "text-[10px]"} ${isOwn ? "text-emerald-100" : "text-slate-400"}`}>
                  {new Date(msg.createdAt).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
        {messages.length === 0 && <p className="text-sm text-slate-400">Todavía no hay mensajes.</p>}
        <div ref={listEndRef} />
      </div>

      <div
        className={
          compact
            ? "border-t border-slate-100 p-2.5 flex items-center gap-2 flex-shrink-0"
            : "border-t border-slate-100 p-4 flex items-center gap-3"
        }
      >
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
          placeholder="Escribe un mensaje..."
          className={
            compact
              ? "flex-1 min-w-0 px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg focus:border-[#065911] outline-none text-xs"
              : "flex-1 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:border-[#065911] outline-none text-sm"
          }
        />
        <ITButton
          onClick={handleSend}
          disabled={sending || !draft.trim()}
          color="primary"
          className={
            compact
              ? "!rounded-lg !bg-[#065911] hover:!bg-[#04400c] !px-3 !py-2 flex-shrink-0"
              : "!rounded-xl !bg-[#065911] hover:!bg-[#04400c] !px-5 !py-2.5"
          }
        >
          <FaPaperPlane size={compact ? 11 : 14} />
        </ITButton>
      </div>
    </div>
  );
};
