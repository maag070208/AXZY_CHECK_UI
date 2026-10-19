import { AppState } from "@app/core/store/store";
import { showToast } from "@app/core/store/toast/toast.slice";
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
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
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

  // Solo se baja al último mensaje si la persona ya estaba al final (o si el mensaje es suyo),
  // para no arrancarla de la lectura de un mensaje anterior cuando llega uno nuevo.
  const stickToBottom = useRef(true);
  const lastOwnCount = useRef(0);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (el) stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  useEffect(() => {
    const ownCount = messages.filter((m) => m.user.id === currentUserId).length;
    const justSent = ownCount > lastOwnCount.current;
    lastOwnCount.current = ownCount;
    if (stickToBottom.current || justSent) {
      listEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, currentUserId]);

  const handleSend = async () => {
    const trimmed = draft.trim();
    if (!trimmed || sending) return;

    setSending(true);
    try {
      const res = await sendMessage(trimmed);
      if (res.success && res.data) {
        setMessages((prev) => [...prev, res.data as ChatMessage]);
        setDraft("");
        inputRef.current?.focus();
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

  const rows = buildRows(messages, currentUserId);
  const text = compact ? "text-xs" : "text-sm";

  return (
    <div
      className={`flex flex-col bg-white overflow-hidden ${
        compact ? "h-full rounded-2xl shadow-xl shadow-slate-200/50" : "h-full rounded-2xl border border-slate-100 shadow-sm"
      }`}
    >
      {compact && (
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <p className="text-[13px] font-black text-slate-800 flex items-center gap-2">
            <FaComments className="text-[#065911]" /> Chat del Equipo
          </p>
          <LiveBadge />
        </div>
      )}

      <div ref={scrollRef} onScroll={handleScroll} className={`flex-1 min-h-0 overflow-y-auto ${compact ? "px-3 py-3" : "px-6 py-5"} bg-slate-50/40`}>
        {rows.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-400">
            <FaComments size={28} className="text-slate-300" />
            <p className="text-sm font-medium">Todavía no hay mensajes</p>
            <p className="text-xs">Escribe el primero para iniciar la conversación.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {rows.map((row) =>
              row.kind === "day" ? (
                <div key={row.key} className="flex items-center gap-3 my-4 first:mt-0">
                  <span className="flex-1 h-px bg-slate-200/70" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{row.label}</span>
                  <span className="flex-1 h-px bg-slate-200/70" />
                </div>
              ) : (
                <MessageRow key={row.msg.id} row={row} compact={compact} text={text} />
              ),
            )}
          </div>
        )}
        <div ref={listEndRef} />
      </div>

      <div className={`border-t border-slate-100 bg-white flex items-end gap-2 flex-shrink-0 ${compact ? "p-2.5" : "p-4"}`}>
        <textarea
          ref={inputRef}
          rows={1}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Escribe un mensaje..."
          aria-label="Mensaje"
          className={`flex-1 min-w-0 resize-none max-h-28 bg-slate-50 border border-slate-200 outline-none focus:border-[#065911] focus:bg-white focus:ring-4 focus:ring-emerald-50 transition-all ${
            compact ? "px-3 py-2 rounded-lg text-xs" : "px-4 py-2.5 rounded-xl text-sm"
          }`}
          style={{ fieldSizing: "content" } as React.CSSProperties}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={sending || !draft.trim()}
          aria-label="Enviar mensaje"
          style={{ backgroundColor: sending || !draft.trim() ? "#cbd5e1" : "#065911" }}
          className={`flex-shrink-0 flex items-center justify-center text-white disabled:cursor-not-allowed transition-colors ${
            compact ? "w-8 h-8 rounded-lg" : "w-10 h-10 rounded-xl"
          }`}
        >
          <FaPaperPlane size={compact ? 11 : 14} />
        </button>
      </div>
    </div>
  );
};

const LiveBadge = () => (
  <span className="flex items-center gap-1.5 text-[9px] font-black text-emerald-600 uppercase tracking-wide">
    <span className="relative flex h-1.5 w-1.5">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
    </span>
    En vivo
  </span>
);

type Row =
  | { kind: "day"; key: string; label: string }
  | { kind: "msg"; msg: ChatMessage; own: boolean; first: boolean; last: boolean };

const GROUP_WINDOW_MS = 5 * 60 * 1000;

const dayLabel = (d: Date) => {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Hoy";
  if (d.toDateString() === yesterday.toDateString()) return "Ayer";
  return d.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
};

/** Intercala separadores de día y marca el primero/último de cada ráfaga del mismo autor. */
const buildRows = (messages: ChatMessage[], currentUserId: unknown): Row[] => {
  const rows: Row[] = [];
  messages.forEach((msg, i) => {
    const date = new Date(msg.createdAt);
    const prev = messages[i - 1];
    const next = messages[i + 1];
    const newDay = !prev || new Date(prev.createdAt).toDateString() !== date.toDateString();
    if (newDay) rows.push({ kind: "day", key: `day-${date.toDateString()}`, label: dayLabel(date) });

    const sameAsPrev = !newDay && prev && prev.user.id === msg.user.id && date.getTime() - new Date(prev.createdAt).getTime() < GROUP_WINDOW_MS;
    const sameAsNext =
      next &&
      next.user.id === msg.user.id &&
      new Date(next.createdAt).toDateString() === date.toDateString() &&
      new Date(next.createdAt).getTime() - date.getTime() < GROUP_WINDOW_MS;

    rows.push({ kind: "msg", msg, own: msg.user.id === currentUserId, first: !sameAsPrev, last: !sameAsNext });
  });
  return rows;
};

const AVATAR_COLORS = ["bg-emerald-100 text-emerald-700", "bg-sky-100 text-sky-700", "bg-indigo-100 text-indigo-700", "bg-amber-100 text-amber-700", "bg-rose-100 text-rose-700", "bg-teal-100 text-teal-700"];

const MessageRow = ({ row, compact, text }: { row: Extract<Row, { kind: "msg" }>; compact: boolean; text: string }) => {
  const { msg, own, first, last } = row;
  const initials = `${msg.user.name?.charAt(0) ?? ""}${msg.user.lastName?.charAt(0) ?? ""}`.toUpperCase();
  const color = AVATAR_COLORS[Number(msg.user.id) % AVATAR_COLORS.length];
  const time = new Date(msg.createdAt).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
  const avatarSize = compact ? "w-6 h-6 text-[9px]" : "w-8 h-8 text-[11px]";

  return (
    <div className={`flex items-end gap-2 ${own ? "justify-end" : "justify-start"} ${first ? "mt-3 first:mt-0" : "mt-0.5"}`}>
      {!own && (
        <div className={`${avatarSize} rounded-full flex items-center justify-center font-black flex-shrink-0 ${last ? color : "invisible"}`}>{initials}</div>
      )}
      <div className={`${compact ? "max-w-[82%]" : "max-w-[65%]"} min-w-0`}>
        {!own && first && (
          <p className={`font-bold text-slate-500 mb-0.5 ml-1 ${compact ? "text-[10px]" : "text-[11px]"}`}>
            {msg.user.name} {msg.user.lastName || ""}
          </p>
        )}
        <div
          className={`px-3 py-1.5 ${text} break-words whitespace-pre-wrap ${
            own ? "bg-[#065911] text-white rounded-2xl rounded-br-md" : "bg-white border border-slate-100 text-slate-800 rounded-2xl rounded-bl-md shadow-sm"
          }`}
        >
          {msg.message}
          <span className={`ml-2 align-bottom text-[10px] ${own ? "text-emerald-200" : "text-slate-400"}`}>{time}</span>
        </div>
      </div>
    </div>
  );
};
