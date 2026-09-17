import { test, expect } from "@playwright/test";
import { createTransaction } from "../../data/transactions";
import { randomUUID } from "crypto";
import {
  expectTransactionFormToBeCleared,
  expectTransactionFormToBeRetained,
} from "../assertions/transactions";
import { mockSession } from "../../mock-ui/mock-session";

test("creates a new transaction and clears the form", async ({ page }) => {
  const newTransaction = createTransaction();
  const mockResponse = {
    id: randomUUID(),
    senderId: mockSession.user.id,
    recipientId: newTransaction.recipientId,
    amountCents: newTransaction.amount * 100,
    transactionType: newTransaction.transactionType,
    createdAt: new Date().toISOString(),
  };
  await page.route("**/api/transactions", async (route) => {
    const req = route.request();
    expect(req.method()).toBe("POST");
    expect(req.postDataJSON()).toEqual(newTransaction);

    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify(mockResponse),
    });
  });

  await page.goto("/transactions.html");
  await page.getByLabel("Amount").fill(String(newTransaction.amount));
  await page
    .getByLabel("Transfer Type")
    .selectOption(newTransaction.transactionType);
  await page.getByLabel("Recipient").fill(newTransaction.recipientId);
  await page.getByRole("button", { name: "Create Transaction" }).click();
  await expect(page.getByRole("status")).toHaveText(
    `Transfer of amount: ${mockResponse.amountCents} completed successfully.`,
  );
  await expectTransactionFormToBeCleared(page);
});

test("rejects submission when amount field is empty", async ({ page }) => {
  const { amount, ...rest } = createTransaction();
  await page.goto("/transactions.html");
  await page.getByLabel("Recipient").fill(rest.recipientId);
  await page.getByRole("button", { name: "Create Transaction" }).click();
  await expect(page.getByRole("status")).toHaveText(
    `Amount is a required field`,
  );
  await expect(page.getByLabel("Transfer Type")).toHaveValue(
    rest.transactionType,
  );
  await expect(page.getByLabel("Recipient")).toHaveValue(rest.recipientId);
});

test("rejects submission when recipient field is empty", async ({ page }) => {
  const { recipientId, ...rest } = createTransaction();
  await page.goto("/transactions.html");
  await page.getByLabel("Amount").fill("10");
  await page.getByRole("button", { name: "Create Transaction" }).click();
  await expect(page.getByRole("status")).toHaveText(
    `Recipient is a required field`,
  );
  await expect(page.getByLabel("Amount")).toHaveValue(String(rest.amount));
  await expect(page.getByLabel("Transfer Type")).toHaveValue(
    rest.transactionType,
  );
});

test("rejects submission when amount is 0", async ({ page }) => {
  const newTransaction = createTransaction({ amount: 0 });
  await page.goto("/transactions.html");
  await page.getByLabel("Amount").fill(String(newTransaction.amount));
  await page
    .getByLabel("Transfer Type")
    .selectOption(newTransaction.transactionType);
  await page.getByLabel("Recipient").fill(newTransaction.recipientId);
  await page.getByRole("button", { name: "Create Transaction" }).click();
  await expect(page.getByRole("status")).toHaveText(
    `Invalid amount specified!`,
  );
  await expectTransactionFormToBeRetained(page, newTransaction);
});

test("rejects submission when amount is a negative value", async ({ page }) => {
  const newTransaction = createTransaction({ amount: -1 });
  await page.goto("/transactions.html");
  await page.getByLabel("Amount").fill(String(newTransaction.amount));
  await page
    .getByLabel("Transfer Type")
    .selectOption(newTransaction.transactionType);
  await page.getByLabel("Recipient").fill(newTransaction.recipientId);
  await page.getByRole("button", { name: "Create Transaction" }).click();
  await expect(page.getByRole("status")).toHaveText(
    `Invalid amount specified!`,
  );
  await expectTransactionFormToBeRetained(page, newTransaction);
});

test("displays an error when recipient does not exist", async ({ page }) => {
  const newTransaction = createTransaction({ recipientId: "999999" });
  const errorMsg = "Recipient does not exist";
  await page.route("**/api/transactions", async (route) => {
    const req = route.request();
    expect(req.method()).toBe("POST");
    expect(req.postDataJSON()).toEqual(newTransaction);

    await route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({ error: `${errorMsg}` }),
    });
  });
  await page.goto("/transactions.html");
  await page.getByLabel("Amount").fill(String(newTransaction.amount));
  await page
    .getByLabel("Transfer Type")
    .selectOption(newTransaction.transactionType);
  await page.getByLabel("Recipient").fill(newTransaction.recipientId);
  await page.getByRole("button", { name: "Create Transaction" }).click();
  await expect(page.getByRole("status")).toHaveText(`${errorMsg}`);
  await expectTransactionFormToBeRetained(page, newTransaction);
});

test("displays an error when recipient id is invalid", async ({ page }) => {
  const newTransaction = createTransaction({ recipientId: "0" });
  const errorMsg = "Invalid recipient id specified!";

  await page.goto("/transactions.html");
  await page.getByLabel("Amount").fill(String(newTransaction.amount));
  await page
    .getByLabel("Transfer Type")
    .selectOption(newTransaction.transactionType);
  await page.getByLabel("Recipient").fill(newTransaction.recipientId);
  await page.getByRole("button", { name: "Create Transaction" }).click();
  await expect(page.getByRole("status")).toHaveText(`${errorMsg}`);
  await expectTransactionFormToBeRetained(page, newTransaction);
});

test("displays an error when sender does not have sufficient funds", async ({
  page,
}) => {
  const newTransaction = createTransaction({ amount: 999999 });
  const errorMsg = "Insufficient funds available";
  await page.route("**/api/transactions", async (route) => {
    const req = route.request();
    expect(req.method()).toBe("POST");
    expect(req.postDataJSON()).toEqual(newTransaction);

    await route.fulfill({
      status: 422,
      contentType: "application/json",
      body: JSON.stringify({ error: `${errorMsg}` }),
    });
  });
  await page.goto("/transactions.html");
  await page.getByLabel("Amount").fill(String(newTransaction.amount));
  await page
    .getByLabel("Transfer Type")
    .selectOption(newTransaction.transactionType);
  await page.getByLabel("Recipient").fill(newTransaction.recipientId);
  await page.getByRole("button", { name: "Create Transaction" }).click();
  await expect(page.getByRole("status")).toHaveText(`${errorMsg}`);
  await expectTransactionFormToBeRetained(page, newTransaction);
});

test("displays an error when user is unauthorized", async ({ page }) => {
  const newTransaction = createTransaction();
  const errorMsg = "Unauthorized!";
  await page.route("**/api/transactions", async (route) => {
    const req = route.request();
    expect(req.method()).toBe("POST");
    expect(req.postDataJSON()).toEqual(newTransaction);

    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ error: `${errorMsg}` }),
    });
  });
  await page.goto("/transactions.html");
  await page.getByLabel("Amount").fill(String(newTransaction.amount));
  await page
    .getByLabel("Transfer Type")
    .selectOption(newTransaction.transactionType);
  await page.getByLabel("Recipient").fill(newTransaction.recipientId);
  await page.getByRole("button", { name: "Create Transaction" }).click();
  await expect(page.getByRole("status")).toHaveText(`${errorMsg}`);
  await expectTransactionFormToBeRetained(page, newTransaction);
});

test("displays an error when transferring to self", async ({ page }) => {
  const newTransaction = createTransaction({
    recipientId: `${mockSession.user.id}`,
  });
  const errorMsg = "Invalid recipient. Cannot transfer to self.";
  await page.goto("/transactions.html");
  await page.getByLabel("Amount").fill(String(newTransaction.amount));
  await page
    .getByLabel("Transfer Type")
    .selectOption(newTransaction.transactionType);
  await page.getByLabel("Recipient").fill(newTransaction.recipientId);
  await page.getByRole("button", { name: "Create Transaction" }).click();
  await expect(page.getByRole("status")).toHaveText(`${errorMsg}`);
  await expectTransactionFormToBeRetained(page, newTransaction);
});
