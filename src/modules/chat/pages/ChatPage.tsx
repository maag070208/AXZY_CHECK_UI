import { FaComments } from "react-icons/fa";
import { ChatPanel } from "../components/ChatPanel";

/**
 * "4.1 Chat grupal" — versión de pantalla completa. La lógica real vive en
 * ChatPanel, compartida con el panel compacto del dashboard en vivo (/home).
 */
const ChatPage = () => {
  return (
    <div className="p-6 bg-[#f8fafc] min-h-screen flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
          <FaComments className="text-[#065911]" />
          Chat del equipo
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Canal grupal para administración, guardias, jefe de guardias y mantenimiento.
        </p>
      </div>

      <ChatPanel variant="page" />
    </div>
  );
};

export default ChatPage;
