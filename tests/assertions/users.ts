import { expect, type Page } from "@playwright/test";
import type { UserInput } from "../../data/users";

export async function expectUserFormToBeCleared(page: Page): Promise<void> {
  await expect(page.getByLabel("Name")).toHaveValue("");
  await expect(page.getByLabel("Email")).toHaveValue("");
  await expect(page.getByLabel("Account Type")).toHaveValue("basic");
}

export async function expectUserFormToBeRetained(
  page: Page,
  expected: UserInput,
): Promise<void> {
  await expect(page.getByLabel("Name")).toHaveValue(expected.name);
  await expect(page.getByLabel("Email")).toHaveValue(expected.email);
  await expect(page.getByLabel("Account Type")).toHaveValue(
    expected.accountType,
  );
}
