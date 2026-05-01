import { AppState } from "@app/core/store/store";
import { hideToast } from "@app/core/store/toast/toast.slice";
import { ITToast } from "@axzydev/axzy_ui_system";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

interface ToastProviderProps {
  children: React.ReactNode;
}

const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const dispatch = useDispatch();
  const { message, type, duration, position, isVisible } = useSelector(
    (state: AppState) => state.toast
  );

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        dispatch(hideToast());
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, dispatch]);

  return (
    <>
      {children}
      {isVisible && (
        <ITToast
          message={message}
          type={type}
          duration={duration}
          position={position}
          onClose={() => dispatch(hideToast())}
        />
      )}
    </>
  );
};

export default ToastProvider;
