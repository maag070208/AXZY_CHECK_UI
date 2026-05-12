import { useCallback, useState } from "react";
import { setAuth } from "@app/core/store/auth/auth.slice";
import { AppDispatch } from "@app/core/store/store";
import { showToast } from "@app/core/store/toast/toast.slice";
import Logo from "@assets/logo.png";
import { IAuthLogin } from "@core/types/auth.types";
import { ITCard } from "@axzydev/axzy_ui_system";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import LoginFormComponent from "../components/LoginForm";
import { login } from "../services/AuthService";
import { TResult } from "@app/core/types/TResult";

const LoginPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(
    async (values: IAuthLogin) => {
      setLoading(true);
      try {
        const response = await login(values);

        if (!response.success) {
          dispatch(
            showToast({
              message: response.error || "Credenciales inválidas",
              type: "error",
              position: "top-right",
            }),
          );
          return;
        }

        if (response.data) {
          dispatch(setAuth(response.data));
          navigate("/home");
        }
      } catch (error) {
        const result = error as TResult<void>;
        dispatch(
          showToast({
            message: result.error || "Error de conexión",
            type: "error",
            position: "top-right",
          }),
        );
      } finally {
        setLoading(false);
      }
    },
    [dispatch, navigate],
  );

  return (
    <div className="flex justify-center items-center h-screen overflow-y-hidden bg-slate-50 dark:bg-slate-900">
      <ITCard
        contentClassName="w-full p-8"
        className="w-[90%] md:w-[400px] flex justify-center items-center border-slate-200 shadow-xl shadow-slate-200/50 dark:shadow-none"
      >
        <div className="flex flex-col items-center w-full space-y-6">
          <img src={Logo} alt={"Logo"} className="h-[120px] object-contain" />
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
              Bienvenido
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Ingresa tus credenciales para continuar
            </p>
          </div>
          <LoginFormComponent onSubmit={handleSubmit} loading={loading} />
        </div>
      </ITCard>
    </div>
  );
};

export default LoginPage;
