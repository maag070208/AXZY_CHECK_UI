import { test, expect, Page } from "@playwright/test";

const login = async (page: Page) => {
  await page.goto("/login");
  await page.locator('input[name="username"]').fill("admin");
  await page.locator('input[name="password"]').fill("123456");
  await page.getByRole("button", { name: "Iniciar Sesión" }).click();
  await expect(page).toHaveURL(/\/home/);
};

test("A2: autorizar a una persona en una propiedad, verla en la lista y revocarla", async ({ page }) => {
  await login(page);
  const name = `Jardinero${Date.now().toString().slice(-6)}`;

  // 1) Crear la persona en la pantalla de personas.
  await page.goto("/#/persons");
  await page.getByRole("button", { name: "Nueva persona" }).click();
  await page.locator('input[name="firstName"]').fill(name);
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(page).toHaveURL(/\/#\/persons\/\d+/);

  // 2) Propiedad de la demo (id obtenido de la API con la misma sesión).
  const propertyId = await page.evaluate(async () => {
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:4444/api/v1/properties", { headers: { Authorization: `Bearer ${token}` } });
    return (await res.json()).data[0].id as number;
  });

  // 3) Autorizar con horario de lunes a viernes.
  await page.goto(`/#/properties/${propertyId}`);
  await expect(page.getByRole("heading", { name: "Personas autorizadas" })).toBeVisible();
  await page.locator('input[name="authPerson"]').fill(name);
  await page.getByRole("button", { name: new RegExp(name) }).click();
  await page.locator('select[name="scope"]').selectOption("PEDESTRIAN");
  await page.getByRole("button", { name: "Autorizar acceso" }).click();
  const row = page.locator("li", { hasText: name });
  await expect(row).toContainText("Peatón");

  // 4) Revocar: queda marcada como revocada.
  await row.getByRole("button", { name: "Revocar" }).click();
  await expect(row).toContainText("Revocada");
});
