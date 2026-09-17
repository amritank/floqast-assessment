# UI test inventory

The current UI suite is [`tests/ui-tests/create-user.spec.ts`](../tests/ui-tests/create-user.spec.ts). It tests the User Registration form through browser interactions.

| Test | Description |
|---|---|
| `creates a new user and clears the form` | Fills valid values, mocks a `201` creation response, verifies the success message, and confirms the form resets to its defaults. |
| `rejects submission when required fields are empty` | Submits an empty form, verifies the required-fields message, and verifies that the browser did not send a POST request. |
| `rejects submission when email is an invalid format` | Submits an invalid email, verifies the validation message, preserves the entered values, and verifies that no POST request was sent. |
| `displays error when creating duplicate user` | Mocks a `409` duplicate-email API response and verifies the error is displayed without clearing the form. |
| `displays error when server returns error` | Mocks a `500` API response and verifies the server error is displayed without clearing the form. |
| `displays error when name has unsupported characters` | Submits an unsupported name format, verifies the validation message, preserves the entered values, and verifies that no POST request was sent. |

The suite uses accessible locators (`getByLabel`, `getByRole`) and `page.route()` only for targeted UI-response behavior. It does not currently include transaction or authentication screens.
