import { test, expect, Page } from "@playwright/test";

const CSV = [
  "identifier,name,mainStreet,kind,occupancy,floor,unitNumber",
  "E2E-DEP-304,Depto 304 E2E,Av. Central,APARTMENT,VACANT,3,304",
  "E2E-BAD,Sin tipo,Calle X,CASTILLO,VACANT,,",
].join("\n");

const login = async (page: Page) => {
  await page.goto("/login");
  await page.locator('input[name="username"]').fill("admin");
  await page.locator('input[name="password"]').fill("123456");
  await page.getByRole("button", { name: "Iniciar Sesión" }).click();
  await expect(page).toHaveURL(/\/home/);
};

test("T-A1-T9: importar un departamento, rentarlo con inquilino y ver el historial", async ({ page }) => {
  await login(page);

  // 1) Importación desde CSV: una fila válida y una inválida (tipo que no existe).
  await page.goto("/#/properties");
  await page.getByRole("button", { name: "Importar CSV" }).click();
  await page.getByLabel("Archivo CSV").setInputFiles({ name: "propiedades.csv", mimeType: "text/csv", buffer: Buffer.from(CSV) });
  await page.getByRole("button", { name: "Importar", exact: true }).click();
  await expect(page.getByText("Creadas: 1")).toBeVisible();
  await expect(page.getByText(/Fila 2: kind: tipo "CASTILLO" no existe/)).toBeVisible();
  await page.getByRole("button", { name: "Cerrar", exact: true }).last().click();

  // 2) Abrir la propiedad creada (id obtenido de la API con la misma sesión).
  const id = await page.evaluate(async () => {
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:4444/api/v1/properties", { headers: { Authorization: `Bearer ${token}` } });
    const body = await res.json();
    return body.data.find((p: { identifier: string }) => p.identifier === "E2E-DEP-304").id as number;
  });
  await page.goto(`/#/properties/${id}`);
  await expect(page.getByRole("heading", { name: "Ocupación" })).toBeVisible();
  await expect(page.getByText("Vacía", { exact: true }).first()).toBeVisible();

  // 3) Cambiar a Rentada con inquilino nuevo.
  await page.getByRole("button", { name: "Cambiar ocupación" }).click();
  await page.locator('select[name="target"]').selectOption("RENTED");
  await page.locator('input[name="personQuery"]').fill("Ana Torres");
  await page.getByRole("button", { name: /Crear persona/ }).click();
  await expect(page.getByText(/Seleccionado: Ana Torres/)).toBeVisible();
  await page.getByRole("button", { name: "Confirmar cambio" }).click();

  // 4) El historial tiene dos periodos: el cerrado (Vacía) y el vigente (Rentada con inquilino).
  await expect(page.getByText(/Rentada · Ana/)).toBeVisible();
  await expect(page.getByText(/→ vigente/)).toBeVisible();
  await expect(page.getByText("Vacía").first()).toBeVisible();
});
