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
    <div className="flex justify-center items-center h-screen overflow-y-hidden">
      <ITCard
        contentClassName="w-full"
        className="w-3/4 md:2-2/6 lg:w-2/6 flex justify-center items-center border-slate-200 shadow-slate-400"
      >
        <div className="flex flex-col items-center space-y-8">
          <img src={Logo} alt={"Logo"} className="h-[150px] dark:bg-transparent" />
          <LoginFormComponent onSubmit={handleSubmit} />
        </div>
      </ITCard>
    </div>
  );
};

export default LoginPage;
