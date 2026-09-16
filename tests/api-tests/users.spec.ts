import { test, expect } from "@playwright/test";
import { environmentSpec } from "../../config/environment.ts";
import { createUser, aliceUser } from "../../data/users.ts";
import {
  expectCreateUsersApiResponse,
  expectGetUsersApiResponse,
} from "../assertions/users.ts";
import { logApiRequest, logApiResponse } from "../../utils/api-logger.ts";
const API_URL = environmentSpec.apiBaseUrl;
const createUsersUrl = `${API_URL}/api/users`;

test("creates a new user and retrieves the user", async ({
  request,
}, testInfo) => {
  const newUser = createUser();
  const logFilePath = testInfo.outputPath("api.log");

  await logApiRequest(logFilePath, {
    method: "POST",
    url: createUsersUrl,
    body: newUser,
  });
  const res = await request.post(`${createUsersUrl}`, {
    headers: { "content-type": "application/json" },
    data: newUser,
  });

  const data = await res.json();
  await logApiResponse(logFilePath, { res: res, body: data });
  expect(res.status()).toBe(201);

  expectCreateUsersApiResponse(data, newUser);
  const getRes = await request.get(`${createUsersUrl}/${data.id}`, {
    headers: {
      "content-type": "application/json",
      authorization: "Bearer admin-token",
    },
  });
  const getData = await getRes.json();
  console.log(`${getData}`);
  expect(getRes.status()).toBe(200);

  expectCreateUsersApiResponse(getData, newUser);
  expect(getData.id).toBe(data.id);
});

test("rejects a user request missing name", async ({ request }, testInfo) => {
  const logFilePath = testInfo.outputPath("api.log");
  const { name, ...userWithoutName } = createUser();
  await logApiRequest(logFilePath, {
    method: "POST",
    url: createUsersUrl,
    body: userWithoutName,
  });
  const res = await request.post(`${createUsersUrl}`, {
    headers: { "content-type": "application/json" },
    data: userWithoutName,
  });
  const data = await res.json();
  await logApiResponse(logFilePath, { res: res, body: data });
  expect(res.status()).toBe(400);
  expect(data.error).toBe(
    "Invalid request: name, email and accountType are required!",
  );
});

test("rejects a user request missing email", async ({ request }, testInfo) => {
  const logFilePath = testInfo.outputPath("api.log");
  const { email, ...userWithoutEmail } = createUser();
  await logApiRequest(logFilePath, {
    method: "POST",
    url: createUsersUrl,
    body: userWithoutEmail,
  });
  const res = await request.post(`${createUsersUrl}`, {
    headers: { "content-type": "application/json" },
    data: userWithoutEmail,
  });
  const data = await res.json();
  await logApiResponse(logFilePath, { res: res, body: data });
  expect(res.status()).toBe(400);
  expect(data.error).toBe(
    "Invalid request: name, email and accountType are required!",
  );
});

test("rejects a user request missing account type", async ({
  request,
}, testInfo) => {
  const logFilePath = testInfo.outputPath("api.log");
  const { accountType, ...userWithoutAccountType } = createUser();
  await logApiRequest(logFilePath, {
    method: "POST",
    url: createUsersUrl,
    body: userWithoutAccountType,
  });
  const res = await request.post(`${createUsersUrl}`, {
    headers: { "content-type": "application/json" },
    data: userWithoutAccountType,
  });
  const data = await res.json();
  await logApiResponse(logFilePath, { res: res, body: data });
  expect(res.status()).toBe(400);
  expect(data.error).toBe(
    "Invalid request: name, email and accountType are required!",
  );
});

test("rejects a user request where name field is empty string", async ({
  request,
}, testInfo) => {
  const logFilePath = testInfo.outputPath("api.log");
  const newUser = createUser({ name: " " });
  await logApiRequest(logFilePath, {
    method: "POST",
    url: createUsersUrl,
    body: newUser,
  });
  const res = await request.post(`${createUsersUrl}`, {
    headers: { "content-type": "application/json" },
    data: newUser,
  });
  const data = await res.json();
  await logApiResponse(logFilePath, { res: res, body: data });
  expect(res.status()).toBe(400);
  expect(data.error).toBe(
    "Invalid request: name, email and accountType are required!",
  );
});

test("rejects a user request with duplicate email", async ({
  request,
}, testInfo) => {
  const logFilePath = testInfo.outputPath("api.log");
  const newUser = createUser();
  await logApiRequest(logFilePath, {
    method: "POST",
    url: createUsersUrl,
    body: newUser,
  });
  const res = await request.post(`${createUsersUrl}`, {
    headers: { "content-type": "application/json" },
    data: newUser,
  });
  expect(res.status()).toBe(201);
  await logApiRequest(logFilePath, {
    method: "POST",
    url: createUsersUrl,
    body: newUser,
  });
  const resRetry = await request.post(`${createUsersUrl}`, {
    headers: { "content-type": "application/json" },
    data: newUser,
  });
  const data = await resRetry.json();
  await logApiResponse(logFilePath, { res: resRetry, body: data });
  expect(resRetry.status()).toBe(409);
  expect(data.error).toBe("Duplicate user record found");
});

test("rejects a user request with invalid account type", async ({
  request,
}, testInfo) => {
  const logFilePath = testInfo.outputPath("api.log");
  const newUser = createUser({
    accountType: "invalid",
  });
  await logApiRequest(logFilePath, {
    method: "POST",
    url: createUsersUrl,
    body: newUser,
  });
  const res = await request.post(`${createUsersUrl}`, {
    headers: { "content-type": "application/json" },
    data: newUser,
  });
  const data = await res.json();
  await logApiResponse(logFilePath, { res: res, body: data });
  expect(res.status()).toBe(400);
  expect(data.error).toBe("Unsupported account type specified");
});

test("rejects a user request with unsupported name format", async ({
  request,
}, testInfo) => {
  const logFilePath = testInfo.outputPath("api.log");
  const newUser = createUser({
    name: "abc#24",
  });
  await logApiRequest(logFilePath, {
    method: "POST",
    url: createUsersUrl,
    body: newUser,
  });
  const res = await request.post(`${createUsersUrl}`, {
    headers: { "content-type": "application/json" },
    data: newUser,
  });
  const data = await res.json();
  await logApiResponse(logFilePath, { res: res, body: data });
  expect(res.status()).toBe(400);
  expect(data.error).toBe("Invalid name format");
});

test("rejects a user request with unsupported email format ", async ({
  request,
}, testInfo) => {
  const logFilePath = testInfo.outputPath("api.log");
  const newUser = createUser({
    email: "janedoehotmail.com",
  });
  await logApiRequest(logFilePath, {
    method: "POST",
    url: createUsersUrl,
    body: newUser,
  });
  const res = await request.post(`${createUsersUrl}`, {
    headers: { "content-type": "application/json" },
    data: newUser,
  });
  const data = await res.json();
  await logApiResponse(logFilePath, { res: res, body: data });
  expect(res.status()).toBe(400);
  expect(data.error).toBe("Invalid email format");
});

test("returns not found for an unknown user", async ({ request }, testInfo) => {
  const logFilePath = testInfo.outputPath("api.log");
  const url = `${createUsersUrl}/99999`;
  await logApiRequest(logFilePath, {
    method: "GET",
    url: url,
  });
  const res = await request.get(url, {
    headers: {
      "content-type": "application/json",
      authorization: "Bearer admin-token",
    },
  });
  const data = await res.json();
  await logApiResponse(logFilePath, { res: res, body: data });
  expect(res.status()).toBe(404);
  expect(data.error).toBe("Failed to find user");
});

test("get user data with a valid token", async ({ request }, testInfo) => {
  const logFilePath = testInfo.outputPath("api.log");
  const url = `${createUsersUrl}/1`;
  await logApiRequest(logFilePath, {
    method: "GET",
    url: url,
  });
  const res = await request.get(url, {
    headers: {
      "content-type": "application/json",
      authorization: "Bearer alice-token",
    },
  });
  const data = await res.json();
  await logApiResponse(logFilePath, { res: res, body: data });
  expect(res.status()).toBe(200);
  expectGetUsersApiResponse(data, aliceUser());
});

test("get user data fails with an expired token", async ({
  request,
}, testInfo) => {
  const logFilePath = testInfo.outputPath("api.log");
  const url = `${createUsersUrl}/1`;
  await logApiRequest(logFilePath, {
    method: "GET",
    url: url,
  });
  const res = await request.get(url, {
    headers: {
      "content-type": "application/json",
      authorization: "Bearer alice-expired-token",
    },
  });
  const data = await res.json();
  await logApiResponse(logFilePath, { res: res, body: data });
  expect(res.status()).toBe(401);
  expect(data.error).toBe("Token expired!");
});

test("get user dats fails with an invalid token", async ({
  request,
}, testInfo) => {
  const logFilePath = testInfo.outputPath("api.log");
  const url = `${createUsersUrl}/1`;
  await logApiRequest(logFilePath, {
    method: "GET",
    url: url,
  });
  const res = await request.get(url, {
    headers: {
      "content-type": "application/json",
      authorization: "Bearer invalid-token",
    },
  });
  const data = await res.json();
  await logApiResponse(logFilePath, { res: res, body: data });
  expect(res.status()).toBe(401);
  expect(data.error).toBe("Unauthorized!");
});

// User 2 (bob) tries to access Alice's data
test("get user data fails with insufficient permissions", async ({
  request,
}, testInfo) => {
  const logFilePath = testInfo.outputPath("api.log");
  const url = `${createUsersUrl}/1`;
  await logApiRequest(logFilePath, {
    method: "GET",
    url: url,
  });
  const res = await request.get(url, {
    headers: {
      "content-type": "application/json",
      authorization: "Bearer bob-token",
    },
  });
  const data = await res.json();
  await logApiResponse(logFilePath, { res: res, body: data });
  expect(res.status()).toBe(403);
  expect(data.error).toBe("User has insufficient permissions!");
});

test("get user data fails with no token", async ({ request }, testInfo) => {
  const logFilePath = testInfo.outputPath("api.log");
  const url = `${createUsersUrl}/1`;
  await logApiRequest(logFilePath, {
    method: "GET",
    url: url,
  });
  const res = await request.get(url, {
    headers: {
      "content-type": "application/json",
    },
  });
  const data = await res.json();
  await logApiResponse(logFilePath, { res: res, body: data });
  expect(res.status()).toBe(401);
  expect(data.error).toBe("Unauthorized!");
});
