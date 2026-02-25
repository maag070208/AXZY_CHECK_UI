import { ITButton, ITInput } from "@axzydev/axzy_ui_system";
import { Form, Formik } from "formik";
import * as Yup from "yup";

const validationSchema = Yup.object().shape({
  name: Yup.string().required("El nombre es requerido"),
  lastName: Yup.string().required("El apellido es requerido"),
  email: Yup.string().email("Correo inválido").required("El correo es requerido"),
  password: Yup.string()
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .required("La contraseña es requerida"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), undefined], 'Las contraseñas deben coincidir')
    .required('Confirmar la contraseña es requerido'),
});

interface RegisterFormProps {
  onSubmit: (values: any) => void;
}

const RegisterForm = ({ onSubmit }: RegisterFormProps) => {
  return (
    <Formik
      initialValues={{ name: "", lastName: "", email: "", password: "", confirmPassword: "" }}
      validationSchema={validationSchema}
      onSubmit={(values) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { confirmPassword, ...rest } = values;
        onSubmit(rest);
      }}
    >
      {({
        handleChange,
        handleBlur,
        values,
        errors,
        touched,
        isValid,
        dirty,
      }) => (
        <Form className="w-full flex justify-center items-center flex-col px-4 lg:px-6 space-y-4">
          <ITInput
            label="Nombre"
            name="name"
            value={values.name}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.name && errors.name ? errors.name : undefined}
            placeholder="Ingrese nombre"
          />
          <ITInput
            label="Apellido"
            name="lastName"
            value={values.lastName}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.lastName && errors.lastName ? errors.lastName : undefined}
            placeholder="Ingrese apellido"
          />
          <ITInput
            label="Correo"
            name="email"
            value={values.email}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.email && errors.email ? errors.email : undefined}
            placeholder="Ingrese correo"
          />

          <ITInput
            label="Contraseña"
            name="password"
            type="password"
            value={values.password}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.password && errors.password ? errors.password : undefined}
            placeholder="Ingrese contraseña"
          />

          <ITInput
            label="Confirmar Contraseña"
            name="confirmPassword"
            type="password"
            value={values.confirmPassword}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.confirmPassword && errors.confirmPassword ? errors.confirmPassword : undefined}
            placeholder="Confirme contraseña"
          />

          <ITButton
            type="submit"
            label="Registrarse"
            disabled={!isValid || !dirty}
            variant="filled"
            color="primary"
            className="w-full"
          />
        </Form>
      )}
    </Formik>
  );
};

export default RegisterForm;
