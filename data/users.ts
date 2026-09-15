export type UserInput = {
  name: string;
  email: string;
  accountType: string;
};

export function createUser(overrides: Partial<UserInput> = {}): UserInput {
  return {
    name: "Jane Doe",
    email: "janed@gmail.com",
    accountType: "basic",
    ...overrides,
  };
}
