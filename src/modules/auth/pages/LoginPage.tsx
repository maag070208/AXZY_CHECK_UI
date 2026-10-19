import { setAuth } from "@app/core/store/auth/auth.slice";
import { AppDispatch } from "@app/core/store/store";
import { showToast } from "@app/core/store/toast/toast.slice";
import Logo from "@assets/logo-green.svg";
import { IAuthLogin } from "@core/types/auth.types";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import LoginFormComponent from "../components/LoginForm";
import { login } from "../services/AuthService";
const LoginPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const handleSubmit = async (values: IAuthLogin) => {
    const response = await login({
      ...values,
    }).catch(() => {
      dispatch(
        showToast({
          message: "Error al iniciar sesión",
          type: "error",
          position: "top-right",
        })
      );
      return null;
    });
    if (response) {
      if(!response.success){
        dispatch(
          showToast({
            message: response.message,
            type: "error",
            position: "top-right",
          })
        );
        return;
      }

      dispatch(setAuth(response.data));
      navigate("/home");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gradient-to-br from-emerald-50 via-white to-slate-100">
      <div className="w-full max-w-[420px] rounded-2xl bg-white border border-slate-200 shadow-xl shadow-slate-200/60 px-6 py-8 sm:px-8 sm:py-10">
        <div className="flex flex-col items-center">
          <img src={Logo} alt="CheckApp" className="h-14 w-auto" />
          <h1 className="mt-6 text-xl font-semibold text-slate-800">
            Bienvenido
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Inicia sesión para continuar
          </p>
        </div>
        <div className="mt-8">
          <LoginFormComponent onSubmit={handleSubmit} />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
