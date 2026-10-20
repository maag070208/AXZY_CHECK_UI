import { ITFlex } from "@axzydev/axzy_ui_system";
import React from "react";
import WaterMark from "@assets/images/marcadeagua.png";

const WatermarkFullPage: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return (
    <ITFlex direction="column" className="relative min-h-screen overflow-hidden">
      <ITFlex direction="column" className="fixed bottom-20 right-10 pointer-events-none z-0">
        <img
          src={WaterMark}
          alt="Marca de agua"
          className="opacity-70 w-4/5 h-4/5 object-contain"
        />
      </ITFlex>
      {children}
    </ITFlex>
  );
};

export default WatermarkFullPage;
