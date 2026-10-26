import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import QRCode from "qrcode";
import { afterEach, describe, expect, it, vi } from "vitest";
import store from "@app/core/store/store";
import { fail, mockTransport, stub, table } from "../helpers/api";
import { renderApp } from "../helpers/render";
import { pickOption, png } from "../helpers/ui";
import { API, server } from "../helpers/server";

const toast = () => store.getState().toast;

const property = {
  id: 10,
  identifier: "A-101",
  name: "Casa 101",
  typeId: 1,
  mainStreet: "Calle 1",
  statusId: 1,
  active: true,
};

const resident1 = {
  id: 1,
  name: "Ana",
  lastName: "Pérez",
  username: "ana",
  role: "RESDN",
  propertyId: 10,
  property,
  residentProfile: {
    id: 1,
    userId: 1,
    firstName: "Ana",
    fatherLastName: "Pérez",
    motherLastName: "Soto",
    phoneNumber: "6641234567",
    email: "ana@mail.com",
    emergencyContact: "Luis Pérez",
    emergencyPhone: "6649876543",
    ineFrontUrl: "http://x/frente.jpg",
    ineBackUrl: "http://x/reverso.jpg",
    notes: "Nota interna del expediente",
  },
};

const resident2 = {
  id: 2,
  name: "Beto",
  lastName: "Ruiz",
  username: "beto",
  role: "RESDN",
};

const residents = [resident1, resident2];

const contacts = [
  {
    id: 5,
    userId: 1,
    name: "María López",
    phone: "6641112233",
    email: "maria@mail.com",
    relationship: "Hermana",
    active: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: 6,
    userId: 1,
    name: "Pedro Sin Datos",
    active: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

const auths = [
  {
    id: 21,
    personId: 7,
    scope: "PEDESTRIAN",
    days: "0,1,2,3,4,5,6",
    startTime: "10:00",
    endTime: "12:00",
    validFrom: "2026-10-20",
    validUntil: "2026-10-21",
    revokedAt: null,
    person: { id: 7, firstName: "María", lastName: "López" },
  },
  {
    id: 22,
    personId: 8,
    scope: "VEHICLE",
    days: "0,1,2,3,4,5,6",
    startTime: "08:00",
    endTime: "09:00",
    validFrom: "2026-10-18",
    validUntil: null,
    revokedAt: "2026-10-18T10:00:00.000Z",
    person: { id: 8, firstName: "Rappi" },
  },
];

const dialogOf = async (name: string | RegExp) => {
  await waitFor(() => expect(screen.getAllByRole("heading", { name }).length).toBeGreaterThan(0));
  return screen.getAllByRole("heading", { name })[0].closest("[data-it-dialog]") as HTMLElement;
};

const countedGet = (path: string, body: unknown) => {
  let n = 0;
  server.use(
    http.get(`${API}${path}`, () => {
      n += 1;
      return HttpResponse.json(body as never);
    }),
  );
  return () => n;
};

const openList = async () => {
  stub("get", "/catalog/property", { success: true, data: [property] });
  const bodies = table("/residents/datatable", residents);
  const r = renderApp({ route: "/residents", role: "ADMIN" });
  // La tabla se remonta por el debounce de la búsqueda: se espera la segunda carga.
  await waitFor(() => expect(bodies.length).toBeGreaterThanOrEqual(2));
  await screen.findByText("Ana Pérez");
  return { ...r, bodies };
};

const openContacts = async (contactRows = contacts) => {
  const ctx = await openList();
  stub("get", "/residents/1/contacts", { success: true, data: contactRows });
  await ctx.user.click(screen.getAllByRole("button", { name: "Agenda de contactos" })[0]);
  const dialog = await dialogOf(/Agenda de contactos/);
  await within(dialog).findByText(contactRows.length ? contactRows[0].name : "Sin contactos registrados");
  return { ...ctx, dialog };
};

const openDetail = async (resident = resident1, contactRows = contacts) => {
  stub("get", `/residents/${resident.id}`, { success: true, data: resident });
  stub("get", `/residents/${resident.id}/contacts`, { success: true, data: contactRows });
  const r = renderApp({ route: `/residents/${resident.id}`, role: "ADMIN" });
  await screen.findByText(`@${resident.username}`);
  return { ...r, resident };
};

const openCreateForm = async () => {
  stub("get", "/properties", { success: true, data: [property] });
  const r = renderApp({ route: "/residents/nuevo", role: "ADMIN" });
  await screen.findByPlaceholderText("Ej. Juan Carlos");
  return r;
};

const next = async (user: ReturnType<typeof renderApp>["user"]) => {
  await user.click(screen.getByRole("button", { name: "Siguiente" }));
};

const fillStep0 = async (user: ReturnType<typeof renderApp>["user"], name = "Juan Carlos", lastName = "Perez Hernandez", phone = "6641234567") => {
  await user.type(screen.getByPlaceholderText("Ej. Juan Carlos"), name);
  await user.type(screen.getByPlaceholderText("Ej. Perez Hernandez"), lastName);
  await user.type(screen.getByPlaceholderText("Ej. 5551234567"), phone);
};

const fillStep1 = async (user: ReturnType<typeof renderApp>["user"], username = "jperez", password = "secreto1") => {
  await screen.findByPlaceholderText("Ej. jperez123");
  await user.type(screen.getByPlaceholderText("Ej. jperez123"), username);
  await user.type(screen.getByPlaceholderText("Contraseña segura"), password);
};

/** Llega al paso 4 con datos válidos, sin enviar. */
const fillAllCreate = async (user: ReturnType<typeof renderApp>["user"]) => {
  await fillStep0(user);
  await next(user);
  await fillStep1(user);
  await next(user);
  await screen.findByPlaceholderText("Ej. Maria Martinez (Esposa)");
  await next(user);
  await screen.findByPlaceholderText("Observaciones internas, notas de recepción, etc.");
};

/** ITDropfile en `view="drop"` no tiene botón de apertura: se adjunta en el input y se confirma igual que el helper. */
const uploadAt = async (user: ReturnType<typeof renderApp>["user"], index: number, file: File) => {
  const inputs = document.querySelectorAll<HTMLInputElement>('input[type="file"]');
  expect(inputs.length).toBe(2);
  await user.upload(inputs[index], file);
  const confirm = await screen.findByRole("button", { name: /^confirmar$/i });
  vi.useFakeTimers({ toFake: ["setTimeout"] });
  try {
    fireEvent.click(confirm);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1600);
    });
  } finally {
    vi.useRealTimers();
  }
};

const openPases = async (authRows: unknown[] = []) => {
  const ctx = await openDetail();
  const loads = countedGet("/properties/10/authorizations", { success: true, data: authRows });
  await ctx.user.click(screen.getByRole("button", { name: "Pases" }));
  await screen.findByText("Generar pase de acceso");
  await waitFor(() => expect(loads()).toBeGreaterThan(0));
  return { ...ctx, loads };
};

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("residentes: listado", () => {
  it("muestra iniciales, propiedad asignada / sin asignar, contacto y seguridad", async () => {
    const { bodies } = await openList();
    expect(bodies[0]).toMatchObject({ page: 1, limit: 50, filters: { search: "" } });
    expect(screen.getByText("Ana Pérez")).toBeInTheDocument();
    expect(screen.getAllByRole("img", { name: /Ana Pérez/i }).length).toBeGreaterThan(0);
    expect(screen.getByText("@ana")).toBeInTheDocument();
    expect(screen.getByText("A-101")).toBeInTheDocument();
    expect(screen.getAllByText("Casa 101").length).toBeGreaterThan(0);
    expect(screen.getByText("6641234567")).toBeInTheDocument();
    expect(screen.getByText("ana@mail.com")).toBeInTheDocument();
    expect(screen.getByText("6649876543")).toBeInTheDocument();
    expect(screen.getByText("Luis Pérez")).toBeInTheDocument();

    expect(screen.getByText("Beto Ruiz")).toBeInTheDocument();
    expect(screen.getAllByRole("img", { name: /Beto Ruiz/i }).length).toBeGreaterThan(0);
    expect(screen.getByText("@beto")).toBeInTheDocument();
    expect(screen.getByText("Sin Asignar")).toBeInTheDocument();
    expect(screen.getAllByText("No registrado")).toHaveLength(2);

    expect(screen.getAllByRole("button", { name: "Ver expediente" })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Ver identificación" })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Agenda de contactos" })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Editar" })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Eliminar" })).toHaveLength(2);
  });

  it("buscar manda el término y limpiar lo quita", async () => {
    const { user, bodies } = await openList();
    await user.type(screen.getByPlaceholderText("Buscar residente..."), "ana");
    await waitFor(() => expect(bodies.at(-1).filters.search).toBe("ana"));
    await user.click(screen.getByRole("button", { name: "Limpiar búsqueda" }));
    await waitFor(() => expect(bodies.at(-1).filters.search).toBe(""));
    expect(screen.queryByRole("button", { name: "Limpiar búsqueda" })).toBeNull();
  });

  it("actualizar vuelve a pedir los datos", async () => {
    const { user, bodies } = await openList();
    const n = bodies.length;
    await user.click(screen.getByRole("button", { name: "Actualizar tabla" }));
    await waitFor(() => expect(bodies.length).toBeGreaterThan(n));
  });

  it("eliminar con confirmación y refrescar", async () => {
    const del = stub("delete", "/residents/1", { success: true });
    const { user, bodies } = await openList();
    const n = bodies.length;
    await user.click(screen.getAllByRole("button", { name: "Eliminar" })[0]);
    const dialog = await dialogOf("Confirmar Eliminación");
    expect(within(dialog).getByText(/Ana Pérez/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Eliminar expediente" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Residente eliminado", type: "success" }));
    expect(del.path).toBe("/residents/1");
    await waitFor(() => expect(bodies.length).toBeGreaterThan(n));
  });

  it("si el API rechaza la baja muestra su mensaje o el texto por defecto", async () => {
    stub("delete", "/residents/1", { success: false, messages: ["Tiene adeudos"] });
    const { user } = await openList();
    await user.click(screen.getAllByRole("button", { name: "Eliminar" })[0]);
    let dialog = await dialogOf("Confirmar Eliminación");
    await user.click(within(dialog).getByRole("button", { name: "Eliminar expediente" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Tiene adeudos", type: "error" }));

    stub("delete", "/residents/1", { success: false });
    await user.click(within(dialog).getByRole("button", { name: "Eliminar expediente" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Error al eliminar", type: "error" }));
    dialog = await dialogOf("Confirmar Eliminación");
    expect(dialog).toBeInTheDocument();
  });

  it("error HTTP al eliminar usa los mensajes del cuerpo", async () => {
    fail("delete", "/residents/1", ["No permitido"], 500);
    const { user } = await openList();
    await user.click(screen.getAllByRole("button", { name: "Eliminar" })[0]);
    const dialog = await dialogOf("Confirmar Eliminación");
    await user.click(within(dialog).getByRole("button", { name: "Eliminar expediente" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "No permitido", type: "error" }));
  });

  it("visor de INE con frente y reverso", async () => {
    const { user } = await openList();
    await user.click(screen.getAllByRole("button", { name: "Ver identificación" })[0]);
    const dialog = await dialogOf("Identificación: Ana Pérez");
    expect(within(dialog).getByAltText("Frente")).toHaveAttribute("src", "http://x/frente.jpg");
    expect(within(dialog).getByAltText("Reverso")).toHaveAttribute("src", "http://x/reverso.jpg");
    await user.click(within(dialog).getByRole("button", { name: "Cerrar Visor" }));
    await waitFor(() => expect(screen.queryByText("Identificación: Ana Pérez")).toBeNull());
  });

  it("visor de INE sin identificaciones archivadas", async () => {
    const { user } = await openList();
    await user.click(screen.getAllByRole("button", { name: "Ver identificación" })[1]);
    const dialog = await dialogOf("Identificación: Beto Ruiz");
    expect(within(dialog).getByText("Sin identificaciones archivadas")).toBeInTheDocument();
    expect(within(dialog).getByText(/Edita el expediente para subir fotografías del INE/)).toBeInTheDocument();
  });

  it("ver expediente navega al detalle", async () => {
    const ctx = await openList();
    stub("get", "/residents/1", { success: true, data: resident1 });
    stub("get", "/residents/1/contacts", { success: true, data: contacts });
    await ctx.user.click(screen.getAllByRole("button", { name: "Ver expediente" })[0]);
    expect(await screen.findByText("@ana")).toBeInTheDocument();
  });
});

describe("residentes: agenda de contactos", () => {
  it("lista contactos con teléfono y correo", async () => {
    const { dialog } = await openContacts();
    expect(within(dialog).getByText("María López")).toBeInTheDocument();
    expect(within(dialog).getByText("6641112233")).toBeInTheDocument();
    expect(within(dialog).getByText("maria@mail.com")).toBeInTheDocument();
    expect(within(dialog).getByText("Pedro Sin Datos")).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Agregar el primero" })).toBeNull();
  });

  it("estado vacío permite agregar el primero", async () => {
    const { user, dialog } = await openContacts([]);
    expect(within(dialog).getByText("Sin contactos registrados")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Agregar el primero" }));
    expect(within(dialog).getByText("Nuevo contacto")).toBeInTheDocument();
    expect(within(dialog).getByPlaceholderText("Ej. Juan Pérez")).toHaveValue("");
  });

  it("crea un contacto y refresca la lista", async () => {
    const created = stub("post", "/residents/1/contacts", { success: true, data: { id: 9 } });
    const { user, dialog } = await openContacts();
    await user.click(within(dialog).getByRole("button", { name: "Nuevo contacto" }));
    await user.type(within(dialog).getByPlaceholderText("Ej. Juan Pérez"), "Juan Pérez");
    await user.type(within(dialog).getByPlaceholderText("55 1234 5678"), "55 1234 5678");
    await user.type(within(dialog).getByPlaceholderText("correo@ejemplo.com"), "juan@mail.com");
    await user.click(within(dialog).getByRole("button", { name: "Guardar contacto" }));
    await waitFor(() => expect(created.body).toEqual({ name: "Juan Pérez", phone: "55 1234 5678", email: "juan@mail.com" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Contacto agregado", type: "success" }));
    expect(await within(dialog).findByText("María López")).toBeInTheDocument();
  });

  it("edita un contacto precargado y manda PUT", async () => {
    const updated = stub("put", "/residents/contacts/5", { success: true, data: {} });
    const { user, dialog } = await openContacts();
    await user.click(within(dialog).getAllByRole("button", { name: "Editar contacto" })[0]);
    await within(dialog).findByText("Editar contacto");
    expect(within(dialog).getByPlaceholderText("Ej. Juan Pérez")).toHaveValue("María López");
    expect(within(dialog).getByPlaceholderText("55 1234 5678")).toHaveValue("6641112233");
    await user.clear(within(dialog).getByPlaceholderText("Ej. Juan Pérez"));
    await user.type(within(dialog).getByPlaceholderText("Ej. Juan Pérez"), "María López 2");
    await user.click(within(dialog).getByRole("button", { name: "Actualizar contacto" }));
    await waitFor(() => expect(updated.body).toEqual({ name: "María López 2", phone: "6641112233", email: "maria@mail.com" }));
    expect(updated.path).toBe("/residents/contacts/5");
    await waitFor(() => expect(toast()).toMatchObject({ message: "Contacto actualizado", type: "success" }));
  });

  it("valida nombre requerido y email inválido", async () => {
    const created = stub("post", "/residents/1/contacts");
    const { user, dialog } = await openContacts();
    await user.click(within(dialog).getByRole("button", { name: "Nuevo contacto" }));
    await user.click(within(dialog).getByRole("button", { name: "Guardar contacto" }));
    expect(await within(dialog).findByText("El nombre es requerido")).toBeInTheDocument();
    expect(created.method).toBe("");

    await user.type(within(dialog).getByPlaceholderText("Ej. Juan Pérez"), "Juan");
    await user.type(within(dialog).getByPlaceholderText("correo@ejemplo.com"), "no-es-email");
    await user.click(within(dialog).getByRole("button", { name: "Guardar contacto" }));
    expect(await within(dialog).findByText("Email inválido")).toBeInTheDocument();
    expect(created.method).toBe("");
  });

  it("elimina con confirmación verdadera", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    const del = stub("delete", "/residents/contacts/5", { success: true });
    const { user, dialog } = await openContacts();
    await user.click(within(dialog).getAllByRole("button", { name: "Eliminar contacto" })[0]);
    await waitFor(() => expect(del.method).toBe("DELETE"));
    expect(confirm).toHaveBeenCalledWith("¿Estás seguro de eliminar este contacto?");
    await waitFor(() => expect(toast()).toMatchObject({ message: "Contacto eliminado", type: "success" }));
  });

  it("no elimina si la confirmación es falsa", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const del = stub("delete", "/residents/contacts/5");
    const { user, dialog } = await openContacts();
    await user.click(within(dialog).getAllByRole("button", { name: "Eliminar contacto" })[0]);
    await waitFor(() => expect(window.confirm).toHaveBeenCalled());
    expect(del.method).toBe("");
  });

  it("error al guardar y al eliminar avisa", async () => {
    fail("post", "/residents/1/contacts", ["Duplicado"], 500);
    const { user, dialog } = await openContacts();
    await user.click(within(dialog).getByRole("button", { name: "Nuevo contacto" }));
    await user.type(within(dialog).getByPlaceholderText("Ej. Juan Pérez"), "Juan");
    await user.click(within(dialog).getByRole("button", { name: "Guardar contacto" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Error al guardar contacto", type: "error" }));
    expect(within(dialog).getByText("Nuevo contacto")).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    vi.spyOn(window, "confirm").mockReturnValue(true);
    fail("delete", "/residents/contacts/5", ["No"], 500);
    await user.click(within(dialog).getAllByRole("button", { name: "Eliminar contacto" })[0]);
    await waitFor(() => expect(toast()).toMatchObject({ message: "Error al eliminar contacto", type: "error" }));
  });
});

describe("residentes: formulario", () => {
  it("valida el primer paso y el teléfono de 10 dígitos", async () => {
    const created = stub("post", "/residents");
    const { user } = await openCreateForm();
    await user.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(await screen.findByText("El nombre es requerido")).toBeInTheDocument();
    expect(screen.getByText("Los apellidos son requeridos")).toBeInTheDocument();
    expect(screen.getByText("Teléfono requerido")).toBeInTheDocument();
    expect(screen.getByText("Por favor, completa los campos requeridos")).toBeInTheDocument();

    await fillStep0(user, "Ana", "Pérez", "123");
    await user.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(await screen.findByText("El teléfono móvil debe tener exactamente 10 dígitos")).toBeInTheDocument();
    expect(created.method).toBe("");

    await user.clear(screen.getByPlaceholderText("Ej. 5551234567"));
    await user.type(screen.getByPlaceholderText("Ej. 5551234567"), "6641234567");
    await user.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(await screen.findByPlaceholderText("Ej. jperez123")).toBeInTheDocument();
  });

  it("valida usuario y contraseña en el segundo paso", async () => {
    const { user } = await openCreateForm();
    await fillStep0(user);
    await next(user);
    await screen.findByPlaceholderText("Ej. jperez123");
    await user.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(await screen.findByText("Usuario de acceso requerido")).toBeInTheDocument();
    expect(screen.getByText("Contraseña de acceso requerida")).toBeInTheDocument();

    await fillStep1(user);
    await user.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(await screen.findByPlaceholderText("Ej. Maria Martinez (Esposa)")).toBeInTheDocument();
  });

  it("navega con Siguiente y Atrás conservando los valores", async () => {
    const { user } = await openCreateForm();
    await fillStep0(user, "Ana", "Pérez", "6641234567");
    await next(user);
    await screen.findByPlaceholderText("Ej. jperez123");
    await user.click(screen.getByRole("button", { name: "Atrás" }));
    expect(await screen.findByPlaceholderText("Ej. Juan Carlos")).toHaveValue("Ana");
    expect(screen.getByPlaceholderText("Ej. Perez Hernandez")).toHaveValue("Pérez");
    expect(screen.getByPlaceholderText("Ej. 5551234567")).toHaveValue("6641234567");
  });

  it("deriva firstName/fatherLastName/motherLastName y envía el payload completo", async () => {
    const created = stub("post", "/residents", { success: true, data: { id: 9 } });
    stub("get", "/residents/9", { success: true, data: { ...resident1, id: 9, username: "jperez", name: "Juan Carlos" } });
    stub("get", "/residents/9/contacts", { success: true, data: [] });
    const { user } = await openCreateForm();
    await fillStep0(user, "Juan Carlos", "Perez Hernandez", "6641234567");
    await next(user);
    await fillStep1(user, "jperez", "secreto1");
    await pickOption(user, document.querySelector('input[name="propertyId"]') as HTMLElement, /A-101/);
    await next(user);
    await screen.findByPlaceholderText("Ej. Maria Martinez (Esposa)");
    await next(user);
    const notes = await screen.findByPlaceholderText("Observaciones internas, notas de recepción, etc.");
    await user.type(notes, "Nota interna");
    await user.click(screen.getByRole("button", { name: "Confirmar Registro" }));

    await waitFor(() =>
      expect(created.body).toEqual({
        name: "Juan Carlos",
        lastName: "Perez Hernandez",
        username: "jperez",
        password: "secreto1",
        propertyId: "10",
        firstName: "Juan Carlos",
        fatherLastName: "Perez",
        motherLastName: "Hernandez",
        phoneNumber: "6641234567",
        email: "",
        emergencyContact: "",
        emergencyPhone: "",
        ineFrontUrl: "",
        ineBackUrl: "",
        notes: "Nota interna",
      }),
    );
    await waitFor(() => expect(toast()).toMatchObject({ message: "Residente creado", type: "success" }));
    expect(await screen.findByText("@jperez")).toBeInTheDocument();
  });

  it("si el API rechaza el alta muestra su mensaje", async () => {
    stub("post", "/residents", { success: false, messages: ["Ya existe el residente"] });
    const { user } = await openCreateForm();
    await fillAllCreate(user);
    await user.click(screen.getByRole("button", { name: "Confirmar Registro" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Ya existe el residente", type: "error" }));
    expect(screen.getByPlaceholderText("Observaciones internas, notas de recepción, etc.")).toBeInTheDocument();
  });

  it("error HTTP al crear avisa con el mensaje del cuerpo", async () => {
    fail("post", "/residents", ["Duplicado"], 500);
    const { user } = await openCreateForm();
    await fillAllCreate(user);
    await user.click(screen.getByRole("button", { name: "Confirmar Registro" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Duplicado", type: "error" }));
  });

  it("en edición precarga, no exige contraseña y la omite del payload", async () => {
    stub("get", "/residents/1", { success: true, data: resident1 });
    stub("get", "/residents/1/contacts", { success: true, data: [] });
    stub("get", "/properties", { success: true, data: [property] });
    const updated = stub("put", "/residents/1", { success: true, data: {} });
    const { user } = renderApp({ route: "/residents/1/editar", role: "ADMIN" });
    await waitFor(() => expect(screen.getByPlaceholderText("Ej. Juan Carlos")).toHaveValue("Ana"));
    expect(screen.getByPlaceholderText("Ej. Perez Hernandez")).toHaveValue("Pérez");
    expect(screen.getByPlaceholderText("Ej. 5551234567")).toHaveValue("6641234567");
    expect(screen.getByPlaceholderText("Ej. juan@correo.com")).toHaveValue("ana@mail.com");

    await next(user);
    await screen.findByPlaceholderText("Ej. jperez123");
    expect(screen.getByPlaceholderText("Ej. jperez123")).toHaveValue("ana");
    expect(screen.getByPlaceholderText("Dejar vacío para no cambiar")).toHaveValue("");
    await next(user);
    await screen.findByPlaceholderText("Ej. Maria Martinez (Esposa)");
    await next(user);
    await screen.findByPlaceholderText("Observaciones internas, notas de recepción, etc.");
    await user.click(screen.getByRole("button", { name: "Guardar Cambios" }));

    await waitFor(() => expect(updated.body).toEqual({
      name: "Ana",
      lastName: "Pérez",
      username: "ana",
      propertyId: "10",
      firstName: "Ana",
      fatherLastName: "Pérez",
      motherLastName: "Soto",
      phoneNumber: "6641234567",
      email: "ana@mail.com",
      emergencyContact: "Luis Pérez",
      emergencyPhone: "6649876543",
      ineFrontUrl: "http://x/frente.jpg",
      ineBackUrl: "http://x/reverso.jpg",
      notes: "Nota interna del expediente",
    }));
    expect((updated.body as Record<string, unknown>).password).toBeUndefined();
    await waitFor(() => expect(toast()).toMatchObject({ message: "Expediente actualizado", type: "success" }));
    expect(await screen.findByText("@ana")).toBeInTheDocument();
  });

  it("step=identificacion abre el cuarto paso directamente", async () => {
    stub("get", "/properties", { success: true, data: [property] });
    renderApp({ route: "/residents/nuevo?step=identificacion", role: "ADMIN" });
    expect(await screen.findByPlaceholderText("Observaciones internas, notas de recepción, etc.")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Ej. Juan Carlos")).toBeNull();
    expect(document.querySelectorAll('input[type="file"]')).toHaveLength(2);
  });

  it("sube el INE desde el detalle (navegando al paso de identificación)", async () => {
    stub("get", "/residents/2", { success: true, data: resident2 });
    stub("get", "/residents/2/contacts", { success: true, data: [] });
    stub("get", "/properties", { success: true, data: [property] });
    const { user } = renderApp({ route: "/residents/2", role: "ADMIN" });
    await screen.findByText("@beto");
    await user.click(screen.getByRole("button", { name: "Agregar INE" }));
    await screen.findByPlaceholderText("Observaciones internas, notas de recepción, etc.");

    mockTransport((config) =>
      config.url === "/uploads"
        ? { data: { success: true, data: { url: "http://img/frente.png" } } }
        : { data: { success: true, data: [] } },
    );
    await uploadAt(user, 0, png());
    await waitFor(() => expect(toast()).toMatchObject({ message: "Foto cargada exitosamente", type: "success" }));
    expect(await screen.findByAltText("Vista previa")).toBeInTheDocument();
  });

  it("si la subida del INE no devuelve URL avisa", async () => {
    stub("get", "/properties", { success: true, data: [property] });
    const { user } = renderApp({ route: "/residents/nuevo?step=identificacion", role: "ADMIN" });
    await screen.findByPlaceholderText("Observaciones internas, notas de recepción, etc.");
    mockTransport((config) =>
      config.url === "/uploads" ? { data: { success: false } } : { data: { success: true, data: [] } },
    );
    await uploadAt(user, 1, png());
    await waitFor(() => expect(toast()).toMatchObject({ message: "Error al subir imagen", type: "error" }));
  });

  it("si la subida del INE falla por red avisa", async () => {
    stub("get", "/properties", { success: true, data: [property] });
    const { user } = renderApp({ route: "/residents/nuevo?step=identificacion", role: "ADMIN" });
    await screen.findByPlaceholderText("Observaciones internas, notas de recepción, etc.");
    mockTransport((config) =>
      config.url === "/uploads" ? new Error("sin red") : { data: { success: true, data: [] } },
    );
    await uploadAt(user, 0, png());
    await waitFor(() => expect(toast()).toMatchObject({ message: "Error de red al subir imagen", type: "error" }));
  });
});

describe("residente: detalle", () => {
  it("muestra expediente, propiedad, emergencia, INE y notas", async () => {
    await openDetail();
    expect(screen.getAllByText("Ana Pérez").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("img", { name: /Ana Pérez/i }).length).toBeGreaterThan(0);
    expect(screen.getByText("@ana")).toBeInTheDocument();
    expect(screen.getByText("6641234567")).toBeInTheDocument();
    expect(screen.getByText("ana@mail.com")).toBeInTheDocument();
    expect(screen.getByText("A-101")).toBeInTheDocument();
    expect(screen.getAllByText("Casa 101").length).toBeGreaterThan(0);
    expect(screen.getByText("Luis Pérez")).toBeInTheDocument();
    expect(screen.getByText("6649876543")).toBeInTheDocument();
    expect(screen.getByAltText("INE frontal")).toHaveAttribute("src", "http://x/frente.jpg");
    expect(screen.getByAltText("INE reverso")).toHaveAttribute("src", "http://x/reverso.jpg");
    expect(screen.getByRole("button", { name: "Actualizar INE" })).toBeInTheDocument();
    expect(screen.getByText("Nota interna del expediente")).toBeInTheDocument();
    expect(screen.getByText("Contactos (2)")).toBeInTheDocument();
  });

  it("sin INE ni notas muestra los estados vacíos", async () => {
    await openDetail(resident2, []);
    expect(screen.getAllByText("Beto Ruiz").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Agregar INE" })).toBeInTheDocument();
    expect(screen.getByText("Sin identificación")).toBeInTheDocument();
    expect(screen.getByText("Sin notas registradas.")).toBeInTheDocument();
    expect(screen.getByText("Contactos (0)")).toBeInTheDocument();
  });

  it("la pestaña de contactos lista y permite eliminar con diálogo", async () => {
    const del = stub("delete", "/residents/contacts/5", { success: true });
    const { user } = await openDetail();
    await user.click(screen.getByRole("button", { name: "Contactos (2)" }));
    expect(await screen.findByText("Contactos del residente")).toBeInTheDocument();
    expect(screen.getByText("María López")).toBeInTheDocument();
    expect(screen.getByText("Hermana")).toBeInTheDocument();
    expect(screen.getByText("6641112233")).toBeInTheDocument();
    expect(screen.getByText("Pedro Sin Datos")).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "Eliminar contacto" })[0]);
    let dialog = await dialogOf("Eliminar contacto");
    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByRole("heading", { name: "Eliminar contacto" })).toBeNull());
    expect(del.method).toBe("");

    await user.click(screen.getAllByRole("button", { name: "Eliminar contacto" })[0]);
    dialog = await dialogOf("Eliminar contacto");
    await user.click(within(dialog).getByRole("button", { name: "Eliminar contacto" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Contacto eliminado", type: "success" }));
    expect(del.path).toBe("/residents/contacts/5");
  });

  it("pestaña de pagos muestra el estado de cuenta del residente", async () => {
    stub("get", "/residents/1/finance", {
      success: true,
      data: {
        summary: { currency: "MXN", propertyId: 10, balance: 600, totalCharges: 1000, totalPaid: 400, applied: 400, credit: 0, pendingCharges: 1 },
        charges: [
          {
            id: 30,
            propertyId: 10,
            residentId: 1,
            concept: "Cuota mensual 2026-11",
            category: "CUOTA",
            amount: 1000,
            dueDate: "2026-11-10T00:00:00.000Z",
            status: "PARTIAL",
            period: "2026-11",
            paidAmount: 400,
            outstanding: 600,
            createdAt: "2026-10-20T00:00:00.000Z",
          },
        ],
        payments: [
          {
            id: 40,
            propertyId: 10,
            residentId: 1,
            folio: 1,
            amount: 400,
            method: "EFECTIVO",
            reference: "REC-001",
            paidAt: "2026-11-05T12:00:00.000Z",
            unallocatedAmount: 0,
            appliedAmount: 400,
            credit: 0,
            allocations: [],
          },
        ],
      },
    });
    const { user } = await openDetail();
    await user.click(screen.getByRole("button", { name: "Pagos" }));
    expect(await screen.findByText("Estado de cuenta")).toBeInTheDocument();
    expect(screen.getByText("Cuota mensual 2026-11")).toBeInTheDocument();
    expect(screen.getByText("Folio 000001")).toBeInTheDocument();
    expect(screen.getAllByText("$1,000.00").length).toBeGreaterThan(0);
    expect(screen.getAllByText("$600.00").length).toBeGreaterThan(0);

    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    mockTransport(() => ({ data: new Blob(["%PDF-1.7"], { type: "application/pdf" }), status: 200 }));
    await user.click(screen.getByRole("button", { name: "Recibo" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Recibo descargado", type: "success" }));
    expect(click).toHaveBeenCalled();
  });

  it("pestaña de contactos vacía y pases sin propiedad", async () => {
    const { user } = await openDetail(resident2, []);
    await user.click(screen.getByRole("button", { name: "Contactos (0)" }));
    expect(await screen.findByText("Sin contactos")).toBeInTheDocument();
    expect(screen.getByText(/Agrega contactos para poder generarles pases/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Pases" }));
    expect(await screen.findByText("Sin propiedad asignada")).toBeInTheDocument();
    expect(screen.getByText(/no tiene una propiedad para generar pases/)).toBeInTheDocument();
  });

  it("muestra error y reintenta la carga", async () => {
    fail("get", "/residents/1", ["Servicio no disponible"], 500);
    stub("get", "/residents/1/contacts", { success: true, data: [] });
    const { user } = renderApp({ route: "/residents/1", role: "ADMIN" });
    expect(await screen.findByText("Servicio no disponible")).toBeInTheDocument();
    stub("get", "/residents/1", { success: true, data: resident1 });
    await user.click(screen.getByRole("button", { name: /reintentar/i }));
    expect(await screen.findByText("@ana")).toBeInTheDocument();
  });

  it("si la respuesta no trae datos avisa que no se encontró", async () => {
    stub("get", "/residents/1", { success: false });
    stub("get", "/residents/1/contacts", { success: true, data: [] });
    renderApp({ route: "/residents/1", role: "ADMIN" });
    expect(await screen.findByText("No se encontró el residente.")).toBeInTheDocument();
  });

  it("editar expediente navega al formulario precargado", async () => {
    stub("get", "/properties", { success: true, data: [property] });
    const { user } = await openDetail();
    await user.click(screen.getByRole("button", { name: "Editar expediente" }));
    await waitFor(() => expect(screen.getByPlaceholderText("Ej. Juan Carlos")).toHaveValue("Ana"));
  });

  it("actualizar INE abre el formulario en identificación con las vistas previas", async () => {
    stub("get", "/properties", { success: true, data: [property] });
    const { user } = await openDetail();
    await user.click(screen.getByRole("button", { name: "Actualizar INE" }));
    expect(await screen.findByPlaceholderText("Observaciones internas, notas de recepción, etc.")).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByAltText("Vista previa")).toHaveLength(2));
  });
});

describe("residente: pases", () => {
  it("lista pases con vigencia, alcance y revocadas", async () => {
    const { loads } = await openPases(auths);
    expect(loads()).toBe(1);
    expect(screen.getByText("María López")).toBeInTheDocument();
    expect(screen.getByText(/Peatón · 20\/10–21\/10 · 10:00–12:00/)).toBeInTheDocument();
    expect(screen.getByText(/Vehículo · 18\/10 · 08:00–09:00/)).toBeInTheDocument();
    expect(screen.getByText("Revocada")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Generar pase" })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Revocar" })).toHaveLength(1);
  });

  it("actualizar pases y revocar recargan la lista", async () => {
    const revoke = stub("post", "/authorizations/21/revoke", { success: true });
    const { user, loads } = await openPases(auths);
    await user.click(screen.getByRole("button", { name: "Actualizar pases" }));
    await waitFor(() => expect(loads()).toBe(2));
    await user.click(screen.getByRole("button", { name: "Revocar" }));
    await waitFor(() => expect(revoke.path).toBe("/authorizations/21/revoke"));
    await waitFor(() => expect(loads()).toBe(3));
  });

  it("genera el pase de una autorización existente y muestra el QR", async () => {
    const pass = stub("post", "/authorizations/21/pass", { success: true, data: { token: "tok-21" } });
    vi.spyOn(QRCode, "toDataURL").mockResolvedValue("data:image/png;base64,AAAA" as never);
    const { user } = await openPases([auths[0]]);
    await user.click(screen.getAllByRole("button", { name: "Generar pase" }).at(-1)!);
    await waitFor(() => expect(pass.path).toBe("/authorizations/21/pass"));
    expect(await screen.findByAltText("Pase de María López")).toBeInTheDocument();
    expect(screen.getByText(/Este token se muestra una sola vez/)).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByAltText("Pase de María López")).toBeNull());
  });

  it("genera un pase para un contacto usando el candidato de personas", async () => {
    const search = stub("get", "/persons", { success: true, data: [{ id: 7, firstName: "María", lastName: "López" }] });
    const auth = stub("post", "/properties/10/authorizations", { success: true, data: { id: 30 } });
    const pass = stub("post", "/authorizations/30/pass", { success: true, data: { token: "tok-30" } });
    vi.spyOn(QRCode, "toDataURL").mockResolvedValue("data:image/png;base64,AAAA" as never);
    const { user } = await openPases([]);
    await pickOption(user, screen.getByPlaceholderText("Contacto, Rappi u otro..."), /María López/);
    await user.click(screen.getByRole("button", { name: "Generar pase" }));
    await waitFor(() =>
      expect(auth.body).toMatchObject({ personId: 7, scope: "PEDESTRIAN", days: [0, 1, 2, 3, 4, 5, 6] }),
    );
    expect(search.search).toBe("?q=6641112233");
    await waitFor(() => expect(pass.path).toBe("/authorizations/30/pass"));
    expect(await screen.findByAltText("Pase de María López")).toBeInTheDocument();
  });

  it("con Otro/Rappi crea la persona si no hay candidatos", async () => {
    stub("get", "/persons", { success: true, data: [] });
    const createdPerson = stub("post", "/persons", { success: true, data: { id: 55 } });
    const auth = stub("post", "/properties/10/authorizations", { success: true, data: { id: 31 } });
    stub("post", "/authorizations/31/pass", { success: true, data: { token: "tok-31" } });
    vi.spyOn(QRCode, "toDataURL").mockResolvedValue("data:image/png;base64,AAAA" as never);
    const { user } = await openPases([]);
    await pickOption(user, screen.getByPlaceholderText("Contacto, Rappi u otro..."), "Otro / Rappi");
    await user.type(await screen.findByPlaceholderText("Ej. Rappi"), "Rappi");
    await user.type(screen.getByPlaceholderText("664..."), "6640000000");
    await user.click(screen.getByRole("button", { name: "Generar pase" }));
    await waitFor(() =>
      expect(createdPerson.body).toEqual({ firstName: "Rappi", lastName: null, phone: "6640000000", email: null, confirmNewPerson: true }),
    );
    await waitFor(() => expect(auth.body).toMatchObject({ personId: 55 }));
    expect(await screen.findByAltText("Pase de Rappi")).toBeInTheDocument();
  });

  it("con Otro/Rappi usa el candidato si ya existe", async () => {
    stub("get", "/persons", { success: true, data: [{ id: 9, firstName: "Rappi", lastName: null }] });
    const createdPerson = stub("post", "/persons");
    const auth = stub("post", "/properties/10/authorizations", { success: true, data: { id: 32 } });
    stub("post", "/authorizations/32/pass", { success: true, data: { token: "tok-32" } });
    vi.spyOn(QRCode, "toDataURL").mockResolvedValue("data:image/png;base64,AAAA" as never);
    const { user } = await openPases([]);
    await pickOption(user, screen.getByPlaceholderText("Contacto, Rappi u otro..."), "Otro / Rappi");
    await user.type(await screen.findByPlaceholderText("Ej. Rappi"), "Rappi");
    await user.click(screen.getByRole("button", { name: "Generar pase" }));
    await waitFor(() => expect(auth.body).toMatchObject({ personId: 9 }));
    expect(createdPerson.method).toBe("");
  });

  it("sin contacto ni nombre avisa antes de generar", async () => {
    const { user } = await openPases([]);
    await user.click(screen.getByRole("button", { name: "Generar pase" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Elige un contacto o escribe el nombre", type: "warning" }));
  });

  it("si el pase falla avisa y no muestra QR", async () => {
    stub("post", "/authorizations/21/pass", { success: false, messages: ["Token vencido"] });
    const { user } = await openPases([auths[0]]);
    await user.click(screen.getAllByRole("button", { name: "Generar pase" }).at(-1)!);
    await waitFor(() => expect(toast()).toMatchObject({ message: "Token vencido", type: "error" }));
    expect(screen.queryByAltText(/Pase de/)).toBeNull();
  });

  it("si la autorización falla avisa el motivo", async () => {
    stub("get", "/persons", { success: true, data: [{ id: 7, firstName: "María", lastName: "López" }] });
    stub("post", "/properties/10/authorizations", { success: false, messages: ["Sin cupo"] });
    const { user } = await openPases([]);
    await pickOption(user, screen.getByPlaceholderText("Contacto, Rappi u otro..."), /María López/);
    await user.click(screen.getByRole("button", { name: "Generar pase" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Sin cupo", type: "error" }));
  });

  it("el pase rápido de un contacto abre la pestaña de pases con el contacto elegido", async () => {
    const { user } = await openDetail();
    countedGet("/properties/10/authorizations", { success: true, data: [] });
    await user.click(screen.getByRole("button", { name: "Contactos (2)" }));
    await user.click(screen.getAllByRole("button", { name: "Pase rápido" })[0]);
    expect(await screen.findByText("Generar pase de acceso")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByDisplayValue(/María López/)).toBeInTheDocument());
  });
});
