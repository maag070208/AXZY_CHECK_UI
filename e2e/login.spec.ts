import { test, expect } from "@playwright/test";

const DEMO_ADMIN = { username: "admin", password: "123456" };

test("con credenciales válidas entra al panel", async ({ page }) => {
  await page.goto("/login");
  await page.locator('input[name="username"]').fill(DEMO_ADMIN.username);
  await page.locator('input[name="password"]').fill(DEMO_ADMIN.password);
  await page.getByRole("button", { name: "Iniciar Sesión" }).click();
  await expect(page).toHaveURL(/\/home/);
});

test("con contraseña incorrecta no entra", async ({ page }) => {
  await page.goto("/login");
  await page.locator('input[name="username"]').fill(DEMO_ADMIN.username);
  await page.locator('input[name="password"]').fill("incorrecta-123");
  await page.getByRole("button", { name: "Iniciar Sesión" }).click();
  await expect(page).toHaveURL(/\/login/);
});

test("cerrar sesión regresa al login y /home ya no abre sin sesión", async ({ page }) => {
  await page.goto("/login");
  await page.locator('input[name="username"]').fill(DEMO_ADMIN.username);
  await page.locator('input[name="password"]').fill(DEMO_ADMIN.password);
  await page.getByRole("button", { name: "Iniciar Sesión" }).click();
  await expect(page).toHaveURL(/\/home/);

  await page.getByRole("button", { name: /Admin/ }).first().click();
  await page.getByRole("button", { name: "Cerrar Sesión" }).click();
  await expect(page).toHaveURL(/\/login/);
  // La URL cambia antes de que signOut borre el token: esperamos a que se borre.
  await expect.poll(() => page.evaluate(() => localStorage.getItem("token"))).toBeNull();

  await page.goto("/home");
  await expect(page).toHaveURL(/\/login/);
});
