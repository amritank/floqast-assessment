import { test, expect } from "@playwright/test";
import { environmentSpec } from "../../config/environment.ts";
import { createUser } from "../../data/users.ts";
import { expectCreateUsersApiResponse } from "../assertions/users.ts";

const API_URL = environmentSpec.apiBaseUrl;
const createUsersUrl = `${API_URL}/api/users`;

test("creates a new user and retrieves the user", async ({ request }) => {
  const newUser = createUser();
  const res = await request.post(`${createUsersUrl}`, {
    headers: { "content-type": "application/json" },
    data: newUser,
  });
  const data = await res.json();
  expect(res.status()).toBe(201);

  expectCreateUsersApiResponse(data, newUser);
  const getRes = await request.get(`${createUsersUrl}/${data.id}`, {
    headers: { "content-type": "application/json" },
  });
  const getData = await getRes.json();
  console.log(`${getData}`);
  expect(getRes.status()).toBe(200);

  expectCreateUsersApiResponse(getData, newUser);
  expect(getData.id).toBe(data.id);
});

test("rejects a user request missing name", async ({ request }) => {
  const { name, ...userWithoutName } = createUser();
  const res = await request.post(`${createUsersUrl}`, {
    headers: { "content-type": "application/json" },
    data: userWithoutName,
  });
  const data = await res.json();
  expect(res.status()).toBe(400);
  expect(data.error).toBe(
    "Invalid request: name, email and accountType are required!",
  );
});

test("rejects a user request missing email", async ({ request }) => {
  const { email, ...userWithoutEmail } = createUser();
  const res = await request.post(`${createUsersUrl}`, {
    headers: { "content-type": "application/json" },
    data: userWithoutEmail,
  });
  const data = await res.json();
  expect(res.status()).toBe(400);
  expect(data.error).toBe(
    "Invalid request: name, email and accountType are required!",
  );
});

test("rejects a user request missing account type", async ({ request }) => {
  const { accountType, ...userWithoutAccountType } = createUser();
  const res = await request.post(`${createUsersUrl}`, {
    headers: { "content-type": "application/json" },
    data: userWithoutAccountType,
  });
  const data = await res.json();
  expect(res.status()).toBe(400);
  expect(data.error).toBe(
    "Invalid request: name, email and accountType are required!",
  );
});

test("rejects a user request where name field is empty string", async ({
  request,
}) => {
  const newUser = createUser({ name: " " });
  const res = await request.post(`${createUsersUrl}`, {
    headers: { "content-type": "application/json" },
    data: newUser,
  });
  const data = await res.json();
  expect(res.status()).toBe(400);
  expect(data.error).toBe(
    "Invalid request: name, email and accountType are required!",
  );
});

test("rejects a user request with duplicate email", async ({ request }) => {
  const newUser = createUser();
  const res = await request.post(`${createUsersUrl}`, {
    headers: { "content-type": "application/json" },
    data: newUser,
  });
  expect(res.status()).toBe(201);
  const resRetry = await request.post(`${createUsersUrl}`, {
    headers: { "content-type": "application/json" },
    data: newUser,
  });
  const data = await resRetry.json();
  expect(resRetry.status()).toBe(409);
  expect(data.error).toBe("Duplicate user record found");
});

test("rejects a user request with invalid account type", async ({
  request,
}) => {
  const newUser = createUser({
    accountType: "invalid",
  });
  const res = await request.post(`${createUsersUrl}`, {
    headers: { "content-type": "application/json" },
    data: newUser,
  });
  const data = await res.json();
  expect(res.status()).toBe(400);
  expect(data.error).toBe("Unsupported account type specified");
});

test("rejects a user request with unsupported name format", async ({
  request,
}) => {
  const newUser = createUser({
    name: "abc#24",
  });
  const res = await request.post(`${createUsersUrl}`, {
    headers: { "content-type": "application/json" },
    data: newUser,
  });
  const data = await res.json();
  expect(res.status()).toBe(400);
  expect(data.error).toBe("Invalid name format");
});

test("rejects a user request with unsupported email format ", async ({
  request,
}) => {
  const newUser = createUser({
    email: "janedoehotmail.com",
  });
  const res = await request.post(`${createUsersUrl}`, {
    headers: { "content-type": "application/json" },
    data: newUser,
  });
  const data = await res.json();
  expect(res.status()).toBe(400);
  expect(data.error).toBe("Invalid email format");
});

test("returns not found for an unknown user", async ({ request }) => {
  const res = await request.get(`${createUsersUrl}/99999`, {
    headers: { "content-type": "application/json" },
  });
  const data = await res.json();
  expect(res.status()).toBe(404);
  expect(data.error).toBe("Failed to find user");
});
