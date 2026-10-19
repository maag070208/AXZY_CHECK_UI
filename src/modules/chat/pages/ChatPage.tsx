import { ITPage } from "@axzydev/axzy_ui_system";
import { FaComments } from "react-icons/fa";
import { ChatPanel } from "../components/ChatPanel";

/**
 * "4.1 Chat grupal" — versión de pantalla completa. La lógica real vive en
 * ChatPanel, compartida con el panel compacto del dashboard en vivo (/home).
 */
const ChatPage = () => {
  return (
    <ITPage
      className="m-0! px-4! max-w-screen!"
      noPadding
      title="Chat del equipo"
      breadcrumbs={[{ label: "Inicio", href: "#/home" }, { label: "Operación" }, { label: "Chat" }]}
      description="Canal grupal para administración, guardias, jefe de guardias y mantenimiento."
      icon={<FaComments size={20} />}
      iconColor="#065911"
    >
      {/* Altura fija: el chat hace scroll por dentro y el input siempre queda visible. */}
      <div className="h-[calc(100vh-17rem)] min-h-[380px] w-full">
        <ChatPanel variant="page" />
      </div>
    </ITPage>
  );
};

export default ChatPage;
