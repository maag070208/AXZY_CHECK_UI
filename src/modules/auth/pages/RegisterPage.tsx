import Logo from "@assets/logo-green.svg";
import { IAuthRegister } from "@core/types/auth.types";
import { ITCard, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import RegisterForm from "../components/RegisterForm";
import { register } from "../services/AuthService";
import { showToast } from "@app/core/store/toast/toast.slice";

const RegisterPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
  
    const handleSubmit = async (values: IAuthRegister) => {
      try {
        const response = await register(values);
        
        if (response?.data) {
             dispatch(
                 showToast({
                    message: "Registro exitoso, por favor inicie sesión",
                    type: "success",
                    position: "top-right"
                 })
             );
             navigate("/login");
        }
      } catch (error) {
        console.error(error);
          dispatch(
              showToast({
                  message: "Error al registrarse",
                  type: "error",
                  position: "top-right"
              })
          );
      }
    };
  
    return (
      <ITFlex align="center" justify="center" className="flex justify-center items-center h-screen overflow-y-hidden">
        <ITCard
          contentClassName="w-full"
          className="w-3/4 md:2-2/6 lg:w-2/6 flex justify-center items-center border-slate-200 shadow-slate-400"
        >
          <ITFlex direction="column" align="center" className="flex flex-col items-center space-y-8">
            <img src={Logo} alt={"Logo"} className="h-[150px] dark:bg-transparent" />
            <ITText as="h2" className="text-xl font-bold text-gray-700">Crear Cuenta</ITText>
            <RegisterForm onSubmit={handleSubmit} />
            <ITFlex direction="column" className="text-sm">
                ¿Ya tienes cuenta? <span className="text-blue-600 cursor-pointer font-bold" onClick={() => navigate("/login")}>Inicia sesión</span>
            </ITFlex>
          </ITFlex>
        </ITCard>
      </ITFlex>
    );
  };
  
  export default RegisterPage;
