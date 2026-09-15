import { test, expect } from "@playwright/test";
import { createUser } from "../../data/users";
import {
  expectUserFormToBeCleared,
  expectUserFormToBeRetained,
} from "../assertions/users";
import { trackPostRequest } from "../utils/request";

test("creates a new user and clears the form", async ({ page }) => {
  const newUser = createUser();
  await page.route("**/api/users", async (route) => {
    const req = route.request();
    expect(req.method()).toBe("POST");
    expect(req.postDataJSON()).toEqual(newUser);

    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        id: "user-1",
        ...newUser,
      }),
    });
  });

  await page.goto("/");
  await page.getByLabel("Name").fill(newUser.name);
  await page.getByLabel("Email").fill(newUser.email);
  await page.getByLabel("Account Type").selectOption(newUser.accountType);
  await page.getByRole("button", { name: "Add User" }).click();
  await expect(page.getByRole("status")).toHaveText(
    new RegExp("Added user with user id: user-1"),
  );
  await expectUserFormToBeCleared(page);
});

test("rejects submission when required fields are empty", async ({ page }) => {
  const requestCnt = trackPostRequest(page, "/api/users");

  await page.goto("/");
  await page.getByRole("button", { name: "Add User" }).click();
  await expect(page.getByRole("status")).toHaveText(
    new RegExp("All fields are required"),
  );
  expect(requestCnt()).toBe(0);
});

test("rejects submission when email is an invalid format", async ({ page }) => {
  const requestCnt = trackPostRequest(page, "/api/users");

  const newUser = createUser({ email: "abcgmail.com" });
  await page.goto("/");
  await page.getByLabel("Name").fill(newUser.name);
  await page.getByLabel("Email").fill(newUser.email);
  await page.getByLabel("Account Type").selectOption(newUser.accountType);
  await page.getByRole("button", { name: "Add User" }).click();
  await expect(page.getByRole("status")).toHaveText(
    new RegExp("Enter a valid email address"),
  );
  expect(requestCnt()).toBe(0);
  await expectUserFormToBeRetained(page, newUser);
});

test("displays error when creating duplicate user", async ({ page }) => {
  const newUser = createUser();
  await page.route("**/api/users", async (route) => {
    const req = route.request();
    expect(req.method()).toBe("POST");
    expect(req.postDataJSON()).toEqual(newUser);

    await route.fulfill({
      status: 409,
      contentType: "application/json",
      body: JSON.stringify({
        error: "User with that email already exists",
      }),
    });
  });

  await page.goto("/");
  await page.getByLabel("Name").fill(newUser.name);
  await page.getByLabel("Email").fill(newUser.email);
  await page.getByLabel("Account Type").selectOption(newUser.accountType);
  await page.getByRole("button", { name: "Add User" }).click();
  await expect(page.getByRole("status")).toHaveText(
    new RegExp("User with that email already exists"),
  );
  await expectUserFormToBeRetained(page, newUser);
});

test("displays error when server returns error", async ({ page }) => {
  const newUser = createUser();
  await page.route("**/api/users", async (route) => {
    const req = route.request();
    expect(req.method()).toBe("POST");
    expect(req.postDataJSON()).toEqual(newUser);

    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({
        error: "Unexpected server error",
      }),
    });
  });

  await page.goto("/");
  await page.getByLabel("Name").fill(newUser.name);
  await page.getByLabel("Email").fill(newUser.email);
  await page.getByLabel("Account Type").selectOption(newUser.accountType);
  await page.getByRole("button", { name: "Add User" }).click();
  await expect(page.getByRole("status")).toHaveText(
    new RegExp("Unexpected server error"),
  );
  await expectUserFormToBeRetained(page, newUser);
});

test("displays error when name has unsupported characters", async ({
  page,
}) => {
  const requestCnt = trackPostRequest(page, "/api/users");

  const newUser = createUser({ name: "abc 123" });
  await page.goto("/");
  await page.getByLabel("Name").fill(newUser.name);
  await page.getByLabel("Email").fill(newUser.email);
  await page.getByLabel("Account Type").selectOption(newUser.accountType);
  await page.getByRole("button", { name: "Add User" }).click();
  await expect(page.getByRole("status")).toHaveText(
    new RegExp("Enter a valid name"),
  );
  expect(requestCnt()).toBe(0);
  await expectUserFormToBeRetained(page, newUser);
});

/**
 * List of test assertions that have been de-priortized in interest of time
 *
 * test("displays error when name field length is too long", async ({ page }) => {});
 * test("displays error when name field length is too short", async ({ page }) => {});
 * test("displays error when email field length is too long", async ({ page }) => {});
 * tests with different unsupported email and name formats e.g.
 * >> @gmail.com
 * >> abc@@gmail.com
 * >> abc@gmail.com.
 * >> zz@@
 */
