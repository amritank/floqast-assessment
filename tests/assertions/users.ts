import { expect, type Page } from "@playwright/test";
import type { UserInput } from "../../data/users";

export type UserResponse = {
  id: string;
  name: string;
  email: string;
  accountType: string;
  balanceCents: number;
};

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

export function expectCreateUsersApiResponse(
  actual: UserResponse,
  expected: UserInput,
): void {
  expect(actual.id).toMatch(/^\d+$/);
  expect(actual.name).toBe(expected.name);
  expect(actual.email).toBe(expected.email);
  expect(actual.accountType).toBe(expected.accountType);
  expect(actual.balanceCents).toBe(0);
}

export function expectGetUsersApiResponse(
  actual: UserResponse,
  expected: UserResponse,
): void {
  expect(actual.id).toBe(expected.id);
  expect(actual.name).toBe(expected.name);
  expect(actual.email).toBe(expected.email);
  expect(actual.accountType).toBe(expected.accountType);
  expect(actual.balanceCents).toBeGreaterThanOrEqual(0);
}
