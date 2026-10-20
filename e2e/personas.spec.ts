import { test, expect, Page } from "@playwright/test";

const login = async (page: Page) => {
  await page.goto("/login");
  await page.locator('input[name="username"]').fill("admin");
  await page.locator('input[name="password"]').fill("123456");
  await page.getByRole("button", { name: "Iniciar Sesión" }).click();
  await expect(page).toHaveURL(/\/home/);
};

test("A2: crear una persona, detectar duplicado por teléfono y agregar un contacto", async ({ page }) => {
  await login(page);
  const phone = `66${Date.now().toString().slice(-8)}`;

  await page.goto("/#/persons");
  await page.getByRole("button", { name: "Nueva persona" }).click();
  await page.locator('input[name="firstName"]').fill("Luisa");
  await page.locator('input[name="lastName"]').fill("E2E Mora");
  await page.locator('input[name="phone"]').fill(phone);
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(page).toHaveURL(/\/#\/persons\/\d+/);

  // Segunda persona con el mismo teléfono: se advierte antes de crear.
  await page.goto("/#/persons");
  await page.getByRole("button", { name: "Nueva persona" }).click();
  await page.locator('input[name="firstName"]').fill("Otra");
  await page.locator('input[name="phone"]').fill(phone);
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(page.getByText("Ya existe alguien con estos datos")).toBeVisible();
  await page.getByRole("button", { name: "Cancelar" }).click();

  // Ficha: agregar un contacto y verlo en la lista.
  await page.goto("/#/persons");
  await page.locator('input[name="q"]').fill("Luisa");
  await page.getByRole("button", { name: /Luisa E2E Mora/ }).click();
  await page.locator('input[name="contactName"]').fill("Hermano E2E");
  await page.locator('input[name="contactRelationship"]').fill("Hermano");
  await page.getByRole("button", { name: "Agregar contacto" }).click();
  await expect(page.getByText(/Hermano E2E · Hermano/)).toBeVisible();
});
