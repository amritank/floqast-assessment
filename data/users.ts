import { randomUUID } from "node:crypto";

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
