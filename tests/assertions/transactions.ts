import type { TransactionInput } from "../../data/transactions";
import { expect, type Page } from "@playwright/test";

export type TransactionResponse = {
  id: string;
  senderId: string;
  recipientId: string;
  amountCents: number;
  transactionType: string;
  createdAt: string;
};

export async function expectTransactionFormToBeCleared(
  page: Page,
): Promise<void> {
  await expect(page.getByLabel("Amount")).toHaveValue("");
  await expect(page.getByLabel("Transfer Type")).toHaveValue("transfer");
  await expect(page.getByLabel("Recipient")).toHaveValue("");
}

export async function expectTransactionFormToBeRetained(
  page: Page,
  expected: TransactionInput,
): Promise<void> {
  await expect(page.getByLabel("Amount")).toHaveValue(String(expected.amount));
  await expect(page.getByLabel("Transfer Type")).toHaveValue(
    expected.transactionType,
  );
  await expect(page.getByLabel("Recipient")).toHaveValue(expected.recipientId);
}

export function expectCreateTransactionApiResponse(
  actual: TransactionResponse,
  expected: TransactionInput,
  senderId: string,
): void {
  expect(typeof actual.id).toBe("string");
  expect(actual.id.length).toBeGreaterThan(0);
  expect(actual.senderId).toBe(senderId);
  expect(actual.recipientId).toBe(expected.recipientId);
  expect(actual.amountCents).toBe(Math.round(expected.amount * 100));
  expect(actual.transactionType).toBe(expected.transactionType);
  expect(Number.isNaN(Date.parse(actual.createdAt))).toBe(false);
}
