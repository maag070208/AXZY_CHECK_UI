import {
  ITButton,
  ITDivider,
  ITEmptyState,
  ITFlex,
  ITText,
  ITTextarea,
} from "@axzydev/axzy_ui_system";
import { AppState } from "@app/core/store/store";
import { showToast } from "@app/core/store/toast/toast.slice";
import * as Ably from "ably";
import { useCallback, useEffect, useRef, useState } from "react";
import { FaComments, FaPaperPlane } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { ChatMessage, getMessages, getRealtimeToken, sendMessage } from "../services/ChatService";
import { PersonAvatar } from "@app/core/components/PersonAvatar";

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

  return (
    <ITFlex
      direction="column"
      className={`flex flex-col bg-white overflow-hidden dark:bg-slate-900 ${
        compact
          ? "h-full rounded-2xl shadow-xl shadow-slate-200/50"
          : "h-full rounded-3xl border border-slate-100 shadow-sm dark:border-slate-800"
      }`}
    >
      {compact ? <CompactHeader /> : <PageHeader />}

      <ITFlex
        ref={scrollRef}
        onScroll={handleScroll}
        direction="column"
        className={`flex-1 min-h-0 overflow-y-auto bg-slate-50/40 dark:bg-slate-950/20 ${
          compact ? "px-3 py-3" : "px-6 py-5"
        }`}
      >
        {rows.length === 0 ? (
          <ITFlex align="center" justify="center" className="h-full">
            <ITEmptyState
              icon={<FaComments />}
              title="Todavía no hay mensajes"
              description="Escribe el primero para iniciar la conversación."
            />
          </ITFlex>
        ) : (
          <ITFlex direction="column" className="flex flex-col">
            {rows.map((row) =>
              row.kind === "day" ? (
                <ITFlex key={row.key} align="center" gap={3} className="my-4 first:mt-0">
                  <ITDivider className="flex-1" />
                  <ITText as="span" className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {row.label}
                  </ITText>
                  <ITDivider className="flex-1" />
                </ITFlex>
              ) : (
                <MessageRow key={row.msg.id} row={row} compact={compact} />
              ),
            )}
          </ITFlex>
        )}
        <ITFlex ref={listEndRef} className="h-px w-full" />
      </ITFlex>

      <ITFlex
        direction="row"
        align="end"
        gap={2}
        className={`border-t border-slate-100 bg-white flex-shrink-0 dark:border-slate-800 dark:bg-slate-900 ${
          compact ? "p-2.5" : "p-4"
        }`}
      >
        <ITTextarea
          ref={inputRef}
          name="chat-message"
          rows={1}
          resize="none"
          value={draft}
          onChange={(value) => setDraft(value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Escribe un mensaje..."
          className="flex-1"
        />
        <ITButton
          type="button"
          onClick={handleSend}
          disabled={sending || !draft.trim()}
          ariaLabel="Enviar mensaje"
          title="Enviar mensaje"
          variant="icon-only"
          color="primary"
          size={compact ? "sm" : "md"}
          icon={<FaPaperPlane size={compact ? 11 : 14} />}
        />
      </ITFlex>
    </ITFlex>
  );
};

const PageHeader = () => (
  <ITFlex
    align="center"
    justify="between"
    gap={3}
    className="border-b border-slate-100 px-5 py-3 dark:border-slate-800"
  >
    <ITFlex align="center" gap={2}>
      <ITFlex
        align="center"
        justify="center"
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
      >
        <FaComments size={13} />
      </ITFlex>
      <ITFlex direction="column">
        <ITText as="p" className="text-xs font-black text-slate-800 dark:text-slate-100">
          Canal general
        </ITText>
        <ITText as="p" className="text-[10px] font-medium text-slate-400">
          Todo el equipo
        </ITText>
      </ITFlex>
    </ITFlex>
    <LiveBadge />
  </ITFlex>
);

const CompactHeader = () => (
  <ITFlex
    align="center"
    justify="between"
    className="border-b border-slate-100 px-4 py-3 dark:border-slate-800"
  >
    <ITFlex align="center" gap={2}>
      <FaComments className="text-[#065911]" size={13} />
      <ITText as="p" className="text-[13px] font-black text-slate-800 dark:text-slate-100">
        Chat del equipo
      </ITText>
    </ITFlex>
    <LiveBadge />
  </ITFlex>
);

const LiveBadge = () => (
  <ITText as="span" className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wide text-emerald-600">
    <ITText as="span" className="relative flex h-1.5 w-1.5">
      <ITText as="span" className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
      <ITText as="span" className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
    </ITText>
    En vivo
  </ITText>
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

const MessageRow = ({ row, compact }: { row: Extract<Row, { kind: "msg" }>; compact: boolean }) => {
  const { msg, own, first, last } = row;
  const time = new Date(msg.createdAt).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });

  return (
    <ITFlex
      direction="row"
      align="end"
      justify={own ? "end" : "start"}
      gap={2}
      className={first ? "mt-3 first:mt-0" : "mt-0.5"}
    >
      {!own && (
        <PersonAvatar
          name={`${msg.user.name ?? ""} ${msg.user.lastName ?? ""}`.trim()}
          photoUrl={msg.user.photoUrl}
          size={compact ? 24 : 32}
          className={last ? "" : "invisible"}
        />
      )}

      <ITFlex direction="column" className={`${compact ? "max-w-[82%]" : "max-w-[68%]"} min-w-0`}>
        {!own && first && (
          <ITText as="p" className={`mb-0.5 ml-1 font-bold text-slate-500 dark:text-slate-400 ${compact ? "text-[10px]" : "text-[11px]"}`}>
            {msg.user.name} {msg.user.lastName || ""}
          </ITText>
        )}
        <ITFlex
          direction="column"
          className={`px-3 py-2 ${compact ? "text-xs" : "text-sm"} ${
            own
              ? "rounded-2xl rounded-br-md bg-primary-700 text-white"
              : "rounded-2xl rounded-bl-md border border-slate-100 bg-white text-slate-800 shadow-sm dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100"
          }`}
        >
          <ITText as="p" className="whitespace-pre-wrap break-words">
            {msg.message}
          </ITText>
          <ITText as="span" className={`mt-1 self-end text-[10px] ${own ? "text-emerald-100/80" : "text-slate-400"}`}>
            {time}
          </ITText>
        </ITFlex>
      </ITFlex>
    </ITFlex>
  );
};
