import { test, expect, Page } from "@playwright/test";

const login = async (page: Page) => {
  await page.goto("/login");
  await page.locator('input[name="username"]').fill("admin");
  await page.locator('input[name="password"]').fill("123456");
  await page.getByRole("button", { name: "Iniciar Sesión" }).click();
  await expect(page).toHaveURL(/\/home/);
};

test("el administrador encuentra Propiedades y Residentes en el menú", async ({ page }) => {
  await login(page);
  await page.getByRole("button", { name: "Operación" }).click();
  await page.getByText("Propiedades", { exact: true }).click();
  await expect(page).toHaveURL(/#\/properties/);
  await page.getByRole("button", { name: "Operación" }).click();
  await page.getByText("Residentes", { exact: true }).click();
  await expect(page).toHaveURL(/#\/residents/);
});
