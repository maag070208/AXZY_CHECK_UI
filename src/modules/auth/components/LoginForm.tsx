import { IAuthLogin } from "@app/core/types/auth.types";
import {
  createValidationSchema,
  FieldConfig,
  ITButton,
  ITFormBuilder,
} from "@axzydev/axzy_ui_system";
import { Form, Formik } from "formik";
import { useState } from "react";
import { FaLock, FaLockOpen, FaUserAlt } from "react-icons/fa";
import * as Yup from "yup";

const LoginFormComponent = ({
  onSubmit,
  loading,
}: {
  onSubmit: (values: IAuthLogin) => void;
  loading?: boolean;
}) => {
  const initialValues = {
    username: "",
    password: "",
  };

  const [showPassword, setShowPassword] = useState(false);

  const fields: FieldConfig[] = [
    {
      name: "username",
      label: "Usuario",
      type: "text",
      required: true,
      column: 12,
      validation: Yup.string().required("Este campo es requerido"),
      rightIcon: <FaUserAlt className="text-slate-400" />,
    },
    {
      name: "password",
      label: "Contraseña",
      type: showPassword ? "text" : "password",
      required: true,
      column: 12,
      validation: Yup.string().required("Este campo es requerido"),
      rightIcon: !showPassword ? (
        <FaLock className="text-slate-400 cursor-pointer" onClick={() => setShowPassword(!showPassword)} />
      ) : (
        <FaLockOpen className="text-slate-400 cursor-pointer" onClick={() => setShowPassword(!showPassword)} />
      ),
    },
  ];

  return (
    <Formik
      initialValues={initialValues}
      validateOnMount
      validationSchema={createValidationSchema(fields)}
      onSubmit={onSubmit}
    >
      {({
        handleSubmit,
        values,
        touched,
        errors,
        handleChange,
        handleBlur,
        isValid,
      }) => (
        <Form onSubmit={handleSubmit} className="w-full">
          <ITFormBuilder
            fields={fields}
            columns={1}
            handleChange={handleChange}
            handleBlur={handleBlur}
            values={values}
            touched={touched}
            errors={errors}
          />
          <div className="mt-6">
            <ITButton disabled={!isValid || loading} className="w-full" type="submit">
              {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </ITButton>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default LoginFormComponent;
