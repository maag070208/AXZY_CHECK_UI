import { IAuthLogin } from "@app/core/types/auth.types";
import {
  createValidationSchema,
  FieldConfig,
  ITButton,
  ITFormBuilder,
} from "axzy_ui_system";
import { Form, Formik } from "formik";

import { useState } from "react";
import { FaLock, FaLockOpen, FaUserAlt } from "react-icons/fa";
import * as Yup from "yup";

const LoginFormComponent = ({
  onSubmit,
}: {
  onSubmit: (values: IAuthLogin) => void;
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
      minLength: 3,
      maxLength: 20,
      validation: Yup.string()
        .required("Este campo es requerido"),
      rightIcon: <FaUserAlt />,
    },
    {
      name: "password",
      label: "Contraseña",
      type: showPassword ? "text" : "password",
      required: true,
      minLength: 4,
      maxLength: 20,
      column: 12,
      validation: Yup.string().required("Este campo es requerido"),
      rightIcon: !showPassword ? (
        <FaLock onClick={() => setShowPassword(!showPassword)} />
      ) : (
        <FaLockOpen onClick={() => setShowPassword(!showPassword)} />
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
            columns={2}
            handleChange={handleChange}
            handleBlur={handleBlur}
            values={values}
            touched={touched}
            errors={errors}
          />
          <div className="mt-4">
            <ITButton disabled={!isValid} className="w-full" type="submit">
              Iniciar Sesión
            </ITButton>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default LoginFormComponent;
