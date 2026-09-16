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
