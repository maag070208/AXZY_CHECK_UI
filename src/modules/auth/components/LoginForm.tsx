import { IAuthLogin } from "@app/core/types/auth.types";
import { FieldConfig, ITButton, ITFlex, ITFormBuilder, createValidationSchema } from "@axzydev/axzy_ui_system";
import { Form, Formik } from "formik";

import { FaUserAlt } from "react-icons/fa";
import * as Yup from "yup";

const LoginFormComponent = ({
  onSubmit,
  loading = false,
}: {
  onSubmit: (values: IAuthLogin) => void;
  loading?: boolean;
}) => {
  const initialValues = {
    username: "",
    password: "",
  };

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
      type: "password",
      required: true,
      minLength: 4,
      maxLength: 20,
      column: 12,
      validation: Yup.string().required("Este campo es requerido"),
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
          <ITFlex direction="column" className="mt-4">
            <ITButton disabled={!isValid || loading} type="submit">
              {loading ? "Iniciando sesión…" : "Iniciar Sesión"}
            </ITButton>
          </ITFlex>
        </Form>
      )}
    </Formik>
  );
};

export default LoginFormComponent;
