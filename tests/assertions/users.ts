import { expect, type Page } from "@playwright/test";

export async function expectUserFormToBeCleared(page: Page): Promise<void> {
  await expect(page.getByLabel("Name")).toHaveValue("");
  await expect(page.getByLabel("Email")).toHaveValue("");
  await expect(page.getByLabel("Account Type")).toHaveValue("basic");
}
