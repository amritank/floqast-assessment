import { randomUUID } from "node:crypto";
import type { UserResponse } from "../tests/assertions/users";

export type UserInput = {
  name: string;
  email: string;
  accountType: string;
};

export function createUser(overrides: Partial<UserInput> = {}): UserInput {
  const uniqueid = randomUUID();

  return {
    name: "Jane Doe",
    email: `sample-${uniqueid}@gmail.com`,
    accountType: "basic",
    ...overrides,
  };
}

export function aliceUser(): UserResponse {
  return {
    id: "1",
    name: "Alice K",
    email: "alice@example.test",
    accountType: "premium",
  };
}
