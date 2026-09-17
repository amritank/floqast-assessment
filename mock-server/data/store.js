import seedUsers from "./seed.json" with { type: "json" };

export const usersById = new Map();
export const userIdByEmail = new Map();
export const transactionsByUserId = new Map();

let nextUserId = 4;

export function getNextUserId() {
  const id = String(nextUserId);
  nextUserId += 1;
  return id;
}

export function resetStore() {
  usersById.clear();
  userIdByEmail.clear();
  transactionsByUserId.clear();

  for (const seedUser of seedUsers) {
    const user = { ...seedUser };
    usersById.set(user.id, user);
    const email = user.email.trim().toLowerCase();
    userIdByEmail.set(email, user.id);
    transactionsByUserId.set(user.id, []);
  }
  nextUserId = 4;
}
resetStore();
