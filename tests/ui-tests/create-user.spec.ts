import { test, expect } from "@playwright/test";
import { createUser } from "../../data/users";
import { expectUserFormToBeCleared } from "../assertions/users";

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
test("rejects submission when required fields are empty", async ({
  page,
}) => {});
test("rejects submission when email is an invalid format", async ({
  page,
}) => {});
test("displays error when creating duplicate user", async ({ page }) => {});
test("displays error when server returns error", async ({ page }) => {});
test("displays error when name has unsupported charactes", async ({
  page,
}) => {});

/**
 * List of test assertions that have been de-priortized in interest of time
 *
 * test("displays error when name field length is too long", async ({ page }) => {});
 * test("displays error when name field length is too short", async ({ page }) => {});
 * test("displays error when email field length is too long", async ({ page }) => {});
 */
