import { test, expect } from "@playwright/test";
import { createUser } from "../../data/users";
import { environmentSpec } from "../../config/environment";
import {
  expectUserFormToBeCleared,
  expectGetUsersApiResponse,
} from "../assertions/users";
import { logApiRequest, logApiResponse } from "../../utils/api-logger";
import { createTransaction } from "../../data/transactions";
import { expectTransactionFormToBeCleared } from "../assertions/transactions";
import { mockSession } from "../../mock-ui/mock-session";

const API_URL = environmentSpec.apiBaseUrl;
const createUsrUrl = `${API_URL}/api/users`;
const createTransactionUrl = `${API_URL}/api/transactions`;
test.beforeEach(async ({ request }) => {
  const res = await request.post(`${API_URL}/test/reset`);

  expect(res.status()).toBe(204);
});

test("register a new user and create a new transfer to that user", async ({
  page,
  request,
}, testInfo) => {
  const logFilePath = testInfo.outputPath("api.log");
  const newUser = createUser({
    name: "Sheldon Cooper",
    email: "scooper@gmail.com",
    accountType: "premium",
  });
  console.log("==== creating new user ====");
  await page.goto("/");
  await page.getByLabel("Name").fill(newUser.name);
  await page.getByLabel("Email").fill(newUser.email);
  await page.getByLabel("Account Type").selectOption(newUser.accountType);
  await page.getByRole("button", { name: "Add User" }).click();
  const status = page.getByRole("status");
  await expect(status).toHaveText(new RegExp(/^Added user with user id: \d+$/));
  const confTxt = await status.textContent();
  const usrIdMatch = confTxt?.match(/^Added user with user id: (\d+)$/);
  expect(usrIdMatch).not.toBeNull();
  const createdUsrId = usrIdMatch![1];
  console.log(`Created user with id: ${createdUsrId}`);
  await expectUserFormToBeCleared(page);

  console.log(`==== get alice's user data and balance ====`);
  await logApiRequest(logFilePath, {
    method: "GET",
    url: `${createUsrUrl}/${mockSession.user.id}`,
  });
  const getAliceRes = await request.get(
    `${createUsrUrl}/${mockSession.user.id}`,
    {
      headers: {
        authorization: "Bearer admin-token",
      },
    },
  );
  const getAliceData = await getAliceRes.json();
  await logApiResponse(logFilePath, { res: getAliceRes, body: getAliceData });
  expect(getAliceRes.status()).toBe(200);
  console.log(`alice has balance: ${getAliceData.balanceCents}`);

  console.log("==== get alice's transaction history ===");
  await logApiRequest(logFilePath, {
    method: "GET",
    url: `${createTransactionUrl}/${mockSession.user.id}`,
  });
  const getAliceTranscRes = await request.get(
    `${createTransactionUrl}/${mockSession.user.id}`,
    {
      headers: {
        authorization: "Bearer admin-token",
      },
    },
  );
  const getAliceTranscData = await getAliceTranscRes.json();
  await logApiResponse(logFilePath, {
    res: getAliceTranscRes,
    body: getAliceTranscData,
  });
  expect(getAliceTranscRes.status()).toBe(200);
  expect(getAliceTranscData.length).toBe(0);

  console.log(`==== get the newly created user with id: ${createdUsrId} ====`);
  await logApiRequest(logFilePath, {
    method: "GET",
    url: `${createUsrUrl}/${createdUsrId}`,
  });
  const getUsrRes = await request.get(`${createUsrUrl}/${createdUsrId}`, {
    headers: {
      authorization: "Bearer admin-token",
    },
  });
  const getUsrData = await getUsrRes.json();
  await logApiResponse(logFilePath, { res: getUsrRes, body: getUsrData });
  expect(getUsrRes.status()).toBe(200);
  expectGetUsersApiResponse(getUsrData, {
    id: createdUsrId,
    balanceCents: 0,
    ...newUser,
  });
  console.log(`new user has balance: ${getUsrData.balanceCents}`);

  console.log("==== get transaction history for the newly created user ===");
  await logApiRequest(logFilePath, {
    method: "GET",
    url: `${createTransactionUrl}/${createdUsrId}`,
  });
  const getTranscRes = await request.get(
    `${createTransactionUrl}/${createdUsrId}`,
    {
      headers: {
        authorization: "Bearer admin-token",
      },
    },
  );
  const getTranscData = await getTranscRes.json();
  await logApiResponse(logFilePath, { res: getTranscRes, body: getTranscData });
  expect(getTranscRes.status()).toBe(200);
  expect(getTranscData.length).toBe(0);

  console.log(
    `==== create new transaction - Alice transfers to newly created usrr ${createdUsrId} ===`,
  );
  const newTransaction = createTransaction({ recipientId: `${createdUsrId}` });
  await page.goto("/transactions.html");
  await page.getByLabel("Amount").fill(String(newTransaction.amount));
  await page
    .getByLabel("Transfer Type")
    .selectOption(newTransaction.transactionType);
  await page.getByLabel("Recipient").fill(newTransaction.recipientId);
  await page.getByRole("button", { name: "Create Transaction" }).click();
  const amtCents = newTransaction.amount * 100;
  await expect(page.getByRole("status")).toHaveText(
    `Transfer of amount: ${amtCents} completed successfully.`,
  );
  await expectTransactionFormToBeCleared(page);

  console.log(
    `==== get the new balance for user with id: ${createdUsrId} ====`,
  );
  await logApiRequest(logFilePath, {
    method: "GET",
    url: `${createUsrUrl}/${createdUsrId}`,
  });
  const getUsrResAfter = await request.get(`${createUsrUrl}/${createdUsrId}`, {
    headers: {
      authorization: "Bearer admin-token",
    },
  });
  const getUsrDataAfter = await getUsrResAfter.json();
  await logApiResponse(logFilePath, {
    res: getUsrResAfter,
    body: getUsrDataAfter,
  });
  expect(getUsrResAfter.status()).toBe(200);

  console.log(
    `User with id: ${getUsrDataAfter.id} has balance: ${getUsrDataAfter.balanceCents}`,
  );
  expect(getUsrDataAfter.balanceCents).toEqual(
    getUsrData.balanceCents + newTransaction.amount * 100,
  );

  console.log(
    `==== get new transaction history for  user with id: ${createdUsrId}  ===`,
  );
  await logApiRequest(logFilePath, {
    method: "GET",
    url: `${createTransactionUrl}/${createdUsrId}`,
  });
  const getTranscResAfter = await request.get(
    `${createTransactionUrl}/${createdUsrId}`,
    {
      headers: {
        authorization: "Bearer admin-token",
      },
    },
  );
  const getTranscDataAfter = await getTranscResAfter.json();
  await logApiResponse(logFilePath, {
    res: getTranscResAfter,
    body: getTranscDataAfter,
  });
  expect(getTranscResAfter.status()).toBe(200);
  expect(getTranscDataAfter.length).toBe(getTranscData.length + 1);
  const recipientTransaction = getTranscDataAfter[0];
  expect(recipientTransaction).toMatchObject({
    senderId: "1",
    recipientId: createdUsrId,
    amountCents: newTransaction.amount * 100,
    transactionType: newTransaction.transactionType,
  });

  const transcId = getTranscDataAfter[0].id;
  console.log(`new transaction id is: ${transcId}`);

  console.log(`==== get alice's user data and balance after the transfer ====`);
  await logApiRequest(logFilePath, {
    method: "GET",
    url: `${createUsrUrl}/${mockSession.user.id}`,
  });
  const getAliceResAfter = await request.get(
    `${createUsrUrl}/${mockSession.user.id}`,
    {
      headers: {
        authorization: "Bearer admin-token",
      },
    },
  );
  const getAliceDataAfter = await getAliceResAfter.json();
  await logApiResponse(logFilePath, {
    res: getAliceResAfter,
    body: getAliceDataAfter,
  });

  expect(getAliceResAfter.status()).toBe(200);
  console.log(`alice new balance: ${getAliceDataAfter.balanceCents}`);

  expect(getAliceDataAfter.balanceCents).toEqual(
    getAliceData.balanceCents - newTransaction.amount * 100,
  );

  console.log("==== get alice's transaction history after the transfer ===");
  await logApiRequest(logFilePath, {
    method: "GET",
    url: `${createTransactionUrl}/${mockSession.user.id}`,
  });
  const getAliceTranscResAfter = await request.get(
    `${createTransactionUrl}/${mockSession.user.id}`,
    {
      headers: {
        authorization: "Bearer admin-token",
      },
    },
  );
  const getAliceTranscDataAfter = await getAliceTranscResAfter.json();
  await logApiResponse(logFilePath, {
    res: getAliceTranscResAfter,
    body: getAliceTranscDataAfter,
  });
  expect(getAliceTranscResAfter.status()).toBe(200);
  expect(getAliceTranscDataAfter.length).toBe(getAliceTranscData.length + 1);

  const aliceTransaction = getAliceTranscDataAfter.find(
    (transaction) => transaction.id === transcId,
  );

  expect(aliceTransaction).toEqual(recipientTransaction);
});
