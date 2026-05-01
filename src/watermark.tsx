import React from "react";
import WaterMark from "@assets/images/marcadeagua.png";

const WatermarkFullPage: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="fixed bottom-20 right-10 pointer-events-none z-0">
        <img
          src={WaterMark}
          alt="Marca de agua"
          className="opacity-70 w-4/5 h-4/5 object-contain"
        />
      </div>
      {children}
    </div>
  );
};

export default WatermarkFullPage;
