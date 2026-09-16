# API test inventory

The current direct API suite is [`tests/api-tests/users.spec.ts`](../tests/api-tests/users.spec.ts). It uses Playwright's `request` fixture to call the User endpoints without a browser UI.

| Test | Description |
|---|---|
| `creates a new user and retrieves the user` | Creates a valid user, verifies the `201` response fields and generated numeric ID, then retrieves that user and verifies the returned record. |
| `rejects a user request missing name` | Omits the `name` property and verifies the API returns `400` with the required-fields error. |
| `rejects a user request missing email` | Omits the `email` property and verifies the API returns `400` with the required-fields error. |
| `rejects a user request missing account type` | Omits the `accountType` property and verifies the API returns `400` with the required-fields error. |
| `rejects a user request where name field is empty string` | Sends a whitespace-only name and verifies the API returns `400` with the required-fields error. |
| `rejects a user request with duplicate email` | Creates a user, submits the same payload again, and verifies the retry returns `409`. |
| `rejects a user request with invalid account type` | Sends an unsupported account type and verifies the API returns `400`. |
| `rejects a user request with unsupported name format` | Sends a name containing unsupported characters and verifies the API returns `400`. |
| `rejects a user request with unsupported email format` | Sends a malformed email address and verifies the API returns `400`. |
| `returns not found for an unknown user` | Requests an unknown numeric user ID and verifies the API returns `404`. |

Current routes under test:

```text
POST /api/users
GET  /api/users/:id
```

Authentication/authorization and transaction endpoints are not implemented in the current API suite.
