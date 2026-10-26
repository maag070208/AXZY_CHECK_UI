import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

const login = async (page: Page) => {
  await page.goto("/login");
  await page.locator('input[name="username"]').fill("admin");
  await page.locator('input[name="password"]').fill("123456");
  await page.getByRole("button", { name: "Iniciar Sesión" }).click();
  await expect(page).toHaveURL(/\/home/);
};

test("el administrador entra a Finanzas y ve Cargos, Pagos y Saldos", async ({ page }) => {
  await login(page);

  await page.getByRole("button", { name: "Finanzas" }).click();
  await expect(page).toHaveURL(/#\/finance/);
  await expect(page.getByText("Finanzas", { exact: true }).first()).toBeVisible();

  await expect(page.getByRole("button", { name: "Cargos" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Pagos" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Saldos" })).toBeVisible();

  await page.getByRole("button", { name: "Pagos" }).click();
  await expect(page.getByText("Folio", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Saldos" }).click();
  await expect(page.getByText("Pendientes", { exact: true })).toBeVisible();
});

test("el administrador abre el alta de cargo", async ({ page }) => {
  await login(page);
  await page.getByRole("button", { name: "Finanzas" }).click();
  await expect(page).toHaveURL(/#\/finance/);

  await page.getByRole("button", { name: "Nuevo cargo" }).click();
  await expect(page.getByText("Nuevo cargo", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Propiedad", { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "Cancelar" }).click();
});
