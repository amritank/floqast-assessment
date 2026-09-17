async function handleResponse(res) {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Request failed!");
  }
  return data;
}

export async function addUsers(name, email, accountType) {
  const res = await fetch("/api/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, email, accountType }),
  });

  return handleResponse(res);
}

export async function createTransactions(
  amount,
  transactionType,
  recipientId,
  accessToken,
) {
  const res = await fetch("/api/transactions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ amount, transactionType, recipientId }),
  });

  return handleResponse(res);
}
