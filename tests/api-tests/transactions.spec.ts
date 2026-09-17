import { test, expect } from "@playwright/test";
import { expectCreateTransactionApiResponse } from "../assertions/transactions.ts";
import { environmentSpec } from "../../config/environment";
import { createTransaction } from "../../data/transactions.ts";
import { logApiRequest, logApiResponse } from "../../utils/api-logger.ts";

const MOCK_USER_ID_1 = "1";
const MOCK_USER_TOKEN_1 = "alice-token";
const MOCK_USER_ID_2 = "2";
const MOCK_USER_TOKEN_2 = "bob-token";
const API_URL = environmentSpec.apiBaseUrl;
const createTransactionUrl = `${API_URL}/api/transactions`;
const getTransactionUrl = `${createTransactionUrl}/${MOCK_USER_ID_1}`;
const usersUrl = `${API_URL}/api/users`;

test.beforeEach(async ({ request }) => {
  const res = await request.post(`${API_URL}/test/reset`);

  expect(res.status()).toBe(204);
});

test("creates a new transaction", async ({ request }, testInfo) => {
  const newTransaction = createTransaction();
  const logFilePath = testInfo.outputPath("api.log");
  await logApiRequest(logFilePath, {
    method: "GET",
    url: `${createTransactionUrl}/${MOCK_USER_ID_1}`,
  });

  console.log(
    "== get current list of transactions for the first mock user == ",
  );
  let getRes = await request.get(`${createTransactionUrl}/${MOCK_USER_ID_1}`, {
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${MOCK_USER_TOKEN_1}`,
    },
  });

  let getData = await getRes.json();
  await logApiResponse(logFilePath, { res: getRes, body: getData });
  expect(getRes.status()).toBe(200);
  expect(Array.isArray(getData)).toBe(true);
  const curTransactionCnt = getData.length;

  console.log("== get current balance of the first mock user == ");
  const mockUsr1BeforeRes = await request.get(`${usersUrl}/${MOCK_USER_ID_1}`, {
    headers: { authorization: `Bearer ${MOCK_USER_TOKEN_1}` },
  });
  expect(mockUsr1BeforeRes.status()).toBe(200);
  const mockUsr1BeforeData = await mockUsr1BeforeRes.json();

  console.log("== get current balance of the second mock user == ");
  const mockUsr2BeforeRes = await request.get(`${usersUrl}/${MOCK_USER_ID_2}`, {
    headers: { authorization: `Bearer ${MOCK_USER_TOKEN_2}` },
  });
  expect(mockUsr2BeforeRes.status()).toBe(200);
  const mockUsr2BeforeData = await mockUsr2BeforeRes.json();

  console.log("== create a new transaction == ");
  // create a transaction
  await logApiRequest(logFilePath, {
    method: "POST",
    url: createTransactionUrl,
    body: newTransaction,
  });

  const res = await request.post(`${createTransactionUrl}`, {
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${MOCK_USER_TOKEN_1}`,
    },
    data: newTransaction,
  });
  const data = await res.json();
  await logApiResponse(logFilePath, { res: res, body: data });
  expect(res.status()).toBe(201);
  expectCreateTransactionApiResponse(data, newTransaction, MOCK_USER_ID_1);

  console.log(
    "== verify transaction count for the first user has increased by 1 ==",
  );
  await logApiRequest(logFilePath, {
    method: "GET",
    url: `${createTransactionUrl}/${MOCK_USER_ID_1}`,
  });

  getRes = await request.get(`${createTransactionUrl}/${MOCK_USER_ID_1}`, {
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${MOCK_USER_TOKEN_1}`,
    },
  });

  getData = await getRes.json();
  await logApiResponse(logFilePath, { res: getRes, body: getData });
  expect(getRes.status()).toBe(200);
  expect(Array.isArray(getData)).toBe(true);
  expect(getData.length).toBe(curTransactionCnt + 1);
  console.log("== verify new transaction exists in the first users history ==");
  const storedTransaction = getData.find((entry) => entry.id === data.id);

  expect(storedTransaction).toBeTruthy();
  expectCreateTransactionApiResponse(
    storedTransaction,
    newTransaction,
    MOCK_USER_ID_1,
  );

  console.log(
    "== verify new transaction exists in the second users history ==",
  );
  await logApiRequest(logFilePath, {
    method: "GET",
    url: `${createTransactionUrl}/${MOCK_USER_ID_2}`,
  });

  const mockUsr2Res = await request.get(
    `${createTransactionUrl}/${MOCK_USER_ID_2}`,
    {
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${MOCK_USER_TOKEN_2}`,
      },
    },
  );

  const mockUsr2Data = await mockUsr2Res.json();
  await logApiResponse(logFilePath, { res: mockUsr2Res, body: mockUsr2Data });
  expect(mockUsr2Res.status()).toBe(200);
  expect(Array.isArray(mockUsr2Data)).toBe(true);
  const mockUsr2StoredTransaction = mockUsr2Data.find(
    (entry) => entry.id === data.id,
  );

  expect(mockUsr2StoredTransaction).toBeTruthy();
  expectCreateTransactionApiResponse(
    mockUsr2StoredTransaction,
    newTransaction,
    MOCK_USER_ID_1,
  );

  console.log("== compare balances ==");
  const mockUsr1AfterRes = await request.get(`${usersUrl}/${MOCK_USER_ID_1}`, {
    headers: { authorization: `Bearer ${MOCK_USER_TOKEN_1}` },
  });
  expect(mockUsr1AfterRes.status()).toBe(200);
  const mockUsr1AfterData = await mockUsr1AfterRes.json();

  const mockUsr2AfterRes = await request.get(`${usersUrl}/${MOCK_USER_ID_2}`, {
    headers: { authorization: `Bearer ${MOCK_USER_TOKEN_2}` },
  });
  expect(mockUsr2AfterRes.status()).toBe(200);
  const mockUsr2AfterData = await mockUsr2AfterRes.json();

  expect(mockUsr1AfterData.balanceCents).toBe(
    mockUsr1BeforeData.balanceCents - data.amountCents,
  );

  expect(mockUsr2AfterData.balanceCents).toBe(
    mockUsr2BeforeData.balanceCents + data.amountCents,
  );
});

test("rejects a transaction request when amount is negative", async ({
  request,
}, testInfo) => {
  const logFilePath = testInfo.outputPath("api.log");
  const newTransaction = createTransaction({ amount: -1 });

  await logApiRequest(logFilePath, {
    method: "POST",
    url: createTransactionUrl,
    body: newTransaction,
  });
  const res = await request.post(`${createTransactionUrl}`, {
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${MOCK_USER_TOKEN_1}`,
    },
    data: newTransaction,
  });

  const data = await res.json();
  await logApiResponse(logFilePath, { res: res, body: data });
  expect(res.status()).toBe(400);
  expect(data.error).toBe("Invalid request.");
});

test("rejects a transaction request when amount is zero", async ({
  request,
}, testInfo) => {
  const logFilePath = testInfo.outputPath("api.log");
  const newTransaction = createTransaction({ amount: 0 });

  await logApiRequest(logFilePath, {
    method: "POST",
    url: createTransactionUrl,
    body: newTransaction,
  });
  const res = await request.post(`${createTransactionUrl}`, {
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${MOCK_USER_TOKEN_1}`,
    },
    data: newTransaction,
  });

  const data = await res.json();
  await logApiResponse(logFilePath, { res: res, body: data });
  expect(res.status()).toBe(400);
  expect(data.error).toBe("Invalid request.");
});

test("rejects a transaction request for unsupported transaction type", async ({
  request,
}, testInfo) => {
  const logFilePath = testInfo.outputPath("api.log");
  const newTransaction = createTransaction({ transactionType: "invalid" });

  await logApiRequest(logFilePath, {
    method: "POST",
    url: createTransactionUrl,
    body: newTransaction,
  });
  const res = await request.post(`${createTransactionUrl}`, {
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${MOCK_USER_TOKEN_1}`,
    },
    data: newTransaction,
  });

  const data = await res.json();
  await logApiResponse(logFilePath, { res: res, body: data });
  expect(res.status()).toBe(400);
  expect(data.error).toBe("Invalid transaction type specified.");
});

test("rejects a transaction request when recipient id is same as sender id", async ({
  request,
}, testInfo) => {
  const logFilePath = testInfo.outputPath("api.log");
  const newTransaction = createTransaction({
    recipientId: `${MOCK_USER_ID_1}`,
  });

  await logApiRequest(logFilePath, {
    method: "POST",
    url: createTransactionUrl,
    body: newTransaction,
  });
  const res = await request.post(`${createTransactionUrl}`, {
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${MOCK_USER_TOKEN_1}`,
    },
    data: newTransaction,
  });

  const data = await res.json();
  await logApiResponse(logFilePath, { res: res, body: data });
  expect(res.status()).toBe(400);
  expect(data.error).toBe("Incorrect recipient. Cannot transfer to self.");
});

test("rejects a transaction request when recipient does not exist ", async ({
  request,
}, testInfo) => {
  const logFilePath = testInfo.outputPath("api.log");
  const newTransaction = createTransaction({
    recipientId: String(999999),
  });

  await logApiRequest(logFilePath, {
    method: "POST",
    url: createTransactionUrl,
    body: newTransaction,
  });
  const res = await request.post(`${createTransactionUrl}`, {
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${MOCK_USER_TOKEN_1}`,
    },
    data: newTransaction,
  });

  const data = await res.json();
  await logApiResponse(logFilePath, { res: res, body: data });
  expect(res.status()).toBe(404);
  expect(data.error).toBe("Recipient does not exist");
});

test("rejects a transaction request due to an invalid token", async ({
  request,
}, testInfo) => {
  const logFilePath = testInfo.outputPath("api.log");
  const newTransaction = createTransaction();

  await logApiRequest(logFilePath, {
    method: "POST",
    url: createTransactionUrl,
    body: newTransaction,
  });
  const res = await request.post(`${createTransactionUrl}`, {
    headers: {
      "content-type": "application/json",
      authorization: `Bearer invalid-token`,
    },
    data: newTransaction,
  });

  const data = await res.json();
  await logApiResponse(logFilePath, { res: res, body: data });
  expect(res.status()).toBe(401);
  expect(data.error).toBe("Unauthorized!");
});

test("rejects a transaction request when no token is passed", async ({
  request,
}, testInfo) => {
  const logFilePath = testInfo.outputPath("api.log");
  const newTransaction = createTransaction();

  await logApiRequest(logFilePath, {
    method: "POST",
    url: createTransactionUrl,
    body: newTransaction,
  });
  const res = await request.post(`${createTransactionUrl}`, {
    headers: {
      "content-type": "application/json",
    },
    data: newTransaction,
  });

  const data = await res.json();
  await logApiResponse(logFilePath, { res: res, body: data });
  expect(res.status()).toBe(401);
  expect(data.error).toBe("Unauthorized!");
});

test("rejects a transaction request due to an expired token", async ({
  request,
}, testInfo) => {
  const logFilePath = testInfo.outputPath("api.log");
  const newTransaction = createTransaction();

  await logApiRequest(logFilePath, {
    method: "POST",
    url: createTransactionUrl,
    body: newTransaction,
  });
  const res = await request.post(`${createTransactionUrl}`, {
    headers: {
      "content-type": "application/json",
      authorization: `Bearer alice-expired-token`,
    },
    data: newTransaction,
  });

  const data = await res.json();
  await logApiResponse(logFilePath, { res: res, body: data });
  expect(res.status()).toBe(401);
  expect(data.error).toBe("Token expired!");
});

test("rejects a transaction request when amount value has more than two decimal digits", async ({
  request,
}, testInfo) => {
  const logFilePath = testInfo.outputPath("api.log");
  const newTransaction = createTransaction({ amount: 12.3456 });

  await logApiRequest(logFilePath, {
    method: "POST",
    url: createTransactionUrl,
    body: newTransaction,
  });
  const res = await request.post(`${createTransactionUrl}`, {
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${MOCK_USER_TOKEN_1}`,
    },
    data: newTransaction,
  });

  const data = await res.json();
  await logApiResponse(logFilePath, { res: res, body: data });
  expect(res.status()).toBe(400);
  expect(data.error).toBe("Amount can have at most two decimal places");
});

test("rejects a transaction request due to insufficient sender funds", async ({
  request,
}, testInfo) => {
  const logFilePath = testInfo.outputPath("api.log");
  const newTransaction = createTransaction({ amount: 100000000 });

  await logApiRequest(logFilePath, {
    method: "GET",
    url: `${usersUrl}/${MOCK_USER_ID_1}`,
  });

  const beforeMockUsr1Res = await request.get(`${usersUrl}/${MOCK_USER_ID_1}`, {
    headers: { authorization: `Bearer ${MOCK_USER_TOKEN_1}` },
  });
  const beforeMockUsr1Data = await beforeMockUsr1Res.json();
  await logApiResponse(logFilePath, {
    res: beforeMockUsr1Res,
    body: beforeMockUsr1Data,
  });
  expect(beforeMockUsr1Res.status()).toBe(200);
  const beforeMockUsr1Bal = beforeMockUsr1Data.balanceCents;

  await logApiRequest(logFilePath, {
    method: "GET",
    url: `${usersUrl}/${MOCK_USER_ID_2}`,
  });

  const beforeMockUsr2Res = await request.get(`${usersUrl}/${MOCK_USER_ID_2}`, {
    headers: { authorization: `Bearer ${MOCK_USER_TOKEN_2}` },
  });
  const beforeMockUsr2Data = await beforeMockUsr2Res.json();
  await logApiResponse(logFilePath, {
    res: beforeMockUsr2Res,
    body: beforeMockUsr2Data,
  });
  expect(beforeMockUsr2Res.status()).toBe(200);
  const beforeMockUsr2Bal = beforeMockUsr2Data.balanceCents;

  await logApiRequest(logFilePath, {
    method: "POST",
    url: createTransactionUrl,
    body: newTransaction,
  });

  const res = await request.post(`${createTransactionUrl}`, {
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${MOCK_USER_TOKEN_1}`,
    },
    data: newTransaction,
  });

  const data = await res.json();
  await logApiResponse(logFilePath, { res: res, body: data });
  expect(res.status()).toBe(422);
  expect(data.error).toBe("Insufficient funds available");

  await logApiRequest(logFilePath, {
    method: "GET",
    url: `${usersUrl}/${MOCK_USER_ID_1}`,
  });

  const afterMockUsr1Res = await request.get(`${usersUrl}/${MOCK_USER_ID_1}`, {
    headers: { authorization: `Bearer ${MOCK_USER_TOKEN_1}` },
  });
  const afterMockUsr1Data = await afterMockUsr1Res.json();
  await logApiResponse(logFilePath, {
    res: afterMockUsr1Res,
    body: afterMockUsr1Data,
  });
  expect(afterMockUsr1Res.status()).toBe(200);
  const afterMockUsr1Bal = afterMockUsr1Data.balanceCents;

  await logApiRequest(logFilePath, {
    method: "GET",
    url: `${usersUrl}/${MOCK_USER_ID_2}`,
  });

  const afterMockUsr2Res = await request.get(`${usersUrl}/${MOCK_USER_ID_2}`, {
    headers: { authorization: `Bearer ${MOCK_USER_TOKEN_2}` },
  });
  const afterMockUsr2Data = await afterMockUsr2Res.json();
  await logApiResponse(logFilePath, {
    res: afterMockUsr2Res,
    body: afterMockUsr2Data,
  });
  expect(afterMockUsr2Res.status()).toBe(200);
  const afterMockUsr2Bal = afterMockUsr2Data.balanceCents;

  expect(beforeMockUsr1Bal.balanceCents).toEqual(afterMockUsr1Bal.balanceCents);
  expect(beforeMockUsr2Bal.balanceCents).toEqual(afterMockUsr2Bal.balanceCents);
});

// Get transaction test cases
test("get transaction fails due to an expired token", async ({
  request,
}, testInfo) => {
  const logFilePath = testInfo.outputPath("api.log");

  await logApiRequest(logFilePath, {
    method: "GET",
    url: getTransactionUrl,
  });
  const res = await request.get(`${getTransactionUrl}`, {
    headers: {
      "content-type": "application/json",
      authorization: `Bearer alice-expired-token`,
    },
  });

  const data = await res.json();
  await logApiResponse(logFilePath, { res: res, body: data });
  expect(res.status()).toBe(401);
  expect(data.error).toBe("Token expired!");
});

test("get transaction fails due to an invalid token", async ({
  request,
}, testInfo) => {
  const logFilePath = testInfo.outputPath("api.log");

  await logApiRequest(logFilePath, {
    method: "GET",
    url: getTransactionUrl,
  });
  const res = await request.get(`${getTransactionUrl}`, {
    headers: {
      "content-type": "application/json",
      authorization: `Bearer invalid-token`,
    },
  });

  const data = await res.json();
  await logApiResponse(logFilePath, { res: res, body: data });
  expect(res.status()).toBe(401);
  expect(data.error).toBe("Unauthorized!");
});

test("get transaction fails when no token is passed", async ({
  request,
}, testInfo) => {
  const logFilePath = testInfo.outputPath("api.log");

  await logApiRequest(logFilePath, {
    method: "GET",
    url: getTransactionUrl,
  });
  const res = await request.get(`${getTransactionUrl}`, {
    headers: {
      "content-type": "application/json",
    },
  });

  const data = await res.json();
  await logApiResponse(logFilePath, { res: res, body: data });
  expect(res.status()).toBe(401);
  expect(data.error).toBe("Unauthorized!");
});

test("get transaction fails due to insufficient permissions", async ({
  request,
}, testInfo) => {
  const logFilePath = testInfo.outputPath("api.log");

  await logApiRequest(logFilePath, {
    method: "GET",
    url: getTransactionUrl,
  });
  const res = await request.get(`${getTransactionUrl}`, {
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${MOCK_USER_TOKEN_2}`,
    },
  });

  const data = await res.json();
  await logApiResponse(logFilePath, { res: res, body: data });
  expect(res.status()).toBe(403);
  expect(data.error).toBe("User has insufficient permissions!");
});
