import { ITFlex, ITPage } from "@axzydev/axzy_ui_system";
import { FaComments } from "react-icons/fa";
import { ChatPanel } from "../components/ChatPanel";

/**
 * "4.1 Chat grupal" — versión de pantalla completa. La lógica real vive en
 * ChatPanel, compartida con el panel compacto del dashboard en vivo (/home).
 */
const ChatPage = () => {
  return (
    <ITPage
      className="m-0! mx-auto! max-w-[1600px]! px-6! bg-slate-50"
      noPadding
      title="Chat del equipo"
      breadcrumbs={[{ label: "Inicio", href: "#/home" }, { label: "Operación" }, { label: "Chat" }]}
      description="Canal grupal para administración, guardias, jefe de guardias y mantenimiento."
      icon={<FaComments size={20} />}
      iconColor="#065911"
    >
      <ITFlex direction="column" className="h-[calc(100vh-17rem)] min-h-[440px] w-full pb-10 pt-5">
        <ChatPanel variant="page" />
      </ITFlex>
    </ITPage>
  );
};

export default ChatPage;
